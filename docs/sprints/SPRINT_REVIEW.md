# Sprint Review

Documento formal de revisão das 4 sprints do projeto AutoSoccer. Cada review consolida velocidade real, demonstração realizada e lições aprendidas.

## Sumario executivo

| Sprint | SP planejados | SP entregues | Velocidade (%) | Aderência ao escopo |
| --- | --- | --- | --- | --- |
| Sprint 1 | 33 | 33 | 100% | Total |
| Sprint 2 | 46 | 46 | 100% | Total, com refino visual extra do mercado |
| Sprint 3 | 119 | 119 | 100% | Total, sprint estendida em 1 semana absorveu Páscoa e G1 |
| Sprint 4 | 81 | 81 | 100% | Total, com BDD/UML/UML/role admin entregues |

Velocidade média do time: **279 SP em ~14 semanas (~20 SP/semana)**.

---

## Sprint 1 — Fundacao (01/03/2026 a 14/03/2026)

### Velocidade real

- Planejado: 33 SP
- Entregue: 33 SP
- Velocidade: 100%

### Demonstração realizada

1. Login e cadastro funcionais com validação client-side (Zod + RHF).
2. Cadastro chamando `POST /auth/register` e devolvendo token JWT.
3. Endpoint `GET /auth/me` retornando o usuário logado a partir do token.
4. Página home alternando entre CTA de cadastro e CTA "jogar" conforme estado de autenticação.
5. Estrutura de pastas do front (`app/`, `services/`, `context/`, `lib/`) e do server (`src/routes`, `src/services`, `src/middleware`).

### Lições aprendidas

| Categoria | Item |
| --- | --- |
| Acerto | Adoção de Zod + React Hook Form desde o dia 1 evitou retrabalho de validação. |
| Erro | Scaffold inicial sem definir lockfile padrão gerou conflito posterior entre `yarn.lock` e `package-lock.json`. |
| Ajuste pra próxima | Padronizar npm no front e yarn no server antes da Sprint 2 começar a empilhar deps. |

---

## Sprint 2 — Mercado, motor e i18n (15/03/2026 a 28/03/2026)

### Velocidade real

- Planejado: 46 SP
- Entregue: 46 SP
- Velocidade: 100%

### Demonstração realizada

1. Mercado de atletas devolvendo janela rotativa por usuário, com `cost` exposto na resposta.
2. Compra de atleta executando em transação atômica (commit + desconto de coins + insert em equipe).
3. Seeds populando MySQL com 20 atletas curados e usuários de teste.
4. Motor de simulação rodando 12 turnos com RNG controlado, respeitando RN001 a RN013.
5. Swagger UI publicado em `/docs` com todos os endpoints já implementados.
6. Tela inicial do mercado no front com drag-and-drop dos atletas para os slots do campo.

### Lições aprendidas

| Categoria | Item |
| --- | --- |
| Acerto | Strategy pattern no simulador permitiu testar disputas isoladamente. |
| Erro | Subestimamos o tamanho de US-013 (motor de simulação) — consumiu 50% do tempo da sprint. |
| Ajuste pra próxima | Quebrar épicos grandes (>13 SP) em stories menores antes do planning. |

---

## Sprint 3 — Robustez, qualidade e deploy (29/03/2026 a 09/05/2026)

### Velocidade real

- Planejado: 119 SP
- Entregue: 119 SP
- Velocidade: 100%
- Observação: sprint estendida para 6 semanas por conta do feriado de Páscoa e da avaliação G1 da disciplina; ritmo médio caiu por semana mas o total foi cumprido.

### Demonstração realizada

1. Matchmaking funcional: `POST /partida/jogar-rodada` casa oponentes pela janela de victory ratio (RN006).
2. Snapshot de equipe persistido por rodada para reuso assíncrono pelos bots.
3. Items aplicados com stacking de bônus e validação de saldo (RF010).
4. Login de convidado começando com 2500 coins prontos para montar time.
5. ErrorHandler global devolvendo payload padronizado `{ code, message, details }`.
6. Cobertura de testes acima de 80% no server (auth, equipe, mercado, itens, rodada, integração).
7. Backend internacionalizado: chaves i18n carregadas via `Accept-Language` e descrições do Swagger reusando o mesmo dicionário.
8. Render staging respondendo a smoke test manual.
9. Dashboard de ranking no front com Recharts e filtros.
10. Layout de batalha horizontal com bola animada acompanhando as jogadas.

### Lições aprendidas

| Categoria | Item |
| --- | --- |
| Acerto | ErrorHandler global + enum `ErrorCode` reduziu try/catch redundante e padronizou respostas. |
| Erro | i18n entrou tarde na sprint, gerando refactor amplo de mensagens hardcoded e exigindo retrabalho de testes (`7442fd6` ajusta integration tests pós-i18n). |
| Ajuste pra próxima | Decidir contrato de erros e i18n antes de qualquer implementação de novas rotas. |

---

## Sprint 4 — Polimento, BDD, UML e entrega final (10/05/2026 a 09/06/2026)

### Velocidade real

- Planejado: 81 SP
- Entregue: 81 SP
- Velocidade: 100%

### Demonstração realizada

1. Rotas e tags Swagger renomeadas para inglês (`/auth`, `/team`, `/market`, `/battle`) e testes atualizados.
2. Front migrado para `next-intl` com cookie de locale e LanguageSwitcher acessível no ProfileCorner.
3. Suite de testes do front com Vitest + RTL: 85 testes verdes cobrindo services, hooks, providers, context, components e lib.
4. CI no GitHub Actions rodando lint, typecheck, tests e build nos dois repos.
5. CONTRIBUTING.md, README.md e AGENTS.md atualizados.
6. Dark mode aplicado via paleta de tokens em `globals.css`.
7. Dashboard de ranking final com gráficos Recharts (vitórias, gols, troféus) e filtros por papel.
8. 3 features BDD em Gherkin (auth, mercado, batalha) e 3 user stories formais com critérios de aceite.
9. Diagramas UML (classes, sequência, atividade) em Mermaid linkados no README do server.
10. Papéis de usuário: coluna `role` em users, propagação no JWT, middleware `requireRole` e rota `GET /admin/users`.
11. Stored procedure `sp_get_top_athletes_by_role` para relatórios analíticos.
12. CORS rejeitando wildcard em produção.
13. Deploy de homologação no Render configurado via `render.yaml` (descontinuado); deploy produtivo definido no **Railway** com plugin MySQL nativo, ativo em `https://autosoccer-api-production.up.railway.app`.

### Lições aprendidas

| Categoria | Item |
| --- | --- |
| Acerto | Reservar a Sprint 4 inteira para artefatos de avaliação (BDD, UML, papéis) blindou nota sem comprometer features. |
| Erro | Plano de ação da apresentação ficou para o último commit (`03cb73b`, `84dee00` em 10/06); deveríamos ter aberto a estrutura antes. |
| Ajuste pra próxima | Em qualquer projeto futuro com defesa presencial, abrir documento de apresentação no início da sprint final. |

---

## Conclusao geral

- Time entregou 100% do planejado em todas as 4 sprints.
- Velocidade estável em torno de 20 SP/semana ajuda a planejar entregas futuras.
- Maior risco superado: integração contínua entre 3 owners em repos separados, mediada pela branch `integration/grupo-1`.
- Próximo passo após a defesa: abrir backlog de pós-entrega (acessibilidade WCAG AAA, multiplayer real-time, modo torneio).
