# Vínculo entre Cartões — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `vsckb_setup_card_link_list` | `(win, opts)` | `void` | Monta seletor e lista de vinculados no modal |
| `vsckb_find_card_by_id` | `(cardId)` | `BoardCard \| undefined` | Busca linear no quadro |
| `vsckb_find_parent_cards_of` | `(childId)` | `BoardCard[]` | Quem referencia este cartão |
| `vsckb_get_other_cards` | `(thisCard)` | `{coluna: BoardCard[]}` | Todos menos o informado |

### Modelo 🟢

```json
{ "id": "3", "title": "Implementar login", "references": ["1", "7"] }
```

`references` é `string[]` de `id` **persistentes** — não de `__uid` de sessão.

## Fluxo Principal

1. Ao abrir o modal de criação ou edição, a aba "References" é montada
   (`board.js:1259-1383`).
2. O seletor `.vsckb-card-list` é populado com todos os cartões do quadro exceto o corrente.
3. O botão de correntinha acrescenta o `id` escolhido ao array local de vínculos.
4. A lista `.vsckb-list-of-linked-cards` é redesenhada com os títulos resolvidos por
   `vsckb_find_card_by_id`.
5. Ao salvar o cartão, o array é gravado no campo `references`.

## Fluxos Alternativos

- **Cartão único no quadro:** o seletor fica vazio, e não há o que vincular 🟢.
- **`id` referenciado inexistente:** `vsckb_find_card_by_id` devolve indefinido e o item
  simplesmente não é exibido — o vínculo órfão fica invisível, não sinalizado 🟡.
- **Vínculo duplicado:** `vsckb_add_card_unique` evita repetir o mesmo `id`
  (`board.js:17-33`) 🟢.
- **Cartão referenciado excluído:** a referência permanece no cartão de origem 🟡.

## Dependências

- `gestao-de-cartoes` — a aba de vínculos vive dentro dos modais de criação e edição
- `persistencia-do-quadro` — `references` é persistido junto do cartão
- `webview-utils` — utilitários de string e clonagem
- Bootstrap — abas e seletor

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Vínculo por `id` persistente, não por `__uid` de sessão | `board.js:1259-1383` | 🟢 |
| Unidirecionalidade: só o cartão de origem registra o vínculo | ausência de código inverso | 🟢 |
| Deduplicação por `id` ao acrescentar | `board.js:17-33` | 🟢 |
| Sem validação de existência ao gravar | ausência de código | 🟢 |
| Introduzido na versão 1.14.0 em resposta à issue #9 | CHANGELOG | 🟢 |

## Estado Interno

| Estado | Onde | Persistido? |
|---|---|---|
| Array local de vínculos do modal | escopo da função do modal | Só ao salvar o cartão |
| `references` | dentro do cartão em `allCards` | Sim |

## Observabilidade

🔴 Nenhuma. Vínculos criados, removidos ou órfãos não deixam rastro em log.

## Riscos e Lacunas

- 🔴 **Semântica indefinida** (lacuna L2 de `domain.md`): sem saber se `references` significa
  dependência, subtarefa ou associação livre, não é possível decidir o comportamento correto na
  exclusão nem justificar bidirecionalidade
- 🔴 **Sem integridade referencial**: vínculos órfãos são silenciosos
- 🟡 Exclusão de cartão referenciado deixa referência pendente
- 🟡 Sem detecção de ciclo: A → B → A é aceito
- 🟢 A busca por `id` é linear sobre todo o quadro, chamada uma vez por vínculo exibido
