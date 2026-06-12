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
  img?: string;
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
  set?: string;
  tcg?: string;
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

// ─── API response types ───────────────────────────────────────────

export interface ApiCard {
  card_slug: string;
  card_name: string;
  card_version: string | null;
  set_code: string;
  collector_number: string;
  rarity: string;
  color: string | null;
  image_url: string | null;
  body_text: string | null;
  classifications: string | null;
  price_usd: number | null;
  price_usd_foil: number | null;
  price_brl_low: number | null;
  price_brl_mid: number | null;
  price_brl_high: number | null;
  price_brl_foil_low: number | null;
  price_brl_foil_mid: number | null;
  price_brl_foil_high: number | null;
  price_brl_source: string | null;
  game_id?: string;
  game_display?: string;
  card_category?: string;
}

export interface ApiCardsResponse {
  cards: ApiCard[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiMover {
  card_slug: string;
  card_name: string;
  set_code: string;
  tcg?: string;
  pct: number;
  val: number;
}

export interface ApiProduct {
  id: string;
  name: string;
  cat: string;
  price: number;
  img?: string;
  tcg?: string;
}

// ─── Cart Optimizer API types ────────────────────────────────────

export interface ParsedDeckCard {
  name: string;
  quantity: number;
}

export interface OptimizerRequest {
  items: { card_slug: string; card_name?: string; quantity: number }[];
  cep?: string;
  state?: string;
  shipping_method?: "PAC" | "SEDEX";
  game_id?: string;
}

export interface AllocatedItem {
  listingId: string;
  cardSlug: string;
  cardName?: string;
  quantity: number;
  unitPriceBrl: number;
  condition: string;
  isFoil: boolean;
  anomalous?: boolean;
}

export interface SellerSlot {
  sellerId: string;
  displayName: string;
  isVerified: boolean;
  items: AllocatedItem[];
  subtotalBrl: number;
  shippingBrl: number;
  trustLevel?: string;
}

export interface MissingCard {
  cardSlug: string;
  quantity: number;
}

export interface OptimizationResult {
  sellers: SellerSlot[];
  missing: MissingCard[];
  subtotalBrl: number;
  shippingBrl: number;
  totalBrl: number;
  requiredQuantity: number;
  allocatedQuantity: number;
  coverageRatio: number;
  incomplete: boolean;
  combinationsEvaluated: number;
  warnings?: string[];
}

// ─── Buylist API types ──────────────────────────────────────────

export interface BuylistEntry {
  buylistId: string;
  storeId: string;
  storeName: string;
  cardSlug: string;
  gameId: string;
  condition: string;
  isFoil: boolean;
  priceBrl: number;
  maxQty: number;
}

export interface BuylistOffer {
  buylistId: string;
  storeId: string;
  storeName: string;
  entryId: string;
  condition: string;
  isFoil: boolean;
  priceBrl: number;
  maxQty: number;
}

export interface SellLotItem {
  card_slug: string;
  card_name: string;
  condition: string;
  is_foil: boolean;
  quantity: number;
  quoted_price_brl: number;
  buylist_entry_id?: string;
}

export interface SellLot {
  id: string;
  status: string;
  totalCreditBrl: string;
  storeName: string;
  createdAt: string;
  settledAt: string | null;
}

// ─── Dashboard API types ────────────────────────────────────────

export interface DashboardStats {
  vendasHoje: number;
  vendasSemana: number;
  vendasMes: number;
  margemMedia: number;
  cardsAtivos: number;
  cardsVendidosHoje: number;
}

export interface SalesChartDay {
  date: string;
  vendas: number;
  receita: number;
}

export interface TopCard {
  card_slug: string;
  card_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

export interface CreditInfo {
  balanceBrl: number;
  pendingBrl: number;
}

// ─── Vision API types ────────────────────────────────────────────

export interface VisionScanRequest {
  image_data_url: string;
  games?: string[];
}

export interface VisionCardIdentification {
  game_id: string;
  card_name: string;
  card_version: string;
  set_code: string;
  collector_number: string;
  rarity: string;
  variant: string;
  is_graded: boolean;
  grading_company: string | null;
  grading_grade: string;
  grading_cert_number: string;
  confidence_pct: number;
  grading_confidence_pct: number;
  notes: string;
}

export interface VisionScanResponse {
  identification: VisionCardIdentification;
  card: ApiCard | null;
  graded: {
    company: string | null;
    grade: string | null;
    cert_number: string | null;
    grade_label?: string;
  };
  found: boolean;
  credits_used_brl: string;
  credits_remaining_brl?: string;
  scrydex_match_score?: number;
  error?: string; // 402/502 errors
}

export interface VisionScanResult {
  imageDataUrl: string;
  identification: VisionCardIdentification | null;
  card: ApiCard | null;
  graded: VisionScanResponse["graded"] | null;
  found: boolean;
  creditsUsedBrl: string;
  status: "scanning" | "success" | "failed" | "idle";
  error?: string;
}

// ─── Batch Scan types ──────────────────────────────────────────────

export interface BatchScanRequest {
  image_data_url: string;
  games?: string[];
  verify_graded?: boolean;
}

export interface BatchCardPosition {
  row: number;
  col: number;
}

export interface BatchCardIdentification {
  game_id: string;
  card_name: string;
  card_version: string | null;
  set_code: string | null;
  collector_number: string | null;
  rarity: string | null;
  variant: string | null;
  is_graded: boolean;
  grading_company: string | null;
  grading_grade: string | null;
  confidence: number;
  best_guess: boolean;
}

export interface BatchCardResult {
  position: BatchCardPosition;
  identification: BatchCardIdentification;
  card: ApiCard | null;
  found: boolean;
  quantity: number;
}

export interface BatchScanMeta {
  total_cards: number;
  found_cards: number;
  graded_cards: number;
  verified_graded_cards: number;
  cost_brl: string;
  cost_graded_brl: string;
  processing_ms: number;
  model_used: string;
}

export interface BatchScanResponse {
  cards: BatchCardResult[];
  meta: BatchScanMeta;
}
