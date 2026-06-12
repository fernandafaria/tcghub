"use client";

import { useState } from "react";
import Link from "next/link";
import { IconSpark, IconCards, IconUsers, IconArrow, IconStar } from "@/components/icons";
import { CARDS } from "@/data";
import { fmt0, GameCard } from "@/components/ui";

interface Perfil {
  id: string;
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  budgetLabel: string;
}

const PERFIS: Perfil[] = [
  {
    id: "casual",
    icon: <IconSpark />,
    titulo: "Casual",
    descricao: "Jogo com amigos, troco cartas e abro alguns boosters. Quero organizar sem pressa.",
    budgetLabel: "Ate R$100",
  },
  {
    id: "social",
    icon: <IconUsers />,
    titulo: "Social",
    descricao: "Vou a lojas, jogo torneios locais e quero montar meus decks sem pagar a mais.",
    budgetLabel: "R$100-300",
  },
  {
    id: "competitivo",
    icon: <IconCards />,
    titulo: "Competitivo",
    descricao: "Quero o meta, otimizar frete, acompanhar precos e colecionar as cartas certas.",
    budgetLabel: "R$300+",
  },
];

const ORCAMENTOS = ["Ate R$100", "R$100-300", "R$300+"];

export default function ComecarPage() {
  const [perfil, setPerfil] = useState<string | null>(null);
  const [orcamento, setOrcamento] = useState<string | null>(null);

  const selectedPerfil = PERFIS.find((p) => p.id === perfil);

  const suggestedCards = CARDS.slice(0, 4);

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Comecar · TCGHub
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
            Bem-vindo ao <span className="holo-text">TCGHub</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Conta pra gente que tipo de jogador voce e. Em menos de um minuto, voce sai com recomendacoes de verdade.
          </p>
        </div>

        {/* Step 1: Perfil */}
        <div style={{ marginBottom: 36 }}>
          <div className="sec-head" style={{ marginBottom: 16 }}>
            <div>
              <h2>Qual o seu perfil?</h2>
              <div className="sub">Escolha o que mais combina com voce</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {PERFIS.map((p) => (
              <button
                key={p.id}
                className={`card card-pad col ${perfil === p.id ? "active" : ""}`}
                onClick={() => setPerfil(p.id)}
                style={{
                  cursor: "pointer",
                  textAlign: "left",
                  borderColor: perfil === p.id ? "var(--gold-bd)" : "var(--border)",
                  background: perfil === p.id ? "color-mix(in oklch, var(--gold) 8%, var(--card))" : undefined,
                  gap: 12,
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div
                  className="row center"
                  style={{
                    gap: 10,
                    color: perfil === p.id ? "var(--gold-2)" : "var(--muted)",
                  }}
                >
                  {p.icon}
                  <span style={{ fontFamily: "var(--fdisplay)", fontSize: 18, fontWeight: 700 }}>
                    {p.titulo}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                  {p.descricao}
                </p>
                <span
                  className="tag tag-gold"
                  style={{ fontSize: 11, alignSelf: "flex-start" }}
                >
                  {p.budgetLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Orcamento */}
        <div style={{ marginBottom: 36 }}>
          <div className="sec-head" style={{ marginBottom: 16 }}>
            <div>
              <h2>Qual a sua faixa de orcamento?</h2>
              <div className="sub">Isso ajuda a sugerir decks e colecoes no seu ritmo</div>
            </div>
          </div>

          <div className="row wrapf gap-12">
            {ORCAMENTOS.map((o) => (
              <button
                key={o}
                className={`chip ${orcamento === o ? "active" : ""}`}
                onClick={() => setOrcamento(o)}
                style={{ fontSize: 14, padding: "10px 22px" }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Sugestoes */}
        {perfil && orcamento && selectedPerfil && (
          <div style={{ marginBottom: 36 }}>
            <div className="sec-head" style={{ marginBottom: 16 }}>
              <div>
                <h2>Cartas que combinam com voce</h2>
                <div className="sub">
                  Selecao inicial baseada no perfil {selectedPerfil.titulo.toLowerCase()}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {suggestedCards.map((c) => (
                <GameCard key={c.id} card={c} />
              ))}
            </div>
          </div>
        )}

        {/* Sua jornada preview */}
        <div className="sec-head" style={{ marginBottom: 16 }}>
          <div>
            <h2>Sua jornada TCG</h2>
            <div className="sub">Tres passos para dominar sua colecao</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {[
            { step: "01", title: "Cadastre suas cartas", desc: "Escaneie ou digite — importe sua colecao em segundos." },
            { step: "02", title: "Acompanhe os precos", desc: "Veja quanto vale, o que subiu e quando vender." },
            { step: "03", title: "Monte decks e troque", desc: "Encontre as cartas que faltam pelo melhor preco." },
          ].map((s, i) => (
            <div
              key={i}
              className="card card-pad col"
              style={{
                gap: 10,
                borderColor: "var(--gold-bd)",
                opacity: 0.85,
              }}
            >
              <span className="mono" style={{ fontSize: 32, fontWeight: 800, color: "var(--gold)", opacity: 0.4 }}>
                {s.step}
              </span>
              <span style={{ fontFamily: "var(--fdisplay)", fontSize: 16, fontWeight: 700 }}>
                {s.title}
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {s.desc}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card card-pad" style={{ textAlign: "center", borderColor: "var(--gold-bd)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div
              className="row center"
              style={{ gap: 8, justifyContent: "center", marginBottom: 8, color: "var(--gold-2)" }}
            >
              <IconStar />
            </div>
            <h3 style={{ fontFamily: "var(--fdisplay)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Pronto para comecar?
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Sua colecao comeca agora. Vamos montar algo que vale a pena.
            </p>
            <Link href="/colecao" className="btn btn-gold btn-lg">
              <IconArrow /> Comecar minha colecao
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
