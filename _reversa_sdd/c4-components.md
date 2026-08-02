# C4 Nível 3 — Componentes

> Gerado pelo **Arquiteto** (Reversa) em 2026-08-02 · 🟢 CONFIRMADO salvo indicação
> Detalhados os dois containers relevantes: Extension Host e Webview.

---

## 1. Extension Host

```mermaid
C4Component
    title Componentes — Extension Host

    Container_Boundary(host, "Extension Host") {
        Component(act, "Ativação", "extension.ts :117-372", "Workflow de 7 passos: logger, diretório, manifesto, comando, watcher, changelog, aviso")
        Component(util, "Utilitários", "extension.ts :402-586", "getExtensionDir, getLogger, open multiplataforma, saveToFile, showError")
        Component(wsp, "Workspace", "workspaces.ts :326-957", "Uma instância por pasta: configuração, abertura, eventos, tempo")
        Component(exp, "Exportador", "workspaces.ts :959-1122", "Gera um Markdown por cartão, com limpeza por glob")
        Component(per, "Persistidor", "workspaces.ts :1124-1133", "saveBoardTo — JSON indentado")
        Component(kb, "KanbanBoard", "boards.ts :406-1470", "Painel Webview, protocolo de mensagens, normalização da carga")
        Component(mdl, "Modelo", "boards.ts :32-401", "Board, BoardCard, BoardSettings, BOARD_COLMNS, KNOWN_URLS")
        Component(htm, "Gerador de HTML", "html.ts", "Header, navbar, footer, título")
        Component(tgl, "Cliente Toggl", "toggl.ts", "Token, projetos, entradas de tempo")
        Component(ann, "Anúncios", "announcements.ts", "Aviso único de recrutamento")
    }

    ContainerDb(fs, "Arquivos do workspace", "JSON, filter, js, md")
    Container(wv, "Webview", "board.js + script.js")
    System_Ext(api, "API Toggl v8")

    Rel(act, wsp, "cria por pasta")
    Rel(act, ann, "exibe na ativação")
    Rel(act, util, "usa")
    Rel(wsp, kb, "abre o painel com callbacks")
    Rel(wsp, exp, "quando exportOnSave")
    Rel(wsp, per, "a cada saveBoard")
    Rel(wsp, tgl, "quando trackTime.type é toggl")
    Rel(wsp, fs, "lê configuração, executa script ⚠️")
    Rel(kb, mdl, "usa o modelo")
    Rel(kb, htm, "monta o documento")
    Rel(kb, fs, "lê quadro e filtro")
    BiRel(kb, wv, "postMessage")
    Rel(tgl, api, "HTTPS Basic")
    Rel(exp, fs, "apaga e grava Markdown")
    Rel(per, fs, "grava JSON")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Responsabilidades

| Componente | Responsabilidade única? | Observação |
|---|---|---|
| Ativação | 🟡 | Sete passos heterogêneos, mas todos de inicialização |
| Utilitários | 🔴 | `open`, `saveToFile` e `getLogger` não têm relação entre si |
| `Workspace` | 🔴 | Cinco responsabilidades: configuração, abertura, eventos, tempo, coordenação |
| Exportador | 🟢 | Função pura de efeito único, embora com 163 linhas |
| Persistidor | 🟢 | Três linhas, faz uma coisa |
| `KanbanBoard` | 🔴 | Painel, protocolo, normalização e 470 linhas de HTML |
| Modelo | 🟢 | Só tipos e constantes |
| Gerador de HTML | 🟢 | Coeso |
| Cliente Toggl | 🟢 | Coeso, ainda que numa função de 265 linhas |
| Anúncios | 🟢 | Coeso |

### Candidatos naturais a extração 🟡

Se um dia você mexer nisto, iago, três extrações rendem muito com pouco risco:

1. **`Exportador`** já é quase autônomo: recebe `{board, dir, cleanup, maxNameLength}` e grava.
   Bastaria tirar a dependência de `vscode_helpers` para virar função pura testável.
2. **Normalização da carga** (`boards.ts:1336-1443`) é lógica pura de domínio presa dentro de
   um método privado com I/O. Separar entrada, normalização e saída daria o primeiro teste de
   domínio do projeto.
3. **HTML dos modais** (`boards.ts:449-919`) sai para arquivos `.html` sem tocar em lógica
   nenhuma, reduzindo `boards.ts` em quase um terço.

---

## 2. Webview

```mermaid
C4Component
    title Componentes — Webview

    Container_Boundary(wv, "Webview") {
        Component(state, "Estado global", "board.js :1-15", "allCards, boardSettings, cardDisplayFilter, currentUser, nextKanbanCardId")
        Component(render, "Renderização", "board.js :730-1211", "refresh_card_view: monta cartões, aplica cores e botões")
        Component(sort, "Ordenação", "board.js :440-484", "prio desc, tipo, título")
        Component(crud, "CRUD de cartões", "board.js :71-257, 1877-2005", "Criar, editar, excluir, mover")
        Component(links, "Vínculos", "board.js :1259-1383", "Lista de cartões referenciados")
        Component(msg, "Ponte de mensagens", "board.js :1930-2091", "Listener de message e despacho")
        Component(filter, "Filtro", "script.js :58-218", "Ambiente Filtrex com 18 funções genéricas")
        Component(md, "Markdown", "script.js :227-296", "Showdown, remoção de script, highlight, Mermaid")
        Component(fmt, "Formatação", "script.js :24-55, 377-443", "Datas UTC/local, tempo relativo, UUID, clone")
        Component(vendor, "Bibliotecas vendorizadas", "res/js, res/css", "jQuery, Bootstrap, CodeMirror, Mermaid, Showdown, highlight.js, Moment, Filtrex")
    }

    Container(host, "Extension Host")

    Rel(msg, state, "setBoard substitui o estado")
    Rel(crud, state, "muta allCards")
    Rel(render, state, "lê")
    Rel(render, sort, "ordena in place ⚠️")
    Rel(render, filter, "decide exibição por cartão")
    Rel(render, md, "renderiza descrição e detalhes")
    Rel(crud, msg, "saveBoard e raiseEvent")
    Rel(links, state, "resolve references")
    BiRel(msg, host, "postMessage")
    Rel(render, vendor, "jQuery, Bootstrap, CodeMirror")
    Rel(md, vendor, "Showdown, Mermaid, highlight.js")
    Rel(filter, vendor, "Filtrex")
    Rel(fmt, vendor, "Moment")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Observação estrutural 🟢

