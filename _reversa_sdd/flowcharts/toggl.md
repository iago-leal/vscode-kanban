# Fluxogramas — módulo `toggl`

> `src/toggl.ts` · 333 LOC · 🟢 CONFIRMADO salvo indicação
> ⚠️ Toda a integração aponta para a API v8, descontinuada pelo fornecedor.

## Resolução do token

```mermaid
flowchart TD
    A([trackTime args, settings]) --> B[token = settings.token]
    B --> C{token não vazio?}
    C -->|não| H
    C -->|sim| D{caminho absoluto?}
    D -->|não| E[resolve a partir de ~]
    D -->|sim| F
    E --> F{é arquivo existente?}
    F -->|sim| G[lê o conteúdo do arquivo]
    F -->|não| H
    G --> H[trim]
    H --> I{vazio?}
    I -->|sim| J([throw 'No API token defined!'])
    I -->|não| K[auth = Basic base64 token:api_token]
```

## Descoberta de projetos

```mermaid
flowchart TD
    A([auth pronta]) --> B{settings.project é número?}
    B -->|sim| C[GET /api/v8/projects/id]
    C --> D{código}
    D -->|200| E[lista com um projeto]
    D -->|404| F([warning 'Project not found' e retorna])
    D -->|outro| G[segue para varredura]
    B -->|não| G
    G --> H{lista está vazia?}
    H -->|não| P
    H -->|sim| I[withProgress: 'Loading Toggl workspaces ...']
    I --> J[GET /api/v8/workspaces]
    J --> K{200?}
    K -->|não| L([throw HTTP error])
    K -->|sim| M[para cada workspace]
    M --> N[GET /api/v8/workspaces/id/projects]
    N --> O{200?}
    O -->|não| L
    O -->|sim| Q[marca __vsckbWorkspace e concatena]
    Q --> M
    E --> P[ordena por nome do projeto,<br/>depois por nome do workspace]
    P --> R{quantos projetos?}
    R -->|0| S([warning 'No Toggl project found!'])
    R -->|1| T[seleciona direto]
    R -->|2 ou mais| U[showQuickPick]
    U --> T
```

## Início e parada da entrada de tempo

```mermaid
flowchart TD
    A([projeto escolhido]) --> B[GET /api/v8/time_entries/current]
    B --> C{200?}
    C -->|não| D([throw HTTP error])
    C -->|sim| E{há entrada corrente?}
    E -->|sim| F{pid é deste projeto?}
    F -->|não| G([warning: pare a entrada atual primeiro])
    F -->|sim| H["PUT /time_entries/id/stop"]
    E -->|não| I["POST /time_entries/start<br/>description = título do cartão<br/>tags = vscode, pasta, coluna<br/>created_with = vscode-kanban"]
    I --> J{200?}
    J -->|sim| K[mensagem 'Time tracking has been started.']
    J -->|não| L([throw 'CREATING new Toggle time entry failed'])
    H --> M{200?}
    M -->|sim| N[mensagem 'STOPPED' com botão 'Open Toggl ...']
    M -->|não| O([throw 'STOPPING current Toggle time entry failed'])
    N --> P{usuário clicou?}
    P -->|sim| Q[abre https://www.toggl.com/app/timer]
    P -->|não| R([fim])
```
