import Link from "next/link";
import { IconBack } from "@/components/icons";
import { getCardBySlug } from "@/lib/cards";
import CardDetailClient from "./card-detail-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCardBySlug(id);
  if (!card) return { title: "Carta não encontrada — TCGHub" };
  return {
    title: `${card.name} — ${card.set} · TCGHub`,
    description: `${card.name} (${card.rarity}) de ${card.set}. Preço médio R$ ${card.base}. Veja ofertas de lojas verificadas.`,
    openGraph: {
      title: `${card.name} — TCGHub`,
      description: `${card.rarity} · ${card.set} · R$ ${card.base}`,
    },
  };
}

export default async function CardPage({ params }: Props) {
  const { id } = await params;
  const card = await getCardBySlug(id);

  if (!card) {
    return (
      <div className="page">
        <div className="wrap" style={{ textAlign: "center", paddingTop: 80 }}>
          <h1 style={{ fontFamily: "var(--fdisplay)", fontSize: 28, fontWeight: 700 }}>
            Carta não encontrada
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 12 }}>
            A carta com slug <span className="mono">{id}</span> não foi encontrada no acervo.
          </p>
          <Link href="/" className="btn btn-gold" style={{ marginTop: 24 }}>
            <IconBack /> Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return <CardDetailClient initialCard={card} />;
}
