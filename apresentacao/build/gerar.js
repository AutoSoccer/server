// =============================================================
// AutoSoccer — Esqueleto da apresentacao final (28 slides)
// Plano: server/docs/PLANO_APRESENTACAO_FINAL.md — Secao 5
// Regenerar: node gerar.js  (a partir de apresentacao/build/)
// Saida:     apresentacao/AutoSoccer_Apresentacao.pptx
// =============================================================

const pptxgen = require("pptxgenjs");
const path = require("path");

// ---------- Paleta ARCADE (identidade visual do front) ----------
const C = {
  bg: "111827", // fundo escuro
  accent: "F97316", // laranja arcade
  accentDark: "C2410C", // laranja escuro (sombras)
  title: "F8FAFC", // texto claro
  body: "E2E8F0", // corpo
  muted: "94A3B8", // placeholders / rodape
  card: "1F2937", // cards escuros
  line: "374151", // bordas discretas
};

const FONT = "Arial";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 16:9 — 13.33 x 7.5 in
pptx.author = "Equipe AutoSoccer";
pptx.company = "PUCPR";
pptx.title = "AutoSoccer — Apresentacao Final 2026/1";
pptx.subject = "Experiencia Criativa: Projetando Sistemas de Informacao";

const W = 13.33;
const H = 7.5;

// ---------- Master: slide escuro padrao ----------
pptx.defineSlideMaster({
  title: "ARCADE_DARK",
  background: { color: C.bg },
  objects: [
    // faixa laranja no topo (assinatura arcade)
    { rect: { x: 0, y: 0, w: "100%", h: 0.14, fill: { color: C.accent } } },
    // pixel decorativo no canto superior direito
    { rect: { x: W - 0.55, y: 0.26, w: 0.18, h: 0.18, fill: { color: C.accent } } },
    { rect: { x: W - 0.33, y: 0.48, w: 0.18, h: 0.18, fill: { color: C.accentDark } } },
    // linha discreta acima do rodape
    { line: { x: 0.55, y: 6.92, w: W - 1.1, h: 0, line: { color: C.line, width: 1 } } },
  ],
  slideNumber: {
    x: W - 0.95,
    y: 7.02,
    w: 0.6,
    h: 0.3,
    color: C.muted,
    fontFace: FONT,
    fontSize: 10,
    align: "right",
  },
});

// ---------- Master: separador de secao (fundo laranja) ----------
pptx.defineSlideMaster({
  title: "ARCADE_SECTION",
  background: { color: C.accent },
  objects: [
    // barras escuras superior e inferior (moldura de fliperama)
    { rect: { x: 0, y: 0, w: "100%", h: 0.55, fill: { color: C.bg } } },
    { rect: { x: 0, y: H - 0.55, w: "100%", h: 0.55, fill: { color: C.bg } } },
    // pixels decorativos
    { rect: { x: 0.6, y: 1.0, w: 0.3, h: 0.3, fill: { color: C.bg } } },
    { rect: { x: 1.0, y: 1.4, w: 0.3, h: 0.3, fill: { color: C.accentDark } } },
    { rect: { x: W - 0.9, y: H - 1.3, w: 0.3, h: 0.3, fill: { color: C.bg } } },
    { rect: { x: W - 1.3, y: H - 1.7, w: 0.3, h: 0.3, fill: { color: C.accentDark } } },
  ],
  slideNumber: {
    x: W - 0.95,
    y: 7.06,
    w: 0.6,
    h: 0.3,
    color: C.accent,
    fontFace: FONT,
    fontSize: 10,
    align: "right",
  },
});

// ---------- Helpers ----------

/** Rodape discreto com dono e tempo alvo (ex: "Lucas S — 0:40") */
function addFooter(slide, owner, time) {
  slide.addText(`${owner} — ${time}`, {
    x: 0.55,
    y: 7.0,
    w: 4.5,
    h: 0.32,
    fontFace: FONT,
    fontSize: 10,
    color: C.muted,
    align: "left",
  });
}

/** Badge de indicador da rubrica (ex: "ID2.4") no canto superior direito */
function addIndicator(slide, indicator) {
  if (!indicator) return;
  slide.addText(indicator, {
    x: W - 2.45,
    y: 0.32,
    w: 1.55,
    h: 0.38,
    fontFace: FONT,
    fontSize: 11,
    bold: true,
    color: C.accent,
    align: "right",
    charSpacing: 2,
  });
}

