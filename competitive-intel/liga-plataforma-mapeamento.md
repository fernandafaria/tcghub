# Mapeamento Completo — Plataforma Liga (LigaPokemon + LigaLorcana)

Documento de inteligência competitiva técnica e funcional para construção de plataforma superior.
Análise realizada em 28/06/2026.

---

## 1. RESUMO EXECUTIVO

A **LigaMagic** (LIGAMAGIC PORTAL DE COMPRAS LTDA - ME, CNPJ 18.148.958/0001-90) é a plataforma-mãe, fundada em 2001 em São José dos Campos, SP. Opera como **white-label multi-TCG**: o mesmo backend PHP monolítico serve 8+ domínios temáticos:

| Domínio | TCG | Status |
|---------|-----|--------|
| ligamagic.com.br | Magic: The Gathering | Principal (2001) |
| ligapokemon.com.br | Pokémon TCG | Ativo |
| ligalorcana.com.br | Disney Lorcana | Ativo |
| ligaonepiece.com.br | One Piece TCG | Ativo |
| ligayugioh.com.br | Yu-Gi-Oh! | Ativo |
| ligariftbound.com.br | Riftbound | Ativo |
| ligafab.com.br | Flesh and Blood | Ativo |
| ligastarwars.com.br | Star Wars Unlimited | Ativo |

Serviços aliados (mesma empresa):
- **LigaSegura** (ligasegura.com.br) — escrow de pagamento
- **Circuito LigaMagic** (circuitoligamagic.com.br) — torneios

**Métricas declaradas**: 50.000+ usuários diários, 100.000+ jogadores alcançados, 100M+ cards em estoque no marketplace.

**Alcance real**: ~20 apps white-label no mesmo codebase (incluindo MundoFunko). A estratégia é "flavor por vertical" — mesmo backend, skin diferente por TCG. Evidência: mesma sessão (cookie LIGASID), mesmos assets (lmcorp.com.br), mesmos padrões de roteamento.

---

## 2. ARQUITETURA TÉCNICA

### Stack

| Camada | Tecnologia | Observações |
|--------|-----------|-------------|
| Linguagem | **PHP** (tradicional, sem framework) | Roteamento via `?view=controller/action` |
| Frontend | **jQuery 1.9.1** + jQuery UI, **Bootstrap 3** | jQuery 1.9 é de 2013 — 13 anos defasado |
| Assets | Servidos via `lmcorp.com.br/arquivos/js/template/` | CDN próprio da empresa |
| Autocomplete | jQuery Autocomplete customizado (`jquery.autocomplete-v17-min.js`) | Busca de cards/produtos |
| Sessão | Cookie `LIGASID` (PHP session) | HttpOnly, Secure, SameSite=Lax |
| Cache | `no-store, no-cache, must-revalidate` | Praticamente zero cache |
| CDN/DNS | **Cloudflare** (proxy reverso) | IPs: 172.66.40.x, 172.66.43.x, 104.21.x |
| Proteção | Cloudflare JS Challenge + Turnstile | Crawl-delay: 360 no robots.txt |
| Infra | Servidor próprio (não cloud) | Sem indícios de AWS/GCP/Azure |
| Analytics | Google Analytics (ga, ga_DQMPEZ847L, ga_8QZH1QED7F) + Google Ads | Adsense: ca-pub-8533196174988722 |
| Mobile | **Não tem app** | Web-only, sem PWA |

### Padrão de Roteamento

```
?view=cards/search&card=ed%3Dmsh+searchprod%3D0&tipo=1
?view=cards/card&card=<id>
?view=leilao/listar
?view=artigos/view&aid=<id>
?view=dks/deck&id=<id>
?view=forum/mensagem&id=<id>
?view=bazar/home
?view=prod/home
?view=cards/edicoes
?view=user/home
?view=mp/cupons
```

### Estrutura de Arquivos (inferida)

