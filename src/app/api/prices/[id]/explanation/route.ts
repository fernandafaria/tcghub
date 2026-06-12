import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slug = req.nextUrl.searchParams.get("slug") || id;

  try {
    const { rows } = await query(
      `SELECT c.name, c.rarity, c.game_id,
        cp.mid_price as current_price,
        cp.price_change_24h, cp.price_change_7d, cp.price_change_30d, cp.price_change_90d,
        cp.low_price as low_30d, cp.high_price as high_30d
      FROM cards c
      LEFT JOIN card_prices cp ON c.slug = cp.card_slug AND c.game_id = cp.game_id
      WHERE c.slug = $1
      ORDER BY cp.updated_at DESC LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const c = rows[0];
    const change7d = c.price_change_7d || 0;
    const change30d = c.price_change_30d || 0;
    const change90d = c.price_change_90d || 0;
    const price = c.current_price || 0;

    let explanation = "";
    let recommendation = "HOLD";
    
    if (change7d > 5) {
      explanation = `Strong upward trend of ${change7d.toFixed(1)}% in the last 7 days. `;
      explanation += change30d > 10 ? "Sustained momentum over 30 days suggests tournament-driven demand. " : "";
      explanation += "Possible causes: tournament win, meta shift, or supply shortage.";
      recommendation = "BUY";
    } else if (change7d > 1) {
      explanation = `Moderate increase of ${change7d.toFixed(1)}% this week. `;
      explanation += "Card is gaining traction. Monitor for tournament results.";
      recommendation = change30d > 0 ? "BUY" : "HOLD";
    } else if (change7d < -5) {
      explanation = `Sharp decline of ${change7d.toFixed(1)}% in 7 days. `;
      explanation += change90d < -15 ? "Long-term downtrend — possible reprint or rotation impact. " : "";
      explanation += "Check for reprint announcements, banlist changes, or rotation schedule.";
      recommendation = "SELL";
    } else if (change7d < -1) {
      explanation = `Slight decrease of ${change7d.toFixed(1)}% this week. Normal market fluctuation.`;
      recommendation = "HOLD";
    } else {
      explanation = "Price is stable with no significant movement in the last 7 days.";
      recommendation = "HOLD";
    }

    return NextResponse.json({
      card: { slug: c.game_id + '-' + slug, name: c.name, rarity: c.rarity },
      price: { current: price, change_7d: change7d, change_30d: change30d, change_90d: change90d },
      explanation,
      recommendation,
      events: [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
