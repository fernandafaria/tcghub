export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path}: ${res.status} — ${body}`);
  }
  const data = await res.json();

  // Normalize cart/optimize response (handles both old and new backend formats)
  if (path === "/api/cart/optimize") {
    return normalizeCartOptimize(data) as unknown as T;
  }

  return data;
}

// ─── Cart optimize response normalizer ──────────────────────────────────────

interface OldCartResponse {
  allocation?: Array<{
    seller_id: string; store_name: string; items: Array<{
      card_slug: string; card_name?: string; quantity: number;
      unit_price_brl: number; condition: string; is_foil: boolean;
    }>; subtotal: number; shipping: number;
  }>;
  total_price?: number;
  total_freight?: number;
  num_stores?: number;
  coverage_pct?: number;
  missing_cards?: Array<{ card_slug: string; quantity: number }>;
  engine?: string;
  explanation?: string;
  required_quantity?: number;
}

function normalizeCartOptimize(raw: any): any {
  // If already in new format (has 'sellers' field), return as-is
  if (raw.sellers !== undefined) return raw;

  const old = raw as OldCartResponse;

  const sellers = (old.allocation || []).map((a) => ({
    sellerId: a.seller_id,
    displayName: a.store_name,
    isVerified: false,
    items: (a.items || []).map((i) => ({
      listingId: "",
      cardSlug: i.card_slug,
      cardName: i.card_name || i.card_slug,
      quantity: i.quantity,
      unitPriceBrl: i.unit_price_brl,
      condition: i.condition,
      isFoil: i.is_foil,
    })),
    subtotalBrl: a.subtotal,
    shippingBrl: a.shipping,
  }));

  const missing = (old.missing_cards || []).map((m) => ({
    cardSlug: m.card_slug,
    quantity: m.quantity,
  }));

  const requiredQty = old.required_quantity ??
    sellers.reduce((sum, s) => sum + s.items.reduce((ss, i) => ss + i.quantity, 0), 0) +
    missing.reduce((sum, m) => sum + m.quantity, 0);

  const allocatedQty = sellers.reduce((sum, s) => sum + s.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  return {
    sellers,
    missing,
    subtotalBrl: old.total_price ?? sellers.reduce((sum, s) => sum + s.subtotalBrl, 0),
    shippingBrl: old.total_freight ?? sellers.reduce((sum, s) => sum + s.shippingBrl, 0),
    totalBrl: (old.total_price ?? 0) + (old.total_freight ?? 0),
    requiredQuantity: requiredQty,
    allocatedQuantity: allocatedQty,
    coverageRatio: old.coverage_pct ? old.coverage_pct / 100 : (requiredQty > 0 ? allocatedQty / requiredQty : 1),
    incomplete: (old.coverage_pct ?? 100) < 100,
    combinationsEvaluated: 0,
    warnings: old.engine === "greedy" ? [old.explanation || ""].filter(Boolean) : [],
  };
}