Os "componentes" do Webview são **conceituais, não físicos**: não há módulos, `import`,
`export` nem namespace. As 33 funções de `board.js` e as 21 de `script.js` convivem no escopo
global do documento, distinguidas apenas pelo prefixo `vsckb_`.

Consequências diretas:

| Consequência | Detalhe |
|---|---|
| Sem fronteira verificável | Qualquer função alcança `allCards` diretamente |
| Sem teste unitário possível | Nada é importável fora de um navegador com jQuery carregado |
| Colisão silenciosa | `script.js:163` cria a global implícita `i` por falta de `let` |
| Ordem de carga importa | `script.js` precisa vir antes de `board.js` (`html.ts:139-140`) |

### Dependência entre os dois arquivos

`board.js` depende de 12 funções de `script.js` (`vsckb_does_match`, `vsckb_from_markdown`,
`vsckb_to_string`, `vsckb_normalize_str`, `vsckb_is_nil`, `vsckb_clone`, `vsckb_as_utc`,
`vsckb_as_local`, `vsckb_post`, `vsckb_raise_event`, `vsckb_uuid`, `vsckb_to_pretty_time`).
`script.js` **não** depende de `board.js` 🟢 — a dependência é unidirecional, o que torna
`script.js` o candidato mais fácil a virar módulo testável.
