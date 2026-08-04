# Impacto no legado: adoção do sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Rodadas cobertas: as três de `/reversa-coding` — Fase 1; Fase 2 e início da 3; e o restante
> Âncora: extração de legado (`_reversa_sdd/architecture.md` e `_reversa_sdd/domain.md`)

**Sessenta e uma das 69 ações estão fechadas.** A feature está entregue: a interface do quadro é
pintada por um sistema de design mantido por terceiro, e o projeto passou a ser consumidor dele.
As oito ações abertas são todas de verificação em editor rodando, com olho humano; nenhuma é de
implementação, e nenhuma está travada por decisão pendente. Estão listadas em §5.

O que mudou de fato, e é o que esta página existe para dizer: **a origem das cores deixou de ser o
projeto.** `theme/tokens.css` foi extinto, `theme/board.css` encolheu de 686 para 382 linhas sem
nenhuma declaração que pinte, e todo componente da interface passou a ser composição sobre controles
do sistema. Comportamento do quadro, formato do arquivo e contrato com os scripts do usuário
permanecem intocados, e agora com verificação automática que os fixa.

## 1. Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `package.json` (`engines.vscode`) | `extension` | delta-de-contrato-externo | **HIGH** | O piso do editor sobe de `^1.62.0` para `^1.78.0` (D-18). Instalações entre 1.62 e 1.77 deixam de receber a extensão pelo canal de atualização |
| `package.json`, `package-lock.json` | `board-ui` | componente-novo | MEDIUM | `@primer/react`, `@primer/primitives` e `@primer/octicons-react` em versão exata, mais `react-is` fixado em 18.3.1 |
| `scripts/build-webview.js`, `scripts/theme-tokens.js` | `board-ui` | regra-nova | **HIGH** | O alvo passou a `chrome108`, e o empacotador ganhou duas podas de folha sem as quais o teto do requisito de desempenho é ultrapassado. Ver §2 |
| `scripts/generate-legacy-compat.js`, `src/webview/theme/legacy-compat.ts` | `board-ui` | componente-novo | **HIGH** | A camada de compatibilidade com a 1.33.1, gerada do mapa do contrato. Recusa destino que não seja âncora declarada |
| `src/webview/ui/anchors.ts` | `board-ui` | componente-novo | **HIGH** | Instrumenta a âncora de estilo e devolve o nome da 1.33.1 no mesmo ato. É onde a promessa de `interfaces/style-anchors.md` é efetivamente cumprida |
| `src/webview/theme/primer-themes.ts` | `board-ui` | componente-novo | MEDIUM | Ponto único de mapeamento entre tema e conjunto nomeado, agora consumido |
| `src/webview/theme/theme-provider.tsx` | `board-ui` | regra-alterada | **HIGH** | Escreve na raiz do documento os atributos que a biblioteca lê, e o alto contraste passou a vir da escolha do usuário, não do editor. Ver §4 |
| `src/webview/theme/tokens.css` | `board-ui` | componente-extinto | MEDIUM | A origem autoral das cores, extinta por D-19 |
| `src/webview/theme/board.css` | `board-ui` | regra-alterada | **HIGH** | De 686 para 382 linhas. Nenhuma cor, raio, sombra ou tamanho de fonte, verificado por teste |
| `src/webview/domain/types.ts`, `view-state.ts` | `board-ui` | delta-de-dados | MEDIUM | O único delta de modelo da feature: a preferência de tema, de três para quatro valores |
| `src/view-preferences.ts` | `extension` | regra-alterada | **HIGH** | Segunda declaração do mesmo tipo, do lado da extensão, que descartaria `'high-contrast'` em silêncio. Ver §2 |
| `src/webview/ui/*` (doze arquivos) | `board-ui` | regra-alterada | MEDIUM | Migração dos componentes e instrumentação das âncoras |
| `src/webview/ui/IconButton.tsx` | `board-ui` | componente-novo | LOW | Saiu de dentro de `Card.tsx`, que passou a não ser o único consumidor |
| `src/html.ts` | `extension` | regra-nova | **HIGH** | Política de segurança de conteúdo, os dois conjuntos de realce servidos e o aviso nomeado de pacote ausente |
| `src/boards.ts` | `extension` | regra-nova | LOW | Passa a origem própria do Webview adiante, e registra por que a folha do usuário é a última |
| `src/res/css/hljs-atom-one-light.css` | `extension` | componente-novo | LOW | O par claro do realce, que o projeto não tinha |
| `src/res/VENDORED.md` | — | regra-nova | MEDIUM | Versões e impressões digitais das seis bibliotecas vendorizadas. Colhe a dívida D7 |
| `CHANGELOG.md`, `README.md` | — | delta-de-contrato-externo | MEDIUM | Nota de quebra e seção de migração da superfície de estilo |
| `src/test/*` (quinze arquivos) | — | componente-novo | MEDIUM | A rede de verificação. A suíte foi de 137 para 216 testes |

