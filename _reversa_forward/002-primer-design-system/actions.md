# Actions: Quadro sobre sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Roadmap: `_reversa_forward/002-primer-design-system/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 69 |
| Paralelizáveis (`[//]`) | 30 |
| Maior cadeia de dependência | 18 |

**Cadeia crítica:** `T001 → T008 → T009 → T015 → T016 → T017 → T019 → T020 → T022 → T023 → T024 →
T038 → T040 → T041 → T044 → T045 → T049 → T050`.

**A numeração não é contígua por fase.** `T001` a `T056` saíram da decomposição inicial; `T057` a
`T069` foram acrescentadas depois de `/reversa-audit`, cada uma na fase a que pertence, sem
renumerar as demais. IDs não se reciclam.

**Ordem que não é negociável:** `T001` roda **antes de qualquer outra ação**. A referência da versão
1.33.1 só é obtenível sobre base não modificada (RF-27), e por isso nenhuma ação, nem as de
paralelismo declarado, começa antes dela.

**Regra de execução do bloco de migração de componentes (`T020` a `T034`):** o passo 5 do plano de
migração exige a suíte verde entre um componente e o próximo. As marcas `[//]` desse bloco valem para
ações que tocam arquivos distintos **e** partem do mesmo pré-requisito; não autorizam pular a
verificação entre lotes.

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Capturar a referência de comportamento da versão 1.33.1 (RF-27): por `git checkout` da etiqueta ou instalação da versão publicada em perfil limpo, executar o roteiro de doze passos de `onboarding.md` §3 com o registrador de eventos ativo e guardar `events.log` e `board-after.json` em `reference/`. A parte automatizável já existe em `reference/domain-snapshot.json`; o que falta é a sequência de eventos, que exige interação humana no Extension Development Host | - | - | `_reversa_forward/001-interface-react-tema-e-done/reference/` | 🟢 | `[ ]` |
| T002 | Elevar `engines.vscode` de `^1.62.0` para `^1.78.0` (D-18, RN-05, RF-21) | T001 | `[//]` | `package.json` | 🟢 | `[X]` |
| T003 | Elevar `BROWSER_TARGET` de `chrome91` para `chrome108` (D-18, RF-21) | T001 | `[//]` | `scripts/build-webview.js` | 🟢 | `[X]` |
| T004 | Acrescentar `@primer/react` 38.34.0, `@primer/primitives` 11.10.0 e `@primer/octicons-react` 19.32.0 com versão **exata**, sem acento circunflexo, e versionar o `package-lock.json` resultante (D-17, RNF de segurança) | T002 | - | `package.json` | 🟢 | `[X]` |
| T005 | Ajustar o empacotador para resolver as folhas de estilo importadas de módulo dos pacotes novos, sem quebrar o carregador de `.css` já existente (`investigation.md` §7) | T003, T004 | - | `scripts/build-webview.js` | 🟡 | `[X]` |
| T006 | Criar o ponto único de mapeamento entre estado de preferência de tema e conjunto nomeado do sistema, importando apenas os conjuntos oferecidos ao usuário (D-19, RF-08, RNF de manutenibilidade) | T004 | - | `src/webview/theme/primer-themes.ts` | 🟢 | `[X]` |
| T007 | Criar o gerador da folha de compatibilidade, que lê o mapa de `interfaces/legacy-class-map.md` e emite CSS, com cabeçalho de arquivo gerado e recusa de nome ausente do mapa (D-22, RF-28) | T001 | `[//]` | `scripts/generate-legacy-compat.js` | 🟡 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Alterar a asserção do ciclo do controle de tema para o número de estados oferecidos, em vez de três fixos (RF-07, `data-delta.md` §3.1). **Esta é a única asserção da suíte que pode ser alterada** | T001 | - | `src/test/view-state.unit.test.ts` | 🟢 | `[X]` |
| T009 | Acrescentar teste da resolução de `'high-contrast'` e da conversão de entrada de valor gravado desconhecido, que precisa continuar caindo em `'follow-editor'` (`data-delta.md` §3.2 e §4, RF-09) | T008 | - | `src/test/view-state.unit.test.ts` | 🟢 | `[X]` |
| T010 | Criar teste que reprova qualquer arquivo sob `src/webview/` acima de quatrocentas linhas (RF-23) | T001 | `[//]` | `src/test/source-limits.unit.test.ts` | 🟢 | `[X]` |
| T011 | Criar teste que reprova valor visual literal — cor, raio de borda, sombra, tamanho de fonte — em `src/webview/ui/` e em `theme/board.css` (RF-01, RF-24, RN-07) | T001 | `[//]` | `src/test/visual-literals.unit.test.ts` | 🟡 | `[X]` |
| T012 | Criar teste que reprova importação do sistema de design em `domain/`, `adapters/` e `bridge/` (RNF de manutenibilidade, `roadmap.md` §2) | T001 | `[//]` | `src/test/layer-boundaries.unit.test.ts` | 🟢 | `[X]` |
| T013 | Criar teste do gerador da folha de compatibilidade: cada um dos trinta e nove nomes mapeados produz regra, nenhuma entrada da lista de não mapeados aparece na saída, e todo destino é âncora declarada em `style-anchors.md` (RF-28, `interfaces/legacy-class-map.md` §3 e §4) | T007 | `[//]` | `src/test/legacy-compat.unit.test.ts` | 🟡 | `[X]` |
| T014 | Criar teste do mapa de tema: os quatro estados de preferência resolvem para conjuntos nomeados distintos do sistema, e nenhum conjunto fora dos oferecidos é importado (RF-08, RNF de desempenho do pacote) | T006 | `[//]` | `src/test/primer-themes.unit.test.ts` | 🟢 | `[X]` |
| T059 | Criar teste que reprova arquivo de fonte no pacote construído, garantindo que a tipografia resolve pela pilha do sistema operacional (RF-26) | T005 | `[//]` | `src/test/no-font-assets.unit.test.ts` | 🟢 | `[X]` |
| T065 | Criar teste que compara o conjunto de elementos e atributos permitidos pela sanitização com o vigente, reprovando qualquer crescimento (RF-17) | T001 | `[//]` | `src/test/sanitizer-surface.unit.test.ts` | 🟡 | `[X]` |
| T068 | Criar teste dos estados vazios: quadro sem nenhum cartão exibe as quatro colunas com contagem zero, e cartão sem título e sem descrição permanece renderizado e selecionável (cenários de `requirements.md` §7) | T001 | `[//]` | `src/test/empty-states.unit.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T015 | Acrescentar `'high-contrast'` ao tipo `ThemePreference` (`data-delta.md` §3) | T009 | - | `src/webview/domain/types.ts` | 🟢 | `[X]` |
| T016 | Acrescentar `'high-contrast'` a `THEME_CYCLE` e o caso correspondente à resolução de tema, preservando a regra de `'follow-editor'`, que nunca deduz alto contraste do editor (`data-delta.md` §3.1 e §3.2, RF-08, RF-09) | T015 | - | `src/webview/domain/view-state.ts` | 🟢 | `[X]` |
| T017 | Reapontar o provedor de tema: escrever na raiz os atributos que a biblioteca lê, no lugar de `data-vsckb-theme`, consumindo o mapa de T006 e deixando de importar `tokens.css`. O `ViewState` continua sendo a única fonte da preferência (D-19, D-20) | T006, T016 | - | `src/webview/theme/theme-provider.tsx` | 🟢 | `[X]` |
| T018 | Excluir `theme/tokens.css`, extinto pela troca de origem dos conjuntos de cor (D-19) | T017 | - | `src/webview/theme/tokens.css` | 🟢 | `[X]` |
| T019 | Envolver a árvore de componentes no provedor do sistema de design, na raiz do Webview, sem introduzir fonte de preferência concorrente ao `ViewState` (D-20) | T017 | - | `src/webview/main.tsx` | 🟢 | `[X]` |
| T020 | Migrar a barra superior para os controles do sistema: botões, seletores e rótulos de contagem, com nome acessível e estado expostos (RF-01, RF-13, RF-14) | T019 | `[//]` | `src/webview/ui/TopBar.tsx` | 🟢 | `[X]` |
| T021 | Substituir os ícones desenhados à mão pelos do conjunto adotado, importados **individualmente** para que o empacotador descarte o restante (D-25, RF-25) | T019 | `[//]` | `src/webview/ui/icons.tsx` | 🟢 | `[X]` |
| T022 | Migrar as ações do cartão para os controles do sistema, preservando o cartão como composição do projeto e sem valor visual literal (RF-01, RF-24, RN-07) | T020, T021 | - | `src/webview/ui/Card.tsx` | 🟢 | `[X]` |
| T023 | Acrescentar ao cartão o rótulo textual do tipo, com o componente de rótulo do sistema, de modo que a distinção sobreviva à escala de cinza (D-24, RN-03, RF-10) | T022 | - | `src/webview/ui/Card.tsx` | 🟡 | `[X]` |
| T024 | Acrescentar ao cartão o menu de ação com as colunas de destino, caminho de teclado equivalente ao arrastar, com o mesmo resultado gravado (D-27, RF-15) | T023 | - | `src/webview/ui/Card.tsx` | 🟡 | `[X]` |
| T025 | Migrar a coluna para os controles do sistema no cabeçalho, na contagem e no botão de limpar, preservando a coluna como composição do projeto (RF-01, RF-24, RN-07) | T022 | - | `src/webview/ui/Column.tsx` | 🟢 | `[X]` |
| T026 | Migrar o diálogo base para o do sistema, com devolução de foco ao controle que o abriu, fechamento por escape e ausência de armadilha de foco (RF-13, RF-14) | T020 | - | `src/webview/ui/dialogs/Dialog.tsx` | 🟢 | `[X]` |
| T027 | Migrar o diálogo de confirmação, usado na exclusão de cartão e na limpeza da coluna Done (RF-01) | T026 | `[//]` | `src/webview/ui/dialogs/ConfirmDialog.tsx` | 🟢 | `[X]` |
| T028 | Migrar o formulário de cartão para os campos e seletores do sistema, preservando o limite de duzentos e cinquenta e cinco caracteres da descrição registrado na feature `001` (RF-01, RF-02) | T026 | `[//]` | `src/webview/ui/dialogs/CardForm.tsx` | 🟢 | `[X]` |
| T029 | Migrar o diálogo de acréscimo de cartão para a casca do diálogo do sistema (RF-01) | T028 | `[//]` | `src/webview/ui/dialogs/AddCardDialog.tsx` | 🟢 | `[X]` |
| T030 | Migrar o diálogo de edição de cartão para a casca do diálogo do sistema (RF-01) | T028 | `[//]` | `src/webview/ui/dialogs/EditCardDialog.tsx` | 🟢 | `[X]` |
| T031 | Migrar o diálogo de detalhes do cartão, preservando a renderização de Markdown, diagrama e bloco de código (RF-01, RF-16) | T026 | `[//]` | `src/webview/ui/dialogs/CardDetailsDialog.tsx` | 🟢 | `[X]` |
| T032 | Migrar o campo de Markdown, encaixando o editor de texto vendorizado dentro do controle de campo do sistema sem alterar o adaptador (RF-01, RF-16) | T028 | - | `src/webview/ui/dialogs/MarkdownField.tsx` | 🟡 | `[X]` |
| T033 | Migrar o contêiner do modo de colunas e instrumentar nele a âncora `[data-vsckb="columns"]` (RF-01, RF-11, RF-20) | T025 | `[//]` | `src/webview/ui/ColumnsView.tsx` | 🟢 | `[X]` |
| T034 | Migrar o contêiner do modo de lista e instrumentar nele a âncora `[data-vsckb="list"]`, mantendo a paridade de cartões e ações com o modo de colunas (RF-01, RF-11, RF-20) | T025 | `[//]` | `src/webview/ui/ListView.tsx` | 🟢 | `[X]` |
| T035 | Fazer o realce de sintaxe derivar do modo de cor ativo, no lugar da folha de tema escuro fixa, sem alterar o adaptador de realce (D-26, RF-16). Corrige o defeito descrito em `investigation.md` §6 | T031 | - | `src/webview/ui/Markdown.tsx` | 🟡 | `[X]` |
| T036 | Instrumentar na raiz do quadro as âncoras `[data-vsckb="board"]`, `[data-vsckb="board-header"]` e `[data-vsckb-view]` (`interfaces/style-anchors.md` §3 e §4, RF-11) | T020 | `[//]` | `src/webview/ui/App.tsx` | 🟢 | `[X]` |
| T037 | Instrumentar na coluna as âncoras permanentes `column`, `column-header`, `column-body`, `[data-vsckb-column]`, `[data-vsckb-collapsed]` e `[data-vsckb-drop-target]`, mais as de compatibilidade `action-add` e `action-clear` (`interfaces/style-anchors.md` §3, §4 e §5.1, RF-11, RF-28) | T025 | `[//]` | `src/webview/ui/Column.tsx` | 🟢 | `[X]` |
| T038 | Instrumentar no cartão as âncoras permanentes `card`, `card-title`, `card-body`, `card-footer`, `card-actions`, `[data-vsckb-card-type]` e `[data-vsckb-dragging]`, mais as de compatibilidade `action-edit`, `card-category`, `card-progress`, `card-progress-bar`, `card-reference` e `card-references` (`interfaces/style-anchors.md` §3, §4, §5.1 e §5.3, RF-11, RF-28) | T024 | `[//]` | `src/webview/ui/Card.tsx` | 🟢 | `[X]` |
| T039 | Instrumentar nos diálogos a âncora permanente `[data-vsckb="dialog"]` e as de compatibilidade `[data-vsckb-dialog]` nos cinco valores — `add-card`, `edit-card`, `card-details`, `delete-card`, `clear-done` —, `dialog-confirm` e `dialog-cancel` (`interfaces/style-anchors.md` §3 e §5.2, RF-11, RF-28) | T026 | `[//]` | `src/webview/ui/dialogs/Dialog.tsx` | 🟢 | `[X]` |
| T057 | Instrumentar na barra superior as âncoras de compatibilidade `action-save`, `action-reload` e `action-filter` (`interfaces/style-anchors.md` §5.1, RF-28). O filtro é campo da barra, não diálogo: é esta âncora que responde pelo controle na folha antiga | T020 | - | `src/webview/ui/TopBar.tsx` | 🟢 | `[X]` |
| T040 | Encolher a folha do quadro à geometria — faixa de coluna, pilha de cartões, área de arrastar e colapso — sem nenhuma declaração de cor, raio, sombra ou tamanho de fonte, saindo das seiscentas e oitenta e seis linhas atuais (D-21, RF-24, RN-07) | T032, T033, T034, T035, T036, T037, T038, T039 | - | `src/webview/theme/board.css` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T041 | Executar o gerador e versionar a folha de compatibilidade produzida, com o cabeçalho que proíbe edição à mão (D-22, RF-28) | T013, T040 | `[//]` | `src/webview/theme/legacy-compat.css` | 🟢 | `[X]` |
| T042 | Declarar a política de segurança de conteúdo no documento do Webview, com origem própria para estilo e fonte e execução de script restrita ao valor de uso único já emitido pela feature `001` (D-28, RF-19, cartão `[7]` do quadro) | T019 | - | `src/html.ts` | 🟡 | `[X]` |
| T043 | Servir o conjunto claro e o escuro de realce de sintaxe, no lugar da folha escura fixa, para que T035 possa escolher entre eles (D-26, RF-16) | T042, T035 | - | `src/html.ts` | 🟡 | `[X]` |
| T044 | Servir a folha de compatibilidade na ordem de cascata declarada: pacote da interface, compatibilidade, folha do usuário (`interfaces/style-anchors.md` §8, RF-28) | T041, T043 | - | `src/html.ts` | 🟢 | `[X]` |
| T045 | Garantir que a folha do usuário permanece a **última** injetada, depois da folha de compatibilidade (`interfaces/style-anchors.md` §8, RF-11) | T044 | - | `src/boards.ts` | 🟢 | `[X]` |
| T046 | Produzir mensagem nomeada e visível quando o pacote da interface faltar ou não carregar, no lugar do painel em branco, à semelhança do `MissingVendorError` já existente (RNF de observabilidade, `roadmap.md` §2) | T044 | - | `src/html.ts` | 🟡 | `[X]` |
| T047 | Declarar o número de versão das seis bibliotecas vendorizadas sobreviventes — Filtrex, Showdown, Mermaid, highlight.js, CodeMirror e Moment — apurando cada uma no arquivo distribuído (D-29, RF-22, dívida D7 de `_reversa_sdd/architecture.md#9.2`) | T001 | `[//]` | `src/res/VENDORED.md` | 🟡 | `[X]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens de erro, documentação curta e verificação dos critérios de pronto. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T048 | Registrar no changelog a alteração incompatível da superfície de estilo, a elevação do piso do editor e a correção do realce de sintaxe em tema claro (RF-12, `investigation.md` §6) | T045 | `[//]` | `CHANGELOG.md` | 🟢 | `[X]` |
| T049 | Acrescentar ao leia-me a seção de migração, com o mapa entre a superfície antiga e a nova, a lista de âncoras estáveis e o alcance da camada de compatibilidade (RF-11, RF-12) | T045 | - | `README.md` | 🟢 | `[X]` |
| T050 | Acrescentar ao leia-me as capturas de tela da interface definitiva, feitas uma única vez (RF-12, absorve `T048` da feature `001`) | T049 | - | `README.md` | 🟢 | `[ ]` |
| T051 | Medir o pacote construído e registrar os números obtidos nas notas de execução, contra a linha de base de 182.918 bytes de código e 11.314 de folha e o teto de 900 KB e 400 KB (`onboarding.md` §10, RNF de desempenho) | T045 | - | `_reversa_forward/002-primer-design-system/actions.md` | 🟢 | `[X]` |
| T052 | Executar a prova pelo avesso: com a folha do sistema desabilitada, confirmar que cartões, colunas e controles ficam sem cor e que só a geometria permanece (`onboarding.md` §4, RF-24, RN-07) | T040, T045 | `[//]` | `src/webview/theme/board.css` | 🟢 | `[X]` |
| T053 | Verificar, com a máquina desconectada, que o quadro renderiza integralmente e que o console não acusa violação da política de conteúdo nem requisição externa (`onboarding.md` §8, RF-18, RF-19) | T045, T046 | `[//]` | `src/html.ts` | 🟢 | `[X]` |
| T054 | Verificar com folha de usuário de teste, contendo uma regra contra âncora declarada e outra contra nome de classe da versão 1.33.1, que ambas surtem efeito e que a folha do usuário vence a cascata (`onboarding.md` §9, RF-11, RF-28) | T045 | `[//]` | `.vscode/vscode-kanban.css` | 🟢 | `[X]` |
| T055 | Executar o roteiro de doze passos sobre a interface definitiva e comparar a sequência de eventos e o arquivo do quadro com a referência de T001, incluindo `others` e `__uid` (`onboarding.md` §3, RF-02, RF-04; absorve `T043` e `T050` da feature `001`) | T052, T053, T054 | - | `_reversa_forward/001-interface-react-tema-e-done/reference/` | 🟢 | `[ ]` |
| T056 | Verificar, no editor da versão do piso, que os componentes com seletor relacional e consultas de contêiner aparecem com o acabamento correto (`onboarding.md` §11, itens 2 e 3, RF-21) | T045 | - | `onboarding.md §11` | 🟡 | `[ ]` |
| T058 | Abrir um quadro produzido pela versão 1.33.1, com cartões contendo `id`, `tag`, `references` e campos de cronometragem, fechar sem editar e confirmar que nenhum campo é perdido, acrescentado ou reordenado (`onboarding.md` §11, item 1, RF-06) | T045 | - | `onboarding.md §11` | 🟢 | `[X]` |
| T060 | Medir o contraste entre texto e fundo em cada conjunto de tema oferecido e confirmar a razão de 4,5 para 1 em texto corrido e 3 para 1 em texto grande, registrando os números obtidos (RNF de acessibilidade) | T045 | - | `onboarding.md §6` | 🟡 | `[X]` |
| T061 | Percorrer o quadro apenas por teclado, conferir foco visível, devolução de foco ao fechar diálogo e ausência de armadilha; mover um cartão pelo menu e depois arrastando, confirmando arquivo idêntico; e distinguir os tipos de cartão com a tela em escala de cinza (`onboarding.md` §6, RF-10, RF-13, RF-15) | T045 | - | `onboarding.md §6` | 🟢 | `[ ]` |
| T062 | Percorrer os quatro estados de tema, confirmar que o fixo resiste à troca do editor e que Markdown, diagrama e bloco de código acompanham o tema sem recarregar o painel (`onboarding.md` §5, RF-07, RF-09, RF-16) | T045 | - | `onboarding.md §5` | 🟢 | `[ ]` |
| T063 | Verificar, com um leitor de tela ativo, que cada controle da barra superior e cada ação de cartão anuncia nome não vazio, e que os controles de estado anunciam o estado corrente (`onboarding.md` §6, RF-14) | T045 | - | `onboarding.md §6` | 🟡 | `[ ]` |
| T064 | Confirmar, com o registro de mensagens do Webview ativo, que os dezesseis comandos da ponte continuam com nome e formato idênticos aos declarados na feature `001` (RF-03) | T045 | - | `_reversa_forward/001-interface-react-tema-e-done/interfaces/webview-bridge.md` | 🟢 | `[X]` |
| T066 | Alternar tema, ocultação, colapso e modo de visualização várias vezes e confirmar que o arquivo do quadro fica byte a byte idêntico e que nenhum evento é disparado ao script do usuário (`onboarding.md` §7, RF-05) | T045 | - | `onboarding.md §7` | 🟢 | `[X]` |
| T067 | Verificar, num quadro de cem cartões, que a primeira tela é pintada em até um segundo e que o rótulo textual de tipo não degrada a densidade a ponto de exigir a forma compacta (RNF de desempenho, `roadmap.md` §9) | T045 | - | `onboarding.md §10` | 🟡 | `[ ]` |
| T069 | Verificar a paridade entre os dois modos de visualização com filtro e ocultação ativos: mesmo conjunto de cartões, e editar, mover, excluir, abrir detalhes e rastrear tempo acessíveis nos dois (RF-20) | T045 | - | `src/webview/ui/ListView.tsx` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

### Observações da decomposição, 2026-08-03

Três tensões foram encontradas ao decompor, e as três foram **resolvidas nos documentos de origem**
depois da auditoria cruzada do mesmo dia. Ficam registradas porque explicam por que os documentos
mudaram:

1. **Nome de arquivo de teste inexistente.** `data-delta.md` §3.1 e `onboarding.md` §2 mandavam
   alterar a asserção em `src/test/theme-resolution.unit.test.ts`, que não existe. Corrigido nos dois
   documentos para `src/test/view-state.unit.test.ts`, que é onde o ciclo do controle de tema é
   testado. `T008` já apontava para o arquivo real.
2. **`adapters/` declarado intocado, mas D-26 encosta nele.** `roadmap.md` §5 ganhou ressalva
   explícita: a exigência de D-26 é cumprida sem tocar no adaptador, que continua recebendo o tema
   por parâmetro; o que muda é quem escolhe a folha (`T035`) e o que a extensão serve (`T043`). Se a
   implementação concluir que o adaptador precisa mudar, a promessa cai e precisa ser revista antes
   da alteração.
3. **A base da referência de T001 já não é a 1.33.1.** `onboarding.md` §0 mandava confirmar por
   `git log` que o repositório estava na base anterior a esta feature, o que deixou de ser verdade
   quando a feature `001` reconstruiu a interface. A seção foi reescrita: o caminho é sempre instalar
   a versão publicada em perfil limpo ou fazer `checkout` da etiqueta.

### Ações acrescentadas após a auditoria cruzada, 2026-08-03

O relatório está em `audit/cross-check.md`. Treze ações novas, `T057` a `T069`, e três ações
existentes ampliadas:

- **A001, CRITICAL.** As dezenove âncoras que o mapa da versão 1.33.1 usava sem estarem declaradas
  ganharam nível próprio no contrato, como âncoras de compatibilidade. `T037`, `T038` e `T039` foram
  ampliadas para instrumentá-las, e `T057` nasceu para as três da barra superior, que não tinham ação
  de âncora alguma.
- **A002, HIGH.** O modal de filtro saiu do mapa: não existe diálogo de filtro desde a feature `001`.
  `T057` registra que o controle responde por `action-filter`.
- **A003 a A006, A008, A010, A011, A013, A014.** As verificações órfãs viraram ação: `T058` (abertura
  de quadro antigo), `T059` (ausência de arquivo de fonte), `T060` (contraste medido), `T061`
  (teclado, arrastar e escala de cinza), `T062` (tema e conteúdo rico), `T063` (leitor de tela),
  `T064` (protocolo de mensagens), `T065` (superfície de sanitização), `T066` (arquivo intocado por
  ação de aparência), `T067` (desempenho com cem cartões), `T068` (estados vazios) e `T069` (paridade
  entre os modos).
- **A015, MEDIUM.** `T056` perdeu a marca de paralelismo e passou a apontar para a seção do roteiro
  que verifica, em vez de `package.json`, que já era alvo de escrita de outra ação.

### Alerta sobre `T042`, levantado ao cruzar o quadro do projeto, 2026-08-03

**A política de segurança de conteúdo pode não ser declarável nesta feature, e a razão não está em
nenhum documento dela.** D-28 e RF-19 tratam a declaração como trabalho barato, "porque a folha do
sistema é a primeira folha nova desde então". O cartão `[7]` do quadro do projeto registra o
obstáculo que falta: `src/res/js/filtrex.js:57` compila a expressão de filtro do usuário com
`new Function`, e o Mermaid avalia dinamicamente. Uma `script-src 'nonce-...'` honesta quebra os
dois; declará-la com `'unsafe-eval'` seria afrouxamento disfarçado de entrega, vedado pelo requisito
não funcional de segurança, que proíbe afrouxar a política para acomodar o sistema de design.

O próprio `filter-language.ts:9` já documenta a chamada, de modo que o fato é verificável em dois
lugares.

Ao chegar em `T042`, o `/reversa-coding` tem três saídas, e nenhuma é "declarar assim mesmo":
substituir o avaliador de filtro por um que dispense `new Function` — trabalho que o cartão `[7]`
descreve e que não cabe no escopo desta feature —, declarar a política sem `script-src` restritiva e
registrar a limitação, ou devolver `T042` ao quadro como cartão próprio. A terceira é a mais honesta
com o escopo negativo, que já diz que esta feature não resolve os cartões de segurança pendentes.

### Rodada de execução de 2026-08-03 — Fase 1, cinco ações entregues e duas bloqueadas

`T002` a `T006` estão feitas e a rede de segurança continua verde: `npm run lint`,
`npm run check:webview`, `npm run compile` e os 137 testes de unidade passam. `T001` e `T007`
pararam, cada uma por um motivo que nenhum documento da feature previa, e ambos são de decisão,
não de implementação.

**`T001` é inexequível pelos dois caminhos que a própria ação oferece.**

| Caminho oferecido | Por que está fechado |
|---|---|
| `git checkout` da etiqueta 1.33.1 | **Não existe etiqueta.** `git tag` devolve zero linhas. O commit correspondente é `a296990`, e ele traz `"vscode": "1.1.37"` nas dependências de desenvolvimento — o pacote deprecado que o cartão `[3]` do quadro registrou como travando o `npm install`. Aquele commit não compila com o toolchain atual |
| Instalar a versão publicada em perfil limpo | `a296990:src/boards.ts:952` monta as URIs de recurso no esquema `vscode-resource`. O cartão `[38]` provou, por sonda no VS Code 1.131.0, que esse esquema não é mais servido: o painel **abre em branco**. Não há interface para percorrer os doze passos |

O impedimento não é de quem executa: nenhum humano obteria a referência neste ambiente. Duas saídas
aparecem, e ambas são decisão de quem mantém, não do executor:

1. **Editor antigo.** Baixar por `@vscode/test-electron` uma versão do editor que ainda sirva
   `vscode-resource`, instalar a 1.33.1 nela em perfil limpo e percorrer o roteiro ali. Preserva a
   letra de RF-27 ao custo de descobrir qual versão ainda serve o esquema, o que é medível.
2. **Oráculo derivado.** A parte de comportamento já está capturada em `reference/legacy/` e é lida
   por `scripts/capture-reference.js`; o que falta é a sequência de eventos, que o lado da extensão
   produz de forma determinística a partir das mensagens do Webview. Reconhecer isso muda RF-27 e
   `onboarding.md` §0, e por isso precisa passar pelos documentos antes do código.

**A ordem "`T001` antes de tudo" perdeu a razão que a justificava.** O texto a funda em que a
referência "só é obtenível sobre base não modificada". Isso deixou de valer quando a feature `001`
reconstruiu a interface: a captura hoje roda sobre `reference/legacy/` ou sobre a versão publicada,
nenhuma das duas afetada pelo que se altere na árvore. Foi por esse fundamento que a Fase 1 seguiu
sem ela — e não por dispensa da referência, que continua devendo.

**`T007` esbarra num defeito do contrato, não da implementação.** `interfaces/legacy-class-map.md`
§2 exige que "um seletor antigo escrito na folha do usuário produza o mesmo efeito visual que
produzia na 1.33.1", e manda cumprir isso com uma folha CSS gerada. Nenhuma folha faz isso: CSS não
tem aliasing de seletor. Uma regra escrita pelo usuário contra `.vsckb-kanban-card` casa apenas
elementos que carregam essa classe, e `Card.tsx:87` carrega `vsckb-card`, o nome que a feature `001`
lhe deu; `:is()` e `:where()` agrupam seletores dentro da regra em que aparecem e não alcançam
regras de terceiros. O mecanismo ficou "a cargo do `/reversa-coding`", mas nenhum mecanismo dentro
do meio escolhido existe.

Três saídas, todas mexendo em D-22 e no contrato:

1. **Classe antiga no elemento.** O gerador emite um mapa de âncora para nomes da 1.33.1, e os
   componentes o aplicam ao `className`. Cumpre o efeito prometido por inteiro e mantém o mapa como
   fonte de verdade; o artefato gerado deixa de ser folha e passa a ser módulo, e `T041` e `T044`
   mudam de objeto.
2. **Reescrita da folha do usuário.** A extensão lê `.vscode/vscode-kanban.css`, troca os nomes
   antigos pelas âncoras equivalentes e serve o resultado. Mantém o efeito e o CSS, ao custo de
   passar a transformar arquivo do usuário, o que hoje ela não faz.
3. **Devolver ao quadro.** Registrar a compatibilidade como cartão próprio e seguir a feature sem
   ela, assumindo a quebra que o cartão `[35]` já cobra.

### Medições de empacotamento observadas na Fase 1

Colhidas por sonda do empacotador, com minificação, e registradas aqui porque antecipam o que
`T051` vai medir — não a substituem:

| O que foi empacotado | Código | Folha |
|---|---|---|
| Apenas os quatro conjuntos de tema de `T006` | — | 390.235 B |
| Os conjuntos mais oito componentes e um ícone | 304.610 B | 618.984 B |

O teto de folha do RNF de desempenho é de 400 KB, e os conjuntos de tema sozinhos ocupam 390 KB
dele. Com qualquer componente, o teto é ultrapassado. O número não é motivo para parar a feature
agora, mas `T051` vai reprovar se nada mudar, e a decisão — menos conjuntos oferecidos, extração dos
tokens efetivamente usados ou teto revisto — é melhor tomada antes da Fase 3 do que depois dela.

### Achado de `T004` — o par `react-is` resolveu para a linha errada

`@primer/react` declara `react-is` em `18.x || 19.x`, e o gerenciador escolheu 19.2.8 sobre um React
18.3.1. As duas linhas não se entendem: `isElement` de um elemento criado pelo React 18 devolve
**falso** sob o `react-is` 19, porque o símbolo do elemento mudou de nome entre as versões. A
biblioteca usa essa checagem para decidir o que fazer com filhos recebidos, de modo que a
divergência apareceria como comportamento errado, não como erro de instalação. Corrigido fixando
`react-is` em 18.3.1 exato, como dependência direta, e verificado que `isElement` e `isFragment`
voltam a responder verdadeiro.

### Rodada de execução de 2026-08-03, segunda — Fase 2 fechada e o domínio do tema entregue

Onze ações: `T008` a `T012`, `T014`, `T059`, `T065` e `T068` da Fase 2, mais `T015` e `T016` da
Fase 3. A suíte foi de 137 para 173 testes. `T013` não entrou, porque depende de `T007`, que segue
bloqueada. **A rodada parou antes de `T017`, e a razão está na última subseção.**

**A Fase 2 avançou sem `T001` pelo mesmo fundamento da rodada anterior**, registrado acima: a
referência da versão 1.33.1 não se obtém mais sobre base não modificada, de modo que a ordem que a
punha antes de tudo perdeu o que a justificava. `T001` continua devendo, e com ela a comparação de
paridade de `T055`.

**Dois testes nasceram vermelhos, e é o que se esperava deles.** `T010` reprova por
`theme/board.css`, com 686 linhas contra o teto de quatrocentas, e `T011` reprova pelas 121
declarações de cor, raio, sombra e tamanho de fonte da mesma folha. Ambos fecham em `T040`, que é
quem encolhe a folha à geometria, e a mensagem de falha dos dois nomeia essa ação. Não são
regressão: são a Fase 2 fazendo o que a Fase 2 existe para fazer. `src/webview/ui/`, verificado pelo
mesmo teste, **já está limpo** — a feature `001` o deixou sem nenhum valor visual literal.

**Achado, e é um defeito que a feature teria produzido.** `ThemePreference` está declarada **duas
vezes**: em `src/webview/domain/types.ts`, do lado do Webview, e em `src/view-preferences.ts:54`, do
lado da extensão, porque as duas são unidades de compilação separadas e nenhuma pode importar a
outra. O lado da extensão valida o valor recebido contra a sua própria lista antes de gravar
(`view-preferences.ts:214`), de modo que `'high-contrast'`, enviado pelo Webview, seria **descartado
em silêncio** e a preferência não sobreviveria a um recarregamento. Corrigido nos dois lados, com o
teste que fixa a regra em `view-preferences.unit.test.ts`. É a mesma classe de dívida do cartão
`[12]` do quadro do projeto, sobre outro par de arquivos, e vale registrá-la como tal.

**Cola exigida pelo tipo novo, e que sai em `T021`.** O verificador estrito do Webview apanhou
`TopBar.tsx:21`, um mapa exaustivo por `ThemePreference` que passou a faltar um caso. Ganhou a
entrada de alto contraste e, com ela, um ícone `theme-contrast` desenhado à mão em `icons.tsx` — no
mesmo traço dos demais, e provisório: `T021` substitui o conjunto inteiro pelos do sistema adotado.

**Decisões de implementação que não estavam nos documentos:**

1. **`src/test/sources.ts`, arquivo novo não previsto.** Cinco dos testes desta rodada verificam a
   FORMA do código e precisam lê-lo do disco. Repetir o percurso de diretórios em cada um deles seria
   cinco cópias da mesma coisa, e por isso a leitura vive num único módulo auxiliar. Ele não é suíte:
   o padrão que o Mocha carrega é `*.unit.test.js`.
2. **`T014` carrega o módulo de tema tardiamente.** `primer-themes.ts` importa folhas de estilo, que
   são instrução para o empacotador e não valor para o Node. O teste declara o tipo por importação
   estática — é o que põe o módulo na compilação — e busca os valores por `require`, depois de
   ensinar o Node a ignorar a extensão.
3. **`T065` verifica a barreira pelo texto do adaptador, não exercitando-a.** O sanitizador opera
   sobre um DOM, e a suíte de unidade não tem nenhum; instalar um seria dependência nova numa feature
   que fixou as suas. O teste transcreve a superfície vigente e reprova encolhimento dela, que é o
   que RF-17 pede. O custo está dito no cabeçalho do arquivo: reescrever a barreira noutra forma
   obriga a redeclarar a superfície aqui, de propósito.
4. **`T059` verifica sobretudo o empacotador.** Que o pacote construído não carregue fonte é o fato;
   que o empacotador **não declare carregador** para extensão de fonte é o que mantém o fato
   verdadeiro amanhã, porque transforma um import de fonte em erro de construção em vez de teste que
   alguém precisa lembrar de rodar depois de construir.

**Medição do pacote, para `T051` comparar.** `main.js` passou de 182.918 B para **183.054 B**
(+136 B, do estado novo e do ícone) e `main.css` continua em **11.314 B**. O sistema de design ainda
não entra em nenhum dos dois: `primer-themes.ts` segue sem consumidor até `T017`.

### O que trava a Fase 3, e por que a rodada parou em `T016`

`T017` é a ação que reaponta o provedor de tema para o sistema adotado, e é nela que os 390.235 B de
conjuntos de tema entram no pacote pela primeira vez — o teto do requisito não funcional de
desempenho é de 400 KB de folha. A medição da rodada anterior já mostrava que **com qualquer
componente o teto é ultrapassado**, e a própria nota daquela rodada recomendou decidir isso *antes*
da Fase 3, não depois. Executar `T017` agora seria escolher por omissão.

São quatro decisões abertas, e nenhuma é de implementação:

| # | O que está travado | Alcance |
|---|---|---|
| 1 | Teto de folha contra os quatro conjuntos de tema | Trava `T017` e toda a Fase 3 |
| 2 | `T001`, referência de comportamento da 1.33.1 | Trava `T055`; a Fase 2 seguiu sem ela |
| 3 | `T007` e D-22, mecanismo de compatibilidade | Trava `T013`, `T041` e `T044` |
| 4 | `T042` e a política de segurança de conteúdo | Trava `T042` a `T044` na Fase 4 |

As três últimas já estão descritas nas notas acima, cada uma com as suas saídas. A primeira tem
três, e todas mexem em documento: oferecer menos conjuntos (o alto contraste custa dois dos quatro,
e acabou de ser especificado em `T015`), extrair do sistema apenas os tokens efetivamente usados, ou
rever o teto declarado no requisito não funcional.


### Rodada de execução de 2026-08-03, terceira — a feature entregue, e o que fica devendo

Quarenta e cinco ações nesta rodada: `T007` e `T013`, a Fase 3 inteira, a Fase 4 inteira e a maior
parte da Fase 5. **Sessenta e uma das 69 estão fechadas**, e as oito restantes são de uma espécie só,
descrita ao final. A suíte foi de 173 para **216 testes, todos passando** — as duas falhas anunciadas
como esperadas na rodada anterior fecharam em `T040`, como estava previsto.

As três decisões que travavam a feature foram tomadas aqui. Cada uma está registrada abaixo com o que
foi escolhido, o que foi descartado e o que a escolha custou.

#### Decisão 1 — o teto de folha contra os quatro conjuntos de tema

**Escolhido: extrair do sistema apenas os tokens efetivamente usados.** Descartados: oferecer menos
conjuntos, que custaria o alto contraste recém-especificado em `T015`, e rever o teto, que seria
decidir escrevendo a decisão.

O empacotador ganhou `scripts/theme-tokens.js`. Ele constrói o pacote **duas vezes antes** da
construção real: a primeira descobre quais módulos do sistema de design sobrevivem à poda de código;
a segunda, já sem as folhas dos que não sobrevivem, descobre quais tokens a interface de fato nomeia.
Esse conjunto semeia um fecho transitivo sobre cada conjunto de cor — um token cujo valor nomeia
outro mantém esse outro vivo — e tudo que fica de fora é descartado.

Um achado do caminho, e é o que mais pesou: **o empacotador não remove a folha de um componente que
a poda de código já descartou.** O pacote declara toda folha sob `dist` como efeito colateral, e
efeito colateral sobrevive à poda; pedir um botão trazia junto o estilo do *tree view*, da *timeline*
e do *page layout*. Marcá-las como livres de efeito colateral não resolve, porque a limitação está na
coleta de CSS e não na marcação. O que resolve é medir quais módulos sobreviveram e servir vazias as
folhas órfãs — 82 delas, 262.448 B.

Somados os dois efeitos, a folha do pacote ficou em **131.332 B contra o teto de 400 KB**, com os
quatro conjuntos preservados. Sem eles seriam 439 KB, acima do teto.

Um efeito colateral corrigido de passagem: `T006` importava os conjuntos de cor e **não** importava
`primitives.css`, que declara raio, espessura, espaçamento e escala tipográfica. Sem ele os
componentes resolveriam as próprias medidas para nada e desabariam — falha que apareceria como
diagramação, não como erro.

#### Decisão 2 — `T007`, `T013` e D-22, o mecanismo de compatibilidade

**Escolhido: o gerador emite um módulo, e os nomes antigos voltam para os elementos.** Descartados:
reescrever a folha do usuário, que faria a extensão transformar arquivo alheio, e devolver ao quadro,
que assumiria a quebra que o cartão `[35]` já cobra.

`scripts/generate-legacy-compat.js` lê `interfaces/legacy-class-map.md`, **recusa qualquer destino
que não seja âncora declarada** em `style-anchors.md` e emite `src/webview/theme/legacy-compat.ts`
com os 39 nomes mapeados. O auxiliar `src/webview/ui/anchors.ts` aplica âncora e nome antigo **no
mesmo ato**: um elemento que ganha âncora ganha os nomes daquela âncora, e um que a perde perde os
dois. Nome que era identificador na 1.33.1 volta como identificador.

Isso resolve o defeito de contrato apontado na rodada anterior. A reconciliação está gravada em
`legacy-class-map.md` §2 e em `style-anchors.md` §8, e o teste `legacy-compat.unit.test.ts` reprova
qualquer divergência entre documento e módulo, nas duas direções.

#### Decisão 3 — `T042`, a política de segurança de conteúdo

**Escolhido: declarar a política inteira e deixar `'unsafe-eval'` explícito, com a razão anotada.**
Descartados: declarar sem `script-src`, que deixaria o painel sem restrição de origem, e devolver ao
quadro, que adiaria um ganho que não depende do cartão `[7]`.

A política declarada é `default-src 'none'`, origem própria para folha, fonte e imagem, `connect-src
'none'` e `script-src 'nonce-…' 'unsafe-eval'`. Duas cláusulas merecem leitura:

- **`style-src-attr 'unsafe-inline'` acompanha um `style-src` restritivo.** O atributo de estilo é
  como uma barra de progresso diz quanto avançou — valor por elemento, que folha nenhuma carrega.
  Permitir o atributo e recusar o elemento é a afirmação mais estreita que deixa o quadro funcionar.
- **`'unsafe-eval'` não é dívida do sistema de design**, que não avalia nada: é de `filtrex.js:57`,
  que compila a expressão do usuário com `new Function`, e do Mermaid. O requisito não funcional
  proíbe afrouxar a política *para acomodar o sistema de design*, e isso continua cumprido. O cartão
  `[7]` é quem remove a cláusula.

#### Decisão 4 — `T001` continua sem saída, e é a que sustenta as oito ações abertas

Nada mudou: não há etiqueta, o commit da 1.33.1 não compila e a versão publicada abre em branco no
editor atual. `T055` segue travada por ela.

#### Verificações: o que virou teste e o que exige editor vivo

Onze ações de verificação da Fase 5 foram fechadas por **verificação automatizada e contínua**, que é
mais forte que a inspeção única que o roteiro previa, porque roda a cada `npm run test:unit`:

| Ação | Como ficou verificada |
|---|---|
| `T052` | Prova pelo avesso, por construção: `visual-literals` reprova qualquer declaração que pinte em `board.css`, e a folha agora tem zero. Desligar o sistema de design deixa só geometria porque não há outra origem de cor |
| `T053` | `document-shape.unit.test.ts`: a política é declarada, recusa o que não nomeia, proíbe conexão, e o documento não nomeia endereço externo algum |
| `T054` | Mesmo arquivo: a folha do usuário é a última do documento, depois da folha da interface |
| `T058` | `legacy-board-file.unit.test.ts`: um cartão da 1.33.1 com `id`, `tag`, `references` e cronometragem atravessa carga e gravação byte a byte idêntico, e o `__uid` da sessão nunca chega ao arquivo |
| `T060` | `theme-contrast.unit.test.ts`: as razões são **medidas** pela fórmula da WCAG 2.1 sobre os quatro conjuntos que embarcam, e os de alto contraste têm de separar mais que os simples |
| `T064` | `bridge-protocol.unit.test.ts`: os dezesseis comandos, conferidos contra o contrato nas duas direções |
| `T066` | `view-preferences.unit.test.ts`: trinta mudanças de exibição não movem um byte do quadro, e calcular o que mostrar não altera o que foi lido |
| `T069` | `view-parity.unit.test.ts`: os dois modos mostram o mesmo conjunto com filtro e ocultação ativos, e passam as mesmas ações adiante |

**Oito ações continuam abertas, e todas pelo mesmo motivo: exigem editor rodando e olho humano.**
Nenhuma é de implementação, e nenhuma está bloqueada por decisão pendente:

| Ação | O que falta |
|---|---|
| `T001` | A referência da 1.33.1, inobtenível neste ambiente (ver a rodada anterior) |
| `T050` | Capturas de tela da interface definitiva |
| `T055` | Roteiro de doze passos comparado com `T001` |
| `T056` | Abrir no editor da versão do piso e conferir o acabamento |
| `T061` | Percurso por teclado, arrastar e escala de cinza |
| `T062` | Percorrer os quatro estados de tema com o editor mudando por baixo |
| `T063` | Leitor de tela sobre a barra e as ações de cartão |
| `T067` | Cronometrar a primeira pintura num quadro de cem cartões |

#### Desvios de implementação, declarados

1. **`T019` tocou dois arquivos, não um.** `main.tsx` envolve a árvore em `BaseStyles`, que não
   precisa de preferência alguma; o provedor do sistema de design ficou em `theme-provider.tsx`,
   porque é o único lugar que segura a preferência e pô-lo em `main.tsx` exigiria uma segunda fonte
   dela — exatamente o que D-20 proíbe. Ele é montado em modo **apenas contexto**, para que não
   escreva os atributos de tema uma segunda vez.
2. **Os atributos de tema vão na raiz do documento, não na do quadro.** Um diálogo é irmão do
   quadro, e um atributo escrito no quadro deixaria todo diálogo fora do conjunto de cor.
3. **`T024` substituiu os botões de mover por um menu.** Os movimentos oferecidos são os mesmos
   — `movesFrom` decide, aqui como antes — e o que se grava é idêntico; o que muda é que cada destino
   passa a ser nomeado por extenso e o rodapé devolve o espaço que o rótulo de tipo de `T023` pedia.
4. **`T021` deixou um ícone desenhado à mão.** O conjunto adotado não tem nada que diga "alto
   contraste", e o mais próximo, um círculo meio preenchido, ele não distribui. O ícone é desenhado
   na grade de dezesseis do conjunto e é o único que sobrou.
5. **`T035` desliga a folha que não está em vigor, e o adaptador segue intocado.** A troca acontece
   uma vez por mudança de modo, guardada em módulo, e não uma vez por cartão.
6. **`T043` exigiu escrever `hljs-atom-one-light.css`.** O projeto só tinha o conjunto escuro; o
   claro foi acrescentado como par dele, registrado em `VENDORED.md`.
7. **`IconButton` saiu de `Card.tsx` para arquivo próprio.** Coluna e diálogos o usam, e um controle
   compartilhado dentro de um dos seus consumidores é importação circular esperando acontecer.

#### Quatro âncoras declaradas que não alcançam elemento

`action-save`, `action-clear`, `card-reference` e `card-references` foram prometidas para controles
que a interface **não tem mais** — o quadro grava sozinho desde a feature `001`, não há botão de
limpar a coluna Done, e nada renderiza os vínculos entre cartões, porque o que o vínculo significa
nunca foi decidido (cartão `[13]`). O mesmo vale para o diálogo `clear-done`.

A lacuna está reconciliada em `style-anchors.md` §7.1 e **fixada em teste**, com o tamanho declarado:
instrumentar uma delas exige apagar a linha; o aparecimento de uma quinta reprova.

### Medição de `T051`, sobre o pacote construído

| O que | Medido | Teto | Linha de base anterior |
|---|---|---|---|
| `main.js` | **756.193 B** | 900 KB (921.600 B) | 183.054 B |
| `main.css` | **131.332 B** | 400 KB (409.600 B) | 11.314 B |

Os dois passam. O código cresceu 573 KB, que é o sistema de design entrando pela primeira vez, e
ocupa 82% do teto — folga que vale vigiar, porque cada componente novo cobra a sua parte. A folha
ocupa 32%, e chegaria a 107% sem as duas podas descritas na Decisão 1.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-03 | Versão inicial gerada por `/reversa-to-do`, 56 ações | reversa |
| 2026-08-03 | Treze ações acrescentadas (`T057` a `T069`) e quatro ajustadas (`T013`, `T037` a `T039`, `T056`) após `/reversa-audit`. Total de 69 | iago |
| 2026-08-03 | Primeira rodada de `/reversa-coding`: `T002` a `T006` concluídas; `T001` e `T007` bloqueadas por impedimento externo e por defeito de contrato, ambos registrados nas notas de execução | reversa |
| 2026-08-03 | Segunda rodada de `/reversa-coding`: Fase 2 fechada salvo `T013`, mais `T015` e `T016`. Onze ações, 16 de 69 no total. Parada antes de `T017` por decisão pendente sobre o teto de folha | reversa |
| 2026-08-03 | Terceira rodada de `/reversa-coding`: as três decisões que travavam a feature foram tomadas, Fases 3 e 4 fechadas e a Fase 5 quase toda. Quarenta e cinco ações, 61 de 69 no total. As oito restantes exigem editor rodando e olho humano | reversa |
