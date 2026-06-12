"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CARDS, MOVERS_UP, MOVERS_DOWN } from "@/data";
import { fmt, fmt0, TrendTag, Sparkline, genSpark, Chip } from "@/components/ui";
import { IconChart, IconArrow, IconUp, IconDown, IconStar, IconSearch } from "@/components/icons";
import type { Card } from "@/types";

export default function ExplorarPage() {
  const [showAllRising, setShowAllRising] = useState(false);
  const [showAllFalling, setShowAllFalling] = useState(false);

  // Rising cards — use cards sorted by week change
  const risingCards = useMemo(() => {
    return [...CARDS]
      .filter((c) => c.wk > 0)
      .sort((a, b) => b.wk - a.wk)
      .slice(0, 12);
  }, []);

  // Falling cards
  const fallingCards = useMemo(() => {
    return [...CARDS]
      .filter((c) => c.wk < 0)
      .sort((a, b) => a.wk - b.wk)
      .slice(0, 12);
  }, []);

  // Recently added (just use last cards in array)
  const recentCards = useMemo(() => {
    return [...CARDS].slice(-8).reverse();
  }, []);

  // "Para voce" section — picks diverse cards
  const forYouCards = useMemo(() => {
    return CARDS.filter((c) => c.base > 20 && c.base < 200).slice(0, 8);
  }, []);

  const visibleRising = showAllRising ? risingCards : risingCards.slice(0, 6);
  const visibleFalling = showAllFalling ? fallingCards : fallingCards.slice(0, 6);

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
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
            <span className="holo-text">Descubra</span> o mercado
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Cartas em alta, quedas para aproveitar e recomendacoes para voce.
          </p>
        </div>

        {/* Section: Em alta */}
        <div className="sec-head">
          <div>
            <h2>Em alta</h2>
            <div className="sub">Cartas que estao valorizando esta semana</div>
          </div>
        </div>

        <div
          className="row"
          style={{
            gap: 16,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 12,
            marginBottom: 32,
            scrollbarWidth: "thin",
          }}
        >
          {visibleRising.map((card) => (
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
                  borderColor: "var(--up-bg)",
                }}
              >
                {/* Card image */}
                <div
                  className={`cardimg ${card.art} ${card.foil ? "foil" : ""}`}
                  style={{
                    width: "100%",
                    aspectRatio: "2.5/3.5",
                    borderRadius: 10,
                  }}
                >
                  <div className="shine" />
                </div>

                <div className="col" style={{ gap: 4 }}>
                  <Sparkline
                    points={genSpark(card.id.charCodeAt(0) + 5, true)}
                    color="var(--up)"
                    width={120}
                    height={28}
                  />
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
                    {card.set}
                  </span>
                  <div className="row between center">
                    <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                      {fmt(card.base)}
                    </span>
                    <TrendTag pct={card.wk} sm />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {!showAllRising && risingCards.length > 6 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ flex: "0 0 auto", alignSelf: "center" }}
              onClick={() => setShowAllRising(true)}
            >
              Ver mais <IconArrow />
            </button>
          )}
        </div>

        {/* Section: Quedas */}
        <div className="sec-head">
          <div>
            <h2>Quedas</h2>
            <div className="sub">Oportunidades — cartas que cairam esta semana</div>
          </div>
        </div>

        <div
          className="row"
          style={{
            gap: 16,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 12,
            marginBottom: 32,
            scrollbarWidth: "thin",
          }}
        >
          {visibleFalling.map((card) => (
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
                  borderColor: "var(--down-bg)",
                }}
              >
                <div
                  className={`cardimg ${card.art} ${card.foil ? "foil" : ""}`}
                  style={{
                    width: "100%",
                    aspectRatio: "2.5/3.5",
                    borderRadius: 10,
                  }}
                >
                  <div className="shine" />
                </div>

                <div className="col" style={{ gap: 4 }}>
                  <Sparkline
                    points={genSpark(card.id.charCodeAt(0) + 30, false)}
                    color="var(--down)"
                    width={120}
                    height={28}
                  />
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
                    {card.set}
                  </span>
                  <div className="row between center">
                    <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                      {fmt(card.base)}
                    </span>
                    <TrendTag pct={card.wk} sm />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {!showAllFalling && fallingCards.length > 6 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ flex: "0 0 auto", alignSelf: "center" }}
              onClick={() => setShowAllFalling(true)}
            >
              Ver mais <IconArrow />
            </button>
          )}
        </div>

        {/* Section: Recem-adicionados */}
        <div className="sec-head">
          <div>
            <h2>Recem-adicionados</h2>
            <div className="sub">Ultimas cartas incluidas no catalogo</div>
          </div>
        </div>

        <div
          className="row"
          style={{
            gap: 16,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 12,
            marginBottom: 32,
            scrollbarWidth: "thin",
          }}
        >
          {recentCards.map((card) => (
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
              <div className="card card-pad col" style={{ gap: 10, borderColor: "var(--border)" }}>
                <div
                  className={`cardimg ${card.art} ${card.foil ? "foil" : ""}`}
                  style={{
                    width: "100%",
                    aspectRatio: "2.5/3.5",
                    borderRadius: 10,
                  }}
                >
                  <div className="shine" />
                </div>

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
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                    {card.set}
                  </span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                    {fmt(card.base)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Section: Para voce */}
        <div className="sec-head">
          <div>
            <h2>Para voce</h2>
            <div className="sub">Recomendacoes baseadas no seu perfil</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
            marginBottom: 32,
          }}
        >
          {forYouCards.map((card) => (
            <Link
              key={card.id}
              href={`/carta/${card.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="card card-pad row center" style={{ gap: 14 }}>
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
                  <div className="row between center">
                    <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                      {fmt(card.base)}
                    </span>
                    <TrendTag pct={card.wk} sm />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="card card-pad" style={{ textAlign: "center", borderColor: "var(--gold-bd)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div
              className="row center"
              style={{ gap: 8, justifyContent: "center", marginBottom: 8, color: "var(--gold-2)" }}
            >
              <IconChart />
              <IconStar />
            </div>
            <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Quer ver mais?
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Explore o mercado completo, veja o indice por TCG e encontre as cartas certas para sua colecao.
            </p>
            <Link href="/mercado" className="btn btn-gold btn-lg">
              <IconArrow /> Ver mercado completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
