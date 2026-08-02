# Fluxogramas — módulo `workspaces`

> `src/workspaces.ts` · 1.134 LOC · 🟢 CONFIRMADO salvo indicação

## Ciclo de vida do `Workspace`

```mermaid
flowchart TD
    A([new Workspace folder, extension]) --> B[initialize]
    B --> C["configSource = { section: 'kanban',<br/>resource: .vscode/settings.json }"]
    C --> D[onDidChangeConfiguration]
    D --> E{já está recarregando?}
    E -->|sim| F[invokeAfter 1000ms<br/>reagenda a si mesmo]
    F --> D
    E -->|não| G[_isReloadingConfig = true]
    G --> H[getConfiguration 'kanban']
    H --> I[openBoardOnStartup]
    I --> J{openOnStartup?}
    J -->|sim| K[openBoard]
    J -->|não| L[fim]
    K --> M[_isReloadingConfig = false]
    L --> M
```

🟡 `openBoardOnStartup` roda a **cada** mudança de configuração, não apenas na ativação.

## Abertura do quadro

```mermaid
flowchart TD
    A([openBoard]) --> B{config carregada?}
    B -->|não| Z([retorna])
    B -->|sim| C[resolve caminhos:<br/>vscode-kanban.json, .filter, .vscode/]
    C --> D{board.json existe?}
    D -->|não| E{.vscode existe?}
    E -->|não| F[mkdirs .vscode]
    E -->|sim| G{é diretório?}
    F --> G
    G -->|não| H[warning e retorna]
    G -->|sim| I[grava newBoard vazio]
    D -->|sim| J{é arquivo?}
    I --> J
    J -->|não| K[warning e retorna]
    J -->|sim| L[título = nome da pasta<br/>ou 'Workspace #índice']
    L --> M[monta ColumnSettings a partir de kanban.columns]
    M --> N[tryCreateGitClient]
    N --> O[boards.openBoard com callbacks]
    O --> P([quadro aberto])
```

## Gravação e exportação

```mermaid
flowchart TD
    A([callback saveBoard]) --> B[saveBoardTo — JSON com indentação 2]
    B --> C{erro?}
    C -->|sim| D[showError]
    C -->|não| E{exportOnSave?}
    D --> E
    E -->|não| Z([fim])
    E -->|sim| F[resolve exportPath<br/>vazio → .vscode/<br/>relativo → a partir de .vscode/]
    F --> G[maxNameLength<br/>NaN ou menor que 1 → 48]
    G --> H{cleanupExports?}
    H -->|sim| I["glob vscode-kanban_*.card.md<br/>unlink de cada arquivo ⚠️"]
    H -->|não| J
    I --> J[para cada coluna, para cada cartão]
    J --> K[nome = vscode-kanban_coluna_índice_título]
    K --> L[sanitize-filename e trunca em maxNameLength]
    L --> M{arquivo já existe?}
    M -->|sim| N[sufixo decrescente 0, -1, -2, ...]
    N --> M
    M -->|não| O[monta Markdown:<br/>título, Meta ordenada, Description, Details, rodapé]
    O --> P[writeFile]
    P --> Q{mais cartões?}
    Q -->|sim| J
    Q -->|não| Z
```

## Despacho de eventos (`raiseEvent`)

```mermaid
flowchart TD
    A([raiseEvent context]) --> B{config carregada?}
    B -->|não| Z([retorna])
    B -->|sim| C{evento é track_time<br/>e canTrackTime?}
    C -->|sim| D{trackTime é objeto?}
    D -->|não| E{trackTime booleano true?}
    E -->|sim| F[handler = Workspace.trackTime interno]
    E -->|não| G[segue sem handler]
    D -->|sim| H{type}
    H -->|'' ou script| I[guarda options<br/>handler continua nulo]
    H -->|toggl ou toggle| J[handler = toggl.trackTime<br/>com this = Workspace]
    H -->|outro| K([retorna sem efeito nem aviso])
    C -->|não| G
    I --> L
    G --> L{há handler?}
    L -->|sim| R
    L -->|não| M{.vscode/vscode-kanban.js existe?}
    M -->|não| Z
    M -->|sim| N["loadModule ⚠️ executa código do workspace"]
    N --> O[escolhe função pelo nome do evento]
    O --> P{função existe?}
    P -->|não| Q[fallback onEvent]
    P -->|sim| R[monta ARGS]
    Q --> R
    F --> R
    J --> R
    R --> S[options clonado]
    S --> T{setupTag?}
    T -->|sim| U[defineProperty tag → data.card.tag]
    T -->|não| V
    U --> V{setupUID?}
    V -->|sim| W[defineProperty uid → data.card.__uid]
    V -->|não| X
    W --> X[injeta setTag e os quatro moveTo*]
    X --> Y{há handler?}
    Y -->|sim| AA[func.apply thisArg, ARGS]
    Y -->|não| Z
```

## Time tracking interno

```mermaid
flowchart TD
    A([trackTime args]) --> B{args.tag existe?}
    B -->|não| C[tag = objeto vazio]
    B -->|sim| D
    C --> D{tag['time-tracking'] existe?}
    D -->|não| E["inicializa { seconds: 0, entries: [] }"]
    D -->|sim| F
    E --> F[push do instante UTC atual em entries]
    F --> G[percorre entries em pares]
    G --> H["seconds = Σ entries ímpar menos entries par"]
    H --> I[grava total em tag time-tracking seconds]
    I --> J[await args.setTag tag]
    J --> K{sobrou carimbo ímpar?}
    K -->|sim| L[mensagem: tracking iniciado]
    K -->|não| M[mensagem: tracking PARADO + duração humanizada]
```
