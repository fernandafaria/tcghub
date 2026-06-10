import type { ApiCard, Card, Mover } from "@/types";

const ENERGY_COLORS: Record<string, string> = {
  fire: "#f0683c",
  water: "#3d9be0",
  grass: "#4fb56a",
  lightning: "#f2c94c",
  psychic: "#b46fd6",
  fighting: "#c9603f",
  dark: "#7d7390",
  metal: "#9aa6b2",
  dragon: "#caa23f",
  colorless: "#c4bdd0",
  red: "#e0563f",
  blue: "#3d9be0",
  black: "#7d7390",
  green: "#4fb56a",
  white: "#f5f0e8",
  amber: "#e0a93f",
  emerald: "#4fb56a",
  sapphire: "#3d9be0",
  ruby: "#e0563f",
  steel: "#9aa6b2",
};

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
  const gc = ENERGY_COLORS[colorLower] || "#c4bdd0";

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
    art: "",
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
