# Vigilância de regressão

> Identificador: `001-interface-react-tema-e-done`
> Criado em: `2026-08-02`
> O que este arquivo é: a lista do que precisa continuar verdadeiro nas próximas extrações
> `/reversa`. Cada item nasceu de uma regra 🟢 que esta feature alterou ou de um contrato que ela
> prometeu preservar.

## Itens em vigilância

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| W001 | `_reversa_sdd/code-analysis.md#módulo-7--board-ui`, achado E3 | A ordem gravada em `.vscode/vscode-kanban.json` continua sendo a ordem ordenada (prioridade, tipo, título), agora por `sortBoardForPersistence` e não por mutação | `presença` | A extração descreve a ordenação como não mutante **sem** mencionar que a ordem persistida é normalizada na gravação; ou o arquivo de um usuário passa a sair na ordem de inserção |
| W002 | `_reversa_sdd/domain.md#33-ordenação-e-apresentação`, RD-14 a RD-17 | Os três critérios de ordenação seguem inalterados, incluindo prioridade suja pelo prefixo numérico e título insensível a caixa e espaços | `redação` | Qualquer um dos três critérios aparece com outra ordem, outro peso, ou some da extração |
| W003 | `_reversa_sdd/domain.md#33-ordenação-e-apresentação`, RD-18 | Os três grupos de cor — `emergency`, `bug`, demais — continuam existindo. Os **tons** passam a ser calibrados por tema | `redação` | A extração descreve os grupos com valores fixos de cor, ou reduz os três a menos de três |
| W004 | `_reversa_sdd/domain.md#31-estrutura-do-quadro`, RD-01 e RD-02 | Continuam quatro colunas fixas. Colapso e modo lista são exibição e não criam, removem nem reordenam coluna | `presença` | A extração descreve coluna criável, removível ou reordenável; ou o colapso aparece como campo do arquivo do quadro |
| W005 | `_reversa_sdd/domain.md#34-filtro`, RD-20 a RD-23 | O filtro continua afetando apenas a exibição, expressão inválida continua mostrando todos os cartões, e a ocultação compõe-se com ele por conjunção | `presença` | A extração descreve o filtro apagando ou movendo cartão, ou expressão inválida escondendo tudo |
| W006 | `_reversa_sdd/code-analysis.md#módulo-3--boards`, protocolo de mensagens | Os catorze comandos continuam com o mesmo nome e o mesmo formato de dados. `saveViewPreferences` e `setViewPreferences` são acréscimos opcionais | `presença` | Algum dos catorze desaparece, muda de nome, muda de payload; ou um comando novo vira obrigatório para o quadro abrir |
| W007 | `_reversa_sdd/domain.md#38-eventos-e-extensibilidade`, RD-42 a RD-48 | Os sete eventos continuam disparando nos mesmos momentos, com `others` e `__uid` iguais. Alternar tema, ocultação, colapso ou modo **não** dispara evento algum | `ausência` | A extração registra evento novo ligado à interface, ou perda de `others`; ou um script de log registra chamada durante alternância de controle |
| W008 | `_reversa_sdd/erd-complete.md` e `data-dictionary.md` | O modelo persistido do quadro segue sem campo novo, sem campo removido e sem migração na carga | `ausência` | Qualquer campo de exibição (tema, ocultação, colapso, modo) aparece dentro de `.vscode/vscode-kanban.json` |
| W009 | `_reversa_sdd/code-analysis.md#módulo-8--webview-utils`, achado C4 | A barreira de sanitização do conteúdo do cartão continua existindo, igual ou mais estrita. Nunca menos | `presença` | A extração descreve o Markdown do cartão sem nenhuma etapa de sanitização, ou com conjunto de elementos permitidos maior que o de hoje |
| W010 | `_reversa_sdd/architecture.md#7-persistência` | A preferência de tema vive em escopo de usuário e **não** cria nem altera arquivo dentro das pastas de workspace | `ausência` | Aparece um arquivo novo em `.vscode/` para preferência de interface, ou a extração descreve o tema como configuração de workspace |
| W011 | `_reversa_sdd/code-analysis.md#módulo-4--html`, achado C3 | Todo script do documento carrega `nonce`. A ausência de política de segurança de conteúdo permanece um achado em aberto, não resolvido por esta feature | `presença` | A extração deixa de registrar C3 como aberto sem que uma política tenha sido de fato declarada; ou algum script volta a ser emitido sem `nonce` |

