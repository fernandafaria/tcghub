import { Stepper, TagUI, StoreBadge, Stars, fmt, fmt0 } from '@/components/ui';
import {
  IconShield, IconStore, IconCart, IconBack, IconBrain,
  IconArrow, IconTag,
} from '@/components/icons';
import { STORES } from '@/data';

// Simulated order data (in a real app this would come from cart state/URL params)
const ORDER_ITEMS = [
  { cardId: 'c1', qty: 3, name: 'Charizard ex', set: 'Obsidian Flames', num: '125/197', price: 489 },
  { cardId: 'c2', qty: 2, name: 'Pikachu ex', set: 'Surging Sparks', num: '238/191', price: 312 },
  { cardId: 'c4', qty: 4, name: 'Gardevoir ex', set: 'Obsidian Flames', num: '086/197', price: 84 },
  { cardId: 'c3', qty: 1, name: 'Mewtwo VSTAR', set: 'Pokémon GO', num: '031/078', price: 74.9 },
];

const ORDER_TOTAL = ORDER_ITEMS.reduce((sum, i) => sum + i.price * i.qty, 0);

// Store comparison data (simulated)
const STORE_OPTIONS = [
  { store: STORES[0], subtotal: ORDER_TOTAL, shipping: 14.9, total: ORDER_TOTAL + 14.9 },
  { store: STORES[1], subtotal: ORDER_TOTAL - 23.1, shipping: 0, total: ORDER_TOTAL - 23.1 },
  { store: STORES[2], subtotal: ORDER_TOTAL + 5.5, shipping: 12.0, total: ORDER_TOTAL + 17.5 },
  { store: STORES[3], subtotal: ORDER_TOTAL - 8.0, shipping: 18.0, total: ORDER_TOTAL + 10.0 },
];

// Automatically select the best option
const BEST_OPTION = STORE_OPTIONS.reduce((best, opt) =>
  opt.total < best.total ? opt : best
);

