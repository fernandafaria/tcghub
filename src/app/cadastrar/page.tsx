"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { TCGS } from "@/data";
import { formatSetCode } from "@/lib/sets";
import { apiCardsToCards } from "@/lib/adapters";
import { Chip } from "@/components/ui";
import {
  IconSearch,
  IconArrow,
  IconCheck,
  IconGrid,
  IconLayers,
} from "@/components/icons";
import type { Card, ApiCardsResponse } from "@/types";

// ─── Constants ────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://tcghub.ai";

const GAME_KEYS = ["pokemon", "yugioh", "onepiece", "lorcana"] as const;

const GAME_ID_TO_PARAM: Record<string, string> = {
  pokemon: "pokemon",
  ygo: "yugioh",
  yugioh: "yugioh",
  mtg: "magic",
  magic: "magic",
  op: "onepiece",
  onepiece: "onepiece",
  lor: "lorcana",
  lorcana: "lorcana",
};

const LS_SELECTED = "tcghub:cadastrar:selected";
const LS_LAST_SET = "tcghub:cadastrar:lastSet";

// ─── API ──────────────────────────────────────────────────────────
async function fetchCards(game: string, limit = 80): Promise<Card[]> {
  const param = GAME_ID_TO_PARAM[game] || game;
  const url = `${API_BASE}/api/cards?game=${param}&limit=${limit}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const json: ApiCardsResponse = await res.json();
  return apiCardsToCards(json.cards, game);
}

async function fetchAllGames(limit: number): Promise<Card[]> {
  const results = await Promise.allSettled(
    GAME_KEYS.map((g) => fetchCards(g, Math.floor(limit / GAME_KEYS.length)))
  );
  const all: Card[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all;
}

// ─── Types ────────────────────────────────────────────────────────
interface SetGroup {
  code: string;
  name: string;
  tcg: string;
  count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────
function loadSelected(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_SELECTED);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSelected(s: Set<string>) {
  try {
    localStorage.setItem(LS_SELECTED, JSON.stringify([...s]));
  } catch {
    /* quota exceeded */
  }
}

// ─── Page content ─────────────────────────────────────────────────
function CadastrarContent() {
  const [tcgFilter, setTcgFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(
    () => loadSelected()
  );
  const [expandedCards, setExpandedCards] = useState<Card[]>([]);
  const [expanding, setExpanding] = useState(false);

  // Load cards once
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cards = await fetchAllGames(320); // 80 per TCG
        if (!cancelled) setAllCards(cards);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar cartas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist selected
  useEffect(() => {
    saveSelected(selectedCards);
  }, [selectedCards]);

  // Group cards into sets
  const setGroups = useMemo(() => {
    const map = new Map<string, SetGroup>();
    for (const c of allCards) {
      const key = `${c.tcg}:${c.set}`;
      if (!map.has(key)) {
        map.set(key, {
          code: c.set,
          name: formatSetCode(c.set),
          tcg: c.tcg,
          count: 0,
        });
      }
      map.get(key)!.count++;
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCards]);

  // Filter sets
  const filteredSets = useMemo(() => {
    let sets = setGroups;
    if (tcgFilter !== "todos") {
      sets = sets.filter((s) => s.tcg === tcgFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      sets = sets.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      );
    }
    return sets;
  }, [setGroups, tcgFilter, search]);

  // Owned count per set from localStorage
  const ownedInSet = useCallback(
    (setCode: string) => {
      const cards = allCards.filter((c) => c.set === setCode);
      return cards.filter((c) => selectedCards.has(c.id)).length;
    },
    [allCards, selectedCards]
  );

  // Last set (from localStorage)
  const lastSetCode =
    typeof window !== "undefined"
      ? localStorage.getItem(LS_LAST_SET) || setGroups[0]?.code || ""
      : setGroups[0]?.code || "";

  // Toggle set expansion — load cards for that set
  const toggleSet = useCallback(
    async (code: string) => {
      if (expandedSet === code) {
        setExpandedSet(null);
        setExpandedCards([]);
        return;
      }
      setExpandedSet(code);
      setExpanding(true);
      // Save last set
      try {
        localStorage.setItem(LS_LAST_SET, code);
      } catch { /* ignore */ }

      // Cards for this set are already in allCards
      const cards = allCards.filter((c) => c.set === code);
      // If not enough loaded, fetch more
      if (cards.length < 5) {
        // Try fetching with a bigger batch for the relevant TCG
        const group = setGroups.find((g) => g.code === code);
        if (group) {
          const fresh = await fetchCards(group.tcg, 200);
          const freshForSet = fresh.filter((c) => c.set === code);
          setAllCards((prev) => {
            const existing = new Set(prev.map((c) => c.id));
            const merged = [...prev, ...fresh.filter((c) => !existing.has(c.id))];
            return merged;
          });
          setExpandedCards(freshForSet);
        }
      } else {
        setExpandedCards(cards);
      }
      setExpanding(false);
    },
    [expandedSet, allCards, setGroups]
  );

  const toggleCard = (cardId: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  // Stats
  const totalOwned = selectedCards.size;
  const totalSets = setGroups.length;
  const completedSets = setGroups.filter(
    (s) => ownedInSet(s.code) >= s.count
  ).length;

  // ─── Render ───────────────────────────────────────────────────
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
            Selecione o set e marque as cartas que você tem. Os dados ficam
            salvos no seu navegador.
            {totalOwned > 0 && (
              <span>
                {" "}
                — {totalOwned} carta{totalOwned > 1 ? "s" : ""} cadastrada
                {totalOwned > 1 ? "s" : ""}, {completedSets}{" "}
                set{completedSets !== 1 ? "s" : ""} completo
                {completedSets !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Continue onde parou */}
        {lastSetCode && !loading && (
          <div style={{ marginBottom: 28 }}>
            <div className="sec-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>Continue onde parou</h2>
                <div className="sub">
                  Último set que você estava cadastrando
                </div>
              </div>
            </div>
            <div
              className="card card-pad row center between"
              style={{
                borderColor: "var(--gold-bd)",
                cursor: "pointer",
              }}
              onClick={() => toggleSet(lastSetCode)}
            >
              <div className="col" style={{ gap: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--fdisplay)",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {formatSetCode(lastSetCode)}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {setGroups.find((s) => s.code === lastSetCode)?.count || 0}{" "}
                  cartas no set · {ownedInSet(lastSetCode)} na sua coleção
                </span>
              </div>
              <span className="btn btn-ghost btn-sm">
                Continuar <IconArrow />
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div style={{ maxWidth: 440, margin: "0 auto" }}>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Catalogando sets
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Buscando cartas de Pokémon, Yu-Gi-Oh!, One Piece e Disney
                Lorcana...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            className="card card-pad"
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <p
              style={{
                color: "var(--down)",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Não foi possível carregar as cartas. Tente novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-gold"
              style={{
                padding: "10px 24px",
                borderRadius: "var(--r-pill)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Filters */}
            <div
              className="row wrapf gap-8"
              style={{ marginBottom: 16 }}
            >
              <Chip
                active={tcgFilter === "todos"}
                onClick={() => setTcgFilter("todos")}
              >
                Todos os TCGs
              </Chip>
              {TCGS.map((t) => (
                <Chip
                  key={t.id}
                  active={tcgFilter === t.id}
                  onClick={() =>
                    setTcgFilter(tcgFilter === t.id ? "todos" : t.id)
                  }
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

            {/* Stats bar */}
            <div
              className="row wrapf"
              style={{
                gap: 20,
                marginBottom: 20,
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <span>
                {filteredSets.length} set
                {filteredSets.length !== 1 ? "s" : ""}
              </span>
              <span>
                {totalOwned} carta{totalOwned !== 1 ? "s" : ""} na coleção
              </span>
              <span>
                {completedSets} set{completedSets !== 1 ? "s" : ""} completo
                {completedSets !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Sets grid */}
            {filteredSets.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {filteredSets.map((set) => {
                  const owned = ownedInSet(set.code);
                  const setPct = set.count > 0
                    ? Math.round((owned / set.count) * 100)
                    : 0;
                  const isExpanded = expandedSet === set.code;
                  const cards =
                    isExpanded && !expanding ? expandedCards : [];

                  return (
                    <div key={`${set.tcg}:${set.code}`}>
                      <div
                        className={`card card-pad col ${
                          isExpanded ? "active" : ""
                        }`}
                        style={{
                          gap: 12,
                          cursor: "pointer",
                          borderColor: isExpanded
                            ? "var(--gold-bd)"
                            : "var(--border)",
                          borderBottomLeftRadius: isExpanded ? 0 : undefined,
                          borderBottomRightRadius: isExpanded ? 0 : undefined,
                        }}
                        onClick={() => toggleSet(set.code)}
                      >
                        {/* Set head */}
                        <div
                          className="row between center"
                          style={{ gap: 8 }}
                        >
                          <div className="col" style={{ gap: 2 }}>
                            <span
                              className="mono"
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                              }}
                            >
                              {set.code}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--fdisplay)",
                                fontSize: 16,
                                fontWeight: 700,
                              }}
                            >
                              {set.name}
                            </span>
                          </div>
                          <span
                            className="mono"
                            style={{ fontSize: 18, fontWeight: 700 }}
                          >
                            {owned}/{set.count}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div
                            className="row between"
                            style={{ marginBottom: 4 }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                              }}
                            >
                              {setPct}% completo
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                              }}
                            >
                              Faltam {set.count - owned}
                            </span>
                          </div>
                          <div className="bar" style={{ height: 6 }}>
                            <i
                              style={{
                                width: `${setPct}%`,
                                background:
                                  setPct === 100
                                    ? "var(--up)"
                                    : "var(--gold)",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expanded cards */}
                      {isExpanded && (
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
                          {expanding ? (
                            <p
                              style={{
                                color: "var(--muted)",
                                fontSize: 13,
                                textAlign: "center",
                                padding: "20px 0",
                              }}
                            >
                              Carregando cartas...
                            </p>
                          ) : cards.length > 0 ? (
                            <div className="col gap-10">
                              {cards.map((c) => {
                                const isSelected = selectedCards.has(
                                  c.id
                                );
                                return (
                                  <div
                                    key={c.id}
                                    className="row center between"
                                    style={{
                                      padding: "8px 0",
                                      borderBottom:
                                        "1px solid var(--border)",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => toggleCard(c.id)}
                                  >
                                    <div
                                      className="row center"
                                      style={{ gap: 10 }}
                                    >
                                      <div
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 5,
                                          border: isSelected
                                            ? "2px solid var(--gold-2)"
                                            : "2px solid var(--border)",
                                          background: isSelected
                                            ? "var(--gold)"
                                            : "transparent",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {isSelected && <IconCheck />}
                                      </div>
                                      <div
                                        className="col"
                                        style={{ gap: 1 }}
                                      >
                                        <span
                                          style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                          }}
                                        >
                                          {c.name}
                                        </span>
                                        <span
                                          className="mono"
                                          style={{
                                            fontSize: 10.5,
                                            color: "var(--muted)",
                                          }}
                                        >
                                          {c.num} · {c.rarity}
                                          {c.kind
                                            ? ` · ${c.kind}`
                                            : ""}
                                        </span>
                                      </div>
                                    </div>
                                    {c.img ? (
                                      <img
                                        src={c.img}
                                        alt={c.name}
                                        style={{
                                          width: 40,
                                          aspectRatio: "2.5/3.5",
                                          borderRadius: 4,
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: 40,
                                          aspectRatio: "2.5/3.5",
                                          borderRadius: 4,
                                          background: c.gc,
                                          opacity: 0.3,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 9,
                                          color: "var(--text)",
                                        }}
                                      >
                                        {c.num}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--muted)",
                                  textAlign: "center",
                                }}
                              >
                                {cards.length} cartas no set
                              </span>
                            </div>
                          ) : (
                            <p
                              style={{
                                color: "var(--muted)",
                                fontSize: 13,
                                textAlign: "center",
                                padding: "20px 0",
                              }}
                            >
                              Nenhuma carta encontrada para este set.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div
                className="card card-pad"
                style={{ textAlign: "center", marginBottom: 40 }}
              >
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
                  <p
                    style={{
                      color: "var(--muted)",
                      fontSize: 14,
                    }}
                  >
                    Tente outro TCG ou termo de busca.
                  </p>
                </div>
              </div>
            )}

            {/* Sticky counter */}
            {totalOwned > 0 && (
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
                  {totalOwned} carta{totalOwned > 1 ? "s" : ""} na sua
                  coleção · {completedSets}{" "}
                  set{completedSets !== 1 ? "s" : ""} completo
                  {completedSets !== 1 ? "s" : ""}
                </span>
                <Link href="/colecao" className="btn btn-gold btn-sm">
                  Ver coleção <IconArrow />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────
export default function CadastrarPage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="wrap">
            <p style={{ color: "var(--muted)" }}>Carregando...</p>
          </div>
        </div>
      }
    >
      <CadastrarContent />
    </Suspense>
  );
}
