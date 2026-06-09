"use client";

import { useState } from "react";
import Link from "next/link";
import { COLLECTION_SETS, COLLECTION_SUMMARY } from "@/data";
import { fmt0 } from "@/components/ui";
import { IconHeart, IconStar, IconBell, IconArrow, IconGrid, IconLayers } from "@/components/icons";

// ─── Ghost slots for missing cards ──────────────────────────────
function GhostSlots({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
        <div key={i} className="ghost" style={{ width: 60 }}>
          <span>?</span>
        </div>
      ))}
      {count > 8 && (
        <div className="ghost" style={{ width: 60 }}>
          <span>+{count - 8}</span>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ───────────────────────────────────────────────────────
type ActionState = Record<string, { wish: boolean; fut: boolean; fol: boolean }>;

export default function ColecaoPage() {
  const [actions, setActions] = useState<ActionState>({});

  const toggle = (code: string, key: "wish" | "fut" | "fol") => {
    setActions((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [key]: !(prev[code]?.[key] ?? false),
      },
    }));
  };

  const isOn = (code: string, key: "wish" | "fut" | "fol") =>
    actions[code]?.[key] ?? false;

  const totalOwned = COLLECTION_SETS.reduce((s, set) => s + set.owned, 0);
  const totalCards = COLLECTION_SETS.reduce((s, set) => s + set.total, 0);
  const completionPct = Math.round((totalOwned / totalCards) * 100);
  const totalValue = COLLECTION_SUMMARY.totalValue;

  return (
    <div className="page">
      <div className="wrap">
        {/* ════════════════ HEADER ════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Minha coleção · TCGHub
          </div>
          <h1
            style={{
              fontFamily: "var(--fdisplay)",
              fontSize: "clamp(24px, 3vw, 34px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            <span className="holo-text">Seu tesouro</span> em R$
          </h1>

          {/* Stats row */}
          <div
            className="card card-pad"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 20,
              borderColor: "var(--gold-bd)",
              background: "linear-gradient(120deg, var(--gold-bg), transparent 60%)",
            }}
          >
            <div className="stat col" style={{ gap: 4 }}>
              <span className="k">Valor total estimado</span>
              <span className="mono" style={{ fontSize: 26, color: "var(--gold-2)", fontWeight: 700 }}>
                {fmt0(totalValue)}
              </span>
              <span className="tag tag-up" style={{ marginTop: 2, alignSelf: "flex-start" }}>
                +{COLLECTION_SUMMARY.monthChange}% no mês
              </span>
            </div>
            <div className="stat col" style={{ gap: 4 }}>
              <span className="k">Completo</span>
              <span className="mono" style={{ fontSize: 26, fontWeight: 700 }}>
                {completionPct}%
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {totalOwned} de {totalCards} cartas
              </span>
            </div>
            <div className="stat col" style={{ gap: 4 }}>
              <span className="k">Sets</span>
              <span className="mono" style={{ fontSize: 26, fontWeight: 700 }}>
                {COLLECTION_SETS.length}
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {COLLECTION_SUMMARY.foilCount} foils
              </span>
            </div>
          </div>

          {/* Overall progress bar */}
          <div style={{ marginTop: 18 }}>
            <div className="row between" style={{ marginBottom: 6, gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Progresso geral da coleção
              </span>
              <span className="mono" style={{ fontSize: 13, color: "var(--gold-2)" }}>
                {completionPct}%
              </span>
            </div>
            <div className="bar" style={{ height: 9 }}>
              <i style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>

        {/* ════════════════ SETS GRID ════════════════ */}
        <div className="sec-head" style={{ marginBottom: 18 }}>
          <div>
            <h2>Seus sets</h2>
            <div className="sub">{COLLECTION_SETS.length} coleções · 5 TCGs</div>
          </div>
        </div>

        <div className="setgrid" style={{ marginBottom: 40 }}>
          {COLLECTION_SETS.map((set) => {
            const setPct = Math.round((set.owned / set.total) * 100);
            const missing = set.total - set.owned;

            return (
              <div key={set.code} className="setcard" style={{ ["--sa" as string]: set.sa }}>
                {/* Set head */}
                <div className="sc-head">
                  <span className="sc-code">{set.code}</span>
                  <span
                    style={{
                      fontFamily: "var(--fdisplay)",
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "var(--text)",
                      textShadow: "0 1px 3px rgba(0,0,0,.4)",
                    }}
                  >
                    {set.name}
                  </span>
                </div>

                {/* Set body */}
                <div className="sc-body">
                  <div className="row between" style={{ gap: 8 }}>
                    <span className="sc-name">{set.name}</span>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                      {set.owned}/{set.total}
                    </span>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="row between" style={{ marginBottom: 4, gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{setPct}% completo</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Faltam {missing}</span>
                    </div>
                    <div className="bar" style={{ height: 7 }}>
                      <i style={{ width: `${setPct}%` }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="row between" style={{ gap: 8 }}>
                    <div className="col" style={{ gap: 2 }}>
                      <span className="mono" style={{ fontSize: 13, color: "var(--gold-2)", fontWeight: 600 }}>
                        {fmt0(set.value)}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Valor</span>
                    </div>
                    <div className="col" style={{ gap: 2 }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                        {set.foil}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Foils</span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="qa">
                    <button
                      className={isOn(set.code, "wish") ? "on wish" : ""}
                      onClick={() => toggle(set.code, "wish")}
                      title="Adicionar à lista de desejos"
                    >
                      <IconHeart className="ic" /> Wishlist
                    </button>
                    <button
                      className={isOn(set.code, "fut") ? "on fut" : ""}
                      onClick={() => toggle(set.code, "fut")}
                      title="Marcar para investimento futuro"
                    >
                      <IconStar className="ic" /> Futuro
                    </button>
                    <button
                      className={isOn(set.code, "fol") ? "on fol" : ""}
                      onClick={() => toggle(set.code, "fol")}
                      title="Acompanhar preço"
                    >
                      <IconBell className="ic" /> Track
                    </button>
                  </div>

                  {/* Ghost slots */}
                  {missing > 0 && <GhostSlots count={missing} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* ════════════════ CTA ════════════════ */}
        <div className="card card-pad" style={{ textAlign: "center", borderColor: "var(--gold-bd)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="row center" style={{ gap: 8, justifyContent: "center", marginBottom: 8, color: "var(--gold-2)" }}>
              <IconGrid />
              <IconLayers />
            </div>
            <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Descubra o que está em alta
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Explore todas as coleções, veja o que falta e monitore o valor das suas
              cartas em tempo real.
            </p>
            <Link href="/colecoes" className="btn btn-gold btn-lg">
              <IconArrow /> Explorar coleções
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