/** Selo NOVO (entregas novas da sprint final) */
function addNovo(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 0.34,
    w: 0.95,
    h: 0.38,
    fill: { color: C.accent },
    line: { color: C.accentDark, width: 1.5 },
  });
  slide.addText("NOVO", {
    x: 0.55,
    y: 0.34,
    w: 0.95,
    h: 0.38,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: C.bg,
    align: "center",
    charSpacing: 2,
  });
}

/**
 * Slide de conteudo padrao.
 * bullets: array de strings — itens entre [colchetes] viram placeholder
 * em italico cinza; o resto vira bullet normal claro.
 */
function addContentSlide({ title, owner, time, indicator, novo, bullets }) {
  const slide = pptx.addSlide({ masterName: "ARCADE_DARK" });

  if (novo) addNovo(slide);
  addIndicator(slide, indicator);

  // titulo pesado estilo arcade
  slide.addText(title.toUpperCase(), {
    x: 0.55,
    y: 0.85,
    w: W - 1.1,
    h: 1.0,
    fontFace: FONT,
    fontSize: 30,
    bold: true,
    color: C.title,
    charSpacing: 2,
    align: "left",
    valign: "middle",
  });
  // sublinhado laranja do titulo
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.58,
    y: 1.92,
    w: 2.2,
    h: 0.09,
    fill: { color: C.accent },
  });

  // corpo com bullets / placeholders
  const runs = bullets.map((b) => {
    const isPlaceholder = b.trim().startsWith("[");
    return {
      text: b,
      options: {
        bullet: { code: "25AA", indent: 18 }, // quadradinho arcade
        color: isPlaceholder ? C.muted : C.body,
        italic: isPlaceholder,
        fontSize: 16,
        paraSpaceAfter: 10,
        breakLine: true,
      },
    };
  });
  slide.addText(runs, {
    x: 0.75,
    y: 2.25,
    w: W - 1.5,
    h: 4.45,
    fontFace: FONT,
    valign: "top",
    align: "left",
  });

  addFooter(slide, owner, time);
  return slide;
}

/** Slide separador de secao (fundo laranja, titulo gigante escuro) */
function addSectionSlide({ kicker, title, owner, slides }) {
  const slide = pptx.addSlide({ masterName: "ARCADE_SECTION" });

  slide.addText(kicker, {
    x: 0.8,
    y: 2.15,
    w: W - 1.6,
    h: 0.5,
    fontFace: FONT,
    fontSize: 18,
    bold: true,
    color: C.bg,
    charSpacing: 6,
    align: "center",
  });

  slide.addText(title, {
    x: 0.4,
    y: 2.6,
    w: W - 0.8,
    h: 1.9,
    fontFace: FONT,
    fontSize: 72,
    bold: true,
    color: C.bg,
    charSpacing: 4,
    align: "center",
    valign: "middle",
  });

  slide.addText(`${owner}  •  slides ${slides}`, {
    x: 0.8,
    y: 4.7,
    w: W - 1.6,
    h: 0.5,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: C.accentDark,
    charSpacing: 3,
    align: "center",
  });

  return slide;
}

// =============================================================
// SLIDE 1 — CAPA
// =============================================================
{
  const slide = pptx.addSlide({ masterName: "ARCADE_DARK" });

  slide.addText("[Logo / sprite arcade do AutoSoccer aqui]", {
    x: 0.8,
    y: 0.6,
    w: W - 1.6,
    h: 0.5,
    fontFace: FONT,
    fontSize: 12,
    italic: true,
    color: C.muted,
    align: "center",
  });

  slide.addText("AUTOSOCCER", {
    x: 0.4,
    y: 1.45,
    w: W - 0.8,
    h: 1.7,
    fontFace: FONT,
    fontSize: 80,
    bold: true,
    color: C.accent,
    charSpacing: 8,
    align: "center",
    valign: "middle",
    shadow: { type: "outer", color: C.accentDark, blur: 0, offset: 5, angle: 45, opacity: 0.9 },
  });

  slide.addText("Experiencia Criativa: Projetando Sistemas de Informacao — PUCPR 2026/1", {
    x: 0.8,
    y: 3.3,
    w: W - 1.6,
    h: 0.55,
    fontFace: FONT,
    fontSize: 18,
    color: C.body,
    align: "center",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: W / 2 - 1.1,
    y: 4.05,
    w: 2.2,
    h: 0.07,
    fill: { color: C.accent },
  });

  slide.addText(
    [
      { text: "Lucas Bruno e Silva", options: { breakLine: true } },
      { text: "Lucas Stopinski da Silva", options: { breakLine: true } },
      { text: "Pedro Henrique Silva Guligurski", options: {} },
    ],
    {
      x: 0.8,
      y: 4.35,
      w: W - 1.6,
      h: 1.5,
      fontFace: FONT,
      fontSize: 18,
      bold: true,
      color: C.title,
      align: "center",
      lineSpacing: 30,
    }
  );

  slide.addText("23/06/2026", {
    x: 0.8,
    y: 6.0,
    w: W - 1.6,
    h: 0.5,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: C.accent,
    charSpacing: 4,
    align: "center",
  });

  addFooter(slide, "grupo", "0:20");
}