## 2. Diff conceitual por componente

**`extension`.** Quatro mudanças, e três delas são de contrato.

O manifesto subiu o piso do editor, num campo que o código não lê: efeito de distribuição, preço
declarado em D-18. O componente continua com as mesmas responsabilidades misturadas que a extração
registrou.

O documento servido passou a **declarar o que pode carregar**. `default-src 'none'`, origem própria
para folha, fonte e imagem, `connect-src 'none'`, e script só com o valor de uso único do documento.
Duas cláusulas merecem leitura. `style-src-attr 'unsafe-inline'` acompanha um `style-src` restritivo:
o atributo de estilo é como uma barra de progresso diz quanto avançou, valor por elemento que folha
nenhuma carrega, e permitir o atributo recusando o elemento é a afirmação mais estreita que deixa o
quadro funcionar. E `'unsafe-eval'` fica declarado, explícito: **não é dívida do sistema de design**,
que não avalia nada, mas de `filtrex.js:57`, que compila a expressão do usuário com `new Function`.
O requisito não funcional proíbe afrouxar a política *para acomodar o sistema de design*, e isso
segue cumprido; o cartão `[7]` do quadro é quem remove a cláusula.

O painel em branco deixou de ser um desfecho possível: o ponto de montagem carrega, em texto e com
diagramação própria, o aviso de que a interface não carregou — substituído pela interface no
primeiro render. É o mesmo princípio do `MissingVendorError` do outro lado da ponte.

E o defeito que a feature teria produzido, encontrado ao ampliar o tipo: `ThemePreference` existe
**duas vezes**, em `src/webview/domain/types.ts` e em `src/view-preferences.ts:54`, porque são
unidades de compilação separadas e nenhuma pode importar a outra. O lado da extensão valida o valor
recebido contra a própria lista antes de gravar, de modo que ampliar só o lado do Webview faria o
quadro oferecer o alto contraste, enviá-lo pela ponte e vê-lo descartado a caminho do `globalState`,
sem erro e sem registro. As duas foram ampliadas juntas, com teste que fixa a regra. É a mesma classe
de dívida do cartão `[12]` do quadro, sobre outro par de arquivos.

**`board-ui`.** O componente que a extração descreveu como "o arquivo é o sistema inteiro", com 2.161
linhas, já não existe nessa forma desde a feature `001`. Sobre o sucessor, esta feature trocou a
origem do vocabulário visual inteiro.

*O que a interface deixou de decidir.* Cor, raio, sombra, espessura, escala tipográfica, anel de
foco, estado pressionado e área de toque passaram a chegar por atualização de dependência.
`theme/tokens.css` foi extinto; `theme/board.css` guarda geometria e nada mais, e um teste reprova
qualquer declaração que pinte. É essa ausência, e não uma promessa escrita, que faz a prova pelo
avesso de RN-07 valer: desligada a folha do sistema, não há segunda origem de cor.

*O que a interface passou a decidir de propósito.* Três coisas, todas por razão declarada. O tipo do
cartão é dito **em palavras** além da cor, para que dois cartões continuem distinguíveis em escala de
cinza (D-24, RN-03). Mover um cartão virou **menu com os destinos nomeados**, no lugar da fileira de
ícones: os movimentos oferecidos são os mesmos, `movesFrom` decide como antes, e o que se grava é
idêntico. E o alto contraste é **eixo separado** do modo de cor: `resolveTheme` continua devolvendo
só claro ou escuro, e `isHighContrast` responde sozinha pelo grau de separação, sem receber o tema do
editor — o que preserva RF-09 por construção, e não por vigilância.

