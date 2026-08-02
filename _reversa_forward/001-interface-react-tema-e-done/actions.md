# Actions: Nova interface do quadro — tema alternável e ocultação de concluídos

> Identificador: `001-interface-react-tema-e-done`
> Data: `2026-08-02`
> Roadmap: `_reversa_forward/001-interface-react-tema-e-done/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 50 |
| Paralelizáveis (`[//]`) | 26 |
| Maior cadeia de dependência | 13 |

**Cadeia crítica:** `T002 → T003 → T005 → T006 → T018 → T026 → T027 → T028 → T031 → T035 → T036 → T043 → T050`.

**Ordem que não é negociável:** `T001` precisa rodar **antes de qualquer alteração de interface**.
Ela captura a referência de comportamento da versão atual, e sem essa referência os critérios de
aceite de RF-02, RF-03 e RF-05 não têm com o que ser comparados depois. É dependência de tempo,
não de esforço.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Capturar a referência de comportamento da versão 1.33.1: executar o roteiro de doze passos de `onboarding.md` §4 com o script de log de eventos de §7, e guardar `events.log` e `board-after.json` na pasta `reference/` da feature | - | `[//]` | `_reversa_forward/001-interface-react-tema-e-done/reference/` | 🟢 | `[ ]` |
| T002 | Subir TypeScript para 5.x e alinhar `@types/node`, mantendo `strict: false` no `tsconfig.json` da extensão; confirmar que build, lint e os 58 testes seguem verdes sem tocar código de produção | - | `[//]` | `package.json` | 🟢 | `[X]` |
| T003 | Acrescentar `react`, `react-dom`, `@types/react`, `@types/react-dom` e `esbuild` como dependências pinadas de forma exata, atualizando o `package-lock.json` | T002 | - | `package.json` | 🟢 | `[X]` |
| T004 | Criar `tsconfig.webview.json` com `strict: true`, `jsx: react-jsx`, `lib` incluindo DOM e `rootDir` em `src/webview` (D-10) | T002 | `[//]` | `tsconfig.webview.json` | 🟢 | `[X]` |
| T005 | Criar o script de empacotamento esbuild que gera `out/res/js/board.js` a partir de `src/webview/main.tsx`, e ligá-lo ao `npm run build` sem quebrar a cópia dos demais recursos | T003, T004 | - | `scripts/build-webview.js` | 🟢 | `[X]` |
| T006 | Criar a estrutura de pastas `src/webview/{domain,adapters,bridge,ui,theme}` e um `main.tsx` de andaime que monta um componente vazio no ponto de montagem | T005 | - | `src/webview/main.tsx` | 🟢 | `[X]` |
| T007 | Ajustar `html.ts` para servir o pacote empacotado com atributo `nonce`, mantendo `board.js` ainda carregado, de modo que o quadro antigo continue funcionando (D-16) | T006 | - | `src/html.ts` | 🟢 | `[X]` |
| T008 | Declarar os tipos do domínio de exibição: `Board`, `BoardCard`, `ColumnKey`, `ThemePreference`, `ViewMode` e `ViewState`, conforme `data-delta.md` §4 | T004 | `[//]` | `src/webview/domain/types.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- O projeto já pratica caracterização desde o commit 6d99e58. Estes testes nascem antes do núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Escrever os testes de `computeVisibleBoard`: conjunção entre filtro e ocultação (RF-17), colapso de coluna qualquer (RF-19), restauração na mesma ordem (RF-16) e paridade entre o conjunto do modo colunas e o do modo lista (RF-21) | T008 | `[//]` | `src/test/board-visibility.unit.test.ts` | 🟢 | `[X]` |
| T010 | Escrever os testes de resolução de tema: ciclo de três estados retornando ao inicial (RF-07), "seguir o editor" acompanhando a classe do documento (RF-08), escolha explícita prevalecendo (RF-09) e padrão na ausência de preferência (RF-11) | T008 | `[//]` | `src/test/theme-resolution.unit.test.ts` | 🟡 | `[X]` |
| T011 | Escrever os testes do `ViewState`: valores padrão de `data-delta.md` §4 e invariante de que `hideDone` verdadeiro implica `done` entre as colunas colapsadas (RN-10) | T008 | `[//]` | `src/test/view-state.unit.test.ts` | 🟢 | `[X]` |
| T012 | Reapontar `loadWebview()` para os módulos novos, preservando a assinatura `call(nome, ...args)`, `set` e `eval`, e mantendo os nomes `vsckb_*` como fachada de teste, **sem alterar nenhuma asserção** de `card-sorting.unit.test.ts` nem de `card-filter.unit.test.ts` (D-13, RF-02) | T014, T015 | - | `src/test/webview.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T013 | Portar a taxonomia de cartão: peso de tipo (`emergency` −2, `bug` −1, demais 0) e grupo de cor, preservando a insensibilidade a caixa e a espaços em volta que os testes travaram | T008 | `[//]` | `src/webview/domain/card-taxonomy.ts` | 🟢 | `[X]` |
| T014 | Portar a ordenação como função **pura** — prioridade decrescente, tipo, título normalizado — sem mutar o quadro recebido, preservando o cálculo de prioridade por prefixo numérico (`'5xyz'` vale 5) | T013 | - | `src/webview/domain/sorting.ts` | 🟢 | `[X]` |
| T015 | Portar o filtro para `domain/filtering.ts` com o ambiente por cartão, e isolar o Filtrex em `adapters/filter-language.ts`, preservando o retorno bruto do avaliador e a falha permissiva que mostra todos os cartões diante de expressão inválida | T008 | `[//]` | `src/webview/domain/filtering.ts` | 🟢 | `[X]` |
| T016 | Implementar `computeVisibleBoard(board, viewState)` como única fonte do conjunto exibido, compondo ordenação, filtro, ocultação e colapso (D-14, RN-06) | T014, T015, T017 | - | `src/webview/domain/visibility.ts` | 🟢 | `[X]` |
| T017 | Implementar o `ViewState`: valores padrão, ciclo tri-estado do tema e a derivação que mantém `hideDone` e a coluna `done` colapsada coerentes entre si | T008 | `[//]` | `src/webview/domain/view-state.ts` | 🟢 | `[X]` |
| T018 | Adaptador de Markdown sobre Showdown, preservando a barreira de sanitização atual ou tornando-a mais estrita, nunca menos (RF-28) | T006 | `[//]` | `src/webview/adapters/markdown.ts` | 🟢 | `[X]` |
| T019 | Adaptador de diagramas sobre Mermaid, aplicado apenas aos elementos marcados, com o tema do diagrama derivado do tema do quadro | T006 | `[//]` | `src/webview/adapters/diagrams.ts` | 🟡 | `[X]` |
| T020 | Adaptador de realce de sintaxe sobre highlight.js | T006 | `[//]` | `src/webview/adapters/highlight.ts` | 🟢 | `[X]` |
| T021 | Adaptador de editor de código sobre CodeMirror, com o modo Markdown e o auto-refresh que os diálogos usam hoje | T006 | `[//]` | `src/webview/adapters/code-editor.ts` | 🟡 | `[X]` |
| T022 | Adaptador de data e hora sobre Moment, cobrindo o tempo relativo do cartão e a formatação de duração | T006 | `[//]` | `src/webview/adapters/datetime.ts` | 🟢 | `[X]` |
| T023 | Implementar a ponte tipada: os catorze comandos existentes com nome e formato idênticos, mais `saveViewPreferences` e `setViewPreferences`, conforme `interfaces/webview-bridge.md` | T008 | `[//]` | `src/webview/bridge/vscode-bridge.ts` | 🟢 | `[X]` |
| T024 | Definir os tokens de tema: uma custom property por papel semântico, com os dois conjuntos completos, claro e escuro (D-03) | T006 | `[//]` | `src/webview/theme/tokens.css` | 🟢 | `[X]` |
| T025 | Implementar o provedor de tema: resolve preferência contra a classe `vscode-light` / `vscode-dark` / `vscode-high-contrast` do documento, observada por `MutationObserver`, sem recarregar o painel (RF-08) | T017, T024 | - | `src/webview/theme/theme-provider.tsx` | 🟡 | `[X]` |
| T026 | Implementar o componente de cartão, com as cores dos três grupos vindas dos tokens, a descrição renderizada pelo adaptador de Markdown e as ações de editar, mover, excluir, detalhes e rastrear tempo | T013, T018, T024 | - | `src/webview/ui/Card.tsx` | 🟢 | `[X]` |
| T027 | Implementar a coluna e a sua forma colapsada, esta reduzida a uma faixa com o nome de exibição configurado e a contagem de cartões ocultos (RF-14, RN-13) | T026, T016 | - | `src/webview/ui/Column.tsx` | 🟢 | `[X]` |
| T028 | Implementar o modo colunas, com redistribuição do espaço horizontal entre as colunas não colapsadas (RF-13) e usabilidade a partir de 600 px de largura | T027 | - | `src/webview/ui/ColumnsView.tsx` | 🟢 | `[X]` |
| T029 | Implementar o modo lista: sequência vertical única, cada cartão indicando a coluna a que pertence, com as mesmas ações do modo colunas (RF-20, RF-22) e usabilidade a partir de 320 px | T026, T016 | - | `src/webview/ui/ListView.tsx` | 🟢 | `[X]` |
| T030 | Implementar a barra superior com os três controles — tema tri-estado, ocultação de concluídos e modo de visualização —, todos alcançáveis por navegação de foco e acionáveis por teclado (RF-06, RF-12) | T025, T017 | - | `src/webview/ui/TopBar.tsx` | 🟢 | `[X]` |
| T031 | Compor o `App`: recepção de `setBoard`, `setTitleAndFilePath`, `setCurrentUser`, `webviewIsVisible` e `setViewPreferences` sem assumir ordem, geração do `__uid` com a fórmula preservada, e primeira pintura otimista a partir de `vscode.getState()` (D-06) | T023, T028, T029, T030 | - | `src/webview/ui/App.tsx` | 🟡 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T032 | Criar o serviço de preferências no extension host: tema em `globalState`, ocultação, colapso e modo em `workspaceState` chaveado pelo `fsPath` da pasta, com padrões e valores desconhecidos ignorados com registro em log (D-04) | T002 | `[//]` | `src/view-preferences.ts` | 🟢 | `[X]` |
| T033 | Registrar em `boards.ts` o manipulador de `saveViewPreferences` e o envio de `setViewPreferences` em resposta a `onLoaded`, sem alterar nome nem formato dos catorze comandos existentes (RF-04) | T032, T023 | - | `src/boards.ts` | 🟢 | `[X]` |
| T034 | Remover de `boards.ts` as cerca de 470 linhas de HTML literal: `getContent` passa a devolver apenas o ponto de montagem e `getFooter` deixa de emitir os modais | T031 | - | `src/boards.ts` | 🟢 | `[X]` |
| T035 | Implementar o diálogo base e o formulário de cartão compartilhado — título, tipo, prioridade, categoria, responsável, descrição e detalhes —, com o editor de código atrás do adaptador e o limite de 255 caracteres do título preservado (G-18) | T031, T021 | - | `src/webview/ui/dialogs/CardForm.tsx` | 🟢 | `[X]` |
| T036 | Implementar o diálogo de adicionar cartão, gravando os mesmos campos que a versão anterior | T035 | `[//]` | `src/webview/ui/dialogs/AddCardDialog.tsx` | 🟢 | `[X]` |
| T037 | Implementar o diálogo de editar cartão, gravando os mesmos campos que a versão anterior | T035 | `[//]` | `src/webview/ui/dialogs/EditCardDialog.tsx` | 🟢 | `[X]` |
| T038 | Implementar o diálogo de detalhes do cartão, com Markdown, diagramas e realce pelos respectivos adaptadores | T035 | `[//]` | `src/webview/ui/dialogs/CardDetailsDialog.tsx` | 🟢 | `[X]` |
| T039 | Aplicar a ordenação ao payload de `saveBoard` de propósito, reproduzindo o efeito observável do `Array.sort` in place (D-07), e garantir que a ocultação e o colapso jamais alcancem o payload (RF-15) | T014, T031 | - | `src/webview/bridge/save-board.ts` | 🟢 | `[X]` |
| T040 | Escrever o teste de integração que exercita dez alternâncias de tema, dez de ocultação e dez de modo de visualização, verificando zero gravações do quadro e zero eventos ao script (RF-25) | T033, T039 | - | `src/test/view-preferences.test.ts` | 🟢 | `[X]` |
| T041 | Enxugar `html.ts`: remover os CSS e scripts vendorizados que o pacote absorveu, mover o bloco embutido de `acquireVsCodeApi`, `vsckb_log` e `window.onerror` para dentro do pacote, e manter apenas o documento mínimo com `nonce` | T031, T019, T020, T021, T022 | - | `src/html.ts` | 🟢 | `[X]` |
| T042 | Remover `board.js` e `script.js` do documento e do processo de construção, junto do CSS que os acompanhava | T041, T034 | - | `src/res/js/board.js` | 🟢 | `[X]` |
| T043 | Executar o roteiro de doze passos na versão nova e comparar a sequência de eventos e os campos recebidos pelo script com a referência capturada em T001, incluindo `others` e `__uid` (RF-05, `interfaces/event-script-api.md` §4) | T039, T042, T036, T037, T038 | - | `_reversa_forward/001-interface-react-tema-e-done/reference/` | 🟢 | `[ ]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T044 | Registrar toda falha de renderização pela ponte `log` com mensagem nomeada, sem nenhum bloco de captura vazio no código novo | T031 | `[//]` | `src/webview/bridge/vscode-bridge.ts` | 🟢 | `[X]` |
| T045 | Calibrar os tons dos três grupos de tipo nos dois temas até que fiquem distinguíveis entre si e do fundo, com contraste de texto igual ou superior a 4,5:1 (RN-11, RF-24) | T026, T024 | `[//]` | `src/webview/theme/tokens.css` | 🟢 | `[X]` |
| T046 | Garantir nome acessível não vazio em cada botão da barra superior e em cada ação de cartão, anúncio do estado dos controles de dois e três estados, e foco visível em todo elemento interativo (RF-27) | T030, T027 | `[//]` | `src/webview/ui/TopBar.tsx` | 🟡 | `[X]` |
| T047 | Remover do repositório e do processo de construção `jquery.min.js`, `bootstrap.bundle.min.js`, `bootstrap.min.css`, `font-awesome.css`, `board.css` e `style.css`, substituindo os ícones por SVG embutidos | T042 | `[//]` | `src/res/` | 🟢 | `[X]` |
| T048 | Atualizar o `README.md` com a interface nova, os três controles e as capturas de tela correspondentes | T042 | `[//]` | `README.md` | 🟢 | `[ ]` |
| T049 | Medir a cobertura de `src/webview/domain/` e completar os testes até atingir no mínimo 60% | T009, T010, T011, T012 | - | `src/test/` | 🟢 | `[X]` |
| T050 | Executar o roteiro completo de `onboarding.md` e confirmar os critérios de pronto: JSON idêntico ao de T001 no roteiro de doze passos, abertura de quadro da versão 1.33.1 sem alteração espúria (RF-26) e nenhum arquivo de `src/webview/` acima de 400 linhas | T043, T045, T047 | - | `_reversa_forward/001-interface-react-tema-e-done/reference/` | 🟢 | `[ ]` |

## Notas de execução

### Rodada de 2026-08-02

- **T001 ficou parcial.** A captura automatizável foi feita (`reference/domain-snapshot.json`,
  gerado por `scripts/capture-reference.js`): ordenação, pesos de ordenação, avaliação do filtro
  e conversão de Markdown da versão 1.33.1. Falta a sequência de eventos do roteiro de doze
  passos, que exige interação humana no Extension Development Host e por isso não cabe num turno
  de agente. A ação como escrita não era atômica.
- **A sanitização do Markdown não é capturável sem DOM.** `vsckb_from_markdown` (`script.js:227`)
  converte com Showdown e depois remove `<script>` por jQuery. O snapshot registra a conversão;
  a barreira em si fica para a verificação de `onboarding.md` §8.
- **O pacote saiu em `out/res/webview/main.js`, não em `out/res/js/board.js`.** O caminho previsto
  no `actions.md` colidiria com o `board.js` legado, que precisa continuar servido até T042.
- **T016 foi entregue antes de T015.** `computeVisibleBoard` recebe o predicado de filtro por
  parâmetro, o que a desacopla do Filtrex: a dependência declarada era mais forte do que a real.
  T015 continua pendente e não bloqueia o que foi entregue.
- **T010 vive dentro de `view-state.unit.test.ts`.** A parte pura da resolução de tema é testável
  ali; a observação da classe do documento depende do DOM e fica com T025.

### Rodada de 2026-08-03

- **32 ações executadas.** Restam abertas `T001`, `T043`, `T048` e `T050`, todas por dependerem de
  algo que um agente não consegue fazer sozinho: interação humana no Extension Development Host, ou
  capturas de tela.
- **`T043` ficou parcial, mas ganhou o que era automatizável.** A suíte `legacy-parity.unit.test.ts`
  compara, contra o snapshot da 1.33.1, a ordem exibida, a ordem que seria gravada, os pesos de
  ordenação e os doze casos de filtro — valor **e** tipo bruto. Falta a sequência de eventos do
  roteiro de doze passos.
- **`T048` entregou a prosa, não as imagens.** A seção "The board" do README descreve os três
  controles e onde cada preferência é guardada; as capturas de tela exigem o editor rodando.
- **`T040` mudou de nome de arquivo.** Ficou `view-preferences.unit.test.ts` em vez de
  `view-preferences.test.ts`: nada nele precisa de editor, então pertence à suíte rápida.
- **`board.js` e `script.js` não foram apagados, foram movidos.** `T042` pedia removê-los do
  documento e do processo de construção, e é o que foi feito; apagá-los inutilizaria
  `scripts/capture-reference.js`, que é o oráculo de `T043` e `T050`. Vivem agora em
  `reference/legacy/`, fora da extensão. Podem ser apagados quando as duas ações fecharem.
- **O limite de 255 caracteres é da descrição, não do título.** O roadmap (G-18) diz título; o
  código diz descrição, e só no diálogo de edição. Preservado como está, e registrado no
  `legacy-impact.md` como achado.
- **`T045` mudou o grupo de cor padrão.** Os três grupos tinham luminância quase igual no tema
  claro, o que os deixava indistinguíveis para quem não vê o matiz. O grupo padrão voltou a ser
  fundo claro com texto escuro, como no legado (`bg-info` + `text-dark`), o que separa os três em
  luminância além do matiz.
- **Cobertura de domínio em 98,16%**, contra o mínimo de 60% que `T049` pedia. 137 testes,
  `npm run test:coverage` com portão.

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-02 | Versão inicial gerada por `/reversa-to-do`: 50 ações em cinco fases, 26 paralelizáveis, cadeia crítica de 13 | reversa |
