import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get("game") || "pokemon";
  
  try {
    const { rows: gainers } = await query(
      `SELECT c.slug, c.name, c.rarity, c.game_id, c.image_url,
        cp.mid_price as current_price, cp.price_change_24h, cp.price_change_7d
      FROM cards c
      JOIN card_prices cp ON c.slug = cp.card_slug AND c.game_id = cp.game_id
      WHERE c.game_id = $1 AND cp.price_change_7d > 0
      ORDER BY cp.price_change_7d DESC
      LIMIT 10`,
      [game]
    );

    const { rows: losers } = await query(
      `SELECT c.slug, c.name, c.rarity, c.game_id, c.image_url,
        cp.mid_price as current_price, cp.price_change_24h, cp.price_change_7d
      FROM cards c
      JOIN card_prices cp ON c.slug = cp.card_slug AND c.game_id = cp.game_id
      WHERE c.game_id = $1 AND cp.price_change_7d < 0
      ORDER BY cp.price_change_7d ASC
      LIMIT 10`,
      [game]
    );

    return NextResponse.json({ rising: gainers, falling: losers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
