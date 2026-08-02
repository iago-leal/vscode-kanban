# ADR-002 — Quatro colunas fixas, com renomeação apenas na exibição

> ADR **retroativo**, reconstruído pelo Detetive.

- **Status:** aceito e vigente; revisitado parcialmente em 1.20.0 (2018-07-04)
- **Data inferida:** 2018-05-25 (modelo inicial), revisto em 2018-07-04
- **Confiança:** 🟢 na decisão · 🟢 na revisão parcial · 🟡 na motivação

## Contexto

Um quadro Kanban tem colunas. A modelagem podia representá-las como **lista ordenada de
objetos** (número e nomes arbitrários) ou como **objeto com chaves fixas**.

## Decisão

Modelar o quadro como objeto com **quatro chaves fixas** — `todo`, `in-progress`, `testing`,
`done` — declaradas em `BOARD_COLMNS` (`boards.ts:388-393`, com o erro de digitação
"COLMNS" preservado até hoje).

Em julho de 2018, diante da issue #14 pedindo colunas customizadas, a resposta foi
**renomear a exibição**, não flexibilizar o modelo: `kanban.columns.{todo, inProgress,
testing, done}` altera apenas o rótulo apresentado.

## Evidências

- `BOARD_COLMNS: ReadonlyArray<string>` com quatro elementos (`boards.ts:388`)
- Interface `Board` com quatro propriedades nomeadas (`boards.ts:32-49`)
- HTML dos quatro contêineres literal em `generateHTML` (`boards.ts:452-522`)
- CHANGELOG 1.20.0: *"can define custom column names now ... s. issue #14"*
- `ColumnSettings` só tem o campo `name` (`boards.ts:249-254`)

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| Lista de colunas com número arbitrário | Exigiria reescrever o modelo, o HTML (quatro blocos literais), a exportação, o filtro e a migração de todos os arquivos existentes — em uma extensão já publicada |
| Colunas fixas com nomes internos configuráveis | Quebraria a compatibilidade dos arquivos já gravados |
| Coluna extra opcional (ex.: "Backlog") | Não resolveria o pedido genérico da issue #14 e ainda assim exigiria mudança de modelo |

## Consequências

**Positivas** 🟢
- Modelo simples, sem migração de dados em quatro anos de vida.
- HTML estático, sem renderização dinâmica de colunas.
- O fluxo Todo → In Progress → Testing → Done é opinativo e dispensa configuração.

**Negativas** 🟢
- Colunas extras no arquivo são silenciosamente descartadas (RD-03).
- Quem precisa de "Backlog" ou "Bloqueado" não tem saída, apenas rótulos diferentes para as
  quatro existentes.
- A semântica das colunas fica presa: `noTimeTrackingIfIdle` codifica em regra que Todo e Done
  são estados inativos (`workspaces.ts:583`), suposição que quebra se o usuário renomear as
  colunas para outra coisa.
- O acoplamento HTML ↔ modelo torna a flexibilização posterior cara.

## Status hoje

Vigente. É a **decisão de modelagem mais restritiva do sistema** e o principal candidato a
revisão em qualquer evolução — mas seu custo de mudança é alto porque atravessa modelo, HTML,
exportação e arquivos já existentes de todos os usuários.
