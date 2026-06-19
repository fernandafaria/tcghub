import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ValuationRequest {
  slugs: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { slugs } = (await req.json()) as ValuationRequest;

    if (!slugs || slugs.length === 0) {
      return NextResponse.json({
        totalValue: 0,
        cardCount: 0,
        sets: [],
      });
    }

    // Get prices for all requested slugs
    const result = await query(
      `SELECT
        c.slug AS card_slug,
        c.name AS card_name,
        c.set_code,
        c.rarity,
        c.color,
        c.image_url,
        p.price_brl_mid,
        p.price_brl_low,
        p.price_brl_high
      FROM cards c
      LEFT JOIN LATERAL (
        SELECT *
        FROM card_prices
        WHERE card_prices.slug = c.slug
        ORDER BY card_prices.price_date DESC
        LIMIT 1
      ) p ON true
      WHERE c.slug = ANY($1)`,
      [slugs]
    );

    const rows = result.rows;
    const totalValue = rows.reduce((sum: number, r: any) => {
      return sum + (r.price_brl_mid || r.price_brl_low || 0);
    }, 0);

    // Group by set_code
    const setMap = new Map<string, { setCode: string; count: number; value: number }>();
    for (const row of rows) {
      const code = row.set_code || "unknown";
      const existing = setMap.get(code) || { setCode: code, count: 0, value: 0 };
      existing.count++;
      existing.value += row.price_brl_mid || row.price_brl_low || 0;
      setMap.set(code, existing);
    }

    return NextResponse.json({
      totalValue: Math.round(totalValue * 100) / 100,
      cardCount: rows.length,
      matchedSlugs: rows.map((r: any) => r.card_slug),
      sets: Array.from(setMap.values()).sort((a, b) => b.value - a.value),
    });
  } catch (err: any) {
    console.error("/api/collection/value error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
