# AutoSoccer Server — Workflows

Pipelines CI/CD do server (Fastify 5 + TS + Sequelize + MySQL + Vitest 4).
Estruturados por ambiente:

| Workflow | Trigger | Ambiente | O que faz |
| --- | --- | --- | --- |
| `ci-pr.yml` | `pull_request` para `main` | dev | lint, typecheck, i18n parity, `test:coverage`, sobe coverage como artifact e comenta o resumo no PR. |
| `ci-main.yml` | `push` em `main` | staging | mesmas etapas do PR + envia cobertura para SonarCloud + cria tag `staging-YYYYMMDD-<sha>`. |
| `cd-production.yml` | `release` (published) ou `workflow_dispatch` | staging/production | Conecta via SSH no Cloudways e roda `git pull && yarn install && yarn build && yarn db:migrate && pm2 reload`. Requer confirmação manual (input `confirm=DEPLOY`). |

## Como disparar um deploy

### Automático
Publique um GitHub Release (`Releases → Draft a new release → Publish`).
O `cd-production.yml` será disparado e fará o deploy em `production`.

### Manual
1. Acesse `Actions → CD - Production (Cloudways) → Run workflow`.
2. Escolha o ambiente (`staging` ou `production`).
3. Digite `DEPLOY` no campo de confirmação.
4. Clique em `Run workflow`.

## Secrets necessárias

Configurar em **Settings → Secrets and variables → Actions**:

- `SONAR_TOKEN` — token do projeto no [SonarCloud](https://sonarcloud.io).
- `CLOUDWAYS_SSH_HOST` — IP/host da app Cloudways.
- `CLOUDWAYS_SSH_USER` — usuário SSH (Master/Application Credentials).
- `CLOUDWAYS_SSH_KEY` — chave privada SSH (formato PEM/OpenSSH).
- `CLOUDWAYS_SSH_PORT` _(opcional)_ — default 22.

## Por que SSH em vez de API?

A Cloudways não oferece API de deploy granular. O fluxo oficial é "Git
Pull" no painel + comandos via SSH. O `cd-production.yml` automatiza esse
fluxo com a action `appleboy/ssh-action@v1`.
