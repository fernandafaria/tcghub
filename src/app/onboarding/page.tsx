"use client";

import { useState } from "react";
import { IconStore, IconCheck, IconArrow, IconChart, IconShield, IconPkg } from "@/components/icons";
import { Stepper } from "@/components/ui";

interface FormData {
  storeName: string;
  storeCity: string;
  storeTcg: string;
}

export default function OnboardingLojistaPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    storeName: "",
    storeCity: "",
    storeTcg: "pokemon",
  });

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Loja · TCGHub
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
            Abra sua <span className="holo-text">loja</span> no TCGHub
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Em tres passos, suas cartas estao a venda para milhares de colecionadores.
          </p>
        </div>

        {/* Progress */}
        <Stepper
          steps={["Dados da loja", "Integracao de estoque", "Preview"]}
          active={step}
        />

        <div style={{ marginTop: 32, marginBottom: 40 }}>
          {/* Step 1: Dados da loja */}
          {step === 1 && (
            <div style={{ maxWidth: 520 }}>
              <div className="sec-head" style={{ marginBottom: 20 }}>
                <div>
                  <h2>Dados da sua loja</h2>
                  <div className="sub">Como seus clientes vao te encontrar</div>
                </div>
              </div>

              <div className="col gap-16">
                <div className="col gap-6">
                  <label
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
                  >
                    Nome da loja
                  </label>
                  <input
                    type="text"
                    className="field"
                    placeholder="Ex: Liga TCG, Epic Cards..."
                    value={form.storeName}
                    onChange={(e) => updateForm("storeName", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>

                <div className="col gap-6">
                  <label
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
                  >
                    Cidade
                  </label>
                  <input
                    type="text"
                    className="field"
                    placeholder="Ex: Sao Paulo, SP"
                    value={form.storeCity}
                    onChange={(e) => updateForm("storeCity", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>

                <div className="col gap-6">
                  <label
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
                  >
                    TCG principal
                  </label>
                  <select
                    value={form.storeTcg}
                    onChange={(e) => updateForm("storeTcg", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  >
                    <option value="pokemon">Pokemon</option>
                    <option value="magic">Magic: The Gathering</option>
                    <option value="yugioh">Yu-Gi-Oh!</option>
                    <option value="onepiece">One Piece</option>
                    <option value="lorcana">Disney Lorcana</option>
                  </select>
                </div>

                <button
                  className="btn btn-gold btn-lg"
                  onClick={nextStep}
                  disabled={!form.storeName || !form.storeCity}
                  style={{ alignSelf: "flex-start" }}
                >
                  Continuar <IconArrow />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Integracao */}
          {step === 2 && (
            <div style={{ maxWidth: 520 }}>
              <div className="sec-head" style={{ marginBottom: 20 }}>
                <div>
                  <h2>Integracao de estoque</h2>
                  <div className="sub">Conecte seu inventario para precificar automaticamente</div>
                </div>
              </div>

              <div className="col gap-20">
                <div className="card card-pad col" style={{ gap: 12, borderColor: "var(--teal-bd)" }}>
                  <div className="row center" style={{ gap: 10, color: "var(--teal)" }}>
                    <IconPkg />
                    <span style={{ fontFamily: "var(--fdisplay)", fontSize: 16, fontWeight: 700 }}>
                      CSV / Planilha
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>
                    Importe seu estoque em segundos com um arquivo CSV. Suportamos o formato padrao da LigaPokemon e MTG Goldfish.
                  </p>
                  <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>
                    Baixar modelo CSV
                  </button>
                </div>

                <div className="card card-pad col" style={{ gap: 12, borderColor: "var(--violet-bd)" }}>
                  <div className="row center" style={{ gap: 10, color: "var(--violet)" }}>
                    <IconChart />
                    <span style={{ fontFamily: "var(--fdisplay)", fontSize: 16, fontWeight: 700 }}>
                      Mercado Pago
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>
                    Receba pagamentos instantaneos via Mercado Pago. O dinheiro cai na hora, com protecao para voce e para o comprador.
                  </p>
                  <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>
                    Conectar Mercado Pago
                  </button>
                </div>

                <div className="row center" style={{ gap: 12 }}>
                  <button className="btn btn-ghost" onClick={prevStep}>
                    <IconArrow /> Voltar
                  </button>
                  <button className="btn btn-gold" onClick={nextStep}>
                    Continuar <IconArrow />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div style={{ maxWidth: 520 }}>
              <div className="sec-head" style={{ marginBottom: 20 }}>
                <div>
                  <h2>Quanto voce pode ganhar</h2>
                  <div className="sub">Estimativa baseada em lojas do seu perfil</div>
                </div>
              </div>

              <div
                className="card card-pad"
                style={{ borderColor: "var(--gold-bd)", marginBottom: 24 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 20,
                  }}
                >
                  <div className="col" style={{ gap: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Vendas estimadas</span>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>
                      15-40
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>cartas por mes</span>
                  </div>
                  <div className="col" style={{ gap: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Ticket medio</span>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--gold-2)" }}>
                      R$ 85
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>por venda</span>
                  </div>
                  <div className="col" style={{ gap: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Receita potencial</span>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>
                      R$ 1.200
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>a R$ 3.400/mes</span>
                  </div>
                </div>
              </div>

              <div className="card card-pad col" style={{ gap: 16, borderColor: "var(--teal-bd)", marginBottom: 24 }}>
                <div className="row center" style={{ gap: 8, color: "var(--teal)" }}>
                  <IconShield />
                  <span style={{ fontFamily: "var(--fdisplay)", fontSize: 16, fontWeight: 700 }}>
                    Resumo da sua loja
                  </span>
                </div>
                <div className="col gap-8">
                  <div className="row between">
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Nome</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{form.storeName || "(nao definido)"}</span>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Cidade</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{form.storeCity || "(nao definido)"}</span>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>TCG principal</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{form.storeTcg}</span>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Taxa da plataforma</span>
                    <span className="tag tag-up" style={{ fontSize: 11 }}>Zero nos primeiros 30 dias</span>
                  </div>
                </div>
              </div>

              <div className="row center" style={{ gap: 12 }}>
                <button className="btn btn-ghost" onClick={prevStep}>
                  <IconArrow /> Voltar
                </button>
                <button className="btn btn-gold btn-lg">
                  <IconStore /> Comecar a vender
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
