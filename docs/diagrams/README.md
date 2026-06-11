# Diagramas UML - AutoSoccer

Documentacao visual do server feita em Mermaid. Os arquivos `.md` renderizam
direto no GitHub (qualquer bloco ```` ```mermaid ```` e renderizado pela
visualizacao padrao do GitHub), entao basta navegar para abrir.

## Indice

| Arquivo | Tipo | Cobertura |
|---|---|---|
| [`classes.md`](classes.md) | Diagrama de Classes | Modelo de dominio: `User`, `Team`, `Athlete`, `Ability`, `TeamAthlete`, `Item`, `UserItem`, `TeamSnapshot`, `MarketWindow`, `RoundLog` com atributos e cardinalidades. |
| [`seq-login.md`](seq-login.md) | Diagrama de Sequencia | Fluxo `POST /auth/login`: validacao -> `loginUser` -> bcrypt -> JWT -> persistencia do token no frontend. |
| [`seq-jogar-rodada.md`](seq-jogar-rodada.md) | Diagrama de Sequencia | Fluxo `POST /match/play-round`: snapshot -> matchmaking RN006 -> iniciativa RN009 -> motor de 12 turnos -> `finalizeRound` transacional (RN001/RN002, RF004/RF005, RF010). |
| [`atividade-campanha.md`](atividade-campanha.md) | Diagrama de Atividade (flowchart) | Jornada completa do jogador do login ate o fim da campanha, passando por mercado, escalacao, itens e rodadas. |

## Cobertura da rubrica (criterio 27)

| Requisito | Atende com |
|---|---|
| 1 diagrama de classes | `classes.md` |
| 2 diagramas de sequencia | `seq-login.md` e `seq-jogar-rodada.md` |
| 1 diagrama de atividade | `atividade-campanha.md` |

## Convencoes

- Sintaxe: Mermaid (`classDiagram`, `sequenceDiagram`, `flowchart`).
- Nomes de funcoes, services e rotas espelham o codigo real
  (`src/modules/<modulo>/<modulo>.service.ts`).
- Regras de negocio referenciadas seguem a numeracao do
  [`PLANO_DE_ACAO.md`](../PLANO_DE_ACAO.md) (RN001-RN011, RF001-RF010).

## Como visualizar

- **GitHub**: abrir qualquer `.md` deste diretorio renderiza Mermaid
  automaticamente.
- **VS Code**: extensao `bierner.markdown-mermaid` exibe os diagramas no
  preview nativo do Markdown.
- **Exportar para imagem**: `npx -p @mermaid-js/mermaid-cli mmdc -i
  <arquivo>.md -o <arquivo>.svg`.
