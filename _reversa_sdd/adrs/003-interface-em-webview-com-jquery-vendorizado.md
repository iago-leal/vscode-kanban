# ADR-003 — Interface em Webview com bibliotecas vendorizadas (jQuery, Bootstrap, CodeMirror)

> ADR **retroativo**, reconstruído pelo Detetive.

- **Status:** aceito, vigente e **reconhecido como dívida pelo próprio autor** desde 2020
- **Data inferida:** 2018-05-25 (base), com acréscimos até 2018-06-27
- **Confiança:** 🟢 na decisão · 🟢 no reconhecimento da dívida · 🟡 na motivação original

## Contexto

A API de Webview do VS Code entrega um `<iframe>` isolado que recebe uma string de HTML. Toda
a interface do quadro precisava ser construída nesse espaço, e os recursos precisavam ser
servidos localmente, sem CDN (o Webview roda offline e sob restrição de origem).

## Decisão

Construir a interface com **jQuery e Bootstrap**, servidos como **cópias vendorizadas** dentro
de `src/res/js/` e `src/res/css/`, copiadas para `out/res` no *build*. Ao longo de 2018,
somaram-se CodeMirror (editor Markdown), Mermaid (diagramas), Showdown (Markdown → HTML),
highlight.js, Moment e Filtrex — todos pelo mesmo caminho.

## Evidências

- `generateHeader` carrega 6 CSS e 10 scripts locais (`html.ts:167-184`)
- 121 modos de linguagem do CodeMirror versionados em `src/res/js/codemirror/mode/`
- Script `build`: `cp -r ./src/res/* ./out/res` (`package.json:173`)
- Nenhuma dessas bibliotecas aparece no `package.json`
- CHANGELOG 1.15.1: *"Markdown editors now using syntax highlighting, provided by CodeMirror"*

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| React ou Vue com *bundler* | Exigiria webpack/rollup, *build* mais complexo e conhecimento adicional; em 2018 o autor priorizou entregar rápido |
| JavaScript puro sem framework | jQuery e Bootstrap davam layout e componentes prontos (modais, botões, grid) sem esforço |
| Consumir bibliotecas via npm e copiar no *build* | Manteria versionamento, mas exigiria etapa de *build* mais elaborada; a cópia manual foi mais direta |

## Consequências

**Positivas** 🟢
- Funciona offline, sem CDN, dentro da restrição do Webview.
- Nenhuma etapa de *bundling*: `tsc` mais `cp` bastam.
- Modais, grid e componentes vieram prontos do Bootstrap.

**Negativas** 🟢
- **Nove bibliotecas sem controle de versão nem alerta de CVE** (`dependencies.md`, risco 2).
- `board.js` cresceu para 2.161 linhas em escopo global, sem módulos nem modo estrito.
- 121 modos do CodeMirror são versionados para uso de **um** modo (markdown, `html.ts:179`).
- Atualizar qualquer biblioteca exige baixar e substituir arquivos à mão.

## Reconhecimento explícito da dívida 🟢

Esta é a única decisão do sistema que o autor **declarou publicamente como erro a corrigir**:

- CHANGELOG 1.30.0 (2020-10-09): *"this is the last version, before the 🔔🔔🔔 GREAT
  REFACTORING 🔔🔔🔔"* (issue #53)
- CHANGELOG 1.31.1 (2020-12-10): *"still need help refactoring board's design in webview"*
  (issue #54)
- `announcements.ts:39`: *"Do you like to code in TypeScript and/or React.js and help
  refactoring the extension?"* — aviso exibido a todos os usuários desde outubro de 2020

## Status hoje

**A refatoração anunciada nunca aconteceu.** Após 1.30.0 vieram apenas três versões, todas de
manutenção (`npm update`, correções de compilação, ajuste do GitHub Actions). O último commit
é de novembro de 2022. O convite à refatoração continua embutido no código, exibido a cada
instalação nova — um pedido de socorro que ficou ligado.
