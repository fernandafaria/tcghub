'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Stepper, TagUI, fmt, fmt0, TrendTag } from '@/components/ui';
import { IconBrain, IconSpark, IconCheck } from '@/components/icons';
import type { OptimizationResult, ParsedDeckCard, SellerSlot } from '@/types';

// ─── Client-side decklist parser (same logic as backend decklist-parser.ts) ───

const LINE_RE = /^(\d+)[x\s]+(.+)$/i;
const ALT_LINE_RE = /^(.+)\s+[x×](\d+)$/i;

function parseDecklist(text: string): ParsedDeckCard[] {
  const cards: ParsedDeckCard[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;
    if (/^[A-Za-z]/.test(line) && !/\d/.test(line.slice(0, 3))) continue;

    const m = LINE_RE.exec(line) ?? ALT_LINE_RE.exec(line);
    if (!m) continue;

    const isAlt = ALT_LINE_RE.exec(line) && !LINE_RE.exec(line);
    const quantity = isAlt ? parseInt(m[2], 10) : parseInt(m[1], 10);
    const name = (isAlt ? m[1] : m[2]).trim();

    if (name && quantity > 0 && quantity <= 99) {
      cards.push({ name, quantity });
    }
  }
  return cards;
}

// ─── Slug generator for card names (simple slug → lowercase-kebab) ───

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''""'′'″]/g, '')
    .replace(/[,.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── State types ────────────────────────────────────────────────────────────

type PageState = 'input' | 'optimizing' | 'done' | 'error';

export default function OtimizadorPage() {
  // Input
  const [decklist, setDecklist] = useState('');
  const [cep, setCep] = useState('');

  // State machine
  const [pageState, setPageState] = useState<PageState>('input');
  const [errorMsg, setErrorMsg] = useState('');

  // Results
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [parsedCards, setParsedCards] = useState<ParsedDeckCard[]>([]);

  // ─── Handle optimize ────────────────────────────────────────────────────

  const handleOptimize = async () => {
    setErrorMsg('');

    // Parse decklist
    const cards = parseDecklist(decklist);
    if (cards.length === 0) {
      setErrorMsg('Nenhuma carta encontrada. Cole sua decklist no formato "4x Nome da Carta".');
      return;
    }
    setParsedCards(cards);

    setPageState('optimizing');
    setResult(null);

    try {
      // Build request — using card_name as slug since the backend resolves names
      const state = cep ? extractStateFromCep(cep) : undefined;
      const res = await apiFetch<OptimizationResult>('/api/cart/optimize', {
        method: 'POST',
        body: JSON.stringify({
          items: cards.map(c => ({
            card_slug: slugify(c.name),
            card_name: c.name,
            quantity: c.quantity,
          })),
          cep: cep || undefined,
          state,
          shipping_method: 'PAC',
        }),
      });

      setResult(res);
      setPageState('done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao otimizar carrinho');
      setPageState('error');
    }
  };

  // ─── Derived values ─────────────────────────────────────────────────────

  const parsedTotal = parsedCards.length;
  const totalCards = result?.allocatedQuantity ?? parsedTotal;
  const missingCards = result?.missing ?? [];
  const incomplete = result?.incomplete ?? false;
  const totalOriginal = parsedCards.reduce((_, c) => 0, 0); // Original prices unknown

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="wrap">
        {/* Stepper */}
        <Stepper steps={['Montar decklist', 'Otimizar', 'Checkout']} active={pageState === 'done' ? 2 : 1} />

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <div className="row center gap-10" style={{ marginBottom: 4 }}>
            <span style={{ color: 'var(--violet)', display: 'flex' }}>
              <IconBrain />
            </span>
            <h1 style={{ fontFamily: 'var(--fdisplay)', fontSize: 'clamp(22px, 2.4vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Otimizador de carrinho
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginLeft: 27 }}>
            Cole sua decklist, cole o CEP e nossa IA distribui suas cartas entre as melhores lojas para maximizar economia.
          </p>
        </div>

        <div className="row" style={{ alignItems: 'flex-start', gap: 32 }}>
          {/* Left column */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* ── INPUT STATE ──────────────────────────────────────────── */}
            {(pageState === 'input' || pageState === 'error') && (
              <div className="card card-pad col gap-16" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  Cole sua decklist
                </label>
                <textarea
                  className="field"
                  rows={12}
                  placeholder={'4x Charizard ex\n3x Pikachu ex\n2x Gardevoir ex\n1x Mewtwo VSTAR\n\n// Ou cole links:\n// moxfield.com/decks/...\n// limitlesstcg.com/decks/...'}
                  value={decklist}
                  onChange={e => setDecklist(e.target.value)}
                  style={{ fontFamily: 'var(--fmono)', fontSize: 13, lineHeight: 1.6 }}
                />

                <div className="row gap-12" style={{ alignItems: 'flex-end' }}>
                  <div className="col gap-4" style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>
                      CEP (opcional — para cálculo de frete)
                    </label>
                    <input
                      className="field"
                      type="text"
                      placeholder="Ex: 01310-100"
                      maxLength={9}
                      value={cep}
                      onChange={e => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div style={{ padding: '10px 14px', background: 'var(--down-bg)', border: '1px solid var(--down)', borderRadius: 'var(--r-sm)', color: 'var(--down)', fontSize: 13 }}>
                    {errorMsg}
                  </div>
                )}

                <button className="btn btn-violet btn-lg btn-block" onClick={handleOptimize}>
                  <IconBrain /> Analisar e otimizar com IA
                </button>
              </div>
            )}

            {/* ── OPTIMIZING STATE ─────────────────────────────────────── */}
            {pageState === 'optimizing' && (
              <div className="card card-pad" style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-pill)', background: 'var(--violet-bg)', margin: '0 auto 16px', display: 'grid', placeItems: 'center' }}>
                  <IconBrain />
                </div>
                <h3 style={{ fontFamily: 'var(--fdisplay)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                  Analisando sua decklist
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {parsedCards.length > 0
                    ? `Comparando preços de ${parsedCards.length} cartas entre lojas verificadas...`
                    : 'Nossa IA está comparando preços entre lojas, considerando estoque, frete e reputação...'}
                </p>
                <div className="bar" style={{ marginTop: 18, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                  <i style={{ width: '100%', background: 'linear-gradient(90deg, var(--violet), var(--violet-2))', animation: 'loadingbar 1.6s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes loadingbar { 0% { width: 0%; } 50% { width: 70%; } 100% { width: 100%; } }`}</style>
              </div>
            )}

            {/* ── RESULTS STATE ────────────────────────────────────────── */}
            {pageState === 'done' && result && (
              <>
                {/* Status banner */}
                {result.sellers.length > 0 && (
                  <div className="card card-pad" style={{ borderColor: incomplete ? 'var(--gold-bd)' : 'var(--up)', background: incomplete ? 'var(--gold-bg)' : 'var(--up-bg)', marginBottom: 20, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--fdisplay)', fontSize: 28, fontWeight: 800, color: incomplete ? 'var(--gold-2)' : 'var(--up)', marginBottom: 4 }}>
                      {fmt(result.totalBrl)}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {incomplete ? 'Melhor preço parcial encontrado' : 'Melhor preço encontrado'}
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                      {result.allocatedQuantity} de {result.requiredQuantity} cartas alocadas
                      {result.sellers.length > 1 ? ` · distribuído em ${result.sellers.length} lojas` : ' · 1 loja'}
                    </p>
                    {result.warnings && result.warnings.length > 0 && (
                      <div className="col gap-4" style={{ marginTop: 12, textAlign: 'left' }}>
                        {result.warnings.map((w, i) => (
                          <div key={i} style={{ padding: '8px 12px', background: 'var(--down-bg)', border: '1px solid var(--down)', borderRadius: 'var(--r-xs)', fontSize: 11.5, color: 'var(--down)' }}>
                            ⚠ {w}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* No sellers found */}
                {result.sellers.length === 0 && (
                  <div className="card card-pad" style={{ textAlign: 'center', marginBottom: 20, borderColor: 'var(--down)', background: 'var(--down-bg)' }}>
                    <p style={{ color: 'var(--down)', fontSize: 14, fontWeight: 600 }}>Nenhuma loja encontrada com estoque para essas cartas.</p>
                    <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 4 }}>Tente novamente mais tarde ou ajuste sua decklist.</p>
                  </div>
                )}

                {/* Per-store breakdown */}
                {result.sellers.length > 0 && (
                  <div className="col gap-16" style={{ marginBottom: 20 }}>
                    {result.sellers.map((seller, idx) => (
                      <SellerCard key={idx} seller={seller} idx={idx} />
                    ))}
                  </div>
                )}

                {/* Missing cards */}
                {missingCards.length > 0 && (
                  <div className="card card-pad" style={{ marginBottom: 20, borderColor: 'var(--gold-bd)', background: 'var(--gold-bg)' }}>
                    <h3 style={{ fontFamily: 'var(--fdisplay)', fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
                      Cartas não encontradas
                    </h3>
                    <div className="col gap-4">
                      {missingCards.map((m, i) => (
                        <div key={i} className="row between" style={{ fontSize: 13 }}>
                          <span style={{ color: 'var(--text-2)' }}>{m.cardSlug}</span>
                          <span className="mono" style={{ color: 'var(--muted)' }}>
                            {m.quantity}x indisponível
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset button */}
                <button className="btn btn-ghost btn-lg" onClick={() => { setPageState('input'); setResult(null); setParsedCards([]); }}>
                  ← Nova decklist
                </button>
              </>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ width: 340, flex: '0 0 340px', position: 'sticky', top: 'calc(var(--nav-h) + 20px)', alignSelf: 'flex-start' }}>
            <div className="card card-pad">
              <h2 style={{ fontFamily: 'var(--fdisplay)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
                <IconSpark /> Resumo da otimização
              </h2>

              {pageState === 'input' && (
                <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--muted)', fontSize: 13 }}>
                  <IconBrain />
                  <br />
                  Cole sua decklist e clique em otimizar.
                </div>
              )}

              {pageState === 'optimizing' && (
                <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--muted)', fontSize: 13 }}>
                  <IconSpark />
                  <br />
                  Analisando...
                </div>
              )}

              {pageState === 'done' && result && (
                <div className="col gap-10">
                  <div className="row between">
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Cartas na lista</span>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{parsedTotal}</span>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Cartas alocadas</span>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 14, color: result.allocatedQuantity === result.requiredQuantity ? 'var(--up)' : 'var(--gold-2)' }}>
                      {result.allocatedQuantity}/{result.requiredQuantity}
                    </span>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Subtotal</span>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{fmt(result.subtotalBrl)}</span>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Frete</span>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{fmt(result.shippingBrl)}</span>
                  </div>
                  <hr className="divider" />
                  <div className="row between" style={{ padding: '8px 10px', background: 'var(--violet-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--violet-2)' }}>Total</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 18, color: 'var(--violet-2)' }}>{fmt(result.totalBrl)}</span>
                  </div>
                  {result.combinationsEvaluated > 0 && (
                    <div style={{ fontSize: 10.5, color: 'var(--faint)', textAlign: 'center', marginTop: 4 }}>
                      {result.combinationsEvaluated} combinações avaliadas
                    </div>
                  )}
                </div>
              )}

              {pageState === 'error' && (
                <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--down)', fontSize: 13 }}>
                  Erro ao carregar. Tente novamente.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Seller card sub-component ──────────────────────────────────────────────

function SellerCard({ seller, idx }: { seller: SellerSlot; idx: number }) {
  return (
    <div className="card card-pad">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="col gap-2">
          <div className="row center gap-6">
            <span style={{ fontWeight: 600, fontSize: 14 }}>{seller.displayName}</span>
            {seller.isVerified && (
              <span style={{ color: 'var(--teal)', display: 'flex' }}><IconCheck /></span>
            )}
          </div>
          {seller.trustLevel && (
            <span className="tag tag-neutral" style={{ fontSize: 10 }}>
              {trustLabel(seller.trustLevel)}
            </span>
          )}
        </div>
        <TagUI variant="violet">
          <IconCheck /> IA sugere
        </TagUI>
      </div>

      <div className="col" style={{ gap: 0 }}>
        {seller.items.map((item, j) => (
          <div key={j} className="deckline" style={{ padding: '8px 0' }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--violet-2)', minWidth: 26 }}>
              {item.quantity}x
            </span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row center gap-6" style={{ fontSize: 13, fontWeight: 600 }}>
                {item.cardName || item.cardSlug}
                {item.anomalous && (
                  <span style={{ fontSize: 10, color: 'var(--down)' }}>⚠ preço suspeito</span>
                )}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                {item.condition} {item.isFoil ? '· Foil' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                {fmt0(item.unitPriceBrl * item.quantity)}
              </span>
              <br />
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--muted)' }}>
                {fmt0(item.unitPriceBrl)} un
              </span>
            </div>
          </div>
        ))}
      </div>

      <hr className="divider" style={{ margin: '10px 0' }} />
      <div className="row between">
        <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Subtotal + frete</span>
        <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
          {fmt(seller.subtotalBrl + seller.shippingBrl)}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function trustLabel(level: string): string {
  const map: Record<string, string> = {
    alta: '🏆 Confiança alta',
    confiavel: '✅ Confiável',
    moderada: '⚠ Moderada',
    novo: '🆕 Novo vendedor',
  };
  return map[level] || level;
}

function extractStateFromCep(cep: string): string | undefined {
  // Simple CEP → state mapping (first digit range)
  const n = parseInt(cep.charAt(0));
  if (isNaN(n)) return undefined;
  if (n === 0) return 'SP';
  if (n === 1) return 'SP';
  if (n === 2) return 'RJ';
  if (n === 3) return 'MG';
  if (n === 4) return 'BA';
  if (n === 5) return 'PE';
  if (n === 6) return 'CE';
  if (n === 7) return 'DF';
  if (n === 8) return 'PR';
  if (n === 9) return 'RS';
  return undefined;
}
