# Requirements: número do cartão visível na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

O cartão do quadro carrega um identificador desde sempre, mas a interface nunca o mostrou:
o número existe no arquivo, é atribuído na carga e serve de endereço em conversa, sem que
nada na tela o revele. A consequência aparece todo dia nesta oficina — o agente que opera o
quadro cita "o cartão [12]" e o mantenedor precisa abrir o JSON para descobrir de qual se
fala. Esta feature põe o número na face do cartão, nos dois layouts, e expõe o valor
integral no diálogo de detalhes. Nada muda no arquivo, na geração do identificador nem no
contrato com os scripts do usuário: é exibição do que já está gravado.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/domain.md#3.2 Cartões` | RD-07: todo cartão recebe `id` na carga, se não tiver. RD-08: por padrão o `id` é um inteiro sequencial (`simpleIDs: true`) | 🟢 |
| `_reversa_sdd/domain.md#3.2 Cartões` | Nota "A origem de `simpleIDs`": a issue #17 pediu identificadores legíveis **justamente para citar "o cartão 42" numa conversa**, e a configuração entrou com padrão verdadeiro na 1.22.0. O identificador legível foi entregue; a exibição, não | 🟢 |
| `_reversa_sdd/domain.md#2 Glossário` | `id` é a identidade **persistente** do cartão, distinta do `__uid`, que é efêmero de sessão e não deve ser exibido | 🟢 |
| `_reversa_sdd/code-analysis.md#Módulo 3 — boards` | A normalização da carga preenche `id` vazio; `findNextSimpleCardId` varre as quatro colunas e devolve o maior inteiro mais um, ignorando identificadores textuais | 🟢 |
| `_reversa_sdd/gestao-de-cartoes/requirements.md` | Unidade que responde pelo ciclo de vida do cartão, incluindo a atribuição de identidade | 🟢 |
| `_reversa_sdd/addenda/002-primer-design-system.md` | Adendo **vigente**: a interface passou a consumir um sistema de design mantido por terceiro. O cartão continua sendo composição própria do projeto (`src/webview/ui/Card.tsx`), e os dois layouts — colunas e lista — desenham o mesmo cartão | 🟢 |
| `_reversa_sdd/domain.md#3.6 Exportação` | RD-33: o arquivo Markdown exportado é nomeado por coluna, **índice de posição** e título — o `id` não entra no nome nem no conteúdo | 🟢 |
| Cartão `[12]` do quadro do projeto | A regra de geração de identificador existe duas vezes, em `src/webview/domain/card-id.ts` e em `src/boards.ts`; divergirem produz identidades inconsistentes | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Mantenedor único | Saber, olhando a tela, qual cartão o agente acabou de citar | Lê "movi o cartão [35] para Testing" no chat e localiza `[35]` no quadro sem abrir o JSON |
| Mantenedor único | Citar de volta um cartão para o agente sem descrevê-lo por extenso | Vê `[16]` no cartão da coluna Todo e escreve "fecha o [16]" |
| Agente do harness | Referir-se a cartões por um endereço curto e estável | Já o faz hoje; a feature apenas torna o endereço legível do outro lado |
| Usuário de leitor de tela | Distinguir dois cartões de título parecido | O nome acessível do cartão passa a começar pelo número |

Frequência: toda sessão de trabalho no projeto. É o atrito mais repetido da operação atual do
quadro, e o único que não exige código novo de domínio para desaparecer.

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O número exibido é o campo `id` do cartão, lido tal como está no arquivo. A
   interface não o gera, não o corrige e não o renumera. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#3.2 Cartões` (RD-07, RD-08)
   - Tipo: nova
2. **RN-02:** A notação de exibição é `[N]` — colchetes em volta do valor —, idêntica à que o
   agente já usa em conversa e a que o próprio código do projeto usa ao se referir a cartões
   (`src/webview/domain/identity.ts:13`). Coincidir a notação é o que faz a citação ser
   resolvida sem tradução mental. 🟢
   - Tipo: nova
3. **RN-03:** O `__uid` jamais é exibido. Ele é efêmero, muda a cada carga e citá-lo não
   endereça nada entre sessões. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2 Glossário`
   - Tipo: nova
4. **RN-04:** O identificador não é garantidamente único. O contador ignora identificadores
   textuais, e duas sessões que editem o mesmo quadro produzem o mesmo número; a extração
   registra a fragilidade e o cartão `[12]` do quadro registra a causa. A exibição, portanto,
   mostra o que há, sem prometer unicidade — e **sem sinalizar a repetição**, nem no cartão
   nem ao abrir o quadro. Detectar duplicatas custaria uma varredura por pintura e uma
   variedade de cartão a mais, preço alto para um caso raro num quadro de mantenedor único
   (sessão de esclarecimento de 2026-08-04). 🟡
   - Origem no legado: `_reversa_sdd/code-analysis.md#Módulo 3 — boards`
   - Tipo: nova
