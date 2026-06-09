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
