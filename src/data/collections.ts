import type { CollectionSet } from "@/types";

export const COLLECTION_SETS: CollectionSet[] = [
  // Pokémon
  {
    code: "OBF",
    name: "Obsidian Flames",
    tcg: "pokemon",
    total: 230,
    owned: 168,
    foil: 22,
    value: 4120,
    sa: "#f0683c",
  },
  {
    code: "SSP",
    name: "Surging Sparks",
    tcg: "pokemon",
    total: 252,
    owned: 91,
    foil: 14,
    value: 2380,
    sa: "#f2c94c",
  },
  {
    code: "PAR",
    name: "Paradox Rift",
    tcg: "pokemon",
    total: 266,
    owned: 120,
    foil: 18,
    value: 1980,
    sa: "#b46fd6",
  },
  {
    code: "PAL",
    name: "Paldea Evolved",
    tcg: "pokemon",
    total: 279,
    owned: 140,
    foil: 20,
    value: 2240,
    sa: "#3d9be0",
  },
  {
    code: "SVI",
    name: "Scarlet & Violet 151",
    tcg: "pokemon",
    total: 207,
    owned: 96,
    foil: 15,
    value: 3110,
    sa: "#4fb56a",
  },
  {
    code: "PGO",
    name: "Pokémon GO",
    tcg: "pokemon",
    total: 88,
    owned: 31,
    foil: 5,
    value: 640,
    sa: "#7d7390",
  },
  // Magic
  {
    code: "MH2",
    name: "Modern Horizons 2",
    tcg: "magic",
    total: 303,
    owned: 211,
    foil: 28,
    value: 5210,
    sa: "#e0563f",
  },
  {
    code: "LTR",
    name: "LOTR: Tales of Middle-earth",
    tcg: "magic",
    total: 281,
    owned: 88,
    foil: 10,
    value: 1760,
    sa: "#caa23f",
  },
  {
    code: "DMU",
    name: "Dominaria United",
    tcg: "magic",
    total: 281,
    owned: 62,
    foil: 8,
    value: 1320,
    sa: "#7d7390",
  },
  // Lorcana
  {
    code: "ROF",
    name: "Rise of the Floodborn",
    tcg: "lorcana",
    total: 204,
    owned: 64,
    foil: 12,
    value: 1190,
    sa: "#3d9be0",
  },
  {
    code: "TFC",
    name: "The First Chapter",
    tcg: "lorcana",
    total: 204,
    owned: 108,
    foil: 16,
    value: 1680,
    sa: "#e0a93f",
  },
  // One Piece
  {
    code: "OP01",
    name: "Romance Dawn",
    tcg: "onepiece",
    total: 121,
    owned: 47,
    foil: 8,
    value: 980,
    sa: "#e0563f",
  },
  {
    code: "OP02",
    name: "Paramount War",
    tcg: "onepiece",
    total: 121,
    owned: 32,
    foil: 5,
    value: 720,
    sa: "#3d9be0",
  },
  // Yu-Gi-Oh!
  {
    code: "LOB",
    name: "Legend of Blue Eyes",
    tcg: "yugioh",
    total: 126,
    owned: 24,
    foil: 4,
    value: 890,
    sa: "#4fb56a",
  },
];

export const setByCode = (code: string): CollectionSet | undefined =>
  COLLECTION_SETS.find((s) => s.code === code);

export const setsByTcg = (tcg: string): CollectionSet[] =>
  COLLECTION_SETS.filter((s) => s.tcg === tcg);

export const COLLECTION_SUMMARY = {
  totalValue: 28220,
  monthChange: +6.8,
  cardCount: 1284,
  foilCount: 187,
};
