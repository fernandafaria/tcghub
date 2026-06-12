"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TCGS } from "@/data";
import { fmt, TrendTag, Chip } from "@/components/ui";
import { IconSearch } from "@/components/icons";
import type { Card, ApiCardsResponse } from "@/types";
import { apiCardsToCards } from "@/lib/adapters";
import { formatSetCode } from "@/lib/sets";

// ─── API fetch (server-side search) ─────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://tcghub.ai";

const GAME_KEYS = ["pokemon", "yugioh", "onepiece", "lorcana"] as const;

const GAME_ID_TO_PARAM: Record<string, string> = {
  pokemon: "pokemon",
  ygo: "yugioh",
  yugioh: "yugioh",
  mtg: "magic",
  magic: "magic",
  op: "onepiece",
  onepiece: "onepiece",
  lor: "lorcana",
  lorcana: "lorcana",
};

async function fetchCards(
  game: string,
  limit: number,
  search?: string
): Promise<{ cards: Card[]; total: number }> {
  const param = GAME_ID_TO_PARAM[game] || game;
  const params = new URLSearchParams({ game: param, limit: String(limit) });
  if (search) params.set("search", search);

  const url = `${API_BASE}/api/cards?${params}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!res.ok) return { cards: [], total: 0 };
  const json: ApiCardsResponse = await res.json();
  return {
    cards: apiCardsToCards(json.cards, game),
    total: json.total,
  };
}

async function fetchAllGames(
  limit: number,
  search?: string
): Promise<{ cards: Card[]; totals: Record<string, number> }> {
  const results = await Promise.allSettled(
    GAME_KEYS.map((g) =>
      fetchCards(g, Math.floor(limit / GAME_KEYS.length), search)
    )
  );
  const cards: Card[] = [];
  const totals: Record<string, number> = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      cards.push(...r.value.cards);
    }
  }
  return { cards, totals };
}

// ─── Rarity order ─────────────────────────────────────────────────

const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  "super rare": 3,
  "ultra rare": 4,
  "secret rare": 5,
  promo: 6,
  "mythic rare": 7,
  "special rare": 8,
};

// ─── TCG label ────────────────────────────────────────────────────

function tcgLabel(id: string): string {
  return (
    {
      pokemon: "PKM",
      ygo: "YGO",
      yugioh: "YGO",
      mtg: "MTG",
      magic: "MTG",
      op: "OP",
      onepiece: "OP",
      lor: "LOR",
      lorcana: "LOR",
    }[id] || id.toUpperCase()
  );
}

// ─── Page ─────────────────────────────────────────────────────────

function BuscarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL or defaults
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [tcgFilter, setTcgFilter] = useState(
    searchParams.get("game") || "todos"
  );
  const [rarityFilter, setRarityFilter] = useState("todas");
  const [results, setResults] = useState<Card[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController>(undefined);

  // Sync URL params
  const syncURL = useCallback(
    (q: string, game: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (game && game !== "todos") params.set("game", game);
      const search = params.toString();
      router.replace(search ? `/buscar?${search}` : "/buscar", {
        scroll: false,
      });
    },
    [router]
  );

  // Perform search (server-side via API)
  const doSearch = useCallback(
    async (q: string, game: string, limit = 50) => {
      // Abort previous
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        if (!q && game === "todos") {
          // No filters — show nothing (empty initial state)
          setResults([]);
          setTotalHits(0);
          setSearched(false);
          return;
        }

        const { cards, totals } =
          game === "todos"
            ? await fetchAllGames(limit, q || undefined)
            : await fetchCards(game, limit, q || undefined).then((r) => ({
                cards: r.cards,
                totals: {},
              }));

        if (controller.signal.aborted) return;

        setResults(cards);
        setTotalHits(cards.length);
        setSearched(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Erro ao buscar cartas"
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    []
  );

  // Debounced search on query/tcg change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, tcgFilter, 50);
      syncURL(query, tcgFilter);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tcgFilter, doSearch, syncURL]);

  // Initial search from URL params
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const g = searchParams.get("game") || "todos";
    if (q || g !== "todos") {
      setQuery(q);
      setTcgFilter(g);
      doSearch(q, g, 50);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute rarities from results
  const rarities = (() => {
    const seen = new Set<string>();
    const normalized = new Map<string, string>();
    for (const c of results) {
      const lower = c.rarity.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        normalized.set(lower, c.rarity);
      }
    }
    return Array.from(normalized.values()).sort(
      (a, b) =>
        (RARITY_ORDER[a.toLowerCase()] ?? 99) -
        (RARITY_ORDER[b.toLowerCase()] ?? 99)
    );
  })();

  // Client-side rarity filter (lightweight, on already-fetched results)
  const filteredResults =
    rarityFilter === "todas"
      ? results
      : results.filter((c) => c.rarity === rarityFilter);

  const hasQuery = query.length > 0;
  const hasFilters = hasQuery || tcgFilter !== "todos";
  const hasResults = filteredResults.length > 0;
  const showEmpty = !loading && searched && !hasResults && hasFilters;
  const showInit = !loading && !searched && !error;

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Buscar · TCGHub
          </div>
          <h1
            style={{
              fontFamily: "var(--fdisplay)",
              fontSize: "clamp(24px, 3vw, 34px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            <span className="holo-text">Encontre</span> qualquer carta
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Busque por nome da carta, set ou coleção. A busca é feita no
            servidor — resultados precisos em instantes.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 24 }}>
          <div
            className="row"
            style={{
              padding: "12px 18px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-pill)",
              gap: 10,
              maxWidth: 560,
            }}
          >
            <IconSearch />
            <input
              type="text"
              placeholder="Buscar por nome da carta, set ou coleção..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: 15,
                flex: 1,
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  padding: "2px 10px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--bg-2)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="col gap-12" style={{ marginBottom: 24 }}>
          <div className="row wrapf gap-6">
            <Chip
              active={tcgFilter === "todos"}
              onClick={() => setTcgFilter("todos")}
            >
              Todos os TCGs
            </Chip>
            {TCGS.map((tcg) => (
              <Chip
                key={tcg.id}
                active={tcgFilter === tcg.id}
                onClick={() =>
                  setTcgFilter(tcgFilter === tcg.id ? "todos" : tcg.id)
                }
              >
                {tcg.name}
              </Chip>
            ))}
          </div>

          {rarities.length > 0 && (
            <div className="row wrapf gap-6">
              <Chip
                active={rarityFilter === "todas"}
                onClick={() => setRarityFilter("todas")}
              >
                Todas as raridades
              </Chip>
              {rarities.slice(0, 10).map((r) => (
                <Chip
                  key={r}
                  active={rarityFilter === r}
                  onClick={() =>
                    setRarityFilter(rarityFilter === r ? "todas" : r)
                  }
                >
                  {r}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <div
                className="row center"
                style={{
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ opacity: 0.4 }}>
                  <IconSearch />
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Buscando no acervo
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                {hasQuery
                  ? `Procurando "${query}" em ${
                      tcgFilter === "todos"
                        ? "todos os TCGs"
                        : TCGS.find((t) => t.id === tcgFilter)?.name ||
                          tcgFilter
                    }...`
                  : `Catalogando cartas de ${
                      TCGS.find((t) => t.id === tcgFilter)?.name ||
                      tcgFilter
                    }...`}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <p
              style={{
                color: "var(--down)",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Não foi possível buscar as cartas. Tente novamente.
            </p>
            <button
              onClick={() => doSearch(query, tcgFilter, 50)}
              className="btn btn-gold"
              style={{
                padding: "10px 24px",
                borderRadius: "var(--r-pill)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Initial state */}
        {showInit && (
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <div
                className="row center"
                style={{
                  gap: 8,
                  justifyContent: "center",
                  marginBottom: 12,
                  color: "var(--muted)",
                  opacity: 0.5,
                }}
              >
                <IconSearch />
              </div>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Busque por nome da carta, set ou TCG
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Digite o nome de uma carta como &ldquo;Charizard&rdquo; ou
                &ldquo;Pikachu&rdquo; para ver resultados do acervo
                multi-TCG.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <>
            <div
              className="row between center"
              style={{ marginBottom: 16 }}
            >
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {filteredResults.length} de {totalHits || results.length}{" "}
                carta{results.length !== 1 ? "s" : ""} encontrada
                {results.length !== 1 ? "s" : ""}
                {hasQuery && (
                  <>
                    {" "}
                    para &ldquo;{query}&rdquo;
                  </>
                )}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
                marginBottom: 40,
              }}
            >
              {filteredResults.map((card) => (
                <Link
                  key={card.id}
                  href={`/carta/${card.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    className="card card-pad row center"
                    style={{ gap: 14 }}
                  >
                    {/* Card image or color swatch */}
                    <div
                      style={{
                        width: 56,
                        aspectRatio: "2.5/3.5",
                        borderRadius: 7,
                        flex: "0 0 auto",
                        background: card.img
                          ? `url(${card.img}) center/cover no-repeat`
                          : card.gc || "var(--card-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.3)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {!card.img && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--fmono)",
                          }}
                        >
                          {card.num}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div
                      className="col grow"
                      style={{ gap: 4, minWidth: 0 }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {card.name}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10.5,
                          color: "var(--muted)",
                        }}
                      >
                        {formatSetCode(card.set)} · {card.num}
                      </span>
                      <div
                        className="row between center"
                        style={{ gap: 8 }}
                      >
                        <span
                          className="mono"
                          style={{ fontWeight: 700, fontSize: 13 }}
                        >
                          {card.base > 0 ? fmt(card.base) : "—"}
                        </span>
                        <span
                          className="tag tag-neutral"
                          style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                          }}
                        >
                          {tcgLabel(card.tcg)}
                        </span>
                      </div>
                      {card.wk !== 0 && <TrendTag pct={card.wk} sm />}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Empty results */}
        {showEmpty && (
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <div
                className="row center"
                style={{
                  gap: 8,
                  justifyContent: "center",
                  marginBottom: 12,
                  color: "var(--muted)",
                  opacity: 0.5,
                }}
              >
                <IconSearch />
              </div>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Nenhuma carta encontrada
              </h3>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  marginBottom: 18,
                }}
              >
                {hasQuery
                  ? `Nenhuma carta corresponde a "${query}". Tente outro termo ou TCG.`
                  : "Tente outros filtros ou termos de busca."}
              </p>
            </div>
          </div>
        )}

        {/* Saved searches placeholder */}
        {searched && (
          <>
            <div className="sec-head" style={{ marginBottom: 16 }}>
              <div>
                <h2>Buscas salvas</h2>
                <div className="sub">
                  Em breve — salve suas buscas favoritas
                </div>
              </div>
            </div>

            <div
              className="card card-pad"
              style={{
                textAlign: "center",
                color: "var(--faint)",
                fontSize: 13,
              }}
            >
              <div
                className="row center"
                style={{ justifyContent: "center", gap: 6 }}
              >
                <span style={{ opacity: 0.5 }}>
                  <IconSearch />
                </span>
                <span>
                  Você poderá salvar buscas frequentes e receber alertas
                  quando novas cartas aparecerem.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="wrap">
            <div style={{ marginBottom: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Buscar · TCGHub
              </div>
              <h1
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: "clamp(24px, 3vw, 34px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                <span className="holo-text">Encontre</span> qualquer carta
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Busque por nome da carta, set ou coleção.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <BuscarContent />
    </Suspense>
  );
}