```
lmcorp.com.br/arquivos/
├── js/
│   ├── jq/jquery-1.9.1.min_plus_ui.js
│   ├── template/
│   │   ├── bootstrap.min.js
│   │   ├── template-package-v123-min.js
│   │   ├── template-package-aux-tcg02-v09-min.js
│   │   ├── template-home-tcg02-v06-min.js
│   │   └── jquery.autocomplete-v17-min.js
│   └── ...
├── css/
└── images/
```

### Robots.txt (idêntico nos 2 sites)

```
User-agent: *
Crawl-delay: 360
Disallow: /index.php
Disallow: /*?view=user
Disallow: /*?view=cards/pricehistory
Disallow: /*?view=prod/pricehistory
Disallow: /*?view=dks/baixar
Disallow: /*?view=dks/meus
Disallow: /*?view=dks/novo
Disallow: /*?view=colecao/
Disallow: /*?view=ecom/
Disallow: /*?view=torneios/
Disallow: /*?view=forum/leiloes
Disallow: /*?view=forum/rss
Disallow: /*?view=mp/showcase/home*tcg*
Disallow: /*?view=mp/showcase/home*prod*
```

---

## 3. FUNCIONALIDADES COMPLETAS

### 3.1 Marketplace (Compras)

**Descrição**: Lojas parceiras anunciam cards avulsos. Busca com dezenas de filtros.

**Funcionalidades**:
- Busca textual com autocomplete (jQuery Autocomplete)
- Filtros por: edição, raridade, cor/tipo, idioma, qualidade (NM/SP/MP/HP), foil/normal, preço mínimo/máximo
- Ordenação: nome (PT/EN A-Z/Z-A), menor/maior preço, preço médio, CMC, numeração
- Exibição: tabela (com preço menor, médio, maior) ou lista com miniaturas
- Carrinho de compras multi-loja
- Quantidade: spinner +/- com adição ao carrinho
- Checkout via LigaSegura (escrow)
- **Preço exibido como**: Menor preço + Preço Médio na listagem
- Promoções mensais com cupons para sorteios

**O que NÃO tem**:
- Sem gráfico de histórico de preços na listagem
- Sem alertas de queda de preço
- Sem comparação lado-a-lado de lojas
- Sem "preço justo" / valuation automático
- Sem recomendação de "hora de comprar"

### 3.2 Marketplace de Vendas / Buylist

**Descrição**: Usuários vendem cards diretamente para lojas.

**Funcionalidades**:
- Lista de lojas comprando cada card (preços, idiomas, qualidades)
- Cruzamento automático com Coleção do usuário
- Botão "Vender Coleção" que cruza toda sua coleção com buylists
- Ordenação por maior valor de compra
- Criação de ordem de venda para múltiplas lojas
- Pagamento via LigaSegura após loja receber os cards
- Saque para conta bancária ou uso como saldo no Marketplace

**O que NÃO tem**:
- Sem cotação em tempo real
- Sem comparação entre buylists de diferentes lojas no mesmo card
- Sem histórico de quanto cada loja já pagou por aquele card

### 3.3 Leilões

**URL**: `?view=leilao/listar`

**Funcionalidades**:
- Leilões com lance inicial a partir de R$ 0,10
- Preço fixo + opção de lance
- Filtros por idioma, extras (foil, promo, reverse, 1st ed, pre-release), preço
- Selo **LigaSegura** em todos os leilões (escrow obrigatório)
- Categorias por idioma (Português: 635, Japonês: 501, Inglês: 226 ativos)
- Tempo restante visível: "13d 23h", "14d 20h"
- Tipos: Fixo e Lance

**O que NÃO tem**:
- Sem auto-bid / proxy bidding
- Sem snipe protection
- Sem notificações de "você foi superado"
- Sem histórico de lances do usuário
- Sem watchlist de leilões

### 3.4 Bazar da Liga

**URL**: `?view=bazar/home`

**Descrição**: Player-to-player — usuários cadastram cards que têm para troca/venda e cards desejados. Sistema cruza automaticamente.

**Funcionalidades**:
- Lista de cards para Troca e Venda
- Lista de cards Desejados
- Cruzamento automático entre usuários
- Top Cards Desejados (com range de preços)
- Top Cards para Troca e Venda (com range de preços)