// =============================================================
// SLIDE 2 — AGENDA
// =============================================================
addContentSlide({
  title: "Agenda",
  owner: "Lucas S",
  time: "0:20",
  bullets: [
    "O que e o AutoSoccer + problema e contexto",
    "FRONT-END — stack, i18n, batalha, dark mode, dashboard, testes (Lucas S)",
    "BACK-END — stack, padroes, Swagger, JWT, procedures, testes (Pedro)",
    "INFRAESTRUTURA — git, UML, BDD, CI/CD, monitoring, deploy (Lucas B)",
    "DEMO AO VIVO — 4 minutos cronometrados",
    "Metricas finais, licoes aprendidas e perguntas",
  ],
});

// =============================================================
// SLIDE 3 — O QUE E O AUTOSOCCER
// =============================================================
addContentSlide({
  title: "O que e o AutoSoccer",
  owner: "Lucas S",
  time: "0:40",
  indicator: "RA2",
  bullets: [
    "Auto-battler de futebol — voce monta o time, aplica itens e a simulacao roda em 12 turnos no servidor",
    "Stack full-stack: Next.js 16 + React 19 no front, Fastify 5 + Sequelize + MySQL 8 no back, WebSocket pra streaming da batalha",
    "Loop de jogo: mercado rotativo -> compor time -> aplicar itens -> jogar rodada -> subir ranking",
    "Matchmaking assincrono contra snapshots de times reais filtrados por victory_ratio (RN006)",
    "[Screenshot da tela de batalha em dark mode aqui — print em alta resolucao]",
  ],
});

// =============================================================
// SLIDE 4 — PROBLEMA E CONTEXTO
// =============================================================
addContentSlide({
  title: "Problema e contexto",
  owner: "Pedro",
  time: "0:40",
  indicator: "RA1",
  bullets: [
    "Aplicar engenharia de software de ponta a ponta — requisitos, arquitetura, modelagem, testes, CI/CD, deploy real",
    "Auto-battler como dominio: tem simulacao deterministica, economia, matchmaking, ranking e snapshots — forca padroes de projeto reais (Strategy, Factory, ErrorHandler)",
    "Equipe de 3 com papeis fixos (front, back, infra/QA) — entrega final 23/06 cobrindo RA1 (propor) e RA2 (implementar)",
    "Modelagem nao trivial: User, Team, Athlete, Item, TeamSnapshot, Campaign, Match, Ability — relacoes 1:N e N:N reais",
    "[Diagrama de contexto C4: front -> API -> MySQL + plugin Railway, com WebSocket separado]",
  ],
});

// =============================================================
// SLIDE 5 — SECAO FRONT-END
// =============================================================
addSectionSlide({
  kicker: "PARTE 1",
  title: "FRONT-END",
  owner: "Lucas Stopinski da Silva",
  slides: "6-11",
});

// =============================================================
// SLIDES 6-11 — FRONT (Lucas S)
// =============================================================
addContentSlide({
  title: "Stack front-end",
  owner: "Lucas S",
  time: "0:30",
  indicator: "ID2.4",
  bullets: [
    "Next.js 16 (App Router) + React 19 — Server Components por padrao reduzem JS no cliente",
    "antd 6 como design system com tema arcade customizado via ConfigProvider (token + algorithm)",
    "axios com interceptors: injeta Authorization Bearer e trata 401 globalmente",
    "next-intl 4 para i18n (so funciona em App Router — Pages Router em manutencao)",
    "Por que Next e nao Vite: SSR nativo, layouts aninhados (ThemeProvider sem prop drilling) e otimizacao de fontes/imagens prontos",
  ],
});

