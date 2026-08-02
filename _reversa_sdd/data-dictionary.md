# Dicionário de Dados — vscode-kanban

> Gerado pelo **Arqueólogo** (Reversa) em 2026-08-02 · `doc_level: completo`
> Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA
>
> Não há banco de dados. Todas as estruturas abaixo são serializadas em JSON no arquivo
> `.vscode/vscode-kanban.json` do workspace, ou trafegam pela ponte de mensagens do Webview.

---

## 1. `Board` — o quadro 🟢

Origem: `src/boards.ts:32-49`. Raiz do arquivo persistido.

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `todo` | `BoardCard[]` | sim | `[]` | Cartões da coluna Todo |
| `in-progress` | `BoardCard[]` | sim | `[]` | Cartões da coluna In Progress |
| `testing` | `BoardCard[]` | sim | `[]` | Cartões da coluna Testing |
| `done` | `BoardCard[]` | sim | `[]` | Cartões da coluna Done |

**Invariantes** 🟢:
- As quatro chaves são fixas (`BOARD_COLMNS`, `boards.ts:388`). Colunas adicionais no arquivo
  são ignoradas na carga e **perdidas** na próxima gravação.
- Coluna ausente ou não-array é normalizada para `[]` por `asArray` (`boards.ts:1408`).
- Serialização com indentação de 2 espaços (`workspaces.ts:1131`).

---

## 2. `BoardCard` — o cartão 🟢

Origem: `src/boards.ts:54-104`.

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `title` | `string` | **sim** | — | Único campo obrigatório do modelo |
| `id` | `string` | não | gerado na carga | Identidade persistente |
| `type` | `string` | não | `''` | Tipo do cartão — ver §3 |
| `prio` | `number` | não | ausente → 0 na ordenação | Prioridade; maior vem primeiro |
| `category` | `string` | não | — | Categoria livre do usuário |
| `assignedTo` | `{name?: string}` | não | — | Responsável |
| `creation_time` | `string` | não | — | Instante ISO 8601 UTC |
| `description` | `BoardCardContentValue` | não | — | Descrição curta |
| `details` | `BoardCardContentValue` | não | — | Detalhamento |
| `references` | `string[]` | não | — | IDs de cartões referenciados |
| `tag` | `any` | não | — | Dados livres de scripts; abriga o time tracking |

### Campos transitórios (não persistidos)

| Campo | Tipo | Onde nasce | Descrição |
|---|---|---|---|
| `__uid` | `string` | `board.js:2013` | Identidade de sessão, formato `<índice>-<aleatório>-<epoch ms>`. Regenerada a cada carga; usada por `setCardTag`, `moveCardTo` e pelos scripts de evento 🟢 |

### Geração de `id` na carga 🟢 (`boards.ts:1411-1437`)

| Modo | Condição | Formato |
|---|---|---|
| Simples (padrão) | `simpleIDs` verdadeiro | Inteiro sequencial: `max(ids numéricos) + 1` |
| Composto | `simpleIDs` falso | `<YYYYMMDDHHmmss>_<aleatório>_<uuid sem hífens>`; o prefixo de data só aparece quando há `creation_time` válido |

---

## 3. Vocabulário de `type` 🟢

Não há enumeração formal. Os valores efetivos, extraídos dos pontos de uso:

| Valor | Origem | Interface | Filtro | Cor | Peso na ordenação | Exportação |
|---|---|---|---|---|---|---|
| `''` | padrão | "Note / task" (selecionado) | `is_note`, `is_task` | info / texto escuro | 0 | vira `note` |
| `bug` | seletor | "Bug / issue" | `is_bug`, `is_issue` | fundo escuro | −1 | `bug` |
| `emergency` | seletor | "Emergency" | `is_emergency`, `is_emerg` | vermelho (danger) | −2 | `emergency` |
| `issue` | só filtro/JSON | ✗ ausente | `is_bug`, `is_issue` | info (como genérico) | 0 | `issue` |
| `note` | só filtro/JSON | ✗ ausente | `is_note`, `is_task` | info | 0 | `note` |
| `task` | só filtro/JSON | ✗ ausente | `is_note`, `is_task` | info | 0 | `task` |

🟡 **Inconsistência confirmada:** `issue` é tratado como bug pelo filtro, mas recebe cor e
peso de cartão genérico. `note` e `task` só chegam ao quadro por edição manual ou script.

---

## 4. `BoardCardContent` e `BoardCardContentValue` 🟢

Origem: `src/boards.ts:109-123`.

```
BoardCardContentValue = string | BoardCardContent
```

