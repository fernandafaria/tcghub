"use client";

import { useState } from "react";
import Link from "next/link";
import { IconStore, IconTag, IconSpark, IconShield, IconCheck, IconArrow, IconPkg } from "@/components/icons";

// ─── Features list ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: IconPkg,
    title: "Gestão de estoque",
    desc: "Cadastre suas cartas e produtos em lote. Controle variantes, foil/normal, condição e quantidade em tempo real.",
  },
  {
    icon: IconSpark,
    title: "Preço automático inteligente",
    desc: "Seu preço se ajusta automaticamente com base no mercado. Fique competitivo sem mexer um dedo — margem mínima configurável.",
  },
  {
    icon: IconStore,
    title: "PDV de balcão",
    desc: "Venda presencial com o mesmo sistema. Leitor de código de barras, NFC para cartão, tudo integrado ao seu estoque online.",
  },
  {
    icon: IconShield,
    title: "Zero comissão · Zero mensalidade",
    desc: "Você paga zero. Sério. A TCGHub ganha com serviços premium opcionais — nunca com comissão nas suas vendas.",
  },
  {
    icon: IconTag,
    title: "Vitrine verificada",
    desc: "Selo de loja verificada inspira confiança. Compradores veem suas avaliações, tempo de envio e selo de procedência.",
  },
  {
    icon: IconCheck,
    title: "Escrow protegido",
    desc: "O dinheiro da venda fica retido até o comprador confirmar o recebimento. Zero chargeback, zero golpe.",
  },
];

// ─── PAGE ───────────────────────────────────────────────────────
export default function LojistaPage() {
  const [form, setForm] = useState({ nome: "", loja: "", email: "", telefone: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.nome && form.loja && form.email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* ════════════════ HEADER ════════════════ */}
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Para lojistas · TCGHub
          </div>
          <h1
            style={{
              fontFamily: "var(--fdisplay)",
              fontSize: "clamp(26px, 3.2vw, 38px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Sua loja no <span className="holo-text">hub</span> do TCG
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, maxWidth: 560 }}>
            Venda para milhares de colecionadores com estoque inteligente,
            preço automático e <strong style={{ color: "var(--teal)" }}>zero comissão</strong>.
          </p>
        </div>

        {/* ════════════════ TWO-COLUMN LAYOUT ════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          {/* LEFT: Features */}
          <div className="col gap-20">
            {FEATURES.map((f, i) => {
              const IconComp = f.icon;
              return (
                <div
                  key={i}
                  className="card card-pad row"
                  style={{ gap: 16, borderColor: "var(--teal-bd)", background: "linear-gradient(120deg, color-mix(in oklch, var(--teal) 6%, transparent), transparent 60%)" }}
                >
                  <span
                    style={{
                      color: "var(--teal)",
                      display: "flex",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <IconComp />
                  </span>
                  <div className="col" style={{ gap: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>
                      {f.title}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                      {f.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Signup form */}
          <div style={{ position: "sticky", top: "calc(var(--nav-h) + 24px)" }}>
            <div
              className="card card-pad col"
              style={{
                gap: 20,
                borderColor: "var(--teal-bd)",
                background: "linear-gradient(160deg, color-mix(in oklch, var(--teal) 10%, var(--card)), var(--card))",
              }}
            >
              <div className="row center" style={{ gap: 8, color: "var(--teal)" }}>
                <IconStore />
                <span style={{ fontFamily: "var(--fdisplay)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
                  Cadastre sua loja
                </span>
              </div>

              {submitted ? (
                <div className="col center" style={{ gap: 12, textAlign: "center", padding: "20px 0" }}>
                  <span style={{ color: "var(--teal)", display: "flex" }}>
                    <IconCheck />
                  </span>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 17, display: "block", marginBottom: 4 }}>
                      Recebemos seu interesse!
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>
                      Nossa equipe entrará em contato em até 48h úteis para ativar sua conta.
                    </span>
                  </div>
                  <Link href="/" className="btn btn-teal btn-lg" style={{ marginTop: 8 }}>
                    <IconArrow /> Voltar ao início
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="col gap-12">
                  <div className="col" style={{ gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
                      Seu nome
                    </label>
                    <input
                      className="field"
                      name="nome"
                      placeholder="João Silva"
                      value={form.nome}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--teal-bd)" }}
                    />
                  </div>

                  <div className="col" style={{ gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
                      Nome da loja
                    </label>
                    <input
                      className="field"
                      name="loja"
                      placeholder="Cards & Colecionáveis Ltda"
                      value={form.loja}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--teal-bd)" }}
                    />
                  </div>

                  <div className="col" style={{ gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
                      E-mail
                    </label>
                    <input
                      className="field"
                      name="email"
                      type="email"
                      placeholder="contato@sualoja.com.br"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--teal-bd)" }}
                    />
                  </div>

                  <div className="col" style={{ gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
                      WhatsApp
                    </label>
                    <input
                      className="field"
                      name="telefone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={form.telefone}
                      onChange={handleChange}
                      style={{ borderColor: "var(--teal-bd)" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-teal btn-lg btn-block" style={{ marginTop: 4 }}>
                    <IconStore /> Quero vender na TCGHub
                  </button>

                  <p style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "center" }}>
                    Sem compromisso. Entraremos em contato para conhecer sua loja.
                  </p>
                </form>
              )}
            </div>

            {/* Trust badge */}
            <div
              className="row center"
              style={{
                gap: 10,
                marginTop: 16,
                padding: "10px 14px",
                background: "var(--teal-bg)",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--teal-bd)",
              }}
            >
              <IconShield />
              <span style={{ fontSize: 12.5, color: "var(--teal)", fontWeight: 500 }}>
                Plataforma protegida · pagamento via escrow · zero chargeback
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════ RESPONSIVE: stack on mobile ════════════════ */}
        <style jsx>{`
          @media (max-width: 860px) {
            .two-col { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
