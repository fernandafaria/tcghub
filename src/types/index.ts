// TCGHub types

export interface TCG {
  id: string;
  name: string;
  short: string;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  rating: number;
  sales: string;
  verified: boolean;
  ships: string;
}

export interface Card {
  id: string;
  tcg: string;
  name: string;
  set: string;
  num: string;
  rarity: string;
  kind?: string;
  energy: string[];
  gc: string;
  base: number;
  wk: number;
  mo: number;
  art: string;
  foil: boolean;
  meta: string;
  tags: string[];
}

export interface CardOffer {
  store: Store;
  cond: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  tcg: string;
  name: string;
  cat: string;
  price: number;
  img?: string;
}

export interface WatchItem {
  id: string;
  conf: string;
  reason: string;
}

export interface Mover {
  name: string;
  pct: number;
  val: number;
}

export interface CollectionSet {
  code: string;
  name: string;
  tcg: string;
  total: number;
  owned: number;
  foil: number;
  value: number;
  sa: string; // secondary accent color
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}

export type BuyCategory = "avulsas" | "selado" | "deck" | "acessorio" | "graded";
