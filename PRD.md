# TCGHub.ai v2 — PRD (Product Requirements Document)
## Para Joe Squad · 18 Jun 2026

---

## 1. POSICIONAMENTO

**"Inteligência antes do marketplace"**

TCGHub é a primeira plataforma brasileira multi-TCG que conecta coleção, inteligência de mercado e negociação. Não é marketplace — é o copiloto do colecionador.

**Público-alvo:**
- Colecionadores brasileiros de Pokémon, Magic, Yu-Gi-Oh!, One Piece, Lorcana
- Jogadores competitivos que precisam acompanhar o meta
- Lojistas que querem precificar com inteligência
- Iniciantes que não sabem por onde começar

**Diferencial competitivo (validado contra 7 concorrentes):**
1. **Health Score** — nota 0-100 de saúde do investimento (estabilidade, momentum, liquidez, meta relevance). NENHUM concorrente tem.
2. **Preços BRL multi-TCG** — Pokémon, Magic, Yu-Gi-Oh!, One Piece, Lorcana em REAIS. MyPcards é BR mas catálogo fraco.
3. **Scanner de binder multi-TCG** — reconhecimento de imagem pra 5+ TCGs.
4. **Alertas contexto-meta** — "Dragapult ex valorizou 22% após vencer o NAIC".
5. **Conexão coleção↔mercado** — sua coleção vale X, essas cartas estão em alta, aqui estão as melhores ofertas.

---

## 2. ARQUITETURA DE PÁGINAS

### Páginas Core (P0 — MVP funcional)

| Rota | Propósito | Status atual | Ações |
|------|-----------|-------------|-------|
| `/` | Home — descoberta + onboarding | Parcial (cards mock) | **Refazer**: hero com busca inteligente, trending real, coleção preview |
| `/carta/[slug]` | Carta detail — pricing, Health Score, ofertas | Funcional (SSR) | Adicionar Health Score, gráfico de histórico, imagens reais |
| `/buscar` | Busca multi-TCG com filtros | Quebrada (search não funciona) | **Corrigir**: implementar ILIKE no backend |
| `/colecao` | Minha coleção — tracking, valuation, progresso | 100% mock | **Refazer**: conectar backend real, auth, persistência |
| `/mercado` | Mercado — índices, altas/baixas, Health Score | Mock nos índices/movers | Conectar dados reais, Health Score visível |
| `/alertas` | Alertas de preço com notificações | 100% mock | Conectar backend de alertas |

### Páginas Secundárias (P1)

| Rota | Propósito | Status atual |
|------|-----------|-------------|
| `/explorar` | Catálogo exploratório com imagens | Funcional (200 cartas) |
| `/colecoes` | Browser de sets com progresso | Funcional |
| `/scanner` | Scanner de binder via câmera | Placeholder |
| `/comprar` | Marketplace (FUTURO — esconder agora) | Mock |
| `/vender` | Venda C2B (consumidor → lojista) | Mock |
| `/lojista` | Painel do lojista | Mock |

---

## 3. EXPERIÊNCIA CORE (jornada principal)

### Jornada 1: "Quanto vale minha carta?"
1. Usuário digita nome da carta na busca da home → autocomplete com imagens
2. Clicou → `/carta/[slug]` carrega instantâneo (SSR)
3. Vê: imagem real da carta, preço BRL (mínimo/médio/máximo), Health Score (0-100), recomendação Buy/Hold/Sell
4. Gráfico de histórico 30/90/365 dias com sparkline
5. "Criar alerta" → notificação quando atingir preço alvo

### Jornada 2: "Quanto vale minha coleção?"
1. Usuário importa coleção (CSV) ou cadastra carta a carta
2. Dashboard mostra: valor total em R$, variação no mês, progresso por set
3. Sets com % completo, foils, wishlist
4. "O que está em alta na sua coleção" — cards que mais valorizaram
5. Sugestão: "Faltam 12 cartas pra completar Obsidian Flames — menor preço R$ 47"

