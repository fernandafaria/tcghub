import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

function parseMassEntry(text: string): Array<{qty: number, name: string, set: string, condition: string}> {
  const results: Array<{qty: number, name: string, set: string, condition: string}> = [];
  const lines = text.split("\n").filter(l => l.trim());
  
  for (const line of lines) {
    // Format: "4 Lightning Bolt (LEA-056) - NM" or "2 Charizard (base1-4)"
    const match = line.match(/^(\d+)\s+(.+?)\s*\(([^)]+)\)\s*(?:-\s*(\w+))?/);
    if (match) {
      results.push({
        qty: parseInt(match[1]),
        name: match[2].trim(),
        set: match[3].trim(),
        condition: match[4]?.trim() || "NM",
      });
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, format } = body;
    
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const entries = parseMassEntry(text);
    
    // Match against catalog
    const results = [];
    for (const entry of entries) {
      // Fuzzy match by name + set
      const { rows } = await query(
        `SELECT slug, name, set_code, rarity, game_id FROM cards 
         WHERE name ILIKE $1 AND set_code ILIKE $2 
         LIMIT 1`,
        [`%${entry.name}%`, `%${entry.set}%`]
      );
      
      if (rows.length > 0) {
        const card = rows[0];
        // Get price
        const { rows: priceRows } = await query(
          `SELECT mid_price FROM card_prices 
           WHERE card_slug = $1 AND game_id = $2 
           ORDER BY updated_at DESC LIMIT 1`,
          [card.slug, card.game_id]
        );
        const price = priceRows[0]?.mid_price || 0;
        
        results.push({
          ...entry,
          matched: true,
          slug: card.slug,
          game: card.game_id,
          rarity: card.rarity,
          price,
          total: price * entry.qty,
        });
      } else {
        results.push({ ...entry, matched: false });
      }
    }

    const totalValue = results.filter(r => r.matched).reduce((sum, r) => sum + (r as any).total, 0);
    const matchedCount = results.filter(r => r.matched).length;

    return NextResponse.json({
      entries: results,
      summary: {
        total_cards: entries.reduce((s, e) => s + e.qty, 0),
        total_entries: entries.length,
        matched: matchedCount,
        estimated_value: totalValue,
      },
      detected_format: format || "text",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
