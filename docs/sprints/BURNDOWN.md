# Burndown — Sprint 4

Sprint final do AutoSoccer (10/05/2026 a 09/06/2026), planejada em 81 story points. O burndown é amostrado em intervalos de aproximadamente 3 a 4 dias úteis, totalizando 9 medições.

## Parametros

| Item                         | Valor      |
| ---------------------------- | ---------- |
| Início                       | 10/05/2026 |
| Fim                          | 09/06/2026 |
| Duração total                | 31 dias    |
| SP planejados                | 81         |
| Número de medições           | 9          |
| Decaimento ideal por medição | ~10 SP     |

## Tabela

| #   | Dia        | SP restantes (real) | SP ideais (linha ideal) | Observação                                                                                               |
| --- | ---------- | ------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | 10/05/2026 | 81                  | 81                      | Kickoff da sprint, planning encerrado.                                                                   |
| 2   | 13/05/2026 | 78                  | 71                      | Início da renomeação de paths para inglês (US-036).                                                      |
| 3   | 17/05/2026 | 72                  | 61                      | Infra de testes do front (US-042) pronta; ritmo abaixo do ideal por curva de aprendizado em Vitest.      |
| 4   | 21/05/2026 | 60                  | 50                      | Migração next-intl (US-038, US-039, US-040) concluída; recuperando ritmo.                                |
| 5   | 24/05/2026 | 50                  | 41                      | Cobertura de services, hooks e providers do front (US-044) entregue.                                     |
| 6   | 28/05/2026 | 38                  | 30                      | CI verde (US-046); CORS hardening (US-045) entregue; bom ritmo.                                          |
| 7   | 02/06/2026 | 26                  | 21                      | Dark mode (US-049), dashboard ranking final (US-050) e CONTRIBUTING/READMEs (US-047, US-048).            |
| 8   | 06/06/2026 | 14                  | 10                      | BDD, user stories formais e UML mergeados (US-051, US-052, US-053).                                      |
| 9   | 09/06/2026 | 0                   | 0                       | Role admin (US-054, US-055), stored procedure (US-056) e plano de apresentação (US-058) fecham a sprint. |

## Grafico ASCII

```
SP
restantes
  81 |*
  72 | \\
  63 |  \\.       . = real
  54 |   \\..    \ = ideal
  45 |    \\..
  36 |     \\..
  27 |      \\..
  18 |       \\..
   9 |        \\..
   0 |         \\.._______________________________
      |_________________________________________
       10  13  17  21  24  28  02  06  09
       ----------- maio -----------  -- junho --
```

Legenda:

- `*` marca o ponto de partida (81 SP, dia 10/05).
- A linha `\` representa o decaimento ideal (~10 SP por medição).
- A curva real fica ligeiramente acima da ideal até a medição 4 (21/05), por causa da curva de aprendizado em Vitest e next-intl, e converge a partir da medição 6 (28/05) quando o time empilha entregas curtas de polimento.

## Analise

| Janela        | Análise                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10/05 → 17/05 | Atraso leve (3 a 11 SP acima do ideal). Causa: setup de testes do front (Vitest, RTL, mocks, providers) consumiu mais tempo do que o esperado.                                                          |
| 17/05 → 28/05 | Aceleração constante. Migração next-intl entregue de forma vertical, sem retrabalho relevante.                                                                                                          |
| 28/05 → 09/06 | Sprint fecha exatamente no zero. Os 14 SP finais correspondem a artefatos de avaliação (BDD, UML, stories formais, admin/role, stored procedure, plano de apresentação) mergeados nos commits de 10/06. |

## Pontos de atencao

1. A curva real ficou acima da ideal nas primeiras duas medições — risco baixo a médio na época, mitigado por sprint longa (31 dias).
2. A queda mais acentuada entre 06/06 e 09/06 reflete commits empilhados no fim (`bad4fd9`, `76b5541`, `83bbfab`, `e4c50c1`, `b9b2250`, `7ef2986`, `7063da9`, `7756cbf`, `6bb5681`). Em sprints futuras, distribuir esses entregáveis ao longo da segunda metade do período.
3. Burndown sugere capacidade real de ~20 SP por semana para o time de 3 integrantes na configuração atual.