5. **RN-05:** O identificador longo (`simpleIDs: false`) tem cerca de cinquenta caracteres e
   não cabe no cartão. Nesse caso o cartão mostra os **seis últimos** caracteres, precedidos
   de reticências — `[…a1b2c3]` —, e o valor integral fica no diálogo de detalhes e no
   atributo de título do elemento. O fim da cadeia é a parte que discrimina: o começo é o
   carimbo de tempo, idêntico entre cartões criados no mesmo segundo. 🟡
   - Origem no legado: `_reversa_sdd/domain.md#3.2 Cartões` (RD-08)
   - Tipo: nova

> O projeto ainda não tem `.reversa/principles.md`. Nenhuma das regras acima foi confrontada
> com princípios registrados, porque não há princípios registrados a confrontar.

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Todo cartão exibe seu identificador no próprio corpo, sem que nenhum diálogo precise ser aberto | Must | Num quadro com três cartões de `id` `1`, `2` e `3`, os três números aparecem na primeira pintura; teste de renderização do componente encontra os três textos | 🟢 |
| RF-02 | A exibição usa a notação `[N]` | Must | O cartão de `id` `5` mostra literalmente `[5]`, com os colchetes | 🟢 |
| RF-03 | Os dois layouts mostram o número: o de colunas e o de lista | Must | O mesmo quadro, aberto largo e estreito, mostra o número do cartão nas duas larguras; o teste de paridade de vistas confirma a presença nos dois | 🟢 |
| RF-04 | O número abre a linha do título, na mesma linha e em tom secundário, dentro do bloco de informação do cartão | Must | Na ordem do documento e na tela, o número precede o título e compartilha com ele a primeira linha; um cartão sem tipo e sem botões, cuja faixa superior é inteiramente omitida, continua mostrando o número | 🟢 |
| RF-05 | O número não rouba espaço do título nem o empurra para linha extra em coluna estreita | Must | Com título de sessenta caracteres numa coluna de duzentos e quarenta pixels, o título continua ocupando as mesmas linhas que ocupava antes da feature | 🟡 |
| RF-06 | O nome acessível do cartão inclui o número | Must | O rótulo acessível do cartão de `id` `5` e título `Foo` é `[5] Foo`; leitor de tela anuncia o número antes do título | 🟢 |
| RF-07 | O diálogo de detalhes ganha uma linha com o identificador **integral**, sem encurtamento | Must | Cartão de identificador longo mostra a cadeia inteira no diálogo, ao lado dos campos de tipo, prioridade e categoria já presentes | 🟢 |
| RF-08 | O texto do número é selecionável e copiável com o ponteiro | Should | Nenhuma regra de estilo aplica supressão de seleção sobre o elemento; a seleção do texto `5` e sua cópia funcionam no editor | 🟡 |
| RF-09 | Identificador longo é encurtado no cartão para os seis últimos caracteres, precedidos de reticências, com o valor integral no atributo de título do elemento | Should | Com `simpleIDs: false`, o cartão de identificador `20260804123456_412345678_a1b2c3d4e5f6a7b8` mostra `[…f6a7b8]`, e o passar do ponteiro revela a cadeia completa | 🟡 |
| RF-10 | Cartão cujo `id` esteja ausente ou vazio renderiza **sem** o marcador, em vez de exibir um valor de sentinela | Must | Um cartão construído sem `id` não produz `[]`, `[undefined]` nem `[null]`; o restante do cartão é pintado normalmente | 🟢 |
| RF-11 | A classe do novo elemento segue o prefixo `vsckb-` das demais | Must | O seletor do elemento começa por `vsckb-card-`, coerente com `vsckb-card-title` e `vsckb-card-category` | 🟢 |

### Escopo negativo

Não faz parte desta feature, e cada item tem dono declarado:

- **Alterar a geração de identificadores** — nem o padrão `simpleIDs`, nem a renumeração de
  cartões existentes. Renumerar quebraria `references` e os scripts do usuário
  (`src/webview/domain/card-id.ts:9-13`).
- **Unificar a regra de geração duplicada** entre `card-id.ts` e `boards.ts` — é o cartão
  `[12]` do quadro, com dependência declarada no cartão `[10]`.
