# Configuração do Workspace — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `Workspace.initialize` | `()` | `Promise<void>` | Fixa a fonte e faz a primeira carga |
| `Workspace.onDidChangeConfiguration` | `()` | `Promise<void>` | Recarrega, com proteção de reentrância |
| `Workspace.config` | getter | `Config` | Configuração corrente |
| `Workspace.configSource` | getter | `WorkspaceConfigSource` | `{section: 'kanban', resource}` |
| `Workspace.canTrackTime` | getter | `boolean` | Derivado |

### Tabela completa de chaves 🟢

| Chave | Tipo | Padrão | Consumida por |
|---|---|---|---|
| `canExecute` | boolean | `false` | `scripts-de-evento-do-usuario` |
| `cleanupExports` | boolean | **`true`** | `exportacao-markdown` |
| `columns.todo` | string | — | `colunas-e-movimentacao` |
| `columns.inProgress` | string | — | `colunas-e-movimentacao` |
| `columns.testing` | string | — | `colunas-e-movimentacao` |
| `columns.done` | string | — | `colunas-e-movimentacao` |
| `exportOnSave` | boolean | `false` | `exportacao-markdown` |
| `exportPath` | string | `.vscode/` | `exportacao-markdown` |
| `globals` | any | — | `scripts-de-evento-do-usuario` |
| `maxExportNameLength` | integer ≥ 1 | `48` | `exportacao-markdown` |
| `noScmUser` | boolean | `false` | `identificacao-de-usuario` |
| `noSystemUser` | boolean | `false` | `identificacao-de-usuario` |
| `noTimeTrackingIfIdle` | boolean | `false` | `time-tracking` |
| `openOnStartup` | boolean | `false` | `abertura-do-quadro` |
| `simpleIDs` | boolean | **`true`** | `persistencia-do-quadro` |
| `trackTime` | boolean \| objeto | `false` | `time-tracking`, `integracao-toggl` |

### Derivação para o Webview 🟢

| Campo de `BoardSettings` | Origem |
|---|---|
| `canExecute` | `kanban.canExecute` |
| `canTrackTime` | derivado de `trackTime` |
| `columns.<coluna>.name` | `kanban.columns.*`, com queda para o padrão |
| `hideTimeTrackingIfIdle` | `kanban.noTimeTrackingIfIdle` — **renomeado na fronteira** |
| `simpleIDs` | `kanban.simpleIDs`, padrão verdadeiro |

## Fluxo Principal

1. `initialize` define `configSource` apontando para `.vscode/settings.json`, seção `kanban`
   (`workspaces.ts:382-386`).
2. Chama `onDidChangeConfiguration`, que faz a primeira carga.
3. A recarga verifica `_isReloadingConfig`; estando em curso, reagenda a si mesma em 1 segundo
   com os mesmos argumentos e retorna (`workspaces.ts:395-404`).
4. Marca o sinalizador, chama `vscode.workspace.getConfiguration('kanban', resource)`, guarda o
   resultado e chama `openBoardOnStartup` (`workspaces.ts:406-413`).
5. O sinalizador é liberado no `finally` (`workspaces.ts:414-416`).
6. Ao abrir o quadro, `BoardSettings` é montado a partir da configuração
   (`workspaces.ts:574-585`).

## Fluxos Alternativos

- **Configuração ausente:** `getConfiguration` devolve objeto vazio, e os padrões valem
  (`workspaces.ts:408-409`) 🟢.
- **Nome de coluna com espaços:** `toStringSafe(...).trim()` produz string vazia, que cai no
  padrão (`workspaces.ts:485-490`, `board.js:502-506`) 🟢.
- **`trackTime` com forma inesperada:** o despacho retorna sem efeito
  (`workspaces.ts:747-748`) 🟢.
- **Alterações em rajada:** cada uma reagenda a seguinte, encadeando recargas de 1 em 1
  segundo 🟡.
- **`openOnStartup` ligado:** cada recarga tenta reabrir o quadro; a duplicata é evitada apenas
  porque `open()` recusa quando já existe painel (`workspaces.ts:590-598`) 🟡.

## Dependências

- API de configuração do VS Code — leitura por recurso
- `vscode-helpers` — `WorkspaceBase`, `invokeAfter`, `toBooleanSafe`, `toStringSafe`
- Todas as demais units — consumidoras da configuração

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Escopo `resource` para configuração por pasta | `package.json:36` | 🟢 |
| Proteção contra reentrância por sinalizador e atraso fixo | `workspaces.ts:394-404` | 🟢 |
| `simpleIDs` com padrão verdadeiro, invertendo o comportamento anterior à 1.22.0 | `workspaces.ts:584` | 🟢 |
| `cleanupExports` com padrão verdadeiro, único destrutivo ligado por omissão | `workspaces.ts:555` | 🟢 ⚠️ |
| Renomeação `noTimeTrackingIfIdle` → `hideTimeTrackingIfIdle` na fronteira | `workspaces.ts:583` | 🟢 |
| `canTrackTime` derivada em vez de configurada | `workspaces.ts:356-362` | 🟢 |
| `trackTime` como união de três formas numa única chave | `package.json:114-165` | 🟢 |

## Estado Interno

| Estado | Onde | Ciclo de vida |
|---|---|---|
| `_config` | `Workspace` | Substituído a cada recarga |
| `_configSrc` | `Workspace` | Fixado em `initialize` |
| `_isReloadingConfig` | `Workspace` | Sinalizador de reentrância |

## Observabilidade

- 🟢 Falha em `openBoardOnStartup` chega a `showError`
- 🔴 Recargas de configuração não são registradas: não há como diagnosticar por que um valor
  não surtiu efeito
- 🔴 Valor inválido é silenciosamente substituído pelo padrão, sem aviso

## Riscos e Lacunas

- 🟡 **`openOnStartup` reabre a cada recarga**, não apenas na ativação. A duplicata só não
  ocorre porque a criação de painel é recusada quando já existe um
- 🟢 **`cleanupExports` verdadeiro por padrão** é a única chave destrutiva ligada por omissão:
  quem liga `exportOnSave` liga junto, sem saber, a exclusão por glob
- 🟢 A renomeação na fronteira (`no…` para `hide…`) é fonte de confusão ao ler o código
- 🟡 Nenhuma validação além do esquema JSON: `trackTime` com `type` errado desliga o recurso em
  silêncio
- 🟢 O token do Toggl fica em texto puro numa chave de configuração, em arquivo que costuma ser
  versionado
