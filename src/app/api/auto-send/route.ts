import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAutoReport } from "@/lib/email";

// POST /api/auto-send
// Called by cron at 6AM JST. Sends entries created in the last 24 hours.
export async function POST() {
  try {
    // Read the auto-send email setting
    const setting = await prisma.setting.findUnique({
      where: { key: "auto_send_email" },
    });

    if (!setting?.value) {
      return NextResponse.json({
        ok: false,
        message: "自動送信先メールアドレスが設定されていません。",
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

    // Format the window for display (in JST)
    const fmt = (d: Date) => {
      const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return `${jst.getUTCMonth() + 1}/${jst.getUTCDate()} ${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
    };
    const windowLabel = `${fmt(start)} 〜 ${fmt(end)}`;

    await sendAutoReport(entries, windowLabel, setting.value);

    return NextResponse.json({
      ok: true,
      message: `${entries.length}件のエントリーを ${setting.value} に送信しました。`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "自動送信に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
