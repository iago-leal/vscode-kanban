# Cápsula de reprodução — BUG-20260804-23SL

## Ambiente

| Item | Valor |
|---|---|
| Commit base | `6dcc8c9e2fb5127574029af5a5e6999376beaa44` ("Renderiza e torna marcaveis as caixas da lista de tarefas") |
| Branch | `feat/interface-react-tema-e-done` |
| Sistema | macOS 26.5.2 |
| Runtime | Node v24.18.1 |
| Harness | `npm run preview -- --board ~/dev/experimento/.vscode/vscode-kanban.json --port 8791 --theme dark` |
| Navegador | Chromium via Playwright |

O preview serve o mesmo documento que o editor serve (`scripts/preview.js` e a suíte
`preview.unit.test.ts` sustentam essa equivalência). Ele **não** é o editor: o que se prova aqui é
geometria e interação do Webview, não o ciclo de vida do painel.

## Comando

```
npm run preview -- --board /Users/iagoleal/dev/experimento/.vscode/vscode-kanban.json --port 8791 --theme dark
```

Depois: abrir `http://127.0.0.1:8791/`, clicar em **Edit** no cartão "Tela do controle financeiro"
(o único do quadro sem `description` e sem `details`).

## Determinismo

| Item | Valor |
|---|---|
| Classificação | determinística |
| Taxa | 4/4 medições, 2 cartões (os dois campos do mesmo diálogo falham juntos) |
| Gatilho | campo de Markdown **vazio** no momento em que o editor é criado |

## Medições — estado defeituoso

Com os dois campos vazios, medido no navegador:

| Elemento | Largura |
|---|---|
| Wrapper do campo (`span.vsckb-markdown-editor`, do design system) | 448 px |
| `div.CodeMirror` (o editor) | **38 px** |
| `.CodeMirror-gutters` (a calha dos números) | 30 px |
| `.CodeMirror-lines` (a área onde se escreve) | **8 px** |

Altura: 114 px (Description, 5 linhas) e 153 px (Details, 7 linhas) — a altura pedida pela folha
está correta; só a largura colapsou.

Gesto do usuário simulado (clique no meio do campo, `x` = centro do wrapper):

```
ondeOCliqueCaiu:  "vsckb-markdown-editor prc-components-TextInputBaseWrapper-…"
editorFocado:     false
elementoComFoco:  BUTTON.prc-Button-ButtonBase-…
valorDoEditor:    ""
```

O clique cai **fora** do editor, que termina em `x = 415` enquanto o campo visível vai até
`x = 824`. Nada é digitado. Captura: `antes-defeituoso.png` — idêntica ao print do relator.

## Medições — com a correção candidata

Aplicando `width: 100%; min-width: 0` ao `.CodeMirror` (via CSSOM, sem tocar em arquivo):

| Elemento | Antes | Depois |
|---|---|---|
| `div.CodeMirror` | 38 px | 446 px |
| `.CodeMirror-lines` | 8 px | 416 px |
| Altura | 114 / 153 px | 114 / 153 px (inalterada) |

Mesmo gesto:

```
ondeOCliqueCaiu:  "CodeMirror-lines"
editorFocado:     true
elementoComFoco:  TEXTAREA
```

Digitação real pelo teclado, caractere a caractere:

```
valor do editor: "escrito com a correcao aplicada"
```

Captura: `depois-corrigido.png`.

## Nota sobre a CSP

A primeira tentativa de injetar a correção como `<style>` foi **bloqueada pela Content Security
Policy** do documento (`style-src` sem `unsafe-inline`), o que confirma que a barreira introduzida
pela feature `002` está de pé. A medição foi refeita por CSSOM, que a CSP não intercepta.
