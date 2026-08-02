# Domínio — vscode-kanban

> Gerado pelo **Detetive** (Reversa) em 2026-08-02 · `doc_level: completo`
> Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA
> Fontes: código, `git log` (86 commits, 2018-05-25 a 2022-11-07), `CHANGELOG.md`, `README.md`.

---

## 1. O que este sistema é

Um **quadro Kanban pessoal por pasta de projeto**, embutido no editor. A tese de produto,
inferida do desenho e confirmada pelo histórico 🟡, é que o acompanhamento de tarefas deve
morar **junto do código, versionado com ele**, e não em uma ferramenta externa (Jira, Trello,
Notion) que exige trocar de contexto e sincronizar manualmente.

Três consequências dessa tese aparecem em toda decisão técnica 🟢:

1. **Sem servidor, sem conta, sem sincronização.** O quadro é um arquivo JSON em
   `.vscode/vscode-kanban.json`, versionável junto do repositório.
2. **Um quadro por pasta de workspace**, não um quadro global. O escopo de configuração é
   `resource` (por pasta), e o watcher cria uma instância `Workspace` por pasta aberta.
3. **Extensível por script local**, não por plugin publicado: `.vscode/vscode-kanban.js` é a
   API de extensão do usuário final.

O sistema é **monousuário por desenho** — ver §6.

---

## 2. Glossário

| Termo | Definição no sistema | Confiança |
|---|---|---|
| **Board (Quadro)** | Coleção de quatro listas de cartões, uma por coluna. Um por pasta de workspace | 🟢 |
| **Column (Coluna)** | Um dos quatro estágios fixos: `todo`, `in-progress`, `testing`, `done`. Renomeáveis apenas na exibição | 🟢 |
| **Card (Cartão)** | Unidade de trabalho. Único campo obrigatório é o título | 🟢 |
| **Card type (Tipo)** | Classificação que afeta cor, ordenação e filtro: `bug`, `emergency` ou vazio (nota/tarefa) | 🟢 |
| **Category (Categoria)** | Rótulo livre definido pelo usuário, ortogonal ao tipo | 🟢 |
| **Prio (Prioridade)** | Número; maior vem primeiro na coluna. Ausente equivale a zero | 🟢 |
| **Assigned to (Responsável)** | Nome de pessoa, preenchido por padrão com o usuário detectado | 🟢 |
| **Tag** | Campo livre `any` do cartão, reservado a dados de scripts e ao time tracking | 🟢 |
| **Reference (Vínculo)** | Lista de IDs de outros cartões que este cartão referencia | 🟢 |
| **Filter (Filtro)** | Expressão booleana avaliada por cartão que decide a exibição | 🟢 |
| **Event script** | `.vscode/vscode-kanban.js`, módulo do usuário que reage a eventos do quadro | 🟢 |
| **Time tracking** | Cronômetro por cartão, em três variantes: interno, por script ou Toggl | 🟢 |
| **Export** | Geração de um arquivo Markdown por cartão, em cada gravação | 🟢 |
| **`__uid`** | Identidade **efêmera** de sessão, distinta do `id` persistente | 🟢 |

---

## 3. Regras de domínio

### 3.1 Estrutura do quadro

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-01 | O quadro tem exatamente quatro colunas, nesta ordem: Todo, In Progress, Testing, Done | `boards.ts:388-393` | 🟢 |
| RD-02 | As colunas não podem ser criadas, removidas nem reordenadas; apenas renomeadas para exibição | `package.json:49-70`, ausência de código de criação | 🟢 |
| RD-03 | Colunas extras presentes no arquivo são ignoradas na carga e perdidas na gravação seguinte | `boards.ts:1407-1409` + `saveBoardTo` grava o objeto recebido | 🟡 |
| RD-04 | Cada pasta de workspace tem seu próprio quadro, independente das demais | `workspaces.ts:345-351` | 🟢 |
| RD-05 | O quadro é criado vazio, automaticamente, na primeira abertura | `workspaces.ts:445-461` | 🟢 |

**Por que quatro colunas fixas** 🟡: o commit `custom column names` (2018-07-04) atendeu à
issue #14 pedindo colunas customizadas, mas entregou **apenas a renomeação**. A leitura
provável é que o modelo de dados — objeto com quatro chaves nomeadas, e não uma lista de
colunas — tornava a mudança cara demais para o retorno. É a decisão de modelagem mais
consequente do sistema, e está registrada como ADR-002.

### 3.2 Cartões

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-06 | Título é o único campo obrigatório | `boards.ts:99` (sem `?`) | 🟢 |
| RD-07 | Todo cartão recebe `id` na carga, se não tiver | `boards.ts:1411-1437` | 🟢 |
| RD-08 | Por padrão o `id` é um inteiro sequencial (`simpleIDs: true`) | `boards.ts:1432`, `workspaces.ts:584` | 🟢 |
| RD-09 | `creation_time` é gravado em UTC no formato ISO 8601 | `board.js`, `data-dictionary §2` | 🟢 |
| RD-10 | Descrição e detalhes aceitam apenas `text/markdown` e `text/plain`; qualquer outro MIME vira `text/plain` | `boards.ts:1374-1383` | 🟢 |
| RD-11 | Conteúdo vazio faz o campo inteiro desaparecer do JSON | `boards.ts:1368-1370` | 🟢 |
| RD-12 | Um cartão pode referenciar outros por `references` | `boards.ts:91`, `board.js:1259` | 🟢 |
| RD-13 | Cartões referenciados não são movidos nem apagados em cascata | ausência de código de cascata | 🟡 |

