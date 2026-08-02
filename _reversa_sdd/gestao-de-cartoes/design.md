# Gestão de Cartões — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `vsckb_edit_card` | `(i, opts)` | `void` | Abre o modal de edição para o cartão `i` |
| `vsckb_open_card_detail_window` | `(i, opts)` | `void` | Modal de leitura |
| `vsckb_get_assigned_to_val` | `(field)` | `{name} \| undefined` | Vazio vira indefinido |
| `vsckb_get_card_description_markdown` | `(field)` | `{content, mime} \| undefined` | Sempre `text/markdown` |
| `vsckb_get_prio_val` | `(field)` | `number \| undefined` | Vazio vira indefinido |
| `vsckb_remove_item` | `(item)` | `void` | Remove o cartão do array da coluna |
| `vsckb_add_card_unique` | `(cards, cardToAdd)` | `array` | Evita duplicata por `id` |

### Elementos de interface 🟢

| Modal | `id` | ESC habilitado? |
|---|---|---|
| Adicionar cartão | `vsckb-add-card-modal` | não (`data-keyboard="false"`) |
| Editar cartão | `vsckb-edit-card-modal` | não |
| Excluir cartão | `vsckb-delete-card-modal` | sim |
| Detalhes | `vsckb-card-details-modal` | sim |

Cada modal de escrita tem três abas: "(Short) Description", "Details" e "References".

## Fluxo Principal

### Criação

1. Clique no botão "+" do cabeçalho da coluna (`boards.ts:460`).
2. O modal é aberto com prioridade, tipo e responsável **preservados** da vez anterior
   (`board.js:1834-1876`).
3. Ao confirmar, monta-se o objeto do cartão: título, tipo, prioridade, categoria, responsável,
   descrição e detalhes em Markdown, `creation_time` em UTC.
4. O cartão é empurrado no array da coluna e `vsckb_save_board()` envia o quadro à extensão.
5. `vsckb_refresh_card_view` re-renderiza e, no callback, dispara `card_created` com
   `{card, column, others}` (`board.js:1877`).

### Edição

1. Clique no botão de edição preenche os campos com os valores atuais (`board.js:71-213`).
2. Ao salvar, uma **cópia do cartão antigo** é guardada para o evento.
3. Os campos são sobrescritos no objeto existente, preservando `id` e `creation_time`.
4. Grava e dispara `card_updated` com `{card, oldCard, column, others}` (`board.js:214`).

### Exclusão

1. O botão abre o modal de confirmação com o título do cartão no corpo.
2. "Yes" remove o cartão do array por identidade de objeto (`vsckb_remove_item`).
3. Grava e dispara `card_deleted` com `{card, column, others}` (`board.js:1052`).

## Fluxos Alternativos

- **Título vazio:** o cartão não é criado 🟢.
- **Prioridade não numérica:** `parseFloat` produz `NaN`, tratado como 0 na ordenação
  (`board.js:440-450`) 🟢.
- **Responsável vazio:** o campo `assignedTo` inteiro fica indefinido, não `{name: ''}`
  (`board.js:340-351`) 🟢.
- **Descrição vazia:** o campo desaparece do objeto (`board.js:428-434`) 🟢.
- **Cancelar a exclusão:** o modal fecha sem efeito 🟢.
- **Cartão referenciado por outros:** a exclusão prossegue e as referências ficam órfãs
  (`domain.md` L2) 🟡.

## Dependências

- `webview-utils` — `vsckb_to_string`, `vsckb_normalize_str`, `vsckb_is_nil`, `vsckb_clone`,
  `vsckb_from_markdown`, `vsckb_post`, `vsckb_raise_event`
- `persistencia-do-quadro` — recebe o quadro em `saveBoard`
- `colunas-e-movimentacao` — compartilha a re-renderização
- `vinculo-entre-cartoes` — a aba "References" faz parte dos mesmos modais
- CodeMirror — editores de descrição e detalhes
- Bootstrap — modais e abas

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Campos preservados entre criações sucessivas | commits de 2018-05-29 | 🟢 |
| ESC desabilitado nos modais de escrita (issue #8) | `boards.ts:529`, `:678` | 🟢 |
| Descrição e detalhes sempre gravados como `text/markdown` | `board.js:433` | 🟢 |
| Cópia do cartão antigo entregue ao evento `card_updated` | `board.js:214-216` | 🟢 |
| Gravação antes do evento, sem transação | `board.js:1459-1477` | 🟢 |
| Identidade por referência de objeto na remoção | `board.js:1218-1227` | 🟢 |

## Estado Interno

| Estado | Onde | Observação |
|---|---|---|
| `allCards` | global do Webview | Mutado diretamente por criação, edição e exclusão |
| `currentUser` | global do Webview | Usado para pré-preencher o responsável |
| `MARKDOWN_EDITORS` | `script.js:1` | Registro dos editores CodeMirror ativos |
| `nextKanbanCardId` | global do Webview | Contador de elementos DOM, **não** de cartões |

## Observabilidade

- 🟢 Erros no listener de mensagens do Webview são registrados por `vsckb_log`
  (`board.js:2087-2089`), que chega ao log da extensão
- 🔴 Nenhuma operação de cartão é registrada: criar, editar e excluir não deixam rastro no log

## Riscos e Lacunas

- 🔴 **Não há desfazer.** A exclusão é imediata e definitiva após a confirmação
- 🟡 Referências órfãs após exclusão (lacuna L2 de `domain.md`)
- 🟡 O limite de 255 caracteres aparece apenas no campo de descrição do modal de **edição**
  (`boards.ts:746`), e não no de criação — assimetria provavelmente não intencional
- 🟢 A gravação precede o evento, de modo que um script não consegue vetar a operação
