import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Toaster } from "@/components/Toaster";

export const metadata: Metadata = {
  title: "TCGHub — Jogar, colecionar e investir em cartas",
  description:
    "Compare preços entre lojas verificadas, receba alertas de valorização e compre protegido — Pokémon, Magic, Yu-Gi-Oh!, One Piece, Lorcana e mais.",
  keywords: [
    "TCG", "Pokémon", "Magic", "Yu-Gi-Oh!", "One Piece", "Lorcana",
    "cartas", "compra", "venda", "preço", "deck", "coleção", "Brasil",
  ],
  openGraph: {
    title: "TCGHub — Jogar, colecionar e investir em cartas",
    description:
      "Compare preços entre lojas verificadas, receba alertas de valorização e compre protegido.",
    url: "https://tcghub.ai",
    siteName: "TCGHub",
    locale: "pt_BR",
    type: "website",
  },
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://tcghub.ai" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="light">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#f7f6f2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TCGHub" />
        <meta name="impact-site-verification" content="73791384-934b-4df8-bd8d-6cd3aebb22c8" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <Nav />
        <main id="app">{children}</main>
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