**O que NÃO tem**:
- Sem matching automático com notificação
- Sem chat/negociação integrada
- Sem reputação de traders
- Sem geolocalização (troca presencial)

### 3.5 Decks / Deck Builder

**URL**: `?view=dks/deck&id=<id>`

**Funcionalidades**:
- Visualização de decks de torneios (com posição, evento, jogador)
- Preço total do deck calculado
- Import/export de decklists
- Listagem por formato (Standard, Pioneer, Modern, Commander, etc.)
- Histórico de versões do deck

**O que NÃO tem**:
- Sem deck builder interativo (drag-and-drop)
- Sem validação de legalidade por formato
- Sem análise de curva de mana
- Sem sugestões de upgrade/sideboard
- Sem playtest integrado
- Sem comparação com meta
- URLs bloqueadas no robots.txt: editar, novo, meus, versoes

### 3.6 Coleções

**URL**: `?view=colecao/` (bloqueado no robots.txt)

**Funcionalidades**:
- Cadastro de cards possuídos
- Integração com Bazar (venda/troca)
- Integração com Buylist (venda para lojas)
- Cruzamento com lista de desejos

**O que NÃO tem**:
- Sem scanner de cartas por foto
- Sem valuation automático da coleção
- Sem tracking de lucro/prejuízo
- Sem export para outros formatos
- Sem gráfico de evolução do valor

### 3.7 Compra por Lista (Cart Optimizer)

**URL**: `?view=cards/lista`

**Descrição**: Algoritmo proprietário que faz milhões de combinações para achar a melhor compra multi-loja.

**Funcionalidades**:
- Input de lista de cards desejados
- Sistema calcula combinação ótima entre lojas
- Considera preço + frete estimado por região
- Fila de espera quando muitos usuários acessam
- "Bloquear loja" para excluir da busca

**Problemas conhecidos (reportados por usuários)**:
- Algoritmo frequentemente retorna a mesma loja ignorando opções mais baratas
- Frete real só calculado após definir pedidos
- Sem opção de salvar lista permanentemente (usa localStorage)

### 3.8 Complete seu Deck

**URL**: (menu "Complete seu Deck" no LigaPokemon)

**Descrição**: Monta deck e encontra cartas faltantes. Ferramenta de complementação.

**Funcionalidades**:
- Lista de deck → sistema mostra quais cartas faltam
- Integração com marketplace para compra das faltantes

### 3.9 Cards em Alta / Queda / Visualizados

**Funcionalidades**:
- Top 5 cards com maior variação (diário/semanal/mensal)
- Cards em Queda: variação negativa
- Cards mais Visualizados: por interesse
- Preço atual + variação em R$
- Tabela com link para card

**O que NÃO tem**:
- Sem gráfico de tendência
- Sem indicador de volume negociado
- Sem reasons ("por que subiu?")
- Sem threshold alerts configuráveis

### 3.10 Artigos

**URL**: `?view=artigos/view&aid=<id>` (LigaPokemon/LigaMagic, NÃO no LigaLorcana)

**Funcionalidades**:
- Artigos escritos por usuários/ staff sobre estratégia, colecionismo, meta
- Contagem de visualizações
- Seção de comentários
- Tags/categorias
- Slider de artigos em destaque na homepage

**No LigaPokemon**: artigos sobre NAIC, Zoroark ex, etc.
**No LigaLorcana**: **NÃO tem aba de Artigos** (substituído por combobox direto)

### 3.11 Fórum (apenas LigaMagic)

**Funcionalidades**:
- Fórum de discussão com tópicos e respostas
- Seções: Dúvidas, Discussão, Point da Liga, Artigos
- Tópicos com até 198+ respostas
- Visualizações: 2.000-7.000+ por post popular

### 3.12 Pokédex (apenas LigaPokemon)

**Funcionalidades**:
- Lista de todos Pokémon com background por tipo
- Filtro por tipo, região, treinadores
- Carrossel de Pokémon em destaque na homepage
- Número da pokédex nacional

### 3.13 Circuitos / Torneios

**Domínio**: circuitoligamagic.com.br