*O empacotador virou parte da entrega, e não era assim que o plano previa.* Dois achados o
obrigaram. O primeiro: os quatro conjuntos de tema ocupam 390 KB dos 400 KB do teto antes de qualquer
componente entrar. O segundo, e é o que mais custou: **o empacotador não remove a folha de um
componente que a poda de código já descartou** — o pacote declara toda folha como efeito colateral, e
efeito colateral sobrevive à poda, de modo que pedir um botão trazia o estilo do *tree view*, da
*timeline* e do *page layout*. `scripts/theme-tokens.js` resolve os dois medindo o que sobrevive e
descartando o resto: os conjuntos ficam podados aos tokens que a interface nomeia, com fecho
transitivo, e 82 folhas órfãs saem inteiras. Sem isso a folha seria de 439 KB; com isso, 131 KB.

*Um erro corrigido de passagem.* `T006` importava os conjuntos de cor e **não** `primitives.css`,
que declara raio, espessura, espaçamento e escala. Sem ele os componentes resolveriam as próprias
medidas para nada e desabariam — falha que apareceria como diagramação, não como erro.

**A camada de compatibilidade, e o contrato que ela obrigou a corrigir.** `interfaces/legacy-class-map.md`
§2 exigia que um seletor antigo produzisse o mesmo efeito visual e mandava cumprir isso com uma folha
CSS gerada. **Nenhuma folha faz isso**: CSS não tem aliasing de seletor. O mecanismo passou a ser um
módulo gerado do mesmo mapa, e os nomes antigos voltam para os elementos — identificador como
identificador, classe como classe —, aplicados no render pelo auxiliar que também instrumenta a
âncora. O efeito prometido é cumprido por inteiro; o que mudou foi o veículo, e a reconciliação está
gravada nos dois documentos de contrato.

**Dívida D7, das bibliotecas vendorizadas.** Colhida. `src/res/VENDORED.md` declara Mermaid 7.0.0,
CodeMirror 5.39.0, Moment 2.22.1, highlight.js 9.12.0 e Showdown 1.8.6, com a impressão digital de
cada arquivo. Filtrex **não declara versão em lugar nenhum** do artefato distribuído, e por isso é
identificado pelo SHA-256 — que é identidade melhor que um número, porque não pode estar errado.

**Dívida D8, do pacote `vscode` deprecado.** Já tinha sido colhida antes desta feature. Reaparece
pelo efeito colateral registrado na primeira rodada: o commit da 1.33.1 não compila, e é uma das duas
razões pelas quais `T001` não pôde ser executada.

## 3. Preservadas

Todas as regras 🟢 de `_reversa_sdd/domain.md` seguem intactas, e várias delas ganharam verificação
que não tinham. Nenhuma rodada abriu arquivo de persistência, de adaptador ou de exportação.

- **§3.1, estrutura do quadro.** As quatro colunas fixas e seus identificadores continuam como estão.
  `T068` fixou que um quadro vazio, ou que chegue sem coluna alguma, ainda apresenta as quatro
  colunas contando zero.
- **§3.2, cartões.** Nenhum campo, valor padrão ou limite mudou; o limite de 255 caracteres da
  descrição continua onde a feature `001` o pôs. `T058` acrescentou o que faltava: um cartão da
  1.33.1 com `id`, `tag`, `references` e cronometragem atravessa carga e gravação **byte a byte
  idêntico**, e o `__uid` da sessão nunca chega ao arquivo.
- **§3.3, ordenação e apresentação.** Prioridade decrescente, depois tipo, depois título.
- **§3.4, filtro.** A linguagem de expressão e o comportamento de expressão inválida continuam
  idênticos. `T069` fixou que os dois modos de visualização mostram o mesmo conjunto com filtro e
  ocultação ativos.
