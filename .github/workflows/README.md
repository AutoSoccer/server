# AutoSoccer Server — Workflows

Pipelines CI/CD do server (Fastify 5 + TS + Sequelize + MySQL + Vitest 4).
Estruturados por ambiente:

| Workflow      | Trigger                    | Ambiente | O que faz                                                                                            |
| ------------- | -------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `ci-pr.yml`   | `pull_request` para `main` | dev      | lint, typecheck, i18n parity, `test:coverage`, sobe coverage como artifact e comenta o resumo no PR. |
| `ci-main.yml` | `push` em `main`           | staging  | mesmas etapas do PR + envia cobertura para SonarCloud + cria tag `staging-YYYYMMDD-<sha>`.           |

## Deploy de produção

O deploy é feito pelo **Railway** automaticamente a cada `git push origin main` —
não há workflow do GitHub Actions para isso. Railway usa Nixpacks como builder
e expõe a API em `https://autosoccer-api-production.up.railway.app`.

Para deploy manual rápido sem commit, usar a Railway CLI dentro de `server/`:

```bash
npm install -g @railway/cli
railway login
railway link        # selecionar o service autosoccer-api
railway up          # upload + build + deploy
```

Detalhes completos (Build Command, Start Command, variáveis de ambiente
necessárias) estão no [README.md](../../README.md#deploy-railway--mysql-plugin)
do server.

## Secrets necessárias

Configurar em **Settings → Secrets and variables → Actions**:

- `SONAR_TOKEN` — token do projeto no [SonarCloud](https://sonarcloud.io).

> Histórico: existiu um `cd-production.yml` que fazia deploy via SSH no
> Cloudways. Foi removido em 20/06/2026 por ser código morto — nunca foi
> acionado em produção; o Railway sempre fez o deploy.
