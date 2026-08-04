# Investigação: nova interface do quadro

> Identificador: `001-interface-react-tema-e-done`
> Data: `2026-08-02`
> Alimenta as decisões D-01 a D-16 do `roadmap.md`

## 1. Perguntas que a investigação precisava responder

1. Como um Webview de extensão descobre o tema do editor e reage à troca dele sem recarregar?
2. Onde guardar preferência de interface por instalação e por pasta, sem tocar o quadro nem o repositório?
3. Que empacotador cabe num projeto de mantenedor intermitente, sem servidor de desenvolvimento?
4. O que exatamente quebra ao trocar `board.js` por React, dado que a suíte de caracterização carrega esse arquivo?
5. O que impede, hoje, uma política de segurança de conteúdo restritiva?

## 2. Achados por pergunta

### 2.1 Tema do editor dentro do Webview

O VS Code aplica ao `<body>` do Webview uma classe que identifica o tipo de tema ativo —
`vscode-light`, `vscode-dark`, `vscode-high-contrast` — e injeta um conjunto de custom
properties `--vscode-*` com as cores do tema corrente. Ambos são atualizados quando o usuário
troca de tema, sem recriar o documento. 🟡

Consequência para RF-08: o quadro pode acompanhar o editor **sem** mensagem nova da extensão,
bastando observar a classe do corpo. Consequência para RF-09: se o quadro pintasse com
`--vscode-*` diretamente, fixá-lo em claro sobre um editor escuro seria impossível, porque as
variáveis seguem o editor. Daí a paleta própria de D-03: dois conjuntos de tokens sob controle
do quadro, e a classe do corpo servindo apenas para escolher qual deles vale quando a
preferência é "seguir o editor".

Confirmação pendente na execução: o comportamento acima é o documentado para Webviews, mas não
está observado neste projeto, que hoje ignora o tema por completo (`html.ts:167-172` carrega
`bootstrap.min.css` e temas fixos de Mermaid). O passo 7 do plano de migração é onde isso se
comprova.

### 2.2 Onde guardar preferência de interface

O sistema já usa três escopos de persistência, catalogados em
`_reversa_sdd/architecture.md#7-persistência`:

| Escopo | Mecanismo atual | Viaja no Git? |
|---|---|---|
| Workspace | `.vscode/vscode-kanban.json`, `.vscode/vscode-kanban.filter` | sim |
| Usuário | `globalState` (versão vista do aviso, silenciamento) | não |
| Usuário, disco | `~/.vscode-kanban/.logs/` | não |

O `globalState` já é usado exatamente para preferência de pessoa, no aviso de recrutamento
(`_reversa_sdd/state-machines.md#6-aviso-de-recrutamento`), e é a única máquina de estado do
sistema com escopo de usuário. Isso torna D-04 uma extensão de padrão existente, e não uma
invenção.

Ponto de atenção descoberto: `workspaceState` tem escopo de **janela**, não de pasta, enquanto
a extensão instancia um `Workspace` por pasta (`_reversa_sdd/architecture.md#2-visão-de-alto-nível`).
Num workspace multi-root, guardar a ocultação sem chave por caminho faria as pastas
compartilharem a mesma preferência, contrariando o cenário "Ocultação é preferência do projeto"
de `requirements.md` §7. Daí a chave por `fsPath`.

### 2.3 Empacotador

| Opção | Custo de configuração | Dev server | Determinismo | Situação upstream |
|---|---|---|---|---|
| **esbuild** | ~10 linhas de script | não precisa | binário pinado, saída estável | mantida, releases frequentes |
| Vite | moderado | traz um que o Webview não usa | bom | mantida |
| Webpack | alto | não | bom | mantida, mas configuração desproporcional |
| Rollup | moderado | não | bom | mantida |

Para uma extensão sem interface web servida por HTTP, o dev server de Vite é peso morto: o
Webview carrega arquivos por `vscode-resource`, e o ciclo de desenvolvimento é recompilar e
reabrir o painel. esbuild vence pelo critério de longevidade do mantenedor — poucas linhas de
configuração para reler daqui a doze meses, sem ecossistema de plugins a manter.

Custo: gratuito, MIT, instalado como dependência de desenvolvimento pinada.

### 2.4 O que quebra ao remover `board.js`

A rede de testes criada em `6d99e58` carrega `filtrex.js`, `moment-with-locales.min.js`,
`script.js` e `board.js` num contexto `vm` com stubs de jQuery e `document`
(`src/test/webview.ts:74-79`). As asserções chamam funções globais por nome:

```ts
webview.call('vsckb_get_card_prio_sort_val', { prio: '5xyz' })   // card-sorting.unit.test.ts:63
webview.call('vsckb_does_match', expr, { values })               // card-filter.unit.test.ts:40
webview.set('allCards', { todo: cards })                          // card-sorting.unit.test.ts:40
```

Remover `board.js` derruba as três formas ao mesmo tempo. Como RF-02 exige que a suíte passe
**sem alteração de asserções**, a saída é substituir o corpo de `loadWebview()` mantendo a
interface: `call` roteia nome antigo → função nova, `set` alimenta o estado que a função nova
recebe por parâmetro. Isso obriga a preservar detalhes que os testes travaram de propósito,
entre eles:

