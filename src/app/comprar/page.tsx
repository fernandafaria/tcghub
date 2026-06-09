'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Card, BuyCategory } from '@/types';
import { CARDS, PRODUCTS, PRODUCT_CATS } from '@/data';
import { Stepper, Chip, ProductTile, EnergyPips, fmt, fmt0 } from '@/components/ui';
import {
  IconSearch, IconCart, IconSpark, IconStar, IconCards,
  IconPkg, IconLayers, IconGrid, IconBrain, IconTrash,
  IconPlus, IconMinus, IconArrow,
} from '@/components/icons';
import { useApi } from '@/hooks/useApi';
import { apiCardsToCards } from '@/lib/adapters';
import type { ApiCardsResponse } from '@/types';

// Energy/type colors for swatches
const ENERGY_OPTIONS = [
  { id: 'fire', color: '#f0683c', label: 'Fire' },
  { id: 'water', color: '#3d9be0', label: 'Water' },
  { id: 'grass', color: '#4fb56a', label: 'Grass' },
  { id: 'lightning', color: '#f2c94c', label: 'Lightning' },
  { id: 'psychic', color: '#b46fd6', label: 'Psychic' },
  { id: 'fighting', color: '#c9603f', label: 'Fighting' },
  { id: 'dark', color: '#7d7390', label: 'Dark' },
  { id: 'metal', color: '#9aa6b2', label: 'Metal' },
  { id: 'dragon', color: '#caa23f', label: 'Dragon' },
  { id: 'colorless', color: '#c4bdd0', label: 'Colorless' },
];

const CAT_TITLES: Record<BuyCategory, { title: string; subtitle: string }> = {
  avulsas: { title: 'Montar deck · Cartas avulsas', subtitle: 'Escolha carta a carta e compare preços entre lojas verificadas' },
  selado: { title: 'Produtos selados', subtitle: 'Boosters, ETBs, coleções premium — lacrados e verificados' },
  deck: { title: 'Decks prontos', subtitle: 'Decks de torneio para começar a jogar agora' },
  acessorio: { title: 'Acessórios', subtitle: 'Sleeves, binders, deck boxes e proteções' },
  graded: { title: 'Cartas graded', subtitle: 'Slabs certificados PSA & BGS em perfeito estado' },
};

const CAT_ICONS: Record<BuyCategory, React.ReactNode> = {
  avulsas: <IconCards />,
  selado: <IconPkg />,
  deck: <IconLayers />,
  acessorio: <IconGrid />,
  graded: <IconStar />,
};

type DeckEntry = { card: Card; qty: number };