**Funcionalidades**:
- Etapas classificatórias em lojas parceiras
- Finais com premiação
- Circuito Liga Pokémon (CLP)
- Circuito LigaMagic (CLM) — Standard, Pioneer, Modern, Commander
- 1 TIX = R$ 1,00 (crédito utilizável nos stands do evento)

### 3.14 LigaSegura (Escrow)

**Domínio**: ligasegura.com.br

**Funcionalidades**:
- Conta gratuita integrada com login das Ligas
- 8+ meios de pagamento
- Parcelamento em até 12x
- Proteção contra fraude (15 dias para denúncia)
- Liberação de pagamento após confirmação de recebimento
- Saque para conta bancária
- Sem mensalidade / sem taxa de adesão
- Cupons para sorteios em compras via LigaSegura

---

## 4. DIFERENCIAIS COMPETITIVOS (O QUE FUNCIONA)

1. **Marca consolidada** — 24+ anos de operação, confiança do mercado
2. **Ecossistema completo** — Marketplace + Leilões + Bazar + Buylist + Torneios + Escrow
3. **Base de lojas** — Dezenas de lojas parceiras com estoque integrado
4. **LigaSegura** — Escrow proprietário reduz fricção e gera confiança
5. **Multi-TCG white-label** — Mesmo código, 8+ TCGs
6. **Circuitos de torneio** — Engajamento orgânico da comunidade
7. **SEO** — Domínio estabelecido, ~50.000 usuários/dia
8. **Compra por Lista** — Algoritmo proprietário de otimização de compras
9. **Fórum ativo** — Comunidade engajada (MTG)

---

## 5. GAPS E OPORTUNIDADES (ONDE ATACAR)

### 5.1 Frontend / UX (MUITO FRACO)

- **jQuery 1.9 (2013)** — performance ruim, sem reatividade
- **Sem PWA** — nada offline, instalação no celular impossível
- **Zero mobile-first** — experiência mobile sofrível
- **Design datado** — Bootstrap 3, sem dark mode, sem animações
- **Cloudflare agressivo** — JS Challenge frequente atrapalha usuário real
- **Nada de real-time** — preços atualizados só no reload
- **URL rewriting ruim** — `?view=cards/search&card=...` não é amigável

### 5.2 Inteligência de Dados (ZERO)

- **Sem histórico de preços visível** (bloqueado no robots.txt — provavelmente existe internamente)
- **Sem gráficos de tendência**
- **Sem alertas de preço**
- **Sem "valuation"** — o usuário não sabe se o preço está justo
- **Sem insights de mercado** (liquidez, volume, volatilidade)
- **Sem análise de coleção** (quanto vale? quanto valorizou?)
- **Sem recomendação de compra/venda**

### 5.3 Colecionador / Player Individual

- **Sem scanner de cartas** (foto do celular → reconhecimento)
- **Sem tracking de portfólio** (comprei a X, agora vale Y, lucrei Z)
- **Sem exportação de coleção**
- **Sem "Health Score"** da coleção
- **Sem gamificação de colecionador**

### 5.4 Experiência de Compra

- Carrinho multi-loja mas sem otimização real de frete
- Sem "watchlist" de cards com notificações
- Sem histórico de pedidos integrado bem desenhado
- Sem tracking de entrega integrado

### 5.5 Plataforma Técnica (VULNERABILIDADES)

- **PHP monolítico sem framework** — difícil manter, escalar, evoluir
- **Zero API pública** — sem integração com apps de terceiros
- **Zero webhooks** — sem notificações push
- **Cache praticamente inexistente** — `no-store, no-cache`
- **Crawl-delay 360** — desespero anti-scraping
- **Código frontend versionado manualmente** (v123, v09, v06 nos nomes de arquivo)
- **Session cookie simples** — sem JWT, sem OAuth
- **Sem HTTPS enforcement visível no código** (Cloudflare faz proxy)

### 5.6 League / Social

- Sem perfis públicos de jogadores com stats
- Sem leaderboards
- Sem achievements/badges

---

## 6. MODELO DE NEGÓCIO (ESTIMADO)

Baseado nos artigos e fóruns:

