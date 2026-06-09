import type { Store } from "@/types";

export const STORES: Store[] = [
  {
    id: "s1",
    name: "Templo das Cartas",
    city: "São Paulo · SP",
    rating: 4.9,
    sales: "12,4 mil",
    verified: true,
    ships: "Envio em 24h",
  },
  {
    id: "s2",
    name: "Arena Prime",
    city: "Curitiba · PR",
    rating: 4.8,
    sales: "8,7 mil",
    verified: true,
    ships: "Envio em 24h",
  },
  {
    id: "s3",
    name: "Liga Central TCG",
    city: "Rio de Janeiro · RJ",
    rating: 4.7,
    sales: "6,1 mil",
    verified: true,
    ships: "Retira grátis",
  },
  {
    id: "s4",
    name: "Dojo do Colecionador",
    city: "Belo Horizonte · MG",
    rating: 4.9,
    sales: "4,3 mil",
    verified: true,
    ships: "Envio em 48h",
  },
  {
    id: "s5",
    name: "Card Bunker",
    city: "Porto Alegre · RS",
    rating: 4.6,
    sales: "3,9 mil",
    verified: true,
    ships: "Envio em 24h",
  },
  {
    id: "s6",
    name: "Mística Store",
    city: "Recife · PE",
    rating: 4.5,
    sales: "2,1 mil",
    verified: false,
    ships: "Envio em 72h",
  },
  {
    id: "s7",
    name: "Covil do Dragão",
    city: "Brasília · DF",
    rating: 4.8,
    sales: "5,6 mil",
    verified: true,
    ships: "Envio em 24h",
  },
  {
    id: "s8",
    name: "Guilda dos Colecionadores",
    city: "Salvador · BA",
    rating: 4.7,
    sales: "3,2 mil",
    verified: true,
    ships: "Envio em 48h",
  },
];

export const storeById = (id: string): Store | undefined => STORES.find((s) => s.id === id);

export const STORE_TIER: Record<string, string> = {
  s1: "Diamante",
  s2: "Ouro",
  s3: "Ouro",
  s4: "Diamante",
  s5: "Prata",
  s6: "Prata",
  s7: "Diamante",
  s8: "Ouro",
};

export const storeTier = (id: string): string => STORE_TIER[id] || "Prata";
