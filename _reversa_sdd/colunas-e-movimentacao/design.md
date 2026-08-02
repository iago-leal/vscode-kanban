# Colunas e Movimentação — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `BOARD_COLMNS` | `ReadonlyArray<string>` | — | `['todo','in-progress','testing','done']` (grafia original) |
| `vsckb_get_cards_sorted` | `(type)` | `BoardCard[]` | Ordena **in place** e devolve o mesmo array |
| `vsckb_get_card_prio_sort_val` | `(item)` | `number` | `NaN` vira 0 |
| `vsckb_get_card_type_sort_val` | `(item)` | `number` | emergency −2, bug −1, resto 0 |
| `vsckb_get_column_name` | `(column)` | `string` | Nome configurado ou padrão |
| `vsckb_remove_item` | `(item)` | `void` | Remove da coluna atual |
| `GET_COLUMN_NAME` | `(column, defaultName)` | `string` | Equivalente no lado da extensão |

### Mapeamento de nomes 🟢

| Chave interna | Chave de configuração | Nome padrão | Cor do cabeçalho |
|---|---|---|---|
| `todo` | `kanban.columns.todo` | Todo | `bg-secondary`, texto escuro |
| `in-progress` | `kanban.columns.inProgress` | In Progress | `bg-primary`, texto branco |
| `testing` | `kanban.columns.testing` | Testing | `bg-warning`, texto branco |
| `done` | `kanban.columns.done` | Done | `bg-success`, texto branco |

🟢 Note a divergência de convenção: a chave interna é `in-progress` (com hífen), a de
configuração é `inProgress` (camel case).

## Fluxo Principal

### Renderização

1. Para cada chave de `allCards`, localiza o contêiner `#vsckb-card-<coluna>` e esvazia o corpo
   (`board.js:931-935`).
2. `vsckb_get_cards_sorted(coluna)` ordena e devolve os cartões.
3. Cada cartão é avaliado pelo filtro e, se aprovado, renderizado com as cores do tipo.
4. O rodapé de cada cartão recebe os botões de movimentação para as outras colunas
   (`board.js:1448-1583`).

### Ordenação (`vsckb_get_cards_sorted`)

```
1. prioridade decrescente:  prio(y) − prio(x)
2. tipo crescente:          peso(x) − peso(y)      [emergency −2, bug −1, resto 0]
3. título:                  comparação normalizada
```

Aplicada com `Array.sort` sobre `allCards[type]`, isto é, **sobre o array que será
serializado** 🟢.

### Movimentação por botão

1. `MOVE_CARD(destino)` remove o cartão do array de origem e o empurra no de destino.
2. `vsckb_save_board()` envia o quadro à extensão, que grava.
3. `vsckb_refresh_card_view` re-renderiza; no callback, dispara `card_moved` com
   `{card, from, to, others}` (`board.js:1459-1477`).

### Movimentação por script

1. O script chama `args.moveToDone(card?)`.
2. A extensão envia `moveCardTo` com `{uid, column}` (`workspaces.ts:701-715`).
3. O Webview localiza o cartão pelo `__uid`, move, grava e dispara `card_moved`
   (`board.js:1933-2005`).

### Limpeza de Done

1. Botão de borracha no cabeçalho de Done abre o modal de confirmação (`boards.ts:508-511`).
2. "Yes" esvazia `allCards['done']`, grava e dispara `column_cleared` com `{cards, column}`
   (`board.js:1660-1700`).

## Fluxos Alternativos

- **Nome de coluna configurado vazio ou só espaços:** cai no nome padrão
  (`board.js:502-506`, `boards.ts:441-445`) 🟢.
- **Prioridade não numérica:** tratada como zero 🟢.
- **Tipo desconhecido (`issue`, `task`, qualquer string):** peso zero na ordenação, cor
  genérica 🟢.
- **`moveCardTo` com `__uid` inexistente:** nenhum cartão é movido e nada é gravado
  (`board.js:1937-2000`) 🟢.
- **Limpeza cancelada:** modal fecha sem efeito 🟢.

## Dependências

- `persistencia-do-quadro` — grava após cada movimentação
- `filtro-de-cartoes` — decide quais cartões aparecem na coluna
- `gestao-de-cartoes` — compartilha a re-renderização
- `scripts-de-evento-do-usuario` — consome `card_moved` e `column_cleared`, e origina
  `moveCardTo`
- `webview-utils` — comparação e normalização de strings

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Quatro colunas fixas com chaves nomeadas (ADR-002) | `boards.ts:32-49`, `:388` | 🟢 |
| Renomeação apenas na exibição, resposta à issue #14 | CHANGELOG 1.20.0 | 🟢 |
| Ordenação derivada, sem ordem manual (ADR-006) | `board.js:464-484` | 🟢 |
| Ordenação in place, alterando a ordem persistida | `board.js:465` | 🟢 ⚠️ |
| Limpeza em massa exclusiva de Done | `boards.ts:508` | 🟢 |
| HTML das colunas literal, não gerado em laço | `boards.ts:452-522` | 🟢 |
| Nenhuma restrição de transição entre colunas | ausência de validação | 🟢 |

## Estado Interno

| Estado | Onde | Observação |
|---|---|---|
| `allCards` | global do Webview | As quatro chaves são as colunas |
| `boardSettings.columns` | global do Webview | Nomes de exibição |

Nenhum estado de coluna é persistido além do que está no arquivo do quadro 🟢.

## Observabilidade

- 🔴 Movimentações não são registradas em log
- 🔴 Não há histórico de transição por cartão: impossível calcular tempo de ciclo
  (`state-machines.md` §1)

## Riscos e Lacunas

- 🟢 **A ordenação in place produz *diffs* espúrios no Git**: abrir o quadro pode reordenar o
  arquivo sem que o usuário tenha feito nada. Correção trivial: ordenar sobre uma cópia
  (`spec-impact-matrix.md` C5)
- 🔴 Ausência de limite de WIP, o mecanismo central do método Kanban (lacuna L1 de `domain.md`)
- 🔴 Ausência de histórico de transições impede qualquer métrica de fluxo
- 🟡 A regra `noTimeTrackingIfIdle` assume que Todo e Done são estados inativos, suposição que
  quebra se o usuário renomear as colunas (`workspaces.ts:583`)
- 🟡 Colunas extras presentes no arquivo são descartadas silenciosamente