- **Buscar ou filtrar cartões pelo número** — pertence ao cartão `[2]`, que troca o filtro
  digitável por controles visuais.
- **Mudar o formato do arquivo** `.vscode/vscode-kanban.json`.
- **Tornar o identificador único** — RN-04 declara a fragilidade; corrigi-la é outro trabalho.
- **Exibir o número no formulário de edição** — decidido na sessão de esclarecimento de
  2026-08-04. O cartão e o diálogo de detalhes bastam para resolver a citação do agente, que
  é o problema que originou a feature.
- **Levar o número à exportação Markdown**, seja no corpo do `.card.md`, seja no seu nome —
  mesma sessão. O nome do arquivo é contrato já observado (RD-33), e mudá-lo renomearia toda
  exportação existente por um ganho que ninguém pediu.

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Manutenibilidade | Nenhum valor visual literal — cor, raio, sombra, tamanho de fonte — no elemento novo; só os conjuntos nomeados do sistema de design | `src/test/visual-literals.unit.test.ts` reprova literais em `src/webview/ui/` e em `theme/board.css`, por RF-01 e RF-24 da feature `002` | 🟢 |
| Manutenibilidade | O arquivo que hoje descreve o cartão está a sessenta e seis linhas do teto de quatrocentas; a feature cabe nesse orçamento ou reparte o arquivo | `src/test/source-limits.unit.test.ts`, RF-23 da feature `002` | 🟢 |
| Desempenho | Um quadro de cem cartões continua pintando a primeira tela em até um segundo | RNF herdado da feature `002`, ação `T067` | 🟡 |
| Acessibilidade | Contraste do número contra o fundo do cartão nos quatro estados de tema, ao menos o nível AA das diretrizes de acessibilidade para conteúdo da web (WCAG, *Web Content Accessibility Guidelines*) para texto pequeno | `src/test/theme-contrast.unit.test.ts` já guarda o critério para os demais textos do cartão | 🟢 |
| Compatibilidade | A classe nova não tem equivalente na interface de 1.33.1, porque o número nunca foi exibido; ela **acrescenta** superfície de estilo, sem renomear nem remover nada do mapa de compatibilidade | `src/webview/theme/legacy-compat.ts`; cartão `[35]` do quadro trata do CSS customizado do usuário | 🟡 |
| Regressão | Nenhuma asserção da suíte existente é alterada por esta feature | Regra herdada do ciclo forward: a suíte é a base de comparação, não o alvo | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: o número aparece no cartão
  Dado um quadro cujo cartão da coluna Todo tem id "5" e título "Corrigir o editor"
  Quando o quadro é aberto
  Então o cartão mostra "[5]" adjacente ao título, sem que nenhum diálogo seja aberto

Cenário: a citação do agente é resolvida na tela
  Dado que o agente escreveu "movi o cartão [35] para Testing"
  E que o quadro está aberto no layout de colunas
  Quando o mantenedor procura o cartão na coluna Testing
  Então há um e apenas um cartão marcado "[35]"

Cenário: o layout de lista também numera
  Dado um painel estreito, em que o quadro usa o layout de lista
  Quando o quadro é pintado
  Então cada cartão da lista mostra o seu número, na mesma notação do layout de colunas

Cenário: título longo em coluna estreita
  Dado um cartão de título com sessenta caracteres
  E uma coluna de duzentos e quarenta pixels de largura
  Quando o cartão é pintado
  Então o título ocupa as mesmas linhas que ocuparia sem o marcador de número
  E o número é mostrado por inteiro, sem corte

Cenário: o número pode ser copiado
  Dado um cartão de id "5"
  Quando o mantenedor arrasta o ponteiro sobre o texto do número
  Então o texto fica selecionado
  E a cópia devolve o valor do identificador

Cenário: o estilo customizado do usuário alcança o número
  Dado um usuário que mantém a sua própria folha de estilo do quadro
  Quando ele escreve uma regra para o marcador de número
  Então o seletor disponível segue o prefixo das demais partes do cartão

Cenário: o leitor de tela anuncia o número antes do título
  Dado um cartão de id "5" e título "Corrigir o editor"
  Quando o foco chega ao cartão com um leitor de tela ativo
  Então o nome anunciado começa por "[5]"

Cenário: o valor integral vive no diálogo de detalhes
  Dado um cartão de identificador longo "20260804123456_412345678_a1b2c3d4e5f6a7b8"
  Quando o diálogo de detalhes desse cartão é aberto
  Então o identificador aparece por inteiro, sem encurtamento