| Campo | Tipo | Valores aceitos | Padrão |
|---|---|---|---|
| `content` | `string` | livre | — |
| `mime` | `string` | `text/markdown` ou `text/plain` | `text/plain` |

**Normalização na carga** 🟢 (`boards.ts:1354-1387`): string simples vira
`{content, mime: 'text/plain'}`; qualquer MIME diferente de `text/markdown` é forçado a
`text/plain`; conteúdo vazio faz o campo inteiro virar `undefined`.

A interface sempre grava `mime: 'text/markdown'` ao salvar pelo editor
(`board.js:423-438`), de modo que `text/plain` só sobrevive em cartões antigos ou editados à
mão.

---

## 5. `tag['time-tracking']` — rastreamento de tempo interno 🟢

Origem: `src/workspaces.ts:892-950`. Vive dentro do campo livre `tag` do cartão.

| Campo | Tipo | Descrição |
|---|---|---|
| `seconds` | `number` | Total acumulado, **recalculado do zero** a cada acionamento |
| `entries` | `string[]` | Carimbos ISO 8601 UTC, alternando início e fim |

**Regra de cálculo** 🟢: `seconds = Σ (entries[2k+1] − entries[2k])`. Número ímpar de entradas
significa cronômetro correndo; o intervalo aberto não entra no total.

Exemplo real de estrutura:

```json
{
  "tag": {
    "time-tracking": {
      "seconds": 3600,
      "entries": ["2026-08-02T10:00:00.000Z", "2026-08-02T11:00:00.000Z"]
    }
  }
}
```

---

## 6. `BoardSettings` — configurações enviadas ao Webview 🟢

Origem: `src/boards.ts:128-166`. Montado em `workspaces.ts:574-585` e transmitido em
`setBoard`.

| Campo | Tipo | Padrão efetivo | Origem da configuração |
|---|---|---|---|
| `canExecute` | `boolean` | `false` | `kanban.canExecute` |
| `canTrackTime` | `boolean` | derivado | `trackTime` não nulo e diferente de `false` |
| `columns.todo.name` | `string` | `Todo` | `kanban.columns.todo` |
| `columns.in-progress.name` | `string` | `In Progress` | `kanban.columns.inProgress` |
| `columns.testing.name` | `string` | `Testing` | `kanban.columns.testing` |
| `columns.done.name` | `string` | `Done` | `kanban.columns.done` |
| `hideTimeTrackingIfIdle` | `boolean` | `false` | `kanban.noTimeTrackingIfIdle` |
| `simpleIDs` | `boolean` | **`true`** | `kanban.simpleIDs` |

🟢 Note a **troca de nome na fronteira**: a configuração pública chama-se
`noTimeTrackingIfIdle`, o campo interno chama-se `hideTimeTrackingIfIdle`.

---

## 7. `Config` — configuração `kanban.*` 🟢

Origem: `src/workspaces.ts:93-163` e `package.json:33-169`. Escopo `resource`, isto é, por
pasta de workspace.

| Chave | Tipo | Padrão | Efeito |
|---|---|---|---|
| `canExecute` | `boolean` | `false` | Exibe botão de execução no cartão, ligado a `onExecute` |
| `cleanupExports` | `boolean` | `true` | Apaga exportações anteriores antes de regerar ⚠️ |
| `columns.done` | `string` | — | Nome de exibição |
| `columns.inProgress` | `string` | — | Nome de exibição |
| `columns.testing` | `string` | — | Nome de exibição |
| `columns.todo` | `string` | — | Nome de exibição |
| `exportOnSave` | `boolean` | `false` | Exporta cartões em Markdown a cada gravação |
| `exportPath` | `string` | `.vscode/` | Relativo resolve a partir de `.vscode/` |
| `globals` | `any` | — | Dados acessíveis aos scripts, clonados a cada evento |
| `maxExportNameLength` | `integer` (≥ 1) | `48` | `NaN` ou menor que 1 volta a 48 |
| `noScmUser` | `boolean` | `false` | Não detecta usuário via Git |
| `noSystemUser` | `boolean` | `false` | Não detecta usuário do SO |
| `noTimeTrackingIfIdle` | `boolean` | `false` | Oculta o botão de tempo em Todo e Done |
| `openOnStartup` | `boolean` | `false` | Abre o quadro na ativação **e a cada mudança de configuração** 🟡 |
| `simpleIDs` | `boolean` | `true` | IDs inteiros em vez de compostos |
| `trackTime` | `boolean \| objeto` | `false` | Ver §8 |

---

## 8. `trackTime` — as três formas 🟢

