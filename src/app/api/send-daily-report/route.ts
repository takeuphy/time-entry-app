import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDailyReport } from "@/lib/email";

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// POST /api/send-daily-report
// Optional query: ?date=YYYY-MM-DD (defaults to yesterday)
export async function POST(request: NextRequest) {
  try {
    const date =
      request.nextUrl.searchParams.get("date") || yesterdayString();
    const email = request.nextUrl.searchParams.get("email") || undefined;

    const [rawEntries, caseCodes] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { date },
        orderBy: { startTime: "asc" },
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

    await sendDailyReport(entries, date, email);

    return NextResponse.json({
      ok: true,
      message: `${date} のレポートを送信しました。(${entries.length}件)`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "メール送信に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
