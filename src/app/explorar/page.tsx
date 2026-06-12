"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TCGS } from "@/data";
import { apiCardsToCards } from "@/lib/adapters";
import { formatSetCode } from "@/lib/sets";
import { Chip } from "@/components/ui";
import {
  IconChart,
  IconArrow,
  IconStar,
  IconSearch,
} from "@/components/icons";
import type { Card, ApiCardsResponse } from "@/types";

// ─── Constants ────────────────────────────────────────────────────
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

// ─── API ──────────────────────────────────────────────────────────
async function fetchCards(
  game: string,
  limit: number
): Promise<Card[]> {
  const param = GAME_ID_TO_PARAM[game] || game;
  const url = `${API_BASE}/api/cards?game=${param}&limit=${limit}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const json: ApiCardsResponse = await res.json();
  return apiCardsToCards(json.cards, game);
}

async function fetchAllGames(limit: number): Promise<Card[]> {
  const perGame = Math.floor(limit / GAME_KEYS.length);
  const results = await Promise.allSettled(
    GAME_KEYS.map((g) => fetchCards(g, perGame))
  );
  const all: Card[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all;
}

// ─── Card swatch (when no image) ──────────────────────────────────
function CardSwatch({ card }: { card: Card }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "2.5/3.5",
        borderRadius: 10,
        background: `linear-gradient(135deg, ${card.gc}, ${card.gc}88)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text)",
        opacity: 0.5,
        fontFamily: "var(--fmono)",
      }}
    >
      {card.num || card.rarity.charAt(0)}
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────
function ExplorarContent() {
  const [tcgFilter, setTcgFilter] = useState("todos");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cards on mount and when TCG filter changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const fetched =
          tcgFilter === "todos"
            ? await fetchAllGames(200)
            : await fetchCards(tcgFilter, 100);
        if (!cancelled) setCards(fetched);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Erro ao carregar cartas"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tcgFilter]);

  // Sections derived from real cards
  const { featured, rare, byTcg } = useMemo(() => {
    // Featured: cards with images, up to 10
    const withImages = cards.filter((c) => c.img);
    const featured = (withImages.length >= 10
      ? withImages
      : cards
    ).slice(0, 10);

    // Rare: cards with rarity "Rare" or higher
    const highRarity = ["rare", "super rare", "ultra rare", "secret rare", "mythic rare", "special rare", "promo"];
    const rare = cards
      .filter((c) => highRarity.includes(c.rarity.toLowerCase()))
      .slice(0, 10);

    // By TCG groupings
    const byTcg: Record<string, Card[]> = {};
    for (const c of cards.slice(0, 80)) {
      const tcg = c.tcg || "outro";
      if (!byTcg[tcg]) byTcg[tcg] = [];
      if (byTcg[tcg].length < 8) byTcg[tcg].push(c);
    }

    return { featured, rare, byTcg };
  }, [cards]);

  const tcgLabel = (id: string): string =>
    TCGS.find((t) => t.id === id)?.name || id;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Explorar · TCGHub
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
            <span className="holo-text">Descubra</span> o acervo
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Navegue por {cards.length.toLocaleString("pt-BR")} cartas de{" "}
            {GAME_KEYS.length} TCGs diferentes. Use os filtros para explorar
            por jogo.
          </p>
        </div>

        {/* TCG filter chips */}
        <div
          className="row wrapf gap-8"
          style={{ marginBottom: 28 }}
        >
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

        {/* Loading */}
        {loading && (
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Explorando o acervo
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                {tcgFilter === "todos"
                  ? "Buscando cartas de todos os TCGs..."
                  : `Catalogando ${tcgLabel(tcgFilter)}...`}
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
              Não foi possível carregar. Tente novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
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

        {!loading && !error && cards.length === 0 && (
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
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Tente selecionar outro TCG.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && cards.length > 0 && (
          <>
            {/* Section: Em destaque (cards com imagem) */}
            {featured.length > 0 && (
              <>
                <div
                  className="sec-head"
                  style={{ marginBottom: 12 }}
                >
                  <div>
                    <h2>Em destaque</h2>
                    <div className="sub">
                      Cartas com imagem disponível no acervo
                    </div>
                  </div>
                </div>

                <div
                  className="row"
                  style={{
                    gap: 16,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    paddingBottom: 12,
                    marginBottom: 36,
                    scrollbarWidth: "thin",
                  }}
                >
                  {featured.map((card) => (
                    <Link
                      key={card.id}
                      href={`/carta/${card.id}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        flex: "0 0 auto",
                        width: 210,
                        scrollSnapAlign: "start",
                      }}
                    >
                      <div
                        className="card card-pad col"
                        style={{ gap: 10 }}
                      >
                        {card.img ? (
                          <img
                            src={card.img}
                            alt={card.name}
                            style={{
                              width: "100%",
                              aspectRatio: "2.5/3.5",
                              borderRadius: 10,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <CardSwatch card={card} />
                        )}

                        <div className="col" style={{ gap: 4 }}>
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
                          <span
                            className="mono"
                            style={{
                              fontSize: 10.5,
                              color: "var(--gold-2)",
                            }}
                          >
                            {card.rarity}
                            {card.kind ? ` · ${card.kind}` : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Section: Raridades altas */}
            {rare.length > 0 && (
              <>
                <div
                  className="sec-head"
                  style={{ marginBottom: 12 }}
                >
                  <div>
                    <h2>Raridades especiais</h2>
                    <div className="sub">
                      Cartas raras, super raras e ultra raras do acervo
                    </div>
                  </div>
                </div>

                <div
                  className="row"
                  style={{
                    gap: 16,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    paddingBottom: 12,
                    marginBottom: 36,
                    scrollbarWidth: "thin",
                  }}
                >
                  {rare.map((card) => (
                    <Link
                      key={card.id}
                      href={`/carta/${card.id}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        flex: "0 0 auto",
                        width: 210,
                        scrollSnapAlign: "start",
                      }}
                    >
                      <div
                        className="card card-pad col"
                        style={{
                          gap: 10,
                          borderColor: "var(--gold-bd)",
                        }}
                      >
                        {card.img ? (
                          <img
                            src={card.img}
                            alt={card.name}
                            style={{
                              width: "100%",
                              aspectRatio: "2.5/3.5",
                              borderRadius: 10,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <CardSwatch card={card} />
                        )}

                        <div className="col" style={{ gap: 4 }}>
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
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--gold)",
                              fontWeight: 600,
                            }}
                          >
                            {card.rarity}
                            {card.kind ? ` · ${card.kind}` : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Sections: By TCG */}
            {Object.entries(byTcg).map(([tcgId, tcgCards]) => (
              <div key={tcgId}>
                <div
                  className="sec-head"
                  style={{ marginBottom: 12 }}
                >
                  <div>
                    <h2>{tcgLabel(tcgId)}</h2>
                    <div className="sub">
                      {tcgCards.length} cartas do acervo
                    </div>
                  </div>
                  <Link
                    href={`/buscar?game=${tcgId}`}
                    className="btn btn-ghost btn-sm"
                    style={{ textDecoration: "none" }}
                  >
                    Ver todas <IconArrow />
                  </Link>
                </div>

                <div
                  className="row"
                  style={{
                    gap: 16,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    paddingBottom: 12,
                    marginBottom: 36,
                    scrollbarWidth: "thin",
                  }}
                >
                  {tcgCards.map((card) => (
                    <Link
                      key={card.id}
                      href={`/carta/${card.id}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        flex: "0 0 auto",
                        width: 210,
                        scrollSnapAlign: "start",
                      }}
                    >
                      <div
                        className="card card-pad col"
                        style={{ gap: 10 }}
                      >
                        {card.img ? (
                          <img
                            src={card.img}
                            alt={card.name}
                            style={{
                              width: "100%",
                              aspectRatio: "2.5/3.5",
                              borderRadius: 10,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <CardSwatch card={card} />
                        )}

                        <div className="col" style={{ gap: 4 }}>
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
                          <span
                            className="mono"
                            style={{
                              fontSize: 10.5,
                              color: "var(--gold-2)",
                            }}
                          >
                            {card.rarity}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* CTA: Mercado */}
            <div
              className="card card-pad"
              style={{
                textAlign: "center",
                borderColor: "var(--gold-bd)",
              }}
            >
              <div style={{ maxWidth: 480, margin: "0 auto" }}>
                <div
                  className="row center"
                  style={{
                    gap: 8,
                    justifyContent: "center",
                    marginBottom: 8,
                    color: "var(--gold-2)",
                  }}
                >
                  <IconChart />
                  <IconStar />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--fdisplay)",
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Precisa de preços?
                </h3>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                >
                  O monitoramento de preços está em desenvolvimento. Quando
                  estiver no ar, você verá cartas em alta, quedas e
                  oportunidades aqui.
                </p>
                <Link
                  href="/mercado"
                  className="btn btn-gold btn-lg"
                  style={{ textDecoration: "none" }}
                >
                  <IconArrow /> Ver mercado
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────
export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="wrap">
            <p style={{ color: "var(--muted)" }}>Carregando...</p>
          </div>
        </div>
      }
    >
      <ExplorarContent />
    </Suspense>
  );
}
