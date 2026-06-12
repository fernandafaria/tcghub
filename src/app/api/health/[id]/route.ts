import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slug = req.nextUrl.searchParams.get("slug") || id;

  try {
    const { rows } = await query(
      `SELECT 
        c.slug, c.name, c.rarity, c.game_id,
        cp.mid_price as current_price,
        cp.low_price, cp.high_price,
        cp.price_change_24h, cp.price_change_7d, cp.price_change_30d,
        cp.volume_24h, cp.volume_7d
      FROM cards c
      LEFT JOIN card_prices cp ON c.slug = cp.card_slug AND c.game_id = cp.game_id
      WHERE c.slug = $1
      ORDER BY cp.updated_at DESC
      LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const card = rows[0];
    const price = card.current_price || 0;
    const change7d = card.price_change_7d || 0;
    const change30d = card.price_change_30d || 0;
    const volume = card.volume_7d || 0;

    // Stability (35%): lower volatility = higher score
    const stability = price > 0 ? Math.max(0, Math.min(100, 100 - Math.abs(change30d) * 2)) : 50;

    // Momentum (30%): positive trend = higher score
    const momentum = price > 0 ? Math.max(0, Math.min(100, 50 + change7d * 5)) : 50;

    // Liquidity (20%): more volume = higher score
    const liquidity = volume > 100 ? 100 : volume > 50 ? 75 : volume > 10 ? 50 : 25;

    // Meta Relevance (15%): based on rarity
    const rarity = (card.rarity || "").toLowerCase();
    const metaScore = rarity.includes("rare") ? 80 : rarity.includes("uncommon") ? 50 : 30;

    const healthScore = Math.round(
      stability * 0.35 + momentum * 0.30 + liquidity * 0.20 + metaScore * 0.15
    );

    const grade = healthScore >= 90 ? "A" : healthScore >= 75 ? "B" : healthScore >= 60 ? "C" : healthScore >= 40 ? "D" : "F";

    return NextResponse.json({
      card: { slug: card.slug, name: card.name, rarity: card.rarity, game: card.game_id },
      price: { current: price, low: card.low_price, high: card.high_price },
      health_score: healthScore,
      grade,
      dimensions: {
        stability: { score: Math.round(stability), weight: 0.35 },
        momentum: { score: Math.round(momentum), weight: 0.30 },
        liquidity: { score: Math.round(liquidity), weight: 0.20 },
        meta_relevance: { score: Math.round(metaScore), weight: 0.15 },
      },
      recommendation: healthScore >= 90 ? "STRONG BUY" : healthScore >= 75 ? "BUY" : healthScore >= 60 ? "HOLD" : healthScore >= 40 ? "SELL" : "STRONG SELL",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
