# Code/Spec Matrix — vscode-kanban

> Gerada pelo **Redator** (Reversa) em 2026-08-02
> Mapeia cada arquivo de código próprio às units de spec que o cobrem.
> Cobertura: 🟢 completa · 🟡 parcial · n/a sem unit correspondente

---

## 1. Código TypeScript (extensão)

| Arquivo do legado | Trecho | Unit correspondente | Cobertura |
|---|---|---|---|
| `src/extension.ts` | `:117-372` `activate` | `abertura-do-quadro` | 🟢 |
| `src/extension.ts` | `:122-194` logger | — | 🟡 transversal, descrito em `code-analysis.md` |
| `src/extension.ts` | `:221-267` comando | `abertura-do-quadro` | 🟢 |
| `src/extension.ts` | `:269-298` watcher | `abertura-do-quadro` | 🟢 |
| `src/extension.ts` | `:301-360` changelog | `anuncios-e-changelog` | 🟢 |
| `src/extension.ts` | `:363-367` anúncios | `anuncios-e-changelog` | 🟢 |
| `src/extension.ts` | `:389-395` `deactivate` | — | 🟡 sem unit; descrito em `code-analysis.md` |
| `src/extension.ts` | `:446-553` `open` | `renderizacao-markdown-e-diagramas` | 🟡 usado também por `integracao-toggl` |
| `src/extension.ts` | `:561-586` utilitários | — | 🟡 transversal |
| `src/workspaces.ts` | `:93-163` `Config` | `configuracao-do-workspace` | 🟢 |
| `src/workspaces.ts` | `:168-256` contrato de script | `scripts-de-evento-do-usuario` | 🟢 |
| `src/workspaces.ts` | `:310-314` constantes de arquivo | `persistencia-do-quadro` | 🟢 |
| `src/workspaces.ts` | `:345-362` acessores | `configuracao-do-workspace` | 🟢 |
| `src/workspaces.ts` | `:381-417` configuração | `configuracao-do-workspace` | 🟢 |
| `src/workspaces.ts` | `:422-588` `openBoard` | `abertura-do-quadro` | 🟢 |
| `src/workspaces.ts` | `:518-562` gravação e exportação | `persistencia-do-quadro`, `exportacao-markdown` | 🟢 |
| `src/workspaces.ts` | `:590-598` abertura na inicialização | `abertura-do-quadro` | 🟢 |
| `src/workspaces.ts` | `:600-886` `raiseEvent` | `scripts-de-evento-do-usuario` | 🟢 |
| `src/workspaces.ts` | `:717-757` despacho de tempo | `time-tracking` | 🟢 |
| `src/workspaces.ts` | `:892-950` tempo interno | `time-tracking` | 🟢 |
| `src/workspaces.ts` | `:952-956` cliente Git | `identificacao-de-usuario` | 🟢 |
| `src/workspaces.ts` | `:959-1122` exportação | `exportacao-markdown` | 🟢 |
| `src/workspaces.ts` | `:1124-1133` gravação | `persistencia-do-quadro` | 🟢 |
| `src/boards.ts` | `:32-166` modelo | `persistencia-do-quadro`, `gestao-de-cartoes` | 🟢 |
| `src/boards.ts` | `:171-380` tipos de evento | `scripts-de-evento-do-usuario` | 🟢 |
| `src/boards.ts` | `:388-401` constantes | `colunas-e-movimentacao` | 🟢 |
| `src/boards.ts` | `:422-447` `generateHTML` e nomes | `colunas-e-movimentacao` | 🟢 |
| `src/boards.ts` | `:449-919` HTML dos modais | `gestao-de-cartoes`, `vinculo-entre-cartoes`, `filtro-de-cartoes` | 🟢 |
| `src/boards.ts` | `:922-963` raízes de recurso | `abertura-do-quadro` | 🟢 |
| `src/boards.ts` | `:983-1034` `onLoaded` | `abertura-do-quadro`, `identificacao-de-usuario` | 🟢 |
| `src/boards.ts` | `:1077-1287` `open` e mensagens | `abertura-do-quadro` | 🟢 |
| `src/boards.ts` | `:1149-1197` URLs | `renderizacao-markdown-e-diagramas` | 🟢 |
| `src/boards.ts` | `:1315-1334` `raiseEvent` | `scripts-de-evento-do-usuario` | 🟢 |
| `src/boards.ts` | `:1336-1462` `reloadBoard` | `persistencia-do-quadro` | 🟢 |
| `src/boards.ts` | `:1477-1509` fábricas | `persistencia-do-quadro`, `abertura-do-quadro` | 🟢 |
| `src/html.ts` | integral | `abertura-do-quadro`, `renderizacao-markdown-e-diagramas` | 🟡 sem unit própria |
| `src/toggl.ts` | integral | `integracao-toggl` | 🟢 |
| `src/announcements.ts` | integral | `anuncios-e-changelog` | 🟢 |

