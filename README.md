# server

API base com Fastify, TypeScript e Sequelize (MySQL).

Porta local padrao da API: `3333`.

## Requisitos

- Node.js 20+
- Yarn 1.x
- Docker

## Como iniciar

1. Instale as dependencias:

```bash
yarn install
```

2. Crie seu arquivo de ambiente:

```bash
cp .env.example .env
```

3. Suba o MySQL:

```bash
yarn db:up
```

4. Aplique as migrations:

```bash
yarn db:migrate
```

5. Inicie a API em modo desenvolvimento:

```bash
yarn dev
```

API local: `http://localhost:3333`

Documentacao Swagger: `http://localhost:3333/docs`

## Comandos uteis

```bash
yarn db:logs  # logs do MySQL
yarn db:down  # derruba containers e rede
yarn test     # executa os testes
yarn typecheck
```

O contrato usado pelo frontend esta documentado em
[`docs/api-equipe.md`](docs/api-equipe.md).

## Deploy (Render + MySQL externo)

A API foi preparada para rodar no [Render](https://render.com) free tier com banco
MySQL gerenciado externamente (Railway, Aiven ou Clever Cloud).

URL publica esperada apos o deploy:

- API: `https://autosoccer-api.onrender.com`
- Swagger UI: `https://autosoccer-api.onrender.com/docs`
- Health check: `https://autosoccer-api.onrender.com/health`

### Arquivos relevantes

- [`render.yaml`](render.yaml): blueprint do servico (build, start, healthcheck, env vars).
- [`.env.production.example`](.env.production.example): template das variaveis de ambiente
  para o painel do Render.

### Variaveis de ambiente em producao

| Variavel        | Onde definir          | Valor                                          |
| --------------- | --------------------- | ---------------------------------------------- |
| `NODE_ENV`      | `render.yaml`         | `production`                                   |
| `APP_HOST`      | `render.yaml`         | `0.0.0.0`                                      |
| `PORT`          | injetada pelo Render  | porta atribuida automaticamente                |
| `CORS_ORIGIN`   | `render.yaml`         | URL do frontend (ex.: `https://autosoccer.vercel.app`) |
| `DATABASE_URL`  | Render Dashboard (secret) | connection string MySQL (`mysql://user:pass@host:port/db`) |
| `DB_SSL`        | `render.yaml`         | `true` (Railway/Aiven exigem SSL)              |
| `JWT_SECRET`    | Render Dashboard (secret) | gerar com `openssl rand -hex 32`           |
| `JWT_EXPIRES_IN`| `render.yaml`         | `5d`                                           |

Para gerar um `JWT_SECRET` forte:

```bash
openssl rand -hex 32
```

### Passos para subir no Render

1. Provisionar MySQL externo (escolher uma das opcoes):
   - **Railway** (recomendado): plugin MySQL com ~$5 de credito gratuito por mes.
   - **Aiven**: free trial de 1 mes.
   - **Clever Cloud**: MySQL gratuito pequeno.
   Anote a connection string no formato `mysql://USER:PASS@HOST:PORT/DB`.
2. No Render Dashboard, criar um novo servico via **New > Blueprint** apontando para
   este repositorio e selecionar o `server/render.yaml`.
3. No painel do Render, preencher as secrets marcadas como `sync: false`:
   `DATABASE_URL` (passo 1) e `JWT_SECRET` (gerar com `openssl rand -hex 32`).
4. O build executa `npm ci && npm run build && npm run db:migrate`, garantindo que as
   migrations rodam antes do primeiro start. Depois disso, `node dist/index.js` sobe a
   API.
5. Validar o deploy:
   - `GET /health` retorna `200` com `{ status: 'ok' }`.
   - `GET /docs` exibe o Swagger UI.

### Mantendo o servico acordado (free tier)

O Render free tier hiberna apos 15min sem trafego. Para evitar cold start nas demos,
configure um monitor gratuito no [UptimeRobot](https://uptimerobot.com):

1. Criar conta e novo monitor do tipo **HTTP(s)**.
2. URL: `https://autosoccer-api.onrender.com/health`.
3. Intervalo: 10 minutos (limite do plano free).

### Smoke test pos-deploy

```bash
# Registrar usuario
curl -X POST https://autosoccer-api.onrender.com/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Demo@1234","name":"Demo"}'

# Login
curl -X POST https://autosoccer-api.onrender.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Demo@1234"}'

# Listar mercado (use o token do login)
curl https://autosoccer-api.onrender.com/mercado \
  -H 'Authorization: Bearer <token>'

# Jogar uma rodada
curl -X POST https://autosoccer-api.onrender.com/partida/jogar-rodada \
  -H 'Authorization: Bearer <token>'
```

### Smoke test local antes do deploy

```bash
yarn install
yarn build
NODE_ENV=production \
  DATABASE_URL="mysql://user:password@host:3306/auto_soccer" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  CORS_ORIGIN="*" \
  APP_HOST=0.0.0.0 \
  PORT=3333 \
  node dist/index.js
```

> Apos a primeira publicacao, atualizar este README substituindo a URL provisoria
> `https://autosoccer-api.onrender.com` pela URL real do servico no Render.
