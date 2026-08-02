# Roadmap: Nova interface do quadro — tema alternável e ocultação de concluídos

> Identificador: `001-interface-react-tema-e-done`
> Data: `2026-08-02`
> Requirements: `_reversa_forward/001-interface-react-tema-e-done/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

O Webview deixa de ser um documento montado por concatenação de strings e passa a ser um
pacote único de TypeScript e React, empacotado por esbuild e servido por `html.ts`. A mudança
não é uma repintura do `board.js`: o arquivo de 2.161 linhas em escopo global é substituído por
três camadas com fronteira declarada — domínio de exibição sem DOM, adaptadores das bibliotecas
vendorizadas e componentes de interface. As 470 linhas de HTML literal dentro de `boards.ts`
saem junto, por decisão registrada em §4, de modo que os diálogos passam a viver na mesma
pilha do quadro e o estado deixa de ter dois donos.

Os dois recursos pedidos entram como estado de exibição, categoria que hoje não existe no
sistema: o tema tri-estado resolve numa paleta própria de dois conjuntos, e a ocultação de
concluídos é o caso particular do colapso de coluna. Nenhum deles toca o modelo do quadro. A
preservação do comportamento apoia-se em duas âncoras já existentes no repositório: os 58
testes de caracterização do commit `6d99e58` e o gate de lint e testes do commit `6a1bcc0`.

## 2. Princípios aplicados

O projeto **não tem `.reversa/principles.md`** 🟢. Na ausência dele, e como já fizera o
`requirements.md` na pendência Q-019, a conferência abaixo corre contra os princípios do
mantenedor declarados em `~/.claude/CLAUDE.md`. Rodar `/reversa-principles` tornaria esta tabela
verificável em vez de convencional.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| 4 · Proporcionalidade | A extensão é **Aplicação**: tem usuários, evolui no tempo e o quadro é versionado por terceiros. Rigor pleno, com testes de domínio e camadas explícitas | respeita |
| 5.1 · Camadas e encapsulamento | `src/webview/domain/` puro, `adapters/` na fronteira das bibliotecas, `ui/` na apresentação. Corrige o desalinhamento apontado em `_reversa_sdd/architecture.md#1-estilo-arquitetural`, onde o domínio mora em `board.js` | respeita |
| 5.1 · Baixo acoplamento | Nenhum componente de interface referencia CodeMirror, Mermaid, Showdown, highlight.js, Moment ou Filtrex diretamente (D-08) | respeita |
| 5.2 · Testável e testado | O domínio de exibição vira função pura, exercitável por Mocha sem Webview; meta de 60% em `src/webview/domain/` | respeita |
| 5.2 · Guardrails contínuos | O `ci.yml` do commit `6a1bcc0` já barra lint e testes; a feature acrescenta o novo alvo de compilação e o `strict: true` do Webview (D-10) | respeita |
| 5.2 · Erros barulhentos | Toda falha de renderização passa pela ponte `log`; nenhum bloco de captura vazio no código novo. Contrasta com os dez blocos vazios de hoje (`_reversa_sdd/architecture.md#8-qualidades-do-sistema`) | respeita |
| 5.3 · Reprodutibilidade temporal | esbuild, React e tipos entram pinados de forma exata, com `package-lock.json` versionado, como já é a prática do manifesto | respeita |
| 5.6 · Sinais de dívida | A feature apaga três sinais disparados (arquivo maior que 400 linhas, função maior que 50, cobertura de domínio abaixo de 60%) e **não** apaga os demais: `workspaces.ts` continua com 1.134 linhas | respeita |
| 3 · Filtro de longevidade | React e esbuild passam no filtro. `jQuery` 3, `Bootstrap` 4.1.1 e `Font Awesome` 4 saem por obsolescência; as demais vendorizadas permanecem sem versão conhecida (G-11), agora atrás de adaptador | conflita parcialmente |
| 5.4 · Documentação | O `README.md` do projeto descreve a interface antiga e precisará de revisão junto da entrega; sem isso o Gate de retomada falha | conflita |

