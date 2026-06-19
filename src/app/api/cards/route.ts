import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "pokemon";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  try {
    const searchClause = search
      ? `AND (c.name ILIKE $4 OR c.set_code ILIKE $4 OR c.collector_number ILIKE $4)`
      : "";
    const searchParam = search ? `%${search}%` : "";

    const result = await query(
      `SELECT
        c.slug AS card_slug,
        c.name AS card_name,
        c.version AS card_version,
        c.set_code AS set_code,
        c.collector_number AS collector_number,
        c.rarity,
        c.color,
        c.image_url,
        c.body_text,
        c.classifications,
        p.price_usd,
        p.price_usd_foil,
        p.price_brl_low,
        p.price_brl_mid,
        p.price_brl_high,
        p.price_brl_foil_low,
        p.price_brl_foil_mid,
        p.price_brl_foil_high,
        p.price_brl_source
      FROM cards c
      LEFT JOIN LATERAL (
        SELECT *
        FROM card_prices
        WHERE card_prices.slug = c.slug
        ORDER BY card_prices.price_date DESC
        LIMIT 1
      ) p ON true
      WHERE c.game_id = $1 ${searchClause}
      ORDER BY (p.price_brl_mid IS NOT NULL) DESC, p.price_brl_mid DESC NULLS LAST
      LIMIT $2 OFFSET $3`,
      search ? [game, limit, offset, searchParam] : [game, limit, offset]
    );

    const countResult = await query(
      search
        ? `SELECT COUNT(*)::int FROM cards WHERE game_id = $1 AND (name ILIKE $2 OR set_code ILIKE $2 OR collector_number ILIKE $2)`
        : `SELECT COUNT(*)::int FROM cards WHERE game_id = $1`,
      search ? [game, searchParam] : [game]
    );

    return NextResponse.json({
      cards: result.rows,
      total: countResult.rows[0]?.count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error("/api/cards error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
