import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutoReport } from "@/lib/email";

// POST /api/auto-send
// Called by cron (or manually for testing with ?force=true).
// Sends entries created in the last 24 hours.
export async function POST(request: NextRequest) {
  try {
    const force = request.nextUrl.searchParams.get("force") === "true";

    // Read settings
    const [emailSetting, tzSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "auto_send_email" } }),
      prisma.setting.findUnique({ where: { key: "auto_send_timezone" } }),
    ]);

    if (!emailSetting?.value) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "自動送信先メールアドレスが設定されていません。アプリで設定してください。",
        },
        { status: 400 }
      );
    }

    const timezone = tzSetting?.value || "America/Los_Angeles";

    // Check if current hour in the configured timezone is ~6AM
    // Skip this check when force=true (for manual testing)
    if (!force) {
      const currentHour = getCurrentHourInTimezone(timezone);
      if (currentHour < 5 || currentHour > 7) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          message: `現在 ${timezone} で ${currentHour}時のため、送信をスキップしました。`,
        });
      }
    }

    // Query entries created in the last 24 hours
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    const [rawEntries, caseCodes] = await Promise.all([
      prisma.timeEntry.findMany({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
      prisma.caseCode.findMany(),
    ]);

    const codeMap = new Map(
      caseCodes.map((cc) => [`${cc.clientName}\t${cc.matterName}`, cc.code])
    );
    const entries = rawEntries.map((e) => ({
      ...e,
      caseCode: codeMap.get(`${e.clientName}\t${e.matterName}`) || "",
    }));

    if (entries.length === 0) {
      return NextResponse.json({
        ok: true,
        message:
          "過去24時間に入力されたエントリーがないため、送信するものがありません。",
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
