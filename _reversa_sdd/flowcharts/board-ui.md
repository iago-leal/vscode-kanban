# Fluxogramas — módulos do Webview (`board-ui` e `webview-utils`)

> `src/res/js/board.js` (2.161 LOC) e `src/res/js/script.js` (520 LOC)
> 🟢 CONFIRMADO salvo indicação

## Inicialização do Webview

```mermaid
flowchart TD
    A([documento carregado]) --> B[jQuery ready · blocos independentes]
    B --> C[popula seletor de tipo:<br/>bug, emergency, '' selecionado]
    B --> D[coloca ajax-loader nas quatro colunas]
    B --> E[liga botões recarregar e salvar]
    B --> F[liga modal de detalhes ao Mermaid]
    B --> G[liga botão de filtro]
    B --> H[registra listener de message]
    B --> I[postMessage onLoaded]
    I --> J([aguarda setBoard da extensão])
```

## Recepção de `setBoard`

```mermaid
flowchart TD
    A([mensagem setBoard]) --> B[allCards = data.cards]
    B --> C[boardSettings = data.settings]
    C --> D[cardDisplayFilter = data.filter]
    D --> E["para cada cartão:<br/>__uid = índice-aleatório-epoch"]
    E --> F[preenche campo de filtro na interface]
    F --> G[vsckb_refresh_card_view]
```

## Renderização e filtragem

```mermaid
flowchart TD
    A([refresh_card_view]) --> B[para cada coluna]
    B --> C[esvazia o corpo da coluna]
    C --> D[get_cards_sorted coluna]
    D --> E["ordena in place ⚠️ altera a ordem persistida<br/>1 prio desc · 2 tipo · 3 título"]
    E --> F[para cada cartão]
    F --> G[monta contexto do filtro:<br/>valores e funções por cartão]
    G --> H[vsckb_does_match expressão]
    H --> I{compilou e avaliou?}
    I -->|erro| J[loga e devolve true<br/>mostra o cartão]
    I -->|sim| K{resultado}
    K -->|false| L[cartão omitido]
    K -->|true| M[renderiza o cartão]
    J --> M
    M --> N[cores por tipo:<br/>bug escuro · emergency vermelho · demais info]
    N --> O[monta rodapé com botões de movimentação,<br/>execução e tempo conforme settings]
    O --> P{mais cartões?}
    P -->|sim| F
    P -->|não| Q{mais colunas?}
    Q -->|sim| B
    Q -->|não| R([quadro renderizado])
```

## Movimentação de cartão

```mermaid
sequenceDiagram
    participant U as Usuário
    participant B as board.js
    participant E as Extensão
    participant D as Disco
    participant S as vscode-kanban.js

    U->>B: clica no botão da coluna alvo
    B->>B: remove da origem · empurra no destino
    B->>E: postMessage saveBoard(allCards)
    E->>D: grava vscode-kanban.json
    opt exportOnSave
        E->>D: regrava exportações Markdown
    end
    B->>B: refresh_card_view
    B->>E: raiseEvent card_moved {card, from, to, others}
    E->>S: onCardMoved(args) ou onEvent
    opt script chama moveTo* ou setTag
        S->>E: postMessage
        E->>B: moveCardTo / setCardTag
        B->>E: saveBoard novamente
    end
```

🟢 A gravação **precede** o evento; não há transação. Um script que mova o cartão dispara uma
segunda gravação.

## Avaliação do filtro (`vsckb_does_match`)

```mermaid
flowchart TD
    A([does_match expr, opts]) --> B[monta ambiente de funções genéricas]
    B --> C[mescla funções por cartão]
    C --> D[mescla valores por cartão]
    D --> E{expressão vazia?}
    E -->|sim| F([devolve true])
    E -->|não| G[compileExpression Filtrex]
    G --> H{compilou?}
    H -->|não| I[log do erro]
    H -->|sim| J[FILTER values]
    J --> K{avaliou?}
    K -->|não| I
    K -->|sim| L([devolve resultado])
    I --> M([devolve true — mostra tudo])
```

## Renderização de Markdown

```mermaid
flowchart TD
    A([from_markdown md]) --> B[showdown Converter makeHtml]
    B --> C[insere em div .vsckb-markdown]
    C --> D["remove tags script ⚠️ única sanitização"]
    D --> E[aplica highlight.js aos blocos de código]
    E --> F[marca elementos mermaid]
    F --> G([HTML pronto])
```

🔴 Atributos de evento (`onerror`, `onclick`) e elementos como `<iframe>` **não** são
removidos. Com `enableScripts: true` e sem CSP, conteúdo de cartão consegue executar script no
contexto do Webview.
