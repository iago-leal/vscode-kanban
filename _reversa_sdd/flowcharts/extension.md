# Fluxogramas — módulo `extension`

> `src/extension.ts` · 586 LOC · 🟢 CONFIRMADO salvo indicação

## Ativação

```mermaid
flowchart TD
    START([VS Code carrega a extensão]) --> AE{activationEvents}
    AE -->|"*" — sempre| ACT[activate context]
    ACT --> WF[buildWorkflow]
    WF --> S1[1 · createLogger<br/>grava em ~/.vscode-kanban/.logs]
    S1 --> S2[2 · createDirectoryIfNeeded<br/>~/.vscode-kanban]
    S2 --> S3[3 · ler ../package.json]
    S3 --> S3E{falhou?}
    S3E -->|sim| S3X[catch vazio<br/>packageFile fica undefined]
    S3E -->|não| S4
    S3X --> S4[4 · registerCommand<br/>extension.kanban.openBoard]
    S4 --> S5[5 · registerWorkspaceWatcher]
    S5 --> S5A[workspaceWatcher.reload]
    S5A --> S5B[monkey patch<br/>workspaces.getAllWorkspaces]
    S5B --> S6[6 · comparar versão<br/>com globalState]
    S6 --> S6C{versão mudou?}
    S6C -->|sim| S6D[Webview com CHANGELOG.md<br/>enableScripts false]
    S6C -->|não| S7
    S6D --> S6E[gravar nova versão]
    S6E --> S7[7 · showAnnouncements]
    S7 --> CHK{isDeactivating?}
    CHK -->|não| RUN[WF.start — executa os 7 passos]
    CHK -->|sim| NOOP[nada acontece]
    RUN --> END([extensão pronta])
```

## Comando `openBoard`

```mermaid
flowchart TD
    A([usuário aciona Kanban: Open Board ...]) --> B[getAllWorkspaces]
    B --> C[mapear para quick picks<br/>label = nome ou 'Workspace #índice']
    C --> D{quantos?}
    D -->|0| E[warning 'No workspace found!']
    D -->|1| F[seleciona automaticamente]
    D -->|2 ou mais| G[showQuickPick]
    G --> H{usuário escolheu?}
    H -->|não| I([fim])
    H -->|sim| F
    F --> J[workspace.openBoard]
    J --> K{erro?}
    K -->|sim| L[showError — popup + log trace]
    K -->|não| M([quadro aberto])
```

## Registro de workspace

```mermaid
flowchart TD
    A([evento do watcher]) --> B{tipo do evento}
    B -->|Added| C{URI tem esquema<br/>'' ou 'file'?}
    B -->|Removed| D[bloco vazio — nenhuma limpeza]
    C -->|não — remoto| E[ignora silenciosamente]
    C -->|sim — local| F[new Workspace folder, context]
    F --> G[workspace.initialize]
    G --> H{erro?}
    H -->|sim| I[tryDispose e relança]
    H -->|não| J([workspace ativo])
```

🟢 O ramo `Removed` está vazio no código (`extension.ts:287-288`): a remoção de uma pasta do
workspace não dispara descarte explícito da instância.

## Abertura de alvo externo (`open`)

```mermaid
flowchart TD
    A([open target, opts]) --> B{process.platform}
    B -->|darwin| C["cmd = open<br/>-W se wait<br/>-a app se houver"]
    B -->|win32| D["cmd = cmd /c start ''<br/>escapa & → ^&<br/>/wait se wait"]
    B -->|outro| E["cmd = app ou xdg-open<br/>stdio ignore se não espera"]
    C --> F[args.push target]
    D --> F
    E --> F
    F --> G{darwin e há appArgs?}
    G -->|sim| H[push --args + appArgs]
    G -->|não| I[spawn]
    H --> I
    I --> J{wait?}
    J -->|sim| K[resolve no close<br/>rejeita se code maior que 0]
    J -->|não| L[unref e resolve já]
```
