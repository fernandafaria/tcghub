"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TCGS } from "@/data";
import {
  IconSearch, IconCart, IconSpark, IconBell, IconChart, IconArrow,
  IconCards, IconPkg, IconLayers, IconGrid, IconStar, IconBrain, IconUp,
} from "@/components/icons";
import {
  CardFan, GameCard, CardTile, ProductTile, SectionHead, TrendTag,
  Sparkline, genSpark, Chip, TagUI, fmt, fmt0,
} from "@/components/ui";
import { toast } from "@/components/Toaster";
import { useApi } from "@/hooks/useApi";
import { apiCardsToCards, apiCardToCard, cardToMover } from "@/lib/adapters";
import type { ApiCardsResponse, Card, Mover, Product } from "@/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

const CATEGORY_CHIPS = [
  ["Cartas avulsas", "cards", "avulsas"] as const,
  ["Produtos selados", "pkg", "selado"] as const,
  ["Decks prontos", "layers", "deck"] as const,
  ["Acessórios", "grid", "acessorio"] as const,
  ["Cartas graded", "star", "graded"] as const,
];

const CAT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  cards: IconCards,
  pkg: IconPkg,
  layers: IconLayers,
  grid: IconGrid,
  star: IconStar,
};

function deckTotalCards(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("tcghub-deck");
    if (!raw) return 0;
    const deck: { quantity: number }[] = JSON.parse(raw);
    return deck.reduce((sum, d) => sum + (d.quantity || 0), 0);
  } catch {
    return 0;
  }
}

// ─── Vibrant color per TCG for movers ──────────────────────────────────────

const TCG_COLORS: Record<string, string> = {
  PKM: "#f2c94c",
  MTG: "#e0853f",
  YGO: "#b46fd6",
  OP: "#e0563f",
  LOR: "#3d9be0",
};

// ─── HOME PAGE ─────────────────────────────────────────────────────────────