- **§3.5 a §3.8**, cronometragem, exportação, identificação do usuário e eventos: nenhum arquivo
  desses caminhos foi aberto. `T064` fixou que os dezesseis comandos da ponte continuam com nome e
  forma idênticos, conferidos contra o contrato nas duas direções.
- **RF-05, olhar não é alterar.** `T066` fixou que trinta mudanças de exibição não movem um byte do
  quadro, e que calcular o que mostrar não altera o que foi lido.
- **Barreira de sanitização.** `T065` transcreveu a superfície vigente e reprova encolhimento. A
  barreira não melhorou: o cartão `[6]` continua inteiro. Ela apenas ficou impedida de piorar.

## 4. Modificadas

**Duas regras de comportamento, duas de contrato externo e uma superfície de estilo inteira.**

| O que mudou | Onde estava declarado | O que passa a valer |
|---|---|---|
| Ciclo do controle de tema | `view-state.ts`, três estados | Quatro estados. A regra sempre foi "percorrer tudo e voltar ao início"; o número três era acidente |
| Conjunto de valores da preferência de tema | `types.ts` **e** `view-preferences.ts`, três valores | Quatro valores, nas duas declarações |
| Origem do alto contraste | `theme-provider.tsx`, vinha do editor | Vem da **escolha do usuário**. Um tema de alto contraste do editor deixa o quadro claro ou escuro como qualquer outro, e nada mais (RF-09) |
| Superfície de estilo alcançável | nomes de classe da feature `001` | Âncoras de dados declaradas em contrato, mais 39 nomes da 1.33.1 devolvidos aos elementos |
| Piso do editor | `package.json`, `^1.62.0` | `^1.78.0` |
| Alvo do empacotador | `scripts/build-webview.js`, `chrome91` | `chrome108` |

A asserção de teste alterada é **uma só** em toda a feature, prevista em `data-delta.md` §3.1 e
autorizada por RF-02: a que fixava três acionamentos do controle de tema. Todo o resto da suíte de
caracterização permanece intocado, e cresceu de 137 para 216 testes.

**Migração de dados: nenhuma.** Uma instalação que volte para a versão anterior encontra
`'high-contrast'` gravado, não o reconhece e cai no padrão, sem erro e sem perda.

**Quatro âncoras declaradas não alcançam elemento**, e é honesto dizer: `action-save`, `action-clear`,
`card-reference` e `card-references` foram prometidas para controles que a interface não tem mais — o
quadro grava sozinho desde a feature `001`, não há botão de limpar a coluna Done, e nada renderiza os
vínculos entre cartões, porque o que o vínculo significa nunca foi decidido (cartão `[13]`). A
lacuna está reconciliada em `style-anchors.md` §7.1 e fixada em teste, com o tamanho declarado.

## 5. O que ficou por fazer, e por quê

**Oito ações, e todas pelo mesmo motivo: exigem editor rodando e olho humano.** Nenhuma decisão
continua pendente.

| Ação | O que falta |
|---|---|
| `T001` | A referência de comportamento da 1.33.1. Inexequível neste ambiente pelos dois caminhos que a própria ação oferece: não há etiqueta, o commit correspondente não compila, e a versão publicada abre em branco no editor atual. É a única com impedimento externo, e não apenas de ambiente |
| `T050` | Capturas de tela da interface definitiva |
| `T055` | O roteiro de doze passos comparado com a referência de `T001`, e portanto bloqueada por ela |
| `T056` | Abrir no editor da versão do piso e conferir o acabamento do seletor relacional e das consultas de contêiner |
| `T061` | Percurso por teclado, arrastar e distinção dos tipos em escala de cinza |
| `T062` | Percorrer os quatro estados de tema com o editor mudando por baixo |
| `T063` | Leitor de tela sobre a barra superior e as ações de cartão |
| `T067` | Cronometrar a primeira pintura num quadro de cem cartões |

Onze outras ações de verificação **foram fechadas por teste automatizado**, que é verificação mais
forte que a inspeção única prevista no roteiro, porque roda a cada execução da suíte. A tabela do que
virou teste está nas notas de execução de `actions.md`.
