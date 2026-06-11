# Sprint Retrospective

Retrospectivas das 4 sprints do AutoSoccer no formato Start/Stop/Continue. Cada bloco lista 2 a 3 itens consensuais entre os três integrantes do grupo.

## Sprint 1 — Fundacao (01/03/2026 a 14/03/2026)

### Start

- Padronizar lockfile por repo: `package-lock.json` no front, `yarn.lock` no server, com nota explícita no README.
- Definir critérios de aceite mais granulares para stories de auth (nem todos os fluxos de erro estavam mapeados na DoR).
- Criar smoke checklist manual para o login antes de cada PR.

### Stop

- Subir alterações de scaffolding misturadas com features (`d5b098a` mostra "Refactor code structure" sem escopo claro).
- Commitar lockfiles atualizados sem nota explicativa (`a368f71` e similares geraram revisão lenta).

### Continue

- Usar Zod + React Hook Form como padrão de validação no front.
- Manter Conventional Commits em pt-BR sem acentos.
- Revisão assíncrona via PR mesmo nas stories pequenas — funcionou bem para troca de conhecimento.

---

## Sprint 2 — Mercado, motor e i18n (15/03/2026 a 28/03/2026)

### Start

- Quebrar épicos com mais de 13 SP em sub-stories antes do planning.
- Versionar regras de negócio (RN001-RN013) num arquivo único antes de implementar.
- Documentar contratos de API em paralelo com a implementação (e não depois).

### Stop

- Deixar a documentação Swagger para o final do épico — atrasou US-014 e US-015 em conjunto.
- Refatorar visual em commits separados sem testes manuais (`d141a28` "restaura visual original" indica retrabalho).

### Continue

- Strategy pattern no simulador: facilitou cobertura de disputas isoladas.
- Seeds reprodutíveis via script (`f76dbce`).
- Daily assíncrona via WhatsApp — 3 toques curtos por semana foram suficientes.

---

## Sprint 3 — Robustez, qualidade e deploy (29/03/2026 a 09/05/2026)

### Start

- Decidir contrato de erros e arquitetura de i18n no início da sprint (não no meio).
- Investir em testes de integração desde o começo do épico — refatorações ficaram mais seguras quando US-027 ficou pronta.
- Configurar staging do Render junto com a primeira rota nova, não no fim.

### Stop

- Reescrever mensagens hardcoded em duas passadas (uma pra i18n, outra pra ajustar testes) — geraria menos retrabalho se feito junto.
- Aceitar PRs sem cobertura de testes para serviços core (auth, partida).

### Continue

- ErrorHandler global + enum `ErrorCode`: padronizou o contrato de erro e simplificou o front.
- Janela de victory ratio para matchmaking (RN006) — provou-se justa nos smoke tests.
- Ranking dashboard com Recharts: bem recebido em revisão informal com a turma.

---

## Sprint 4 — Polimento, BDD, UML e entrega final (10/05/2026 a 09/06/2026)

### Start

- Abrir documento de apresentação no início da sprint, não no último commit (`84dee00`, `03cb73b` em 10/06).
- Ensaiar a defesa com tempo cronometrado pelo menos 3 vezes antes de 23/06.
- Documentar deploy Cloudways em parágrafo dedicado no README (não só o Render).

### Stop

- Empilhar artefatos de avaliação (BDD, UML, stories formais, papéis admin) no fim da sprint sem checkpoints intermediários.
- Mudar visual de componentes na mesma branch que mexe em testes — gera ruído no PR.

### Continue

- CI no GitHub Actions: blindou regressões nas semanas finais de polimento.
- next-intl com cookie de locale: experiência de troca de idioma fluida.
- Cobertura ampla de testes (~85 testes no front, ~152 no server) — permitiu refatorações finais com confiança.
- Dark mode token-driven: alterações futuras de paleta não exigem reescrita de componentes.

---

## Acoes globais para projetos futuros

Itens consolidados após as 4 retrospectivas, válidos para qualquer próximo trabalho do grupo:

1. **Contratos antes de implementação**: API, erros e i18n decididos em planning, não em refactor.
2. **Story slicing agressivo**: nada acima de 13 SP entra na sprint inteiro.
3. **Documentação contínua**: README, CONTRIBUTING, AGENTS atualizados na mesma PR da feature.
4. **CI no dia 1**: pipeline de lint/typecheck/tests/build deve existir antes da primeira feature.
5. **Apresentação como story**: documento de defesa entra como user story na primeira sprint, não na última.
