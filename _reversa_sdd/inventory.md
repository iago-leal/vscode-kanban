# Inventário — vscode-kanban

> Gerado pelo **Scout** (Reversa) em 2026-08-02
> Nível de documentação: `completo`
> Escala de confiança: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

---

## 1. Identidade do projeto

| Campo | Valor | Confiança |
|---|---|---|
| Nome interno | `vscode-kanban` | 🟢 |
| Nome de exibição | Kanban | 🟢 |
| Versão | 1.33.1 | 🟢 |
| Publisher | `mkloubert` | 🟢 |
| Autor | Marcel Joachim Kloubert | 🟢 |
| Licença | LGPL-3.0 (cabeçalho em todos os fontes) | 🟢 |
| Repositório | https://github.com/mkloubert/vscode-kanban | 🟢 |
| Tipo de artefato | Extensão do Visual Studio Code (`engines.vscode ^1.62.0`) | 🟢 |
| Descrição | Quadro Kanban dentro do VS Code, multi-root ready, com time tracking e integração Toggl | 🟢 |

O produto **não é** uma aplicação web nem um serviço: é uma extensão que roda no processo do
extension host do VS Code e renderiza a interface do quadro dentro de um **Webview**.

---

## 2. Estrutura de pastas

```
vscode-kanban/
├── .github/
│   ├── FUNDING.yml
│   └── workflows/publish.yml        # CI: publica na marketplace a cada push em master
├── .vscode/                          # config do próprio dev (launch, tasks, settings)
├── img/                              # 9 GIFs de demo + 2 screenshots + ícones de share
├── src/
│   ├── extension.ts                  # entry point da extensão (activate/deactivate)
│   ├── workspaces.ts                 # ciclo de vida por pasta de workspace + persistência
│   ├── boards.ts                     # modelo do quadro + painel Webview + protocolo de mensagens
│   ├── html.ts                       # geração do HTML do Webview (header, navbar, footer)
│   ├── toggl.ts                      # integração com a API Toggl v8
│   ├── announcements.ts              # avisos pontuais ao usuário na ativação
│   ├── test/
│   │   ├── index.ts                  # runner Mocha (boilerplate do yo code)
│   │   └── extension.test.ts         # suíte de exemplo, não testa o domínio
│   └── res/                          # assets copiados para out/res no build
│       ├── css/                      # board.css e style.css (próprios) + vendor
│       ├── img/                      # icon.svg, ajax-loader
│       └── js/
│           ├── board.js              # lógica do quadro no Webview (2.161 linhas)
│           ├── script.js             # utilitários do Webview (520 linhas)
│           └── <vendor>/             # CodeMirror, Mermaid, jQuery, Bootstrap, …
├── package.json                      # manifesto da extensão + contributes + deps
├── tsconfig.json                     # commonjs, target es2019, strict = false
├── tslint.json
├── publish.js                        # script de publicação via vsce
├── CHANGELOG.md                      # histórico detalhado por versão
└── README.md                         # documentação de uso (22 KB)
```

### Fronteira código próprio × vendor 🟢

Dos 192 arquivos `.js` do repositório, a esmagadora maioria é **biblioteca de terceiros
vendorizada** dentro de `src/res/js/` (CodeMirror com 121 modos de linguagem, Mermaid,
jQuery, Bootstrap, Showdown, Moment, highlight.js, Filtrex). Código próprio de front-end
são apenas dois arquivos: `board.js` e `script.js`.

| Camada | Arquivos próprios | Linhas |
|---|---|---|
| Back-end da extensão (TypeScript) | 6 | 3.971 |
| Testes (TypeScript) | 2 | 76 |
| Front-end do Webview (JavaScript) | 2 | 2.681 |
| Estilos próprios (CSS) | 2 | 205 |
| **Total de código próprio** | **12** | **≈ 6.933** |

---

## 3. Tecnologias

| Camada | Tecnologia | Versão | Confiança |
|---|---|---|---|
| Linguagem principal | TypeScript | 4.4.4 (devDependency) | 🟢 |
| Runtime | Node.js (extension host do VS Code) | CI usa Node 16 | 🟢 |
| Alvo de compilação | CommonJS / ES2019 | — | 🟢 |
| Interface | Webview do VS Code (HTML + JS puro) | — | 🟢 |
| UI framework | Bootstrap + jQuery (vendorizados) | bundle local | 🟢 |
| Editor embutido | CodeMirror (121 modos) | vendorizado | 🟢 |
| Renderização Markdown | `marked` (extensão) e Showdown (Webview) | 4.0.14 / vendor | 🟢 |
| Diagramas | Mermaid | vendorizado | 🟢 |
| Linter | TSLint | 6.1.3 (projeto descontinuado upstream) | 🟢 |
| Testes | Mocha via `vscode/lib/testrunner` | `vscode` 1.1.37 | 🟢 |
| Gerenciador de pacotes | npm (com `package-lock.json` commitado) | — | 🟢 |

