# ADR-005 — Exportação de cartões em Markdown, com limpeza por glob

> ADR **retroativo**, reconstruído pelo Detetive.

- **Status:** aceito e vigente desde a versão 1.13.1 (2018-06-12)
- **Confiança:** 🟢 na decisão · 🟡 na motivação

## Contexto

A issue #5 pediu que os cartões pudessem existir fora do quadro, em formato legível. O quadro
é JSON — ótimo para a máquina, ruim para leitura em *pull request*, wiki ou documentação.

## Decisão

Gerar, a cada gravação e quando `exportOnSave` estiver ligado, **um arquivo Markdown por
cartão** em `exportPath` (padrão `.vscode/`), nomeados
`vscode-kanban_<coluna>_<índice>_<título>.card.md`.

Para evitar arquivos órfãos de cartões apagados ou renomeados, a exportação **apaga antes de
gerar**: um glob por `vscode-kanban_*.card.md` no diretório, seguido de `unlink` de cada
resultado. Esse comportamento é governado por `cleanupExports`, cujo padrão é **`true`**.

## Evidências

- CHANGELOG 1.13.1: *"added `exportOnSave` setting, which will save cards to external markdown
  files ... s. issue #5"*
- `exportBoardCardsTo` (`workspaces.ts:959-1122`)
- Glob e `unlink` (`workspaces.ts:970-986`)
- `cleanup: toBooleanSafe(CFG.cleanupExports, true)` — padrão verdadeiro (`workspaces.ts:555`)

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| Um único arquivo Markdown com o quadro inteiro | Perderia a granularidade de um documento por cartão, útil para vincular de outros lugares |
| Exportação sob demanda (comando manual) | Exigiria mais um comando e a lembrança do usuário; o gancho na gravação é automático |
| Não apagar, apenas sobrescrever | Deixaria órfãos ao renomear ou apagar cartões — o problema que a limpeza resolve |
| Rastrear os arquivos gerados numa lista | Mais seguro que o glob, mas exigiria estado extra a manter e sincronizar |

## Consequências

**Positivas** 🟢
- Cartões viram documentos versionáveis, citáveis e pesquisáveis fora do editor.
- O prefixo `vscode-kanban_` delimita o espaço de nomes da extensão.
- Nomes saneados (`sanitize-filename`) e truncados evitam problemas de sistema de arquivos.
- O laço de colisão de nomes garante que dois cartões de mesmo título não se sobrescrevam.

**Negativas** 🔴
- **A limpeza apaga por padrão qualquer arquivo `vscode-kanban_*.card.md` do diretório**, tenha
  ou não sido gerado pela extensão. Apontar `exportPath` para uma pasta com arquivos assim
  nomeados os destrói sem confirmação.
- A exportação roda a **cada** gravação, ou seja, a cada movimento de cartão: apagar e regerar
  N arquivos por clique.
- O escape com `HtmlEntities.encode` aplicado a conteúdo Markdown produz `&amp;` no arquivo
  final — escape na camada errada (`workspaces.ts:1087-1094`).
- O índice no nome do arquivo (`{1}`) é a posição na coluna, de modo que **mover qualquer
  cartão renomeia os arquivos dos demais**, poluindo o *diff* do Git.

## Status hoje

Vigente. A decisão é boa; a **limpeza por glob** é o ponto a revisar. Uma lista de arquivos
gerados, gravada junto do quadro, ou um subdiretório dedicado à exportação eliminariam o risco
sem perder a garantia contra órfãos.
