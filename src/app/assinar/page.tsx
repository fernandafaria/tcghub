"use client";

import { IconCheck, IconBell, IconChart, IconShield, IconStar, IconSpark, IconUsers } from "@/components/icons";

const BENEFITS = [
  {
    label: "Alertas de preco",
    free: "3 alertas",
    premium: "Ilimitados",
    icon: <IconBell />,
  },
  {
    label: "Historico de precos",
    free: "7 dias",
    premium: "12 meses",
    icon: <IconChart />,
  },
  {
    label: "Escaneamento de cartas",
    free: "10 por mes",
    premium: "Ilimitado",
    icon: <IconSpark />,
  },
  {
    label: "Otimizador de deck",
    free: "Basico",
    premium: "IA avancada + frete",
    icon: <IconStar />,
  },
  {
    label: "Compra protegida",
    free: "Inclusa",
    premium: "Prioritaria",
    icon: <IconShield />,
  },
  {
    label: "Suporte",
    free: "Comunidade",
    premium: "Prioritario 1:1",
    icon: <IconUsers />,
  },
];

export default function AssinarPage() {
  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Premium · TCGHub
          </div>
          <h1
            style={{
              fontFamily: "var(--fdisplay)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Leve seu hobby <span className="holo-text">a serio</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 460, margin: "0 auto" }}>
            Ferramentas avancadas, sem limites de uso e suporte prioritario. Tudo que um colecionador de verdade precisa.
          </p>
        </div>

        {/* Price highlight */}
        <div
          className="card card-pad"
          style={{
            textAlign: "center",
            maxWidth: 360,
            margin: "0 auto 40px",
            borderColor: "var(--gold-bd)",
            background: "color-mix(in oklch, var(--gold) 8%, var(--card))",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 4 }}>
            Plano Premium
          </span>
          <div className="row center" style={{ justifyContent: "center", gap: 4 }}>
            <span
              style={{
                fontFamily: "var(--fdisplay)",
                fontSize: 48,
                fontWeight: 800,
                color: "var(--gold-2)",
              }}
            >
              R$19
            </span>
            <span style={{ fontSize: 16, color: "var(--muted)", marginTop: 10 }}>/mes</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
            Cancele quando quiser · Sem contrato
          </p>
        </div>

        {/* Benefits comparison */}
        <div className="sec-head" style={{ marginBottom: 20 }}>
          <div>
            <h2>O que voce ganha</h2>
            <div className="sub">Compare os planos e veja a diferenca</div>
          </div>
        </div>

        {/* Table header */}
        <div
          className="row"
          style={{
            padding: "12px 0",
            borderBottom: "1px solid var(--border)",
            marginBottom: 0,
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }} />
          <div style={{ width: 130, textAlign: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Free</span>
          </div>
          <div style={{ width: 130, textAlign: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-2)" }}>Premium</span>
          </div>
        </div>

        {/* Benefits rows */}
        <div className="col" style={{ marginBottom: 36 }}>
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="row center"
              style={{
                padding: "14px 0",
                borderBottom: "1px solid var(--border)",
                gap: 16,
              }}
            >
              <div className="row center grow" style={{ gap: 10 }}>
                <span style={{ color: "var(--gold-2)", display: "flex" }}>{b.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{b.label}</span>
              </div>
              <div style={{ width: 130, textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{b.free}</span>
              </div>
              <div style={{ width: 130, textAlign: "center" }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--gold-2)",
                  }}
                >
                  {b.premium}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div
          className="row center"
          style={{ justifyContent: "center", gap: 6, marginBottom: 28, color: "var(--muted)", fontSize: 13 }}
        >
          <IconUsers />
          <span>2.847 colecionadores ja usam o Premium</span>
        </div>

        {/* CTA */}
        <div className="card card-pad" style={{ textAlign: "center", borderColor: "var(--gold-bd)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Tudo que voce precisa, sem limites
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Assine agora e comece a usar todas as ferramentas premium. Cancele quando quiser, sem multa.
            </p>
            <button className="btn btn-gold btn-lg">
              <IconStar /> Assinar com Mercado Pago
            </button>
            <p style={{ fontSize: 11, color: "var(--faint)", marginTop: 12 }}>
              Pagamento unico mensal. Renovacao automatica. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