---

## 2. Código JavaScript próprio (Webview)

| Arquivo do legado | Trecho | Unit correspondente | Cobertura |
|---|---|---|---|
| `src/res/js/board.js` | `:1-15` estado global | `persistencia-do-quadro` | 🟢 |
| `src/res/js/board.js` | `:17-33` deduplicação | `vinculo-entre-cartoes` | 🟢 |
| `src/res/js/board.js` | `:35-70` conteúdo do cartão | `renderizacao-markdown-e-diagramas` | 🟢 |
| `src/res/js/board.js` | `:71-257` edição | `gestao-de-cartoes` | 🟢 |
| `src/res/js/board.js` | `:258-312` busca de cartões | `vinculo-entre-cartoes` | 🟢 |
| `src/res/js/board.js` | `:313-339` iteração | — | 🟡 utilitário interno |
| `src/res/js/board.js` | `:340-438` extração de campos | `gestao-de-cartoes` | 🟢 |
| `src/res/js/board.js` | `:440-484` ordenação | `colunas-e-movimentacao` | 🟢 |
| `src/res/js/board.js` | `:486-508` nomes de coluna | `colunas-e-movimentacao` | 🟢 |
| `src/res/js/board.js` | `:510-529` demais cartões | `scripts-de-evento-do-usuario` | 🟢 |
| `src/res/js/board.js` | `:548-586` lista de usuários | `identificacao-de-usuario` | 🟡 |
| `src/res/js/board.js` | `:587-729` detalhes | `gestao-de-cartoes` | 🟢 |
| `src/res/js/board.js` | `:730-1211` renderização | `colunas-e-movimentacao`, `filtro-de-cartoes` | 🟢 |
| `src/res/js/board.js` | `:983-1019` execução e tempo | `scripts-de-evento-do-usuario`, `time-tracking` | 🟢 |
| `src/res/js/board.js` | `:1212-1240` recarga e gravação | `persistencia-do-quadro` | 🟢 |
| `src/res/js/board.js` | `:1241-1258` responsável | `identificacao-de-usuario` | 🟢 |
| `src/res/js/board.js` | `:1259-1383` vínculos | `vinculo-entre-cartoes` | 🟢 |
| `src/res/js/board.js` | `:1384-1447` ordenação e tempos relativos | `colunas-e-movimentacao` | 🟡 |
| `src/res/js/board.js` | `:1448-1583` rodapé e movimentação | `colunas-e-movimentacao` | 🟢 |
| `src/res/js/board.js` | `:1584-1700` colunas e limpeza | `colunas-e-movimentacao` | 🟢 |
| `src/res/js/board.js` | `:1834-1928` criação | `gestao-de-cartoes` | 🟢 |
| `src/res/js/board.js` | `:1930-2091` mensagens | `abertura-do-quadro` | 🟢 |
| `src/res/js/board.js` | `:2093-2161` inicialização | `gestao-de-cartoes`, `filtro-de-cartoes` | 🟢 |
| `src/res/js/script.js` | `:3-23` realce e diagramas | `renderizacao-markdown-e-diagramas` | 🟢 |
| `src/res/js/script.js` | `:24-57` datas e clonagem | — | 🟡 utilitário transversal |
| `src/res/js/script.js` | `:58-218` filtro | `filtro-de-cartoes` | 🟢 |
| `src/res/js/script.js` | `:220-296` URLs e Markdown | `renderizacao-markdown-e-diagramas` | 🟢 |
| `src/res/js/script.js` | `:297-443` utilitários | — | 🟡 transversal |
| `src/res/css/board.css` | integral | — | n/a estilo, sem unit |
| `src/res/css/style.css` | integral | — | n/a estilo, sem unit |

