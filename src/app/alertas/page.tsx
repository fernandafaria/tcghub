"use client";

import { useState } from "react";
import { CARDS } from "@/data";
import { fmt, fmt0, TrendTag } from "@/components/ui";
import { IconBell, IconTrash, IconUp, IconDown, IconArrow } from "@/components/icons";

interface AlertaItem {
  id: string;
  cardId: string;
  cardName: string;
  cardSet: string;
  cardArt: string;
  cardFoil: boolean;
  targetPrice: number;
  currentPrice: number;
  status: "ativo" | "atingido" | "pausado";
  createdAt: string;
  direction: "acima" | "abaixo";
}

function gerarAlertasMock(): AlertaItem[] {
  const pool = CARDS.slice(0, 10);
  const statuses: AlertaItem["status"][] = ["ativo", "atingido", "pausado", "ativo", "ativo", "atingido", "ativo", "pausado", "ativo", "ativo"];
  return pool.map((c, i) => {
    const dir = i % 2 === 0 ? "acima" : "abaixo";
    const target = dir === "acima" ? c.base * (1.1 + i * 0.05) : c.base * (0.85 - i * 0.02);
    return {
      id: `alerta-${c.id}`,
      cardId: c.id,
      cardName: c.name,
      cardSet: c.set,
      cardArt: c.art,
      cardFoil: c.foil,
      targetPrice: Math.round(target * 100) / 100,
      currentPrice: c.base,
      status: statuses[i],
      createdAt: `${10 - i} de junho de 2026`,
      direction: dir,
    };
  });
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<AlertaItem[]>(() => gerarAlertasMock());
  const [filtro, setFiltro] = useState<"todos" | "ativo" | "atingido" | "pausado">("todos");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = alerts.filter((a) => {
    if (filtro === "todos") return true;
    return a.status === filtro;
  });

  const togglePause = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === "pausado" ? "ativo" : "pausado" } : a
      )
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setConfirmDelete(null);
  };

  const formatDate = (dateStr: string) => dateStr;

  const counts = {
    todos: alerts.length,
    ativo: alerts.filter((a) => a.status === "ativo").length,
    atingido: alerts.filter((a) => a.status === "atingido").length,
    pausado: alerts.filter((a) => a.status === "pausado").length,
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Alertas · TCGHub
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
            <span className="holo-text">Seus alertas</span> de preço
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Quando uma carta chegar no preço que você quer, a gente te avisa.
          </p>
        </div>

        {/* Filter chips */}
        <div className="row wrapf gap-8" style={{ marginBottom: 24 }}>
          {(["todos", "ativo", "atingido", "pausado"] as const).map((f) => (
            <button
              key={f}
              className={`chip ${filtro === f ? "active" : ""}`}
              onClick={() => setFiltro(f)}
            >
              {f === "todos" ? "Todos" : f === "ativo" ? "Ativos" : f === "atingido" ? "Atingidos" : "Pausados"}
              <span style={{ marginLeft: 6, fontSize: 11, color: "var(--muted)" }}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Alert list */}
        {filtered.length > 0 ? (
          <div className="col gap-12" style={{ marginBottom: 40 }}>
            {filtered.map((a) => {
              const diff = a.currentPrice - a.targetPrice;
              const diffPct = a.targetPrice > 0 ? (diff / a.targetPrice) * 100 : 0;
              const isReached = a.status === "atingido";

              return (
                <div
                  key={a.id}
                  className="card card-pad"
                  style={{
                    borderColor: isReached ? "var(--up-bg)" : a.status === "ativo" ? "var(--gold-bd)" : "var(--border)",
                    background: isReached ? "color-mix(in oklch, var(--up) 6%, var(--card))" : undefined,
                  }}
                >
                  <div className="row center" style={{ gap: 16 }}>
                    {/* Card image */}
                    <div
                      className={`cardimg ${a.cardArt} ${a.cardFoil ? "foil" : ""}`}
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
                      <div className="row center between" style={{ gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.cardName}
                        </span>
                        {/* Status badge */}
                        {isReached && (
                          <span
                            className="tag tag-up"
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              animation: "pulse 2s infinite",
                            }}
                          >
                            ATINGIDO
                          </span>
                        )}
                        {a.status === "pausado" && (
                          <span className="tag tag-neutral" style={{ fontSize: 11 }}>
                            Pausado
                          </span>
                        )}
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {a.cardSet}
                      </span>

                      {/* Price info */}
                      <div className="row" style={{ gap: 24, marginTop: 8 }}>
                        <div className="col" style={{ gap: 2 }}>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            {a.direction === "acima" ? "Alvo (acima de)" : "Alvo (abaixo de)"}
                          </span>
                          <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
                            {fmt(a.targetPrice)}
                          </span>
                        </div>
                        <div className="col" style={{ gap: 2 }}>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            Preco atual
                          </span>
                          <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
                            {fmt(a.currentPrice)}
                          </span>
                        </div>
                        <div className="col" style={{ gap: 2 }}>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            Diferenca
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: diffPct >= 0 ? "var(--up)" : "var(--down)",
                            }}
                          >
                            {diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>
                        Criado em {formatDate(a.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="row center" style={{ gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => togglePause(a.id)}
                        title={a.status === "pausado" ? "Retomar alerta" : "Pausar alerta"}
                      >
                        {a.status === "pausado" ? "Retomar" : "Pausar"}
                      </button>
                      {confirmDelete === a.id ? (
                        <div className="row center" style={{ gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ color: "var(--down)", borderColor: "var(--down)" }}
                            onClick={() => deleteAlert(a.id)}
                          >
                            Confirmar
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirmDelete(a.id)}
                          title="Remover alerta"
                          style={{ color: "var(--faint)" }}
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
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
                  color: "var(--gold-2)",
                  opacity: 0.6,
                }}
              >
                <IconBell />
              </div>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {filtro !== "todos"
                  ? `Nenhum alerta ${filtro === "ativo" ? "ativo" : filtro === "atingido" ? "atingido" : "pausado"}`
                  : "Voce ainda nao criou alertas"}
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
                {filtro !== "todos"
                  ? "Mude o filtro para ver outros alertas."
                  : "Quando uma carta chegar no preco que voce quer, a gente te avisa."}
              </p>
              {filtro === "todos" && (
                <a href="/mercado" className="btn btn-gold btn-lg">
                  <IconArrow /> Criar primeiro alerta
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
