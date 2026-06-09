export interface Mover {
  name: string;
  set: string;
  tcg: string;
  pct: number;
  val: number;
}

export const MOVERS_UP: Mover[] = [
  {
    name: "Elsa - Spirit of Winter",
    set: "ROF · Legendary",
    tcg: "LOR",
    pct: +22.9,
    val: 58.0,
  },
  {
    name: "Monkey D. Luffy (Leader)",
    set: "OP01 · Leader",
    tcg: "OP",
    pct: +15.7,
    val: 96.0,
  },
  {
    name: "Charizard ex",
    set: "OBF · Special Illu.",
    tcg: "PKM",
    pct: +12.4,
    val: 489.0,
  },
  {
    name: "Orcish Bowmasters",
    set: "LTR · Rare",
    tcg: "MTG",
    pct: +8.0,
    val: 152.0,
  },
  {
    name: "Portgas D. Ace",
    set: "OP03 · Secret Rare",
    tcg: "OP",
    pct: +8.5,
    val: 145.0,
  },
  {
    name: "Blue-Eyes White Dragon",
    set: "LOB · Ultra Rare",
    tcg: "YGO",
    pct: +6.0,
    val: 210.0,
  },
];

export const MOVERS_DOWN: Mover[] = [
  {
    name: "Mewtwo VSTAR",
    set: "PGO · Ultra Rare",
    tcg: "PKM",
    pct: -3.2,
    val: 74.9,
  },
  {
    name: "Ragavan, Nimble Pilferer",
    set: "MH2 · Mythic",
    tcg: "MTG",
    pct: -1.8,
    val: 445.0,
  },
  {
    name: "Maleficent - Monstrous Dragon",
    set: "TFC · Legendary",
    tcg: "LOR",
    pct: -1.0,
    val: 52.0,
  },
  {
    name: "Chien-Pao ex",
    set: "PAL · Ultra Rare",
    tcg: "PKM",
    pct: -1.2,
    val: 46.0,
  },
];

export const allMovers = (): Mover[] => [...MOVERS_UP, ...MOVERS_DOWN];