**Conflito registrado, sem proposta de mudança de princípio.** O filtro de longevidade pede
substituir dependência sem manutenção; a feature mantém seis bibliotecas vendorizadas de versão
desconhecida porque o escopo negativo do `requirements.md` §6 proíbe trocá-las nesta entrega. O
adaptador é a mitigação, não a solução.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Interface em **React 18 + TypeScript**, empacotada por **esbuild** num único `board.js` de saída | React é restrição imposta pelo solicitante (`requirements.md` §6). esbuild é o empacotador de facto de Webviews de extensão: binário único, sem servidor, saída determinística, configuração de dez linhas | Vite (traz dev server que o Webview não usa); Webpack (configuração desproporcional); Rollup (sem ganho sobre esbuild aqui) | 🟢 |
| D-02 | Domínio de exibição extraído para `src/webview/domain/`, sem DOM, sem React e sem `postMessage` | É o que torna ordenação, filtro, ocultação, colapso e modo exercitáveis por teste sem Webview, exigência de `requirements.md` §6 (Testabilidade) | Testar pela interface renderizada (lento, frágil, exigiria jsdom); manter a lógica nos componentes (repete o erro do `board.js`) | 🟢 |
| D-03 | Paleta **própria** em custom properties CSS, com dois conjuntos completos. "Seguir o editor" escolhe o conjunto lendo a classe `vscode-light` / `vscode-dark` / `vscode-high-contrast` do `<body>`, observada por `MutationObserver` | Consumir `--vscode-*` diretamente tornaria impossível fixar o quadro em claro sobre um editor escuro, o que RF-09 exige. A classe do corpo é atualizada pelo próprio VS Code quando o tema muda, o que dá RF-08 sem recarregar o painel e sem comando novo | Usar `--vscode-*` como cor efetiva (viola RF-09); pedir o tema à extensão por mensagem (atraso e comando desnecessário); `prefers-color-scheme` (não reflete o tema do editor) | 🟡 |
| D-04 | Preferência de **tema** em `globalState`; **ocultação, colapso e modo de visualização** em `workspaceState`, chaveados pelo `fsPath` da pasta | `globalState` é escopo de instalação e não trafega no repositório, exatamente o que RF-10 exige ao proibir criação de arquivo no workspace. `workspaceState` é da janela, não da pasta, e por isso a chave por caminho é necessária num editor multi-root | Configuração `kanban.theme` (aparece no `settings.json` do usuário e, com `scope: resource`, seria por pasta); arquivo `.vscode/vscode-kanban.view` (viaja no Git e impõe a preferência de uma pessoa a quem clonar) | 🟢 |
| D-05 | Dois comandos novos na ponte: `saveViewPreferences` (Webview → extensão) e `setViewPreferences` (extensão → Webview). Os catorze existentes ficam idênticos em nome e formato | RF-04 congela o protocolo existente mas admite comando novo desde que não seja obrigatório para o funcionamento básico: sem `setViewPreferences`, o quadro abre nos padrões | Reaproveitar `saveFilter` com payload composto (quebra o formato de um comando existente); embutir as preferências no `Board` gravado (violaria RF-15) | 🟢 |
| D-06 | Primeira pintura otimista a partir de `vscode.getState()`, corrigida quando `setViewPreferences` chega | Evita o piscar de tema entre o `onLoaded` e a resposta da extensão. O estado do Webview já sobrevive à ocultação por `retainContextWhenHidden` (`_reversa_sdd/state-machines.md#4-painel-do-quadro--ciclo-de-vida`) | Renderizar só após a resposta (tela vazia perceptível); assumir sempre "seguir o editor" na abertura (pisca para quem fixou claro ou escuro) | 🟡 |
| D-07 | A ordenação vira função **pura**, e a ordem ordenada é aplicada explicitamente ao payload de `saveBoard` | O `Array.sort` in place de `board.js:465` faz a ordem exibida virar a ordem gravada (achado E3). RF-03 exige que a sequência **gravada** continue idêntica à da versão anterior, de modo que o efeito precisa ser reproduzido de propósito, e não herdado de um acidente | Parar de normalizar a ordem na gravação (mudaria o arquivo de todo usuário no primeiro salvamento, violando RF-03 e RF-26); manter a mutação (impede testar sem efeito colateral) | 🟢 |
| D-08 | Um adaptador por biblioteca vendorizada sobrevivente, em `src/webview/adapters/`. Saem do documento **jQuery**, **Bootstrap** e **Font Awesome**; permanecem **CodeMirror**, **Mermaid**, **Showdown**, **highlight.js**, **Moment** e **Filtrex** | Exigência de manutenibilidade do `requirements.md` §6. As três que saem são substituídas pelo próprio React e por ícones SVG embutidos; `font-awesome.css` sozinho pesa 1,5 MB e desaparece da carga | Manter jQuery para conviver com o código antigo (dois donos do DOM); trocar as seis bibliotecas agora (proibido pelo escopo negativo) | 🟢 |
| D-09 | Os três diálogos — adicionar, editar e ver detalhes — migram para React e saem de `boards.ts` | Decisão do solicitante na abertura do `/reversa-plan`, resolvendo a `[DÚVIDA]` de `requirements.md` §10. O redesenho amplo de RN-09 seria incoerente com diálogos na estética anterior, e dividir o Webview entre duas pilhas criaria dois donos do estado descrito no ADR-008 | Migrar só o quadro e deixar os diálogos como HTML literal (rejeitada explicitamente) | 🟢 |
| D-10 | `tsconfig.webview.json` próprio, com `strict: true`, `jsx: react-jsx` e `lib: DOM`. O `tsconfig.json` da extensão permanece com `strict: false` | Código novo nasce estrito sem abrir a frente de correção de tipos do legado, que é dívida D6 e não faz parte desta feature | Ligar `strict` no projeto inteiro (dezenas de erros em `workspaces.ts` e `boards.ts`, fora de escopo); deixar o Webview sem `strict` (repete E7) | 🟢 |
| D-11 | **TypeScript 5.x** e `@types/node` compatível entram como pré-requisito da feature | React 18 e a sintaxe `jsx: react-jsx` não são tipáveis com segurança sob TypeScript 4.4.4, hoje pinado. É o cartão [16] do quadro do projeto, promovido a dependência desta entrega | Manter 4.4.4 e usar `React.createElement` sem JSX (ilegível e ainda assim mal tipado); usar `// @ts-nocheck` no Webview (anula D-10) | 🟢 |
| D-12 | O filtro continua avaliado **no Webview**, por Filtrex, atrás do adaptador `filter-language.ts` | Mover a avaliação para o extension host mudaria a latência de cada tecla e o protocolo, ambos fora do escopo. O adaptador isola a troca futura | Avaliar no host (muda protocolo, contraria RF-04); trocar Filtrex por avaliador sem `eval` (feature própria, altera comportamento observável do filtro) | 🟡 |
| D-13 | O harness `src/test/webview.ts` é reapontado para os módulos novos, **preservando a assinatura `call(nome, ...args)`** e os nomes `vsckb_*` como fachada de teste | RF-02 exige que a suíte de caracterização passe **sem alteração de asserções**. Trocar o carregador e manter a fachada satisfaz a letra e o espírito do requisito | Reescrever os testes junto do código (perde-se a rede justamente quando ela é necessária); manter `board.js` só para os testes (código morto que diverge) | 🟢 |
| D-14 | Ordenação, filtro, ocultação e colapso convergem numa única função `computeVisibleBoard(board, viewState)` | RN-06 e RF-21 exigem que colunas e lista mostrem exatamente o mesmo conjunto. Uma função só torna isso estrutural em vez de coincidente | Filtrar em cada componente (duas verdades, divergência garantida entre os modos) | 🟢 |
| D-15 | Corte único de tecnologia, sem alternância em tempo de execução entre a interface antiga e a nova. A entrega é incremental em commits, não em bandeira de configuração | Duas interfaces vivas disputariam o estado autoritativo `allCards` do ADR-008, que é justamente o que a feature não pode duplicar | Feature flag `kanban.useNewUi` (dobra a superfície de teste e perpetua `board.js`) | 🟢 |
| D-16 | `html.ts` passa a emitir `nonce` nos scripts e a mover o bloco embutido para o pacote, deixando o documento pronto para CSP, **sem** ainda declarar a política | O escopo negativo proíbe corrigir C3 nesta feature, mas o requisito não funcional de segurança exige deixar o terreno pronto | Declarar a CSP agora (correção fora de escopo e bloqueada por D-12); não mexer no documento (não cumpre o requisito não funcional) | 🟢 |