export default function CheckoutPage() {
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

        {/* Two-column layout */}
        <div className="row" style={{ alignItems: 'flex-start', gap: 32 }}>
          {/* Main column */}
          <div className="grow" style={{ minWidth: 0 }}>
            {/* Order summary card */}
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
                  {' '}Resumo do pedido
                </h2>
                <span className="tag tag-gold">
                  {ORDER_ITEMS.reduce((s, i) => s + i.qty, 0)} cartas
                </span>
              </div>

              <div className="col" style={{ gap: 0 }}>
                {ORDER_ITEMS.map((item, idx) => (
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
                        color: 'var(--gold-2)',
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
                <span style={{ fontWeight: 600, fontSize: 14 }}>Subtotal</span>
                <span
                  className="mono"
                  style={{ fontWeight: 700, fontSize: 18, color: 'var(--gold-2)' }}
                >
                  {fmt(ORDER_TOTAL)}
                </span>
              </div>
            </div>

            {/* Store comparison */}
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <div className="row center between" style={{ marginBottom: 16 }}>
                <h2
                  style={{
                    fontFamily: 'var(--fdisplay)',
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  <IconStore className="" />
                  {' '}Comparação entre lojas
                </h2>
                <TagUI variant="violet">
                  <IconBrain className="" />
                  IA otimizada
                </TagUI>
              </div>

              <div className="col gap-10">
                {STORE_OPTIONS.map((opt, idx) => {
                  const isBest = opt.store.id === BEST_OPTION.store.id;
                  return (
                    <div
                      key={idx}
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
                          <StoreBadge
                            name={opt.store.name}
                            verified={opt.store.verified}
                          />
                          <div
                            className="row center gap-10"
                            style={{ marginTop: 3 }}
                          >
                            <Stars rating={opt.store.rating} />
                            <span
                              className="mono"
                              style={{ fontSize: 10, color: 'var(--muted)' }}
                            >
                              {opt.store.sales} vendas
                            </span>
                            <span
                              className="mono"
                              style={{ fontSize: 10, color: 'var(--muted)' }}
                            >
                              {opt.store.ships}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {isBest && (
                          <TagUI variant="teal">
                            Melhor preço
                          </TagUI>
                        )}
                        <div
                          className="mono"
                          style={{
                            fontWeight: 700,
                            fontSize: 16,
                            marginTop: 2,
                            color: isBest ? 'var(--teal-2)' : 'var(--text)',
                          }}
                        >
                          {fmt(opt.total)}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 9.5, color: 'var(--muted)' }}
                        >
                          {opt.shipping === 0 ? 'Frete grátis' : `+ ${fmt0(opt.shipping)} frete`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trust card */}
            <div
              className="card card-pad"
              style={{
                borderColor: 'var(--teal-bd)',
                background: 'color-mix(in oklch, var(--teal) 8%, var(--card))',
              }}
            >
              <div className="row center gap-12">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--r-md)',
                    background: 'var(--teal-bg)',
                    display: 'grid',
                    placeItems: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <IconShield className="" />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--fdisplay)',
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    Compra protegida · TCGHub
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                    Seu pagamento fica em custódia (escrow) até a loja despachar.
                    Em caso de problemas, o reembolso é integral. Todas as lojas
                    são verificadas manualmente por nossa equipe.
                  </p>
                </div>
              </div>

              <div
                className="trust-row"
                style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}
              >
                <div className="trust-item">
                  <IconShield className="" />
                  Escrow completo
                </div>
                <div className="trust-item">
                  <IconTag className="" />
                  Reembolso garantido
                </div>
                <div className="trust-item">
                  <IconBack className="" />
                  Suporte 48h
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                Resumo final
              </h2>

              {/* Selected store */}
              <div
                className="row center between"
                style={{
                  padding: '10px 12px',
                  background: 'var(--teal-bg)',
                  border: '1px solid var(--teal-bd)',
                  borderRadius: 'var(--r-sm)',
                  marginBottom: 14,
                }}
              >
                <div>
                  <StoreBadge
                    name={BEST_OPTION.store.name}
                    verified={BEST_OPTION.store.verified}
                  />
                  <div
                    className="row center gap-8"
                    style={{ marginTop: 3 }}
                  >
                    <Stars rating={BEST_OPTION.store.rating} />
                    <span
                      className="mono"
                      style={{ fontSize: 10, color: 'var(--muted)' }}
                    >
                      {BEST_OPTION.store.sales} vendas
                    </span>
                  </div>
                </div>
                <TagUI variant="teal">Otimizada</TagUI>
              </div>

              {/* Price breakdown */}
              <div className="col gap-8" style={{ marginBottom: 14 }}>
                <div className="row center between">
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Subtotal ({ORDER_ITEMS.reduce((s, i) => s + i.qty, 0)} cartas)
                  </span>
                  <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                    {fmt(ORDER_TOTAL)}
                  </span>
                </div>
                <div className="row center between">
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Desconto loja
                  </span>
                  <span
                    className="mono"
                    style={{ fontWeight: 600, fontSize: 13, color: 'var(--up)' }}
                  >
                    -{fmt(Math.abs(ORDER_TOTAL - BEST_OPTION.subtotal))}
                  </span>
                </div>
                <div className="row center between">
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Frete
                  </span>
                  <span
                    className="mono"
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    {BEST_OPTION.shipping === 0 ? (
                      <span style={{ color: 'var(--up)' }}>Grátis</span>
                    ) : (
                      fmt0(BEST_OPTION.shipping)
                    )}
                  </span>
                </div>
              </div>

              <hr className="divider" style={{ marginBottom: 14 }} />

              <div className="row center between" style={{ marginBottom: 20 }}>
                <span
                  style={{
                    fontFamily: 'var(--fdisplay)',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Total
                </span>
                <span
                  className="mono"
                  style={{
                    fontWeight: 700,
                    fontSize: 24,
                    color: 'var(--gold-2)',
                    fontFamily: 'var(--fdisplay)',
                  }}
                >
                  {fmt(BEST_OPTION.total)}
                </span>
              </div>

              <button className="btn btn-gold btn-block btn-lg">
                <IconShield className="" />
                Finalizar compra
              </button>

              <p
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  marginTop: 12,
                  textAlign: 'center',
                }}
              >
                Ao finalizar você concorda com nossos termos.
                Compra 100% protegida.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
