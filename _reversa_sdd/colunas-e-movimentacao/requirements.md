# Colunas e Movimentação

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Estrutura de colunas do quadro, movimentação de cartões entre elas, ordenação dentro de cada
coluna e limpeza em massa da coluna Done.

## Responsabilidades

- Definir as quatro colunas fixas e seus nomes de exibição
- Renderizar cada coluna com sua identidade visual
- Mover cartões entre colunas, por botão ou por comando de script
- Ordenar os cartões dentro da coluna
- Limpar a coluna Done em massa
- Disparar `card_moved` e `column_cleared`

## Regras de Negócio

- As colunas são exatamente quatro e fixas: `todo`, `in-progress`, `testing`, `done` 🟢
- Não é possível criar, remover nem reordenar colunas; apenas renomear a exibição 🟢
- Nomes padrão: Todo, In Progress, Testing, Done 🟢
- Todas as transições entre colunas são permitidas, sem restrição 🟢
- A ordenação é derivada dos dados: prioridade decrescente, depois tipo, depois título 🟢
- Pesos de tipo na ordenação: `emergency` = −2, `bug` = −1, demais = 0 🟢
- A ordenação é aplicada **in place** e passa a ser a ordem persistida 🟢
- Não existe reordenação manual dentro da coluna 🟢
- Apenas a coluna Done oferece limpeza em massa, com confirmação 🟢
- A gravação precede o disparo de `card_moved` 🟢
- 🔴 Não há limite de trabalho em progresso (WIP limit) em nenhuma coluna

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Renderizar as quatro colunas com nomes configuráveis | Must | Nome customizado aparece no cabeçalho |
| RF-02 | Mover cartão para qualquer outra coluna | Must | O cartão muda de coluna e persiste |
| RF-03 | Ordenar por prioridade decrescente | Must | Prioridade 5 aparece acima de 1 |
| RF-04 | Desempatar por tipo e depois por título | Must | Em prioridades iguais, emergency vem primeiro |
| RF-05 | Aceitar movimentação comandada por script (`moveCardTo`) | Should | `moveToDone()` move e persiste |
| RF-06 | Limpar todos os cartões de Done com confirmação | Should | Após confirmar, Done fica vazia |
| RF-07 | Disparar `card_moved` com origem e destino | Should | O script recebe `from` e `to` |
| RF-08 | Disparar `column_cleared` com a lista de cartões removidos | Should | O script recebe `cards` e `column` |
| RF-09 | Preservar a ordem manual do usuário | Won't | 🟢 Não existe no legado (ADR-006) |
| RF-10 | Limitar o número de cartões por coluna | Won't | 🔴 Não existe no legado |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Integridade | A ordenação muta o array persistido | `board.js:465` | 🟢 |
| Desempenho | Cada movimentação regrava o quadro inteiro | `board.js:1463` | 🟢 |
| Usabilidade | Limpeza em massa exige confirmação explícita | `boards.ts:801-827` | 🟢 |
| Consistência | Nenhuma restrição de transição é verificada | `board.js:1459-1461` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um cartão na coluna Todo
Quando o usuário aciona o botão de mover para Done
Então o cartão passa a estar em Done
E o arquivo do quadro reflete a mudança
E o evento card_moved é disparado com from "todo" e to "done"

Dado dois cartões na mesma coluna com prioridades 1 e 5
Quando a coluna é renderizada
Então o cartão de prioridade 5 aparece acima

Dado dois cartões de prioridade igual, um do tipo emergency e outro sem tipo
Quando a coluna é renderizada
Então o cartão emergency aparece acima

Dado dois cartões de mesma prioridade e mesmo tipo, com títulos "Beta" e "Alfa"
Quando a coluna é renderizada
Então "Alfa" aparece acima de "Beta"

Dado a coluna Done com três cartões
Quando o usuário aciona a limpeza e confirma
Então Done fica vazia
E o evento column_cleared é disparado com os três cartões

Dado a configuração kanban.columns.todo com o valor "Backlog"
Quando o quadro é aberto
Então o cabeçalho da primeira coluna exibe "Backlog"
E a chave interna continua sendo "todo"
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Quatro colunas e movimentação | Must | Essência do quadro |
| Ordenação por prioridade | Must | Único mecanismo de precedência (ADR-006) |
| Nomes customizados | Should | Resposta à issue #14, com alternativa (usar os padrões) |
| Limpeza de Done | Should | Conveniência com alternativa (excluir um a um) |
| Eventos de movimentação | Should | Base da extensibilidade |
| Ordem manual | Won't | Decisão explícita do ADR-006 |
| Colunas customizadas | Won't | Decisão explícita do ADR-002 |
| Limite de WIP | Won't | 🔴 Ausente, embora seja o mecanismo central do método Kanban |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/boards.ts:388-393` | `BOARD_COLMNS` | 🟢 |
| `src/boards.ts:427-447` | `GET_COLUMN_NAME` | 🟢 |
| `src/boards.ts:452-522` | HTML das quatro colunas | 🟢 |
| `src/res/js/board.js:486-508` | `vsckb_get_column_name` | 🟢 |
| `src/res/js/board.js:440-484` | ordenação | 🟢 |
| `src/res/js/board.js:1448-1583` | `vsckb_update_card_item_footer` e `MOVE_CARD` | 🟢 |
| `src/res/js/board.js:1660-1700` | limpeza de Done | 🟢 |
| `src/res/js/board.js:1933-2005` | comando `moveCardTo` | 🟢 |
| `src/workspaces.ts:476-490` | montagem de `ColumnSettings` | 🟢 |