**A origem de `simpleIDs`** 🟢: até a versão 1.22.0 (agosto de 2018) os IDs eram sempre
compostos (`data_aleatório_uuid`). A issue #17 pediu identificadores legíveis para uso humano
— citar "o cartão 42" numa conversa. O autor então adicionou a configuração **com padrão
verdadeiro**, invertendo o comportamento anterior. É o único caso no histórico em que um
padrão de comportamento foi trocado depois de publicado.

### 3.3 Ordenação e apresentação

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-14 | Dentro da coluna, ordena-se por prioridade decrescente | `board.js:467-471` | 🟢 |
| RD-15 | Empate na prioridade resolve-se pelo tipo: emergency, depois bug, depois os demais | `board.js:452-478` | 🟢 |
| RD-16 | Empate no tipo resolve-se pelo título, alfabeticamente | `board.js:481-482` | 🟢 |
| RD-17 | A ordem manual do usuário não é preservada — a ordenação é recalculada e gravada | `board.js:465` (`sort` in place) | 🟢 |
| RD-18 | Emergency é vermelho, bug é escuro, os demais são azul-informação | `board.js:368-380` | 🟢 |
| RD-19 | Listas de tarefas em Markdown viram barras de progresso no cartão | CHANGELOG 1.8.0 | 🟢 |

RD-17 merece destaque: **num quadro Kanban, não existe "arrastar para reordenar" que
sobreviva**. A ordem é sempre função de prioridade, tipo e título. É uma decisão de produto
implícita, jamais declarada em documentação (ADR-006).

### 3.4 Filtro

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-20 | O filtro é uma expressão booleana avaliada por cartão | `script.js:206-212` | 🟢 |
| RD-21 | Expressão vazia ou inválida mostra **todos** os cartões | `script.js:208`, `:213-217` | 🟢 |
| RD-22 | O filtro é persistido por workspace em `.vscode/vscode-kanban.filter` | `workspaces.ts:564-573` | 🟢 |
| RD-23 | O filtro afeta apenas a exibição; nunca apaga nem move cartões | `board.js:836` (só decide renderização) | 🟢 |
| RD-24 | `is_bug` abrange `bug` e `issue`; `is_note` abrange vazio, `note` e `task` | `board.js:807-809` | 🟢 |

**Por que falha para "mostrar tudo"** 🟡: escolha defensiva coerente com o contexto — um
filtro digitado errado que escondesse todo o quadro pareceria perda de dados. O preço é o
silêncio: quem erra a sintaxe não recebe aviso, apenas vê o filtro "não funcionar".

### 3.5 Time tracking

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-25 | Existem três modos mutuamente exclusivos: interno, por script e Toggl | `workspaces.ts:717-757` | 🟢 |
| RD-26 | O modo interno registra carimbos alternados; o total é a soma dos pares | `workspaces.ts:917-937` | 🟢 |
| RD-27 | Número ímpar de carimbos significa cronômetro correndo | `workspaces.ts:941` | 🟢 |
| RD-28 | O total é recalculado do zero a cada acionamento | `workspaces.ts:915-937` | 🟢 |
| RD-29 | Com `noTimeTrackingIfIdle`, o botão some em Todo e Done | `package.json:99-103` | 🟢 |
| RD-30 | No Toggl, uma entrada corrente de outro projeto bloqueia o início | `toggl.ts:217-224` | 🟢 |
| RD-31 | O `type` desconhecido em `trackTime` desliga o recurso silenciosamente | `workspaces.ts:747-748` | 🟢 |

**A lógica de RD-29** 🟡: rastrear tempo em "Todo" (ainda não começou) ou "Done" (já terminou)
não faz sentido no fluxo Kanban — o trabalho ativo está em In Progress e Testing. É a única
regra do sistema que trata as colunas como algo mais que rótulos, ou seja, o único ponto em
que a semântica do Kanban entra no código.

### 3.6 Exportação

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-32 | A exportação ocorre a cada gravação, se ligada | `workspaces.ts:528` | 🟢 |
| RD-33 | Um arquivo Markdown por cartão, nomeado `vscode-kanban_<coluna>_<n>_<título>.card.md` | `workspaces.ts:968`, `:1019-1047` | 🟢 |
| RD-34 | Por padrão, as exportações anteriores são apagadas antes de regerar | `workspaces.ts:555`, `:970-986` | 🟢 |
| RD-35 | O nome é truncado em 48 caracteres por padrão | `workspaces.ts:543-551` | 🟢 |
| RD-36 | Tipo vazio é exportado como `note` | `workspaces.ts:1055-1058` | 🟢 |
| RD-37 | Cada arquivo traz seção `## Meta` com chaves em ordem alfabética | `workspaces.ts:1092` | 🟢 |

