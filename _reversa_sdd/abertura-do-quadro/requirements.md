# Abertura do Quadro

> Unit da extração Reversa · 2026-08-02 · 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

## Visão Geral

Capacidade de exibir o quadro Kanban de uma pasta de workspace dentro do editor. Cobre a
descoberta das pastas disponíveis, a criação do arquivo de quadro quando ele ainda não existe,
a criação do painel Webview e o handshake inicial que popula a interface.

## Responsabilidades

- Registrar e atender o comando `extension.kanban.openBoard`
- Escolher a pasta de workspace quando houver mais de uma
- Garantir a existência de `.vscode/vscode-kanban.json` antes de abrir
- Criar o painel Webview com o HTML do quadro
- Executar o handshake `onLoaded` → `setBoard` / `setTitleAndFilePath` / `setCurrentUser`
- Abrir automaticamente na inicialização quando configurado

## Regras de Negócio

- Só pastas com esquema de URI `''` ou `file` viram workspace; URIs remotas são ignoradas 🟢
- Havendo exatamente um workspace, o seletor é pulado e ele é aberto direto 🟢
- Sem nenhum workspace, exibe-se "No workspace found!" e nada é aberto 🟢
- O quadro é criado vazio automaticamente na primeira abertura 🟢
- Se `.vscode` existir mas não for diretório, avisa e aborta 🟢
- Se o caminho do quadro existir mas não for arquivo, avisa e aborta 🟢
- O título é o nome da pasta; vazio vira `Workspace #<índice>` 🟢
- Um mesmo quadro não pode ter dois painéis: `open()` devolve `false` se já houver painel 🟢
- `openOnStartup` dispara a abertura a **cada** mudança de configuração, não só na ativação 🟢
- O painel usa `retainContextWhenHidden`, preservando o estado ao trocar de aba 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Registrar o comando "Kanban: Open Board ..." | Must | O comando aparece na paleta e abre o quadro |
| RF-02 | Listar as pastas de workspace como opções com nome e caminho | Must | Com 2+ pastas, o seletor mostra nome e `fsPath` |
| RF-03 | Pular o seletor quando houver uma única pasta | Must | Com 1 pasta, o quadro abre sem interação |
| RF-04 | Criar `.vscode/` e o arquivo do quadro vazio se ausentes | Must | Primeira abertura gera JSON com quatro colunas vazias |
| RF-05 | Criar o painel Webview com título "Kanban Board (<pasta>)" | Must | O título da aba reflete a pasta |
| RF-06 | Enviar o quadro ao Webview após `onLoaded` | Must | Cartões aparecem sem ação do usuário |
| RF-07 | Abrir o quadro na inicialização quando `openOnStartup` | Should | Com a chave ligada, o quadro abre ao carregar a pasta |
| RF-08 | Impedir dois painéis para o mesmo quadro | Should | Acionar o comando com o quadro aberto não duplica a aba |
| RF-09 | Avisar quando o caminho esperado não for do tipo certo | Could | Mensagem de aviso e nenhuma abertura |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Segurança | O Webview roda com scripts habilitados e URIs de comando habilitadas | `boards.ts:1106-1112` | 🟢 |
| Segurança | As raízes de recurso incluem o diretório home inteiro | `boards.ts:922-932` | 🟢 |
| Segurança | Nenhuma Content-Security-Policy é declarada | `html.ts:160-226` | 🟢 |
| Desempenho | A extensão ativa em toda abertura do editor (`activationEvents: ["*"]`) | `package.json:21` | 🟢 |
| Disponibilidade | Erro na criação do painel descarta o painel parcial e relança | `boards.ts:1281-1286` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um workspace sem .vscode/vscode-kanban.json
Quando o usuário aciona "Kanban: Open Board ..."
Então o arquivo é criado com as quatro colunas vazias
E o painel abre com o título "Kanban Board (<nome da pasta>)"

Dado dois workspaces abertos
Quando o usuário aciona o comando
Então um seletor lista as duas pastas com nome e caminho
E a escolha abre o quadro da pasta selecionada

Dado nenhum workspace aberto
Quando o usuário aciona o comando
Então exibe-se "No workspace found!" e nenhum painel é criado

Dado que .vscode existe mas é um arquivo, não um diretório
Quando o usuário aciona o comando
Então exibe-se aviso informando que não é diretório
E nenhum painel é criado

Dado um quadro já aberto para a pasta
Quando o usuário aciona o comando novamente para a mesma pasta
Então nenhum segundo painel é criado
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Comando e criação do painel | Must | Único caminho de entrada do sistema |
| Criação automática do arquivo | Must | Sem ele nada mais funciona |
| Handshake `onLoaded` | Must | Sem ele o quadro fica vazio |
| Seleção entre workspaces | Must | Extensão declara-se multi-root ready |
| `openOnStartup` | Should | Conveniência com alternativa (o comando) |
| Avisos de caminho inválido | Could | Caso de borda raro |
| Abertura em `ViewColumn` customizada | Won't | `showOptions` existe na interface mas nunca é passado 🟢 |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/extension.ts:221-267` | registro do comando `openBoard` | 🟢 |
| `src/extension.ts:269-298` | `registerWorkspaceWatcher` e `createNewWorkspace` | 🟢 |
| `src/workspaces.ts:422-588` | `Workspace.openBoard` | 🟢 |
| `src/workspaces.ts:590-598` | `openBoardOnStartup` | 🟢 |
| `src/boards.ts:1077-1287` | `KanbanBoard.open` | 🟢 |
| `src/boards.ts:983-1034` | `KanbanBoard.onLoaded` | 🟢 |
| `src/boards.ts:1493-1509` | `openBoard` (fábrica) | 🟢 |
