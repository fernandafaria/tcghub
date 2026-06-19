"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fmt0 } from "@/components/ui";
import { IconHeart, IconStar, IconBell, IconArrow, IconGrid, IconLayers } from "@/components/icons";

// ─── localStorage keys ──────────────────────────────────────────
const STORAGE_KEY = "tcghub:colecao:slugs";

function loadSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Valuation hook ──────────────────────────────────────────────
interface ValuationData {
  totalValue: number;
  cardCount: number;
  sets: { setCode: string; count: number; value: number }[];
}

function useCollectionValuation() {
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slugs = loadSlugs();
    if (slugs.length === 0) {
      setData({ totalValue: 0, cardCount: 0, sets: [] });
      setLoading(false);
      return;
    }

    fetch("/api/collection/value", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

// ─── Ghost slots ────────────────────────────────────────────────
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
  const { data, loading } = useCollectionValuation();
  const [actions, setActions] = useState<ActionState>({});

  const toggle = (code: string, key: "wish" | "fut" | "fol") => {
    setActions((prev) => ({
      ...prev,
      [code]: { ...prev[code], [key]: !(prev[code]?.[key] ?? false) },
    }));
  };

  const isOn = (code: string, key: "wish" | "fut" | "fol") =>
    actions[code]?.[key] ?? false;

  const totalValue = data?.totalValue || 0;
  const cardCount = data?.cardCount || 0;
  const sets = data?.sets || [];

  if (loading) {
    return (
      <div className="page">
        <div className="wrap" style={{ textAlign: "center", paddingTop: 80 }}>
          <h1 style={{ fontFamily: "var(--fdisplay)", fontSize: 28, fontWeight: 700 }}>
            Carregando sua coleção...
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 12 }}>
            Calculando valores com dados reais de mercado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="wrap">
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Minha coleção · TCGHub
          </div>
          <h1 style={{ fontFamily: "var(--fdisplay)", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 20 }}>
            <span className="holo-text">Seu tesouro</span> em R$
          </h1>

          <div className="card card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, borderColor: "var(--gold-bd)", background: "linear-gradient(120deg, var(--gold-bg), transparent 60%)" }}>
            <div className="stat col" style={{ gap: 4 }}>
              <span className="k">Valor total estimado</span>
              <span className="mono" style={{ fontSize: 26, color: "var(--gold-2)", fontWeight: 700 }}>
                {totalValue > 0 ? fmt0(totalValue) : "R$ —"}
              </span>
            </div>
            <div className="stat col" style={{ gap: 4 }}>
              <span className="k">Cartas</span>
              <span className="mono" style={{ fontSize: 26, fontWeight: 700 }}>{cardCount}</span>
            </div>
            <div className="stat col" style={{ gap: 4 }}>
              <span className="k">Sets</span>
              <span className="mono" style={{ fontSize: 26, fontWeight: 700 }}>{sets.length}</span>
            </div>
          </div>
        </div>

        {/* SETS */}
        {sets.length > 0 ? (
          <>
            <div className="sec-head" style={{ marginBottom: 18 }}>
              <div>
                <h2>Seus sets</h2>
                <div className="sub">{sets.length} coleções</div>
              </div>
            </div>

            <div className="setgrid" style={{ marginBottom: 40 }}>
              {sets.map((set) => {
                return (
                  <div key={set.setCode} className="setcard" style={{ ["--sa" as string]: "var(--violet)" }}>
                    <div className="sc-head">
                      <span className="sc-code">{set.setCode}</span>
                    </div>
                    <div className="sc-body">
                      <div className="row between" style={{ gap: 8 }}>
                        <span className="sc-name">{set.setCode}</span>
                        <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{set.count} cartas</span>
                      </div>
                      <div className="row between" style={{ gap: 8 }}>
                        <div className="col" style={{ gap: 2 }}>
                          <span className="mono" style={{ fontSize: 13, color: "var(--gold-2)", fontWeight: 600 }}>{fmt0(set.value)}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>Valor</span>
                        </div>
                      </div>
                      <div className="qa">
                        <button className={isOn(set.setCode, "wish") ? "on wish" : ""} onClick={() => toggle(set.setCode, "wish")}>
                          <IconHeart className="ic" /> Wishlist
                        </button>
                        <button className={isOn(set.setCode, "fut") ? "on fut" : ""} onClick={() => toggle(set.setCode, "fut")}>
                          <IconStar className="ic" /> Futuro
                        </button>
                        <button className={isOn(set.setCode, "fol") ? "on fol" : ""} onClick={() => toggle(set.setCode, "fol")}>
                          <IconBell className="ic" /> Track
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <div className="row center" style={{ gap: 8, justifyContent: "center", marginBottom: 12, color: "var(--gold-2)", opacity: 0.6 }}>
                <IconGrid />
              </div>
              <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Sua coleção está vazia
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
                Adicione cartas à sua coleção para ver o valor total e acompanhar seus sets.
              </p>
              <Link href="/explorar" className="btn btn-gold btn-lg">
                <IconArrow /> Explorar cartas
              </Link>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="card card-pad" style={{ textAlign: "center", borderColor: "var(--gold-bd)", marginTop: 32 }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="row center" style={{ gap: 8, justifyContent: "center", marginBottom: 8, color: "var(--gold-2)" }}>
              <IconGrid /><IconLayers />
            </div>
            <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Descubra o que está em alta
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Explore todas as coleções, veja o que falta e monitore o valor das suas cartas em tempo real.
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
