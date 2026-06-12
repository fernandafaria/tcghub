"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IconSearch, IconCart, IconSpark, IconBell, IconChart, IconShield, IconBack, IconArrow,
  IconDown, IconCheck, IconStore, IconTag, IconLayers, IconCards, IconGrid, IconStar, IconSun, IconMoon, IconPkg, IconUsers,
} from "@/components/icons";
import { TCGS } from "@/data/cards";

const NAV_PILLARS = [
  {
    id: "com",
    label: "Comprar",
    desc: "Ache, compare e compre seguro",
    dot: "var(--teal)",
    head: "Tudo com proteção anti-golpe",
    items: [
      ["/comprar", "spark", "Montar deck pelo menor preço", "Selecione as cartas e a gente acha o frete mínimo"] as const,
      ["/comprar", "cards", "Comprar cartas avulsas", "6 lojas verificadas, um preço comparado"] as const,
      ["/checkout", "shield", "Compra protegida", "O dinheiro fica retido até você confirmar"] as const,
      ["/vender", "tag", "Vender minhas cartas", "Anuncie sem CNPJ, sem cair em golpe"] as const,
      ["/lojista", "store", "Tenho uma loja", "Estoque, preço automático e balcão"] as const,
    ],
  },
  {
    id: "int",
    label: "Mercado",
    desc: "Preços e o que está em alta",
    dot: "var(--violet)",
    head: "O preço justo, sem chutar",
    items: [
      ["/mercado", "chart", "Preços e tendências", "Maiores altas, baixas e o índice do mercado"] as const,
      ["/explorar", "star", "Explorar tendências", "Descubra altas, quedas e oportunidades"] as const,
      ["/carta", "tag", "Quanto vale uma carta", "Preço de mercado em reais, hoje"] as const,
      ["", "brain", "Médico de deck (IA)", "soon"] as const,
    ],
  },
  {
    id: "cmn",
    label: "Coleção",
    desc: "Organize e veja quanto vale",
    dot: "var(--gold)",
    head: "Seu hobby, sempre atualizado",
    items: [
      ["/colecao", "grid", "Minha coleção", "Valor em R$ e o quanto falta de cada set"] as const,
      ["/colecoes", "layers", "Explorar coleções", "Cartas por set de cada TCG"] as const,
      ["/alertas", "bell", "Alertas de preço", "A gente avisa quando vale vender"] as const,
      ["", "users", "Decks e meta", "soon"] as const,
    ],
  },
];

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  spark: IconSpark, cards: IconCards, shield: IconShield, tag: IconTag, store: IconStore,
  chart: IconChart, star: IconStar, grid: IconGrid, layers: IconLayers, bell: IconBell, users: IconUsers,
  brain: IconSpark,
};

export function Nav() {
  const [tcg, setTcg] = useState("pokemon");
  const [cartCount] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo">
          <span className="mark">T</span>
          <span>
            TCG<b>Hub</b>
          </span>
        </Link>

        {/* TCG Switcher */}
        <div className="tcgsw">
          <button className="tcgsw-btn">
            <span className="dot" />
            {(TCGS.find((t) => t.id === tcg) || TCGS[0]).name}
            <IconDown className="ic" />
          </button>
          <div className="tcgsw-menu">
            <div className="mh">Seu TCG</div>
            {TCGS.map((t) => (
              <a
                key={t.id}
                className={t.id === tcg ? "on" : ""}
                onClick={() => setTcg(t.id)}
              >
                {t.name}
                <span className="ck">{t.id === tcg ? <IconCheck className="ic" /> : null}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Pillars */}
        <div className="nav-pillars">
          {NAV_PILLARS.map((p) => (
            <div key={p.id} className="pillar">
              <button className="pillar-btn">
                <span className="pl">
                  <span className="dot" style={{ background: p.dot }} />
                  {p.label}
                </span>
                <span className="ps">{p.desc}</span>
              </button>
              <div className="mega">
                <div className="mega-head">{p.head}</div>
                {p.items.map(([route, icon, title, desc]) => {
                  const IconComp = iconMap[icon];
                  if (desc === "soon") {
                    return (
                      <a key={title} className="soon">
                        {IconComp && <IconComp className="ic" />}
                        <span>
                          <span className="ttl">{title}</span>
                        </span>
                      </a>
                    );
                  }
                  return (
                    <Link key={title} href={route || "#"}>
                      {IconComp && <IconComp className="ic" />}
                      <span>
                        <span className="ttl">{title}</span>
                        <span className="desc">{desc}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right side */}
        <div className="nav-right">
          <Link href="/comprar" className="nav-search">
            <span style={{ display: "inline-flex" }}><IconSearch className="ic" /></span>
            <span>Buscar carta…</span>
            <kbd>⌘K</kbd>
          </Link>
          <Link href="/vender" className="nav-link" style={{ color: "var(--gold-2)", fontWeight: 600 }}>
            Vender
          </Link>
          <button className="nav-cart" onClick={toggleTheme} title="Tema claro/escuro">
            {theme === "dark" ? <IconSun className="ic" /> : <IconMoon className="ic" />}
          </button>
          <Link href="/comprar" className="nav-cart">
            <IconCart className="ic" />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
