# Dependências — vscode-kanban

> Gerado pelo **Scout** (Reversa) em 2026-08-02
> Fonte: `package.json` (versões pinadas exatas, sem `^` ou `~`) e `package-lock.json` commitado.

---

## 1. Dependências de produção

| Pacote | Versão | Papel no sistema | Situação upstream |
|---|---|---|---|
| `vscode-helpers` | 9.0.0 | Biblioteca do próprio autor: workflow, logger, `WorkspaceBase`, `DisposableBase`, HTTP (`GET`/`POST`/`PUT`), normalização de strings | ⚠️ Última publicação em 2020; mantida por um só autor |
| `lodash` | 4.17.21 | Utilitários gerais em todos os módulos | ✅ Estável e mantida |
| `fs-extra` | 10.1.0 | I/O de arquivos (quadro, logs, exportações) | ✅ Mantida (atual: 11.x) |
| `marked` | 4.0.14 | Renderização do CHANGELOG em Markdown no Webview de changelog | ⚠️ Desatualizada (atual: 15.x); as opções `sanitize` e `mangle` usadas em `extension.ts` foram removidas em versões posteriores |
| `html-entities` | 2.3.3 | Escape de HTML na geração do Webview | ✅ Mantida |
| `humanize-duration` | 3.27.1 | Formatação de durações no time tracking | ✅ Mantida |
| `sanitize-filename` | 1.6.3 | Saneamento de nomes na exportação Markdown | ✅ Estável |

**Total: 7 dependências diretas de produção.** Enxutas para o escopo — nenhum framework
pesado de front-end no lado da extensão.

---

## 2. Dependências de desenvolvimento

| Pacote | Versão | Papel | Situação upstream |
|---|---|---|---|
| `typescript` | 4.4.4 | Compilador | ⚠️ Lançada em 2021 (atual: 5.x) |
| `vscode` | 1.1.37 | Pacote **deprecado** de tipos e test runner | 🔴 Substituído por `@types/vscode` + `@vscode/test-electron` desde 2020 |
| `vsce` | 2.7.0 | Empacotamento e publicação | ⚠️ Renomeado para `@vscode/vsce` |
| `tslint` | 6.1.3 | Linter | 🔴 Descontinuado em 2019 em favor do ESLint |
| `del-cli` | 4.0.1 | Limpeza da pasta `out` no build | ✅ Mantida |
| `@types/node` | 16.11.32 | Tipos do Node | ⚠️ Node 16 fora de suporte (EOL 2023-09) |
| `@types/mocha` | 9.1.1 | Tipos do Mocha | ⚠️ Desatualizada |
| `@types/lodash` | 4.14.182 | Tipos | ✅ |
| `@types/fs-extra` | 9.0.13 | Tipos | ⚠️ Defasada em relação a `fs-extra` 10 |
| `@types/marked` | 4.0.3 | Tipos | ✅ Compatível com `marked` 4 |
| `@types/html-entities` | 1.3.4 | Tipos | ⚠️ Stub obsoleto: `html-entities` 2.x já traz tipos próprios |

**Total: 11 dependências de desenvolvimento.**

---

## 3. Dependências não declaradas mas usadas

| Import | Onde | Origem real | Confiança |
|---|---|---|---|
| `moment` | `src/extension.ts`, `src/workspaces.ts` | Dependência **transitiva** de `vscode-helpers`, não declarada no `package.json` | 🟢 |

Este é um risco de reprodutibilidade: uma atualização de `vscode-helpers` que largue o
`moment` quebra a compilação sem que o manifesto dê qualquer sinal. Deve constar como
dependência direta.

---

## 4. Bibliotecas vendorizadas (não versionadas pelo npm)

Copiadas para dentro de `src/res/js/` e `src/res/css/`, servidas ao Webview como recursos
locais. Nenhuma delas aparece no `package.json`, de modo que **não há rastreamento de versão
nem alerta de vulnerabilidade** sobre esse conjunto.

| Biblioteca | Localização | Observação |
|---|---|---|
| CodeMirror | `res/js/codemirror/` | Editor de código nos cartões; 121 modos de linguagem e ~40 addons |
| jQuery | `res/js/jquery.min.js` | Manipulação de DOM em todo o `board.js` |
| Bootstrap | `res/js/bootstrap.bundle.min.js` + `res/css/bootstrap.min.css` | Layout e componentes |
| Mermaid | `res/js/mermaid/` + `res/css/mermaid/` | Diagramas na descrição dos cartões |
| Showdown | `res/js/showdown.min.js` | Markdown → HTML no Webview |
| highlight.js | `res/js/highlight.pack.js` + `res/css/hljs-atom-one-dark.css` | Realce de sintaxe |
| Moment (com locales) | `res/js/moment-with-locales.min.js` | Datas no Webview |
| Filtrex | `res/js/filtrex.js` | Linguagem de filtro dos cartões |
| Font Awesome | `res/css/font-awesome.css` | Ícones |

---

## 5. Riscos de dependência consolidados

| # | Risco | Severidade | Evidência |
|---|---|---|---|
| 1 | Pacote `vscode` 1.1.37 deprecado; `postinstall` roda `node ./node_modules/vscode/bin/install`, que baixa binários e costuma falhar hoje | 🔴 Alta | `package.json:176`, `package.json:220` |
| 2 | Nove bibliotecas vendorizadas sem controle de versão nem de CVE | 🔴 Alta | `src/res/js/`, `src/res/css/` |
| 3 | `moment` usado sem ser declarado | 🟡 Média | `src/extension.ts:24`, `src/workspaces.ts:22` |
| 4 | TSLint descontinuado | 🟡 Média | `package.json:217`, `tslint.json` |
| 5 | Toolchain congelado em TypeScript 4.4 e Node 16 (ambos fora de suporte) | 🟡 Média | `package.json`, `.github/workflows/publish.yml` |
| 6 | `marked` 4 com opções (`sanitize`, `mangle`) removidas nas versões seguintes: atualizar exige mudar o código | 🟡 Média | `src/extension.ts:333-339` |
| 7 | `vscode-helpers` sem manutenção recente e de mantenedor único, no núcleo de toda a extensão | 🟡 Média | Todos os módulos TS |

**Nota positiva:** `package-lock.json` está commitado e as versões do manifesto estão
pinadas de forma exata, de modo que o build é determinístico — o problema não é a
reprodutibilidade, e sim a idade do que se reproduz.