addContentSlide({
  title: "i18n com next-intl",
  owner: "Lucas S",
  time: "0:40",
  indicator: "ID2.4",
  bullets: [
    "Resolucao em 3 niveis: cookie NEXT_LOCALE -> Accept-Language (com parsing de q-factor) -> defaultLocale pt-BR",
    "9 namespaces (auth, common, home, game, battle, ranking, profile, errors, validation) — paridade garantida por script no CI",
    "Componentes server usam getTranslations(); client usam useTranslations() — mesma API, contextos diferentes",
    "LanguageSwitcher grava cookie e da window.location.reload() pra re-renderizar com mensagens novas do servidor",
    "[Screenshot do LanguageSwitcher trocando PT -> EN na mesma tela]",
  ],
});

addContentSlide({
  title: "Layout da batalha",
  owner: "Lucas S",
  time: "0:50",
  indicator: "ID2.1",
  bullets: [
    "Header unificado (titulo + placar + turno) + sidebar de logs verticais + campo 6x3 com bola animada",
    "Streaming via WebSocket: POST /match/play devolve matchId, hook useBattleStream abre wss://host/ws/battle/:matchId?token=<jwt> e recebe 12 turnos com sleep de 800ms",
    "Bola animada via CSS transitions seguindo as coordenadas de cada TurnEvent — sem framework de animacao",
    "Maquina de estados: idle -> connecting -> streaming -> finished (com fallback local de setInterval se WS falhar)",
    "[Screenshot da tela de batalha com bola em movimento + logs verticais visiveis]",
  ],
});

addContentSlide({
  title: "Dark mode + responsividade + WCAG",
  owner: "Lucas S",
  time: "0:30",
  indicator: "ID2.2",
  novo: true,
  bullets: [
    "Tema persiste em cookie NEXT_THEME lido server-side no layout.tsx — chega no <html data-theme=\"dark\"> antes do React montar (zero FOUC)",
    "AntdProvider observa data-theme via MutationObserver e troca em runtime entre defaultAlgorithm e darkAlgorithm do antd",
    "CSS vars duplas em globals.css (:root light + :root[data-theme=\"dark\"]) — Button, Input, Modal e Select respondem ao tema",
    "Identidade arcade preservada no dark: laranja #f97316, campo verde, trofeu dourado mantidos hardcoded",
    "[Screenshot lado a lado: mesma tela em light e dark mode]",
  ],
});

addContentSlide({
  title: "Dashboard com graficos no ranking",
  owner: "Lucas S",
  time: "0:30",
  indicator: "ID2.3",
  novo: true,
  bullets: [
    "Pagina /ranking com podium dos top 3, lista paginada e painel de metricas pessoais do jogador logado",
    "Donut chart de win rate (verde sucesso x vermelho derrota) renderizado via conic-gradient puro (sem lib extra)",
    "Cards de metricas: vitorias, derrotas, taxa de vitoria, posicao atual no ranking + grid responsivo",
    "Endpoint /ranking devolve lista global; /auth/me agrega metricas do usuario (joins agregados em SQL)",
    "[Screenshot do dashboard /ranking em dark mode com podium + donut + cards]",
  ],
});

addContentSlide({
  title: "Testes no front",
  owner: "Lucas S",
  time: "0:40",
  indicator: "ID2.2",
  bullets: [
    "Vitest 4 rodando em happy-dom (~2x mais rapido que jsdom) + cobertura V8 com lcov pro SonarCloud",
    "144 testes em 19 arquivos — components, context, hooks, lib, providers, services (app/** sera coberto por Playwright)",
    "Helper renderWithProviders injeta NextIntlClientProvider (pt-BR + 9 namespaces), AntdProvider e AuthProvider",
    "Mocks reutilizaveis em src/__tests__/mocks/: api.ts (axios), localStorage.ts, router.ts (next/navigation)",
    "Filosofia: testar comportamento (clica botao -> dispara axios.post correto), nao implementacao (state interno)",
    "[Print do terminal com o coverage report mostrando ~94%]",
  ],
});

// =============================================================
// SLIDE 12 — SECAO BACK-END
// =============================================================
addSectionSlide({
  kicker: "PARTE 2",
  title: "BACK-END",
  owner: "Pedro Henrique Silva Guligurski",
  slides: "13-19",
});

