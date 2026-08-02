# ADR-001 — Persistir o quadro em JSON dentro de `.vscode/`

> ADR **retroativo**, reconstruído pelo Detetive a partir do código e do histórico.
> A decisão não foi documentada à época; a intenção abaixo é inferida.

- **Status:** aceito e vigente desde a versão 1.0.1 (2018-05-27)
- **Data inferida:** 2018-05-25 a 2018-05-27 (commits `initial commit` a `first stable`)
- **Confiança:** 🟢 na decisão · 🟡 na motivação

## Contexto

A extensão precisava guardar o quadro de cartões de um projeto. As opções usuais eram um
serviço remoto, um banco local ou um arquivo no próprio projeto. O produto nasceu com a
premissa de que o acompanhamento de tarefas deve viver junto do código.

## Decisão

Persistir o quadro inteiro como **um único arquivo JSON** em
`<workspace>/.vscode/vscode-kanban.json`, serializado com indentação de dois espaços
(`workspaces.ts:1124-1133`). Ao lado dele, dois arquivos irmãos: `vscode-kanban.filter` para o
último filtro e `vscode-kanban.js` para os scripts de evento.

## Evidências

- `BOARD_FILENAME = 'vscode-kanban.json'` (`workspaces.ts:310`)
- `saveBoardTo` grava com `JSON.stringify(board, null, 2)` (`workspaces.ts:1129-1133`)
- Nenhuma dependência de banco de dados no `package.json`

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| Serviço remoto com conta | Exigiria infraestrutura, autenticação e custo recorrente; incompatível com extensão gratuita mantida por uma pessoa |
| SQLite local | Binário não versionável, difícil de revisar em *pull request*, exigiria dependência nativa |
| `globalState` / `workspaceState` do VS Code | Não é versionável nem visível ao usuário; perderia o benefício central de acompanhar o quadro no Git |
| Arquivo Markdown como fonte | Exigiria parser próprio; o Markdown veio depois, como **saída** de exportação (ADR-005) |

## Consequências

**Positivas** 🟢
- O quadro é versionado com o código: histórico, *diff*, *branch* e revisão vêm de graça.
- Indentação de dois espaços torna o *diff* legível — decisão pequena e deliberada.
- Zero infraestrutura, zero custo, zero conta.
- O usuário pode editar o arquivo à mão, e o sistema tolera (normalização na carga).

**Negativas** 🟢
- Sem controle de concorrência: quem grava por último vence (§ `code-analysis`, achado E1).
- `JSON.parse` sem tratamento de erro: arquivo corrompido quebra a carga sem recuperação
  (`boards.ts:1342`).
- Conflitos de *merge* em JSON de uma linha por cartão são desconfortáveis, ainda que
  mitigados pela indentação.
- O quadro inteiro é reescrito a cada alteração de um único cartão.

## Status hoje

Vigente e adequado ao contexto. As fragilidades são de **implementação**, não da decisão:
validação de esquema, tratamento de erro e cópia de segurança antes da gravação resolveriam
quase tudo sem tocar na escolha de fundo.
