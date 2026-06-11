# Diagrama de Sequencia - Login JWT

Fluxo do endpoint `POST /auth/login` (rota em
`src/modules/auth/auth.routes.ts`, servico em `src/modules/auth/auth.service.ts`).
Cobre o caminho feliz e o caminho de credenciais invalidas. A funcao
`loginUser` aceita email ou nickname como `identifier`, compara o hash via
`bcrypt.compare` e gera o token com `jwt.sign` usando o segredo de
`env.jwtSecret`.

```mermaid
sequenceDiagram
    actor Jogador
    participant Front as Frontend
    participant API as Fastify (auth.routes)
    participant Svc as auth.service.loginUser
    participant DB as MySQL (users)
    participant Bcrypt as bcryptjs
    participant Jwt as jsonwebtoken

    Jogador->>Front: preenche identifier + senha
    Front->>API: POST /auth/login {identifier, password}
    API->>API: valida body (schema Fastify)
    API->>Svc: loginUser({identifier, password})
    Svc->>DB: User.findOne(email OR nickname)
    DB-->>Svc: User | null

    alt usuario nao encontrado
        Svc-->>API: ServiceError INVALID_CREDENTIALS
        API-->>Front: 401 {message}
        Front-->>Jogador: exibe erro traduzido
    else usuario encontrado
        Svc->>Bcrypt: compare(password, hashed_password)
        Bcrypt-->>Svc: boolean

        alt senha invalida
            Svc-->>API: ServiceError INVALID_CREDENTIALS
            API-->>Front: 401 {message}
            Front-->>Jogador: exibe erro traduzido
        else senha valida
            Svc->>Jwt: sign({id, nickname}, jwtSecret, {expiresIn})
            Jwt-->>Svc: token
            Svc->>Svc: sanitizeUser(user)
            Svc-->>API: {token, user}
            API-->>Front: 200 {token, user}
            Front->>Front: persiste token em localStorage
            Front-->>Jogador: redireciona para tela principal
        end
    end
```

## Notas

- O schema do body (`identifier`, `password`) e validado pelo Fastify antes
  de chegar ao service.
- `identifier` aceita email (case-insensitive via `toLowerCase()`) ou
  nickname (case-sensitive); a query usa `Op.or`.
- `sanitizeUser` remove `hashed_password` e demais campos sensiveis do
  payload de resposta.
- Erros usam `ServiceError` com chave i18n
  (`auth.login.invalidCredentials`); o `errorHandler` global traduz pela
  preferencia do `Accept-Language`.
- O JWT carrega apenas `{ id, nickname }` e expira segundo `env.jwtExpiresIn`
  (default `5d` em producao).
