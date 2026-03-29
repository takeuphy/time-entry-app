import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutoReport } from "@/lib/email";

// POST /api/auto-send
// Called by cron. Checks timezone setting and only sends if current hour
// in the configured timezone is 6 (to avoid duplicate sends from multiple cron entries).
export async function POST() {
  try {
    // Read settings
    const [emailSetting, tzSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "auto_send_email" } }),
      prisma.setting.findUnique({ where: { key: "auto_send_timezone" } }),
    ]);

    if (!emailSetting?.value) {
      return NextResponse.json({
        ok: false,
        message: "自動送信先メールアドレスが設定されていません。",
      });
    }

    const timezone = tzSetting?.value || "America/Los_Angeles";

    // Check if current hour in the configured timezone is 6
    const currentHour = getCurrentHourInTimezone(timezone);
    if (currentHour < 5 || currentHour > 7) {
      return NextResponse.json({
        ok: true,
        message: `現在 ${timezone} で ${currentHour}時のため、送信をスキップしました。`,
      });
    }

    // Query entries created in the last 24 hours
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    const entries = await prisma.timeEntry.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    if (entries.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "送信対象のエントリーがありません。",
      });
    }

    // Format the window for display in the configured timezone
    const fmt = (d: Date) =>
      d.toLocaleString("ja-JP", {
        timeZone: timezone,
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    const windowLabel = `${fmt(start)} 〜 ${fmt(end)}`;

    await sendAutoReport(entries, windowLabel, emailSetting.value);

    return NextResponse.json({
      ok: true,
      message: `${entries.length}件のエントリーを ${emailSetting.value} に送信しました。`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "自動送信に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getCurrentHourInTimezone(timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(new Date()), 10);
}