function ComprarContent() {
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('cat') as BuyCategory) || 'avulsas';

  const [category, setCategory] = useState<BuyCategory>(initialCat);
  const [mode, setMode] = useState<'pick' | 'paste'>('pick');
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('');
  const [deck, setDeck] = useState<DeckEntry[]>([]);
  const [decklistText, setDecklistText] = useState('');

  // ─── Fetch cards from API ──────────────────────────────────────
  const { data: apiData, loading: cardsLoading } =
    useApi<ApiCardsResponse>('/api/cards?limit=200');

  const apiCards: Card[] = useMemo(() => {
    if (!apiData?.cards) return [];
    return apiCardsToCards(apiData.cards);
  }, [apiData]);

  // Combine API cards with mock data as fallback
  const allCards: Card[] = useMemo(() => {
    if (apiCards.length > 0) return apiCards;
    return CARDS;
  }, [apiCards]);

  // Available sets from cards
  const sets = useMemo(() => {
    const s = new Set(allCards.map((c) => c.set));
    return Array.from(s).sort();
  }, [allCards]);

  // Filtered cards for pick mode
  const filteredCards = useMemo(() => {
    return allCards.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())
        && !c.set.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedSet && c.set !== selectedSet) return false;
      if (selectedEnergy && !c.energy.includes(selectedEnergy)) return false;
      return true;
    });
  }, [search, selectedSet, selectedEnergy, allCards]);

  // Get products for non-avulsas categories
  const catProducts = useMemo(() => {
    return PRODUCTS.filter((p) => p.cat === category);
  }, [category]);

  // Deck helpers
  const deckEntry = (card: Card): DeckEntry | undefined =>
    deck.find((d) => d.card.id === card.id);

  const addCard = (card: Card) => {
    setDeck((prev) => {
      const existing = prev.find((d) => d.card.id === card.id);
      if (existing) {
        return prev.map((d) =>
          d.card.id === card.id ? { ...d, qty: d.qty + 1 } : d
        );
      }
      return [...prev, { card, qty: 1 }];
    });
  };

  const removeCard = (card: Card) => {
    setDeck((prev) => {
      const existing = prev.find((d) => d.card.id === card.id);
      if (!existing) return prev;
      if (existing.qty <= 1) {
        return prev.filter((d) => d.card.id !== card.id);
      }
      return prev.map((d) =>
        d.card.id === card.id ? { ...d, qty: d.qty - 1 } : d
      );
    });
  };

  const removeAll = (card: Card) => {
    setDeck((prev) => prev.filter((d) => d.card.id !== card.id));
  };

  const deckTotal = useMemo(() => {
    return deck.reduce((sum, d) => sum + d.card.base * d.qty, 0);
  }, [deck]);

  const deckCount = useMemo(() => {
    return deck.reduce((sum, d) => sum + d.qty, 0);
  }, [deck]);

  // Parse decklist
  const parseDecklist = () => {
    const lines = decklistText.trim().split('\n').filter(Boolean);
    const entries: DeckEntry[] = [];

    for (const line of lines) {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) continue;
      const qty = parseInt(match[1], 10);
      const rest = match[2].trim();

      // Try to match by exact name first, then by set+num pattern
      let card = allCards.find((c) => c.name === rest);
      if (!card) {
        const parts = rest.split(' ');
        if (parts.length >= 3) {
          const num = parts[parts.length - 1];
          const setPart = parts[parts.length - 2];
          const namePart = parts.slice(0, -2).join(' ');
          card = allCards.find(
            (c) =>
              c.set.toLowerCase().includes(setPart.toLowerCase()) &&
              c.num.startsWith(num) &&
              c.name.toLowerCase().includes(namePart.toLowerCase())
          );
        }
      }
      if (!card) {
        card = allCards.find((c) =>
          c.name.toLowerCase().includes(rest.toLowerCase()) ||
          rest.toLowerCase().includes(c.name.toLowerCase())
        );
      }
      if (card) {
        entries.push({ card, qty });
      }
    }

    if (entries.length > 0) {
      setDeck(entries);
    }
  };

  const cat = CAT_TITLES[category];

  return (
    <div className="page">
      <div className="wrap">
        {/* Stepper */}
        <Stepper steps={['Montar carrinho', 'Revisar', 'Checkout']} active={1} />

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <div className="row center gap-10" style={{ marginBottom: 4 }}>
            <span style={{ color: 'var(--gold)', display: 'flex' }}>
              {CAT_ICONS[category]}
            </span>
            <h1
              style={{
                fontFamily: 'var(--fdisplay)',
                fontSize: 'clamp(22px, 2.4vw, 28px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {cat.title}
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, marginLeft: 27 }}>
            {cat.subtitle}
          </p>
        </div>

        {/* Category chips */}
        <div className="row wrapf gap-8" style={{ marginBottom: 28 }}>
          {PRODUCT_CATS.map(([id, label]) => (
            <Chip
              key={id}
              active={category === id}
              onClick={() => setCategory(id as BuyCategory)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {CAT_ICONS[id as BuyCategory]}
                {label}
              </span>
            </Chip>
          ))}
        </div>

        {/* Main content + sidebar */}
        <div className="row" style={{ alignItems: 'flex-start', gap: 32 }}>
          {/* Main area */}
          <div className="grow" style={{ minWidth: 0 }}>
            {category === 'avulsas' ? (
              <>
                {/* Mode toggle */}
                <div className="row center between" style={{ marginBottom: 18 }}>
                  <div className="mode-toggle">
                    <button
                      className={mode === 'pick' ? 'on' : ''}
                      onClick={() => setMode('pick')}
                    >
                      Carta a carta
                    </button>
                    <button
                      className={mode === 'paste' ? 'on' : ''}
                      onClick={() => setMode('paste')}
                    >
                      Colar decklist
                    </button>
                  </div>
                  {mode === 'pick' && (
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {cardsLoading ? 'Carregando...' : `${filteredCards.length} cartas`}
                    </span>
                  )}
                </div>

                {mode === 'pick' ? (
                  <>
                    {/* Filters */}
                    <div className="col gap-12" style={{ marginBottom: 20 }}>
                      {/* Search */}
                      <div className="row" style={{ gap: 10 }}>
                        <div
                          className="row"
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--r-pill)',
                            gap: 9,
                          }}
                        >
                          <IconSearch className="" />
                          <input
                            type="text"
                            placeholder="Buscar carta, set..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                              background: 'none',
                              border: 'none',
                              outline: 'none',
                              color: 'var(--text)',
                              fontSize: 14,
                              flex: 1,
                              fontFamily: 'inherit',
                            }}
                          />
                          {search && (
                            <button
                              onClick={() => setSearch('')}
                              style={{
                                color: 'var(--muted)',
                                fontSize: 13,
                                padding: '2px 8px',
                                borderRadius: 'var(--r-pill)',
                                background: 'var(--bg-2)',
                                border: 'none',
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Set chips */}
                      <div className="row wrapf gap-6">
                        <Chip active={selectedSet === ''} onClick={() => setSelectedSet('')}>
                          Todos os sets
                        </Chip>
                        {sets.slice(0, 10).map((s) => (
                          <Chip
                            key={s}
                            active={selectedSet === s}
                            onClick={() => setSelectedSet(selectedSet === s ? '' : s)}
                          >
                            {s}
                          </Chip>
                        ))}
                      </div>

                      {/* Energy swatches */}
                      <div className="row wrapf gap-6">
                        <button
                          className={`swatch all ${selectedEnergy === '' ? 'on' : ''}`}
                          onClick={() => setSelectedEnergy('')}
                        >
                          Todas
                        </button>
                        {ENERGY_OPTIONS.map((e) => (
                          <button
                            key={e.id}
                            className={`swatch ${selectedEnergy === e.id ? 'on' : ''}`}
                            style={{ ['--sw' as string]: e.color }}
                            onClick={() =>
                              setSelectedEnergy(selectedEnergy === e.id ? '' : e.id)
                            }
                            title={e.label}
                          >
                            <i />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card grid - builder tiles */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(154px, 1fr))',
                        gap: 14,
                      }}
                    >
                      {filteredCards.map((card) => {
                        const entry = deckEntry(card);
                        const inDeck = !!entry;
                        return (
                          <div
                            key={card.id}
                            className={`btile ${inDeck ? 'on' : ''}`}
                          >
                            {/* Card image placeholder */}
                            <div
                              className={`cardimg ${card.art}`}
                              style={{ borderRadius: 10 }}
                            >
                              <div className="shine" />
                              <div className="ph">
                                {card.name}
                                <br />· art ·
                              </div>
                              <div style={{ position: 'absolute', top: 6, left: 7, zIndex: 1 }}>
                                <EnergyPips energy={card.energy} size={9} />
                              </div>
                              {card.foil && (
                                <div
                                  className="rar holo-text"
                                  style={{ position: 'absolute', top: 6, right: 7 }}
                                >
                                  <span className="gl">★</span>
                                </div>
                              )}
                            </div>

                            {/* Quantity badge */}
                            {inDeck && (
                              <span className="qbadge">{entry.qty}</span>
                            )}

                            {/* Info */}
                            <div className="col gap-4">
                              <div
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  lineHeight: 1.2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {card.name}
                              </div>
                              <div
                                className="mono"
                                style={{ fontSize: 10.5, color: 'var(--muted)' }}
                              >
                                {card.set} · {card.num}
                              </div>
                              <div
                                className="mono"
                                style={{ fontWeight: 700, fontSize: 13.5 }}
                              >
                                {fmt0(card.base)}
                              </div>
                            </div>

                            {/* Quantity controls */}
                            <div className="qstep">
                              <button
                                className="qbtn"
                                onClick={() => removeCard(card)}
                                disabled={!inDeck}
                              >
                                <IconMinus />
                              </button>
                              <span className="qn mono">{entry?.qty ?? 0}</span>
                              <button
                                className="qbtn add"
                                onClick={() => addCard(card)}
                              >
                                <IconPlus />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {filteredCards.length === 0 && !cardsLoading && (
                      <div
                        className="card card-pad"
                        style={{ textAlign: 'center', color: 'var(--muted)' }}
                      >
                        Nenhuma carta encontrada. Tente ajustar os filtros.
                      </div>
                    )}

                    {cardsLoading && (
                      <div
                        className="card card-pad"
                        style={{ textAlign: 'center', color: 'var(--muted)' }}
                      >
                        Carregando cartas da API...
                      </div>
                    )}
                  </>
                ) : (
                  /* Paste mode */
                  <div className="col gap-16">
                    <div>
                      <label
                        className="eyebrow"
                        style={{ display: 'block', marginBottom: 8 }}
                      >
                        Cole sua decklist
                      </label>
                      <textarea
                        className="field"
                        style={{ minHeight: 220 }}
                        placeholder={`3 Charizard ex OBF 125\n2 Pikachu ex SSP 238\n4 Gardevoir ex OBF 086\n1 Mewtwo VSTAR PGO 031`}
                        value={decklistText}
                        onChange={(e) => setDecklistText(e.target.value)}
                      />
                      <p
                        style={{
                          fontSize: 11.5,
                          color: 'var(--muted)',
                          marginTop: 8,
                        }}
                      >
                        Formato: quantidade + nome da carta + sigla do set + número.
                        Ex: &ldquo;3 Charizard ex OBF 125&rdquo;
                      </p>
                    </div>
                    <button
                      className="btn btn-violet btn-lg"
                      onClick={parseDecklist}
                      disabled={!decklistText.trim()}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <IconBrain className="" />
                      Ler lista e otimizar
                    </button>

                    {/* Show parsed deck */}
                    {deck.length > 0 && (
                      <div className="card card-pad">
                        <h3
                          style={{
                            fontFamily: 'var(--fdisplay)',
                            fontSize: 17,
                            fontWeight: 700,
                            marginBottom: 12,
                          }}
                        >
                          Lista reconhecida · {deckCount} cartas
                        </h3>
                        <div className="col gap-6">
                          {deck.map((entry) => (
                            <div
                              key={entry.card.id}
                              className="row center between"
                              style={{
                                padding: '8px 0',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <div className="row center gap-10">
                                <span
                                  className="mono"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: 'var(--gold-2)',
                                    minWidth: 28,
                                  }}
                                >
                                  {entry.qty}x
                                </span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                                    {entry.card.name}
                                  </div>
                                  <div
                                    className="mono"
                                    style={{ fontSize: 10.5, color: 'var(--muted)' }}
                                  >
                                    {entry.card.set} · {entry.card.num}
                                  </div>
                                </div>
                              </div>
                              <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                                {fmt0(entry.card.base)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Non-avulsas category: show product tiles */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 20,
                }}
              >
                {catProducts.map((product) => (
                  <div
                    key={product.id}
                    className="tile"
                    onClick={() => {
                      setDeck((prev) => {
                        const existing = prev.find(
                          (d) => d.card.id === product.id
                        );
                        if (existing) {
                          return prev.map((d) =>
                            d.card.id === product.id
                              ? { ...d, qty: d.qty + 1 }
                              : d
                          );
                        }
                        const pseudoCard: Card = {
                          id: product.id,
                          tcg: product.tcg || 'pokemon',
                          name: product.name,
                          set: product.cat,
                          num: '',
                          rarity: '',
                          energy: [],
                          gc: 'var(--violet)',
                          base: product.price,
                          wk: 0,
                          mo: 0,
                          art: '',
                          foil: false,
                          meta: '',
                          tags: [],
                        };
                        return [...prev, { card: pseudoCard, qty: 1 }];
                      });
                    }}
                  >
                    <ProductTile product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar - Cart */}
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
              <div className="row center between" style={{ marginBottom: 16 }}>
                <h2
                  style={{
                    fontFamily: 'var(--fdisplay)',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Seu carrinho
                </h2>
                <span className="tag tag-neutral mono">
                  {deckCount} itens
                </span>
              </div>

              {deck.length === 0 ? (
                <div className="col" style={{ gap: 10, alignItems: 'center', padding: '24px 0' }}>
                  <span style={{ color: 'var(--muted)', display: 'flex' }}>
                    <IconCart />
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
                    Adicione cartas ou produtos ao carrinho para continuar
                  </span>
                </div>
              ) : (
                <>
                  <div className="col gap-6" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
                    {deck.map((entry) => (
                      <div
                        key={entry.card.id}
                        className="row center between"
                        style={{
                          padding: '6px 0',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.card.name}
                          </span>
                          <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                            {fmt0(entry.card.base)} × {entry.qty}
                          </span>
                        </div>
                        <div className="row center" style={{ gap: 6 }}>
                          <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>
                            {fmt0(entry.card.base * entry.qty)}
                          </span>
                          <button
                            onClick={() => removeAll(entry.card)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--muted)',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                            }}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="row between center"
                    style={{
                      padding: '10px 0',
                      borderTop: '2px solid var(--border)',
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Total</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 16, color: 'var(--gold-2)' }}>
                      {fmt0(deckTotal)}
                    </span>
                  </div>

                  <a href="/checkout" className="btn btn-gold btn-lg" style={{ width: '100%', textAlign: 'center' }}>
                    <IconSpark /> Ir para checkout
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComprarPage() {
  return (
    <Suspense fallback={
      <div className="page"><div className="wrap"><p style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: 40 }}>Carregando...</p></div></div>
    }>
      <ComprarContent />
    </Suspense>
  );
}
