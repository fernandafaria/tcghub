"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { CARDS, STORES, cardById } from "@/data";
import type { Card, CardOffer } from "@/types";
import {
  IconBack, IconArrow, IconBell, IconChart, IconBrain,
  IconCart, IconUp, IconDown, IconShield, IconHeart,
} from "@/components/icons";
import {
  GameCard, TrendTag, Sparkline, genSpark, TagUI, RarityGlyph,
  TypePips, StoreBadge, Stars, fmt, fmt0,
} from "@/components/ui";
import { toast } from "@/components/Toaster";

// ─── Mock offer generator ──────────────────────────────────────────────────

function generateOffers(card: Card): CardOffer[] {
  const conditions = ["NM", "NM", "SP", "NM", "MP", "NM", "NM"];
  return STORES.slice(0, 7).map((store, i) => {
    const cond = conditions[i % conditions.length];
    const multi = cond === "NM" ? 1.0 : cond === "SP" ? 0.82 : 0.65;
    const price = Math.round(card.base * multi * (0.92 + Math.random() * 0.18));
    return { store, cond, price, stock: Math.max(1, Math.floor(Math.random() * 12)) };
  }).sort((a, b) => a.price - b.price);
}

// ─── Synergy card mock ─────────────────────────────────────────────────────

function findSynergies(card: Card, allCards: Card[]): Card[] {
  const sameTcg = allCards.filter((c) => c.tcg === card.tcg && c.id !== card.id);
  const sameTags = sameTcg.filter((c) => c.tags.some((t) => card.tags.includes(t)));
  const pool = sameTags.length >= 4 ? sameTags : sameTcg;
  return pool.slice(0, 4);
}

// ─── CONDITION DISPLAY ─────────────────────────────────────────────────────

const COND_LABELS: Record<string, string> = {
  NM: "Near Mint", SP: "Slightly Played", MP: "Moderately Played", HP: "Heavily Played",
};
const COND_TABS = ["Todos", "NM", "SP", "MP"];

// ─── CARD DETAIL CLIENT ────────────────────────────────────────────────────

interface Props {
  initialCard: Card;
}

