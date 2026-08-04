# Matriz de rastreabilidade BUG↔SPEC — gestao-de-cartoes

> View gerada em 2026-08-04. Não editar à mão.
> Spec efetiva = documento original em `_reversa_sdd/` + adendos vigentes em `_reversa_sdd/addenda/`.

| Bug | Spec efetiva | Âncora | Papel da spec | `spec-gap` |
|---|---|---|---|---|
| `BUG-20260804-23SL` | `gestao-de-cartoes/requirements.md` | `#requisitos-funcionais` (RF-03) | define que descrição e detalhes são editáveis | não |
| `BUG-20260804-23SL` | `gestao-de-cartoes/requirements.md` | `#critérios-de-aceitação` | exige persistência da alteração após recarga | não |
| `BUG-20260804-23SL` | `gestao-de-cartoes/design.md` | `#dependências` | nomeia CodeMirror como o editor dos dois campos | não |
| `BUG-20260804-23SL` | `addenda/002-primer-design-system.md` | `#regras-sob-vigilância` (W018) | registra o acoplamento a classes do CodeMirror como risco vigiado | não |
| `BUG-20260804-23SL` | `addenda/bug-BUG-20260804-23SL-v001.md` | documento inteiro | **gerado por este bug**: acrescenta a `W018` a condição concreta que faz o acoplamento quebrar | não |

## Cobertura

- Bugs com spec identificada: 1 de 1 (100%)
- Bugs com label `spec-gap`: 0
- Vereditos de spec emitidos: 1 de 1 — `BUG-20260804-23SL`: **`spec-correta`**, com adendo aditivo

## Adendos gerados por bugs

| Adendo | Bug de origem | Tipo | Vigência |
|---|---|---|---|
| `bug-BUG-20260804-23SL-v001.md` | `BUG-20260804-23SL` | aditivo (regra-nova sobre `W018`) | desde 2026-08-04, sem prazo |

## Código sob suspeita, por unidade de spec

| Unidade | Arquivos citados pelos bugs |
|---|---|
| `gestao-de-cartoes` | `MarkdownField.tsx`, `code-editor.ts`, `CardForm.tsx`, `EditCardDialog.tsx`, `theme/dialogs.css` |
