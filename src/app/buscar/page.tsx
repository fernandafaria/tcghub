"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { TCGS } from "@/data";
import { fmt, TrendTag, Chip } from "@/components/ui";
import { IconSearch } from "@/components/icons";
import type { Card, ApiCardsResponse } from "@/types";
import { apiCardsToCards } from "@/lib/adapters";

// ─── API fetch (multi-game) ───────────────────────────────────────

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

async function fetchCardsForGame(
  game: string,
  limit: number
): Promise<Card[]> {
  const param = GAME_ID_TO_PARAM[game] || game;
  const url = `${API_BASE}/api/cards?game=${param}&limit=${limit}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!res.ok) return [];
  const json: ApiCardsResponse = await res.json();
  return apiCardsToCards(json.cards, game);
}

async function fetchAllCards(tcgId: string, limit: number): Promise<Card[]> {
  if (tcgId === "todos") {
    const results = await Promise.allSettled(
      GAME_KEYS.map((g) => fetchCardsForGame(g, Math.floor(limit / GAME_KEYS.length)))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<Card[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }
  return fetchCardsForGame(tcgId, limit);
}

// ─── Rarity order ─────────────────────────────────────────────────

const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  "super rare": 3,
  "ultra rare": 4,
  "secret rare": 5,
  "promo": 6,
  "mythic rare": 7,
  "special rare": 8,
};

// ─── Page ─────────────────────────────────────────────────────────

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [tcgFilter, setTcgFilter] = useState("todos");
  const [rarityFilter, setRarityFilter] = useState("todas");
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  // Fetch cards when TCG filter changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cards = await fetchAllCards(tcgFilter, 400);
        if (!cancelled) {
          setAllCards(cards);
          fetched.current = true;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao buscar cartas");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tcgFilter]);

  // Rarity list from real data
  const rarities = useMemo(() => {
    const seen = new Set<string>();
    const normalized = new Map<string, string>(); // lower → display
    for (const c of allCards) {
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
  }, [allCards]);

  // Filter
  const results = useMemo(() => {
    let cards = allCards;

    if (query) {
      const q = query.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.set.toLowerCase().includes(q) ||
          c.num.toLowerCase().includes(q)
      );
    }

    if (rarityFilter !== "todas") {
      cards = cards.filter((c) => c.rarity === rarityFilter);
    }

    return cards.slice(0, 24);
  }, [query, rarityFilter, allCards]);

  const hasFilters = query || tcgFilter !== "todos" || rarityFilter !== "todas";
  const hasResults = results.length > 0;
  const showEmpty = !loading && allCards.length > 0 && !hasResults;
  const showInit = !loading && allCards.length === 0 && !error;

  // TCG short label
  const tcgLabel = useCallback(
    (id: string) =>
      ({
        pokemon: "PKM",
        ygo: "YGO",
        yugioh: "YGO",
        mtg: "MTG",
        magic: "MTG",
        op: "OP",
        onepiece: "OP",
        lor: "LOR",
        lorcana: "LOR",
      }[id] || id.toUpperCase()),
    []
  );

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
            Busque por nome da carta, set ou coleção. Resultados instantâneos enquanto você digita.
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
            <Chip active={tcgFilter === "todos"} onClick={() => setTcgFilter("todos")}>
              Todos os TCGs
            </Chip>
            {TCGS.map((tcg) => (
              <Chip
                key={tcg.id}
                active={tcgFilter === tcg.id}
                onClick={() => setTcgFilter(tcgFilter === tcg.id ? "todos" : tcg.id)}
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
                  onClick={() => setRarityFilter(rarityFilter === r ? "todas" : r)}
                >
                  {r}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="card card-pad" style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <div className="row center" style={{ justifyContent: "center", gap: 8, marginBottom: 12 }}>
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
                Buscando o acervo
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                {tcgFilter === "todos"
                  ? "Carregando cartas de todos os TCGs. Isso leva alguns instantes."
                  : `Catalogando cartas de ${TCGS.find((t) => t.id === tcgFilter)?.name || tcgFilter}...`}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="card card-pad" style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: "var(--down)", fontSize: 14, marginBottom: 12 }}>
              Não foi possível carregar as cartas. Tente novamente.
            </p>
            <button
              onClick={() => setTcgFilter(tcgFilter)} // trigger refetch
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

        {/* Initial state (no cards yet) */}
        {showInit && (
          <div className="card card-pad" style={{ textAlign: "center", marginBottom: 40 }}>
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
                Digite o nome de uma carta, coleção ou TCG para ver resultados instantâneos.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <>
            <div className="row between center" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {results.length} de {allCards.length} carta{allCards.length !== 1 ? "s" : ""} no acervo
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
                marginBottom: 40,
              }}
            >
              {results.map((card) => (
                <Link
                  key={card.id}
                  href={`/carta/${card.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card card-pad row center" style={{ gap: 14 }}>
                    {/* Card color swatch */}
                    <div
                      style={{
                        width: 56,
                        aspectRatio: "2.5/3.5",
                        borderRadius: 7,
                        flex: "0 0 auto",
                        background: card.gc || "var(--card-2)",
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
                      <span style={{ fontSize: 12, fontFamily: "var(--fmono)" }}>
                        {card.num}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="col grow" style={{ gap: 4, minWidth: 0 }}>
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
                      <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                        {card.set} · {card.num}
                      </span>
                      <div className="row between center" style={{ gap: 8 }}>
                        <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                          {card.base > 0 ? fmt(card.base) : "—"}
                        </span>
                        <span
                          className="tag tag-neutral"
                          style={{ fontSize: 10, textTransform: "uppercase" }}
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
          <div className="card card-pad" style={{ textAlign: "center", marginBottom: 40 }}>
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
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
                Tente outros filtros ou termos de busca. As cartas aparecem aqui conforme você digita.
              </p>
            </div>
          </div>
        )}

        {/* Saved searches placeholder */}
        <div className="sec-head" style={{ marginBottom: 16 }}>
          <div>
            <h2>Buscas salvas</h2>
            <div className="sub">Em breve — salve suas buscas favoritas</div>
          </div>
        </div>

        <div
          className="card card-pad"
          style={{ textAlign: "center", color: "var(--faint)", fontSize: 13 }}
        >
          <div className="row center" style={{ justifyContent: "center", gap: 6 }}>
            <span style={{ opacity: 0.5 }}>
              <IconSearch />
            </span>
            <span>
              Você poderá salvar buscas frequentes e receber alertas quando novas cartas
              aparecerem.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
