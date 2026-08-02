# Persistência do Quadro — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `newBoard` | `()` | `Board` | Quatro colunas vazias |
| `KanbanBoard.reloadBoard` | `()` | `Promise<void>` | Privado; lê, normaliza e envia `setBoard` |
| `saveBoardTo` | `(board: Board, file: string)` | `Promise<void>` | Módulo-privado em `workspaces.ts` |
| `Workspace.boardFile` | getter | `vscode.Uri` | `<pasta>/.vscode/vscode-kanban.json` |
| `vsckb_save_board` | `()` | `void` | Webview: envia `saveBoard` com `allCards` |
| `vsckb_reload_board` | `()` | `void` | Webview: envia `reloadBoard` |

### Formato persistido 🟢

```json
{
  "todo": [ { "title": "…", "id": "1", "type": "", "prio": 0, "creation_time": "…" } ],
  "in-progress": [],
  "testing": [],
  "done": []
}
```

Serializado com `JSON.stringify(board, null, 2)`.

## Fluxo Principal

### Carga (`reloadBoard`)

1. Resolve o arquivo por `fileResolver`; sem arquivo, retorna (`boards.ts:1337-1340`).
2. `readFile` em UTF-8 e `JSON.parse` — **sem `try/catch`** (`boards.ts:1342-1346`).
3. Resultado nulo vira `newBoard()` (`boards.ts:1348-1350`).
4. `cloneObject` do resultado (`boards.ts:1352`).
5. Para cada coluna de `BOARD_COLMNS`, força array com `asArray` (`boards.ts:1407-1409`).
6. Para cada cartão sem `id`, gera identidade (`boards.ts:1411-1437`):
   - `simpleIDs` verdadeiro: `FIND_NEXT_SIMPLE_CARD_ID()` percorre o quadro e devolve
     `max(ids numéricos) + 1`;
   - falso: monta `<data>_<aleatório>_<uuid>`.
7. `SET_CARD_CONTENT` normaliza `description` e depois `details` (`boards.ts:1439-1440`).
8. Carrega o filtro por `loadFilter` (`boards.ts:1445-1455`).
9. Envia `setBoard` com `{cards, filter, settings}` (`boards.ts:1457-1461`).

### Gravação

1. O Webview envia `saveBoard` com `allCards` inteiro (`board.js:1237`).
2. `KanbanBoard` percorre os listeners registrados (`boards.ts:1217-1233`).
3. O listener do `Workspace` chama `saveBoardTo` (`workspaces.ts:518-527`).
4. `saveBoardTo` trata quadro nulo como `newBoard()` e grava com indentação
   (`workspaces.ts:1124-1133`).
5. Se `exportOnSave`, a exportação roda em seguida, em bloco `try/catch` próprio
   (`workspaces.ts:528-562`).

## Fluxos Alternativos

- **Arquivo inexistente na abertura:** criado vazio antes, pela unit `abertura-do-quadro`
  (`workspaces.ts:445-461`).
- **Conteúdo `null`:** substituído por `newBoard()` (`boards.ts:1348-1350`).
- **Coluna ausente ou não-array:** `asArray` devolve `[]` (`boards.ts:1408`).
- **`creation_time` inválido:** o prefixo de data do `id` composto é omitido; o `try/catch` em
  `boards.ts:1414-1423` engole a falha.
- **Falha ao carregar o filtro:** `showError` e o quadro segue sem filtro
  (`boards.ts:1453-1455`).
- **Falha na gravação:** `showError`; a exportação ainda assim é tentada
  (`workspaces.ts:518-562`) 🟢.
- **JSON malformado:** 🔴 a promessa é rejeitada e o erro sobe; não há recuperação.

## Dependências

- `fs-extra` — `readFile`, `writeFile`
- `vscode-helpers` — `cloneObject`, `asArray`, `uuid`, `asUTC`, `isEmptyString`
- `abertura-do-quadro` — fornece o `fileResolver` e garante a existência do arquivo
- `configuracao-do-workspace` — fornece `simpleIDs`
- `board-ui` — origem de `saveBoard` e destino de `setBoard`

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| JSON no workspace como formato de persistência (ADR-001) | `workspaces.ts:310` | 🟢 |
| Indentação de dois espaços para *diff* legível | `workspaces.ts:1131` | 🟢 |
| Tolerância na carga em vez de versionamento de esquema | `boards.ts:1407-1442` | 🟡 |
| `id` atribuído **na criação** (Webview) e **também na carga** (extensão), com a mesma lógica implementada duas vezes | `board.js:1841-1852` e `boards.ts:1411-1437` | 🟢 |
| Quadro inteiro trafega e é reescrito a cada gravação (ADR-008) | `board.js:1237` | 🟢 |
| `simpleIDs` verdadeiro por padrão, invertendo o comportamento pré-1.22.0 | `workspaces.ts:584` | 🟢 |

## Estado Interno

Esta unit é **sem estado próprio** 🟢. O quadro vive em `allCards`, no Webview
(`board.js:2`); a extensão apenas transporta. Nenhum campo de `KanbanBoard` ou de `Workspace`
guarda cópia do quadro.

## Observabilidade

- Falhas de gravação e de carga do filtro passam por `showError`, com log em nível *trace* 🟢
- 🔴 Não há log de gravação bem-sucedida, de tamanho do quadro nem de quantidade de cartões
- 🔴 Falha de `JSON.parse` não tem log próprio; chega como erro genérico ao usuário

## Riscos e Lacunas

- 🔴 **JSON malformado quebra a carga sem recuperação nem cópia de segurança**
  (`boards.ts:1342`)
- 🔴 Gravação não atômica: uma falha no meio do `writeFile` deixa o arquivo truncado
- 🟢 **Lógica de geração de `id` duplicada** entre `board.js:1841-1852` (criação, no Webview) e
  `boards.ts:1411-1437` (carga, na extensão). As duas implementações precisam permanecer
  equivalentes; divergirem produz identidades inconsistentes conforme a origem do cartão.
  Encontrado na revisão — ver `gaps.md` G-01
- 🟡 Geração de IDs simples é O(n²) e depende da ordem das colunas — ver `questions.md` Q2
- 🟡 Colunas extras no arquivo são perdidas silenciosamente
- 🟡 Sem detecção de alteração externa: um `git pull` é sobrescrito pela próxima gravação
- 🟢 Não há campo de versão do esquema, o que torna qualquer mudança de modelo arriscada