Origem: `package.json:114-165`, resolvido em `workspaces.ts:717-757`.

| Forma | Estrutura | Handler resultante |
|---|---|---|
| Booleana | `true` | `Workspace.trackTime` interno (carimbos alternados) |
| Script | `{type: '' \| 'script', options?: any}` | `onTrackTime` do `vscode-kanban.js`; `options` chega em `args.options` |
| Toggl | `{type: 'toggl' \| 'toggle', token: string, project?: integer}` | `toggl.trackTime` |

`token` é obrigatório na forma Toggl e aceita **o token literal ou o caminho de um arquivo**
que o contenha; caminho relativo resolve a partir do diretório home 🟢. Qualquer outro `type`
faz o despacho **retornar sem efeito nem aviso** (`workspaces.ts:747-748`) 🟢.

---

## 9. `EventScriptFunctionArguments` — contrato dos scripts do usuário 🟢

Origem: `src/workspaces.ts:213-256`, enriquecido em `:810-878`.

| Campo | Tipo | Sempre presente | Descrição |
|---|---|---|---|
| `data` | `any` | sim | Carga específica do evento — ver §10 |
| `extension` | `vscode.ExtensionContext` | sim | Contexto completo da extensão ⚠️ |
| `file` | `string` | sim | Caminho absoluto do `vscode-kanban.json` |
| `globals` | `any` | sim | Clone da configuração `globals` |
| `logger` | `vscode_helpers.Logger` | sim | Logger da extensão |
| `name` | `string` | sim | Nome do evento |
| `options` | `any` | não | Clone de `trackTime.options` |
| `require` | `(id: string) => any` | sim | `require` irrestrito ⚠️ |
| `session` | `any` | sim | Estado global da sessão, compartilhado entre workspaces |
| `state` | `any` | sim | Estado por workspace, vive enquanto o `Workspace` existir |
| `tag` | `any` (getter) | exceto `column_cleared` | Atalho para `data.card.tag` |
| `uid` | `string` (getter) | exceto `column_cleared` | Atalho para `data.card.__uid` |
| `setTag` | `(tag, card?) => PromiseLike<boolean>` | sim | Grava o `tag`; atualiza a cópia local se der certo |
| `moveToTodo` | `(card?) => PromiseLike<boolean>` | sim | Move para Todo |
| `moveToInProgress` | `(card?) => PromiseLike<boolean>` | sim | Move para In Progress |
| `moveToTesting` | `(card?) => PromiseLike<boolean>` | sim | Move para Testing |
| `moveToDone` | `(card?) => PromiseLike<boolean>` | sim | Move para Done |

🟢 O argumento `card` dos métodos aceita **o objeto do cartão ou o `__uid` como string**;
não encontrando o cartão, lança `Error('Card not found')` (`workspaces.ts:666`).

---

## 10. Catálogo de eventos 🟢

Origem: `workspaces.ts:771-802` (extensão) e pontos de disparo em `board.js`.

| Evento | Função do script | `data` | Disparo |
|---|---|---|---|
| `card_created` | `onCardCreated` | `{card, column, others}` | `board.js:1877` |
| `card_updated` | `onCardUpdated` | `{card, oldCard, column, others}` | `board.js:214` |
| `card_deleted` | `onCardDeleted` | `{card, column, others}` | `board.js:1052` |
| `card_moved` | `onCardMoved` | `{card, from, to, others}` | `board.js:1470`, `:1986` |
| `column_cleared` | `onColumnCleared` | `{cards, column}` | `board.js:1688` |
| `execute_card` | `onExecute` | `{card, column, others}` | `board.js:983` |
| `track_time` | `onTrackTime` | `{card, column, others}` | `board.js:1009` |
| *(qualquer)* | `onEvent` | conforme o evento | Fallback quando a função específica não existe 🟢 |

🟢 `column_cleared` é o único evento sem `tag` e sem `uid` nos argumentos, porque opera sobre
uma coleção e não sobre um cartão.

---

## 11. Protocolo de mensagens do Webview 🟢

### Webview → Extensão (`boards.ts:1119-1251`)

| Comando | `data` | Efeito |
|---|---|---|
| `log` | `{message: string}` | Console e logger em nível debug |
| `onLoaded` | — | Carrega o quadro, envia título e usuário corrente |
| `openExternalUrl` | `{url, text}` | Abre após confirmação explícita do usuário |
| `openKnownUrl` | chave de `KNOWN_URLS` | Abre sem confirmação (lista fixa) |
| `raiseEvent` | `{name, data}` | Despacha ao script do workspace |
| `reloadBoard` | — | Relê o arquivo do disco |
| `saveBoard` | `Board` | Grava e, se configurado, exporta |
| `saveFilter` | `string` | Grava `.vscode/vscode-kanban.filter` |

