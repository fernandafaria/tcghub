import type { ApiCard, Card, Mover } from "@/types";
import { CARD_COLORS, CARD_COLOR_FALLBACK } from "@/lib/colors";

/**
 * Map a single API card to the frontend Card format.
 * For fields not provided by the API, sensible defaults are used.
 */
/** Extract game from card_slug prefix (e.g. "pokemon-charizard-vmax") */
function gameFromSlug(slug: string): string {
  const GAME_ALIASES: Record<string, string> = {
    pokemon: "pokemon", mtg: "mtg", magic: "mtg", magicthegathering: "mtg",
    yugioh: "ygo", ygo: "ygo", onepiece: "op", lorcana: "lor",
    digimon: "digimon", dragonball: "db", fleshblood: "fab",
    unionarena: "ua", starwars: "sw", riftbound: "rb",
  };
  const prefix = slug.split("-")[0].toLowerCase();
  return GAME_ALIASES[prefix] || "lorcana";
}

export function apiCardToCard(api: ApiCard, gameId?: string): Card {
  const colorLower = (api.color || "").toLowerCase().trim();
  const energy = colorLower ? [colorLower] : ["colorless"];
  const gc = CARD_COLORS[colorLower] || CARD_COLOR_FALLBACK;

  const base =
    api.price_brl_mid ??
    api.price_brl_low ??
    api.price_brl_high ??
    api.price_usd ??
    0;

  const name = api.card_version
    ? `${api.card_name} - ${api.card_version}`
    : api.card_name;

  return {
    id: api.card_slug,
    tcg: gameId || api.game_id || gameFromSlug(api.card_slug),
    name,
    set: api.set_code,
    num: api.collector_number,
    rarity: api.rarity || "Common",
    kind: api.card_category || undefined,
    energy,
    gc,
    base,
    wk: 0,
    mo: 0,
    img: api.image_url || undefined,
    art: api.image_url || "",
    foil: false,
    meta: api.body_text || "",
    tags: [],
  };
}

/**
 * Map an array of API cards to frontend Cards.
 */
export function apiCardsToCards(apiCards: ApiCard[], gameId?: string): Card[] {
  return apiCards.map((c) => apiCardToCard(c, gameId));
}

/**
 * Generate a simplified mover from a card for market pulse display.
 */
export function cardToMover(card: Card, pct: number): Mover {
  return {
    name: card.name,
    set: card.set,
    tcg: card.tcg,
    pct,
    val: card.base,
  };
}