- **Lojas**: pagam para anunciar no marketplace (fee não divulgado publicamente)
- **LigaSegura**: taxa por transação (não divulgada — tem página de tarifas em `/tarifas`)
- **Circuitos**: inscrições pagas + parceria com lojas
- **Anúncios**: Google Adsense nas páginas
- **Afiliados**: programas de parceria com lojas

---

## 7. PARA CONSTRUIR ALGO MELHOR

### Pilha Recomendada

| Camada | Liga (atual) | TCGHub (proposta) |
|--------|-------------|-------------------|
| Frontend | jQuery 1.9 + Bootstrap 3 | React 19 + Vite 7 + Tailwind + shadcn/ui |
| Mobile | Nada | PWA com Service Workers + IndexedDB |
| Backend | PHP monolítico | Express 5 + TypeScript + Drizzle ORM |
| Dados | MySQL/MariaDB (provavelmente) | Supabase (PostgreSQL + pgvector) |
| Real-time | Nada | WebSockets / Supabase Realtime |
| Cache | `no-cache` em tudo | Redis + CDN edge cache |
| API | Zero | REST + provável GraphQL |
| Pagamento | LigaSegura (proprietário) | Mercado Pago Split + PIX |
| Infra | Servidor próprio | Vercel + DO App Platform + Supabase |
| AI Layer | Nenhuma | LangChain agents, computer vision para scanner |

### Diferenciais de Entrada (MOAT)

1. **Scanner de cartas por foto** — ninguém no BR tem isso integrado ao marketplace
2. **Valuation engine** — "sua coleção vale X, valorizou Y%, recomendação: vender Z"
3. **Price alerts** — notificações push/email/WhatsApp com thresholds configuráveis
4. **Collection Health Score** — gamificação de colecionador
5. **Intelligence-first UI** — cada card mostra tendência, momento de comprar, fair price
6. **Offline-first PWA** — funciona sem internet, sincroniza quando volta
7. **API pública** — permite ecossistema de apps (deck builders, trackers, etc.)
8. **Open source parcial** — transparência gera confiança

### O Que Copiar (Funcionalidades Validadas)

- Marketplace multi-loja com carrinho unificado
- Leilões com escrow
- Bazar player-to-player
- Buylist (Marketplace de Vendas)
- Compra por Lista (Cart Optimizer)
- Circuitos/torneios
- Sistema de reputação/avaliação de lojas

### O Que NÃO Copiar

- PHP monolítico
- jQuery + Bootstrap 3
- Cloudflare agressivo atrapalhando usuário real
- Design datado
- Zero inteligência de dados
- Zero mobile

---

## 8. ANÁLISE DE VULNERABILIDADES

### Técnicas

| Vulnerabilidade | Severidade | Impacto |
|----------------|-----------|---------|
| jQuery 1.9.1 (2013) — múltiplos CVEs conhecidos | **Alta** | XSS, prototype pollution |
| PHP sem framework — provável SQL injection | **Alta** | Dados de usuários, cartões |
| Session cookie sem CSRF token visível | **Média** | CSRF em ações sensíveis |
| Cloudflare Turnstile — única proteção visível | **Baixa** | Já existe proteção |
| Sem CSP visível (exceto na página de desafio) | **Média** | XSS sem mitigação |
| Scripts versionados manualmente (sem hash) | **Baixa** | Cache poisoning teórico |

### Funcionais

| Gap | Severidade | Oportunidade para TCGHub |
|-----|-----------|--------------------------|
| Sem mobile app / PWA | **Crítica** | PWA offline-first |
| Zero dados de histórico público | **Alta** | Intelligence layer |
| UX sofrível em mobile | **Alta** | Mobile-first React |
| Sem scanner de cartas | **Média** | Computer vision |
| Sem alertas/inteligência | **Média** | AI layer |
| Sem API pública | **Média** | Open API |

---

## 9. FONTES DE DADOS USADAS PELA PLATAFORMA

- Dados inseridos manualmente por lojas (estoque, preços)
- Dados inseridos por usuários (coleções, decks, leilões)
- Crawling/scraping não confirmado — provavelmente as próprias lojas alimentam

---