**Nenhum banco de dados.** A persistência é feita em arquivos JSON dentro de `.vscode/`
do workspace do usuário — ver seção 6.

---

## 4. Pontos de entrada

| Caminho | Tipo | Papel |
|---|---|---|
| `src/extension.ts` → `activate()` | `extension_entry` | Ponto de ativação; monta logger, diretório da extensão, comandos, watcher de workspaces, CHANGELOG e anúncios |
| `src/extension.ts` → `deactivate()` | `extension_exit` | Encerramento; apenas marca flag de desativação |
| `out/extension` (`main` do manifesto) | `bundle_entry` | Artefato compilado apontado pelo `package.json` |
| Comando `extension.kanban.openBoard` | `command_entry` | Único comando contribuído: "Kanban: Open Board ..." |
| `src/res/js/board.js` | `webview_entry` | Bootstrap da lógica do quadro dentro do Webview |

`activationEvents` é `["*"]` 🟢 — a extensão ativa em **toda** abertura do VS Code, não sob
demanda. Isso é relevante para custo de inicialização e será registrado como achado
arquitetural nas fases seguintes.

---

## 5. Módulos identificados

| Módulo | Arquivo | Linhas | Responsabilidade |
|---|---|---|---|
| `extension` | `src/extension.ts` | 586 | Ciclo de vida, logging em `~/.vscode-kanban/.logs`, registro de comandos, utilitários (`open`, `saveToFile`, `showError`) |
| `workspaces` | `src/workspaces.ts` | 1.134 | Um `Workspace` por pasta do workspace; configuração `kanban.*`, scripts de evento do usuário, exportação Markdown, detecção de usuário via SCM/SO |
| `boards` | `src/boards.ts` | 1.509 | Modelo de dados (`Board`, `BoardCard`, `BoardSettings`), classe `KanbanBoard` (painel Webview) e protocolo de mensagens extensão ↔ Webview |
| `html` | `src/html.ts` | 307 | Geração do documento HTML do Webview (header, navbar, footer, resolução de URIs de recursos) |
| `toggl` | `src/toggl.ts` | 333 | Time tracking via API Toggl v8 (projetos, workspaces, entradas de tempo) |
| `announcements` | `src/announcements.ts` | 102 | Avisos únicos ao usuário na ativação |
| `board-ui` | `src/res/js/board.js` | 2.161 | Renderização e manipulação dos cartões no Webview: CRUD, ordenação, filtros, janelas de detalhe |
| `webview-utils` | `src/res/js/script.js` | 520 | Utilitários do Webview: Markdown, Mermaid, highlight, filtro (Filtrex), datas, UUID, `postMessage` |

**Grafo de dependências internas** 🟢

```
extension ──> announcements
    │
    └──────> workspaces ──> boards ──> html
                  │            │
                  └──> toggl ──┘   (toggl também importa extension e workspaces)
```

Há **dependência circular** entre `extension`, `workspaces`, `boards` e `toggl` (por
exemplo, `toggl.ts` importa `./extension` e `./workspaces`, que por sua vez alcançam
`toggl`). O Arqueólogo deve confirmar o impacto real dessa circularidade.

---

## 6. Persistência

Sem banco de dados. Estado gravado como arquivos no workspace do usuário 🟢:

| Arquivo | Constante | Papel |
|---|---|---|
| `.vscode/vscode-kanban.json` | `BOARD_FILENAME` | O quadro inteiro (colunas e cartões) serializado em JSON |
| `.vscode/vscode-kanban.filter` | `FILTER_FILENAME` | Último filtro aplicado pelo usuário |
| `.vscode/vscode-kanban.js` | `SCRIPT_FILENAME` | Script de eventos do usuário (`onExecute`, `onTrackTime`, …), carregado dinamicamente |
| `.vscode/settings.json` | — | Configuração `kanban.*` lida da API do VS Code |
| `~/.vscode-kanban/.logs/YYYYMMDD.log` | — | Log diário em texto |
| Exportações Markdown | `exportPath` | Cartões exportados como `.md` quando `exportOnSave` está ativo |

O carregamento de `.vscode/vscode-kanban.js` é **execução de código arbitrário do
workspace** — ponto a ser tratado explicitamente na análise de segurança das fases
seguintes.

---

## 7. Integrações externas

