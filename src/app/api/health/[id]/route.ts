import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;

  try {
    // Get current price + some historical context
    const result = await query(
      `SELECT
        c.name AS card_name,
        c.rarity,
        c.set_code,
        p.price_brl_mid,
        p.price_brl_low,
        p.price_brl_high,
        p.price_usd,
        p.price_date
      FROM cards c
      LEFT JOIN LATERAL (
        SELECT *
        FROM card_prices
        WHERE card_prices.slug = c.slug
        ORDER BY card_prices.price_date DESC
        LIMIT 1
      ) p ON true
      WHERE c.slug = $1
      LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0 || !result.rows[0].price_brl_mid) {
      return NextResponse.json({
        score: null,
        grade: "?",
        recommendation: "hold",
        factors: {
          stability: 50,
          momentum: 50,
          liquidity: 50,
          meta: 50,
        },
        summary: "Dados insuficientes para calcular o Health Score desta carta.",
      });
    }

    const row = result.rows[0];
    const price = row.price_brl_mid || 0;
    const rarity = (row.rarity || "").toLowerCase();

    // Simplified Health Score algorithm
    // Stability: based on rarity (rare cards tend to be more stable)
    const rarityScore: Record<string, number> = {
      "common": 35, "uncommon": 45, "rare": 60,
      "super rare": 70, "ultra rare": 75, "secret rare": 80,
      "promo": 55, "short print": 65,
    };
    const stability = rarityScore[rarity] || 50;

    // Momentum: derived from price level (proxy — real implementation would use price history)
    const momentum = price > 100 ? 65 : price > 30 ? 55 : 45;

    // Liquidity: higher price = generally more liquid (sought-after cards)
    const liquidity = price > 200 ? 70 : price > 50 ? 55 : 40;

    // Meta relevance: rarity + price combo
    const meta = rarity.includes("rare") && price > 50 ? 70 : 50;

    // Weighted score (0-100)
    const score = Math.round(
      stability * 0.3 + momentum * 0.25 + liquidity * 0.25 + meta * 0.2
    );

    // Grade
    let grade: string;
    if (score >= 78) grade = "A";
    else if (score >= 65) grade = "B";
    else if (score >= 50) grade = "C";
    else if (score >= 35) grade = "D";
    else grade = "F";

    // Recommendation
    let recommendation: string;
    if (score >= 70) recommendation = "buy";
    else if (score >= 45) recommendation = "hold";
    else recommendation = "sell";

    return NextResponse.json({
      score,
      grade,
      recommendation,
      factors: { stability, momentum, liquidity, meta },
      summary: `Health Score ${score}/100 (${grade}). ${recommendation === "buy" ? "Tendência de valorização" : recommendation === "hold" ? "Estável — acompanhar" : "Considere vender"}. ${row.card_name} (${rarity}) de ${row.set_code}.`,
    });
  } catch (err: any) {
    console.error("/api/health/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
