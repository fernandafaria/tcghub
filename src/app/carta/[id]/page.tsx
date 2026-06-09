"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CARDS, STORES, cardById } from "@/data";
import type { Card, CardOffer } from "@/types";
import {
  IconBack, IconArrow, IconBell, IconChart, IconBrain, IconSearch,
  IconCart, IconUp, IconDown, IconShield, IconCheck, IconHeart,
} from "@/components/icons";
import {
  GameCard, TrendTag, Sparkline, genSpark, TagUI, RarityGlyph,
  EnergyPips, StoreBadge, Stars, fmt, fmt0,
} from "@/components/ui";
import { toast } from "@/components/Toaster";

// ─── Mock offer generator ──────────────────────────────────────────────────

function generateOffers(card: Card): CardOffer[] {
  const conditions = ["NM", "NM", "SP", "NM", "MP", "NM", "NM"];
  return STORES.slice(0, 7).map((store, i) => {
    const cond = conditions[i % conditions.length];
    const multi = cond === "NM" ? 1.0 : cond === "SP" ? 0.82 : 0.65;
    const price = Math.round(card.base * multi * (0.92 + Math.random() * 0.18));
    return {
      store,
      cond,
      price,
      stock: Math.max(1, Math.floor(Math.random() * 12)),
    };
  }).sort((a, b) => a.price - b.price);
}

// ─── Synergy card mock (related cards) ─────────────────────────────────────

function findSynergies(card: Card): Card[] {
  const sameTcg = CARDS.filter((c) => c.tcg === card.tcg && c.id !== card.id);
  const sameTags = sameTcg.filter((c) =>
    c.tags.some((t) => card.tags.includes(t))
  );
  const pool = sameTags.length >= 4 ? sameTags : sameTcg;
  return pool.slice(0, 4);
}

// ─── CONDITION DISPLAY ─────────────────────────────────────────────────────

const COND_LABELS: Record<string, string> = {
  NM: "Near Mint",
  SP: "Slightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
};

const COND_TABS = ["Todos", "NM", "SP", "MP"];

// ─── CARD DETAIL PAGE ──────────────────────────────────────────────────────