| Integração | Endpoint / recurso | Autenticação | Confiança |
|---|---|---|---|
| Toggl (time tracking) | `https://www.toggl.com/api/v8/{projects,workspaces,time_entries}` | Basic com API token (`token:api_token` em base64) | 🟢 |
| VS Code API | `vscode` + `vscode-helpers` 9.0.0 | — | 🟢 |
| SCM (Git) | Detecção de nome de usuário via SCM local | — | 🟡 |
| Marketplace VS Code | Publicação via `vsce` no CI | `VSCE_TOKEN` (secret) | 🟢 |

A API Toggl v8 está **descontinuada** pelo fornecedor; a versão vigente é a v9. Achado
registrado aqui e a ser confirmado pelo Detetive.

---

## 8. CI/CD

`.github/workflows/publish.yml` 🟢 — dispara em `push` na branch `master`:

```
checkout → setup-node@16 → npm install → npm run build → npm run publish
```

Publica na Marketplace com o secret `VSCE_TOKEN`. **Não há etapa de teste nem de lint no
pipeline**: o build compila e publica direto.

### Scripts do `package.json`

| Script | Comando | Observação |
|---|---|---|
| `compile` | `tsc -p ./` | Compilação simples |
| `build` | `(del ./out) && (tsc -p ./) && (mkdir "./out/res") && (cp -r ./src/res/* ./out/res)` | Mistura `del-cli` com `cp`/`mkdir` POSIX — quebra em Windows 🟡 |
| `watch` | `tsc -watch -p ./` | Desenvolvimento |
| `test` | `npm run compile && node ./node_modules/vscode/bin/test` | Roda a suíte de exemplo |
| `publish` | `node ./publish.js` | Empacota e publica via `vsce` |
| `vscode:prepublish` | `npm run compile` | Gancho do `vsce` |

---

## 9. Testes

| Item | Situação |
|---|---|
| Framework | Mocha (UI `tdd`) via `vscode/lib/testrunner` |
| Arquivos de teste | 2 (`src/test/index.ts`, `src/test/extension.test.ts`) |
| Testes reais de domínio | **Nenhum** — a suíte contém apenas asserções de exemplo sobre `Array.indexOf` |
| Cobertura estimada | ≈ 0% do domínio 🟢 |

Não há testes que exercitem `boards`, `workspaces`, `toggl` ou a lógica do Webview. Qualquer
ciclo forward sobre este código parte de uma base sem rede de segurança automatizada.

---

## 10. Configuração contribuída (`contributes.configuration`)

Namespace `kanban`, escopo `resource` — 13 propriedades 🟢:

`canExecute`, `cleanupExports`, `columns.{todo,inProgress,testing,done}`, `exportOnSave`,
`exportPath`, `maxExportNameLength`, `globals`, `noScmUser`, `noSystemUser`,
`noTimeTrackingIfIdle`, `openOnStartup`, `simpleIDs`, `trackTime`.

`trackTime` é um `oneOf` de três formas: booleano simples, objeto `{type: "script"}` e objeto
`{type: "toggl"|"toggle", token, project}`.

### Colunas do quadro 🟢

Constante `BOARD_COLMNS` em `src/boards.ts` (grafia original preservada): **Todo, In Progress,
Testing, Done** — quatro colunas fixas, com nomes de exibição customizáveis via configuração.

---

## 11. Metadados de repositório

| Item | Valor |
|---|---|
| Commits | 86 |
| Primeiro commit | 2018-05-25 |
| Último commit | 2022-11-07 (`fd5f767 fix GitHub actions`) |
| Branch principal | `master` |

O projeto está **sem commits há cerca de 3 anos e 9 meses** em relação à data desta análise.

---

## 12. Achados preliminares para as fases seguintes

| # | Achado | Confiança | Encaminhamento |
|---|---|---|---|
| 1 | `activationEvents: ["*"]` ativa a extensão sempre | 🟢 | Arquiteto |
| 2 | `.vscode/vscode-kanban.js` executa código arbitrário do workspace | 🟢 | Detetive / Arquiteto (segurança) |
| 3 | API Toggl v8 descontinuada (atual é v9) | 🟡 | Detetive |
| 4 | Dependências circulares entre os módulos TS | 🟢 | Arqueólogo |
| 5 | Suíte de testes vazia de domínio | 🟢 | Revisor |
| 6 | CI publica sem rodar testes nem lint | 🟢 | Arquiteto |
| 7 | `strict: false` no `tsconfig.json` | 🟢 | Arqueólogo |
| 8 | Script `build` quebra em Windows (`cp`/`mkdir`) | 🟡 | Arqueólogo |
| 9 | TSLint descontinuado upstream desde 2019 | 🟢 | Arquiteto |
| 10 | `board.js` com 2.161 linhas em escopo global, sem módulos | 🟢 | Arqueólogo |