RD-34 é a regra de maior risco do sistema 🔴: apontar `exportPath` para uma pasta que já
contenha arquivos com o prefixo `vscode-kanban_` os destrói sem confirmação.

### 3.7 Identificação do usuário

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-38 | O usuário é detectado primeiro por `git config user.name` | `boards.ts:1008-1014` | 🟢 |
| RD-39 | Na ausência do Git, usa o nome do usuário do sistema operacional | `boards.ts:1019-1027` | 🟢 |
| RD-40 | `noScmUser` e `noSystemUser` desligam cada fonte independentemente | `package.json:89-98` | 🟢 |
| RD-41 | O nome detectado só preenche "Assigned To" se o campo estiver vazio | `board.js:2052` | 🟢 |

**Por que existe detecção de usuário** 🟡: o quadro é monousuário, mas o **arquivo** é
versionado e compartilhado. Preencher "assigned to" com o autor do commit é o vestígio da
intenção de uso em equipe pequena, via Git — sem servidor, cada um edita o mesmo JSON e
resolve conflitos como resolveria em qualquer arquivo versionado.

### 3.8 Eventos e extensibilidade

| # | Regra | Evidência | Confiança |
|---|---|---|---|
| RD-42 | Sete eventos são despachados ao script do usuário | `workspaces.ts:771-802` | 🟢 |
| RD-43 | Sem a função específica, tenta-se o fallback `onEvent` | `workspaces.ts:805` | 🟢 |
| RD-44 | Todo evento carrega os demais cartões do quadro em `others` | `board.js:1473` | 🟢 |
| RD-45 | O script pode mover o cartão e gravar dados em `tag` | `workspaces.ts:836-878` | 🟢 |
| RD-46 | O botão de execução só aparece com `canExecute: true` | `package.json:39-43` | 🟢 |
| RD-47 | A gravação do quadro **precede** o disparo do evento | `board.js:1459-1477` | 🟢 |
| RD-48 | O script tem acesso a `require` irrestrito e ao `ExtensionContext` | `workspaces.ts:629-635` | 🟢 |

RD-48 é a lacuna de segurança central, registrada em `questions.md` (Q1) e em ADR-004.

---

## 4. Comportamentos que revelam intenção

Três detalhes pequenos, extraídos do histórico, dizem mais sobre o produto que a documentação:

**"no reset of prio field for new cards"** (2018-05-29) 🟢 — dois commits seguidos ajustaram
os campos que **não** devem ser limpos ao criar um cartão novo (prioridade, responsável,
tipo). O caso de uso implícito é a **entrada em lote**: quem abre o quadro costuma cadastrar
vários cartões parecidos em sequência.

**"disabled ESC button for popups"** (issue #8, versões 1.14.0 e 1.16.4) 🟢 — `data-keyboard="false"`
nos modais de adicionar e editar. Perder uma descrição longa por um ESC acidental era
inaceitável a ponto de merecer correção em duas versões. Confirma que o cartão é tratado como
documento, não como item de lista.

**Barras de progresso a partir de listas de tarefas** (1.8.0) 🟢 — o cartão não tem campo de
percentual; o progresso é **derivado** da contagem de caixas marcadas na descrição Markdown. A
decisão evita um campo redundante e mantém o Markdown como fonte única.

---

## 5. Máquinas de estado

Ver `state-machines.md`. Resumo: o cartão tem uma máquina de estados **totalmente livre**
(qualquer coluna alcança qualquer outra), e o time tracking tem uma máquina implícita de dois
estados derivada da paridade do array de carimbos.

---

## 6. Papéis e permissões

Ver `permissions.md`. Resumo 🟢: **não existe RBAC**. O sistema é monousuário e todas as
capacidades são governadas por configuração, não por identidade. O campo "assigned to" é
descritivo e não restringe nada.

---

## 7. Lacunas de domínio 🔴

| # | Lacuna | Onde se manifesta |
|---|---|---|
| L1 | Não há regra de limite de trabalho em progresso (WIP limit), o mecanismo central do método Kanban | ausência em todo o código |
| L2 | `references` não tem semântica definida: não se sabe se representa dependência, subtarefa ou "veja também" | `boards.ts:91` |
| L3 | Não há política de resolução de conflito quando o JSON muda fora do editor | `boards.ts:1336` |
| L4 | Não há esquema de validação do arquivo do quadro; JSON malformado quebra a carga | `boards.ts:1342` |
| L5 | O vocabulário de tipos diverge entre seletor, filtro e cores (`issue`, `note`, `task` órfãos) | `board.js:807-809` vs `:2099-2101` |

L1 é notável: o produto se chama Kanban, mas implementa apenas o **quadro visual**, sem o
limite de WIP que define o método. É quadro de cartões, não sistema Kanban no sentido estrito
— distinção que qualquer evolução deve assumir explicitamente.
