import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/case-codes — list all case codes
export async function GET() {
  const caseCodes = await prisma.caseCode.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(caseCodes);
}

// POST /api/case-codes — create a new case code
export async function POST(request: NextRequest) {
  try {
    const { code, clientCode, clientName, matterName } = await request.json();
    if (!code || !clientName || !matterName) {
      return NextResponse.json(
        { error: "コード、クライアント名、案件名はすべて必須です。" },
        { status: 400 }
      );
    }

    const derivedClientCode = clientCode || code.substring(0, 5);

    const existing = await prisma.caseCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: `ケースコード「${code}」は既に登録されています。` },
        { status: 409 }
      );
    }

    const caseCode = await prisma.caseCode.create({
      data: { code, clientCode: derivedClientCode, clientName, matterName },
    });
    return NextResponse.json(caseCode, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "登録に失敗しました。" },
      { status: 500 }
    );
  }
}

// DELETE /api/case-codes?id=N — delete a case code
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await prisma.caseCode.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "削除に失敗しました。" },
      { status: 500 }
    );
  }
}
