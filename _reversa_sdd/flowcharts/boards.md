# Fluxogramas — módulo `boards`

> `src/boards.ts` · 1.509 LOC · 🟢 CONFIRMADO salvo indicação

## Abertura do painel

```mermaid
flowchart TD
    A([openBoard opts]) --> B[new KanbanBoard]
    B --> C[initialize — zera listeners]
    C --> D{opts.saveBoard?}
    D -->|sim| E[onSaveBoard listener]
    D -->|não| F
    E --> F{opts.saveFilter?}
    F -->|sim| G[onSaveBoardFilter listener]
    F -->|não| H
    G --> H[open opts]
    H --> I{já existe painel?}
    I -->|sim| J([retorna false])
    I -->|não| K[título 'Kanban Board' + sufixo]
    K --> L["createWebviewPanel<br/>enableScripts true<br/>enableCommandUris true<br/>retainContextWhenHidden true<br/>localResourceRoots inclui ~ ⚠️"]
    L --> M[registra onDidReceiveMessage]
    M --> N[registra onDidChangeViewState]
    N --> O[webview.html = generateHTML]
    O --> P([painel visível])
```

## Recepção de mensagens do Webview

```mermaid
flowchart TD
    A([onDidReceiveMessage msg]) --> B{msg.command}
    B -->|log| C[console.log + logger.debug]
    B -->|onLoaded| D[onLoaded]
    B -->|openExternalUrl| E[URL.parse<br/>showWarningMessage de confirmação]
    E --> E2{usuário confirmou?}
    E2 -->|sim| E3[vsckb.open url]
    E2 -->|não| E4[nada]
    B -->|openKnownUrl| F[busca em KNOWN_URLS<br/>abre sem confirmar]
    B -->|raiseEvent| G[this.raiseEvent nome, dados]
    B -->|reloadBoard| H[reloadBoard]
    B -->|saveBoard| I[para cada listener de gravação]
    B -->|saveFilter| J[para cada listener de filtro]
    C --> K[Promise.resolve action]
    D --> K
    E3 --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    K --> L{rejeitou?}
    L -->|sim| M[showError]
    L -->|não| N([fim])
```

## Carga e normalização do quadro

```mermaid
flowchart TD
    A([reloadBoard]) --> B{há arquivo resolvido?}
    B -->|não| Z([retorna])
    B -->|sim| C["readFile + JSON.parse ⚠️ sem try/catch"]
    C --> D{resultado nulo?}
    D -->|sim| E[newBoard — quatro colunas vazias]
    D -->|não| F
    E --> F[cloneObject]
    F --> G[para cada coluna de BOARD_COLMNS]
    G --> H[asArray — tolera coluna ausente]
    H --> I[para cada cartão]
    I --> J{id vazio?}
    J -->|não| N
    J -->|sim| K{simpleIDs? padrão true}
    K -->|sim| L["id = max ids numéricos + 1"]
    K -->|não| M["id = data_aleatório_uuid"]
    L --> N[normaliza description]
    M --> N
    N --> O[normaliza details]
    O --> P{"mime é text/markdown?"}
    P -->|sim| Q[mantém]
    P -->|não| R["força text/plain"]
    Q --> S{mais cartões?}
    R --> S
    S -->|sim| I
    S -->|não| T[loadFilter do arquivo .filter]
    T --> U["postMessage setBoard<br/>{cards, filter, settings}"]
    U --> V([Webview assume o estado])
```

## Handshake de carregamento

```mermaid
sequenceDiagram
    participant W as Webview (board.js)
    participant B as KanbanBoard
    participant FS as Disco
    participant G as Git

    W->>B: postMessage onLoaded
    B->>FS: readFile vscode-kanban.json
    FS-->>B: JSON
    B->>B: normaliza ids, mime, colunas
    B->>FS: loadFilter (.filter)
    B->>W: setBoard {cards, filter, settings}
    B->>W: setTitleAndFilePath {file, title}
    alt git disponível e noScmUser falso
        B->>G: git config user.name
        G-->>B: nome
    end
    alt nome vazio e noSystemUser falso
        B->>B: OS.userInfo().username
    end
    opt nome encontrado
        B->>W: setCurrentUser {name}
    end
```

## Resolução de URI de recurso

```mermaid
flowchart TD
    A([getResourceUri p]) --> B[raízes: additionalResourceRoots<br/>+ homedir ⚠️ + out/res]
    B --> C[para cada raiz R]
    C --> D[caminho = resolve R + p]
    D --> E[u = Uri file com esquema vscode-resource]
    E --> F{arquivo existe?}
    F -->|sim| G([devolve u])
    F -->|não| H{mais raízes?}
    H -->|sim| C
    H -->|não| I([devolve a última u testada<br/>mesmo inexistente])
```
