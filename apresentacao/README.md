# Apresentacao Final AutoSoccer

Esta pasta contem a apresentacao oficial usada na entrega final de **23/06/2026**
(disciplina Experiencia Criativa — BSI PUCPR 2026/1).

## Arquivos

| Arquivo | Descricao |
|---|---|
| `AutoSoccer_Apresentacao.pptx` | Apresentacao em PowerPoint (28 slides, 16:9, estilo arcade) |
| `build/gerar.js` | Script Node.js que regenera o `.pptx` do zero via `pptxgenjs` |
| `build/package.json` | Dependencias do gerador |

## Conteudo dos slides

O script de fala completo (bullets, notas do apresentador, visual sugerido e dono
de cada slide) esta em **[`../docs/SLIDES_CONTENT.md`](../docs/SLIDES_CONTENT.md)**.

## Como abrir

Abra `AutoSoccer_Apresentacao.pptx` no PowerPoint, Keynote ou Google Slides.

## Como regenerar do zero

> ⚠️ Atencao: regenerar **sobrescreve** o `.pptx`. So faca isso se voce alterou
> o `gerar.js` (mudou bullets, adicionou slide, etc).

```bash
cd apresentacao/build
npm install        # so na primeira vez
node gerar.js      # gera ../AutoSoccer_Apresentacao.pptx
```

Validacao rapida (deve imprimir 28):

```bash
unzip -l ../AutoSoccer_Apresentacao.pptx | grep -c "ppt/slides/slide"
```

## Estado dos slides

- ✅ 28 slides com identidade arcade (fundo `#111827`, accent `#F97316`)
- ✅ Conteudo real preenchido em todos os bullets (alinhado com codigo apos varredura 20/06/2026)
- ⚠️ **18 placeholders restantes** sao para screenshots/prints que precisam ser inseridos manualmente
  no PowerPoint — listados nas notas de cada slide com prefixo `[`

## Donos por slide

| Slides | Dono | Bloco |
|---|---|---|
| 1-4 | Grupo (Lucas S abre) | Capa + agenda + produto + problema |
| 5-11 | Lucas Stopinski da Silva | Front-end |
| 12-19 | Pedro Henrique Silva Guligurski | Back-end |
| 20-26 | Lucas Bruno e Silva | Infraestrutura |
| 27 | Lucas S dirige | Demo ao vivo (4 min) |
| 28 | Grupo | Metricas + licoes + Q&A |

## Ultima atualizacao

20/06/2026 — slides regenerados com conteudo real apos:
- Realinhamento Cloudways -> Railway
- Varredura cheat sheet vs codigo real (8 correcoes no back)
- Implementacao do dark mode completo (Fases 1-5)
- Sincronizacao de docs entre os 2 repos
