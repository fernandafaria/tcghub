"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CARDS, TCGS } from "@/data";
import { fmt, fmt0, TrendTag, Chip } from "@/components/ui";
import { IconSearch, IconStar } from "@/components/icons";

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [tcgFilter, setTcgFilter] = useState("todos");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 9999]);
  const [rarityFilter, setRarityFilter] = useState("todas");

  const rarities = useMemo(() => {
    const set = new Set(CARDS.map((c) => c.rarity));
    return Array.from(set).sort();
  }, []);

  const results = useMemo(() => {
    let cards = CARDS;

    if (query) {
      const q = query.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.set.toLowerCase().includes(q) ||
          c.num.toLowerCase().includes(q) ||
          c.tcg.toLowerCase().includes(q)
      );
    }

    if (tcgFilter !== "todos") {
      cards = cards.filter((c) => c.tcg === tcgFilter);
    }

    cards = cards.filter((c) => c.base >= priceRange[0] && c.base <= priceRange[1]);

    if (rarityFilter !== "todas") {
      cards = cards.filter((c) => c.rarity === rarityFilter);
    }

    return cards.slice(0, 24);
  }, [query, tcgFilter, priceRange, rarityFilter]);

  const hasFilters = query || tcgFilter !== "todos" || priceRange[0] > 0 || priceRange[1] < 9999 || rarityFilter !== "todas";
  const hasResults = results.length > 0;

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Buscar · TCGHub
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
            <span className="holo-text">Encontre</span> qualquer carta
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Busque por nome da carta, set ou TCG. Resultados instantaneos enquanto voce digita.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 24 }}>
          <div
            className="row"
            style={{
              padding: "12px 18px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-pill)",
              gap: 10,
              maxWidth: 560,
            }}
          >
            <IconSearch />
            <input
              type="text"
              placeholder="Buscar por nome da carta, set ou TCG..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: 15,
                flex: 1,
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  padding: "2px 10px",
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

        {/* Filters */}
        <div className="col gap-12" style={{ marginBottom: 24 }}>
          {/* TCG filter */}
          <div className="row wrapf gap-6">
            <Chip active={tcgFilter === "todos"} onClick={() => setTcgFilter("todos")}>
              Todos os TCGs
            </Chip>
            {TCGS.map((tcg) => (
              <Chip
                key={tcg.id}
                active={tcgFilter === tcg.id}
                onClick={() => setTcgFilter(tcgFilter === tcg.id ? "todos" : tcg.id)}
              >
                {tcg.name}
              </Chip>
            ))}
          </div>

          {/* Rarity filter */}
          <div className="row wrapf gap-6">
            <Chip
              active={rarityFilter === "todas"}
              onClick={() => setRarityFilter("todas")}
            >
              Todas as raridades
            </Chip>
            {rarities.slice(0, 10).map((r) => (
              <Chip
                key={r}
                active={rarityFilter === r}
                onClick={() => setRarityFilter(rarityFilter === r ? "todas" : r)}
              >
                {r}
              </Chip>
            ))}
          </div>

          {/* Price range */}
          <div className="row center" style={{ gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Preco:</span>
            <Chip active={priceRange[0] === 0 && priceRange[1] === 9999} onClick={() => setPriceRange([0, 9999])}>
              Qualquer
            </Chip>
            <Chip active={priceRange[0] === 0 && priceRange[1] === 50} onClick={() => setPriceRange([0, 50])}>
              Ate R$50
            </Chip>
            <Chip active={priceRange[0] === 50 && priceRange[1] === 200} onClick={() => setPriceRange([50, 200])}>
              R$50-200
            </Chip>
            <Chip active={priceRange[0] === 200 && priceRange[1] === 9999} onClick={() => setPriceRange([200, 9999])}>
              Acima de R$200
            </Chip>
          </div>
        </div>

        {/* Results */}
        {hasResults ? (
          <>
            <div className="row between center" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {results.length} resultado{results.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 14,
                marginBottom: 40,
              }}
            >
              {results.map((card) => (
                <Link
                  key={card.id}
                  href={`/carta/${card.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card card-pad row center" style={{ gap: 14 }}>
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

                    {/* Info */}
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
                        <span
                          className="tag tag-neutral"
                          style={{ fontSize: 10, textTransform: "uppercase" }}
                        >
                          {card.tcg === "pokemon"
                            ? "PKM"
                            : card.tcg === "magic"
                            ? "MTG"
                            : card.tcg === "yugioh"
                            ? "YGO"
                            : card.tcg === "onepiece"
                            ? "OP"
                            : card.tcg === "lorcana"
                            ? "LOR"
                            : card.tcg}
                        </span>
                      </div>
                      <TrendTag pct={card.wk} sm />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
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
                <IconSearch />
              </div>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {hasFilters ? "Nenhuma carta encontrada" : "Busque por nome da carta, set ou TCG"}
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
                {hasFilters
                  ? "Tente outros filtros ou termos de busca. As cartas aparecem aqui conforme voce digita."
                  : "Digite o nome de uma carta, colecao ou TCG para ver resultados instantaneos."}
              </p>
            </div>
          </div>
        )}

        {/* Buscas salvas placeholder */}
        <div className="sec-head" style={{ marginBottom: 16 }}>
          <div>
            <h2>Buscas salvas</h2>
            <div className="sub">Em breve — salve suas buscas favoritas</div>
          </div>
        </div>

        <div className="card card-pad" style={{ textAlign: "center", color: "var(--faint)", fontSize: 13 }}>
          <div className="row center" style={{ justifyContent: "center", gap: 6 }}>
            <IconStar />
            <span>Voce podera salvar buscas frequentes e receber alertas quando novas cartas aparecerem.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
