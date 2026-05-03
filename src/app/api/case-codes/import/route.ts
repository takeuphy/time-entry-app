import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CsvRow {
  clientCode: string;
  clientName: string;
  matterCode: string;
  matterName: string;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length >= 4) {
      rows.push({
        clientCode: fields[0].trim(),
        clientName: fields[1].trim(),
        matterCode: fields[2].trim(),
        matterName: fields[3].trim(),
      });
    }
  }
  return rows;
}

// POST /api/case-codes/import
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let csvText: string;
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "ファイルが選択されていません。" },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      csvText = await request.text();
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "有効なデータが見つかりませんでした。" },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      if (!row.matterCode || !row.clientName || !row.matterName) continue;

      const existing = await prisma.caseCode.findUnique({
        where: { code: row.matterCode },
      });

      if (existing) {
        await prisma.caseCode.update({
          where: { code: row.matterCode },
          data: {
            clientCode: row.clientCode,
            clientName: row.clientName,
            matterName: row.matterName,
          },
        });
        updated++;
      } else {
        await prisma.caseCode.create({
          data: {
            code: row.matterCode,
            clientCode: row.clientCode,
            clientName: row.clientName,
            matterName: row.matterName,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${created}件を新規登録、${updated}件を更新しました。（合計${rows.length}件処理）`,
      created,
      updated,
      total: rows.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "インポートに失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
