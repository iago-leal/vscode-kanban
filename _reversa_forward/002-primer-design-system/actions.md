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
| T002 | Elevar `engines.vscode` de `^1.62.0` para `^1.78.0` (D-18, RN-05, RF-21) | T001 | `[//]` | `package.json` | 🟢 | `[ ]` |
| T003 | Elevar `BROWSER_TARGET` de `chrome91` para `chrome108` (D-18, RF-21) | T001 | `[//]` | `scripts/build-webview.js` | 🟢 | `[ ]` |
| T004 | Acrescentar `@primer/react` 38.34.0, `@primer/primitives` 11.10.0 e `@primer/octicons-react` 19.32.0 com versão **exata**, sem acento circunflexo, e versionar o `package-lock.json` resultante (D-17, RNF de segurança) | T002 | - | `package.json` | 🟢 | `[ ]` |
| T005 | Ajustar o empacotador para resolver as folhas de estilo importadas de módulo dos pacotes novos, sem quebrar o carregador de `.css` já existente (`investigation.md` §7) | T003, T004 | - | `scripts/build-webview.js` | 🟡 | `[ ]` |
| T006 | Criar o ponto único de mapeamento entre estado de preferência de tema e conjunto nomeado do sistema, importando apenas os conjuntos oferecidos ao usuário (D-19, RF-08, RNF de manutenibilidade) | T004 | - | `src/webview/theme/primer-themes.ts` | 🟢 | `[ ]` |
| T007 | Criar o gerador da folha de compatibilidade, que lê o mapa de `interfaces/legacy-class-map.md` e emite CSS, com cabeçalho de arquivo gerado e recusa de nome ausente do mapa (D-22, RF-28) | T001 | `[//]` | `scripts/generate-legacy-compat.js` | 🟡 | `[ ]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Alterar a asserção do ciclo do controle de tema para o número de estados oferecidos, em vez de três fixos (RF-07, `data-delta.md` §3.1). **Esta é a única asserção da suíte que pode ser alterada** | T001 | - | `src/test/view-state.unit.test.ts` | 🟢 | `[ ]` |
| T009 | Acrescentar teste da resolução de `'high-contrast'` e da conversão de entrada de valor gravado desconhecido, que precisa continuar caindo em `'follow-editor'` (`data-delta.md` §3.2 e §4, RF-09) | T008 | - | `src/test/view-state.unit.test.ts` | 🟢 | `[ ]` |
| T010 | Criar teste que reprova qualquer arquivo sob `src/webview/` acima de quatrocentas linhas (RF-23) | T001 | `[//]` | `src/test/source-limits.unit.test.ts` | 🟢 | `[ ]` |
| T011 | Criar teste que reprova valor visual literal — cor, raio de borda, sombra, tamanho de fonte — em `src/webview/ui/` e em `theme/board.css` (RF-01, RF-24, RN-07) | T001 | `[//]` | `src/test/visual-literals.unit.test.ts` | 🟡 | `[ ]` |
| T012 | Criar teste que reprova importação do sistema de design em `domain/`, `adapters/` e `bridge/` (RNF de manutenibilidade, `roadmap.md` §2) | T001 | `[//]` | `src/test/layer-boundaries.unit.test.ts` | 🟢 | `[ ]` |
| T013 | Criar teste do gerador da folha de compatibilidade: cada um dos trinta e nove nomes mapeados produz regra, nenhuma entrada da lista de não mapeados aparece na saída, e todo destino é âncora declarada em `style-anchors.md` (RF-28, `interfaces/legacy-class-map.md` §3 e §4) | T007 | `[//]` | `src/test/legacy-compat.unit.test.ts` | 🟡 | `[ ]` |
| T014 | Criar teste do mapa de tema: os quatro estados de preferência resolvem para conjuntos nomeados distintos do sistema, e nenhum conjunto fora dos oferecidos é importado (RF-08, RNF de desempenho do pacote) | T006 | `[//]` | `src/test/primer-themes.unit.test.ts` | 🟢 | `[ ]` |
| T059 | Criar teste que reprova arquivo de fonte no pacote construído, garantindo que a tipografia resolve pela pilha do sistema operacional (RF-26) | T005 | `[//]` | `src/test/no-font-assets.unit.test.ts` | 🟢 | `[ ]` |
| T065 | Criar teste que compara o conjunto de elementos e atributos permitidos pela sanitização com o vigente, reprovando qualquer crescimento (RF-17) | T001 | `[//]` | `src/test/sanitizer-surface.unit.test.ts` | 🟡 | `[ ]` |
| T068 | Criar teste dos estados vazios: quadro sem nenhum cartão exibe as quatro colunas com contagem zero, e cartão sem título e sem descrição permanece renderizado e selecionável (cenários de `requirements.md` §7) | T001 | `[//]` | `src/test/empty-states.unit.test.ts` | 🟢 | `[ ]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T015 | Acrescentar `'high-contrast'` ao tipo `ThemePreference` (`data-delta.md` §3) | T009 | - | `src/webview/domain/types.ts` | 🟢 | `[ ]` |
| T016 | Acrescentar `'high-contrast'` a `THEME_CYCLE` e o caso correspondente à resolução de tema, preservando a regra de `'follow-editor'`, que nunca deduz alto contraste do editor (`data-delta.md` §3.1 e §3.2, RF-08, RF-09) | T015 | - | `src/webview/domain/view-state.ts` | 🟢 | `[ ]` |
| T017 | Reapontar o provedor de tema: escrever na raiz os atributos que a biblioteca lê, no lugar de `data-vsckb-theme`, consumindo o mapa de T006 e deixando de importar `tokens.css`. O `ViewState` continua sendo a única fonte da preferência (D-19, D-20) | T006, T016 | - | `src/webview/theme/theme-provider.tsx` | 🟢 | `[ ]` |
| T018 | Excluir `theme/tokens.css`, extinto pela troca de origem dos conjuntos de cor (D-19) | T017 | - | `src/webview/theme/tokens.css` | 🟢 | `[ ]` |
| T019 | Envolver a árvore de componentes no provedor do sistema de design, na raiz do Webview, sem introduzir fonte de preferência concorrente ao `ViewState` (D-20) | T017 | - | `src/webview/main.tsx` | 🟢 | `[ ]` |
| T020 | Migrar a barra superior para os controles do sistema: botões, seletores e rótulos de contagem, com nome acessível e estado expostos (RF-01, RF-13, RF-14) | T019 | `[//]` | `src/webview/ui/TopBar.tsx` | 🟢 | `[ ]` |
| T021 | Substituir os ícones desenhados à mão pelos do conjunto adotado, importados **individualmente** para que o empacotador descarte o restante (D-25, RF-25) | T019 | `[//]` | `src/webview/ui/icons.tsx` | 🟢 | `[ ]` |
| T022 | Migrar as ações do cartão para os controles do sistema, preservando o cartão como composição do projeto e sem valor visual literal (RF-01, RF-24, RN-07) | T020, T021 | - | `src/webview/ui/Card.tsx` | 🟢 | `[ ]` |
| T023 | Acrescentar ao cartão o rótulo textual do tipo, com o componente de rótulo do sistema, de modo que a distinção sobreviva à escala de cinza (D-24, RN-03, RF-10) | T022 | - | `src/webview/ui/Card.tsx` | 🟡 | `[ ]` |
| T024 | Acrescentar ao cartão o menu de ação com as colunas de destino, caminho de teclado equivalente ao arrastar, com o mesmo resultado gravado (D-27, RF-15) | T023 | - | `src/webview/ui/Card.tsx` | 🟡 | `[ ]` |
| T025 | Migrar a coluna para os controles do sistema no cabeçalho, na contagem e no botão de limpar, preservando a coluna como composição do projeto (RF-01, RF-24, RN-07) | T022 | - | `src/webview/ui/Column.tsx` | 🟢 | `[ ]` |
| T026 | Migrar o diálogo base para o do sistema, com devolução de foco ao controle que o abriu, fechamento por escape e ausência de armadilha de foco (RF-13, RF-14) | T020 | - | `src/webview/ui/dialogs/Dialog.tsx` | 🟢 | `[ ]` |
| T027 | Migrar o diálogo de confirmação, usado na exclusão de cartão e na limpeza da coluna Done (RF-01) | T026 | `[//]` | `src/webview/ui/dialogs/ConfirmDialog.tsx` | 🟢 | `[ ]` |
| T028 | Migrar o formulário de cartão para os campos e seletores do sistema, preservando o limite de duzentos e cinquenta e cinco caracteres da descrição registrado na feature `001` (RF-01, RF-02) | T026 | `[//]` | `src/webview/ui/dialogs/CardForm.tsx` | 🟢 | `[ ]` |
| T029 | Migrar o diálogo de acréscimo de cartão para a casca do diálogo do sistema (RF-01) | T028 | `[//]` | `src/webview/ui/dialogs/AddCardDialog.tsx` | 🟢 | `[ ]` |
| T030 | Migrar o diálogo de edição de cartão para a casca do diálogo do sistema (RF-01) | T028 | `[//]` | `src/webview/ui/dialogs/EditCardDialog.tsx` | 🟢 | `[ ]` |
| T031 | Migrar o diálogo de detalhes do cartão, preservando a renderização de Markdown, diagrama e bloco de código (RF-01, RF-16) | T026 | `[//]` | `src/webview/ui/dialogs/CardDetailsDialog.tsx` | 🟢 | `[ ]` |
| T032 | Migrar o campo de Markdown, encaixando o editor de texto vendorizado dentro do controle de campo do sistema sem alterar o adaptador (RF-01, RF-16) | T028 | - | `src/webview/ui/dialogs/MarkdownField.tsx` | 🟡 | `[ ]` |
| T033 | Migrar o contêiner do modo de colunas e instrumentar nele a âncora `[data-vsckb="columns"]` (RF-01, RF-11, RF-20) | T025 | `[//]` | `src/webview/ui/ColumnsView.tsx` | 🟢 | `[ ]` |
| T034 | Migrar o contêiner do modo de lista e instrumentar nele a âncora `[data-vsckb="list"]`, mantendo a paridade de cartões e ações com o modo de colunas (RF-01, RF-11, RF-20) | T025 | `[//]` | `src/webview/ui/ListView.tsx` | 🟢 | `[ ]` |
| T035 | Fazer o realce de sintaxe derivar do modo de cor ativo, no lugar da folha de tema escuro fixa, sem alterar o adaptador de realce (D-26, RF-16). Corrige o defeito descrito em `investigation.md` §6 | T031 | - | `src/webview/ui/Markdown.tsx` | 🟡 | `[ ]` |
| T036 | Instrumentar na raiz do quadro as âncoras `[data-vsckb="board"]`, `[data-vsckb="board-header"]` e `[data-vsckb-view]` (`interfaces/style-anchors.md` §3 e §4, RF-11) | T020 | `[//]` | `src/webview/ui/App.tsx` | 🟢 | `[ ]` |
| T037 | Instrumentar na coluna as âncoras permanentes `column`, `column-header`, `column-body`, `[data-vsckb-column]`, `[data-vsckb-collapsed]` e `[data-vsckb-drop-target]`, mais as de compatibilidade `action-add` e `action-clear` (`interfaces/style-anchors.md` §3, §4 e §5.1, RF-11, RF-28) | T025 | `[//]` | `src/webview/ui/Column.tsx` | 🟢 | `[ ]` |
| T038 | Instrumentar no cartão as âncoras permanentes `card`, `card-title`, `card-body`, `card-footer`, `card-actions`, `[data-vsckb-card-type]` e `[data-vsckb-dragging]`, mais as de compatibilidade `action-edit`, `card-category`, `card-progress`, `card-progress-bar`, `card-reference` e `card-references` (`interfaces/style-anchors.md` §3, §4, §5.1 e §5.3, RF-11, RF-28) | T024 | `[//]` | `src/webview/ui/Card.tsx` | 🟢 | `[ ]` |
| T039 | Instrumentar nos diálogos a âncora permanente `[data-vsckb="dialog"]` e as de compatibilidade `[data-vsckb-dialog]` nos cinco valores — `add-card`, `edit-card`, `card-details`, `delete-card`, `clear-done` —, `dialog-confirm` e `dialog-cancel` (`interfaces/style-anchors.md` §3 e §5.2, RF-11, RF-28) | T026 | `[//]` | `src/webview/ui/dialogs/Dialog.tsx` | 🟢 | `[ ]` |
| T057 | Instrumentar na barra superior as âncoras de compatibilidade `action-save`, `action-reload` e `action-filter` (`interfaces/style-anchors.md` §5.1, RF-28). O filtro é campo da barra, não diálogo: é esta âncora que responde pelo controle na folha antiga | T020 | - | `src/webview/ui/TopBar.tsx` | 🟢 | `[ ]` |
| T040 | Encolher a folha do quadro à geometria — faixa de coluna, pilha de cartões, área de arrastar e colapso — sem nenhuma declaração de cor, raio, sombra ou tamanho de fonte, saindo das seiscentas e oitenta e seis linhas atuais (D-21, RF-24, RN-07) | T032, T033, T034, T035, T036, T037, T038, T039 | - | `src/webview/theme/board.css` | 🟢 | `[ ]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T041 | Executar o gerador e versionar a folha de compatibilidade produzida, com o cabeçalho que proíbe edição à mão (D-22, RF-28) | T013, T040 | `[//]` | `src/webview/theme/legacy-compat.css` | 🟢 | `[ ]` |
| T042 | Declarar a política de segurança de conteúdo no documento do Webview, com origem própria para estilo e fonte e execução de script restrita ao valor de uso único já emitido pela feature `001` (D-28, RF-19, cartão `[7]` do quadro) | T019 | - | `src/html.ts` | 🟡 | `[ ]` |
| T043 | Servir o conjunto claro e o escuro de realce de sintaxe, no lugar da folha escura fixa, para que T035 possa escolher entre eles (D-26, RF-16) | T042, T035 | - | `src/html.ts` | 🟡 | `[ ]` |
| T044 | Servir a folha de compatibilidade na ordem de cascata declarada: pacote da interface, compatibilidade, folha do usuário (`interfaces/style-anchors.md` §8, RF-28) | T041, T043 | - | `src/html.ts` | 🟢 | `[ ]` |
| T045 | Garantir que a folha do usuário permanece a **última** injetada, depois da folha de compatibilidade (`interfaces/style-anchors.md` §8, RF-11) | T044 | - | `src/boards.ts` | 🟢 | `[ ]` |
| T046 | Produzir mensagem nomeada e visível quando o pacote da interface faltar ou não carregar, no lugar do painel em branco, à semelhança do `MissingVendorError` já existente (RNF de observabilidade, `roadmap.md` §2) | T044 | - | `src/html.ts` | 🟡 | `[ ]` |
| T047 | Declarar o número de versão das seis bibliotecas vendorizadas sobreviventes — Filtrex, Showdown, Mermaid, highlight.js, CodeMirror e Moment — apurando cada uma no arquivo distribuído (D-29, RF-22, dívida D7 de `_reversa_sdd/architecture.md#9.2`) | T001 | `[//]` | `src/res/VENDORED.md` | 🟡 | `[ ]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens de erro, documentação curta e verificação dos critérios de pronto. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T048 | Registrar no changelog a alteração incompatível da superfície de estilo, a elevação do piso do editor e a correção do realce de sintaxe em tema claro (RF-12, `investigation.md` §6) | T045 | `[//]` | `CHANGELOG.md` | 🟢 | `[ ]` |
| T049 | Acrescentar ao leia-me a seção de migração, com o mapa entre a superfície antiga e a nova, a lista de âncoras estáveis e o alcance da camada de compatibilidade (RF-11, RF-12) | T045 | - | `README.md` | 🟢 | `[ ]` |
| T050 | Acrescentar ao leia-me as capturas de tela da interface definitiva, feitas uma única vez (RF-12, absorve `T048` da feature `001`) | T049 | - | `README.md` | 🟢 | `[ ]` |
| T051 | Medir o pacote construído e registrar os números obtidos nas notas de execução, contra a linha de base de 182.918 bytes de código e 11.314 de folha e o teto de 900 KB e 400 KB (`onboarding.md` §10, RNF de desempenho) | T045 | - | `_reversa_forward/002-primer-design-system/actions.md` | 🟢 | `[ ]` |
| T052 | Executar a prova pelo avesso: com a folha do sistema desabilitada, confirmar que cartões, colunas e controles ficam sem cor e que só a geometria permanece (`onboarding.md` §4, RF-24, RN-07) | T040, T045 | `[//]` | `src/webview/theme/board.css` | 🟢 | `[ ]` |
| T053 | Verificar, com a máquina desconectada, que o quadro renderiza integralmente e que o console não acusa violação da política de conteúdo nem requisição externa (`onboarding.md` §8, RF-18, RF-19) | T045, T046 | `[//]` | `src/html.ts` | 🟢 | `[ ]` |
| T054 | Verificar com folha de usuário de teste, contendo uma regra contra âncora declarada e outra contra nome de classe da versão 1.33.1, que ambas surtem efeito e que a folha do usuário vence a cascata (`onboarding.md` §9, RF-11, RF-28) | T045 | `[//]` | `.vscode/vscode-kanban.css` | 🟢 | `[ ]` |
| T055 | Executar o roteiro de doze passos sobre a interface definitiva e comparar a sequência de eventos e o arquivo do quadro com a referência de T001, incluindo `others` e `__uid` (`onboarding.md` §3, RF-02, RF-04; absorve `T043` e `T050` da feature `001`) | T052, T053, T054 | - | `_reversa_forward/001-interface-react-tema-e-done/reference/` | 🟢 | `[ ]` |
| T056 | Verificar, no editor da versão do piso, que os componentes com seletor relacional e consultas de contêiner aparecem com o acabamento correto (`onboarding.md` §11, itens 2 e 3, RF-21) | T045 | - | `onboarding.md §11` | 🟡 | `[ ]` |
| T058 | Abrir um quadro produzido pela versão 1.33.1, com cartões contendo `id`, `tag`, `references` e campos de cronometragem, fechar sem editar e confirmar que nenhum campo é perdido, acrescentado ou reordenado (`onboarding.md` §11, item 1, RF-06) | T045 | - | `onboarding.md §11` | 🟢 | `[ ]` |
| T060 | Medir o contraste entre texto e fundo em cada conjunto de tema oferecido e confirmar a razão de 4,5 para 1 em texto corrido e 3 para 1 em texto grande, registrando os números obtidos (RNF de acessibilidade) | T045 | - | `onboarding.md §6` | 🟡 | `[ ]` |
| T061 | Percorrer o quadro apenas por teclado, conferir foco visível, devolução de foco ao fechar diálogo e ausência de armadilha; mover um cartão pelo menu e depois arrastando, confirmando arquivo idêntico; e distinguir os tipos de cartão com a tela em escala de cinza (`onboarding.md` §6, RF-10, RF-13, RF-15) | T045 | - | `onboarding.md §6` | 🟢 | `[ ]` |
| T062 | Percorrer os quatro estados de tema, confirmar que o fixo resiste à troca do editor e que Markdown, diagrama e bloco de código acompanham o tema sem recarregar o painel (`onboarding.md` §5, RF-07, RF-09, RF-16) | T045 | - | `onboarding.md §5` | 🟢 | `[ ]` |
| T063 | Verificar, com um leitor de tela ativo, que cada controle da barra superior e cada ação de cartão anuncia nome não vazio, e que os controles de estado anunciam o estado corrente (`onboarding.md` §6, RF-14) | T045 | - | `onboarding.md §6` | 🟡 | `[ ]` |
| T064 | Confirmar, com o registro de mensagens do Webview ativo, que os dezesseis comandos da ponte continuam com nome e formato idênticos aos declarados na feature `001` (RF-03) | T045 | - | `_reversa_forward/001-interface-react-tema-e-done/interfaces/webview-bridge.md` | 🟢 | `[ ]` |
| T066 | Alternar tema, ocultação, colapso e modo de visualização várias vezes e confirmar que o arquivo do quadro fica byte a byte idêntico e que nenhum evento é disparado ao script do usuário (`onboarding.md` §7, RF-05) | T045 | - | `onboarding.md §7` | 🟢 | `[ ]` |
| T067 | Verificar, num quadro de cem cartões, que a primeira tela é pintada em até um segundo e que o rótulo textual de tipo não degrada a densidade a ponto de exigir a forma compacta (RNF de desempenho, `roadmap.md` §9) | T045 | - | `onboarding.md §10` | 🟡 | `[ ]` |
| T069 | Verificar a paridade entre os dois modos de visualização com filtro e ocultação ativos: mesmo conjunto de cartões, e editar, mover, excluir, abrir detalhes e rastrear tempo acessíveis nos dois (RF-20) | T045 | - | `src/webview/ui/ListView.tsx` | 🟢 | `[ ]` |

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

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-03 | Versão inicial gerada por `/reversa-to-do`, 56 ações | reversa |
| 2026-08-03 | Treze ações acrescentadas (`T057` a `T069`) e quatro ajustadas (`T013`, `T037` a `T039`, `T056`) após `/reversa-audit`. Total de 69 | iago |
