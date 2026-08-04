# Espelho de bugs na extração

> View gerada em 2026-08-04 pelo protocolo `/reversa-debugger-graph`. Não editar à mão.
> Source of truth: `_reversa_bugs/<contexto>/bugs/<ID>/bug.md`.

Este documento existe para que quem lê as specs enxergue os defeitos abertos contra elas. Um bug
aqui **não** altera a spec: mudança de spec vira adendo em `_reversa_sdd/addenda/`.

## Bugs por unidade de spec

| Unidade | Bug | Título | Sev. | Estado | Veredito de spec |
|---|---|---|---|---|---|
| `gestao-de-cartoes` | `BUG-20260804-23SL` | Description e Details não aceitam digitação no diálogo de edição de cartão | high | active / delivering (corrigido em 1.35.5) | **spec-correta** + adendo aditivo |

## Detalhe das âncoras atingidas

### `gestao-de-cartoes/requirements.md`

- `#requisitos-funcionais` — RF-03 ("Editar título, tipo, prioridade, categoria, responsável,
  descrição, detalhes e vínculos"): contestada por `BUG-20260804-23SL`, que impede a edição dos
  dois campos de Markdown num cartão sem conteúdo prévio.
- `#critérios-de-aceitação` — o critério de persistência após recarga fica inalcançável enquanto
  os campos não aceitarem digitação.

### `gestao-de-cartoes/design.md`

- `#dependências` — CodeMirror, nomeado como o editor de descrição e detalhes, é a dependência
  sob suspeita.

### `addenda/002-primer-design-system.md`

- `#regras-sob-vigilância` — `W018` já registrava que o tema do editor vendorizado depende de
  nomes de classe da biblioteca. O bug é a primeira ocorrência a testar essa vigilância, e o
  resultado foi que o acoplamento tem uma segunda face: além de pintar a biblioteca pelos nomes
  dela, o projeto precisa **declarar a geometria** do elemento que ela insere.

## Adendos gerados por bugs

| Adendo | Bug | Veredito | O que acrescenta |
|---|---|---|---|
| `bug-BUG-20260804-23SL-v001.md` | `BUG-20260804-23SL` | spec-correta (adendo aditivo) | Elemento vendorizado inserido dentro de um wrapper do design system vira flex item; largura, altura e `min-width: 0` têm de ser declaradas, sob pena de o controle colapsar com conteúdo vazio |

## Contexto do registro

| Contexto | Abertos | Ativos | Resolvidos | Views |
|---|---|---|---|---|
| `gestao-de-cartoes` | 0 | 1 (entregando) | 0 | `_reversa_bugs/gestao-de-cartoes/generated/graph.html` |
