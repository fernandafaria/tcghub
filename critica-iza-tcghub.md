# Crítica de Design — TCGHub.ai
## Por Iza · contra os 13 canônicos

Data: 18 Jun 2026
URLs: https://tcghub.ai · https://tcghub-frontend-fkhwu.ondigitalocean.app
Páginas: / · /colecao · /mercado · /alertas · /comprar · /carta/[id] · /explorar

---

## NOTAS POR DIMENSÃO (1-10)

### 1. Hierarquia Visual — NOTA 6/10
Ref: Stripe, Linear

Cada página tem heading claro e eyebrow. O problema é depois do heading.

- Home: Hero com holo-text ok. 3 why-cards misturam título + descrição + CTA.
- Coleção: Dashboard com stats (R$ 28.220, 43%, 1282 cartas) bom.
- Mercado: Índice TCG bom. "Maiores altas" e "Maiores quedas" headings sem conteúdo.
- Alertas: Agrupamento por data bom. Badge ATINGIDO destaque.
- Comprar: Stepper 1-2-3, grid com +/- funcional.
- Carta/[id]: Layout 2-colunas, melhor hierarquia do app.
- Explorar: Grid com imagens ok. Seções amontoadas.

Problema: intenção clara no heading, scan seguinte nem sempre revela "o que fazer aqui".

---

### 2. Atmosfera — NOTA 7/10
Ref: Headspace, Airbnb

Dark mode craft-paper é a melhor decisão. Fundo lab(9.5%) com cards lab(20%).
Gold accents lab(79% 10 46) quentes, mesa de jogo com abajur.

Acertos: --holo gradient foil TCG, sombras pesadas, sistema de camadas bg/surface/card.
Problemas: light mode perde magia, falta textura (noise, borda), empty states quebram.

---

### 3. Anti-AI Slop — NOTA 5/10

Sinais de placeholder:
1. Seções vazias no /mercado: heading sem dado.
2. Copy inconsistente: 3 vozes diferentes.
3. Carrossel: [0][1][2][3][4] sem aria-labels.
4. Preços R$ 0 em múltiplas cartas.
5. "Sem análise disponível" fallback genérico.

Acertos: tokens lab()/oklch(), fontes com fallback system-ui, CSS properties organizadas.

---

### 4. Tipografia — NOTA 7/10
Ref: Stripe, Vercel

Bricolage Grotesque: h1/h2 weight 700-800, letter-spacing negativo. clamp(32px,4.8vw,54px).
Hanken Grotesk: corpo limpo. JetBrains Mono: dados.

Problemas: font-size converge para 16px, eyebrows sem tracking, números fonte body.

---

### 5. Dark Mode — NOTA 8/10

lab(): bg 9.5%, card 20%, text 94%. Contraste 14:1. 3 níveis de elevação.
Acentos vibrantes sem queimar. Shadow scale sh-1/2/3. Glow com color-mix.

Problemas: muted 4.5:1 (limite WCAG), light hex vs dark lab, transição sem animação.

---

### 6. Densidade — NOTA 6/10
Ref: Linear, Things

Home: baixa-média. Coleção: alta e funcional. Mercado: vazio-denso inconsistente.
Alertas: adequada. Comprar: ok. Carta: 2-colunas, melhor. Explorar: ok.

---

### 7. Motion — NOTA 5/10
Ref: Rauno, Bas Ording

Definido: fade, toastin, pop, foilsweep, floaty, celebrate
Ativo na home: apenas floaty (1 elemento, cardfan)
foilsweep: 0 usos. celebrate: 0 usos. tile-tilt: 0 usos.
Transições 0.13-0.18s. Só 3 elementos com cubic-bezier.
Motion system existe mas 90% inativo.

---

### 8. Confiança — NOTA 6/10
Ref: Airbnb, Stripe

+ Estrelas loja, "Compra protegida", precisão, "256K+ cartas".
- Preços R$ 0, seções vazias, fallbacks genéricos, sem selos segurança.

---

### 9. Personalidade — NOTA 6/10

Tem: holo-text foil, "Health Score", craft-paper dark, pips coloridos.
Genérico: layout SaaS template, header padrão, stepper 1-2-3, filtros genéricos.
Falta: universo TCG (ícones mana, expansões, foil) no UI chrome.

---

### 10. Mobile — NOTA 4/10

Apenas (max-width: 1080px). Sem 768px ou 480px.
Riscos: hero colapsa, grid empilha, 10 filtros ocupam tela, card fan quebra.
App de colecionador PRECISA de mobile (torneios, lojas, eventos).

---

## TOP 5 PROBLEMAS VISUAIS

1. Seções vazias no /mercado — headings sem conteúdo.
2. Motion system fantasma — foilsweep/celebrate/tile-tilt não usados.
3. Mobile negligenciado — único breakpoint 1080px.
4. Preços R$ 0 e fallbacks genéricos — empty/error/loading states crus.
5. Carrossel sem identidade — [0][1][2][3][4] sem aria-labels.

---

## TOP 3 ACERTOS

1. Dark mode craft-paper — lab() colors, 3 níveis, gold accents, sombras. Alma visual.
2. Layout 2-colunas /carta/[id] — gamecard+preçoIA+sinergias | identidade+ofertas+ações.
3. Design tokens system — escala cromática, radius 8/11/14/20/28/999px, shadow scale, color-mix.

---

## RESUMO

| Dimensão           | Nota |
|--------------------|------|
| Hierarquia Visual  | 6    |
| Atmosfera          | 7    |
| Anti-AI Slop       | 5    |
| Tipografia         | 7    |
| Dark Mode          | 8    |
| Densidade          | 6    |
| Motion             | 5    |
| Confiança          | 6    |
| Personalidade      | 6    |
| Mobile             | 4    |
| MÉDIA              | 6.0  |

Diagnóstico: Fundação de design system acima da média. Execução ~60% completa.
Dark mode craft-paper distintivo. Motion e mobile gaps urgentes.
Seções vazias e preços zerados minam confiança. Potencial de personalidade forte
(universo TCG rico) mas interface ainda próxima de SaaS template.
