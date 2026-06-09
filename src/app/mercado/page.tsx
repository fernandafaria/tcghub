"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MOVERS_UP, MOVERS_DOWN, CARDS, TCGS } from "@/data";
import { fmt, fmt0, TrendTag, Sparkline, genSpark, Chip } from "@/components/ui";
import { IconChart, IconArrow, IconUp, IconDown, IconBell, IconStar } from "@/components/icons";

// ─── Trade volume simulation ────────────────────────────────────
const TOP_TRADED = CARDS.filter((c) => c.foil || c.tags.includes("Chase") || c.tags.includes("Meta"))
  .sort((a, b) => b.base - a.base)
  .slice(0, 12)
  .map((c) => ({
    ...c,
    volume: Math.floor(c.base * (0.4 + Math.random() * 1.2)),
  }));

// ─── Market index data ──────────────────────────────────────────
const MARKET_INDEX = [
  { tcg: "Pokémon", short: "PKM", change: +3.2, avg: 127.5, trend: true },
  { tcg: "Magic", short: "MTG", change: +1.8, avg: 198.3, trend: true },
  { tcg: "Yu-Gi-Oh!", short: "YGO", change: -0.9, avg: 86.7, trend: false },
  { tcg: "One Piece", short: "OP", change: +4.7, avg: 112.0, trend: true },
  { tcg: "Lorcana", short: "LOR", change: +2.4, avg: 67.8, trend: true },
];

// ─── PAGE ───────────────────────────────────────────────────────
export default function MercadoPage() {
  const [showAllUp, setShowAllUp] = useState(false);
  const [showAllDown, setShowAllDown] = useState(false);

  const upMovers = showAllUp ? MOVERS_UP : MOVERS_UP.slice(0, 4);
  const downMovers = showAllDown ? MOVERS_DOWN : MOVERS_DOWN.slice(0, 4);

  return (
    <div className="page">
      <div className="wrap">
        {/* ════════════════ HEADER ════════════════ */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Mercado · TCGHub
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
            <span className="holo-text">Mercado</span> em tempo real
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Maiores altas, quedas e o índice do mercado — dados atualizados semanalmente
          </p>
        </div>

        {/* ════════════════ ÍNDICE DO MERCADO ════════════════ */}
        <div className="sec-head">
          <div>
            <h2>Índice do mercado</h2>
            <div className="sub">Movimento médio de preço por TCG</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {MARKET_INDEX.map((idx) => (
            <div
              key={idx.short}
              className="card card-pad col"
              style={{ gap: 8, borderColor: idx.trend ? "var(--up-bg)" : "var(--down-bg)" }}
            >
              <div className="row between center">
                <span style={{ fontWeight: 600, fontSize: 14 }}>{idx.tcg}</span>
                <span className={`tag ${idx.trend ? "tag-up" : "tag-down"}`}>
                  {idx.trend ? <IconUp /> : <IconDown />}
                  {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: idx.trend ? "var(--up)" : "var(--down)" }}>
                  {fmt0(idx.avg)}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
                  preço médio
                </span>
              </div>
              <Sparkline
                points={genSpark(idx.short.charCodeAt(0), idx.trend)}
                color={idx.trend ? "var(--up)" : "var(--down)"}
                width={100}
                height={24}
              />
            </div>
          ))}
        </div>

        {/* ════════════════ MAIORES ALTAS ════════════════ */}
        <div className="sec-head">
          <div>
            <h2>Maiores altas da semana</h2>
            <div className="sub">Cartas que mais valorizaram nos últimos 7 dias</div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 32 }}>
          <div className="col gap-12">
            {upMovers.map((m, i) => (
              <div
                key={i}
                className="row center between"
                style={{
                  padding: "12px 0",
                  borderBottom: i < upMovers.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div className="row center" style={{ gap: 14, flex: 1, minWidth: 0 }}>
                  {/* Rank */}
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--gold-2)", minWidth: 24 }}>
                    {i + 1}
                  </span>

                  {/* Sparkline */}
                  <Sparkline
                    points={genSpark(i + 5, true)}
                    color="var(--up)"
                    width={80}
                    height={28}
                  />

                  {/* Info */}
                  <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.name}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {m.set}
                    </span>
                  </div>
                </div>

                <div className="row center" style={{ gap: 12, flexShrink: 0 }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                    {fmt(m.val)}
                  </span>
                  <span className="tag tag-up">
                    <IconUp />+{m.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}

            {!showAllUp && MOVERS_UP.length > 4 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: "center" }}
                onClick={() => setShowAllUp(true)}
              >
                Ver todas as altas <IconArrow />
              </button>
            )}
          </div>
        </div>

        {/* ════════════════ MAIORES QUEDAS ════════════════ */}
        <div className="sec-head">
          <div>
            <h2>Maiores quedas da semana</h2>
            <div className="sub">Cartas que mais desvalorizaram</div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 40 }}>
          <div className="col gap-12">
            {downMovers.map((m, i) => (
              <div
                key={i}
                className="row center between"
                style={{
                  padding: "12px 0",
                  borderBottom: i < downMovers.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div className="row center" style={{ gap: 14, flex: 1, minWidth: 0 }}>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--muted)", minWidth: 24 }}>
                    {i + 1}
                  </span>

                  <Sparkline
                    points={genSpark(i + 20, false)}
                    color="var(--down)"
                    width={80}
                    height={28}
                  />

                  <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.name}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {m.set}
                    </span>
                  </div>
                </div>

                <div className="row center" style={{ gap: 12, flexShrink: 0 }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                    {fmt(m.val)}
                  </span>
                  <span className="tag tag-down">
                    <IconDown />{m.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}

            {!showAllDown && MOVERS_DOWN.length > 4 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: "center" }}
                onClick={() => setShowAllDown(true)}
              >
                Ver todas as quedas <IconArrow />
              </button>
            )}
          </div>
        </div>

        {/* ════════════════ CARTAS MAIS NEGOCIADAS ════════════════ */}
        <div className="sec-head">
          <div>
            <h2>Cartas mais negociadas</h2>
            <div className="sub">Maior volume de transações nos últimos 30 dias</div>
          </div>
          <Link href="/carta" className="more" style={{ color: "var(--gold-2)", fontSize: "13.5px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
            Ver todas <IconArrow />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 18,
            marginBottom: 40,
          }}
        >
          {TOP_TRADED.map((card) => (
            <Link
              key={card.id}
              href={`/carta/${card.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="card card-pad"
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                {/* Card image */}
                <div
                  className={`cardimg ${card.art} ${card.foil ? "foil" : ""}`}
                  style={{
                    width: 56,
                    aspectRatio: "2.5/3.5",
                    borderRadius: 7,
                    flex: "0 0 auto",
                  }}
                >
                  <div className="shine" />
                </div>

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
                      {fmt(card.base)}
                    </span>
                    <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                      {card.volume} vendas
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ════════════════ CTA ════════════════ */}
        <div className="card card-pad" style={{ textAlign: "center", borderColor: "var(--gold-bd)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="row center" style={{ gap: 8, justifyContent: "center", marginBottom: 8, color: "var(--gold-2)" }}>
              <IconBell />
              <IconChart />
            </div>
            <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Fique de olho no seu tesouro
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Crie alertas de preço e seja notificado quando suas cartas favoritas
              valorizarem ou chegarem no preço ideal.
            </p>
            <Link href="/colecao" className="btn btn-gold btn-lg">
              <IconBell /> Criar alertas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
