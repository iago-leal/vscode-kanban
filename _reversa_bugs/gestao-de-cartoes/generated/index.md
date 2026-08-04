# Índice de bugs — gestao-de-cartoes

> View gerada em 2026-08-04 pelo protocolo `/reversa-debugger-graph`. Não editar à mão.
> Source of truth: `../bugs/<ID>/bug.md`.

## Abertos (0)

Nenhum.

## Ativos (0)

Nenhum.

## Resolvidos (1)

| # | ID | Título | Sev. | Desfecho | Corrigido em |
|---|---|---|---|---|---|
| 1 | `BUG-20260804-23SL` | Description e Details não aceitam digitação no diálogo de edição de cartão | high | `fixed` · `spec-correta` | `1.35.5` · `4f3231d` · merge `6456b88` |

## Travados por `DONE.md` (1)

| ID | Encerrado em | Reabertura |
|---|---|---|
| `BUG-20260804-23SL` | 2026-08-04 | remover a trava conscientemente, ou registrar bug novo com `regression-of` |

## Bloqueios vigentes

Nenhum.

## Testes que este contexto produziu

| Teste | Papel |
|---|---|
| `src/test/embedded-editor.unit.test.ts` | largura, altura e `min-width` do editor embutido |
| fixture do sandbox, cartão `12` | o caso do cartão sem `description` nem `details` |

## Adendos que este contexto gerou

| Adendo | Bug | Tipo |
|---|---|---|
| `_reversa_sdd/addenda/bug-BUG-20260804-23SL-v001.md` | `BUG-20260804-23SL` | aditivo (regra-nova sobre `W018`) |

## Relatos de intake

- `../intake/relato-20260804-0748.md` — 1 defeito anotado, 1 registrado, 1 resolvido
