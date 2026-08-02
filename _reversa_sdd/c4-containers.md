# C4 Nível 2 — Containers

> Gerado pelo **Arquiteto** (Reversa) em 2026-08-02 · 🟢 CONFIRMADO salvo indicação

```mermaid
C4Container
    title Containers — vscode-kanban

    Person(dev, "Pessoa desenvolvedora")

    System_Boundary(vsc, "Visual Studio Code") {
        Container(host, "Extension Host", "Node.js 16 · TypeScript 4.4 · CommonJS", "Ciclo de vida, configuração, persistência, scripts do usuário, HTTP")
        Container(webview, "Webview do quadro", "Chromium sandbox · JS ES5+ · jQuery, Bootstrap, CodeMirror, Mermaid", "Estado autoritativo do quadro, renderização e interação")
        ContainerDb(gstate, "globalState", "Armazenamento do VS Code", "Última versão vista e aviso silenciado")
    }

    System_Boundary(ws, "Pasta do workspace") {
        ContainerDb(board, "vscode-kanban.json", "Arquivo JSON", "O quadro completo — a fonte de verdade persistida")
        ContainerDb(filter, "vscode-kanban.filter", "Arquivo texto", "Última expressão de filtro")
        Container(script, "vscode-kanban.js", "Módulo Node do usuário", "Handlers de evento — executado com privilégios da extensão ⚠️")
        ContainerDb(exports, "*.card.md", "Arquivos Markdown", "Um documento por cartão, derivado")
        ContainerDb(settings, "settings.json", "Configuração do VS Code", "Chaves kanban.*")
    }

    ContainerDb(logs, "~/.vscode-kanban/.logs", "Arquivos de log diários", "Formato próprio, escrita síncrona")
    System_Ext(toggl, "API Toggl v8", "REST/JSON")

    Rel(dev, webview, "Interage com o quadro", "interface")
    BiRel(host, webview, "postMessage / onDidReceiveMessage", "6 comandos em cada direção")
    Rel(host, board, "Lê na abertura, grava a cada alteração", "fs-extra")
    Rel(host, filter, "Lê na abertura, grava ao aplicar", "fs-extra")
    Rel(host, script, "loadModule e invoca o handler ⚠️", "require")
    Rel(host, exports, "Apaga e regera quando exportOnSave", "glob + writeFile")
    Rel(host, settings, "Lê a configuração kanban.*", "workspace.getConfiguration")
    Rel(host, gstate, "Grava versão e estado do aviso")
    Rel(host, logs, "Grava linha de log", "appendFileSync")
    Rel(host, toggl, "Consulta e altera entradas de tempo", "HTTPS Basic")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

---

## Containers

| Container | Tecnologia | Estado que guarda | Confiança |
|---|---|---|---|
| **Extension Host** | Node.js no processo do VS Code | Logger, `packageFile`, `workspaceWatcher`, instâncias `Workspace` (`_config`, `_STATE`) | 🟢 |
| **Webview do quadro** | `<iframe>` isolado do Chromium | `allCards`, `boardSettings`, `cardDisplayFilter`, `currentUser` — **o estado autoritativo** | 🟢 |
| **`vscode-kanban.json`** | Arquivo JSON indentado | O quadro persistido | 🟢 |
| **`vscode-kanban.filter`** | Arquivo texto | Expressão de filtro | 🟢 |
| **`vscode-kanban.js`** | Módulo CommonJS do usuário | Código executável ⚠️ | 🟢 |
| **`*.card.md`** | Markdown derivado | Nada — é saída, regerada a cada gravação | 🟢 |
| **`globalState`** | Armazenamento do editor, escopo de usuário | `vsckbLastKnownVersion`, chave do aviso | 🟢 |
| **Logs** | Arquivos diários em `~` | Histórico de eventos e erros | 🟢 |

## Protocolo entre os dois containers 🟢

| Extensão → Webview | Webview → Extensão |
|---|---|
| `setBoard` | `onLoaded` |
| `setTitleAndFilePath` | `saveBoard` |
| `setCurrentUser` | `saveFilter` |
| `moveCardTo` | `raiseEvent` |
| `setCardTag` | `reloadBoard` |
| `webviewIsVisible` | `openExternalUrl`, `openKnownUrl`, `log` |

Doze comandos ao todo, todos assíncronos e sem confirmação de entrega 🟢. `postMessage`
devolve uma promessa de booleano que o código verifica em `setTag` e `moveTo*`
(`workspaces.ts:840-849`), mas ignora nas demais chamadas.

## Observações arquiteturais

1. **O container que manda não é o que persiste** 🟢. O Webview detém o estado; o Extension
   Host detém o disco. Toda gravação é o Webview empurrando o quadro inteiro — decisão do
   ADR-008.
2. **O script do usuário é um container**, não uma biblioteca 🟢: código de terceiro, carregado
   em tempo de execução, com privilégios do host.
3. **Nenhum container de dados é validado na entrada** 🔴: `JSON.parse` sem esquema, sem
   `try/catch` e sem cópia de segurança.
4. **`retainContextWhenHidden: true`** mantém o Webview vivo em segundo plano, de modo que o
   estado pode divergir do disco por tempo indefinido 🟢.
