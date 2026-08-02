# C4 Nível 1 — Contexto

> Gerado pelo **Arquiteto** (Reversa) em 2026-08-02 · 🟢 CONFIRMADO salvo indicação

```mermaid
C4Context
    title Contexto — vscode-kanban

    Person(dev, "Pessoa desenvolvedora", "Usa o VS Code e quer acompanhar tarefas sem sair do editor")
    Person_Ext(autor, "Autor do repositório", "Pode ser outra pessoa: fornece o .vscode/ versionado, inclusive scripts")

    System(kanban, "vscode-kanban", "Extensão do VS Code que exibe um quadro Kanban por pasta de workspace, com time tracking e exportação Markdown")

    System_Ext(vscode, "Visual Studio Code", "Hospeda a extensão: API de Webview, configuração, estado global, comandos")
    System_Ext(toggl, "Toggl", "Serviço de rastreamento de tempo — API v8, descontinuada")
    System_Ext(git, "Git local", "Fonte do nome do usuário, via git config user.name")
    System_Ext(so, "Sistema operacional", "Fonte alternativa do nome do usuário; abre URLs externas")
    System_Ext(fs, "Sistema de arquivos do projeto", "Guarda o quadro, o filtro, o script e as exportações em .vscode/")

    Rel(dev, kanban, "Cria, move e filtra cartões; rastreia tempo", "Webview")
    Rel(autor, fs, "Versiona .vscode/ com quadro, configuração e script")
    Rel(kanban, vscode, "Usa a API de extensão", "TypeScript")
    Rel(kanban, fs, "Lê e grava JSON, filtro e Markdown; executa o script ⚠️", "fs-extra")
    Rel(kanban, toggl, "Inicia e para entradas de tempo", "HTTPS/REST, Basic auth")
    Rel(kanban, git, "Detecta o nome do usuário", "processo filho")
    Rel(kanban, so, "Detecta usuário e abre URLs", "os.userInfo, spawn")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Atores

| Ator | Natureza | Papel |
|---|---|---|
| **Pessoa desenvolvedora** | Humano | Usuário único do quadro; tem acesso total, sem autenticação |
| **Autor do repositório** | Humano, possivelmente terceiro | Fornece `.vscode/` versionado; **o script que ele escreve é executado na máquina de quem abre** ⚠️ |

A distinção entre os dois é a fronteira de confiança do sistema (ver `permissions.md` §5).

## Sistemas externos

| Sistema | Natureza da relação | Obrigatório? | Situação |
|---|---|---|---|
| **Visual Studio Code** | Hospedeiro | Sim | 🟢 Requer ≥ 1.62 |
| **Sistema de arquivos** | Persistência | Sim | 🟢 |
| **Git local** | Fonte de identidade | Não | 🟢 Desligável por `noScmUser` |
| **Sistema operacional** | Identidade e abertura de URLs | Não | 🟢 Desligável por `noSystemUser` |
| **Toggl** | Rastreamento de tempo | Não | 🟡 API v8 descontinuada |

## O que o sistema deliberadamente não tem 🟢

| Ausência | Consequência |
|---|---|
| Servidor próprio | Nenhuma infraestrutura, nenhum custo, nenhuma conta |
| Banco de dados | O arquivo JSON é o banco |
| Autenticação | Quem abre a pasta tem acesso total |
| Sincronização multiusuário | O Git é o mecanismo de compartilhamento |
| API pública | Nada a expor, nada a documentar em OpenAPI |
