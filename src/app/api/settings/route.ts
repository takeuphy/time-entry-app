import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings?key=auto_send_email
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const setting = await prisma.setting.findUnique({ where: { key } });
  return NextResponse.json({ key, value: setting?.value ?? null });
}

// POST /api/settings  body: { key, value }
export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    if (!key || typeof value !== "string") {
      return NextResponse.json(
        { error: "key and value are required" },
        { status: 400 }
      );
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ ok: true, key, value });
  } catch {
    return NextResponse.json(
      { error: "設定の保存に失敗しました。" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings?key=auto_send_email
export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  try {
    await prisma.setting.delete({ where: { key } });
  } catch {
    // Key might not exist — that's fine
  }

  return NextResponse.json({ ok: true });
}