// =============================================================
// SLIDES 13-19 — BACK (Pedro)
// =============================================================
addContentSlide({
  title: "Stack back-end",
  owner: "Pedro",
  time: "0:30",
  indicator: "ID2.4",
  bullets: [
    "Fastify 5 + Sequelize 6 + MySQL 8 + i18next (com paridade pt-BR/en) + @fastify/jwt + @fastify/websocket 11",
    "Por que Fastify e nao Express: ~2x mais rapido (find-my-way + serializacao via schema), plugin system com encapsulamento real",
    "JSON Schema das rotas serve para validacao E para o Swagger automaticamente — sem duplicacao",
    "Modulos por dominio em src/modules/: auth, equipe, mercado, partida, ranking, simulador, reports, matchmaking, admin",
    "Motor de simulacao isolado (modulo simulador/) sem I/O nem DB — recebe DTOs e retorna resultado, testavel com vi.fn() como RNG",
  ],
});

addContentSlide({
  title: "Padroes de projeto",
  owner: "Pedro",
  time: "0:50",
  indicator: "ID2.2",
  bullets: [
    "Strategy nas disputas: cada tipo de evento (gol, passe, defesa, recuo RN011, break RN007) e uma estrategia trocavel",
    "Factory nos testes: fabricas de Team, Athlete, Match deixam suites legiveis e independentes do schema",
    "ErrorHandler global em src/plugins/errorHandler.ts: uma ServiceError tipada por modulo (RodadaServiceError, EquipeServiceError, MercadoServiceError, MatchmakingError, ItemServiceError, ReportsServiceError, etc) — base ServiceError",
    "Resposta consistente: { error: { code, message } } traduzido via i18next baseado no Accept-Language",
    "Por que Strategy: trocar disputa nova vira adicionar arquivo + registrar — sem mexer no engine principal",
  ],
});

addContentSlide({
  title: "i18n no back-end",
  owner: "Pedro",
  time: "0:30",
  indicator: "ID2.4",
  bullets: [
    "Plugin i18next-fs-backend carrega 10 namespaces de src/i18n/locales/{pt-BR,en}/*.json",
    "Namespaces: auth, common, equipe, itens, mercado, partida, ranking, simulador, abilities + swagger",
    "Middleware le Accept-Language da request e decora request.i18n.t — keys tipo equipe.errors.athlete_not_found",
    "Script yarn i18n:check valida paridade — CI quebra se faltar uma chave em pt-BR ou en",
    "Mesmo i18n alimenta as descricoes do Swagger (swagger.json por locale) — UI muda de idioma com o Accept-Language",
  ],
});

addContentSlide({
  title: "Swagger 100%",
  owner: "Pedro",
  time: "0:40",
  indicator: "ID1.2",
  bullets: [
    "Cada rota tem schema { tags, summary, description, body, response } convertido em OpenAPI 3.0 pelo @fastify/swagger",
    "Schemas compartilhados em src/plugins/swagger.schemas.ts registrados via app.addSchema() e referenciados por $ref",
    "Textos (summaries, descriptions) externalizados em src/i18n/locales/<locale>/swagger.json — UI muda de idioma com Accept-Language",
    "WebSocket /ws/battle/:matchId nao aparece na UI (limitacao OpenAPI 3.0) — documentado na tag WebSocket e na descricao do POST /match/play",
    "URL publica: https://autosoccer-api-production.up.railway.app/docs",
    "[Screenshot do /docs em producao com rotas agrupadas por tag: Auth, Athletes, Team, Market, Match, Ranking, Admin]",
  ],
});

addContentSlide({
  title: "JWT com 2 permissoes",
  owner: "Pedro",
  time: "0:30",
  indicator: "ID2.3",
  novo: true,
  bullets: [
    "Payload com 3 claims: { id, nickname, role } — role e enum 'user' | 'admin'",
    "Plugin @fastify/jwt decora request.user apos validar a assinatura",
    "Middlewares em auth.middleware.ts: requireAuth (qualquer logado) e requireRole('admin') (so admin)",
    "Rotas admin-only: GET /admin/users + os 3 relatorios em /admin/reports (slide 18)",
    "Contas admin so sao criadas direto no banco (sem rota publica de promocao) — decisao de seguranca",
    "Acesso indevido retorna 403 FORBIDDEN com mensagem traduzida via i18next",
  ],
});

