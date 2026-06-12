"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TCGS } from "@/data";
import {
  IconSearch, IconSpark, IconBell, IconChart, IconArrow,
  IconCards, IconBrain, IconUp, IconDown, IconStar,
} from "@/components/icons";
import {
  CardFan, GameCard, CardTile, SectionHead, TrendTag,
  Sparkline, genSpark, Chip, TagUI, fmt, fmt0,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { apiCardsToCards, apiCardToCard } from "@/lib/adapters";
import type { ApiCardsResponse, Card } from "@/types";

// ─── TCG COLOR MAP ─────────────────────────────────────────────────────────
const TCG_COLORS: Record<string, string> = {
  pokemon: "#f2c94c",
  mtg: "#e0853f",
  ygo: "#b46fd6",
  onepiece: "#e0563f",
  lorcana: "#3d9be0",
};

// ─── QUICK STATS ───────────────────────────────────────────────────────────
const QUICK_STATS = [
  { value: "256K+", label: "Cartas catalogadas" },
  { value: "15", label: "TCGs mapeados" },
  { value: "BRL", label: "Preços em reais" },
];

// ─── WHY CARDS ─────────────────────────────────────────────────────────────
const WHY_CARDS = [
  {
    icon: IconSpark,
    title: "Saiba o que vale",
    body: "Escaneie seu binder em segundos. Valuation com explicação — não é número solto, é o porquê.",
    href: "/scanner",
    cta: "Escanear agora",
    accent: "var(--gold-2)",
  },
  {
    icon: IconBrain,
    title: "Entenda o movimento",
    body: "Health Score de cada carta. Tendências, alertas de valorização, recomendação Buy/Hold/Sell.",
    href: "/mercado",
    cta: "Ver mercado",
    accent: "var(--violet-2)",
  },
  {
    icon: IconChart,
    title: "Opere com inteligência",
    body: "Para lojistas: BuyList automática, gestão de estoque, CRM de jogador. Margem calculada, não chutada.",
    href: "/lojista",
    cta: "Sou lojista",
    accent: "var(--teal-2)",
  },
];

// ─── HOME PAGE ─────────────────────────────────────────────────────────────
export default function Home() {
  const [tcg, setTcg] = useState("pokemon");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch cards from API
  const { data: apiData, loading: cardsLoading } =
    useApi<ApiCardsResponse>(`/api/cards?game=${tcg}&limit=50`);

  const apiCards: Card[] = useMemo(() => {
    if (!apiData?.cards) return [];
    return apiCardsToCards(apiData.cards);
  }, [apiData]);

  // Card fan — top 3 cards by price
  const fanCards = useMemo(() => {
    if (apiCards.length < 3) return [];
    const sorted = [...apiCards]
      .filter((c) => c.base > 0)
      .sort((a, b) => b.base - a.base);
    if (sorted.length >= 3) return [sorted[2], sorted[0], sorted[1]];
    return apiCards.slice(0, 3);
  }, [apiCards]);

  // Trending cards for "Termômetro do mercado"
  const trending = useMemo(() => {
    if (apiCards.length === 0) return [];
    return [...apiCards]
      .filter((c) => c.tcg === tcg)
      .sort((a, b) => b.base - a.base)
      .slice(0, 8);
  }, [tcg, apiCards]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/buscar?q=${encodeURIComponent(searchQuery.trim())}`;
    }
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
            padding: "32px 0 24px",
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
              <span className="holo-text">Sua coleção</span>{" "}
              vale mais do que você imagina.
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
              Descubra em 30 segundos. Scanner de binder, valuation com
              explicação e alertas de valorização — sem comprar nada.
            </p>

            {/* CTA Row */}
            <div className="row" style={{ marginTop: 24, gap: 12 }}>
              <Link href="/scanner" className="btn btn-gold btn-lg">
                <IconSpark /> Escanear meu binder
              </Link>
              <Link href="/importar" className="btn btn-ghost btn-lg">
                Importar coleção
              </Link>
            </div>

            {/* Quick stats */}
            <div className="row" style={{ marginTop: 28, gap: 32 }}>
              {QUICK_STATS.map((s) => (
                <div key={s.label} className="col" style={{ gap: 2 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Card Fan */}
          {fanCards.length >= 3 ? (
            <CardFan left={fanCards[0]} mid={fanCards[1]} right={fanCards[2]} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 280,
              }}
            >
              <span style={{ color: "var(--muted)" }}>
                {cardsLoading ? "Carregando cartas..." : "Catálogo pronto. Escolha um TCG acima."}
              </span>
            </div>
          )}
        </section>

        {/* ════════════════ TCG SELECTOR ════════════════ */}
        <section style={{ margin: "16px 0 36px" }}>
          <div className="row wrapf" style={{ gap: 8 }}>
            {Object.entries(TCGS).map(([key, tcgData]) => (
              <button
                key={key}
                className={`chip ${tcg === key ? "chip-active" : ""}`}
                onClick={() => setTcg(key)}
                style={{
                  background: tcg === key ? `${TCG_COLORS[key] || "var(--gold-2)"}22` : undefined,
                  borderColor: tcg === key ? TCG_COLORS[key] : undefined,
                  color: tcg === key ? TCG_COLORS[key] : undefined,
                }}
              >
                {typeof tcgData === "object" && tcgData !== null && "label" in tcgData
                  ? (tcgData as { label: string }).label
                  : key}
              </button>
            ))}
          </div>
        </section>

        {/* ════════════════ POR QUE TCGHUB? ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <SectionHead
            title="Por que o TCGHub?"
            subtitle="Inteligência antes do marketplace. Entenda sua coleção, depois negocie."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 18,
            }}
          >
            {WHY_CARDS.map((w) => {
              const Icon = w.icon;
              return (
                <Link
                  key={w.title}
                  href={w.href}
                  className="card card-pad col"
                  style={{
                    gap: 14,
                    textDecoration: "none",
                    color: "inherit",
                    borderColor: "var(--bg-3)",
                  }}
                >
                  <span
                    style={{
                      color: w.accent,
                      display: "inline-flex",
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Icon className="ic-lg" />
                  </span>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      {w.title}
                    </span>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: "var(--text-2)",
                        lineHeight: 1.5,
                      }}
                    >
                      {w.body}
                    </span>
                  </div>
                  <span
                    className="btn btn-ghost btn-sm"
                    style={{ alignSelf: "flex-start", marginTop: "auto" }}
                  >
                    {w.cta} <IconArrow />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ════════════════ TERMÔMETRO DO MERCADO ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <SectionHead
            title="Termômetro do mercado"
            subtitle="Cartas em movimento com Health Score — não é achismo, é dado."
            moreLabel="Ver mercado completo"
            moreHref="/mercado"
          />
          {trending.length === 0 ? (
            <div
              className="card card-pad"
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "var(--muted)",
              }}
            >
              {cardsLoading
                ? "Carregando tendências..."
                : `Nenhuma carta com preço encontrada para ${tcg}. Sincronizando dados de mercado...`}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                gap: 14,
              }}
            >
              {trending.map((c) => {
                const sparkData = genSpark(c.id.charCodeAt(1) || 1, c.mo >= 0);
                const moveIcon =
                  c.mo >= 0 ? (
                    <span style={{ color: "var(--up)" }}><IconUp /></span>
                  ) : (
                    <span style={{ color: "var(--down)" }}><IconDown /></span>
                  );
                return (
                  <Link
                    key={c.id}
                    href={`/carta/${c.id}`}
                    className="card card-pad col"
                    style={{
                      gap: 10,
                      textDecoration: "none",
                      color: "inherit",
                      borderColor: "var(--bg-3)",
                    }}
                  >
                    <div className="row between center">
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {c.name}
                      </span>
                      <TrendTag pct={c.mo} sm />
                    </div>
                    <div className="row between center">
                      <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
                        {c.base > 0 ? fmt(c.base) : "R$ —"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {c.set} · {c.rarity}
                      </span>
                    </div>
                    <Sparkline
                      points={sparkData}
                      color={c.mo >= 0 ? "var(--up)" : "var(--down)"}
                      width={160}
                      height={24}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ════════════════ PARA LOJISTAS ════════════════ */}
        <section style={{ marginBottom: 48 }}>
          <div
            className="card card-pad"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 24,
              alignItems: "center",
              borderColor: "var(--gold-bd)",
              background:
                "linear-gradient(120deg, var(--gold-bg), transparent 70%)",
            }}
          >
            <div className="col" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>
                Tem uma loja?
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                  maxWidth: 480,
                }}
              >
                BuyList inteligente, gestão de estoque, CRM de jogador e
                precificação automática. Feito pra quem vive de TCG.
              </span>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <Link href="/lojista" className="btn btn-gold">
                Abrir minha loja
              </Link>
              <Link href="/cadastrar" className="btn btn-ghost">
                Falar com vendas
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
