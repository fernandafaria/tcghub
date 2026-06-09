"use client";

import { useState } from "react";
import Link from "next/link";
import { IconShield, IconCheck, IconArrow, IconStar, IconTag, IconCart, IconStore } from "@/components/icons";

// ─── How it works steps ─────────────────────────────────────────
const STEPS = [
  {
    icon: IconTag,
    title: "Cadastre sua carta",
    desc: "Nome, condição, preço desejado. Sem CNPJ — pessoa física pode vender.",
  },
  {
    icon: IconShield,
    title: "Escrow protegido",
    desc: "O comprador paga, o dinheiro fica retido. Você envia a carta com código de rastreio.",
  },
  {
    icon: IconCheck,
    title: "Receba seguro",
    desc: "Comprador confirma o recebimento. Dinheiro liberado na sua conta em até 2 dias úteis.",
  },
];

// ─── Conditions ─────────────────────────────────────────────────
const CONDITIONS = [
  "NM · Near Mint",
  "LP · Lightly Played",
  "MP · Moderately Played",
  "HP · Heavily Played",
  "DMG · Damaged",
];

// ─── PAGE ───────────────────────────────────────────────────────
export default function VenderPage() {
  const [form, setForm] = useState({
    cardName: "",
    condition: "",
    price: "",
  });
  const [photoSelected, setPhotoSelected] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.cardName && form.condition && form.price) {
      setSubmitted(true);
    }
  };

  const handlePhotoClick = () => {
    setPhotoSelected(true);
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* ════════════════ HEADER ════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Vender · TCGHub
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
            Transforme cartas em{" "}
            <span style={{ color: "var(--gold)" }}>dinheiro</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, maxWidth: 600 }}>
            Venda sem CNPJ, sem risco de golpe. Escrow protegido: o dinheiro só é liberado
            quando o comprador confirmar o recebimento.
          </p>
        </div>

        {/* ════════════════ TRUST ROW ════════════════ */}
        <div className="trust-row" style={{ marginBottom: 36, gap: 24 }}>
          <span className="trust-item">
            <IconShield className="ic" /> Escrow protegido
          </span>
          <span className="trust-item">
            <IconCheck className="ic" /> Sem CNPJ necessário
          </span>
          <span className="trust-item">
            <IconCart className="ic" /> Comprador verificado
          </span>
        </div>

        {/* ════════════════ TWO-COLUMN: Form + How it works ════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "flex-start",
            marginBottom: 48,
          }}
        >
          {/* LEFT: Sell Form */}
          <div>
            <div
              className="card card-pad col"
              style={{
                gap: 20,
                borderColor: "var(--gold-bd)",
                background:
                  "linear-gradient(160deg, color-mix(in oklch, var(--gold) 8%, var(--card)), var(--card))",
              }}
            >
              <div className="row center" style={{ gap: 8, color: "var(--gold)" }}>
                <IconTag />
                <span
                  style={{
                    fontFamily: "var(--fdisplay)",
                    fontWeight: 700,
                    fontSize: 20,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Anunciar carta
                </span>
              </div>

              {submitted ? (
                <div
                  className="col center"
                  style={{ gap: 12, textAlign: "center", padding: "20px 0" }}
                >
                  <span style={{ color: "var(--up)", display: "flex" }}>
                    <IconCheck />
                  </span>
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 17,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Anúncio criado!
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>
                      Sua carta está em análise. Publicaremos em até 24h.
                    </span>
                  </div>
                  <Link
                    href="/mercado"
                    className="btn btn-gold btn-lg"
                    style={{ marginTop: 8 }}
                  >
                    <IconArrow /> Ver mercado
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="col gap-14">
                  {/* Card name */}
                  <div className="col" style={{ gap: 4 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-2)",
                      }}
                    >
                      Nome da carta
                    </label>
                    <input
                      className="field"
                      name="cardName"
                      placeholder='Ex: "Charizard ex · OBF 125/197"'
                      value={form.cardName}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--gold-bd)" }}
                    />
                  </div>

                  {/* Condition */}
                  <div className="col" style={{ gap: 4 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-2)",
                      }}
                    >
                      Condição
                    </label>
                    <select
                      className="field"
                      name="condition"
                      value={form.condition}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--gold-bd)" }}
                    >
                      <option value="">Selecione a condição...</option>
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div className="col" style={{ gap: 4 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-2)",
                      }}
                    >
                      Preço desejado (R$)
                    </label>
                    <input
                      className="field"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={form.price}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--gold-bd)" }}
                    />
                  </div>

                  {/* Photo upload CTA */}
                  <div
                    className="col center"
                    style={{
                      gap: 10,
                      padding: "24px 16px",
                      border: "1.5px dashed var(--gold-bd)",
                      borderRadius: "var(--r-md)",
                      background: "var(--bg-2)",
                      cursor: "pointer",
                      transition: ".16s",
                    }}
                    onClick={handlePhotoClick}
                  >
                    <span
                      style={{
                        fontSize: 32,
                        display: "flex",
                        color: photoSelected ? "var(--up)" : "var(--muted)",
                      }}
                    >
                      {photoSelected ? <IconCheck /> : "📸"}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: photoSelected ? "var(--up)" : "var(--muted)",
                      }}
                    >
                      {photoSelected
                        ? "Foto selecionada!"
                        : "Toque para tirar/enviar foto da carta"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--faint)",
                      }}
                    >
                      Frente e verso · boa iluminação · sem sleeve
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-gold btn-lg btn-block"
                    style={{ marginTop: 2 }}
                  >
                    <IconTag /> Publicar anúncio
                  </button>

                  <p
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted)",
                      textAlign: "center",
                    }}
                  >
                    Seu anúncio passa por uma revisão rápida antes de ir ao ar.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: How it works + CTA */}
          <div className="col gap-20">
            <div>
              <h3
                style={{
                  fontFamily: "var(--fdisplay)",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                Como funciona
              </h3>
              <div className="col gap-12">
                {STEPS.map((step, i) => {
                  const IconComp = step.icon;
                  return (
                    <div
                      key={i}
                      className="card card-pad row"
                      style={{
                        gap: 16,
                        borderColor: "var(--gold-bd)",
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "var(--r-pill)",
                          background: "var(--gold-bg)",
                          border: "1px solid var(--gold-bd)",
                          color: "var(--gold-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="col" style={{ gap: 3 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                          {step.title}
                        </span>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-2)",
                            lineHeight: 1.5,
                          }}
                        >
                          {step.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secondary CTA for stores */}
            <div
              className="card card-pad col"
              style={{
                gap: 12,
                borderColor: "var(--teal-bd)",
                background:
                  "linear-gradient(120deg, var(--teal-bg), transparent 60%)",
              }}
            >
              <div className="row center" style={{ gap: 8, color: "var(--teal)" }}>
                <IconStore />
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  Tem uma loja?
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                Gerencie estoque, preço automático e PDV de balcão — tudo integrado
                e sem comissão.
              </p>
              <Link href="/lojista" className="btn btn-teal btn-sm" style={{ alignSelf: "flex-start" }}>
                Conhecer plano lojista <IconArrow />
              </Link>
            </div>
          </div>
        </div>

        {/* ════════════════ BOTTOM TRUST ════════════════ */}
        <div
          className="card card-pad"
          style={{
            textAlign: "center",
            borderColor: "var(--gold-bd)",
            background:
              "linear-gradient(120deg, var(--gold-bg), transparent 70%)",
          }}
        >
          <div className="row center" style={{ gap: 12, justifyContent: "center", marginBottom: 6 }}>
            <IconShield />
            <IconCheck />
            <IconStar />
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 520, margin: "0 auto" }}>
            Toda venda na TCGHub passa pelo nosso <strong style={{ color: "var(--gold-2)" }}>escrow protegido</strong>.
            O comprador paga, você envia com rastreio, e o dinheiro é liberado só depois da confirmação.
            <strong style={{ color: "var(--teal)" }}> Zero golpe. Zero estresse.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