addContentSlide({
  title: "Stored procedures + relatorios gerenciais",
  owner: "Pedro",
  time: "0:50",
  indicator: "ID2.3",
  novo: true,
  bullets: [
    "3 procedures criadas via migration reversivel (20260610220000-create-reports-stored-procedures.cjs):",
    "sp_get_top_athletes_by_role(role, limit) — top atletas por posicao ordenados por poder bruto (attack + defense + velocity)",
    "sp_team_power_ranking(limit) — ranking de equipes pelo somatorio do poder + metricas de campanha (vitorias, derrotas, trofeus)",
    "sp_market_overview() — visao agregada do mercado: totais, breakdown por tier e por posicao (emite 3 SELECTs em sequencia)",
    "Por que procedure: agregacao pesada (JOINs + GROUP BY) e mais rapida no MySQL do que trazer dados brutos pro Node e agregar em memoria; ainda permite tunar indices sem deploy de aplicacao",
    "[Print do resultado de sp_get_top_athletes_by_role via Swagger ou curl]",
  ],
});

addContentSlide({
  title: "Testes no back",
  owner: "Pedro",
  time: "0:40",
  indicator: "ID2.2",
  bullets: [
    "204 testes em 22 arquivos — Vitest 4 com fake timers para o motor de simulacao",
    "Cobertura ~84% (lcov enviado pro SonarCloud no CI)",
    "Suites de integration sobem MySQL via Docker Compose e rodam migrations antes",
    "Motor de simulacao testado deterministicamente: processarRodada(team, opp, { random: vi.fn().mockReturnValue(0.5) })",
    "Factories de Team, Athlete e Item deixam suites legiveis sem repetir setup",
    "[Print do terminal com coverage report mostrando ~84%]",
  ],
});

// =============================================================
// SLIDE 20 — SECAO INFRA
// =============================================================
addSectionSlide({
  kicker: "PARTE 3",
  title: "INFRAESTRUTURA",
  owner: "Lucas Bruno e Silva",
  slides: "21-26",
});

// =============================================================
// SLIDES 21-26 — INFRA (Lucas B)
// =============================================================
addContentSlide({
  title: "Git workflow",
  owner: "Lucas B",
  time: "0:40",
  indicator: "ID1.3, ID1.4",
  bullets: [
    "Conventional Commits em pt-BR sem acentos: feat, fix, chore, docs, refactor, test",
    "Branches por workstream: tipo/ws-XX-<slug> + integration branch antes do merge na main",
    "Husky + commitlint validam mensagem local; CI valida formato + testes + lint + typecheck antes do merge",
    "Sem Co-Authored-By desde a Sprint 4 (decisao do grupo)",
    "Convencao documentada em server/CONTRIBUTING.md e front/AGENTS.md",
    "[Print do git log --oneline mostrando o padrao dos commits]",
  ],
});

addContentSlide({
  title: "UML: classes, sequencia e atividade",
  owner: "Lucas B",
  time: "0:50",
  indicator: "ID1.2",
  novo: true,
  bullets: [
    "Diagrama de classes em server/docs/diagrams/classes.md: User, Team, Athlete, Item, TeamSnapshot, Campaign + relacoes",
    "Sequencia de login JWT (seq-login.md): Front -> Fastify -> auth.service -> DB -> resposta com token",
    "Sequencia de jogar rodada (seq-jogar-rodada.md): POST /match/play -> rodada.service -> simulador -> matchmaking -> snapshot -> WebSocket",
    "Atividade da campanha (atividade-campanha.md): start -> mercado -> aplicar itens -> jogar rodada -> repete -> finaliza/desiste",
    "Tudo em Mermaid (renderiza direto no GitHub, fontes versionados no repo)",
    "[Print do diagrama de classes renderizado no GitHub]",
  ],
});

addContentSlide({
  title: "Features BDD + User Stories",
  owner: "Lucas B",
  time: "0:40",
  indicator: "ID1.1",
  novo: true,
  bullets: [
    "3 features Gherkin em server/docs/features/: autenticacao.feature, mercado.feature, batalha.feature",
    "Cada feature tem cenarios Dado / Quando / Entao cobrindo happy path E erros (credenciais invalidas, saldo insuficiente)",
    "3 user stories em server/docs/user-stories.md no formato 'Como X, quero Y, para Z' com criterios de aceite e DoD",
    "Stories tem IDs (US-01..US-03) referenciados na descricao da branch e do commit (feat(ws-04): US-02 ...)",
    "Teste correspondente tem describe('US-02 - mercado', ...) — fecha o ciclo de rastreabilidade",
    "[Print de uma feature Gherkin real renderizada no GitHub]",
  ],
});

