import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/case-codes/search?q=検索テキスト
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json([]);
  }

  const allCodes = await prisma.caseCode.findMany();

  const scored = allCodes
    .map((cc) => {
      const clientNameScore = fuzzyScore(query, cc.clientName);
      const matterNameScore = fuzzyScore(query, cc.matterName);
      const combinedScore = fuzzyScore(query, cc.clientName + cc.matterName);
      const codeScore = fuzzyScore(query, cc.code);
      const clientCodeScore = fuzzyScore(query, cc.clientCode);
      const score = Math.max(
        clientNameScore,
        matterNameScore,
        combinedScore,
        codeScore,
        clientCodeScore
      );
      return { ...cc, score };
    })
    .filter((cc) => cc.score > 40)
    .sort((a, b) => {
      const aSuffix = a.code.substring(5);
      const bSuffix = b.code.substring(5);
      return bSuffix.localeCompare(aSuffix);
    })
    .slice(0, 10);

  return NextResponse.json(scored);
}

/**
 * Fuzzy match score between query and target (0-100).
 * Handles Japanese: katakana→hiragana normalization, full-width numbers,
 * partial match, and character overlap scoring.
 */
function fuzzyScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);

  if (!q || !t) return 0;

  // Exact match
  if (q === t) return 100;

  // Target contains query
  if (t.includes(q)) return 85;

  // Query contains target
  if (q.includes(t)) return 75;

  // Token matching: split query into tokens and check each
  const qTokens = splitTokens(q);
  if (qTokens.length > 1) {
    let matchedTokens = 0;
    for (const token of qTokens) {
      if (t.includes(token)) matchedTokens++;
    }
    if (matchedTokens === qTokens.length) return 80;
    if (matchedTokens > 0) return 30 + (matchedTokens / qTokens.length) * 40;
  }

  // Bigram overlap (pairs of consecutive characters)
  const qBigrams = toBigrams(q);
  const tBigrams = toBigrams(t);
  if (qBigrams.size > 0 && tBigrams.size > 0) {
    let overlap = 0;
    for (const bg of qBigrams) {
      if (tBigrams.has(bg)) overlap++;
    }
    const similarity = (2 * overlap) / (qBigrams.size + tBigrams.size);
    return similarity * 70;
  }

  return 0;
}

/**
 * Normalize Japanese text for comparison:
 * - Full-width numbers/letters → half-width
 * - Katakana → Hiragana
 * - Lowercase
 * - Remove spaces and common punctuation
 */
function normalize(input: string): string {
  return input
    .replace(/[０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .replace(/[Ａ-Ｚａ-ｚ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .replace(/[\u30A1-\u30F6]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    )
    .replace(/[\u30F7-\u30FA]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    )
    .replace(/ー/g, "")
    .replace(/\s+/g, "")
    .replace(/[・、。,.()（）「」]/g, "")
    .toLowerCase();
}

function splitTokens(text: string): string[] {
  // Split on natural boundaries: spaces (already removed), but also
  // try splitting CJK vs ASCII, or return individual meaningful chunks
  const tokens: string[] = [];
  let current = "";
  let prevType = "";

  for (const ch of text) {
    const type = ch.match(/[a-z0-9]/) ? "ascii" : "cjk";
    if (prevType && type !== prevType) {
      if (current.length > 0) tokens.push(current);
      current = "";
    }
    current += ch;
    prevType = type;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function toBigrams(text: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < text.length - 1; i++) {
    bigrams.add(text.substring(i, i + 2));
  }
  return bigrams;
}
