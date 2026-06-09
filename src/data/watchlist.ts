import { CARDS } from "./cards";

export interface WatchItem {
  cardId: string;
  cardName: string;
  conf: string;
  reason: string;
}

export const WATCH: WatchItem[] = [
  {
    cardId: "c1",
    cardName: "Charizard ex",
    conf: "Convicção alta (87%)",
    reason:
      "Estoque caindo e +38% em 30 dias; tração continua antes do próximo set. Chase principal de Obsidian Flames, baixa reimpressão esperada.",
  },
  {
    cardId: "c36",
    cardName: "Monkey D. Luffy (Leader)",
    conf: "Convicção alta (82%)",
    reason:
      "Leader mais jogado pós-banlist; procura disparando antes do regional. Baixa oferta de OP01 no mercado brasileiro.",
  },
  {
    cardId: "c4",
    cardName: "Gardevoir ex",
    conf: "Convicção média (71%)",
    reason:
      "Engine fixa no meta e reimpressão improvável no curto prazo. Deck tier 1 consistente, procura constante em torneios.",
  },
  {
    cardId: "c32",
    cardName: "Blue-Eyes White Dragon LOB",
    conf: "Convicção alta (85%)",
    reason:
      "Primeira edição clássica. Estoque global de NM caindo — ícone que nunca desvaloriza. 30º aniversário do anime impulsiona.",
  },
  {
    cardId: "c41",
    cardName: "Elsa - Spirit of Winter",
    conf: "Convicção alta (91%)",
    reason:
      "+22.9% na semana e +33.5% no mês após mudança na banlist. Lorcana crescendo no Brasil, oferta ainda escassa de Rise of the Floodborn.",
  },
  {
    cardId: "c21",
    cardName: "Orcish Bowmasters",
    conf: "Convicção média (74%)",
    reason:
      "Staple em 78% dos decks de Modern. LOTR fora de print, reimpressão incerta. Tendência de alta contínua.",
  },
];

export const watchItemByCardId = (cardId: string): WatchItem | undefined =>
  WATCH.find((w) => w.cardId === cardId);