addContentSlide({
  title: "CI/CD com GitHub Actions",
  owner: "Lucas B",
  time: "0:30",
  indicator: "ID1.4",
  bullets: [
    "ci-pr.yml: roda em todo PR — lint + typecheck + i18n parity + test:coverage + build",
    "ci-main.yml: roda no push em main — mesmos jobs + envia coverage pro SonarCloud + tag staging-YYYYMMDD-<sha>",
    "Front e server tem workflows espelhados, com NEXT_PUBLIC_API_URL e env vars de teste pre-definidas",
    "Coverage uploadado como artifact + comentario automatico no PR com tabela de Lines/Branches/Functions/Statements",
    "Branch protection: PR com gate vermelho nao mergeada",
    "[Screenshot de um run verde do workflow com todos os jobs]",
  ],
});

addContentSlide({
  title: "Sonar + UptimeRobot + healthcheck",
  owner: "Lucas B",
  time: "0:30",
  indicator: "ID1.4",
  novo: true,
  bullets: [
    "SonarCloud conectado aos 2 repos via GitHub App — CI envia coverage/lcov.info apos os testes",
    "Quality gate: cobertura nova >= 80%, zero bugs criticos, zero vulnerabilidades, debt ratio < 5%",
    "UptimeRobot monitora /health a cada 5 minutos + SSL com alerta 7 dias antes de expirar",
    "Healthcheck real: GET https://autosoccer-api-production.up.railway.app/health -> 200 { status: 'ok', timestamp }",
    "Vitest configurado com projectRoot: './' no provider V8 — paths relativos batem com sonar.sources=src",
    "[Print do dashboard SonarCloud com badge no README + uptime do UptimeRobot]",
  ],
});

addContentSlide({
  title: "Deploy Railway + Vercel",
  owner: "Lucas B",
  time: "0:40",
  indicator: "ID2.4",
  bullets: [
    "Back no Railway: Nixpacks como builder + plugin MySQL nativo no mesmo projeto",
    "Front na Vercel: auto-deploy via GitHub App, preview por PR + producao no main",
    "Start Command no Railway: 'npm run db:migrate && node dist/index.js' — migration roda antes do server subir",
    "URLs publicas: autosoccer-api-production.up.railway.app + autosoccer.vercel.app",
    ".env por ambiente + secrets nunca commitados (Sequelize com sync: false)",
    "[Print do painel do Railway com o service + plugin MySQL ativos]",
  ],
});

// =============================================================
// SLIDE 27 — DEMO AO VIVO (checklist do roteiro de 4 min)
// =============================================================
{
  const slide = pptx.addSlide({ masterName: "ARCADE_DARK" });

  slide.addText("DEMO AO VIVO", {
    x: 0.55,
    y: 0.85,
    w: W - 1.1,
    h: 1.0,
    fontFace: FONT,
    fontSize: 30,
    bold: true,
    color: C.accent,
    charSpacing: 2,
    valign: "middle",
  });
  slide.addText("4 minutos cronometrados — Lucas S dirige", {
    x: 0.58,
    y: 1.7,
    w: 8,
    h: 0.4,
    fontFace: FONT,
    fontSize: 14,
    bold: true,
    color: C.muted,
    charSpacing: 1,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.58,
    y: 2.12,
    w: 2.2,
    h: 0.09,
    fill: { color: C.accent },
  });

  const steps = [
    ["0:00–0:30", "Landing page + LanguageSwitcher (PT -> EN -> PT)"],
    ["0:30–1:00", "Login convidado + toggle de dark mode"],
    ["1:00–2:00", "Mercado: comprar 2 atletas + 1 item, drag pro campo"],
    ["2:00–3:00", "Jogar 1 rodada completa (animacao da bola + logs verticais)"],
    ["3:00–3:30", "Modal de fim de rodada -> voltar ao menu"],
    ["3:30–4:00", "Ranking com dashboard de graficos"],
  ];

  const checklist = [];
  steps.forEach(([t, desc]) => {
    checklist.push({
      text: `☐  ${t}  `,
      options: { color: C.accent, bold: true, fontSize: 16 },
    });
    checklist.push({
      text: desc,
      options: { color: C.body, fontSize: 16, breakLine: true, paraSpaceAfter: 10 },
    });
  });
  slide.addText(checklist, {
    x: 0.85,
    y: 2.4,
    w: W - 1.7,
    h: 3.3,
    fontFace: FONT,
    valign: "top",
  });

  slide.addText(
    "Plano B: screenshots de backup + video gravado (ver ROTEIRO_DEMO.md)  •  Indicadores: tudo",
    {
      x: 0.85,
      y: 6.05,
      w: W - 1.7,
      h: 0.5,
      fontFace: FONT,
      fontSize: 13,
      italic: true,
      color: C.muted,
    }
  );

  addFooter(slide, "Lucas S dirige", "4:00");
}