---

## 3. Arquivos sem unit correspondente

| Arquivo | Motivo | Encaminhamento |
|---|---|---|
| `src/test/index.ts` | Runner Mocha do scaffold | Substituir junto do toolchain |
| `src/test/extension.test.ts` | Asserções de exemplo, sem domínio | Substituir pelos testes propostos nas units |
| `publish.js` | Script de publicação | Coberto por `architecture.md` §9.3 |
| `tsconfig.json`, `tslint.json` | Configuração de *build* | Coberto por `dependencies.md` |
| `.github/workflows/publish.yml` | CI | Coberto por `architecture.md` §9.3 |
| `src/res/js/<vendor>/**` | 190 arquivos de bibliotecas de terceiros | Fora de escopo; risco registrado em `dependencies.md` |
| `src/res/css/<vendor>` | Estilos de terceiros | Idem |
| `img/**`, `icon.png` | Recursos de documentação e marca | n/a |

---

## 4. Cobertura consolidada

| Categoria | Arquivos | Cobertos por unit | Cobertura |
|---|---|---|---|
| TypeScript da extensão | 6 | 6 | **100%** 🟢 |
| JavaScript próprio do Webview | 2 | 2 | **100%** 🟢 |
| CSS próprio | 2 | 0 | 0% (n/a — estilo) |
| Testes | 2 | 0 | 0% (a substituir) |
| Vendorizados | ~200 | 0 | n/a (fora de escopo) |

**Cobertura do código próprio de comportamento: 8 de 8 arquivos, ou 100%** 🟢.
Em linhas: aproximadamente 6.700 das 6.933 linhas próprias estão mapeadas a alguma unit; o
resto são os dois arquivos CSS e a suíte de exemplo.

---

## 5. Units por arquivo de origem predominante

| Unit | Arquivo predominante | Linhas aproximadas |
|---|---|---|
| `abertura-do-quadro` | `boards.ts` + `extension.ts` | ~600 |
| `persistencia-do-quadro` | `boards.ts:1336-1462` + `workspaces.ts:1124-1133` | ~140 |
| `gestao-de-cartoes` | `board.js` + HTML de `boards.ts` | ~800 |
| `colunas-e-movimentacao` | `board.js:440-1700` | ~500 |
| `filtro-de-cartoes` | `script.js:58-218` + `board.js:770-928` | ~320 |
| `vinculo-entre-cartoes` | `board.js:1259-1383` | ~180 |
| `renderizacao-markdown-e-diagramas` | `script.js:227-296` | ~150 |
| `time-tracking` | `workspaces.ts:892-950` | ~110 |
| `integracao-toggl` | `toggl.ts` | 333 |
| `exportacao-markdown` | `workspaces.ts:959-1122` | ~165 |
| `scripts-de-evento-do-usuario` | `workspaces.ts:600-886` | ~290 |
| `configuracao-do-workspace` | `package.json` + `workspaces.ts:381-417` | ~180 |
| `identificacao-de-usuario` | `boards.ts:996-1034` | ~60 |
| `anuncios-e-changelog` | `announcements.ts` + `extension.ts:301-360` | ~160 |

---

## 6. Observação sobre a granularidade escolhida 🟡

A organização por **feature** foi a escolhida, e a matriz mostra por que ela descreve melhor
este sistema do que a divisão por módulo: cinco das quatorze units atravessam a fronteira entre
extensão e Webview, e nenhuma corresponde a um único arquivo. `gestao-de-cartoes`, por exemplo,
vive simultaneamente em `board.js` (comportamento), `boards.ts` (HTML dos modais) e
`workspaces.ts` (persistência). Uma organização por módulo teria fragmentado cada capacidade em
três specs desconexas.

O preço é que arquivos grandes aparecem em várias units — `board.js` figura em sete. Isso é
consequência da decisão ADR-008, não da granularidade: o arquivo **é** o sistema inteiro do lado
da interface.