Cenário negativo: cartão sem identificador
  Dado um cartão cujo campo id está ausente do arquivo e não foi preenchido na carga
  Quando o cartão é pintado
  Então nenhum marcador de número é desenhado
  E o título, o tipo e o corpo do cartão são pintados normalmente

Cenário negativo: identificador longo no cartão
  Dado um quadro aberto com a configuração simpleIDs desligada
  E um cartão de identificador "20260804123456_412345678_a1b2c3d4e5f6a7b8"
  Quando o cartão é pintado
  Então o cartão mostra "[…f6a7b8]", e não a cadeia inteira
  E o passar do ponteiro sobre o marcador revela o identificador completo
  E o título do cartão continua na mesma linha em que estaria sem o marcador

Cenário negativo: dois cartões com o mesmo número
  Dado um quadro em que dois cartões carregam o id "7"
  Quando o quadro é pintado
  Então ambos mostram "[7]", porque a interface exibe o que está gravado
  E nenhum sinal de repetição é desenhado em qualquer dos dois
  E nenhum dos dois é alterado, movido ou renumerado

Cenário negativo: cartão sem tipo e sem botões na faixa superior
  Dado um cartão de id "5" que não tem tipo, execução nem cronômetro
  Quando o cartão é pintado
  Então a faixa superior continua omitida, como antes da feature
  E o número aparece assim mesmo, na linha do título
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-03, RF-04 | Must | São a feature: sem eles o problema declarado permanece inteiro |
| RF-06 | Must | O quadro já paga o preço de acessibilidade nos demais controles; abrir exceção aqui criaria dívida na entrega, não depois |
| RF-07 | Must | É o único lugar onde o identificador longo pode ser lido por inteiro |
| RF-10 | Must | Exibir `[undefined]` seria pior que não exibir nada |
| RF-05, RF-11 | Must | Custo próximo de zero e regressão cara se ignorados |
| RF-08, RF-09 | Should | Melhoram o uso sem serem condição para o problema desaparecer |
| RNF de manutenibilidade | Must | Dois testes da suíte já reprovam a violação; não é escolha |
| RNF de desempenho e contraste | Should | Herdados; a feature acrescenta um texto curto por cartão, de impacto presumido baixo |

## 9. Esclarecimentos

### Sessão 2026-08-04

- **Q:** Onde mais o número deve aparecer, além do próprio cartão e do diálogo de detalhes?
  **R:** Só no cartão e nos detalhes. O formulário de edição e a exportação Markdown ficam de
  fora, e passaram ao escopo negativo da seção 5. O raciocínio: o problema que originou a
  feature é resolver a citação do agente olhando a tela, e isso o cartão já resolve; o nome do
  arquivo `.card.md` é contrato observado (RD-33) e renomeá-lo cobraria caro por um ganho que
  ninguém pediu.
- **Q:** Dois cartões podem carregar o mesmo `id`. Como tratar o número repetido?
  **R:** Não sinalizar. A interface mostra o que está gravado, e nada mais. Detectar duplicata
  exigiria varrer o quadro a cada pintura e manter uma variedade de cartão a mais, preço alto
  para um caso raro num quadro de mantenedor único. Registrado em RN-04 e no cenário negativo
  correspondente.
- **Q:** Com `simpleIDs` desligado, o identificador tem cerca de cinquenta caracteres. O que
  mostrar no cartão?
  **R:** Os seis últimos caracteres, precedidos de reticências — `[…a1b2c3]`. É o fim da
  cadeia que discrimina: o começo é o carimbo de tempo, idêntico entre cartões criados no
  mesmo segundo. O valor integral continua no diálogo de detalhes (RF-07) e no atributo de
  título do elemento. Registrado em RN-05 e RF-09.
- **Q:** Como o marcador deve aparecer no cartão?
  **R:** Abrindo a linha do título, na mesma linha e em tom secundário. É onde o olho já vai,
  e faz o nome acessível do cartão ser lido na mesma ordem em que aparece na tela. A escolha
  também sobrevive ao cartão sem tipo e sem botões, cuja faixa superior é inteiramente
  omitida — colocar o número lá o faria desaparecer justamente nos cartões mais simples.
  Registrado em RF-04 e no cenário negativo correspondente.

## 10. Lacunas

> Nenhuma lacuna aberta. As três dúvidas do documento inicial foram resolvidas na sessão de
> 2026-08-04, registrada na seção 9.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-04 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-08-04 | Quatro respostas integradas por `/reversa-clarify`: escopo fechado em cartão e detalhes, repetição sem sinal, encurtamento pelos seis últimos caracteres, marcador abrindo a linha do título. RN-04, RN-05, RF-04, RF-09, escopo negativo e cenários atualizados | reversa |