## 10. ARQUITETURA RECONSTRUÍDA (FONTE: diagrama de inteligência)

Diagrama reconstruído por engenharia reversa passiva + fontes públicas. Níveis de evidência: **FATO** (medido/confirmado), **INFERÊNCIA FORTE** (evidência convergente), **HIPÓTESE**.

### 10.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────┐
│                 CLIENTES                          │
│  ~20 apps white-label — um codebase,             │
│  flavor por vertical                              │
│  Liga{Jogo}, Circuito Liga{Jogo}, MundoFunko     │
│  App ~40MB (React Native/Flutter?)               │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Cloudflare — CDN + WAF + Bot Management         │
│  Origem 100% mascarada                            │
│  Bloqueio por ASN (HTTP 403 / error 1005)        │
│  Nenhum api.* ou cloud.* exposto                  │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│           MONOLITO PHP — front-controller         │
│  Roteamento: ?view=dks/novo                       │
│              ?view=torneios/torneio&fid=          │
│  Server-rendered, jQuery-era, NÃO SPA             │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│     MySQL — multi-tenant por game_id              │
│  PKs inteiros sequenciais (aid/uid/fid)           │
│  → vazam volume e crescimento                     │
└─────────────────────────────────────────────────┘
```

### 10.2 Identidade — SSO Único (FATO)

Mesmo login entre **LigaMagic / LigaPokemon / LigaYugioh** — cookie LIGASID com domínio compartilhado. Conta LigaSegura vinculada.

### 10.3 Módulos de Negócio (sobre o mesmo backend, particionados por jogo)

| Módulo | Funcionalidades | Evidência |
|--------|----------------|-----------|
| **Catálogo** | edições, cards, menor-preço, idioma/foil/condição | FATO |
| **Marketplace** | multi-loja, carrinho, checkout | FATO |
| **Decks & Coleções** | deck builder, cruzamento bazar (C2C), leilões, coleção × buylist | FATO |
| **Pagamentos** | LigaSegura escrow + "conta gráfica" (carteira interna) | FATO |
| **Torneios** | pareamento suíço, mesas, resultados, standings, temporadas, vagas escalonadas | FATO |

### 10.4 LigaSegura — Detalhes (FATO)

- **Escrow**: libera ao vendedor em **D+15** OU na confirmação de entrega
- **Disputa**: 15 dias para contestar
- **Saque**: prazo de mercado 14/30 dias
- **Taxa**: % sobre o total bruto (inclui frete) — estrutura FATO, % exato NÃO CONFIRMADO
- **Gateways**: Cielo, PagSeguro, PIX, cartão com parcelamento até 12x

**HIPÓTESE sobre a taxa**: marketplaces similares (Mercado Livre, Shopee) cobram 11-16%. Se a LigaSegura estiver nessa faixa, é uma oportunidade de diferenciação por preço.

### 10.5 Banco de Dados — IDs Vazam Volume (FATO)

PKs inteiros sequenciais:
- `aid` — article ID (artigos)
- `uid` — user ID (usuários)
- `fid` — forum thread ID (tópicos)

Diferença entre IDs em janelas de tempo revela taxa de crescimento. Exemplo: se aid=5854 em Jun/2026 e aid=4810 em Jan/2026, são ~174 artigos/mês.

### 10.6 App Mobile

**HIPÓTESE**: App ~40MB, possivelmente React Native ou Flutter (inferido pelo tamanho e comportamento cross-platform). Funcionalidades: marketplace + anúncios + sorteios. NÃO confirmado por análise direta.

---

## 11. PRÓXIMOS PASSOS

1. **Validar hipóteses de monetização** — falar com lojistas sobre quanto pagam na Liga
2. **Analisar preços de lojas** — scrape do marketplace para comparar spreads com TCGHub
3. **Falar com jogadores** — entrevistas sobre dores reais (Fase 2 qualitativa)
4. **Prototipar scanner** — computer vision para Lorcana + Pokémon
5. **Buildar intelligence layer** — valuation engine + price history + alerts

---

*Documento gerado por Theo, assistente da Fernanda. 28/06/2026.*