### Jornada 3: "O que está acontecendo no mercado?"
1. Home mostra trending cards com Health Score e variação
2. `/mercado` mostra índices por TCG (cards visuais com cor do TCG)
3. Maiores altas/baixas com sparkline e % real (não mock)
4. Health Score agregado por set "Obsidian Flames: Score 78/100 — tendência de alta"

---

## 4. DESIGN SYSTEM

### Tema: Light mode padrão
- Fundo: `oklch(0.972 0.005 85)` — craft paper claro
- Cards: `oklch(0.995 0.003 85)` — branco quente
- Texto: `oklch(0.24 0.012 85)` — quase preto
- Acentos: gold `oklch(0.60 0.13 66)`, violet `oklch(0.48 0.18 280)`, teal `oklch(0.46 0.10 195)`

### Tipografia
- Display: Bricolage Grotesque (headings)
- Corpo: Hanken Grotesk
- Dados: JetBrains Mono

### Referências visuais (da pesquisa competitiva)
- **COPIAR:** GetCollectr (dashboard com % variação), Scryfall (velocidade de busca), TCGPlayer (gráfico de histórico)
- **EVITAR:** Cardmarket (corporativo frio), Limitless (espartano demais)

### Tom de voz
- PT-BR coloquial, quente, pessoal
- "Sua coleção vale mais do que você imagina"
- "A gente te avisa quando vale vender"
- NUNCA: tom corporativo, "Lorem ipsum", emoji como muleta

---

## 5. SPRINTS (ordem de prioridade)

### Sprint 1: DADOS REAIS (P0)
**Objetivo:** O produto funciona com dados reais do Supabase

- [ ] **Busca funcional**: `WHERE c.name ILIKE $1 OR c.set_code ILIKE $1` na API `/api/cards`
- [ ] **Adapter corrigido**: `apiCardToCard` não zera `wk`/`mo`/`img`
- [ ] **Imagens reais**: templates usam `card.img` (URL), não `card.art` (CSS class)
- [ ] **Preços reais**: `price_brl_mid` do Supabase, sem fallback mock
- [ ] **Link "Importar coleção"**: `/importar` → redirecionar pra `/colecao` ou criar rota

### Sprint 2: COLEÇÃO REAL (P0)
**Objetivo:** Coleção com dados persistentes

- [ ] **Auth**: login/cadastro (Supabase Auth ou simples)
- [ ] **Coleção backend**: CRUD de cards na coleção do usuário
- [ ] **Dashboard real**: valor total calculado do banco, não mock
- [ ] **Progresso por set**: derivado dos dados reais

### Sprint 3: INTELIGÊNCIA (P1)
**Objetivo:** Health Score e analytics visíveis

- [ ] **Health Score na carta**: chamar `/api/health/[slug]` no CardDetailClient
- [ ] **Gráfico de histórico**: sparkline com dados reais de preço
- [ ] **Índices de mercado reais**: `/mercado` conectado à API
- [ ] **Alertas reais**: conectar backend de alertas

### Sprint 4: EXPERIÊNCIA (P2)
**Objetivo:** Polimento, mobile, animações

- [ ] **Mobile responsive**: breakpoints 480px, 768px
- [ ] **Animações**: foilsweep em raridades foil, celebrate em milestones
- [ ] **Empty states com voz**: não "Nenhum resultado", mas "Nenhuma carta encontrada. Tente 'Charizard' ou 'Pikachu'"
- [ ] **Autocomplete na busca**: imagens + preços no dropdown

---

## 6. MÉTRICAS DE SUCESSO

- Busca retorna resultados em < 500ms
- Página de carta carrega em < 1s (SSR)
- Usuário consegue buscar uma carta, ver preço e Health Score em < 10 segundos
- Coleção mostra valor real (não mock)
- 0 seções vazias (heading sem conteúdo)

---

## 7. O QUE NÃO FAZER AGORA

- Marketplace `/comprar` — esconder até ter dados reais de lojas
- `/vender` — esconder
- `/lojista` — manter como placeholder
- App nativo — site responsivo primeiro
- Dark mode — light mode é o padrão
