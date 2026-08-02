# Delta de dados: nova interface do quadro

> Identificador: `001-interface-react-tema-e-done`
> Data: `2026-08-02`
> Base de comparação: `_reversa_sdd/erd-complete.md`, `_reversa_sdd/data-dictionary.md`

## 1. Veredito em uma linha

**O modelo persistido do quadro não muda em nada.** Nenhum campo entra, nenhum sai, nenhum troca
de tipo ou de significado. O que a feature acrescenta é um modelo **de exibição**, que vive fora
do arquivo do quadro e é a razão de RF-15 poder exigir identidade byte a byte.

## 2. Entidades inalteradas

| Entidade | Onde vive | Mudança |
|---|---|---|
| `Board` | `.vscode/vscode-kanban.json` | nenhuma |
| `BoardCard` | dentro de `Board` | nenhuma |
| Colunas `todo`, `in-progress`, `testing`, `done` | chaves de `Board`, constante `BOARD_COLMNS` (`boards.ts:388`) | nenhuma, inclusive o erro de digitação da constante (G-20) |
| Filtro | `.vscode/vscode-kanban.filter` | nenhuma |
| Exportações | `<exportPath>/*.card.md` | nenhuma |
| Estado global do aviso | `globalState` | nenhuma |

Campos de `BoardCard` que a interface passa a ler ou escrever pelos componentes novos, sem
alteração de forma: `id`, `title`, `description`, `details`, `type`, `prio`, `category`,
`assignedTo`, `creation_time`, `tag`, `references`. A semântica de `references` continua
indefinida (G-02) e a feature **não** a define, conforme escopo negativo.

## 3. Campos efêmeros preservados

| Campo | Origem | Regra preservada |
|---|---|---|
| `__uid` | `board.js:2013`, gerado na recepção de `setBoard` | Mesma fórmula: `${índice}-${aleatório}-${Date.now()}`. Regenerado a cada carga, nunca persistido. `setCardTag`, `moveCardTo` e os scripts de evento dependem dele |

A fórmula inclui o número mágico `597923979`, cuja origem é desconhecida (G-21). O plano
**preserva o valor** porque scripts de usuário podem, ainda que sem garantia, ter derivado
comportamento da faixa numérica. Não há razão para mudá-lo nesta feature.

## 4. Modelo novo: `ViewState`

Estado de exibição, não persistido no quadro.

```ts
type ThemePreference = 'light' | 'dark' | 'follow-editor';
type ViewMode        = 'columns' | 'list';
type ColumnKey       = 'todo' | 'in-progress' | 'testing' | 'done';

interface ViewState {
    theme: ThemePreference;          // padrão: 'follow-editor'  (RN-02, RF-11)
    hideDone: boolean;               // padrão: false            (RN-04)
    collapsedColumns: ColumnKey[];   // padrão: []               (RN-10)
    viewMode: ViewMode;              // padrão: 'columns'        (RN-09)
}
```

**Invariante de coerência entre `hideDone` e `collapsedColumns`** 🟢: `hideDone` verdadeiro
implica `'done'` presente em `collapsedColumns`. RN-10 define a ocultação de concluídos como o
caso particular do colapso, de modo que os dois não podem divergir. A implementação deriva um do
outro em vez de guardar dois valores independentes que possam se contradizer.

## 5. Onde cada preferência é gravada

| Campo | Mecanismo | Escopo | Requisito | Viaja no Git? |
|---|---|---|---|---|
| `theme` | `context.globalState`, chave `kanban.view.theme` | instalação do editor | RN-03, RF-10 | não |
| `hideDone` | `context.workspaceState`, chave `kanban.view.<fsPath>.hideDone` | pasta de workspace | RN-07, RF-18 | não |
| `collapsedColumns` | `context.workspaceState`, chave `kanban.view.<fsPath>.collapsedColumns` | pasta de workspace | RF-19 | não |
| `viewMode` | `context.workspaceState`, chave `kanban.view.<fsPath>.viewMode` | pasta de workspace | RF-23 | não |

A chave por `fsPath` é exigência de correção, não de estilo: `workspaceState` tem escopo de
janela, enquanto a extensão instancia um `Workspace` por pasta. Sem a chave, duas pastas abertas
na mesma janela compartilhariam a ocultação, o que o cenário "Ocultação é preferência do projeto"
proíbe.

**Cache local de pintura** (D-06): o Webview espelha o `ViewState` em `vscode.setState()`, API de
estado do próprio Webview, apenas para pintar a primeira tela sem piscar. Esse espelho não é
fonte de verdade — `setViewPreferences` sempre prevalece — e não sobrevive à reinstalação da
extensão.

## 6. Migração

**Nenhuma.** Não há passo de conversão, versionamento de esquema nem leitura condicional por
versão. Um arquivo gravado pela versão 1.33.1 abre exatamente como antes, o que RF-26 exige.

Ausência de preferência gravada resolve nos padrões da §4, e é indistinguível de uma instalação
nova: `follow-editor`, sem ocultação, sem coluna colapsada, modo colunas.

## 7. Efeitos sobre a gravação do quadro

| Situação | Antes | Depois |
|---|---|---|
| Alternar tema, ocultação, colapso ou modo | não existia | **não grava** o quadro e não dispara evento (RN-08, RF-25) |
| Ordem dos cartões dentro da coluna, ao gravar | ordem ordenada, por efeito do `Array.sort` in place de `board.js:465` | ordem ordenada, aplicada **de propósito** ao payload de `saveBoard` (D-07). Resultado observável idêntico |
| Cartões de coluna colapsada, ao gravar | não existia | presentes e completos: a ocultação nunca alcança o payload (RF-15) |
| Normalização na carga (`reloadBoard`, `boards.ts:1336-1462`) | seis passos, incluindo geração de `id` e normalização de MIME | inalterada; continua no extension host |

O defeito de geração de identificador descrito em G-01 e no achado de `boards.ts:1336-1462`
permanece **como está**. Corrigi-lo mudaria os identificadores atribuídos a quadros existentes,
o que RF-26 proíbe nesta feature. É o cartão [12] do quadro do projeto.
