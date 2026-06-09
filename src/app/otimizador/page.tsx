'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';
import { Stepper, TagUI, StoreBadge, Stars, fmt, fmt0, TrendTag } from '@/components/ui';
import {
  IconBrain, IconSpark, IconShield, IconCheck,
  IconCart, IconBack,
} from '@/components/icons';
import { STORES } from '@/data';

// Simulated original cart data
const ORIGINAL_ITEMS = [
  { cardId: 'c1', qty: 3, name: 'Charizard ex', set: 'Obsidian Flames', num: '125/197', price: 489 },
  { cardId: 'c2', qty: 2, name: 'Pikachu ex', set: 'Surging Sparks', num: '238/191', price: 312 },
  { cardId: 'c4', qty: 4, name: 'Gardevoir ex', set: 'Obsidian Flames', num: '086/197', price: 84 },
  { cardId: 'c3', qty: 1, name: 'Mewtwo VSTAR', set: 'Pokémon GO', num: '031/078', price: 74.9 },
];

const ORIGINAL_TOTAL = ORIGINAL_ITEMS.reduce((sum, i) => sum + i.price * i.qty, 0);

// Simulated optimized allocation (IA splits across stores for best price)
const OPTIMIZED_ALLOCATION = [
  {
    store: STORES[0],
    items: [
      { ...ORIGINAL_ITEMS[0], price: 459.0 }, // Charizard cheaper
      { ...ORIGINAL_ITEMS[1], price: 299.0 }, // Pikachu cheaper
    ],
    shipping: 14.9,
  },
  {
    store: STORES[1],
    items: [
      { ...ORIGINAL_ITEMS[2], price: 77.0 }, // Gardevoir cheaper
      { ...ORIGINAL_ITEMS[3], price: 69.9 }, // Mewtwo cheaper
    ],
    shipping: 0,
  },
];

const OPTIMIZED_ITEMS_TOTAL = OPTIMIZED_ALLOCATION.reduce(
  (sum, alloc) => sum + alloc.items.reduce((s, i) => s + i.price * i.qty, 0),
  0
);
const OPTIMIZED_SHIPPING_TOTAL = OPTIMIZED_ALLOCATION.reduce(
  (sum, alloc) => sum + alloc.shipping,
  0
);
const OPTIMIZED_TOTAL = OPTIMIZED_ITEMS_TOTAL + OPTIMIZED_SHIPPING_TOTAL;
const SAVINGS = ORIGINAL_TOTAL - OPTIMIZED_TOTAL;
const SAVINGS_PCT = (SAVINGS / ORIGINAL_TOTAL) * 100;

type OptimizeState = 'idle' | 'optimizing' | 'done';

