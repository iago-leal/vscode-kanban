# Abertura do Quadro — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| comando | `extension.kanban.openBoard` | — | Único comando contribuído |
| `Workspace.openBoard` | `()` | `Promise<void>` | Método de instância, uma por pasta |
| `boards.openBoard` | `(opts?: OpenBoardOptions)` | `Promise<KanbanBoard>` | Fábrica |
| `KanbanBoard.open` | `(opts?: OpenBoardOptions)` | `Promise<boolean>` | `false` se já houver painel |
| `KanbanBoard.onLoaded` | `()` | `Promise<void>` | Privado; reage ao comando do Webview |

### `OpenBoardOptions` (contrato de entrada) 🟢

| Campo | Tipo | Preenchido por `Workspace` com |
|---|---|---|
| `additionalResourceRoots` | `Uri \| Uri[]` | `<workspace>/.vscode` |
| `fileResolver` | `() => Uri` | `() => this.boardFile` |
| `git` | `any` | `tryCreateGitClient(folder)` |
| `loadFilter` | `() => string \| PromiseLike<string>` | leitura de `.filter`, `''` em falha |
| `noScmUser` / `noSystemUser` | `boolean` | configuração `kanban.*` |
| `raiseEvent` | `EventListener` | despacho para o script do usuário |
| `saveBoard` / `saveFilter` | listeners | gravação em disco |
| `settings` | `BoardSettings` | derivadas da configuração |
| `title` | `string` | nome da pasta ou `Workspace #<índice>` |

## Fluxo Principal

1. `activate` registra o comando e o *workspace watcher* (`extension.ts:221-298`).
2. O watcher cria um `Workspace` por pasta local e chama `initialize` (`extension.ts:271-279`).
3. `initialize` fixa `configSource` (`section: 'kanban'`) e carrega a configuração
   (`workspaces.ts:381-389`).
4. Ao acionar o comando, monta-se um `ActionQuickPickItem` por workspace
   (`extension.ts:226-239`).
5. `Workspace.openBoard` resolve os três caminhos de `.vscode/` e garante o arquivo do quadro
   (`workspaces.ts:428-461`).
6. Monta `ColumnSettings` a partir de `kanban.columns` e cria o cliente Git
   (`workspaces.ts:476-501`).
7. `boards.openBoard` instancia `KanbanBoard`, registra listeners e chama `open`
   (`boards.ts:1493-1509`).
8. `open` cria o painel com `createWebviewPanel`, registra os dois listeners de evento e
   atribui o HTML (`boards.ts:1102-1278`).
9. O Webview, ao terminar de carregar, envia `onLoaded` (`board.js:2160`).
10. `onLoaded` chama `reloadBoard`, envia `setTitleAndFilePath` e resolve o usuário corrente
    (`boards.ts:983-1034`).

## Fluxos Alternativos

- **Pasta remota (URI não `file`):** o watcher ignora e nenhum `Workspace` é criado
  (`extension.ts:274`).
- **Nenhum workspace:** aviso "No workspace found!" (`extension.ts:241-247`).
- **Workspace único:** o seletor é pulado (`extension.ts:250-252`).
- **Usuário cancela o seletor:** `selectedItem` fica indefinido e nada acontece
  (`extension.ts:259`).
- **`.vscode` não é diretório:** aviso e retorno (`workspaces.ts:450-456`).
- **Caminho do quadro não é arquivo:** aviso e retorno (`workspaces.ts:463-469`).
- **Painel já existe:** `open` devolve `false` sem efeito (`boards.ts:1078-1080`).
- **Falha ao criar o painel:** `tryDispose` no painel parcial, `_openOptions` volta a nulo e o
  erro é relançado (`boards.ts:1281-1286`).
- **`openOnStartup` ligado:** a abertura ocorre dentro de `onDidChangeConfiguration`, portanto
  também a cada alteração de configuração (`workspaces.ts:413`) 🟡.

## Dependências

- `extension` — `showError`, `getWebViewResourceUris`, `getLogger`
- `html` — `generateHtmlDocument` para montar o documento
- `vscode-helpers` — `registerWorkspaceWatcher`, `tryCreateGitClient`, `isFile`, `isDirectory`
- `fs-extra` — `mkdirs`, `writeFile`
- `board-ui` — envia `onLoaded` e consome `setBoard`

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Uma instância `Workspace` por pasta, criada pelo watcher | `extension.ts:271-279` | 🟢 |
| O quadro é criado vazio em vez de exigir ação do usuário | `workspaces.ts:458-460` | 🟢 |
| O Webview inicia a conversa (`onLoaded`), a extensão responde | `board.js:2160`, `boards.ts:1143` | 🟢 |
| `retainContextWhenHidden` para preservar estado ao ocultar | `boards.ts:1110` | 🟢 |
| Recursos incluem o diretório home do usuário | `boards.ts:922-932` | 🟢 ⚠️ |
| `enableCommandUris: true` | `boards.ts:1107` | 🟢 ⚠️ |

## Estado Interno

| Estado | Onde vive | Ciclo de vida |
|---|---|---|
| `_panel` | `KanbanBoard` | Da criação ao `dispose` |
| `_openOptions` | `KanbanBoard` | Definido em `open`, zerado em falha |
| `_saveBoardEventListeners` / `_saveBoardFilterEventListeners` | `KanbanBoard` | Zerados em `initialize` e em `onDispose` |
| `_config`, `_configSrc`, `_STATE` | `Workspace` | Enquanto a pasta estiver aberta |
| `workspaceWatcher`, `logger`, `packageFile` | módulo `extension` | Sessão do editor |

## Observabilidade

- Erros na abertura chegam a `showError`, que loga em nível *trace* e exibe popup
  (`extension.ts:576-586`) 🟢
- Mensagens do Webview com comando `log` são registradas em nível *debug* (`boards.ts:1120-1141`) 🟢
- 🟡 Falhas no ramo `Removed` do watcher não geram log algum: o bloco está vazio
  (`extension.ts:287-288`)

## Riscos e Lacunas

- 🔴 O escopo das raízes de recurso (home inteiro) precisa de validação — ver `questions.md` Q3
- 🟡 `openOnStartup` reabrir a cada mudança de configuração parece efeito colateral, não intenção
- 🟡 O ramo `Removed` do watcher não descarta o `Workspace` correspondente
- 🟢 `showOptions` existe em `OpenBoardOptions` mas nunca é preenchido: o quadro sempre abre em
  `ViewColumn.One`
