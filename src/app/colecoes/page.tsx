"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { COLLECTION_SETS, cardsByTcg, TCGS, CARDS, COLLECTION_SUMMARY } from "@/data";
import { fmt0, CardTile } from "@/components/ui";
import { IconArrow, IconCards, IconStar, IconBell, IconHeart } from "@/components/icons";
import type { Card } from "@/types";

// ─── PAGE ───────────────────────────────────────────────────────
export default function ColecoesPage() {
  const [tcg, setTcg] = useState("pokemon");
  const [selectedSet, setSelectedSet] = useState<string>("");

  const sets = useMemo(() => COLLECTION_SETS.filter((s) => s.tcg === tcg), [tcg]);
  const setCards = useMemo(() => {
    if (!selectedSet) return [];
    return CARDS.filter((c) => c.set === selectedSet);
  }, [selectedSet]);

  const handleSetClick = (setName: string) => {
    setSelectedSet(selectedSet === setName ? "" : setName);
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* ════════════════ HEADER ════════════════ */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Explorar coleções · TCGHub
          </div>
          <h1
            style={{
              fontFamily: "var(--fdisplay)",
              fontSize: "clamp(24px, 3vw, 34px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Todas as <span className="holo-text">coleções</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
            Navegue por todos os sets de cada TCG e descubra as cartas que faltam
          </p>
        </div>

        {/* ════════════════ TCG SWITCHER ════════════════ */}
        <div className="row wrapf gap-8" style={{ marginBottom: 24 }}>
          {TCGS.map((t) => (
            <button
              key={t.id}
              className={`chip ${t.id === tcg ? "active" : ""}`}
              onClick={() => {
                setTcg(t.id);
                setSelectedSet("");
              }}
            >
              <span className="dot" style={{ background: "var(--violet)" }} />
              {t.name}
            </button>
          ))}
        </div>

        {/* ════════════════ SETS GRID ════════════════ */}
        <div className="setgrid" style={{ marginBottom: 40 }}>
          {sets.map((set) => {
            const setPct = Math.round((set.owned / set.total) * 100);
            const missing = set.total - set.owned;
            const isSelected = selectedSet === set.name;

            return (
              <div
                key={set.code}
                className={`setcard ${isSelected ? "card" : ""}`}
                style={{
                  ["--sa" as string]: set.sa,
                  ...(isSelected ? { borderColor: "var(--gold-bd)", boxShadow: "var(--sh-glow)" } : {}),
                }}
                onClick={() => handleSetClick(set.name)}
              >
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

                  <div>
                    <div className="row between" style={{ marginBottom: 4, gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{setPct}%</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Faltam {missing}</span>
                    </div>
                    <div className="bar" style={{ height: 7 }}>
                      <i style={{ width: `${setPct}%` }} />
                    </div>
                  </div>

                  <div className="row between" style={{ gap: 8 }}>
                    <div className="col" style={{ gap: 2 }}>
                      <span className="mono" style={{ fontSize: 13, color: "var(--gold-2)", fontWeight: 600 }}>
                        {fmt0(set.value)}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Valor</span>
                    </div>
                    <div className="col" style={{ gap: 2 }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{set.foil}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Foils</span>
                    </div>
                  </div>

                  {/* Ver cartas action */}
                  <button
                    className="btn btn-ghost btn-sm btn-block"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetClick(set.name);
                    }}
                  >
                    <IconCards /> Ver cartas
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ════════════════ CARDS FROM SELECTED SET ════════════════ */}
        {selectedSet && (
          <div style={{ marginBottom: 40 }}>
            <div className="sec-head">
              <div>
                <h2>{selectedSet}</h2>
                <div className="sub">
                  {setCards.length} cartas neste set
                </div>
              </div>
              <button
                className="back"
                onClick={() => setSelectedSet("")}
                style={{ color: "var(--muted)", cursor: "pointer" }}
              >
                ✕ Fechar
              </button>
            </div>

            {setCards.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: 18,
                }}
              >
                {setCards.map((card) => (
                  <Link key={card.id} href={`/carta/${card.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <CardTile card={card} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card card-pad" style={{ textAlign: "center", color: "var(--muted)" }}>
                Nenhuma carta catalogada neste set ainda. Em breve!
              </div>
            )}
          </div>
        )}

        {/* ════════════════ CTA ════════════════ */}
        {!selectedSet && (
          <div className="card card-pad" style={{ textAlign: "center", borderColor: "var(--gold-bd)" }}>
            <div style={{ maxWidth: 480, margin: "0 auto" }}>
              <div className="row center" style={{ gap: 8, justifyContent: "center", marginBottom: 8, color: "var(--gold-2)" }}>
                <IconHeart />
                <IconBell />
              </div>
              <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Gerencie sua coleção
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
                Acompanhe o valor da sua coleção, crie alertas de preço e saiba
                exatamente o que falta em cada set.
              </p>
              <Link href="/colecao" className="btn btn-gold btn-lg">
                <IconArrow /> Minha coleção
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
