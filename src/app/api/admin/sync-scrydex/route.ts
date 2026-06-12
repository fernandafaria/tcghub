import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Scrydex config
const SCRYDEX_KEY = process.env.SCRYDEX_API_KEY || "";
const SCRYDEX_TEAM = process.env.SCRYDEX_TEAM_ID || "tcghub1";

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ScrydexCard {
  id: string;
  name: string;
  slug: string;
  expansion?: { id: string; name: string; code: string };
  images?: Array<{ type: string; small: string; medium: string; large: string }>;
  variants?: Array<{
    name: string;
    prices?: Array<{
      condition?: string;
      grade?: string;
      company?: string;
      type?: string; // "raw" or "graded"
      low?: number;
      mid?: number;
      market?: number;
      high?: number;
      currency?: string;
      trends?: Record<string, { price_change?: number; percent_change?: number }>;
    }>;
    pop_reports?: Array<{
      company: string;
      total: number;
      grades?: Array<{ grade: string; count: number }>;
    }>;
  }>;
}

const BATCH_SIZE = 50;
const GAMES = ["pokemon", "magicthegathering", "lorcana"];

async function syncGame(game: string, offset: number, limit: number) {
  const url = `https://api.scrydex.com/${game}/v1/cards?limit=${limit}&offset=${offset}&include=prices,pop_reports`;
  
  const res = await fetch(url, {
    headers: {
      "X-Api-Key": SCRYDEX_KEY,
      "X-Team-ID": SCRYDEX_TEAM,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scrydex error ${res.status}: ${text.substring(0, 200)}`);
  }
  
  const json = await res.json();
  const cards: ScrydexCard[] = json.data || [];
  
  let pricesCount = 0;
  let imagesCount = 0;
  let popReportsCount = 0;
  
  for (const card of cards) {
    const cardSlug = card.slug;
    
    // Upsert card if not exists (lightweight metadata)
    await supabase.from("cards").upsert({
      id: card.id,
      slug: cardSlug,
      name: card.name,
      game_id: game,
      scrydex_id: card.id,
    }, { onConflict: "slug,game_id" });
    
    // Insert images
    if (card.images) {
      const imageRows = card.images.map(img => ({
        card_slug: cardSlug,
        game_id: game,
        type: img.type,
        small_url: img.small,
        medium_url: img.medium,
        large_url: img.large,
        source: "scrydex",
        updated_at: new Date().toISOString(),
      }));
      
      if (imageRows.length > 0) {
        const { error } = await supabase.from("card_images").upsert(
          imageRows,
          { onConflict: "card_slug,game_id,type" }
        );
        if (!error) imagesCount += imageRows.length;
      }
    }
    
    // Insert prices from all variants
    if (card.variants) {
      for (const variant of card.variants) {
        // Pop reports
        if (variant.pop_reports) {
          for (const pr of variant.pop_reports) {
            const gradeRows = (pr.grades || []).map(g => ({
              card_slug: cardSlug,
              game_id: game,
              variant: variant.name,
              company: pr.company,
              total: pr.total,
              grade: g.grade,
              count: g.count,
              source: "scrydex",
              updated_at: new Date().toISOString(),
            }));
            
            if (gradeRows.length > 0) {
              const { error } = await supabase.from("card_pop_reports").upsert(
                gradeRows,
                { onConflict: "card_slug,game_id,variant,company,grade" }
              );
              if (!error) popReportsCount += gradeRows.length;
            }
          }
        }
        
        // Prices
        if (variant.prices) {
          const priceRows = variant.prices.map(p => ({
            card_slug: cardSlug,
            game_id: game,
            variant: variant.name,
            condition: p.condition || null,
            grade: p.grade || null,
            company: p.company || null,
            type: p.type || "raw",
            low_price: p.low ? Math.round(p.low * 100) : null,
            mid_price: p.market ? Math.round(p.market * 100) : null,
            high_price: p.high ? Math.round(p.high * 100) : null,
            currency: p.currency || "USD",
            trend_1d_pct: p.trends?.days_1?.percent_change || null,
            trend_7d_pct: p.trends?.days_7?.percent_change || null,
            trend_30d_pct: p.trends?.days_30?.percent_change || null,
            trend_90d_pct: p.trends?.days_90?.percent_change || null,
            trend_180d_pct: p.trends?.days_180?.percent_change || null,
            source: "scrydex",
            updated_at: new Date().toISOString(),
          }));
          
          if (priceRows.length > 0) {
            const { error } = await supabase.from("card_prices").upsert(
              priceRows,
              { onConflict: "card_slug,game_id,variant,condition,type,grade,company" }
            );
            if (!error) pricesCount += priceRows.length;
          }
        }
      }
    }
  }
  
  return { cards: cards.length, prices: pricesCount, images: imagesCount, popReports: popReportsCount };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const game = body.game || "pokemon";
    const offset = body.offset || 0;
    const limit = Math.min(body.limit || BATCH_SIZE, 100);
    
    const result = await syncGame(game, offset, limit);
    
    return NextResponse.json({
      success: true,
      game,
      offset,
      limit,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
    }, { status: 500 });
  }
}

// GET for usage check
export async function GET(req: NextRequest) {
  try {
    const res = await fetch("https://api.scrydex.com/account/v1/usage", {
      headers: {
        "X-Api-Key": SCRYDEX_KEY,
        "X-Team-ID": SCRYDEX_TEAM,
      },
    });
    const usage = await res.json();
    
    return NextResponse.json({
      success: true,
      scrydex: { status: res.status, usage },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
    }, { status: 500 });
  }
}