export default function OtimizadorPage() {
  const [state, setState] = useState<OptimizeState>('idle');

  const handleOptimize = () => {
    setState('optimizing');
    // Simulate AI processing delay
    setTimeout(() => {
      setState('done');
    }, 1800);
  };

  const handleApply = () => {
    // In real app: apply optimized cart to cart state
    window.location.href = '/checkout';
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* Stepper */}
        <Stepper steps={['Montar carrinho', 'Revisar', 'Checkout']} active={2} />

        {/* Back link */}
        <a href="/comprar" className="back">
          <IconBack className="" />
          Voltar para o carrinho
        </a>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <div className="row center gap-10" style={{ marginBottom: 4 }}>
            <span style={{ color: 'var(--violet)', display: 'flex' }}>
              <IconBrain className="" />
            </span>
            <h1
              style={{
                fontFamily: 'var(--fdisplay)',
                fontSize: 'clamp(22px, 2.4vw, 28px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Otimizador de carrinho
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginLeft: 27 }}>
            Nossa IA distribui suas cartas entre as melhores lojas para
            maximizar economia, considerando preço unitário, frete e
            reputação.
          </p>
        </div>

        {/* Main content */}
        <div className="row" style={{ alignItems: 'flex-start', gap: 32 }}>
          {/* Left - Original cart */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Original cart summary */}
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <div className="row center between" style={{ marginBottom: 16 }}>
                <h2
                  style={{
                    fontFamily: 'var(--fdisplay)',
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  <IconCart className="" />
                  {' '}Carrinho original
                </h2>
                <TagUI variant="neutral">
                  {ORIGINAL_ITEMS.reduce((s, i) => s + i.qty, 0)} cartas
                </TagUI>
              </div>

              <div className="col" style={{ gap: 0 }}>
                {ORIGINAL_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="deckline"
                    style={{ padding: '10px 0' }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: 'var(--text-2)',
                        minWidth: 26,
                      }}
                    >
                      {item.qty}x
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {item.name}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: 10, color: 'var(--muted)' }}
                      >
                        {item.set} · {item.num}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                      <span
                        className="mono"
                        style={{ fontWeight: 700, fontSize: 13 }}
                      >
                        {fmt0(item.price * item.qty)}
                      </span>
                      <br />
                      <span
                        className="mono"
                        style={{ fontSize: 9.5, color: 'var(--muted)' }}
                      >
                        {fmt0(item.price)} un
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="divider" style={{ margin: '14px 0' }} />

              <div className="row center between">
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  Total · loja única
                </span>
                <div style={{ textAlign: 'right' }}>
                  <span
                    className="mono"
                    style={{ fontWeight: 700, fontSize: 20 }}
                  >
                    {fmt(ORIGINAL_TOTAL)}
                  </span>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--muted)' }}
                  >
                    + frete a calcular
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            {state === 'idle' && (
              <button
                className="btn btn-violet btn-lg btn-block"
                onClick={handleOptimize}
                style={{ marginBottom: 20 }}
              >
                <IconBrain className="" />
                Analisar e otimizar com IA
              </button>
            )}

            {state === 'optimizing' && (
              <div className="card card-pad" style={{ textAlign: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--violet-bg)',
                    margin: '0 auto 16px',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IconBrain className="" />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--fdisplay)',
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Analisando seu carrinho
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Nossa IA está comparando preços entre {STORES.length} lojas,
                  considerando estoque, frete e reputação...
                </p>

                {/* Loading bar */}
                <div className="bar" style={{ marginTop: 18, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                  <i
                    style={{
                      width: '100%',
                      background: 'linear-gradient(90deg, var(--violet), var(--violet-2))',
                      animation: 'loadingbar 1.6s ease-in-out infinite',
                    }}
                  />
                </div>
                <style>{`
                  @keyframes loadingbar {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                  }
                `}</style>
              </div>
            )}

            {state === 'done' && (
              <>
                {/* Results summary banner */}
                <div
                  className="card card-pad"
                  style={{
                    borderColor: 'var(--up)',
                    background: 'var(--up-bg)',
                    marginBottom: 20,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--fdisplay)',
                      fontSize: 28,
                      fontWeight: 800,
                      color: 'var(--up)',
                      marginBottom: 4,
                    }}
                  >
                    {fmt(SAVINGS)}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                    de economia encontrada
                    <span
                      style={{
                        marginLeft: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <TrendTag pct={SAVINGS_PCT} />
                    </span>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                    Distribuindo seu carrinho entre {OPTIMIZED_ALLOCATION.length} lojas
                    verificadas com o melhor custo-benefício.
                  </p>
                </div>

                {/* Per-store breakdown */}
                <div className="col gap-16" style={{ marginBottom: 20 }}>
                  {OPTIMIZED_ALLOCATION.map((alloc, idx) => (
                    <div key={idx} className="card card-pad">
                      <div
                        className="row center between"
                        style={{ marginBottom: 12 }}
                      >
                        <div>
                          <StoreBadge
                            name={alloc.store.name}
                            verified={alloc.store.verified}
                          />
                          <div className="row center gap-8" style={{ marginTop: 3 }}>
                            <Stars rating={alloc.store.rating} />
                            <span
                              className="mono"
                              style={{ fontSize: 10, color: 'var(--muted)' }}
                            >
                              {alloc.store.sales} vendas
                            </span>
                          </div>
                        </div>
                        <TagUI variant="violet">
                          <IconCheck className="" />
                          IA sugere
                        </TagUI>
                      </div>

                      <div className="col" style={{ gap: 0 }}>
                        {alloc.items.map((item, j) => (
                          <div
                            key={j}
                            className="deckline"
                            style={{ padding: '8px 0' }}
                          >
                            <span
                              className="mono"
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: 'var(--violet-2)',
                                minWidth: 26,
                              }}
                            >
                              {item.qty}x
                            </span>
                            <div className="grow" style={{ minWidth: 0 }}>
                              <div
                                className="row center gap-6"
                                style={{ fontSize: 13, fontWeight: 600 }}
                              >
                                {item.name}
                                {item.price < ORIGINAL_ITEMS.find(
                                  (o) => o.cardId === item.cardId
                                )!.price && (
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      color: 'var(--up)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    -{fmt0(
                                      ORIGINAL_ITEMS.find(
                                        (o) => o.cardId === item.cardId
                                      )!.price - item.price
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className="mono"
                              style={{ fontWeight: 700, fontSize: 13 }}
                            >
                              {fmt0(item.price * item.qty)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <hr className="divider" style={{ margin: '10px 0' }} />
                      <div className="row center between">
                        <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                          Subtotal + frete
                        </span>
                        <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                          {fmt(
                            alloc.items.reduce((s, i) => s + i.price * i.qty, 0) +
                              alloc.shipping
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-gold btn-lg btn-block"
                  onClick={handleApply}
                >
                  <IconCheck className="" />
                  Aplicar otimização e ir para checkout
                </button>
              </>
            )}
          </div>

          {/* Right sidebar - Summary */}
          <div
            style={{
              width: 340,
              flex: '0 0 340px',
              position: 'sticky',
              top: 'calc(var(--nav-h) + 20px)',
              alignSelf: 'flex-start',
            }}
          >
            <div className="card card-pad">
              <h2
                style={{
                  fontFamily: 'var(--fdisplay)',
                  fontSize: 19,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: 16,
                }}
              >
                <IconSpark className="" />
                {' '}Resumo da otimização
              </h2>

              {state === 'idle' && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '28px 0',
                    color: 'var(--muted)',
                    fontSize: 13,
                  }}
                >
                  <IconBrain className="" />
                  <br />
                  Clique em &ldquo;Analisar e otimizar&rdquo;
                  para ver os resultados.
                </div>
              )}

              {state === 'optimizing' && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '28px 0',
                    color: 'var(--muted)',
                    fontSize: 13,
                  }}
                >
                  <IconSpark className="" />
                  <br />
                  Analisando...
                </div>
              )}

              {state === 'done' && (
                <>
                  <div className="col gap-10" style={{ marginBottom: 16 }}>
                    <div className="row center between">
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                        Original
                      </span>
                      <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>
                        {fmt(ORIGINAL_TOTAL)}
                      </span>
                    </div>
                    <div className="row center between">
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                        Otimizado
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: 'var(--violet-2)',
                        }}
                      >
                        {fmt(OPTIMIZED_TOTAL)}
                      </span>
                    </div>
                    <div
                      className="row center between"
                      style={{
                        padding: '8px 10px',
                        background: 'var(--up-bg)',
                        borderRadius: 'var(--r-xs)',
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--up)', fontWeight: 600 }}>
                        Economia
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: 'var(--up)',
                        }}
                      >
                        {fmt(SAVINGS)}
                      </span>
                    </div>
                  </div>

                  <hr className="divider" style={{ marginBottom: 14 }} />

                  <div style={{ marginBottom: 14 }}>
                    <h3
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 8,
                      }}
                    >
                      Lojas selecionadas
                    </h3>
                    <div className="col gap-8">
                      {OPTIMIZED_ALLOCATION.map((alloc, idx) => (
                        <div
                          key={idx}
                          className="row center gap-8"
                          style={{
                            padding: '8px 10px',
                            background: 'var(--surface)',
                            borderRadius: 'var(--r-xs)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {alloc.store.name}
                            </div>
                            <Stars rating={alloc.store.rating} />
                          </div>
                          <span
                            className="mono"
                            style={{ fontWeight: 700, fontSize: 12 }}
                          >
                            {fmt0(
                              alloc.items.reduce((s, i) => s + i.price * i.qty, 0) +
                                alloc.shipping
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="card-pad"
                    style={{
                      background: 'var(--teal-bg)',
                      border: '1px solid var(--teal-bd)',
                      borderRadius: 'var(--r-md)',
                      padding: '12px 14px',
                    }}
                  >
                    <div className="row center gap-8" style={{ marginBottom: 4 }}>
                      <IconShield className="" />
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                        Compra protegida em todas as lojas
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      Cada pedido tem escrow independente. Você só paga
                      quando a loja despachar.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
