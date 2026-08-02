# Impacto no legado

> Identificador: `001-interface-react-tema-e-done`
> Data: `2026-08-03`
> Âncora: **legado** (`_reversa_sdd/architecture.md` + `_reversa_sdd/domain.md`)
> Rodada: 46 das 50 ações concluídas. Três permanecem parciais ou bloqueadas por dependerem de
> interação humana no Extension Development Host (`T001`, `T043`, `T050`); uma entregou a prosa e
> não as capturas de tela (`T048`).

A interface antiga deixou de existir. `board.js` (2.161 linhas) e `script.js` (520 linhas) não são
mais servidos, `boards.ts` perdeu 421 linhas de HTML literal, e jQuery, Bootstrap e Font Awesome
saíram do repositório. O que os substitui é um pacote React de 178 KB construído a partir de
`src/webview/`, com o domínio de exibição isolado, testado e coberto a 98%.

## 1. Arquivos afetados

### 1.1 Extensão (extension host)

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `package.json` | — (manifesto) | `regra-alterada` | MEDIUM | TypeScript 4.4.4 → 5.9.3, `@types/node` 16 → 20; entram React 18.3.1, `react-dom`, tipos, esbuild 0.25.12 e c8 10.1.3, todos pinados de forma exata |
| `package.json` | — (manifesto) | `regra-nova` | LOW | Scripts `build:webview`, `watch:webview`, `check:webview` e `test:coverage`, este último com portão de 60% de linhas |
| `tsconfig.json` | — (compilação) | `regra-alterada` | LOW | `src/webview` excluído da unidade da extensão. O `strict: false` do legado permanece intocado, de propósito (D-10) |
| `tsconfig.webview.json` | `webview-build` | `componente-novo` | LOW | Unidade própria com `strict: true` e mais cinco verificações. Ataca E7 sem abrir a frente de tipos do legado |
| `scripts/build-webview.js` | `webview-build` | `componente-novo` | LOW | Empacotamento por esbuild, alvo `chrome91` pela versão mínima de editor de `_reversa_sdd/inventory.md#1-identidade-do-projeto` |
| `scripts/capture-reference.js` | — (ferramenta) | `regra-alterada` | MEDIUM | Passou a ler o oráculo da 1.33.1 em `reference/legacy/`, não mais em `src/res/js/`. Continua reproduzindo o mesmo snapshot byte a byte |
| `src/html.ts` | `html` (`_reversa_sdd/code-analysis.md#módulo-4--html`) | `regra-alterada` | **CRITICAL** | Documento reduzido de 368 para 290 linhas, e o que sobrou é declaração, não markup. Saíram jQuery, Bootstrap, Font Awesome, `board.css`, `style.css`, `script.js`, `board.js`, o cabeçalho navbar e o bloco embutido. Todo `<script>` carrega `nonce` (achado C3 endereçado parcialmente) |
| `src/boards.ts` | `boards` (`_reversa_sdd/code-analysis.md#módulo-3--boards`) | `regra-alterada` | **CRITICAL** | 1.532 → 1.111 linhas. `getContent`, `getFooter` (modais) e `getHeaderButtons` foram removidos. Ganhou o manipulador de `saveViewPreferences` e o envio de `setViewPreferences` no `onLoaded` |
| `src/boards.ts` | `boards` | `regra-nova` | MEDIUM | `OpenBoardOptions` ganhou `loadViewPreferences` e `saveViewPreferences`, ambos **opcionais**, no mesmo idioma de `loadFilter` e `saveFilter` |
| `src/workspaces.ts` | `workspaces` | `regra-nova` | MEDIUM | Instancia o `ViewPreferenceStore` por pasta e liga os dois callbacks novos. Nenhuma das cinco responsabilidades existentes foi tocada |
| `src/view-preferences.ts` | `view-preferences` | `componente-novo` | **HIGH** | Preferência de exibição em mementos: tema em `globalState`, resto em `workspaceState` chaveado pelo `fsPath`. Nenhum arquivo criado no workspace (D-04, RF-10) |
| `src/res/js/board.js` | `board-ui` (`_reversa_sdd/code-analysis.md#módulo-7--board-ui`) | `componente-extinto` | **CRITICAL** | 2.161 linhas fora da extensão. Movido para `reference/legacy/`, onde segue como oráculo de paridade |
| `src/res/js/script.js` | `webview-utils` (`_reversa_sdd/code-analysis.md#módulo-8--webview-utils`) | `componente-extinto` | **CRITICAL** | 520 linhas fora da extensão. Mesmo destino |
| `src/res/js/jquery.min.js` | `board-ui` | `componente-extinto` | **HIGH** | Removido do repositório |
| `src/res/js/bootstrap.bundle.min.js` | `board-ui` | `componente-extinto` | **HIGH** | Removido do repositório |
| `src/res/css/bootstrap.min.css` | `board-ui` | `componente-extinto` | MEDIUM | Removido do repositório |
| `src/res/css/font-awesome.css` | `board-ui` | `componente-extinto` | MEDIUM | Removido do repositório. 1,5 MB a menos na carga do painel |
| `src/res/css/board.css` | `board-ui` | `componente-extinto` | MEDIUM | Removido; substituído por `src/webview/theme/board.css` |
| `src/res/css/style.css` | `board-ui` | `componente-extinto` | MEDIUM | Removido; substituído pelos tokens |
| `.gitignore` | — | `regra-alterada` | LOW | `coverage` e `.nyc_output` ignorados |
| `README.md` | — (documentação) | `regra-alterada` | LOW | Seção "The board" descrevendo os três controles; seção de CSS reapontada para os tokens |

