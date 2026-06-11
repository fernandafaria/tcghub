import type React from "react";
import type { Card, Product } from "@/types";
import { IconUp, IconDown, IconArrow, IconCheck } from "@/components/icons";
import { CARD_COLORS } from "@/lib/colors";
const RARITY_INFO: Record<
  string,
  { gl: string; col?: string; holo?: boolean; label?: string }
> = {
  "Special Illustration": { gl: "★", holo: true, label: "Special Illu." },
  "Ultra Rare": { gl: "★", col: "var(--gold-2)", label: "Ultra Rare" },
  Mythic: { gl: "◆", col: "#e0853f", label: "Mythic" },
  Rare: { gl: "★", col: "#7fb0ff", label: "Rare" },
  "Super Rare": { gl: "★", col: "var(--gold-2)", label: "Super Rare" },
  "Secret Rare": { gl: "★", col: "var(--gold-2)", label: "Secret Rare" },
  Leader: { gl: "⬡", col: "var(--violet-2)", label: "Leader" },
  Legendary: { gl: "❖", col: "var(--gold-2)", label: "Legendary" },
};

function rarityOf(rarity: string) {
  return RARITY_INFO[rarity] || { gl: "●", col: "var(--muted)", label: rarity };
}

export function fmt(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmt0(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

// ─── TrendTag ────────────────────────────────────────────────────
export function TrendTag({
  pct,
  sm,
}: {
  pct: number;
  sm?: boolean;
}) {
  const up = pct >= 0;
  return (
    <span
      className={`tag ${up ? "tag-up" : "tag-down"}`}
      style={sm ? { fontSize: 11, padding: "2px 7px" } : undefined}
    >
      {up ? <IconUp /> : <IconDown />}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Sparkline ───────────────────────────────────────────────────
export function Sparkline({
  points,
  color,
  width = 120,
  height = 34,
}: {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const last = points[points.length - 1];
  const first = points[0];
  const up = last >= first;
  const c = color || (up ? "var(--up)" : "var(--down)");

  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / span) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastY = height - ((last - min) / span) * height;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <path
        d={d}
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={lastY.toFixed(1)} r={2.6} fill={c} />
    </svg>
  );
}

export function genSpark(seed: number, trendUp: boolean): number[] {
  const pts: number[] = [];
  let v = 50;
  for (let i = 0; i < 14; i++) {
    v +=
      Math.sin(seed + i * 0.9) * 6 +
      (trendUp ? 1.6 : -1.4) +
      Math.cos(seed * 2 + i) * 3;
    pts.push(Math.max(8, v));
  }
  return pts;
}

// ─── TypePips ──────────────────────────────────────────────────
export function TypePips({
  energy,
  size,
}: {
  energy: string[];
  size?: number;
}) {
  const s = size || 11;
  return (
    <span className="pips">
      {energy.map((e, i) => (
        <span
          key={i}
          className="pip"
          style={{
            background: CARD_COLORS[e] || "var(--muted)",
            width: s,
            height: s,
          }}
        />
      ))}
    </span>
  );
}

// ─── RarityGlyph ─────────────────────────────────────────────────
export function RarityGlyph({
  rarity,
  label,
}: {
  rarity: string;
  label?: boolean;
}) {
  const r = rarityOf(rarity);
  if (r.holo) {
    return (
      <span className="rar holo-text">
        <span className="gl">{r.gl}</span>
        {label ? r.label : ""}
      </span>
    );
  }
  return (
    <span className="rar" style={{ color: r.col }}>
      <span className="gl">{r.gl}</span>
      {label ? r.label : ""}
    </span>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────
export function Chip({
  active,
  children,
  className,
  ...props
}: {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`chip ${active ? "active" : ""} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────
type TagVariant = "gold" | "violet" | "teal" | "up" | "down" | "neutral";

export function TagUI({
  variant = "neutral",
  children,
  className,
}: {
  variant?: TagVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`tag tag-${variant} ${className ?? ""}`}>{children}</span>
  );
}

// ─── GameCard ────────────────────────────────────────────────────
export function GameCard({
  card,
  lg,
  className,
}: {
  card: Card;
  lg?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`gamecard ${lg ? "gc-lg" : ""} ${card.foil ? "is-foil foil" : ""} ${className ?? ""}`}
      style={{ ["--gc" as string]: card.gc || "var(--violet)" }}
    >
      <div className="gc-top">
        <span className="gc-name">{card.name}</span>
        <TypePips energy={card.energy} />
      </div>
      <div className={`gc-art ${card.foil ? "foil" : ""}`}>
        <span className="ph">art</span>
      </div>
      <div className="gc-foot">
        <RarityGlyph rarity={card.rarity} label />
        <span className="gc-price">{fmt0(card.base)}</span>
      </div>
    </div>
  );
}

// ─── CardTile ────────────────────────────────────────────────────
export function CardTile({
  card,
  className,
}: {
  card: Card;
  className?: string;
}) {
  return (
    <div className={`tile ${className ?? ""}`}>
      <div
        className={`cardimg ${card.art} ${card.foil ? "foil" : ""}`}
        style={{ boxShadow: "var(--sh-2)" }}
      >
        <div className="shine" />
        <div className="ph">
          {card.name}
          <br />· art ·
        </div>
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <TypePips energy={card.energy} />
        </div>
        {card.foil && (
          <div
            style={{ position: "absolute", top: 8, right: 9 }}
            className="rar holo-text"
          >
            <span className="gl">★</span>
          </div>
        )}
      </div>
      <div className="col gap-6">
        <div className="row between center" style={{ gap: 8 }}>
          <RarityGlyph rarity={card.rarity} />
          <TrendTag pct={card.wk} sm />
        </div>
        <div className="t-name">{card.name}</div>
        <div className="t-set mono">
          {card.set} · {card.num}
        </div>
        <div className="t-foot">
          <span className="t-price mono">{fmt(card.base)}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            a partir de
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ProductTile ─────────────────────────────────────────────────
export function ProductTile({
  product,
  wk,
  art,
  sub,
  offers,
  lastSold,
  className,
}: {
  product: Product;
  wk?: number;
  art?: string;
  sub?: string;
  offers?: number;
  lastSold?: number;
  className?: string;
}) {
  const aspect = product.cat === "graded" ? "2.5/3.5" : "1/1";
  return (
    <div className={`tile ${className ?? ""}`}>
      <div
        className={`cardimg ${art ?? ""}`}
        style={{
          aspectRatio: aspect,
          borderRadius: "var(--r-md)",
          boxShadow: "var(--sh-2)",
        }}
      >
        <div className="shine" />
        <div className="ph">
          {product.name}
          <br />· {product.cat === "graded" ? "slab" : "produto"} ·
        </div>
        {product.cat === "graded" && sub && (
          <div
            style={{ position: "absolute", top: 8, left: 8 }}
            className="tag tag-gold"
          >
            {sub}
          </div>
        )}
      </div>
      <div className="col gap-4">
        <div className="row between center" style={{ gap: 8 }}>
          {sub && (
            <span className="tag tag-neutral" style={{ fontSize: 10 }}>
              {sub}
            </span>
          )}
          {wk !== undefined && wk !== 0 && <TrendTag pct={wk} sm />}
        </div>
        <div className="t-name">{product.name}</div>
        <div className="t-set mono">
          {product.cat === "graded" ? sub : product.cat}
        </div>
        {lastSold && (
          <div
            className="row between center"
            style={{
              marginTop: 4,
              padding: "7px 10px",
              background: "var(--bg-2)",
              borderRadius: "var(--r-xs)",
              fontSize: "11.5px",
            }}
          >
            <span style={{ color: "var(--muted)" }}>
              Últ. venda · PriceCharting
            </span>
            <span className="mono" style={{ fontWeight: 600 }}>
              {fmt0(lastSold)}
            </span>
          </div>
        )}
        <div className="row between center" style={{ marginTop: 6 }}>
          <div className="col" style={{ gap: 1 }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 17 }}>
              {fmt(product.price)}
            </span>
            {offers && (
              <span
                className="mono"
                style={{ fontSize: "10.5px", color: "var(--muted)" }}
              >
                menor entre {offers} lojas
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SectionHead ─────────────────────────────────────────────────
export function SectionHead({
  title,
  subtitle,
  moreLabel,
  moreHref,
}: {
  title: string;
  subtitle?: string;
  moreLabel?: string;
  moreHref?: string;
}) {
  return (
    <div className="sec-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>
      {moreLabel && (
        <a className="more" href={moreHref ?? "#"}>
          {moreLabel} <IconArrow />
        </a>
      )}
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────
export function Stepper({
  steps,
  active,
}: {
  steps: string[];
  active: number; // 1-indexed
}) {
  return (
    <div className="stepper">
      {steps.map((s, i) => {
        const n = i + 1;
        const cls = n < active ? "done" : n === active ? "active" : "";
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {i > 0 && <span className="sep" />}
            <span className={`st ${cls}`}>
              <span className="n">{n < active ? <IconCheck /> : n}</span>
              {s}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ─── CardFan ─────────────────────────────────────────────────────
export function CardFan({
  left,
  mid,
  right,
}: {
  left: Card;
  mid: Card;
  right: Card;
}) {
  return (
    <div className="cardfan">
      <div className="gamecard c-left">
        <div className="gc-top">
          <span className="gc-name">{left.name}</span>
          <TypePips energy={left.energy} />
        </div>
        <div className={`gc-art ${left.foil ? "foil" : ""}`}>
          <span className="ph">art</span>
        </div>
        <div className="gc-foot">
          <RarityGlyph rarity={left.rarity} label />
          <span className="gc-price">{fmt0(left.base)}</span>
        </div>
      </div>
      <div className={`gamecard c-mid ${mid.foil ? "is-foil foil" : ""}`} style={{ ["--gc" as string]: mid.gc }}>
        <div className="gc-top">
          <span className="gc-name">{mid.name}</span>
          <TypePips energy={mid.energy} />
        </div>
        <div className={`gc-art ${mid.foil ? "foil" : ""}`}>
          <span className="ph">art</span>
        </div>
        <div className="gc-foot">
          <RarityGlyph rarity={mid.rarity} label />
          <span className="gc-price">{fmt0(mid.base)}</span>
        </div>
      </div>
      <div className="gamecard c-right">
        <div className="gc-top">
          <span className="gc-name">{right.name}</span>
          <TypePips energy={right.energy} />
        </div>
        <div className={`gc-art ${right.foil ? "foil" : ""}`}>
          <span className="ph">art</span>
        </div>
        <div className="gc-foot">
          <RarityGlyph rarity={right.rarity} label />
          <span className="gc-price">{fmt0(right.base)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── StoreCard ───────────────────────────────────────────────────
export function StoreBadge({
  name,
  verified,
}: {
  name: string;
  verified: boolean;
}) {
  return (
    <span
      className="row center gap-6"
      style={{
        fontSize: "12.5px",
        color: "var(--text-2)",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
      }}
    >
      {verified && (
        <span style={{ color: "var(--teal)", display: "inline-flex" }}>
          <svg className="ic" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 2 3.5 4v4c0 3 2 5.5 5 6.5 3-1 5-3.5 5-6.5V4Z" />
            <path d="m6.5 8.5 1.5 1.5 2.5-2.7" />
          </svg>
        </span>
      )}
      <b style={{ fontWeight: 600 }}>{name}</b>
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="mono" style={{ color: "var(--gold-2)", fontSize: 12 }}>
      ★ {rating.toFixed(1)}
    </span>
  );
}
