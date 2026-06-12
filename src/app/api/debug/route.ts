import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const gameCounts = await query(
      `SELECT game_id, COUNT(*)::int as count, MIN(price_date) as oldest, MAX(price_date) as newest
       FROM card_prices GROUP BY game_id ORDER BY count DESC`
    );
    
    const sampleCards = await query(
      `SELECT slug, game_id, price_date, price_brl_mid, price_usd
       FROM card_prices ORDER BY price_date DESC LIMIT 10`
    );

    return NextResponse.json({
      game_counts: gameCounts.rows,
      sample: sampleCards.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
