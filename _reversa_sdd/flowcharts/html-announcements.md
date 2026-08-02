# Fluxogramas — módulos `html` e `announcements`

> `src/html.ts` (307 LOC) e `src/announcements.ts` (102 LOC) · 🟢 CONFIRMADO

## Composição do documento (`html`)

```mermaid
flowchart TD
    A([generateHtmlDocument opts]) --> B[generateHeader]
    B --> B1["head: 6 folhas de estilo<br/>font-awesome, hljs, codemirror,<br/>mermaid claro e escuro, bootstrap"]
    B1 --> B2["10 scripts: filtrex, moment, highlight,<br/>codemirror + autorefresh + modo markdown,<br/>mermaid + mermaidAPI, showdown,<br/>jquery, bootstrap"]
    B2 --> B3[script inline: acquireVsCodeApi,<br/>vsckb_log, window.onerror,<br/>VSCKB_AJAX_LOADER_16x11]
    B3 --> B4["title escapado por HtmlEntities<br/>⚠️ nenhum meta Content-Security-Policy"]
    B4 --> C[generateNavBarHeader]
    C --> C1[marca com icon.svg e título]
    C1 --> C2[getHeaderButtons — filtrar, recarregar, salvar]
    C2 --> C3[botões sociais: github, twitter, paypal]
    C3 --> D[getContent — as quatro colunas]
    D --> E[generateFooter]
    E --> E1["css/style.css + css/&lt;name&gt;.css"]
    E1 --> E2["js/script.js + js/&lt;name&gt;.js"]
    E2 --> E3[getFooter — os seis modais]
    E3 --> F([documento completo])
```

🟢 O parâmetro `name` (valor `board`) determina por convenção quais arquivos de estilo e
script são carregados. Não há validação de existência.

## Título do documento

```mermaid
flowchart TD
    A([getDocumentTitle title]) --> B[trim]
    B --> C{vazio?}
    C -->|sim| D([Kanban Board])
    C -->|não| E(["Kanban Board (título)"])
```

## Aviso único (`announcements`)

```mermaid
flowchart TD
    A([showAnnouncements context]) --> B[lê globalState<br/>vsckb_announcement_20201009_655f729b]
    B --> C{valor é exatamente '3'?}
    C -->|sim| Z([não exibe nada])
    C -->|não| D[showWarningMessage com quatro opções]
    D --> E{botão escolhido}
    E -->|1 · YES| F[openExternal issue 16 do GitHub]
    F --> G[doNotShowAgain = resultado do openExternal]
    E -->|2 · No, but DONATE| H[segundo diálogo]
    H --> I{escolha}
    I -->|homepage do autor| J[openExternal marcel.coffee]
    J --> G
    I -->|nada agora| K[doNotShowAgain permanece false]
    E -->|3 · Later| L[não grava nada — reaparece]
    E -->|4 · Don't show again| M[doNotShowAgain = true]
    E -->|fechou o diálogo| L
    G --> N{doNotShowAgain?}
    M --> N
    K --> N
    L --> N
    N -->|sim| O[grava '3' no globalState]
    N -->|não| Z
```

🟢 Consequência da linha `doNotShowAgain = await openExternal(...)`: **abrir o link com
sucesso silencia o aviso**; falha ao abrir o navegador faz o aviso reaparecer na próxima
ativação.