// =============================================================
// SLIDE 28 — METRICAS FINAIS + LICOES + Q&A
// =============================================================
{
  const slide = pptx.addSlide({ masterName: "ARCADE_DARK" });

  slide.addText("NUMEROS FINAIS", {
    x: 0.55,
    y: 0.7,
    w: W - 1.1,
    h: 0.8,
    fontFace: FONT,
    fontSize: 30,
    bold: true,
    color: C.title,
    charSpacing: 2,
    valign: "middle",
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.58,
    y: 1.5,
    w: 2.2,
    h: 0.09,
    fill: { color: C.accent },
  });

  // cards de metricas (5 colunas)
  const metrics = [
    ["75+", "commits"],
    ["348", "testes"],
    ["~84%", "cobertura back"],
    ["~94%", "cobertura front"],
    ["16", "workstreams"],
  ];
  const cardW = 2.25;
  const gap = 0.18;
  const totalW = metrics.length * cardW + (metrics.length - 1) * gap;
  let cx = (W - totalW) / 2;
  metrics.forEach(([num, label]) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: cx,
      y: 1.95,
      w: cardW,
      h: 1.55,
      fill: { color: C.card },
      line: { color: C.accent, width: 3 },
    });
    slide.addText(num, {
      x: cx,
      y: 2.1,
      w: cardW,
      h: 0.8,
      fontFace: FONT,
      fontSize: 32,
      bold: true,
      color: C.accent,
      align: "center",
    });
    slide.addText(label, {
      x: cx,
      y: 2.9,
      w: cardW,
      h: 0.5,
      fontFace: FONT,
      fontSize: 13,
      bold: true,
      color: C.body,
      align: "center",
      charSpacing: 1,
    });
    cx += cardW + gap;
  });

  slide.addText(
    "144 testes front (19 arquivos) + 204 testes back (22 arquivos) — Vitest 4 em ambos",
    {
      x: 0.85,
      y: 3.65,
      w: W - 1.7,
      h: 0.35,
      fontFace: FONT,
      fontSize: 12,
      italic: true,
      color: C.muted,
      align: "center",
    }
  );

  slide.addText("LICOES APRENDIDAS", {
    x: 0.85,
    y: 4.15,
    w: 6,
    h: 0.4,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: C.accent,
    charSpacing: 2,
  });
  slide.addText(
    [
      {
        text: "i18n full-stack desde a Sprint 1 economizou retrofit caro de namespaces e paridade",
        options: { bullet: { code: "25AA", indent: 18 }, paraSpaceAfter: 8, breakLine: true },
      },
      {
        text: "CI estrito (lint + typecheck + test + i18n parity) pegou bugs antes de virarem incidente em prod",
        options: { bullet: { code: "25AA", indent: 18 }, paraSpaceAfter: 8, breakLine: true },
      },
      {
        text: "Arquitetura definida no inicio (Server Components, JSON Schema, ServiceError por modulo) evitou refactor depois",
        options: { bullet: { code: "25AA", indent: 18 } },
      },
    ],
    {
      x: 0.85,
      y: 4.55,
      w: 7.6,
      h: 1.6,
      fontFace: FONT,
      fontSize: 14,
      color: C.body,
      valign: "top",
    }
  );

  // bloco Perguntas?
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.9,
    y: 4.35,
    w: 3.6,
    h: 1.7,
    fill: { color: C.accent },
    line: { color: C.accentDark, width: 3 },
  });
  slide.addText("PERGUNTAS?", {
    x: 8.9,
    y: 4.35,
    w: 3.6,
    h: 1.7,
    fontFace: FONT,
    fontSize: 28,
    bold: true,
    color: C.bg,
    align: "center",
    valign: "middle",
    charSpacing: 3,
  });

  addFooter(slide, "grupo", "1:00");
}

// =============================================================
// Gerar arquivo
// =============================================================
const outPath = path.join(__dirname, "..", "AutoSoccer_Apresentacao.pptx");
pptx
  .writeFile({ fileName: outPath })
  .then(() => console.log(`OK: ${outPath} gerado com 28 slides.`))
  .catch((err) => {
    console.error("ERRO ao gerar pptx:", err);
    process.exit(1);
  });
