# Índice de bugs — gestao-de-cartoes

> View gerada em 2026-08-04 pelo protocolo `/reversa-debugger-graph`. Não editar à mão.
> Source of truth: `../bugs/<ID>/bug.md`.

## Abertos (0)

Nenhum.

## Ativos (1)

| # | ID | Título | Sev. | Prio | Fase | O que falta |
|---|---|---|---|---|---|---|
| 1 | `BUG-20260804-23SL` | Description e Details não aceitam digitação no diálogo de edição de cartão | high | P1 | delivering | recarregar a janela do editor e fazer o merge |

Corrigido e verificado; `resolution_kind: fixed`, `spec_verdict: spec-correta`, corrigido em
`1.35.5`. A closure policy `package` ainda não está satisfeita, e por isso o bug **não** é
`resolved` nem carrega `DONE.md`.

## Resolvidos (0)

Nenhum.

## Travados por `DONE.md` (0)

Nenhum.

## Bloqueios vigentes

Nenhum bug do contexto declara `blocking`.

## Testes que este contexto produziu

| Teste | Papel |
|---|---|
| `src/test/embedded-editor.unit.test.ts` | largura, altura e `min-width` do editor embutido |
| fixture do sandbox, cartão `12` | o caso do cartão sem `description` nem `details` |

## Relatos de intake

- `../intake/relato-20260804-0748.md` — 1 defeito anotado, 1 registrado
