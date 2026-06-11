'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { TagUI, fmt, fmt0 } from '@/components/ui';
import { IconSearch, IconCart, IconTag, IconCheck, IconPlus, IconMinus, IconTrash, IconSpark, IconLayers } from '@/components/icons';
import type { BuylistEntry, ApiCard, VisionCardIdentification, BatchCardResult } from '@/types';
import CameraScanner from '@/components/CameraScanner';
import BatchScanner from '@/components/BatchScanner';

// ─── State types ────────────────────────────────────────────────────────────

interface CartItem {
  entry: BuylistEntry;
  quantity: number;
}

type Tab = 'search' | 'cart' | 'history' | 'scan';
type ScanMode = 'single' | 'batch';

export default function ScannerPage() {
  const [tab, setTab] = useState<Tab>('search');
  const [scanMode, setScanMode] = useState<ScanMode>('single');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [allEntries, setAllEntries] = useState<BuylistEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BuylistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  // History
  const [lots, setLots] = useState<any[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);

  // ─── Fetch active buylist on mount ───────────────────────────────────────

  useEffect(() => {
    fetchActiveBuylist();
  }, []);

  const fetchActiveBuylist = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ entries: BuylistEntry[] }>('/api/buylist/active');
      setAllEntries(data.entries || []);
      setFilteredEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar buylist');
    } finally {
      setLoading(false);
    }
  };

  // ─── Search filter ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(allEntries.slice(0, 50));
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = allEntries.filter(
      e => e.cardSlug.toLowerCase().includes(q) || e.storeName.toLowerCase().includes(q)
    );
    setFilteredEntries(filtered.slice(0, 50));
  }, [searchQuery, allEntries]);

  // ─── Cart operations ─────────────────────────────────────────────────────

  const addToCart = (entry: BuylistEntry) => {
    setCart(prev => {
      const existing = prev.find(
        c => c.entry.cardSlug === entry.cardSlug && c.entry.storeId === entry.storeId
      );
      if (existing) {
        return prev.map(c =>
          c === existing
            ? { ...c, quantity: Math.min(c.quantity + 1, entry.maxQty) }
            : c
        );
      }
      return [...prev, { entry, quantity: 1 }];
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuantity = (idx: number, delta: number) => {
    setCart(prev =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.entry.maxQty) return item;
        return { ...item, quantity: newQty };
      })
    );
  };

  // ─── Submit lot ──────────────────────────────────────────────────────────

  const handleSubmitLot = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      // Group by buylist
      const byBuylist = new Map<string, CartItem[]>();
      for (const item of cart) {
        const arr = byBuylist.get(item.entry.buylistId) || [];
        arr.push(item);
        byBuylist.set(item.entry.buylistId, arr);
      }

      // Submit first buylist lot
      const [buylistId, items] = byBuylist.entries().next().value!;
      const res = await apiFetch<{ lot_id: string; total_credit_brl: number }>('/api/buylist/lots', {
        method: 'POST',
        body: JSON.stringify({
          buylist_id: buylistId,
          items: items.map(item => ({
            card_slug: item.entry.cardSlug,
            condition: item.entry.condition,
            is_foil: item.entry.isFoil,
            quantity: item.quantity,
            quoted_price_brl: item.entry.priceBrl,
            buylist_entry_id: item.entry.buylistId ? undefined : undefined,
          })),
        }),
      });
      setSubmitted(res.lot_id);
      setCart([]);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar lote');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Fetch my lots ───────────────────────────────────────────────────────

  const fetchMyLots = async () => {
    setLotsLoading(true);
    try {
      const data = await apiFetch<{ lots: any[] }>('/api/buylist/lots/mine');
      setLots(data.lots || []);
    } catch (err: any) {
      // Silent fail on unauth
    } finally {
      setLotsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'history') fetchMyLots();
  }, [tab]);

  // ─── Collection / Buylist callbacks (Vision scanner) ───────────────────

  const handleAddToCollection = (card: ApiCard | null, _identification: VisionCardIdentification | null) => {
    // TODO: integrate with collection API
    console.log("Add to collection", { card });
  };

  const handleAddToBuylist = (card: ApiCard | null, identification: VisionCardIdentification | null) => {
    if (identification) {
      setSearchQuery(identification.card_name);
      setTab('search');
    }
  };

  // Batch scan: add identified cards to cart as buylist search
  const handleBatchToBuylist = (cards: BatchCardResult[]) => {
    // Search for each card name in buylist
    const names = cards
      .filter(c => c.found && c.card)
      .map(c => c.identification.card_name);
    if (names.length > 0) {
      setSearchQuery(names[0]);
      setTab('search');
    }
  };

  // ─── Computed totals ─────────────────────────────────────────────────────

  const cartTotal = cart.reduce((sum, item) => sum + item.entry.priceBrl * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Scanner · Buylist</div>
          <h1 style={{ fontFamily: 'var(--fdisplay)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Venda suas cartas para <span style={{ color: 'var(--gold)' }}>lojas</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Encontre quem paga mais pelas suas cartas. Simule ganhos, monte seu lote e venda direto.
          </p>
        </div>

        {/* Tabs */}
        <div className="mode-toggle" style={{ marginBottom: 24 }}>
          <button className={tab === 'scan' ? 'on' : ''} onClick={() => setTab('scan')}>
            <IconSpark /> Escanear
          </button>
          <button className={tab === 'search' ? 'on' : ''} onClick={() => setTab('search')}>
            <IconSearch /> Buscar cartas
          </button>
          <button className={tab === 'cart' ? 'on' : ''} onClick={() => setTab('cart')}>
            <IconCart /> Meu lote {cartCount > 0 && `(${cartCount})`}
          </button>
          <button className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>
            <IconTag /> Histórico
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 16px', background: 'var(--down-bg)', border: '1px solid var(--down)', borderRadius: 'var(--r-sm)', color: 'var(--down)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {submitted && (
          <div style={{ padding: '14px 20px', background: 'var(--up-bg)', border: '1px solid var(--up)', borderRadius: 'var(--r-sm)', color: 'var(--up)', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
            <IconCheck /> Lote enviado com sucesso! ID: {submitted.slice(0, 8)}...
          </div>
        )}

        {/* ── SCAN TAB ──────────────────────────────────────────────────── */}
        {tab === 'scan' && (
          <div>
            {/* Mode toggle */}
            <div className="mode-toggle" style={{ marginBottom: 16 }}>
              <button className={scanMode === 'single' ? 'on' : ''} onClick={() => setScanMode('single')}>
                <IconSpark /> Carta individual
              </button>
              <button className={scanMode === 'batch' ? 'on' : ''} onClick={() => setScanMode('batch')}>
                <IconLayers /> Binder (lote)
              </button>
            </div>

            {scanMode === 'single' ? (
              <CameraScanner
                onAddToCollection={handleAddToCollection}
                onAddToBuylist={handleAddToBuylist}
              />
            ) : (
              <BatchScanner
                onAddToCollection={(card, qty) => handleAddToCollection(card, null)}
                onAddToBuylist={handleBatchToBuylist}
              />
            )}
          </div>
        )}

        {/* ── SEARCH TAB ────────────────────────────────────────────────── */}
        {tab === 'search' && (
          <div>
            <div className="row" style={{ gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <input
                  className="field"
                  type="text"
                  placeholder="Buscar carta (ex: charizard, pikachu)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-gold btn-sm" onClick={fetchActiveBuylist} disabled={loading}>
                <IconSearch /> Atualizar
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                Carregando buylists ativas...
              </div>
            )}

            {!loading && filteredEntries.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                <IconTag />
                <p style={{ marginTop: 8 }}>Nenhuma buylist ativa encontrada.</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Volte mais tarde ou ajuste sua busca.</p>
              </div>
            )}

            {!loading && filteredEntries.length > 0 && (
              <div className="col gap-8">
                {filteredEntries.map((entry, idx) => (
                  <div key={`${entry.storeId}-${entry.cardSlug}-${idx}`} className="card card-pad row between" style={{ gap: 16 }}>
                    <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{entry.cardSlug}</span>
                      <div className="row center gap-8">
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{entry.storeName}</span>
                        <TagUI variant="neutral">{entry.condition}</TagUI>
                        {entry.isFoil && <TagUI variant="gold">Foil</TagUI>}
                      </div>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end', gap: 4, flex: '0 0 auto' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 16, color: 'var(--gold-2)' }}>
                        {fmt0(entry.priceBrl)}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>até {entry.maxQty}x</span>
                    </div>
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => addToCart(entry)}
                      style={{ flex: '0 0 auto' }}
                    >
                      <IconPlus /> Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CART TAB ──────────────────────────────────────────────────── */}
        {tab === 'cart' && (
          <div>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                <IconCart />
                <p style={{ marginTop: 8 }}>Seu lote está vazio.</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  Vá para a aba "Buscar cartas" e adicione cartas ao seu lote de venda.
                </p>
              </div>
            ) : (
              <>
                {/* Cart items */}
                <div className="col gap-8" style={{ marginBottom: 24 }}>
                  {cart.map((item, idx) => (
                    <div key={idx} className="card card-pad row between" style={{ gap: 16 }}>
                      <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.entry.cardSlug}</span>
                        <div className="row center gap-8">
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{item.entry.storeName}</span>
                          <TagUI variant="neutral">{item.entry.condition}</TagUI>
                          {item.entry.isFoil && <TagUI variant="gold">Foil</TagUI>}
                        </div>
                      </div>

                      <div className="row center gap-6" style={{ flex: '0 0 auto' }}>
                        <button className="qbtn" onClick={() => updateQuantity(idx, -1)}>
                          <IconMinus />
                        </button>
                        <span className="mono" style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button className="qbtn add" onClick={() => updateQuantity(idx, 1)}>
                          <IconPlus />
                        </button>
                      </div>

                      <div className="col" style={{ alignItems: 'flex-end', gap: 2, flex: '0 0 auto' }}>
                        <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold-2)' }}>
                          {fmt0(item.entry.priceBrl * item.quantity)}
                        </span>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {fmt0(item.entry.priceBrl)} un
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        style={{ color: 'var(--down)', display: 'flex', flex: '0 0 auto' }}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="card card-pad" style={{ borderColor: 'var(--gold-bd)', background: 'var(--gold-bg)' }}>
                  <div className="row between" style={{ marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>Simulação de ganhos</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {cart.length} carta{cart.length > 1 ? 's' : ''} · {cartCount} unidade{cartCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="row between" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Total estimado</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 24, color: 'var(--gold-2)' }}>
                      {fmt(cartTotal)}
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 }}>
                    Os valores são baseados nos preços atuais das buylists. O pagamento é feito em crédito na plataforma após a confirmação do recebimento pela loja.
                  </p>
                  <button
                    className="btn btn-gold btn-lg btn-block"
                    onClick={handleSubmitLot}
                    disabled={submitting}
                  >
                    <IconCheck /> {submitting ? 'Enviando...' : 'Confirmar lote de venda'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div>
            {lotsLoading ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Carregando...</div>
            ) : lots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                <IconTag />
                <p style={{ marginTop: 8 }}>Nenhum lote de venda encontrado.</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Seus lotes enviados aparecerão aqui.</p>
              </div>
            ) : (
              <div className="col gap-8">
                {lots.map((lot, idx) => (
                  <div key={idx} className="card card-pad row between" style={{ gap: 16 }}>
                    <div className="col gap-2">
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{lot.storeName}</span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                        {new Date(lot.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end', gap: 2 }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold-2)' }}>
                        {fmt(parseFloat(lot.totalCreditBrl))}
                      </span>
                      <TagUI variant={lot.status === 'settled' ? 'teal' : lot.status === 'received' ? 'violet' : 'neutral'}>
                        {statusLabel(lot.status)}
                      </TagUI>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    received: 'Recebido',
    settled: 'Pago',
    cancelled: 'Cancelado',
  };
  return map[status] || status;
}
