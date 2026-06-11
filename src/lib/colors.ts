/**
 * TCGHub.ai — Unified Card Type Colors
 *
 * Single source of truth for card type/color mapping across all TCGs.
 * Previously duplicated in adapters.ts and primitives.tsx.
 *
 * Naming convention:
 *   - Pokémon energy types: fire, water, grass, lightning, psychic, fighting, dark, metal, dragon, colorless
 *   - Magic mana: red, blue, black, green, white
 *   - Lorcana ink: amber, emerald, sapphire, ruby, steel, amethyst
 *
 * All colors use hex for game-accuracy (these are not brand colors,
 * they're game data — each TCG has precise ink/energy colors).
 * Fallback: "#c4bdd0" (colorless/neutral)
 */

export const CARD_COLORS: Record<string, string> = {
  // Pokémon
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

  // Magic: The Gathering
  red: "#e0563f",
  blue: "#3d9be0",
  black: "#7d7390",
  green: "#4fb56a",
  white: "#f5f0e8",

  // Disney Lorcana
  amber: "#e0a93f",
  emerald: "#4fb56a",
  sapphire: "#3d9be0",
  ruby: "#e0563f",
  steel: "#9aa6b2",
  amethyst: "#b46fd6",
};

/** Default fallback for unknown card types */
export const CARD_COLOR_FALLBACK = "#c4bdd0";
