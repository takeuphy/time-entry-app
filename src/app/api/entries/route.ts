import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/entries?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "date パラメーターが必要です。" },
      { status: 400 }
    );
  }

  const entries = await prisma.timeEntry.findMany({
    where: { date },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(entries);
}

// POST /api/entries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, matterName, date, startTime, endTime, description } =
      body;

    if (
      !clientName ||
      !matterName ||
      !date ||
      !startTime ||
      !endTime ||
      !description
    ) {
      return NextResponse.json(
        { error: "すべての項目を入力してください。" },
        { status: 400 }
      );
    }

    const entry = await prisma.timeEntry.create({
      data: {
        clientName,
        matterName,
        date,
        startTime,
        endTime,
        description,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "登録に失敗しました。" },
      { status: 500 }
    );
  }
}

// DELETE /api/entries?id=N
export async function DELETE(request: NextRequest) {
  const idStr = request.nextUrl.searchParams.get("id");

  if (!idStr) {
    return NextResponse.json(
      { error: "id パラメーターが必要です。" },
      { status: 400 }
    );
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "無効なIDです。" },
      { status: 400 }
    );
  }

  try {
    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "削除に失敗しました。" },
      { status: 404 }
    );
  }
}