export default function CardDetailClient({ initialCard }: Props) {
  const [conditionFilter, setConditionFilter] = useState("Todos");
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const card = initialCard;
  const allCards = CARDS; // mock pool for synergies

  const offers = useMemo(() => generateOffers(card), [card]);
  const synergies = useMemo(() => findSynergies(card, allCards), [card]);

  const filteredOffers = conditionFilter === "Todos"
    ? offers
    : offers.filter((o) => o.cond === conditionFilter);

  const prices = offers.map((o) => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const storeCount = new Set(offers.map((o) => o.store.id)).size;

  const sparkPoints = useMemo(
    () => genSpark(card.id.charCodeAt(0) + (card.id.charCodeAt(1) || 7), card.mo >= 0),
    [card]
  );

  // Health Score
  const [health, setHealth] = useState<{ score: number; grade: string; recommendation: string; factors: Record<string,number>; summary: string } | null>(null);
  useEffect(() => {
    fetch(`/api/health/${card.id}`)
      .then(r => r.json())
      .then(d => { if (d.score) setHealth(d); })
      .catch(() => {});
  }, [card.id]);

  const recLabel: Record<string, string> = { buy: "Comprar", hold: "Manter", sell: "Vender" };
  const recColor: Record<string, string> = { buy: "var(--up)", hold: "var(--gold)", sell: "var(--down)" };

  const handleBuy = (offer: CardOffer) => {
    toast(`${card.name} (${offer.cond}) adicionado ao carrinho — ${fmt(offer.price)}`);
    setAddedToCart(true);
  };

  const handleWishlist = () => {
    setWishlisted(!wishlisted);
    toast(wishlisted ? `${card.name} removido da wishlist` : `${card.name} adicionado à wishlist!`);
  };

  const handleWatchAlert = () => {
    toast(`Alerta de preço ativado para ${card.name}!`);
  };

  return (
    <div className="page">
      <div className="wrap">
        <Link href="/" className="back"><IconBack /> Voltar</Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start" }}>
          {/* LEFT COLUMN */}
          <div className="col" style={{ gap: 24, position: "sticky", top: "calc(var(--nav-h) + 20px)" }}>
            <GameCard card={card} lg />

            {/* Preço Inteligente */}
            <div className="card card-pad col" style={{ gap: 14, borderColor: "var(--violet-bd)" }}>
              <div className="row between center">
                <span className="tag tag-violet"><IconBrain /> Preço inteligente · IA</span>
                <TrendTag pct={card.mo} />
              </div>
              <div className="col" style={{ gap: 6, padding: "10px 12px", background: "var(--bg-2)", borderRadius: "var(--r-sm)" }}>
                <Sparkline points={sparkPoints} color={card.mo >= 0 ? "var(--up)" : "var(--down)"} width={180} height={40} />
                <div className="row between center">
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>Últimos 30 dias</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: card.mo >= 0 ? "var(--up)" : "var(--down)" }}>
                    {card.mo >= 0 ? "+" : ""}{card.mo.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="row between wrapf" style={{ gap: 12, padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--r-sm)" }}>
                <div className="stat"><span className="k">Preço base</span><span className="v">{card.base > 0 ? fmt0(card.base) : "—"}</span></div>
                <div className="stat"><span className="k">7 dias</span><span className="v" style={{ color: card.wk >= 0 ? "var(--up)" : "var(--down)" }}>{card.wk !== 0 ? `${card.wk >= 0 ? "+" : ""}${card.wk.toFixed(1)}%` : "—"}</span></div>
                <div className="stat"><span className="k">30 dias</span><span className="v" style={{ color: card.mo >= 0 ? "var(--up)" : "var(--down)" }}>{card.mo !== 0 ? `${card.mo >= 0 ? "+" : ""}${card.mo.toFixed(1)}%` : "—"}</span></div>
              </div>

              {/* Health Score */}
              {health && (
                <div className="row between center" style={{ gap: 14, padding: "14px 16px", background: "var(--bg-2)", borderRadius: "var(--r-sm)" }}>
                  <div className="col" style={{ gap: 2, alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 32, fontWeight: 800, color: health.score >= 70 ? "var(--up)" : health.score >= 45 ? "var(--gold-2)" : "var(--down)" }}>
                      {health.score}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Health Score</span>
                  </div>
                  <div className="col grow" style={{ gap: 6 }}>
                    <div className="row center" style={{ gap: 8 }}>
                      <span className="tag" style={{ background: recColor[health.recommendation] + "22", color: recColor[health.recommendation], borderColor: recColor[health.recommendation] + "44", fontWeight: 700 }}>
                        {recLabel[health.recommendation]}
                      </span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Nota {health.grade}</span>
                    </div>
                    <div className="row" style={{ gap: 12 }}>
                      {Object.entries(health.factors).map(([k, v]) => (
                        <div key={k} className="col" style={{ gap: 2, alignItems: "center" }}>
                          <div className="bar" style={{ width: 40, height: 3 }}>
                            <i style={{ width: `${v}%`, background: "var(--violet)" }} />
                          </div>
                          <span className="mono" style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase" }}>{k.slice(0,4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!health && (
                <div className="col" style={{ gap: 6, padding: "12px", background: "var(--violet-bg)", borderRadius: "var(--r-sm)", border: "1px solid var(--violet-bd)" }}>
                  <div className="row center" style={{ gap: 7 }}>
                    <span style={{ color: "var(--violet-2)", display: "inline-flex" }}><IconBrain className="ic" /></span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--violet-2)" }}>Análise de meta</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>{card.meta || "Sem análise disponível para esta carta."}</p>
                </div>
              )}
              <div className="row between wrapf" style={{ gap: 8 }}>
                <span className="tag tag-neutral"><IconShield /> Compra protegida</span>
                <span className="tag tag-neutral"><span className="mono">{storeCount}</span> lojas</span>
                {card.rarity && (<span className="tag tag-gold"><RarityGlyph rarity={card.rarity} /></span>)}
              </div>
            </div>

            {/* Sinergias */}
            <div className="card card-pad col" style={{ gap: 14, borderColor: "var(--gold-bd)" }}>
              <div className="row center" style={{ gap: 8 }}>
                <span style={{ color: "var(--gold-2)", display: "inline-flex" }}><IconChart className="ic" /></span>
                <span style={{ fontFamily: "var(--fdisplay)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>Sinergias</span>
                <span className="tag tag-gold">jogam juntos</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>Cartas que aparecem com <b>{card.name}</b> em decks vencedores</span>
              <div className="col" style={{ gap: 8 }}>
                {synergies.map((s) => (
                  <Link key={s.id} href={`/carta/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="row center" style={{ gap: 12, padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--r-sm)" }}>
                      <div className={`cardimg ${s.art} ${s.foil ? "foil" : ""}`} style={{ width: 40, aspectRatio: "2.5/3.5", borderRadius: 6, flex: "0 0 auto" }}><div className="shine" /></div>
                      <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                        <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{s.set} · {fmt0(s.base)}</span>
                      </div>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", flex: "0 0 auto" }}><IconArrow /></span>
                    </div>
                  </Link>
                ))}
                {synergies.length === 0 && (<p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>Nenhuma sinergia encontrada.</p>)}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col" style={{ gap: 24, position: "sticky", top: "calc(var(--nav-h) + 20px)" }}>
            <div className="col" style={{ gap: 8 }}>
              <div className="row between center wrapf" style={{ gap: 12 }}>
                <div className="col" style={{ gap: 4 }}>
                  <h1 style={{ fontFamily: "var(--fdisplay)", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.0 }}>{card.name}</h1>
                  <div className="row center" style={{ gap: 10 }}>
                    <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>{card.set} · {card.num}</span>
                    <RarityGlyph rarity={card.rarity} label />
                    {card.foil && (<span className="tag tag-gold" style={{ fontSize: 10 }}>Foil</span>)}
                  </div>
                </div>
                <div className="row" style={{ gap: 6, flex: "0 0 auto" }}><TypePips energy={card.energy} size={14} /></div>
              </div>
              {card.tags.length > 0 && (
                <div className="row gap-8 wrapf" style={{ marginTop: 4 }}>
                  {card.tags.map((tag) => (<TagUI key={tag} variant="gold">{tag}</TagUI>))}
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="card card-pad col" style={{ gap: 16 }}>
              <div className="row between center">
                <span className="eyebrow">Resumo de preço</span>
                <span className="tag tag-neutral"><span className="mono">{offers.length}</span> ofertas</span>
              </div>
              <div className="row between wrapf" style={{ gap: 12, padding: "14px 16px", background: "var(--bg-2)", borderRadius: "var(--r-sm)" }}>
                <div className="col" style={{ gap: 2, alignItems: "center", flex: 1 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>Mínimo</span>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--up)" }}>{fmt(minPrice)}</span>
                </div>
                <div className="col" style={{ gap: 2, alignItems: "center", flex: 1 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>Médio</span>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{fmt(avgPrice)}</span>
                </div>
                <div className="col" style={{ gap: 2, alignItems: "center", flex: 1 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>Máximo</span>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--down)" }}>{fmt(maxPrice)}</span>
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {COND_TABS.map((c) => (
                  <button key={c} className={`chip ${conditionFilter === c ? "active" : ""}`} onClick={() => setConditionFilter(c)}>{c}</button>
                ))}
              </div>
              <div className="col" style={{ gap: 8 }}>
                {filteredOffers.map((offer, i) => (
                  <div key={i} className="row center between" style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--r-sm)" }}>
                    <div className="col" style={{ gap: 2 }}>
                      <div className="row center" style={{ gap: 8 }}>
                        <StoreBadge name={offer.store.name} verified={offer.store.verified} />
                        <Stars rating={offer.store.rating} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{COND_LABELS[offer.cond] || offer.cond} · {offer.stock} em estoque</span>
                    </div>
                    <div className="row center" style={{ gap: 10 }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{fmt(offer.price)}</span>
                      <button className="btn btn-gold btn-sm" onClick={() => handleBuy(offer)}><IconCart /> Comprar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-ghost" onClick={handleWishlist} style={{ flex: 1 }}><IconHeart /> {wishlisted ? "Na wishlist" : "Wishlist"}</button>
              <button className="btn btn-violet" onClick={handleWatchAlert} style={{ flex: 1 }}><IconBell /> Alerta de preço</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