## 4. Premissas

A `[DÚVIDA]` de `requirements.md` §10 foi **resolvida** na abertura deste plano: os diálogos
entram no escopo (D-09). Não restam marcadores 🔴 pendentes. As premissas abaixo são inferências
técnicas do plano, e não dúvidas herdadas do requirements.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| O VS Code mantém a classe de tema no `<body>` do Webview e a atualiza ao vivo quando o tema do editor muda | §5 RF-08, via D-03 | RF-08 exigiria uma mensagem nova da extensão a cada `onDidChangeActiveColorTheme`, acrescentando um comando ao protocolo |
| `workspaceState` chaveada por `fsPath` distingue corretamente as pastas de um workspace multi-root | §5 RF-18 e RF-23, via D-04 | A preferência de ocultação vazaria entre pastas da mesma janela; o remédio seria voltar ao arquivo em `.vscode/` |
| Os 58 testes de caracterização cobrem ordenação e filtro em profundidade suficiente para detectar regressão de comportamento | §5 RF-02 | Uma regressão silenciosa passaria pelo gate do `ci.yml`; mitigação em §9 pelo roteiro manual de doze passos |
| Mermaid, Showdown, CodeMirror e highlight.js funcionam quando carregados pelo empacotador em vez de por tag `<script>` global | §6 (compatibilidade) | Alguma delas precisaria continuar como script global, o que mantém poluição no documento sem invalidar o plano |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `board-ui` | `_reversa_sdd/architecture.md#4-componentes-e-responsabilidades` (`src/res/js/board.js`, 2.161 LOC) | componente-extinto | Substituído por `src/webview/`; nenhum arquivo do substituto passa de 400 linhas |
| `webview-utils` | `_reversa_sdd/code-analysis.md#módulo-8--webview-utils` (`src/res/js/script.js`, 520 LOC) | componente-extinto | Filtro migra para `domain/filtering.ts` e `adapters/filter-language.ts`; Markdown, diagramas e realce viram adaptadores; `vsckb_post` vira `bridge/vscode-bridge.ts` |
| `webview-domain` | — | componente-novo | `src/webview/domain/`: modelo, taxonomia, ordenação, filtro, visibilidade e estado de exibição, sem DOM |
| `webview-adapters` | — | componente-novo | `src/webview/adapters/`: fronteira única com CodeMirror, Mermaid, Showdown, highlight.js, Moment e Filtrex |
| `webview-ui` | — | componente-novo | `src/webview/ui/`: barra superior, colunas, coluna colapsada, lista, cartão e os três diálogos |
| `view-preferences` | — | componente-novo | `src/view-preferences.ts` no extension host: leitura e gravação em `globalState` e `workspaceState` |
| `boards` | `_reversa_sdd/code-analysis.md#módulo-3--boards` (`src/boards.ts`, 1.509 LOC) | contrato-novo · regra-alterada | Perde as ~470 linhas de HTML literal (`boards.ts:449-524` e o rodapé dos modais a partir de `:525`); `getContent` passa a devolver o ponto de montagem; ganha os dois manipuladores de D-05. Estimativa: cai para menos de 1.000 linhas |
| `html` | `_reversa_sdd/code-analysis.md#módulo-4--html` (`src/html.ts`, 307 LOC) | regra-alterada | Deixa de emitir seis CSS e dez scripts vendorizados; passa a emitir um pacote com `nonce`; a barra de navegação de `generateNavBarHeader` é absorvida pela interface React, restando o documento mínimo |
| `board.css` / `style.css` | `src/res/css/` | regra-alterada | Substituídos pelos tokens de tema e pelo CSS do pacote; `bootstrap.min.css` e `font-awesome.css` deixam de ser servidos |
| Suíte de caracterização | `src/test/webview.ts`, `card-sorting.unit.test.ts`, `card-filter.unit.test.ts` | contrato-alterado | O carregador VM é trocado por importação direta; **as asserções não mudam** (D-13) |
| Manifesto e compilação | `package.json`, `tsconfig.json` | regra-alterada | Entram React, esbuild e TypeScript 5.x pinados; `build` ganha o passo de empacotamento e deixa de depender de `cp -r` para os arquivos que o pacote absorve |
| Regra RD-18 | `_reversa_sdd/domain.md#33-ordenação-e-apresentação` | regra-alterada | Os três grupos de cor sobrevivem; os tons passam a ser calibrados por tema (RN-11). É a **única** regra de domínio alterada pela feature |