- `vsckb_does_match` devolve **1**, não `true`, para `'1 == 1'` (`card-filter.unit.test.ts:151`);
- expressão quebrada devolve verdadeiro, mostrando todos os cartões (`script.js:213-217`);
- prioridade suja conta pelo prefixo numérico: `'5xyz'` vale 5, `'abc'` vale 0;
- peso de tipo ignora caixa e espaços: `'  EMERGENCY  '` vale −2.

Esses quirks entram no domínio novo como comportamento **deliberado**, documentado no código,
não como bug herdado por descuido.

### 2.5 O que impede a CSP restritiva

Três obstáculos, dois deles fora do alcance desta feature:

| Obstáculo | Evidência | Sai com esta feature? |
|---|---|---|
| Script embutido no `<head>` (`acquireVsCodeApi`, `vsckb_log`, `window.onerror`) | `html.ts:186-219` | sim — vai para o pacote, com `nonce` (D-16) |
| Filtrex compila a expressão com `new Function` | `src/res/js/filtrex.js:57` | não — exigiria `'unsafe-eval'` ou trocar o avaliador (D-12) |
| Mermaid usa avaliação dinâmica | `src/res/js/mermaid/mermaid.js` | não — escopo negativo proíbe substituí-la |

Conclusão registrada como risco no `roadmap.md` §9: a feature entrega um documento **compatível**
com CSP, no sentido de não depender de código em atributo nem de script embutido sem `nonce`,
mas a política que vier depois nascerá com `'unsafe-eval'` enquanto Filtrex e Mermaid estiverem
no Webview. Isso não é regressão — hoje não há política alguma (achado C3) —, e sim o teto
honesto do que a reconstrução alcança sozinha.

## 3. Alternativas avaliadas e descartadas

| Alternativa | Por que foi considerada | Por que foi descartada |
|---|---|---|
| Repintura do CSS sem trocar `board.js` | Custo muito menor; entregaria tema e ocultação em dias | Deixa os 2.161 linhas em escopo global intactos e violaria RF-01, que é a condição da feature. Tema e ocultação virariam mais dívida sobre a dívida |
| Migração progressiva com React montado dentro de contêineres do `board.js` | Permitiria entregar por partes, com rollback fácil | Dois donos do estado autoritativo do ADR-008; jQuery e React disputando o mesmo DOM; o custo de sincronizar `allCards` entre as pilhas supera o da reescrita |
| Preact em vez de React | Pacote muito menor, API compatível | React é restrição imposta pelo solicitante em `requirements.md` §6. Registrado aqui para o caso de o limite de 500 KB apertar |
| Guardar o `ViewState` dentro do próprio `vscode-kanban.json`, num campo novo | Persistência trivial, sem comando novo | Viola RF-15 de frente: o arquivo mudaria a cada alternância de tema, e a preferência de uma pessoa viajaria no repositório de todas |
| Colunas customizáveis junto do colapso | O colapso já mexe na renderização das colunas | Escopo negativo explícito de `requirements.md` §6; RD-02 proíbe criar, remover e reordenar colunas |
| Trocar Showdown por `marked`, já presente nas dependências de produção | Reduziria uma vendorizada e unificaria o conversor com o do changelog | Muda o HTML gerado a partir do mesmo Markdown, alterando comportamento observável do cartão; `marked` 4 ainda usa opções removidas nas versões seguintes (dívida D12). Merece feature própria |

## 4. Padrões aplicáveis

- **Ports and adapters na fronteira das bibliotecas.** Cada vendorizada sobrevivente recebe uma
  interface estreita no domínio e uma implementação em `adapters/`. É o que permite a substituição
  futura de editor, diagramas ou conversor ser local, exigência do `requirements.md` §6.
- **Estado derivado por função pura.** `computeVisibleBoard(board, viewState)` é a única fonte do
  que aparece, nos dois modos de visualização (D-14). Evita a divergência que hoje existe entre
  filtro, seletor e cores, catalogada em G-17.
- **Fachada de compatibilidade em teste.** Manter os nomes `vsckb_*` como superfície de teste
  enquanto o código de produção já usa nomes novos é o que permite trocar a implementação sem
  tocar asserção, técnica clássica de refatoração sob rede de caracterização.
- **Tokens de tema em custom properties.** Uma variável por papel semântico (fundo do quadro,
  fundo do cartão, texto, borda, cor de cada grupo de tipo), com dois conjuntos completos. O
  componente nunca escolhe cor, apenas papel.

## 5. Fontes

Internas, todas do repositório:

- `_reversa_sdd/architecture.md` §1, §4, §7, §8, §9, §11
- `_reversa_sdd/code-analysis.md` módulos 3, 4, 7 e 8, síntese e métricas
- `_reversa_sdd/domain.md` §3.1, §3.3, §3.4, §3.5, §3.8
- `_reversa_sdd/state-machines.md` §4 e §6
- `_reversa_sdd/gaps.md` G-11, G-17, G-18
- `_reversa_sdd/adrs/003-interface-em-webview-com-jquery-vendorizado.md` e `008-estado-autoritativo-no-webview.md`
- Código: `src/html.ts`, `src/boards.ts`, `src/res/js/board.js`, `src/res/js/script.js`, `src/res/js/filtrex.js`, `src/test/webview.ts`
- Commits `d478cca` (build destravado), `6d99e58` (rede de caracterização), `6a1bcc0` (gate de CI)

Externas: nenhuma consultada nesta sessão. O comportamento de tema do Webview descrito em §2.1
está marcado 🟡 e deve ser confirmado na execução do passo 7, ou verificado na documentação
oficial de Webviews do VS Code antes dele.
