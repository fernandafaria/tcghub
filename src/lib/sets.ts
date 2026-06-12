/**
 * Set code formatting — makes raw set_codes human-readable.
 *
 * API set_codes are descriptive slugs like:
 *   "alternate-art-promos-pokemon", "500-years-in-the-future-one-piece-card-game"
 * This module formats them for display.
 */

// ─── Suffix stripping ───────────────────────────────────────────

const TCG_SUFFIXES = [
  "-pokemon",
  "-yugioh",
  "-mtg",
  "-magic",
  "-one-piece-card-game",
  "-onepiece",
  "-lorcana",
  "-disney-lorcana",
  "-card-game",
  "-tcg",
];

function stripTcgSuffix(code: string): string {
  for (const suffix of TCG_SUFFIXES) {
    if (code.endsWith(suffix)) return code.slice(0, -suffix.length);
  }
  return code;
}

// ─── Known overrides (short codes → display name) ──────────────

const KNOWN_SETS: Record<string, string> = {
  // Pokémon
  sv1: "Scarlet & Violet",
  sv2: "Paldea Evolved",
  sv3: "Obsidian Flames",
  sv4: "Paradox Rift",
  sv5: "Temporal Forces",
  sv6: "Twilight Masquerade",
  sv7: "Stellar Crown",
  sv8: "Surging Sparks",
  sv9: "Journey Together",
  svp: "Scarlet & Violet Promos",
  swsh1: "Sword & Shield",
  swsh2: "Rebel Clash",
  swsh3: "Darkness Ablaze",
  swsh4: "Vivid Voltage",
  swsh5: "Battle Styles",
  swsh6: "Chilling Reign",
  swsh7: "Evolving Skies",
  swsh8: "Fusion Strike",
  swsh9: "Brilliant Stars",
  swsh10: "Astral Radiance",
  swsh11: "Lost Origin",
  swsh12: "Silver Tempest",
  swsh45: "Shining Fates",
  // Lorcana
  tfc: "The First Chapter",
  rof: "Rise of the Floodborn",
  ink: "Into the Inklands",
  urs: "Ursula's Return",
  ssk: "Shimmering Skies",
  // One Piece
  op01: "Romance Dawn",
  op02: "Paramount War",
  op03: "Pillars of Strength",
  op04: "Kingdoms of Intrigue",
  op05: "Awakening of the New Era",
  op06: "Wings of the Captain",
  op07: "500 Years in the Future",
  // Magic
  mh2: "Modern Horizons 2",
  ltr: "Lord of the Rings: Tales of Middle-earth",
  dmu: "Dominaria United",
  // Yu-Gi-Oh!
  lob: "Legend of Blue Eyes",
  mrd: "Metal Raiders",
  sdy: "Starter Deck Yugi",
  sdk: "Starter Deck Kaiba",
  mrl: "Magic Ruler",
  psv: "Pharaoh's Servant",
  lon: "Labyrinth of Nightmare",
  lod: "Legacy of Darkness",
  pgd: "Pharaonic Guardian",
  mfc: "Magician's Force",
  dcr: "Dark Crisis",
  ioc: "Invasion of Chaos",
  ast: "Ancient Sanctuary",
  sod: "Soul of the Duelist",
  rst: "Rise of Destiny",
  tlm: "The Lost Millennium",
  een: "Elemental Energy",
};

// ─── Humanize ──────────────────────────────────────────────────

const COMMON_PREFIXES = ["pokemon", "mtg", "yugioh", "lorcana", "onepiece"];

export function formatSetCode(code: string): string {
  // Check known overrides first
  const known = KNOWN_SETS[code.toLowerCase()];
  if (known) return known;

  // Strip TCG suffix
  let clean = stripTcgSuffix(code);

  // Strip TCG prefix if present
  const lower = clean.toLowerCase();
  for (const prefix of COMMON_PREFIXES) {
    if (lower.startsWith(prefix + "-")) {
      clean = clean.slice(prefix.length + 1);
      break;
    }
  }

  // Replace hyphens/underscores with spaces
  clean = clean.replace(/[-_]/g, " ");

  // Capitalize each word
  clean = clean
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  // Clean up common artifacts
  clean = clean
    .replace(/\b2 Player\b/i, "2-Player")
    .replace(/\bOne Piece\b/i, "One Piece");

  return clean || code;
}

// ─── Sets lookup (loaded from /api/sets at runtime) ──────────

export interface SetInfo {
  code: string;
  name: string;
  released?: string;
  count: number;
}

let _setMap: Map<string, SetInfo> | null = null;

export async function loadSetMap(): Promise<Map<string, SetInfo>> {
  if (_setMap) return _setMap;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://tcghub.ai"}/api/sets`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("Failed to load sets");
    const data = await res.json();
    const map = new Map<string, SetInfo>();
    for (const s of data.sets || []) {
      map.set(s.set_code, {
        code: s.set_code,
        name: s.set_name,
        released: s.released_at,
        count: s.card_count || 0,
      });
    }
    _setMap = map;
    return map;
  } catch {
    return new Map();
  }
}

export function formatSetShort(code: string, setMap?: Map<string, SetInfo>): string {
  // First check the runtime map from /api/sets
  if (setMap?.has(code)) {
    return setMap.get(code)!.name;
  }
  // Then check local known sets
  const known = KNOWN_SETS[code.toLowerCase()];
  if (known) return known;
  // Fallback to formatting
  return formatSetCode(code);
}