export default function Home() {
  const [tcg, setTcg] = useState("pokemon");
  const [searchQuery, setSearchQuery] = useState("");
  const dCount = useMemo(() => deckTotalCards(), []);
  const dMissing = Math.max(0, 60 - dCount);

  // ─── Fetch cards from API ──────────────────────────────────────
  const { data: apiData, loading: cardsLoading, error: cardsError } =
    useApi<ApiCardsResponse>("/api/cards?limit=50");

  // Map API cards to frontend Card format
  const apiCards: Card[] = useMemo(() => {
    if (!apiData?.cards) return [];
    return apiCardsToCards(apiData.cards);
  }, [apiData]);

  // All cards come from API only — no mock fallback
  const allCards: Card[] = useMemo(() => apiCards, [apiCards]);

  // Card fan — 3 chase cards from the current TCG
  const fanCards = useMemo(() => {
    if (allCards.length === 0) return [];
    const pool = allCards.filter(
      (c) => c.tcg === tcg && (c.foil || c.tags.includes("Chase"))
    );
    if (pool.length < 3) {
      const fallback = allCards.filter((c) => c.tcg === tcg);
      if (fallback.length < 3) {
        // Try any cards
        const any = allCards.length >= 3 ? allCards : [...allCards, ...allCards, ...allCards];
        return [any[0], any[1], any[2]];
      }
      return [fallback[3] || fallback[0], fallback[0] || fallback[1], fallback[2] || fallback[0]];
    }
    return [pool[2 % pool.length], pool[0], pool[1 % pool.length]];
  }, [tcg, allCards]);

  // Trending cards for "Mais buscadas agora"
  const trending = useMemo(() => {
    if (allCards.length === 0) return [];
    const list = allCards.filter((c) => c.tcg === tcg);
    if (list.length === 0) {
      // Fall back to all cards
      return allCards.slice(0, 8);
    }
    const withFoil = list.filter((c) => c.foil);
    return (withFoil.length >= 4 ? withFoil : list).slice(0, 8);
  }, [tcg, allCards]);

  // Movers for pulse — use API cards sorted by price as movers
  const pulse = useMemo(() => {
    if (apiCards.length > 0) {
      // Sort by price descending and take top 6 as "movers"
      const sorted = [...apiCards]
        .filter((c) => c.base > 0)
        .sort((a, b) => b.base - a.base)
        .slice(0, 6);
      return sorted.map((c, i) => cardToMover(c, 5 + i * 3));
    }
    return [];
  }, [apiCards]);

  // Watch items — generated dynamically from top API cards
  const watchItems = useMemo(() => {
    if (apiCards.length === 0) return [];
    const top = [...apiCards]
      .filter((c) => c.base > 10)
      .sort((a, b) => b.base - a.base)
      .slice(0, 6);
    return top.map((c, i) => {
      const confPct = 65 + (top.length - i) * 5;
      const confLabel = confPct >= 85 ? "alta" : confPct >= 75 ? "média" : "moderada";
      const pctSign = c.mo >= 0 ? "+" : "";
      return {
        cardId: c.id,
        conf: `Convicção ${confLabel} (${confPct}%)`,
        reason: c.meta
          ? `${c.meta}. ${pctSign}${c.mo.toFixed(1)}% em 30 dias, R$${fmt0(c.base)}.`
          : `${pctSign}${c.mo.toFixed(1)}% em 30 dias. Preço atual: R$${fmt0(c.base)}. ${c.set} · ${c.rarity}.`,
      };
    });
  }, [apiCards]);

  // Sealed products — fetch from API with fallback to empty
  const { data: productsData, loading: productsLoading } =
    useApi<{ products: Product[] }>("/api/products?featured=true");
  const sealedProducts = useMemo(
    () => (productsData?.products || []).filter((p) => p.cat === "selado").slice(0, 8),
    [productsData]
  );

  const handleWatchAlert = (cardName: string) => {
    toast(`Alerta criado para ${cardName}!`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast(`Buscando "${searchQuery.trim()}"...`);
    }
  };

  const handleCategoryClick = (cat: string) => {
    window.location.href = `/comprar?cat=${cat}`;
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* ════════════════ HERO ════════════════ */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 40,
            alignItems: "center",
            padding: "20px 0 8px",
          }}
        >
          {/* LEFT */}
          <div style={{ maxWidth: 600 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              Pokémon · Magic · Yu-Gi-Oh! · One Piece · Lorcana
            </div>
            <h1
              style={{
                fontFamily: "var(--fdisplay)",
                fontSize: "clamp(32px, 4.8vw, 54px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.0,
              }}
            >
              <span className="holo-text">Jogar, colecionar e investir</span>{" "}
              em cartas.
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "var(--text-2)",
                marginTop: 18,
                maxWidth: 510,
                lineHeight: 1.5,
              }}
            >
              Compare preços entre lojas verificadas, receba alertas de
              valorização e compre protegido — do primeiro booster ao slab PSA
              10.
            </p>

            {/* Search bar */}
            <div
              className="card"
              style={{
                marginTop: 24,
                padding: "8px 8px 8px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderRadius: "var(--r-pill)",
                maxWidth: 560,
              }}
            >
              <span style={{ color: "var(--muted)", display: "inline-flex" }}>
                <IconSearch />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Buscar carta, produto, ou colar um deck…"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  color: "var(--text)",
                  fontSize: "15.5px",
                  outline: "none",
                }}
              />
              <button className="btn btn-gold" onClick={handleSearch}>
                Buscar
              </button>
            </div>

            {/* Category chips */}
            <div className="row gap-8 wrapf" style={{ marginTop: 16 }}>
              {CATEGORY_CHIPS.map(([label, ic, cat]) => {
                const IconComp = CAT_ICONS[ic];
                return (
                  <button
                    key={cat}
                    className="chip"
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {IconComp && <IconComp className="ic" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Card Fan */}
          {fanCards.length >= 3 ? (
            <CardFan
              left={fanCards[0]}
              mid={fanCards[1]}
              right={fanCards[2]}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
              <span style={{ color: "var(--muted)" }}>Carregando cartas...</span>
            </div>
          )}
        </section>

        {/* ════════════════ SEU DECK ════════════════ */}
        <section style={{ margin: "34px 0 30px" }}>
          <div
            className="card card-pad row between center wrapf"
            style={{
              gap: 18,
              borderColor: "var(--gold-bd)",
              background:
                "linear-gradient(120deg, var(--gold-bg), transparent 70%)",
            }}
          >
            {dCount > 0 ? (
              <>
                <div className="row center" style={{ gap: 14 }}>
                  <span
                    style={{
                      color: "var(--gold-2)",
                      display: "inline-flex",
                    }}
                  >
                    <IconCards />
                  </span>
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      Seu deck em montagem ·{" "}
                      <span className="mono">{dCount}</span> cartas
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                      Faltam <b className="mono">{dMissing}</b> pro padrão de
                      60. Sugestão: +2 <b>Iono</b> deixa mais consistente.
                    </span>
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Link href="/comprar" className="btn btn-ghost">
                    Continuar montando
                  </Link>
                  <Link href="/comprar?optimize=1" className="btn btn-gold">
                    Otimizar frete <IconArrow />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="row center" style={{ gap: 14 }}>
                  <span
                    style={{
                      color: "var(--gold-2)",
                      display: "inline-flex",
                    }}
                  >
                    <IconCards />
                  </span>
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      Tem um deck em mente?
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                      Monte carta a carta ou cole a lista — a gente acha o
                      frete mínimo e o que falta.
                    </span>
                  </div>
                </div>
                <Link href="/comprar" className="btn btn-gold">
                  <IconSpark /> Montar meu deck
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ════════════════ COMPRE AGORA · TENDE A VALORIZAR ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <SectionHead
            title="Compre agora · tende a valorizar"
            subtitle="Alertas de preço com o porquê — não é palpite de YouTube"
            moreLabel="Ver mercado"
            moreHref="/mercado"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 18,
            }}
          >
            {watchItems.map((w) => {
              const c = allCards.find((x) => x.id === w.cardId) || allCards[0];
              if (!c) return null;
              const sparkData = genSpark(c.id.charCodeAt(0) || 1, c.mo >= 0);
              return (
                <div
                  key={w.cardId}
                  className="card card-pad col"
                  style={{
                    gap: 12,
                    borderColor: "var(--violet-bd)",
                  }}
                >
                  <div className="row between center">
                    <span className="tag tag-violet">
                      <IconBell /> {w.conf}
                    </span>
                    <TrendTag pct={c.mo} sm />
                  </div>
                  <Link
                    href={`/carta/${c.id}`}
                    className="row center"
                    style={{ gap: 12, textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      className={`cardimg ${c.art} ${c.foil ? "foil" : ""}`}
                      style={{
                        width: 52,
                        aspectRatio: "2.5/3.5",
                        borderRadius: 7,
                        flex: "0 0 auto",
                      }}
                    >
                      <div className="shine" />
                    </div>
                    <div
                      className="col grow"
                      style={{ gap: 2, minWidth: 0 }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: "11.5px", color: "var(--muted)" }}
                      >
                        {c.set} · {fmt0(c.base)}
                      </span>
                    </div>
                  </Link>
                  <p
                    style={{
                      fontSize: "12.5px",
                      color: "var(--text-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {w.reason}
                  </p>
                  <div className="row" style={{ gap: 8 }}>
                    <Link
                      href={`/carta/${c.id}`}
                      className="btn btn-gold btn-sm grow"
                    >
                      Ver ofertas
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleWatchAlert(c.name)}
                    >
                      <IconBell /> Alerta
                    </button>
                  </div>
                  {/* Sparkline mini */}
                  <div
                    className="col"
                    style={{
                      gap: 6,
                      padding: "8px 10px",
                      background: "var(--bg-2)",
                      borderRadius: "var(--r-xs)",
                    }}
                  >
                    <Sparkline
                      points={sparkData}
                      color={
                        c.mo >= 0 ? "var(--up)" : "var(--down)"
                      }
                      width={120}
                      height={28}
                    />
                    <div className="row between center">
                      <span
                        className="mono"
                        style={{ fontSize: 10, color: "var(--muted)" }}
                      >
                        30 dias
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: c.mo >= 0 ? "var(--up)" : "var(--down)",
                        }}
                      >
                        {c.mo >= 0 ? "+" : ""}
                        {c.mo.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════════════ PULSO DO MERCADO ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <div
            className="card card-pad"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div className="row between center">
              <div className="row center" style={{ gap: 10 }}>
                <span className="tag tag-violet">
                  <IconChart /> Pulso do mercado
                </span>
                <span
                  style={{ fontSize: 13, color: "var(--text-2)" }}
                >
                  Maiores altas da semana
                </span>
              </div>
              <Link
                href="/mercado"
                className="more"
                style={{
                  color: "var(--gold-2)",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  textDecoration: "none",
                }}
              >
                Ver tudo <IconArrow />
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {pulse.length > 0 ? (
                pulse.map((m, i) => {
                const sparkPoints = genSpark(i + 10, true);
                const tcgKey = m.tcg || "";
                return (
                  <div
                    key={i}
                    className="row center"
                    style={{
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--surface)",
                      borderRadius: "var(--r-sm)",
                      minWidth: 0,
                    }}
                  >
                    {/* Sparkline */}
                    <div style={{ flex: "0 0 auto" }}>
                      <Sparkline
                        points={sparkPoints}
                        color="var(--up)"
                        width={74}
                        height={28}
                      />
                    </div>
                    <div
                      className="col grow"
                      style={{ gap: 2, minWidth: 0 }}
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
                        {m.name}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 10.5, color: "var(--muted)" }}
                      >
                        {m.set || ""} · {TCG_COLORS[tcgKey] ? (
                          <span
                            style={{
                              display: "inline-block",
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: TCG_COLORS[tcgKey],
                              marginRight: 3,
                              verticalAlign: "middle",
                            }}
                          />
                        ) : null}
                        {tcgKey}
                      </span>
                    </div>
                    <div className="col" style={{ gap: 1, alignItems: "flex-end", flex: "0 0 auto" }}>
                      <span className="tag tag-up" style={{ fontSize: 11, padding: "2px 7px" }}>
                        <IconUp /> +{m.pct.toFixed(1)}%
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--muted)" }}
                      >
                        {fmt0(m.val)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", gridColumn: "1 / -1" }}>
                {cardsLoading ? "Carregando..." : "Nenhum movimento de mercado no momento."}
              </div>
            )}
            </div>
          </div>
        </section>

        {/* ════════════════ MAIS BUSCADAS AGORA ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <SectionHead
            title="Mais buscadas agora"
            subtitle={`O que o pessoal está procurando em ${TCGS.find((t) => t.id === tcg)?.name || "Pokémon"}`}
            moreLabel="Ver tudo"
            moreHref="/comprar"
          />

          {/* TCG Switcher chips */}
          <div className="tcgbar" style={{ marginBottom: 24 }}>
            {TCGS.map((t) => (
              <Chip
                key={t.id}
                active={tcg === t.id}
                onClick={() => setTcg(t.id)}
              >
                {t.name}
              </Chip>
            ))}
          </div>

          {/* Card grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
            }}
          >
          {trending.length > 0 ? (
            trending.map((c) => (
              <Link
                key={c.id}
                href={`/carta/${c.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <CardTile card={c} />
              </Link>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
              {cardsLoading ? "Carregando cartas..." : "Nenhuma carta encontrada."}
            </div>
          )}
          </div>
        </section>

        {/* ════════════════ PRODUTOS SELADOS ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <SectionHead
            title="Produtos selados"
            subtitle="Boxes, ETBs e coleções lacradas"
            moreLabel="Ver todos"
            moreHref="/comprar?cat=selado"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
            }}
          >
            {sealedProducts.length > 0 ? (
              sealedProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/comprar?cat=selado`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <ProductTile
                    product={p}
                    offers={3}
                  />
                </Link>
              ))
            ) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                {productsLoading ? "Carregando produtos..." : "Nenhum produto selado disponível no momento."}
              </div>
            )}
          </div>
        </section>

        {/* ════════════════ PARA LOJISTAS ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <div
            className="card card-pad row between center wrapf"
            style={{
              gap: 24,
              background:
                "linear-gradient(120deg, var(--teal-bg) 0%, transparent 55%)",
              borderColor: "var(--teal-bd)",
            }}
          >
            <div className="col" style={{ gap: 6 }}>
              <span
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Tem uma loja de TCG?
              </span>
              <p style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 480, lineHeight: 1.5 }}>
                Anuncie seu estoque, receba pedidos com compra protegida e
                precifique automaticamente. Sem mensalidade — você só paga
                quando vende.
              </p>
            </div>
            <Link
              href="/lojista"
              className="btn btn-teal btn-lg"
              style={{ whiteSpace: "nowrap" }}
            >
              Tenho uma loja <IconArrow />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
