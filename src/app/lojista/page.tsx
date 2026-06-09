'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { SectionHead, TagUI, fmt, fmt0 } from '@/components/ui';
import { IconStore, IconChart, IconPkg, IconTag, IconCheck, IconSpark, IconArrow, IconStar, IconSearch, IconCart } from '@/components/icons';
import type { DashboardStats, SalesChartDay, TopCard, CreditInfo } from '@/types';

export default function LojistaDashboardPage() {
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<SalesChartDay[]>([]);
  const [topCards, setTopCards] = useState<TopCard[]>([]);
  const [credit, setCredit] = useState<CreditInfo | null>(null);
  const [storeStatus, setStoreStatus] = useState<any>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── Fetch all dashboard data ────────────────────────────────────────────

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, chartData, topData, creditData, storeData] = await Promise.allSettled([
        apiFetch<DashboardStats>('/api/dashboard/stats'),
        apiFetch<{ chart: SalesChartDay[] }>('/api/dashboard/sales-chart'),
        apiFetch<{ cards: TopCard[] }>('/api/dashboard/top-cards?limit=5'),
        apiFetch<CreditInfo>('/api/credit'),
        apiFetch<any>('/api/stores').catch(() => null),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (chartData.status === 'fulfilled') setChart(chartData.value.chart || []);
      if (topData.status === 'fulfilled') setTopCards(topData.value.cards || []);
      if (creditData.status === 'fulfilled') setCredit(creditData.value);
      if (storeData.status === 'fulfilled') setStoreStatus(storeData.value);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page">
        <div className="wrap">
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <IconSpark />
            <p style={{ marginTop: 12 }}>Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────

  if (error && !stats) {
    return (
      <div className="page">
        <div className="wrap">
          <div className="card card-pad" style={{ textAlign: 'center', borderColor: 'var(--down)', background: 'var(--down-bg)' }}>
            <p style={{ color: 'var(--down)', fontSize: 15, fontWeight: 600 }}>Erro ao carregar dashboard</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{error}</p>
            <button className="btn btn-teal btn-sm" onClick={fetchDashboard} style={{ marginTop: 12 }}>
              Tentar novamente
            </button>
          </div>

          {/* Fallback: show registration form if not logged in / no store */}
          <StoreRegistrationForm />
        </div>
      </div>
    );
  }

  // ─── Compute chart points ────────────────────────────────────────────────

  const chartRevenues = chart.map(d => d.receita);
  const chartTotal = chartRevenues.reduce((s, v) => s + v, 0);
  const hasChartData = chartRevenues.some(v => v > 0);
  const chartMax = Math.max(...chartRevenues, 1);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="wrap">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Painel do lojista · TCGHub
          </div>
          <div className="row between" style={{ alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--fdisplay)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
                Dashboard
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Visão geral das suas vendas, estoque e saldo.
              </p>
            </div>
            {storeStatus && (
              <TagUI variant={storeStatus.isVerified ? 'teal' : 'neutral'}>
                {storeStatus.isVerified ? <IconCheck /> : <IconStore />}
                {storeStatus.isVerified ? 'Loja verificada' : 'Verificação pendente'}
              </TagUI>
            )}
          </div>
        </div>

        {/* ── Stats cards ────────────────────────────────────────────────── */}
        <div className="row" style={{ gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard
            label="Vendas hoje"
            value={stats?.vendasHoje ?? 0}
            suffix="vendas"
            color="var(--teal)"
            icon={<IconCart />}
          />
          <StatCard
            label="Vendas na semana"
            value={stats?.vendasSemana ?? 0}
            suffix="vendas"
            color="var(--violet)"
            icon={<IconChart />}
          />
          <StatCard
            label="Receita no mês"
            value={stats?.vendasMes ?? 0}
            prefix="R$"
            isCurrency
            color="var(--gold)"
            icon={<IconStar />}
          />
          <StatCard
            label="Cards vendidos hoje"
            value={stats?.cardsVendidosHoje ?? 0}
            suffix="cards"
            color="var(--teal)"
            icon={<IconPkg />}
          />
        </div>

        <div className="row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          {/* Left column */}
          <div style={{ flex: 1, minWidth: 300 }}>
            {/* Sales chart */}
            <div className="card card-pad" style={{ marginBottom: 24 }}>
              <SectionHead title="Vendas (7 dias)" subtitle={hasChartData ? `Total: ${fmt(chartTotal)}` : 'Sem dados'} />
              {hasChartData ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 16 }}>
                  {chart.map((day, i) => {
                    const h = chartMax > 0 ? (day.receita / chartMax) * 160 : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {day.vendas > 0 ? fmt0(day.receita) : ''}
                        </span>
                        <div style={{
                          width: '100%',
                          height: Math.max(h, 3),
                          background: day.receita > 0
                            ? 'linear-gradient(180deg, var(--gold), var(--gold-bg))'
                            : 'var(--border)',
                          borderRadius: 'var(--r-xs)',
                          transition: '.3s',
                          minHeight: 3,
                        }} />
                        <span className="mono" style={{ fontSize: 9, color: 'var(--faint)' }}>
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
                  <IconChart />
                  <p style={{ marginTop: 8 }}>Nenhuma venda nos últimos 7 dias</p>
                </div>
              )}
            </div>

            {/* Top selling cards */}
            <div className="card card-pad">
              <SectionHead title="Top cartas vendidas" subtitle={topCards.length > 0 ? `${topCards.length} cartas` : undefined} />
              {topCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
                  <IconTag />
                  <p style={{ marginTop: 8 }}>Nenhuma venda registrada ainda</p>
                </div>
              ) : (
                <div className="col" style={{ gap: 0 }}>
                  {topCards.map((card, i) => (
                    <div key={i} className="deckline row between" style={{ padding: '12px 0' }}>
                      <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{card.card_name}</span>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {card.total_quantity} vendida{card.total_quantity > 1 ? 's' : ''} · {card.order_count} pedido{card.order_count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold-2)' }}>
                        {fmt(card.total_revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ width: 340, flex: '0 0 340px' }}>
            {/* Credit balance */}
            <div className="card card-pad" style={{ borderColor: 'var(--gold-bd)', background: 'var(--gold-bg)', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--fdisplay)', fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
                <IconStar /> Saldo de crédito
              </h3>
              {credit ? (
                <>
                  <div className="row between" style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Disponível</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 22, color: 'var(--gold-2)' }}>
                      {fmt(credit.balanceBrl)}
                    </span>
                  </div>
                  {credit.pendingBrl > 0 && (
                    <div className="row between">
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Pendente</span>
                      <span className="mono" style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)' }}>
                        {fmt(credit.pendingBrl)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)', fontSize: 13 }}>
                  Faça login para ver seu saldo
                </div>
              )}
            </div>

            {/* Store status */}
            <div className="card card-pad" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--fdisplay)', fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
                <IconStore /> Status da loja
              </h3>
              {storeStatus ? (
                <div className="col gap-8">
                  <div className="row between">
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Nome</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{storeStatus.displayName || storeStatus.name || '—'}</span>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Verificação</span>
                    <TagUI variant={storeStatus.isVerified ? 'teal' : 'neutral'}>
                      {storeStatus.isVerified ? 'Verificada' : 'Pendente'}
                    </TagUI>
                  </div>
                  <div className="row between">
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Produtos ativos</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{stats?.cardsAtivos ?? '—'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)', fontSize: 13 }}>
                  <p>Cadastre sua loja para começar a vender</p>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="card card-pad">
              <h3 style={{ fontFamily: 'var(--fdisplay)', fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
                Ações rápidas
              </h3>
              <div className="col gap-8">
                <a href="/vender" className="btn btn-teal btn-block">
                  <IconTag /> Anunciar produto
                </a>
                <a href="/scanner" className="btn btn-gold btn-block">
                  <IconSearch /> Scanner / Buylist
                </a>
                <a href="/comprar" className="btn btn-ghost btn-block">
                  <IconArrow /> Ir para o marketplace
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  prefix,
  suffix,
  isCurrency,
  color,
  icon,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card card-pad" style={{ flex: '1 1 200px', minWidth: 180, borderColor: `color-mix(in oklch, ${color} 30%, var(--border))` }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
        <span style={{ color, display: 'flex' }}>{icon}</span>
      </div>
      <div className="row center" style={{ gap: 4 }}>
        {prefix && <span className="mono" style={{ fontSize: 14, color: 'var(--muted)' }}>{prefix}</span>}
        <span className="mono" style={{ fontWeight: 700, fontSize: 24, color }}>
          {isCurrency ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
        </span>
      </div>
      {suffix && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{suffix}</div>}
    </div>
  );
}

// ─── Fallback registration form (when user has no store) ────────────────────

function StoreRegistrationForm() {
  const [form, setForm] = useState({ nome: '', loja: '', email: '', telefone: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.nome && form.loja && form.email) setSubmitted(true);
  };

  const FEATURES = [
    { icon: IconPkg, title: 'Gestão de estoque', desc: 'Cadastre suas cartas e produtos em lote. Controle variantes, foil/normal, condição e quantidade.' },
    { icon: IconSpark, title: 'Preço automático', desc: 'Seu preço se ajusta com base no mercado. Fique competitivo sem mexer um dedo.' },
    { icon: IconStore, title: 'Zero comissão', desc: 'Você paga zero. A TCGHub ganha com serviços premium opcionais.' },
    { icon: IconCheck, title: 'Escrow protegido', desc: 'Dinheiro retido até o comprador confirmar. Zero chargeback, zero golpe.' },
  ];

  return (
    <div style={{ marginTop: 40 }}>
      <SectionHead title="Cadastre sua loja" subtitle="Venda para milhares de colecionadores" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'flex-start', marginTop: 20 }}>
        <div className="col gap-16">
          {FEATURES.map((f, i) => {
            const IconComp = f.icon;
            return (
              <div key={i} className="card card-pad row" style={{ gap: 16, borderColor: 'var(--teal-bd)' }}>
                <span style={{ color: 'var(--teal)', display: 'flex', flexShrink: 0, marginTop: 2 }}>
                  <IconComp />
                </span>
                <div className="col gap-4">
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{f.title}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{f.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)' }}>
          <div className="card card-pad col" style={{ gap: 20, borderColor: 'var(--teal-bd)', background: 'linear-gradient(160deg, color-mix(in oklch, var(--teal) 10%, var(--card)), var(--card))' }}>
            <div className="row center" style={{ gap: 8, color: 'var(--teal)' }}>
              <IconStore />
              <span style={{ fontFamily: 'var(--fdisplay)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>
                Cadastre sua loja
              </span>
            </div>

            {submitted ? (
              <div className="col center" style={{ gap: 12, textAlign: 'center', padding: '20px 0' }}>
                <span style={{ color: 'var(--teal)', display: 'flex' }}><IconCheck /></span>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 17, display: 'block', marginBottom: 4 }}>Recebemos seu interesse!</span>
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>Nossa equipe entrará em contato em até 48h úteis.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="col gap-12">
                <div className="col gap-4">
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Seu nome</label>
                  <input className="field" name="nome" placeholder="João Silva" value={form.nome} onChange={handleChange} required style={{ borderColor: 'var(--teal-bd)' }} />
                </div>
                <div className="col gap-4">
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Nome da loja</label>
                  <input className="field" name="loja" placeholder="Cards & Colecionáveis" value={form.loja} onChange={handleChange} required style={{ borderColor: 'var(--teal-bd)' }} />
                </div>
                <div className="col gap-4">
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>E-mail</label>
                  <input className="field" name="email" type="email" placeholder="contato@sualoja.com.br" value={form.email} onChange={handleChange} required style={{ borderColor: 'var(--teal-bd)' }} />
                </div>
                <div className="col gap-4">
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>WhatsApp</label>
                  <input className="field" name="telefone" type="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={handleChange} style={{ borderColor: 'var(--teal-bd)' }} />
                </div>
                <button type="submit" className="btn btn-teal btn-lg btn-block" style={{ marginTop: 4 }}>
                  <IconStore /> Quero vender na TCGHub
                </button>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center' }}>Sem compromisso. Entraremos em contato.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
