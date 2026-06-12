import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";

interface TcgdexCard {
  id: string;
  name: string;
  set: { id: string; name: string };
  number?: string;
  localId?: string;
  cardNumber?: string;
  category?: string;
  data?: any;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TCGDex ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  const { limit = 50, offset = 0 } = await req.json().catch(() => ({}));
  const game = "pokemon";
  const today = new Date().toISOString().slice(0, 10);
  const brlRate = 5.80;
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get cards from TCGDex with pricing
    const cards: TcgdexCard[] = await fetchJson(
      `${TCGDEX_BASE}/cards?category=Pokemon&pricing=yes`
    );

    // Process in chunks
    const batch = cards.slice(offset, offset + limit);

    for (const card of batch) {
      try {
        const cardNumber = card.localId || card.number || card.cardNumber || "";
        const tcgplayer = card.data?.pricing?.tcgplayer;
        const cardmarket = card.data?.pricing?.cardmarket;

        const usdPrice = tcgplayer?.holofoil?.marketPrice
          || tcgplayer?.normal?.marketPrice
          || cardmarket?.avgPrice
          || 0;

        if (!usdPrice || usdPrice <= 0) { skipped++; continue; }

        const marketBrl = (usdPrice * brlRate).toFixed(2);
        const lowBrl = (usdPrice * 0.85 * brlRate).toFixed(2);
        const highBrl = (usdPrice * 1.15 * brlRate).toFixed(2);

        // Find matching card in our DB
        const dbCard = await query(
          `SELECT slug, name, set_code, collector_number
           FROM cards
           WHERE game_id = $1
             AND collector_number = $2
             AND name ILIKE $3
           LIMIT 1`,
          [game, cardNumber, card.name + "%"]
        );

        if (dbCard.rows.length === 0) { skipped++; continue; }

        const match = dbCard.rows[0];

        // Get existing price to decide if we should upsert
        const existing = await query(
          `SELECT id FROM card_prices
           WHERE slug = $1 AND game_id = $2 AND price_date = $3 AND variant = $4`,
          [match.slug, game, today, "normal"]
        );

        if (existing.rows.length > 0) {
          await query(
            `UPDATE card_prices SET
              price_usd = $1,
              price_brl_low = $2,
              price_brl_mid = $3,
              price_brl_high = $4,
              price_brl_source = $5,
              fetched_at = NOW()
            WHERE slug = $6 AND game_id = $7 AND price_date = $8 AND variant = $9`,
            [usdPrice.toFixed(2), lowBrl, marketBrl, highBrl, "tcgdex", match.slug, game, today, "normal"]
          );
        } else {
          await query(
            `INSERT INTO card_prices
              (slug, game_id, name, set_code, collector_number,
               price_usd, price_brl_low, price_brl_mid, price_brl_high,
               price_brl_source, price_date, variant, fetched_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
            [match.slug, game, match.name, match.set_code, match.collector_number,
             usdPrice.toFixed(2), lowBrl, marketBrl, highBrl,
             "tcgdex", today, "normal"]
          );
        }

        synced++;
      } catch (e: any) {
        errors++;
        console.error(`TCGDex sync error for ${card.name}:`, e.message);
      }
    }

    return NextResponse.json({
      ok: true,
      synced,
      skipped,
      errors,
      batch: batch.length,
      message: `TCGDex sync: ${synced} prices (${game}). ${skipped} skipped, ${errors} errors.`,
    });
  } catch (err: any) {
    console.error("sync-tcgdex error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
