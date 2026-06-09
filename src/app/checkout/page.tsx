'use client';

import { useState, useEffect, useMemo } from 'react';
import { Stepper, TagUI, StoreBadge, Stars, fmt, fmt0 } from '@/components/ui';
import {
  IconShield, IconStore, IconCart, IconBack, IconBrain,
  IconArrow, IconTag, IconSpark,
} from '@/components/icons';
import { STORES } from '@/data';
import { apiFetch } from '@/lib/api';
import type { OptimizationResult, SellerSlot } from '@/types';
import { toast } from '@/components/Toaster';

// Cart item from localStorage
interface CartItem {
  cardSlug: string;
  cardName: string;
  set?: string;
  num?: string;
  price: number;
  qty: number;
}

// Read cart from localStorage
function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('tcghub-deck');
    if (!raw) return [];
    const deck = JSON.parse(raw);
    return deck.map((entry: any) => ({
      cardSlug: entry.card?.id || entry.cardId || '',
      cardName: entry.card?.name || entry.cardName || 'Carta',
      set: entry.card?.set || '',
      num: entry.card?.num || '',
      price: entry.card?.base || entry.price || 0,
      qty: entry.qty || entry.quantity || 1,
    }));
  } catch {
    return [];
  }
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load cart on mount
  useEffect(() => {
    const loadedCart = loadCart();
    setCart(loadedCart);
  }, []);

  // Optimize cart via API when cart loads
  useEffect(() => {
    if (cart.length === 0) {
      setLoading(false);
      return;
    }

    const optimize = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiFetch<OptimizationResult>('/api/cart/optimize', {
          method: 'POST',
          body: JSON.stringify({
            items: cart.map((item) => ({
              card_slug: item.cardSlug,
              card_name: item.cardName,
              quantity: item.qty,
            })),
          }),
        });
        setOptimization(result);
      } catch (err: any) {
        setError(err.message || 'Erro ao otimizar carrinho');
        // Fall back to mock store options
      } finally {
        setLoading(false);
      }
    };

    optimize();
  }, [cart]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  // Store options: prefer API results, fall back to mock
  const storeOptions: SellerSlot[] = useMemo(() => {
    if (optimization?.sellers && optimization.sellers.length > 0) {
      return optimization.sellers;
    }
    // Mock fallback
    return [
      { sellerId: 's1', displayName: STORES[0]?.name || 'Loja A', isVerified: true, items: [], subtotalBrl: cartTotal, shippingBrl: 14.9, trustLevel: 'high' },
      { sellerId: 's2', displayName: STORES[1]?.name || 'Loja B', isVerified: true, items: [], subtotalBrl: cartTotal - 23.1, shippingBrl: 0, trustLevel: 'high' },
      { sellerId: 's3', displayName: STORES[2]?.name || 'Loja C', isVerified: false, items: [], subtotalBrl: cartTotal + 5.5, shippingBrl: 12, trustLevel: 'medium' },
    ];
  }, [optimization, cartTotal]);

  const bestOption = storeOptions.length > 0 ? storeOptions[0] : null;

  const handleCheckout = async () => {
    try {
      await apiFetch('/api/marketplace/checkout', {
        method: 'POST',
        body: JSON.stringify({
          seller_id: bestOption?.sellerId,
          items: cart.map((item) => ({
            card_slug: item.cardSlug,
            quantity: item.qty,
          })),
        }),
      });
      toast('Compra finalizada com sucesso!');
    } catch (err: any) {
      toast(`Erro ao finalizar: ${err.message}`);
    }
  };

  return (
    <div className="page">
      <div className="wrap">
        {/* Stepper */}
        <Stepper steps={['Montar carrinho', 'Revisar', 'Checkout']} active={3} />

        {/* Back link */}
        <a href="/comprar" className="back">
          <IconBack className="" />
          Voltar para o carrinho
        </a>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--fdisplay)',
            fontSize: 'clamp(22px, 2.4vw, 28px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          Revisar e finalizar
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
          Revise os itens, escolha a melhor loja e finalize sua compra com proteção.
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
            <IconBrain />
            <p style={{ marginTop: 12 }}>Otimizando seu carrinho...</p>
          </div>
        )}

        {!loading && cart.length === 0 && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 0' }}>
            <IconCart />
            <p style={{ color: 'var(--muted)', marginTop: 12 }}>Seu carrinho está vazio.</p>
            <a href="/comprar" className="btn btn-gold" style={{ marginTop: 16 }}>
              Montar carrinho
            </a>
          </div>
        )}

        {!loading && cart.length > 0 && (
          <div className="row" style={{ alignItems: 'flex-start', gap: 32 }}>
            {/* Main column */}
            <div className="grow" style={{ minWidth: 0 }}>
              {/* Order summary card */}
              <div className="card card-pad" style={{ marginBottom: 20 }}>
                <div className="row center between" style={{ marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'var(--fdisplay)', fontSize: 17, fontWeight: 700 }}>
                    <IconCart className="" /> Resumo do pedido
                  </h2>
                  <span className="tag tag-gold">{cartCount} cartas</span>
                </div>

                <div className="col" style={{ gap: 0 }}>
                  {cart.map((item, idx) => (
                    <div key={idx} className="deckline" style={{ padding: '10px 0' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--gold-2)', minWidth: 26 }}>
                        {item.qty}x
                      </span>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.cardName}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {item.set} · {item.num}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                        <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                          {fmt0(item.price * item.qty)}
                        </span>
                        <br />
                        <span className="mono" style={{ fontSize: 9.5, color: 'var(--muted)' }}>
                          {fmt0(item.price)} un
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="divider" style={{ margin: '14px 0' }} />
                <div className="row center between">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Subtotal</span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 18, color: 'var(--gold-2)' }}>
                    {fmt(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Store comparison */}
              <div className="card card-pad" style={{ marginBottom: 20 }}>
                <div className="row center between" style={{ marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'var(--fdisplay)', fontSize: 17, fontWeight: 700 }}>
                    <IconStore className="" /> Comparação entre lojas
                  </h2>
                  <TagUI variant="violet">
                    <IconBrain className="" /> IA otimizada
                  </TagUI>
                </div>

                <div className="col gap-10">
                  {storeOptions.map((opt, idx) => {
                    const isBest = idx === 0;
                    const total = opt.subtotalBrl + opt.shippingBrl;
                    return (
                      <div
                        key={opt.sellerId || idx}
                        className="row center between"
                        style={{
                          padding: '13px 15px',
                          background: isBest ? 'var(--teal-bg)' : 'var(--surface)',
                          border: `1px solid ${isBest ? 'var(--teal-bd)' : 'var(--border)'}`,
                          borderRadius: 'var(--r-md)',
                          transition: '.14s',
                        }}
                      >
                        <div className="row center gap-12">
                          <div>
                            <StoreBadge name={opt.displayName} verified={opt.isVerified} />
                            <div className="row center gap-10" style={{ marginTop: 3 }}>
                              <Stars rating={4.5} />
                              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {opt.trustLevel || 'medium'} trust
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          {isBest && <TagUI variant="teal">Melhor preço</TagUI>}
                          <div className="mono" style={{ fontWeight: 700, fontSize: 16, marginTop: 2, color: isBest ? 'var(--teal-2)' : 'var(--text)' }}>
                            {fmt(total)}
                          </div>
                          <div className="mono" style={{ fontSize: 9.5, color: 'var(--muted)' }}>
                            {opt.shippingBrl === 0 ? 'Frete grátis' : `+ ${fmt0(opt.shippingBrl)} frete`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show missing cards warning */}
                {optimization?.missing && optimization.missing.length > 0 && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--down-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--down-bd)' }}>
                    <span style={{ fontSize: 13, color: 'var(--down)', fontWeight: 600 }}>
                      Cartas não encontradas: {optimization.missing.map(m => m.cardSlug).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Trust card */}
              <div className="card card-pad" style={{ borderColor: 'var(--teal-bd)', background: 'color-mix(in oklch, var(--teal) 8%, var(--card))' }}>
                <div className="row center gap-12">
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--teal-bg)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                    <IconShield className="" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--fdisplay)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                      Compra protegida · TCGHub
                    </h3>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                      Seu pagamento fica em custódia (escrow) até a loja despachar.
                      Em caso de problemas, o reembolso é integral. Todas as lojas
                      são verificadas manualmente por nossa equipe.
                    </p>
                  </div>
                </div>
                <div className="trust-row" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div className="trust-item"><IconShield className="" /> Escrow completo</div>
                  <div className="trust-item"><IconTag className="" /> Reembolso garantido</div>
                  <div className="trust-item"><IconBack className="" /> Suporte 48h</div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ width: 340, flex: '0 0 340px', position: 'sticky', top: 'calc(var(--nav-h) + 20px)', alignSelf: 'flex-start' }}>
              <div className="card card-pad">
                <h2 style={{ fontFamily: 'var(--fdisplay)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
                  Resumo final
                </h2>

                {bestOption && (
                  <>
                    {/* Selected store */}
                    <div className="row center between" style={{ padding: '10px 12px', background: 'var(--teal-bg)', border: '1px solid var(--teal-bd)', borderRadius: 'var(--r-sm)', marginBottom: 14 }}>
                      <div>
                        <StoreBadge name={bestOption.displayName} verified={bestOption.isVerified} />
                        <div className="row center gap-8" style={{ marginTop: 3 }}>
                          <Stars rating={4.5} />
                          <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                            {bestOption.trustLevel || 'high'} trust
                          </span>
                        </div>
                      </div>
                      <TagUI variant="teal">Otimizada</TagUI>
                    </div>

                    {/* Price breakdown */}
                    <div className="col gap-8" style={{ marginBottom: 14 }}>
                      <div className="row center between">
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Subtotal ({cartCount} cartas)</span>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{fmt(bestOption.subtotalBrl)}</span>
                      </div>
                      <div className="row center between">
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Frete</span>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                          {bestOption.shippingBrl === 0 ? (
                            <span style={{ color: 'var(--up)' }}>Grátis</span>
                          ) : fmt0(bestOption.shippingBrl)}
                        </span>
                      </div>
                    </div>

                    <hr className="divider" style={{ marginBottom: 14 }} />

                    <div className="row center between" style={{ marginBottom: 20 }}>
                      <span style={{ fontFamily: 'var(--fdisplay)', fontSize: 18, fontWeight: 700 }}>Total</span>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 24, color: 'var(--gold-2)', fontFamily: 'var(--fdisplay)' }}>
                        {fmt(bestOption.subtotalBrl + bestOption.shippingBrl)}
                      </span>
                    </div>

                    <button className="btn btn-gold btn-block btn-lg" onClick={handleCheckout}>
                      <IconSpark /> Finalizar compra
                    </button>
                  </>
                )}

                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
                  Ao finalizar você concorda com nossos termos. Compra 100% protegida.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