export default function CardDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const card = useMemo(() => cardById(id), [id]);

  const [conditionFilter, setConditionFilter] = useState("Todos");
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // If card not found
  if (!card) {
    return (
      <div className="page">
        <div className="wrap" style={{ textAlign: "center", paddingTop: 80 }}>
          <h1 style={{ fontFamily: "var(--fdisplay)", fontSize: 28, fontWeight: 700 }}>
            Carta não encontrada
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 12 }}>
            A carta com ID <span className="mono">{id}</span> não foi encontrada.
          </p>
          <Link href="/" className="btn btn-gold" style={{ marginTop: 24 }}>
            <IconBack /> Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const offers = useMemo(() => generateOffers(card), [card]);
  const synergies = useMemo(() => findSynergies(card), [card]);

  const filteredOffers =
    conditionFilter === "Todos"
      ? offers
      : offers.filter((o) => o.cond === conditionFilter);

  const prices = offers.map((o) => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const storeCount = new Set(offers.map((o) => o.store.id)).size;

  // Sparkline data for price history
  const sparkPoints = useMemo(
    () => genSpark(card.id.charCodeAt(0) + card.id.charCodeAt(1) || 7, card.mo >= 0),
    [card]
  );

  const handleBuy = (offer: CardOffer) => {
    toast(`${card.name} (${offer.cond}) adicionado ao carrinho — ${fmt(offer.price)}`);
    setAddedToCart(true);
  };

  const handleWishlist = () => {
    setWishlisted(!wishlisted);
    toast(
      wishlisted
        ? `${card.name} removido da wishlist`
        : `${card.name} adicionado à wishlist!`
    );
  };

  const handleWatchAlert = () => {
    toast(`Alerta de preço ativado para ${card.name}!`);
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* Back link */}
        <Link href="/" className="back">
          <IconBack /> Voltar
        </Link>

        {/* ════════ MAIN 2-COL ════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 36,
            alignItems: "start",
          }}
        >
          {/* ─────── LEFT COLUMN ─────── */}
          <div
            className="col"
            style={{ gap: 24, position: "sticky", top: "calc(var(--nav-h) + 20px)" }}
          >
            {/* Large Game Card */}
            <GameCard card={card} lg />

            {/* Preço Inteligente card — violet border */}
            <div
              className="card card-pad col"
              style={{ gap: 14, borderColor: "var(--violet-bd)" }}
            >
              <div className="row between center">
                <span className="tag tag-violet">
                  <IconBrain /> Preço inteligente · IA
                </span>
                <TrendTag pct={card.mo} />
              </div>

              {/* Sparkline */}
              <div
                className="col"
                style={{
                  gap: 6,
                  padding: "10px 12px",
                  background: "var(--bg-2)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                <Sparkline
                  points={sparkPoints}
                  color={card.mo >= 0 ? "var(--up)" : "var(--down)"}
                  width={180}
                  height={40}
                />
                <div className="row between center">
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                    Últimos 30 dias
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: card.mo >= 0 ? "var(--up)" : "var(--down)",
                    }}
                  >
                    {card.mo >= 0 ? "+" : ""}
                    {card.mo.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div
                className="row between wrapf"
                style={{
                  gap: 12,
                  padding: "10px 12px",
                  background: "var(--surface)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                <div className="col" style={{ gap: 2, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                    Preço base
                  </span>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
                    {fmt0(card.base)}
                  </span>
                </div>
                <div className="col" style={{ gap: 2, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                    7 dias
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: card.wk >= 0 ? "var(--up)" : "var(--down)",
                    }}
                  >
                    {card.wk >= 0 ? "+" : ""}
                    {card.wk.toFixed(1)}%
                  </span>
                </div>
                <div className="col" style={{ gap: 2, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                    30 dias
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: card.mo >= 0 ? "var(--up)" : "var(--down)",
                    }}
                  >
                    {card.mo >= 0 ? "+" : ""}
                    {card.mo.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* AI Meta Analysis */}
              <div
                className="col"
                style={{
                  gap: 6,
                  padding: "12px",
                  background: "var(--violet-bg)",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--violet-bd)",
                }}
              >
                <div className="row center" style={{ gap: 7 }}>
                  <span style={{ color: "var(--violet-2)", display: "inline-flex" }}><IconBrain className="ic" /></span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--violet-2)" }}>
                    Análise de meta
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>
                  {card.meta}
                </p>
              </div>

              {/* Stats footer */}
              <div className="row between wrapf" style={{ gap: 8 }}>
                <span className="tag tag-neutral">
                  <IconShield /> Compra protegida
                </span>
                <span className="tag tag-neutral">
                  <span className="mono">{storeCount}</span> lojas
                </span>
                {card.rarity && (
                  <span className="tag tag-gold">
                    <RarityGlyph rarity={card.rarity} />
                  </span>
                )}
              </div>
            </div>

            {/* Sinergias card — gold border */}
            <div
              className="card card-pad col"
              style={{ gap: 14, borderColor: "var(--gold-bd)" }}
            >
              <div className="row center" style={{ gap: 8 }}>
                <span style={{ color: "var(--gold-2)", display: "inline-flex" }}><IconChart className="ic" /></span>
                <span
                  style={{
                    fontFamily: "var(--fdisplay)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Sinergias
                </span>
                <span className="tag tag-gold">jogam juntos</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                Cartas que aparecem com <b>{card.name}</b> em decks vencedores
              </span>

              <div className="col" style={{ gap: 8 }}>
                {synergies.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/carta/${s.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      className="row center"
                      style={{
                        gap: 12,
                        padding: "10px 12px",
                        background: "var(--surface)",
                        borderRadius: "var(--r-sm)",
                        transition: "0.16s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--card-2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--surface)";
                      }}
                    >
                      <div
                        className={`cardimg ${s.art} ${s.foil ? "foil" : ""}`}
                        style={{
                          width: 40,
                          aspectRatio: "2.5/3.5",
                          borderRadius: 6,
                          flex: "0 0 auto",
                        }}
                      >
                        <div className="shine" />
                      </div>
                      <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.name}
                        </span>
                        <span
                          className="mono"
                          style={{ fontSize: 10.5, color: "var(--muted)" }}
                        >
                          {s.set} · {fmt0(s.base)}
                        </span>
                      </div>
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--muted)",
                          flex: "0 0 auto",
                        }}
                      >
                        <IconArrow />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ─────── RIGHT COLUMN ─────── */}
          <div
            className="col"
            style={{ gap: 24, position: "sticky", top: "calc(var(--nav-h) + 20px)" }}
          >
            {/* Card identity */}
            <div className="col" style={{ gap: 8 }}>
              <div className="row between center wrapf" style={{ gap: 12 }}>
                <div className="col" style={{ gap: 4 }}>
                  <h1
                    style={{
                      fontFamily: "var(--fdisplay)",
                      fontSize: "clamp(24px, 3vw, 34px)",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.0,
                    }}
                  >
                    {card.name}
                  </h1>
                  <div className="row center" style={{ gap: 10 }}>
                    <span
                      className="mono"
                      style={{ fontSize: 13, color: "var(--muted)" }}
                    >
                      {card.set} · {card.num}
                    </span>
                    <RarityGlyph rarity={card.rarity} label />
                    {card.foil && (
                      <span className="tag tag-gold" style={{ fontSize: 10 }}>
                        Foil
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="row" style={{ gap: 6, flex: "0 0 auto" }}>
                  <EnergyPips energy={card.energy} size={14} />
                </div>
              </div>

              {/* Meta tags */}
              {card.tags.length > 0 && (
                <div className="row gap-8 wrapf" style={{ marginTop: 4 }}>
                  {card.tags.map((tag) => (
                    <TagUI key={tag} variant="gold">
                      {tag}
                    </TagUI>
                  ))}
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div
              className="card card-pad col"
              style={{ gap: 16 }}
            >
              <div className="row between center">
                <span className="eyebrow">Resumo de preço</span>
                <span className="tag tag-neutral">
                  <span className="mono">{offers.length}</span> ofertas
                </span>
              </div>

              <div
                className="row between wrapf"
                style={{
                  gap: 12,
                  padding: "14px 16px",
                  background: "var(--bg-2)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                <div className="col" style={{ gap: 2, alignItems: "center", flex: 1 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                    Mínimo
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 18, fontWeight: 700, color: "var(--up)" }}
                  >
                    {fmt(minPrice)}
                  </span>
                </div>
                <div className="col" style={{ gap: 2, alignItems: "center", flex: 1 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                    Médio
                  </span>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
                    {fmt(avgPrice)}
                  </span>
                </div>
                <div className="col" style={{ gap: 2, alignItems: "center", flex: 1 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                    Máximo
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 18, fontWeight: 700, color: "var(--down)" }}
                  >
                    {fmt(maxPrice)}
                  </span>
                </div>
              </div>

              {/* Condition tabs */}
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {COND_TABS.map((c) => (
                  <button
                    key={c}
                    className={`chip ${conditionFilter === c ? "active" : ""}`}
                    onClick={() => setConditionFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Store offer table */}
              <div className="col" style={{ gap: 8 }}>
                <div
                  className="row"
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    color: "var(--muted)",
                    fontFamily: "var(--fmono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    gap: 8,
                  }}
                >
                  <span style={{ flex: 1 }}>Loja</span>
                  <span style={{ width: 56, textAlign: "center" }}>Cond.</span>
                  <span style={{ width: 28, textAlign: "center" }}>Qtd.</span>
                  <span style={{ width: 80, textAlign: "right" }}>Preço</span>
                  <span style={{ width: 70 }} />
                </div>

                {filteredOffers.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 0",
                      color: "var(--muted)",
                      fontSize: 13,
                    }}
                  >
                    Nenhuma oferta encontrada para essa condição.
                  </div>
                ) : (
                  filteredOffers.map((offer, i) => (
                    <div
                      key={`${offer.store.id}-${i}`}
                      className="row center"
                      style={{
                        gap: 8,
                        padding: "10px 10px",
                        background: "var(--surface)",
                        borderRadius: "var(--r-sm)",
                        cursor: "pointer",
                        transition: "0.16s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--card-2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--surface)";
                      }}
                    >
                      {/* Store info */}
                      <div
                        className="col"
                        style={{ flex: 1, minWidth: 0, gap: 2 }}
                      >
                        <StoreBadge
                          name={offer.store.name}
                          verified={offer.store.verified}
                        />
                        <div className="row center" style={{ gap: 8 }}>
                          <span
                            className="mono"
                            style={{ fontSize: 10.5, color: "var(--muted)" }}
                          >
                            {offer.store.city}
                          </span>
                          <Stars rating={offer.store.rating} />
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--teal)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <span style={{ display: "inline-flex" }}><IconShield /></span>
                            {offer.store.ships}
                          </span>
                        </div>
                      </div>

                      {/* Condition */}
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          width: 56,
                          textAlign: "center",
                          color: "var(--text-2)",
                          fontWeight: 500,
                        }}
                      >
                        {offer.cond}
                      </span>

                      {/* Stock */}
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          width: 28,
                          textAlign: "center",
                          color: "var(--muted)",
                        }}
                      >
                        {offer.stock}
                      </span>

                      {/* Price */}
                      <span
                        className="mono"
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          width: 80,
                          textAlign: "right",
                        }}
                      >
                        {fmt(offer.price)}
                      </span>

                      {/* Buy button */}
                      <button
                        className="btn btn-gold btn-sm"
                        style={{ width: 70 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuy(offer);
                        }}
                      >
                        <span style={{ display: "inline-flex" }}><IconCart /></span>{" "}
                        Comprar
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Action buttons */}
              <div className="row" style={{ gap: 10 }}>
                <button
                  className={`btn btn-ghost ${wishlisted ? "" : ""}`}
                  style={{
                    flex: 1,
                    color: wishlisted ? "#e8688c" : "var(--text-2)",
                    background: wishlisted
                      ? "color-mix(in oklch, #e8688c 14%, transparent)"
                      : "var(--surface)",
                    borderColor: wishlisted
                      ? "color-mix(in oklch, #e8688c 36%, transparent)"
                      : "var(--border)",
                  }}
                  onClick={handleWishlist}
                >
                  <span style={{ color: wishlisted ? "#e8688c" : "var(--muted)", display: "inline-flex" }}>
                    <IconHeart className="ic" />
                  </span>
                  {wishlisted ? "Na wishlist" : "Wishlist"}
                </button>
                <button className="btn btn-violet" onClick={handleWatchAlert}>
                  <IconBell /> Alerta de preço
                </button>
              </div>

              {/* Meta text */}
              {card.meta && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-2)",
                    lineHeight: 1.5,
                    padding: "10px 12px",
                    background: "var(--violet-bg)",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--violet-bd)",
                  }}
                >
                  <span style={{ color: "var(--violet-2)", display: "inline", marginRight: 6 }}><IconBrain className="ic" /></span>
                  {card.meta}
                </p>
              )}
            </div>

            {/* Trust */}
            <div
              className="card card-pad"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "var(--teal-bg)",
                borderColor: "var(--teal-bd)",
              }}
            >
              <div className="row center" style={{ gap: 8 }}>
                <span style={{ color: "var(--teal)", display: "inline-flex" }}><IconShield className="ic" /></span>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--teal-2)" }}>
                  Compra protegida
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                O pagamento fica retido até você confirmar que recebeu a carta
                na condição anunciada. Loja verificada, entrega rastreada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