### Acrescentados em 2026-08-03, ao concluir a entrega

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| W012 | `_reversa_sdd/domain.md#33-ordenação-e-apresentação`, RD-18 | Os três grupos de cor continuam distinguíveis **por luminância além do matiz**, e o tipo continua aparecendo como texto na faixa do cartão. Contraste de texto ≥ 4,5:1 nos dois temas | `presença` | A extração descreve os grupos distinguíveis apenas por matiz; ou algum par texto/fundo dos tokens cai abaixo de 4,5:1 |
| W013 | `_reversa_sdd/code-analysis.md#módulo-7--board-ui`, achado E3 | `toSavePayload` é o **único** lugar que aplica a ordenação ao que vai para o disco. Nenhuma função de exibição volta a mutar o quadro | `ausência` | A extração descreve ordenação mutando o quadro; ou aparece um segundo caminho de gravação que não passa por `toSavePayload` |
| W014 | `_reversa_sdd/code-analysis.md#módulo-7--board-ui` | A barra de progresso do cartão continua contando a **fonte** Markdown, e continua aparecendo só quando há ao menos um item marcado | `redação` | A extração descreve a contagem lendo HTML renderizado; ou a barra passa a aparecer com zero itens marcados |
| W015 | `_reversa_sdd/code-analysis.md#módulo-8--webview-utils`, achado C4 | A barreira remove, além de `<script>`, os elementos que executam ou buscam, os atributos `on*` e os esquemas de URL fora da lista permitida | `presença` | O conjunto de elementos ou atributos removidos encolhe em relação a `adapters/html-sanitizer.ts` |
| W016 | `boards.ts:746` e `board.js:113` (legado), agora `ui/dialogs/EditCardDialog.tsx` | O corte de 255 caracteres continua valendo **apenas para a descrição do diálogo de edição**, e continua sendo defeito conhecido, não regra de negócio | `redação` | A extração descreve o limite como sendo do título; ou o limite passa a valer também no diálogo de adicionar, mudando o que se grava |
| W017 | `_reversa_sdd/code-analysis.md#módulo-3--boards`, protocolo de mensagens | `moveCardTo` e `setCardTag` continuam endereçando o cartão pelo campo `uid` do payload | `redação` | A extração ou o contrato descrevem o campo como `card`, divergindo do código, sem que o código tenha mudado |
| W018 | `_reversa_sdd/domain.md#38-eventos-e-extensibilidade`, RD-42 a RD-48 | `others` continua sendo um quadro **parcial**: coluna sem outro cartão fica ausente do objeto, não presente e vazia | `redação` | A extração descreve `others` como lista, ou como quadro com as quatro colunas sempre presentes |

## Observações, sem peso de regressão

Itens que nasceram 🟡 ou 🔴 na extração, ou que ainda não foram implementados. Não valem como
regressão, mas merecem leitura na próxima passagem:

- **Ainda não implementado nesta rodada:** o controle de tema, a ocultação na interface, o modo
  lista, os diálogos em React e os dois comandos novos da ponte. `board.js` continua sendo quem
  desenha o quadro. W003, W006 e W010 só se tornam verificáveis de verdade quando T024 a T033
  estiverem prontas.
- **Filtrex e a política de segurança** (🟡): `filtrex.js:57` compila com `new Function`, e o
  Mermaid usa avaliação dinâmica. Uma política restritiva futura nascerá com `'unsafe-eval'`
  enquanto os dois estiverem no Webview.
- **Vocabulário divergente de tipo** (G-17, 🟢 cosmético): `issue` e `task` continuam
  reconhecidos pelo filtro e ausentes do seletor, e `issue` continua sem receber a cor de bug.
  Preservado de propósito; unificá-lo mudaria o comportamento do filtro.
- **Geração de identificador** (G-01, 🔴): o defeito quadrático e dependente da ordem das colunas
  permanece em `boards.ts`. Corrigi-lo mudaria identificadores de quadros existentes.
- **`workspaces.ts`** (🔴 estrutural): segue com 1.134 linhas e cinco responsabilidades. Fora do
  escopo desta feature.

### Atualização de 2026-08-03

A primeira observação acima **está superada** e fica registrada apenas como histórico: o controle de
tema, a ocultação, o modo lista, os diálogos em React e os dois comandos novos da ponte foram
entregues nesta rodada, e `board.js` deixou de desenhar o quadro. W003, W006 e W010 passaram a ser
verificáveis de fato.

O que continua valendo das demais observações, mais o que apareceu agora:

- **Filtrex e a política de segurança** (🟡): inalterado. `filtrex.js:57` segue compilando com
  `new Function`. O `nonce` está no documento; a política, não.
- **Vocabulário divergente de tipo** (G-17): preservado e agora coberto por teste
  (`card-environment.unit.test.ts`).
- **Geração de identificador** (G-01, 🔴): o defeito de `boards.ts` permanece. A regra foi portada
  fielmente para `domain/card-id.ts`, o que agora significa que ela existe em **dois** lugares —
  é exatamente o cartão [12] do quadro do projeto, e a duplicação piorou, não melhorou.
- **`workspaces.ts`** (🔴 estrutural): 1.174 → 1.192 linhas. Ganhou dezoito ao ligar o serviço
  de preferências. Fora do escopo desta feature, e um pouco maior do que antes.
- **`board.js` e `script.js` como oráculo:** saíram da extensão mas permanecem em
  `reference/legacy/`, lidos por `scripts/capture-reference.js`. Não são código de produção e não
  entram no pacote publicado. Podem ser removidos depois que `T043` e `T050` forem concluídas.
- **Capturas de tela do README:** pendentes. Exigem o editor rodando.

## Histórico de re-extrações

<!-- Preenchido pelo agente reverso quando '/reversa' rodar de novo. -->

| Data | Extração | Itens verificados | Violações |
|------|----------|-------------------|-----------|
| — | — | — | — |

## Arquivadas

<!-- Itens que deixaram de fazer sentido, com a razão e a data. -->

Nenhuma.
