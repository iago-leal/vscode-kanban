# ADR-006 — Ordenação automática dos cartões, sem ordem manual

> ADR **retroativo**, reconstruído pelo Detetive.
> Decisão **implícita**: nunca declarada em documentação, CHANGELOG ou *commit*.

- **Status:** aceito e vigente desde a versão 1.2.2 (2018-05-29)
- **Confiança:** 🟢 no comportamento · 🔴 na motivação (nenhuma evidência textual)

## Contexto

Num quadro Kanban tradicional, o usuário arrasta cartões e a ordem dentro da coluna carrega
significado — o que está no topo é o próximo a fazer. A extensão precisava decidir se essa
ordem seria manual, automática, ou ambas.

## Decisão

A ordem dentro de cada coluna é **inteiramente derivada dos dados**, por três critérios
encadeados (`board.js:464-484`):

1. Prioridade decrescente (`prio`, ausente equivale a zero);
2. Tipo: `emergency` (−2), `bug` (−1), demais (0);
3. Título, em ordem alfabética normalizada.

A ordenação usa `Array.sort` **in place** sobre `allCards[type]`, isto é, sobre o mesmo objeto
que será serializado, de modo que a ordem calculada para exibição **passa a ser a ordem
persistida**.

## Evidências

- `vsckb_get_cards_sorted` (`board.js:464-484`)
- `vsckb_get_card_prio_sort_val` e `vsckb_get_card_type_sort_val` (`board.js:440-462`)
- O campo `prio` foi introduzido na versão 1.2.2, junto de "assigned to"
- Ausência total de código de arrastar-e-soltar para reordenação dentro da coluna
- Nenhuma menção a ordenação em CHANGELOG ou README 🔴

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| Ordem manual persistida (índice no cartão) | Exigiria arrastar-e-soltar e um campo de ordem a manter coerente em todas as operações |
| Ordenação apenas visual, preservando a ordem do arquivo | Bastaria copiar o array antes de ordenar; a mutação in place parece **acidental**, não deliberada 🟡 |
| Ordem configurável pelo usuário | Complexidade adicional sem pedido registrado nas issues |

## Consequências

**Positivas** 🟢
- A prioridade é o mecanismo único e explícito de precedência: não há ambiguidade entre
  "está em cima" e "tem prioridade alta".
- Emergências sobem sozinhas, sem intervenção.
- Nada de estado de ordenação a sincronizar entre Webview e disco.

**Negativas** 🟢
- **Não existe reordenação manual.** Quem quiser mudar a ordem precisa mexer na prioridade.
- A mutação in place faz a ordem do arquivo mudar sozinha, produzindo *diffs* no Git em
  operações que o usuário não percebe como reordenação.
- Cartões de mesma prioridade e mesmo tipo ficam em ordem alfabética, o que raramente
  corresponde à ordem de execução desejada.
- O comportamento **não está documentado em lugar algum**: o usuário descobre pelo uso.

## Status hoje

Vigente. É a decisão que mais afasta a extensão da experiência esperada de um quadro Kanban, e
a única cuja motivação não deixou nenhum vestígio escrito. A mutação in place, em particular,
tem toda a aparência de efeito colateral não intencional de `Array.sort` — corrigi-la (ordenar
sobre uma cópia) seria barato e preservaria o comportamento visível.
