# Apresentacao Final AutoSoccer — 23/06/2026

Esqueleto da apresentacao com os **28 slides** definidos na Secao 5 do
`server/docs/PLANO_APRESENTACAO_FINAL.md` (tarefa T10). Cada slide ja tem o
layout arcade pronto e bullets placeholder (em *italico cinza, entre
[colchetes]*) dizendo exatamente o que cada integrante deve preencher.

> Esta pasta fica **fora** dos repos git — nao precisa commitar.

## Arquivos

| Arquivo | O que e |
|---|---|
| `AutoSoccer_Apresentacao.pptx` | A apresentacao (28 slides, 16:9) — editar direto no PowerPoint/Keynote/Google Slides |
| `build/gerar.js` | Script gerador (pptxgenjs) — fonte da verdade do esqueleto |
| `build/package.json` | Dependencias do gerador |

## Como regenerar do zero

**Atencao:** regenerar SOBRESCREVE o .pptx — so faca isso antes de comecar a
preencher, ou se todos concordarem em recomecar.

```bash
cd apresentacao/build
npm install        # so na primeira vez
node gerar.js      # gera ../AutoSoccer_Apresentacao.pptx
```

Validacao rapida (deve imprimir 28):

```bash
unzip -l ../AutoSoccer_Apresentacao.pptx | grep -c "ppt/slides/slide"
```

## Mapa slide -> dono -> o que preencher

| # | Slide | Dono | Tempo | O que preencher |
|---|---|---|---|---|
| 1 | Capa | grupo | 0:20 | Logo/sprite arcade (opcional) — resto ja pronto |
| 2 | Agenda | Lucas S | 0:20 | Ja pronto — ajustar se a ordem mudar |
| 3 | O que e o AutoSoccer | Lucas S | 0:40 | Frase de pitch + screenshot da tela principal |
| 4 | Problema e contexto | Pedro | 0:40 | Problema de ES + diagrama de contexto |
| 5 | **Separador FRONT-END** | Lucas S | — | Pronto |
| 6 | Stack front | Lucas S | 0:30 | Justificativa de escolha + print da arvore src/ |
| 7 | i18n next-intl | Lucas S | 0:40 | Print do LanguageSwitcher + trecho de codigo + nº de chaves |
| 8 | Layout da batalha | Lucas S | 0:50 | Screenshot/GIF da batalha + explicacao do tracker da bola |
| 9 | Dark mode + WCAG (NOVO) | Lucas S | 0:30 | Prints light/dark + score do Lighthouse |
| 10 | Dashboard ranking (NOVO) | Lucas S | 0:30 | Screenshot do dashboard + lib de graficos + endpoints |
| 11 | Testes front | Lucas S | 0:40 | Nº real de testes + print do coverage (~94%) |
| 12 | **Separador BACK-END** | Pedro | — | Pronto |
| 13 | Stack back | Pedro | 0:30 | Justificativa Fastify + diagrama de camadas |
| 14 | Padroes de projeto | Pedro | 0:50 | Trecho real do Strategy (max 10 linhas) |
| 15 | i18n no back | Pedro | 0:30 | Print de erro em pt-BR vs en + nº de chaves |
| 16 | Swagger 100% | Pedro | 0:40 | Screenshot do /docs + 1 schema centralizado |
| 17 | JWT 2 permissoes (NOVO) | Pedro | 0:30 | Diagrama do fluxo + print do 403 + rotas admin |
| 18 | Stored procedures (NOVO) | Pedro | 0:50 | Nomes das 3 procedures + trecho SQL + print de relatorio |
| 19 | Testes back | Pedro | 0:40 | Confirmar 152 testes / ~84% + print do coverage |
| 20 | **Separador INFRA** | Lucas B | — | Pronto |
| 21 | Git workflow | Lucas B | 0:40 | Print do git log + network graph + nº de commits |
| 22 | UML (NOVO) | Lucas B | 0:50 | Exports dos 3 diagramas (classes, sequencia, atividade) |
| 23 | BDD + User Stories (NOVO) | Lucas B | 0:40 | 1 feature Gherkin real + print do GitHub Projects |
| 24 | CI/CD GitHub Actions | Lucas B | 0:30 | Screenshot de run verde + tempo do pipeline |
| 25 | Sonar + UptimeRobot (NOVO) | Lucas B | 0:30 | Prints do SonarCloud e UptimeRobot + resposta do /health |
| 26 | Deploy Render | Lucas B | 0:40 | URLs publicas reais + print do painel Render |
| 27 | DEMO AO VIVO | Lucas S dirige | 4:00 | Checklist do roteiro ja pronto (espelha T14/ROTEIRO_DEMO.md) |
| 28 | Metricas + licoes + Q&A | grupo | 1:00 | Atualizar numeros na vespera + 1 licao por integrante |

Regras do plano: **max 6 bullets por slide, sem paragrafos**; cada slide tem o
dono e o tempo alvo no rodape esquerdo; o indicador da rubrica (RA/ID) aparece
no canto superior direito.

## Paleta de cores (identidade ARCADE do front)

| Uso | Hex |
|---|---|
| Fundo escuro | `#111827` |
| Accent laranja (faixas, titulos de secao, badges) | `#F97316` |
| Laranja escuro (sombras/bordas) | `#C2410C` |
| Titulos | `#F8FAFC` |
| Corpo de texto | `#E2E8F0` |
| Placeholders / rodape | `#94A3B8` |
| Cards escuros | `#1F2937` |
| Linhas discretas | `#374151` |

Fonte: **Arial** (segura em qualquer plataforma). Titulos bold 28-36pt com
letter-spacing; corpo 14-18pt. Slides separadores (5, 12, 20) tem fundo
laranja com titulo gigante escuro.

## Dicas para preencher

- Substitua cada bullet `[entre colchetes]` por conteudo real e troque o
  estilo de *italico cinza* para o texto claro normal (`#E2E8F0`).
- Screenshots: tema dark, alta resolucao, sem barra de favoritos do browser.
- Slide 28: atualizar commits/testes/cobertura com os numeros da vespera.
- Plano de contingencia (Secao 7 do plano): registrar o 2º dono de cada slide
  nas notas do apresentador.
