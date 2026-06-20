# Cheat Sheet de Defesa — Infraestrutura / QA

> **Integrante:** Lucas Bruno e Silva
> **Disciplina:** Experiencia Criativa BSI PUCPR 2026/1
> **Apresentacao:** 23/06/2026 — defesa individual obrigatoria
> **Documento irmao:** [`ARQUITETURA_SERVER.md`](./ARQUITETURA_SERVER.md) — secoes "CI/CD" e "Deploy"

10 perguntas previsiveis da banca com respostas curtas (2-4 linhas, ~30s de fala). Use como roteiro mental, nao leia literal. Se uma pergunta nao for sua area, redirecione: "essa parte foi conduzida pelo Lucas Stopinski (front) / Pedro (back), mas conheco a decisao."

---

## 1. Como funciona o pipeline CI/CD (GitHub Actions)?
Dois workflows ativos no `.github/workflows/`:
- **`ci-pr.yml`** — roda em todo pull request para `main`. Jobs: `lint` (ESLint + Prettier check), `typecheck` (tsc --noEmit), `i18n:check` (script custom de paridade pt-BR/en), `test:coverage` (vitest com cobertura uploadada como artifact) e comentario no PR com resumo.
- **`ci-main.yml`** — roda no push em `main`. Mesmos jobs + envio de cobertura pro SonarCloud + cria tag `staging-YYYYMMDD-<sha>`.

Cache de `node_modules` via `actions/cache`. Falhou um job, falhou o PR — branch protection garante que main so recebe codigo verde.

## 2. Como o front e deployado (Vercel)?
Vercel conectado ao repo via GitHub App. Cada PR gera um preview deployment com URL unica — usamos pra QA visual. Merge na main dispara deploy de producao. Env vars `NEXT_PUBLIC_API_URL` (apontando pro Railway) configurada no painel da Vercel, separada por ambiente (preview vs production).

## 3. Como o back e deployado (Railway + plugin MySQL)?
A API roda no **Railway** usando **Nixpacks** como builder e o **plugin MySQL nativo** do Railway (sem Docker custom). Configuracao no painel:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run db:migrate && node dist/index.js` (migrations rodam **antes** do servidor subir — se falhar, versao antiga continua no ar)
- **DATABASE_URL:** injetado via `${{MySQL.MYSQL_URL}}` (referencia ao plugin)

Auto-deploy a cada `git push origin main` via webhook do GitHub. URL publica: `https://autosoccer-api-production.up.railway.app`. Para deploy manual rapido sem commit, uso a Railway CLI (`railway up`).

## 4. Como voce monitora producao (UptimeRobot)?
Monitors no UptimeRobot (plano free): `https://autosoccer-api-production.up.railway.app/health` (HTTP 200, ping 5min), `https://autosoccer.vercel.app` (HTTP 200, ping 5min) e cert SSL com alerta 7 dias antes de expirar. Alertas vao para o canal Discord da equipe. Status publico em `https://stats.uptimerobot.com/autosoccer`.

## 5. Como funciona o SonarCloud (cobertura, qualidade)?
SonarCloud conectado aos dois repos via GitHub App. CI envia `coverage/lcov.info` apos os testes (com `projectRoot: './'` no Vitest pra paths relativos baterem com `sonar.sources=src`). Quality gate exige: cobertura nova >= 80%, zero bugs criticos, zero vulnerabilidades, debt ratio < 5%. Badge no README do server e do front mostra status atual. Pull request com gate falhando nao pode ser mergeada (branch protection).

## 6. Como funciona o Conventional Commits + branch naming?
Commits no padrao `tipo(escopo): descricao` em **pt-BR sem acentos** — tipos `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Husky + commitlint validam local. Branches no padrao `tipo/ws-XX-slug` (workstream) ou `tipo/slug` (apresentacao). Sem `Co-Authored-By` desde a Sprint 4 (decisao do grupo). Documentado em `server/CONTRIBUTING.md` e `front/AGENTS.md`.

## 7. Como o time gerencia sprints (TDE formal)?
GitHub Project central com kanban (To do / In progress / Done) e milestones por sprint (1 a 5). Cada workstream WS-01 a WS-16 virou issue com criterios de aceite. Sprint Planning, Backlog, Review e Retrospective documentados em `server/docs/sprints/` cobrindo "o que deu certo", "o que melhorar" e "acoes". TDE formal no `PLANO_APRESENTACAO.md`.

## 8. Como funcionam os user stories em formato BDD/Gherkin?
Tres `.feature` files em `server/docs/features/`: `autenticacao.feature`, `mercado.feature` e `batalha.feature`. Cada feature tem cenarios `Given / When / Then` cobrindo happy path e erro (ex: "credenciais invalidas", "saldo insuficiente"). Tres user stories em `server/docs/user-stories.md` no formato "Como X, quero Y, para Z" com criterios de aceite e DoD.

## 9. Como voce prova rastreabilidade (US ↔ commit ↔ teste)?
Cada user story tem um ID (US-01, US-02, US-03...). Branch e commit referenciam o ID na descricao: `feat(ws-04): US-02 listar atletas no mercado`. Teste correspondente tem `describe('US-02 - mercado', ...)`. PR no merge linka issue do GitHub Project, fechando o ciclo. README do server explica o fluxo na secao "Como contribuir".

## 10. O que voce mudaria se comecasse de novo?
Teria configurado o GitHub Project e os Conventional Commits desde a sprint 1 — fizemos retroativo e algumas issues nao casaram 100% com os commits antigos. Tambem teria investigado mais cedo a documentacao "as code" do Railway (`railway.toml` com config versionada em vez de configurar Build/Start Command no painel) — funcionou bem, mas evitariamos pequenas divergencias entre "o que o painel mostra" e "o que o repo descreve".

---

> Documento mantido por Lucas Bruno e Silva. Ultima atualizacao: 20/06/2026.