### Extensão → Webview (`board.js:1930-2085`)

| Comando | `data` | Efeito |
|---|---|---|
| `setBoard` | `{cards, filter, settings}` | Substitui o estado, gera `__uid`, re-renderiza |
| `setTitleAndFilePath` | `{title, file}` | Atualiza cabeçalho |
| `setCurrentUser` | `{name}` | Preenche "Assigned To" de novos cartões |
| `moveCardTo` | `{uid, column}` | Move por script; grava e dispara `card_moved` |
| `setCardTag` | `{uid, tag}` | Grava o `tag` e persiste |
| `webviewIsVisible` | — | Reativa atualização de tempos relativos |

### `KNOWN_URLS` 🟢 (`boards.ts:394-401`)

`filter-help`, `github`, `mermaid-help`, `markdown-help`, `paypal`, `twitter`.

---

## 12. Ambiente da linguagem de filtro 🟢

Compilado por Filtrex em `script.js:206-212`. Uma expressão inválida devolve `true`, ou seja,
**mostra tudo**.

### Valores disponíveis por cartão (`board.js:898-926`)

| Nome | Tipo | Fonte |
|---|---|---|
| `id` | string | `card.id` |
| `title` | string | `card.title` |
| `type` | string | `card.type` normalizado |
| `prio`, `priority` | number | `card.prio`, `NaN` → 0 |
| `cat`, `category` | string | `card.category` |
| `assigned_to` | string | `card.assignedTo.name` |
| `description` | string | conteúdo Markdown |
| `details` | string | conteúdo Markdown |
| `tag` | any | `card.tag` |
| `time` | number \| false | `creation_time` em epoch, ou `false` |
| `now` | number | agora, hora local |
| `utc` | number | agora, UTC |
| `is_bug`, `is_issue` | boolean | tipo ∈ {bug, issue} |
| `is_note`, `is_task` | boolean | tipo ∈ {'', note, task} |
| `is_emergency`, `is_emerg` | boolean | tipo = emergency |
| `true`, `yes` / `false`, `no` | boolean | literais |
| `null`, `undefined` | — | literais |

### Funções

**Genéricas** (`script.js:63-192`): `all`, `any`, `concat`, `contains`, `debug`, `float`,
`int`, `integer`, `is_empty`, `is_nan`, `is_nil`, `norm`, `normalize`, `number`, `regex`,
`str`, `str_invoke`, `unix`.

**Por cartão** (`board.js:838-896`): `is_after(data, ouIgual?)`, `is_before(data, ouIgual?)`,
`is_older(dias, ouIgual?)`, `is_younger(dias, ouIgual?)`, `is_cat(valor)`,
`is_category(valor)`, `is_assigned_to(valor)`.

---

## 13. Arquivos e caminhos 🟢

| Caminho | Escopo | Conteúdo | Escrito por |
|---|---|---|---|
| `<workspace>/.vscode/vscode-kanban.json` | workspace | `Board` em JSON | `saveBoardTo` |
| `<workspace>/.vscode/vscode-kanban.filter` | workspace | Expressão de filtro, texto puro | `saveToFile` |
| `<workspace>/.vscode/vscode-kanban.js` | workspace | Script de eventos (**lido e executado**) | usuário |
| `<workspace>/.vscode/settings.json` | workspace | Configuração `kanban.*` | usuário / VS Code |
| `<exportPath>/vscode-kanban_<coluna>_<n>_<título>.card.md` | workspace | Cartão exportado | `exportBoardCardsTo` |
| `~/.vscode-kanban/.logs/YYYYMMDD.log` | usuário | Log diário | logger |
| `<res>/vscode-kanban.css` | workspace `.vscode/` | Estilo customizado opcional, injetado no Webview | usuário |

🟡 O `vscode-kanban.css` é resolvido por `GET_RES_URI('vscode-kanban.css')`
(`boards.ts:526`), que percorre as raízes de recurso — incluindo `.vscode/` do workspace e o
diretório home. Um arquivo com esse nome em qualquer dessas raízes é injetado como folha de
estilo.

---

## 14. Estado global do VS Code 🟢

| Chave | Tipo | Módulo | Papel |
|---|---|---|---|
| `vsckbLastKnownVersion` | `string` | `extension` | Última versão cujo CHANGELOG foi exibido |
| `vsckb_announcement_20201009_655f729b` | `string` | `announcements` | Aviso silenciado quando vale exatamente `'3'` |