### 1.2 Webview (pacote novo)

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/webview/domain/types.ts` | `webview-domain` | `componente-novo` | MEDIUM | Modelo espelhado campo a campo de `boards.ts:32-123`, mais `ViewState` e `BoardSettings` |
| `src/webview/domain/text.ts` | `webview-domain` | `componente-novo` | MEDIUM | Porte de `vsckb_to_string`, `vsckb_is_nil`, `vsckb_normalize_str`, `vsckb_get_sort_val` |
| `src/webview/domain/card-taxonomy.ts` | `webview-domain` | `componente-novo` | MEDIUM | Pesos de tipo e prioridade de `board.js:440-462`, vocabulário divergente preservado |
| `src/webview/domain/sorting.ts` | `webview-domain` | `componente-novo` | **HIGH** | `vsckb_get_cards_sorted` agora puro, com `sortBoardForPersistence` reproduzindo de propósito o efeito da mutação (D-07, achado E3) |
| `src/webview/domain/filtering.ts` | `webview-domain` | `componente-novo` | **HIGH** | Ambiente por cartão de `board.js:766-960`. Falha permissiva e retorno bruto preservados |
| `src/webview/domain/filter-functions.ts` | `webview-domain` | `componente-novo` | **HIGH** | As dezenove funções da linguagem de filtro de `script.js:58-216`, com as excentricidades intactas |
| `src/webview/domain/view-state.ts` | `webview-domain` | `regra-nova` | MEDIUM | Tema tri-estado, colapso de coluna, modo de visualização e o delta de preferências |
| `src/webview/domain/visibility.ts` | `webview-domain` | `regra-nova` | MEDIUM | Fonte única do conjunto exibido, para os dois modos (D-14) |
| `src/webview/domain/columns.ts` | `webview-domain` | `componente-novo` | MEDIUM | Nome de exibição e movimentos permitidos por coluna, antes espalhados em quatro ramos de `board.js:1518` |
| `src/webview/domain/board-operations.ts` | `webview-domain` | `componente-novo` | **HIGH** | Adicionar, atualizar, remover, mover e limpar, todos puros. Substituem a mutação de `allCards` (ADR-008) |
| `src/webview/domain/identity.ts` | `webview-domain` | `componente-novo` | **HIGH** | `__uid` com a fórmula de `board.js:2013` e `others` com o formato de `vsckb_get_other_cards` |
| `src/webview/domain/card-id.ts` | `webview-domain` | `componente-novo` | MEDIUM | Regra de `simpleIDs` portada de `board.js:1841-1853`, com o máximo por prefixo numérico |
| `src/webview/domain/task-progress.ts` | `webview-domain` | `regra-alterada` | MEDIUM | Contagem da lista de tarefas passou a ler a **fonte** Markdown, não o HTML renderizado |
| `src/webview/domain/ports.ts` | `webview-domain` | `componente-novo` | LOW | Interfaces que o domínio pede ao mundo (tempo, Markdown, log) |
| `src/webview/adapters/*.ts` | `webview-adapters` | `componente-novo` | **HIGH** | Sete adaptadores: Filtrex, Showdown, Mermaid, highlight.js, CodeMirror, Moment e a barreira de sanitização. Nenhum componente nomeia biblioteca (D-08) |
| `src/webview/bridge/*.ts` | `webview-bridge` | `componente-novo` | **CRITICAL** | Ponte tipada com os catorze comandos congelados mais dois novos, e o construtor do payload de `saveBoard` |
| `src/webview/theme/*` | `webview-theme` | `componente-novo` | **HIGH** | Paleta própria em dois conjuntos e o provedor que resolve preferência contra a classe do editor |
| `src/webview/ui/*` | `webview-ui` | `componente-novo` | **CRITICAL** | Barra, cartão, coluna, dois modos de visualização, cinco diálogos e os ícones SVG |
| `src/test/webview.ts` | Suíte | `regra-alterada` | **CRITICAL** | Fachada reapontada para os módulos novos. Assinatura e nomes `vsckb_*` preservados; **nenhuma asserção alterada** (D-13, RF-02) |
| `src/test/legacy-parity.unit.test.ts` | Suíte | `componente-novo` | **HIGH** | Compara ordenação, ordem gravada, pesos e filtro contra o snapshot da 1.33.1 |
| `src/test/view-preferences.unit.test.ts` | Suíte | `componente-novo` | **HIGH** | Trinta alternâncias, zero gravações do quadro, zero eventos (RF-25) |
| `src/test/board-domain.unit.test.ts` | Suíte | `componente-novo` | MEDIUM | Operações de quadro, identidade, colunas, identificador, progresso e payload |
| `src/test/card-environment.unit.test.ts` | Suíte | `componente-novo` | MEDIUM | O ambiente que um cartão oferece ao filtro |

## 2. Diff conceitual por componente

### `board-ui` e `webview-utils` — extintos

Os dois módulos que a extração descreve em `code-analysis.md#módulo-7` e `#módulo-8` deixaram de
existir como código executado. O que era um objeto `allCards` global, mutado por funções que também
desenhavam, virou um domínio puro em `src/webview/domain/` e uma camada de componentes que só lê
dele. As regras não mudaram; o dono do estado, sim.

A mudança mais delicada é a que **não** aconteceu. `vsckb_get_cards_sorted` ordenava a coluna no
lugar, de modo que a ordem exibida virava a ordem gravada (achado E3). Deixar de mutar teria
reescrito o arquivo de todo usuário na primeira gravação. A ordenação virou pura e o efeito passou
a ser aplicado de propósito por `toSavePayload`, na única hora em que o quadro é persistido. A
suíte de paridade compara os dois resultados contra o snapshot da 1.33.1, coluna por coluna.

### `boards` — de gerador de HTML a mediador

`generateHTML()` produzia quatro colunas, três modais e uma barra de botões por concatenação de
texto. Produz agora um ponto de montagem e, quando o workspace tem um, o link para o
`vscode-kanban.css` dele. As 421 linhas que saíram estão em `src/webview/ui/`, tipadas e testáveis.

O protocolo não se moveu. Os catorze comandos continuam com o mesmo nome e o mesmo payload; os dois
novos entraram como callbacks **opcionais** de `OpenBoardOptions`, no idioma que `loadFilter` e
`saveFilter` já usavam. Um quadro que nunca receba `setViewPreferences` abre nos padrões.

### `html` — documento mínimo com `nonce`

Saíram doze recursos. Ficaram as seis bibliotecas que os adaptadores ainda usam, cada uma com
`nonce`, mais o pacote e a sua folha de estilo. O bloco embutido que declarava `acquireVsCodeApi`,
`vsckb_log` e `window.onerror` foi para dentro do pacote.

A política de segurança de conteúdo **continua não declarada**, e isso é decisão, não esquecimento:
`filtrex.js:57` compila com `new Function` e o Mermaid avalia dinamicamente, de modo que uma
política honesta hoje nasceria com `'unsafe-eval'`. O `nonce` está lá para que declará-la, depois de
trocar o avaliador de filtro, seja uma linha (D-16).

### `view-preferences` — categoria de estado que o sistema não tinha

Nada disso existia. O tema vive em `globalState`, que é escopo de instalação; a ocultação, o colapso
e o modo vivem em `workspaceState` chaveado pelo `fsPath` da pasta, porque `workspaceState` pertence
à janela e não à pasta. Nenhum arquivo é criado no workspace: um `.vscode/vscode-kanban.view`
viajaria no Git e imporia a preferência de quem o commitou.

### Barreira de sanitização — mais estrita, nunca menos

`vsckb_from_markdown` removia `<script>` e mais nada: um atributo `onerror` ou um `<iframe>` passavam
inteiros. A barreira nova remove a mesma família — os elementos que executam ou buscam, os atributos
`on*` e os esquemas de URL fora de uma lista curta. É estritamente mais restritiva, como RF-28 exige.
O cartão [6] do quadro do projeto **não** está resolvido: falta a política de segurança de conteúdo,
que é a outra metade do problema.

## 3. Achados novos desta rodada

Coisas que a extração não registrava e que apareceram ao portar o código.

| Achado | Onde | O que é |
|---|---|---|
| O limite de 255 caracteres é da **descrição**, não do título | `boards.ts:746`, `board.js:113` | O roadmap (G-18) diz "título". O código diz descrição, e **só no diálogo de edição**: o de adicionar nunca teve limite. Uma descrição longa criada pelo diálogo de adicionar é silenciosamente cortada na primeira edição. Defeito preservado, porque corrigi-lo mudaria o arquivo gravado (RF-26) |
| `descriptionOverflow` é código morto | `board.js:113-115` | `substr(255)` **depois** do corte para 255 devolve sempre string vazia. A variável nunca carrega nada |
| `setCardTag` e `moveCardTo` endereçam por `uid`, não por `card` | `board.js:1941`, `:2029` | O contrato em `interfaces/webview-bridge.md` §2.2 diz `{ card: __uid }`. O código lê `data.uid`. A ponte nova seguiu o código |
| `others` é um quadro parcial, não uma lista | `board.js:510-529` | Coluna sem outro cartão fica **ausente** do objeto. A implementação nova reproduz isso; o contrato descrevia `BoardCard[]` |
| Realce de sintaxe não era idempotente | `script.js:3-7` | Re-renderizar aninhava a marcação do highlight.js dentro dela mesma. O adaptador novo marca o bloco já processado |

## 4. Regras preservadas

Regras 🟢 de `_reversa_sdd/domain.md` que esta feature não alterou, verificadas por teste
automatizado onde indicado.

| Regra | Verificação |
|---|---|
| RD-01, RD-02 — quatro colunas fixas | `COLUMN_KEYS` congelado; colapso e modo lista são exibição |
| RD-14 a RD-17 — três critérios de ordenação | `legacy-parity.unit.test.ts`, contra o snapshot da 1.33.1 |
| RD-20 a RD-23 — filtro só afeta exibição; expressão inválida mostra tudo | `card-filter.unit.test.ts` (asserções originais) e `legacy-parity` |
| RD-42 a RD-48 — os sete eventos e seus payloads | `board-domain.unit.test.ts` para `others`; sequência completa pendente de `T043` |
| Formato do arquivo do quadro | `save-board.ts` monta o payload do quadro, nunca da tela; `board-domain.unit.test.ts` |
| Identidade `__uid` efêmera | `identity.ts`, fórmula e forma testadas |
| Vocabulário divergente de tipo (G-17) | `card-environment.unit.test.ts`: `issue` conta como bug no filtro e não recebe a cor de bug |

## 5. Regras modificadas

| Regra | O que mudou | Watch item |
|---|---|---|
| RD-18 — grupos de cor do tipo | Os três grupos sobrevivem; os **tons** passaram a ser calibrados por tema, e agora diferem em luminância além do matiz | W003, W012 |
| Ordenação como efeito colateral (achado E3) | Deixou de ser mutação e passou a ser aplicação deliberada na gravação. O resultado observável é idêntico | W001, W013 |
| Contagem da lista de tarefas | Passou a ler a fonte Markdown em vez do HTML renderizado. Mesmos números, sem precisar de documento | W014 |
| Barreira de sanitização | Ampliada: elementos que executam ou buscam, atributos `on*` e esquemas de URL fora da lista | W009, W015 |
| Limite de 255 na descrição | Preservado, agora **nomeado** no código em vez de escondido num atributo HTML | W016 |

## 6. Fontes

- `_reversa_forward/001-interface-react-tema-e-done/actions.md`
- `_reversa_forward/001-interface-react-tema-e-done/progress.jsonl`
- `_reversa_forward/001-interface-react-tema-e-done/reference/domain-snapshot.json`
- `_reversa_sdd/architecture.md`, `domain.md`, `code-analysis.md`, `erd-complete.md`
