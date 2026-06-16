import { query } from "@/lib/db";
import { apiCardToCard } from "@/lib/adapters";
import type { ApiCard, Card } from "@/types";

export async function getCardBySlug(slug: string): Promise<Card | null> {
  try {
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
        c.game_id,
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
      WHERE c.slug = $1
      LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) return null;

    return apiCardToCard(result.rows[0] as ApiCard);
  } catch (err) {
    console.error("[getCardBySlug] error:", err);
    return null;
  }
}
