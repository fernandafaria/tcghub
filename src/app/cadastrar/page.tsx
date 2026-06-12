"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { COLLECTION_SETS, CARDS } from "@/data";
import { fmt0, Chip } from "@/components/ui";
import { IconSearch, IconArrow, IconCheck, IconGrid, IconLayers } from "@/components/icons";
import type { Card, CollectionSet } from "@/types";

const TCGS = [
  { id: "todos", name: "Todos os TCGs" },
  { id: "pokemon", name: "Pokemon" },
  { id: "magic", name: "Magic" },
  { id: "yugioh", name: "Yu-Gi-Oh!" },
  { id: "onepiece", name: "One Piece" },
  { id: "lorcana", name: "Disney Lorcana" },
];

export default function CadastrarPage() {
  const [tcgFilter, setTcgFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const filteredSets = useMemo(() => {
    let sets = COLLECTION_SETS;
    if (tcgFilter !== "todos") {
      sets = sets.filter((s) => s.tcg === tcgFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      sets = sets.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }
    return sets;
  }, [tcgFilter, search]);

  const toggleSet = (code: string) => {
    setExpandedSet((prev) => (prev === code ? null : code));
  };

  const toggleCard = (cardId: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const cardsForSet = (set: CollectionSet): Card[] => {
    return CARDS.filter((c) => {
      const setMatch =
        c.set.toLowerCase().includes(set.name.toLowerCase()) ||
        set.name.toLowerCase().includes(c.set.toLowerCase()) ||
        c.set.startsWith(set.code);
      return setMatch && (tcgFilter === "todos" || c.tcg === tcgFilter);
    }).slice(0, 12);
  };

  const lastSetCode = "OBF";

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Cadastrar · TCGHub
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
            <span className="holo-text">Cadastre</span> suas cartas
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Selecione o set e marque as cartas que voce tem. Facil, rapido e sem planilha.
          </p>
        </div>

        {/* Continue onde parou */}
        {lastSetCode && (
          <div style={{ marginBottom: 28 }}>
            <div className="sec-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>Continue onde parou</h2>
                <div className="sub">Ultimo set que voce estava cadastrando</div>
              </div>
            </div>
            <div
              className="card card-pad row center between"
              style={{ borderColor: "var(--gold-bd)", cursor: "pointer" }}
              onClick={() => toggleSet(lastSetCode)}
            >
              <div className="col" style={{ gap: 4 }}>
                <span style={{ fontFamily: "var(--fdisplay)", fontSize: 15, fontWeight: 700 }}>
                  {COLLECTION_SETS.find((s) => s.code === lastSetCode)?.name || lastSetCode}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {COLLECTION_SETS.find((s) => s.code === lastSetCode)?.total || 0} cartas no set
                </span>
              </div>
              <span className="btn btn-ghost btn-sm">
                Continuar <IconArrow />
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="row wrapf gap-8" style={{ marginBottom: 16 }}>
          {TCGS.map((t) => (
            <Chip
              key={t.id}
              active={tcgFilter === t.id}
              onClick={() => setTcgFilter(t.id)}
            >
              {t.name}
            </Chip>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div
            className="row"
            style={{
              padding: "10px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-pill)",
              gap: 9,
              maxWidth: 400,
            }}
          >
            <IconSearch />
            <input
              type="text"
              placeholder="Buscar set por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: 14,
                flex: 1,
                fontFamily: "inherit",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  padding: "2px 8px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--bg-2)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Sets grid */}
        {filteredSets.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {filteredSets.map((set) => {
              const setPct = Math.round((set.owned / set.total) * 100);
              const isExpanded = expandedSet === set.code;
              const cards = cardsForSet(set);

              return (
                <div key={set.code}>
                  <div
                    className={`card card-pad col ${isExpanded ? "active" : ""}`}
                    style={{
                      gap: 12,
                      cursor: "pointer",
                      borderColor: isExpanded ? "var(--gold-bd)" : "var(--border)",
                      borderBottomLeftRadius: isExpanded ? 0 : undefined,
                      borderBottomRightRadius: isExpanded ? 0 : undefined,
                    }}
                    onClick={() => toggleSet(set.code)}
                  >
                    {/* Set head */}
                    <div className="row between center" style={{ gap: 8 }}>
                      <div className="col" style={{ gap: 2 }}>
                        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                          {set.code}
                        </span>
                        <span style={{ fontFamily: "var(--fdisplay)", fontSize: 16, fontWeight: 700 }}>
                          {set.name}
                        </span>
                      </div>
                      <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
                        {set.owned}/{set.total}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="row between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {setPct}% completo
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          Faltam {set.total - set.owned}
                        </span>
                      </div>
                      <div className="bar" style={{ height: 6 }}>
                        <i style={{ width: `${setPct}%`, background: "var(--gold)" }} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded cards */}
                  {isExpanded && cards.length > 0 && (
                    <div
                      className="card"
                      style={{
                        borderTop: "none",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderColor: "var(--gold-bd)",
                        padding: 16,
                      }}
                    >
                      <div className="col gap-10">
                        {cards.map((c) => (
                          <div
                            key={c.id}
                            className="row center between"
                            style={{
                              padding: "8px 0",
                              borderBottom: "1px solid var(--border)",
                              cursor: "pointer",
                            }}
                            onClick={() => toggleCard(c.id)}
                          >
                            <div className="row center" style={{ gap: 10 }}>
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 5,
                                  border: selectedCards.has(c.id)
                                    ? "2px solid var(--gold-2)"
                                    : "2px solid var(--border)",
                                  background: selectedCards.has(c.id)
                                    ? "var(--gold)"
                                    : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {selectedCards.has(c.id) && <IconCheck />}
                              </div>
                              <div className="col" style={{ gap: 1 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                                <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                                  {c.num} · {c.rarity}
                                </span>
                              </div>
                            </div>
                            <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                              {fmt0(c.base)}
                            </span>
                          </div>
                        ))}
                        <span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                          Mostrando {cards.length} cartas do set
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="card card-pad" style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <div
                className="row center"
                style={{
                  gap: 8,
                  justifyContent: "center",
                  marginBottom: 12,
                  color: "var(--muted)",
                  opacity: 0.5,
                }}
              >
                <IconGrid />
                <IconLayers />
              </div>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Nenhum set encontrado
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
                Tente outro TCG ou termo de busca. Os sets aparecem aqui conforme voce carrega o catalogo.
              </p>
            </div>
          </div>
        )}

        {/* Counter */}
        {selectedCards.size > 0 && (
          <div
            className="card card-pad row center between"
            style={{
              position: "sticky",
              bottom: 20,
              borderColor: "var(--gold-bd)",
              background: "var(--surface)",
              boxShadow: "var(--sh-3)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {selectedCards.size} carta{selectedCards.size > 1 ? "s" : ""} selecionada{selectedCards.size > 1 ? "s" : ""}
            </span>
            <button className="btn btn-gold btn-sm">
              Adicionar a minha colecao
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