## 6. Delta no modelo de dados

- Resumo das mudanças: **nenhuma mudança no modelo persistido do quadro.** `Board`, `BoardCard`,
  as quatro colunas de `BOARD_COLMNS` e o formato de `.vscode/vscode-kanban.json` ficam
  intactos, o que RF-15 e RF-26 exigem. O que nasce é um modelo **de exibição**, não persistido
  no quadro: `ViewState` com tema, ocultação, colunas colapsadas e modo de visualização,
  guardado nos mementos de D-04. O `__uid` efêmero continua sendo gerado na carga, com a mesma
  fórmula de `board.js:2013`, porque `setCardTag`, `moveCardTo` e os scripts do usuário dependem
  dele.
- Detalhe completo em: `_reversa_forward/001-interface-react-tema-e-done/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Ponte de mensagens Webview ↔ extensão | fila (postMessage) | `_reversa_forward/001-interface-react-tema-e-done/interfaces/webview-bridge.md` |
| API dos scripts de evento do usuário (`.vscode/vscode-kanban.js`) | arquivo executável | `_reversa_forward/001-interface-react-tema-e-done/interfaces/event-script-api.md` |

A integração Toggl e o arquivo de filtro não mudam de contrato: a feature apenas preserva o que
existe.

## 8. Plano de migração

1. **Pré-requisito de toolchain.** Subir TypeScript para 5.x, acertar `@types/node`, acrescentar
   React, tipos e esbuild pinados, criar `tsconfig.webview.json` e o passo de empacotamento no
   `build`. Critério: `npm run build`, `npm run lint` e os 58 testes continuam verdes sem
   nenhuma mudança de código de produção.
2. **Andaime do pacote.** `src/webview/main.tsx` renderiza um componente vazio no ponto de
   montagem; `html.ts` passa a servir o pacote com `nonce`, mantendo `board.js` ainda carregado.
   Critério: o quadro antigo continua funcionando, e o pacote novo carrega sem erro no console.
3. **Domínio primeiro, sem interface.** Portar taxonomia, ordenação, filtro e a nova
   `computeVisibleBoard` para `src/webview/domain/`, com testes próprios. Critério: cobertura de
   `domain/` acima de 60% e as asserções de caracterização passando pela fachada de D-13.
4. **Adaptadores.** Encapsular Showdown, Mermaid, highlight.js, CodeMirror, Moment e Filtrex.
   Critério: nenhuma importação dessas bibliotecas fora de `adapters/`, verificável por lint.
5. **Quadro em React.** Colunas, cartões, arrastar e mover, com a ponte de mensagens completa.
   `board.js` e `script.js` saem do documento neste passo. Critério: o roteiro manual de doze
   passos produz `.vscode/vscode-kanban.json` idêntico ao da versão anterior.
6. **Diálogos.** Adicionar, editar e ver detalhes, com o editor de código atrás do adaptador. As
   ~470 linhas de HTML literal saem de `boards.ts`. Critério: os campos gravados por cada
   diálogo são os mesmos, inclusive o limite de 255 caracteres do título registrado em G-18.
7. **Tema.** Tokens dos dois conjuntos, controle tri-estado, observação da classe do corpo e
   persistência em `globalState` pelos comandos de D-05. Critério: cenários de RF-06 a RF-11.
8. **Ocultação, colapso e modo lista.** Derivados da `computeVisibleBoard` do passo 3, com
   persistência em `workspaceState`. Critério: cenários de RF-12 a RF-23.
9. **Contraste e acessibilidade.** Calibração dos três grupos de cor nos dois temas, nomes
   acessíveis e foco visível. Critério: RF-24 e RF-27.
10. **Limpeza.** Remover `board.js`, `script.js`, `board.css`, `style.css`, `bootstrap.min.css`,
    `font-awesome.css`, `jquery.min.js` e `bootstrap.bundle.min.js` do repositório e do `build`.
    Atualizar `README.md` e as capturas de tela. Critério: `git grep jquery` sem ocorrência em
    código de produção.

**Migração de dados: n/a.** Nenhum arquivo de usuário muda de formato, e não há passo de
conversão na carga.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Regressão silenciosa de comportamento na reescrita do `board.js` | alto | alta | Rede de caracterização do commit `6d99e58` preservada por D-13; roteiro manual de doze passos comparando o JSON gravado antes e depois; gate do `ci.yml` |
| A ordem gravada mudar por deixar de mutar o quadro na ordenação (achado E3) | alto | média | D-07 reproduz o efeito de propósito; teste dedicado comparando o arquivo gravado com o da versão 1.33.1 para o mesmo roteiro |
| Filtrex compilar com `new Function` (`filtrex.js:57`) e Mermaid usar avaliação dinâmica, impedindo uma CSP sem `'unsafe-eval'` | médio | alta | Registrado em D-12 e D-16: a feature deixa o documento pronto, mas a CSP restritiva de verdade dependerá de trocar o avaliador de filtro, em feature própria |
| Bibliotecas vendorizadas de versão desconhecida (G-11) não funcionarem sob empacotador | médio | média | Passo 4 do plano isola cada uma atrás de adaptador; a que resistir pode continuar como script global sem invalidar o desenho |
| Subir TypeScript para 5.x quebrar a compilação da extensão, que roda com `strict: false` | médio | média | D-10 mantém o `tsconfig.json` antigo intacto; o passo 1 é entregue e verificado isoladamente, antes de qualquer código novo |
| O escopo crescer para dentro de `workspaces.ts`, que continua com 1.134 linhas | médio | média | O escopo negativo do `requirements.md` §6 é explícito; `boards.ts` só perde HTML e ganha dois manipuladores |
| Perder o comportamento de `retainContextWhenHidden`, hoje responsável por o quadro sobreviver à troca de aba | médio | baixa | O estado React vive na mesma sessão do documento; teste manual de trocar de aba com filtro aplicado e diálogo aberto |
| A remoção do Bootstrap alterar o comportamento dos modais, que hoje usam `data-dismiss` e `data-keyboard="false"` | baixo | média | Os diálogos são reimplementados com semântica equivalente no passo 6, incluindo o bloqueio de fechamento por tecla |
| O `README.md` continuar descrevendo a interface antiga | baixo | alta | Passo 10 do plano; é também o conflito de princípio registrado em §2 |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] Os 58 testes de caracterização passam **sem alteração de asserção** (RF-02)
- [ ] Cobertura de `src/webview/domain/` igual ou superior a 60%
- [ ] Nenhum arquivo de `src/webview/` acima de 400 linhas e nenhuma função acima de 50
- [ ] `npm run lint`, `npm run build`, `npm run test:unit` e `npm test` verdes no `ci.yml`
- [ ] Roteiro de `onboarding.md` executado, com o JSON do quadro idêntico antes e depois
- [ ] `git grep -i "jquery\|bootstrap\|font-awesome"` sem ocorrência em código de produção
- [ ] `README.md` atualizado com a interface nova

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-02 | Versão inicial gerada por `/reversa-plan`, com a `[DÚVIDA]` de fronteira da reconstrução resolvida na abertura em favor de migrar também os diálogos | reversa |
