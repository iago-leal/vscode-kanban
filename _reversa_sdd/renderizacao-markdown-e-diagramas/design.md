# Renderização de Markdown e Diagramas — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `vsckb_from_markdown` | `(md)` | `jQuery` | Devolve `div.vsckb-markdown` já tratado |
| `vsckb_apply_highlight` | `(selector)` | `void` | highlight.js sobre blocos de código |
| `vsckb_apply_mermaid` | `(element)` | `void` | Renderiza diagramas do elemento |
| `vsckb_append_card_content` | `(cardContentObj, target, ifAppended)` | `void` | Anexa conteúdo ao cartão |
| `vsckb_invoke_for_md_editor` | `(id, action)` | `void` | Acessa o editor CodeMirror por id |
| `vsckb_external_url` | `(url, text)` | `void` | Solicita abertura à extensão |

### Bibliotecas envolvidas 🟢

| Biblioteca | Papel | Onde é carregada |
|---|---|---|
| Showdown | Markdown → HTML | `html.ts:182` |
| highlight.js | Realce de blocos de código | `html.ts:176` |
| Mermaid | Diagramas | `html.ts:180-181` |
| CodeMirror | Editor com modo markdown | `html.ts:177-179` |
| Moment | Datas em conteúdo derivado | `html.ts:175` |

## Fluxo Principal

### Renderização de conteúdo

1. `vsckb_get_card_description` normaliza o valor para `{content, mime}` (`board.js:396-421`).
2. Se o MIME for `text/markdown`, chama-se `vsckb_from_markdown`; caso contrário, o texto é
   inserido como conteúdo simples.
3. `vsckb_from_markdown` (`script.js:227-296`):
   - instancia `showdown.Converter` e converte;
   - insere o HTML num `div.vsckb-markdown`;
   - **remove as tags `<script>`** (`script.js:235`);
   - acrescenta classes do Bootstrap às tabelas e torna as imagens responsivas
     (`script.js:238-246`) 🟢;
   - aplica realce aos blocos de código;
   - marca blocos de diagrama para o Mermaid;
   - intercepta âncoras, substituindo a navegação por `vsckb_external_url`.
4. O resultado é anexado ao corpo do cartão (`board.js:35-70`).

### Diagramas

O Mermaid **não** roda na renderização do cartão: é acionado quando o modal de detalhes termina
de aparecer, no evento `shown.bs.modal` (`boards.ts:2126-2134`). Decisão de desempenho: evita
renderizar diagramas de cartões que ninguém abriu 🟢.

### Abertura de link

1. O clique interceptado chama `vsckb_external_url(url, texto)` (`script.js:220-225`).
2. A extensão recebe `openExternalUrl`, valida com `URL.parse` e exibe
   "Do you really want to open the URL …?" (`boards.ts:1149-1188`).
3. Só após "Yes" o alvo é aberto por `vsckb.open`.

### Edição

Os `textarea.vsckb-markdown-editor` dos modais são convertidos em instâncias CodeMirror,
registradas em `MARKDOWN_EDITORS` (`script.js:1`). O valor é lido por `editor.getValue()` e
gravado sempre com `mime: 'text/markdown'` (`board.js:423-438`).

## Fluxos Alternativos

- **MIME `text/plain`:** o conteúdo é exibido como texto, sem conversão 🟢.
- **Conteúdo vazio:** nada é anexado ao cartão (`board.js:38-39`) 🟢.
- **URL não analisável:** `URL.parse` lança, o erro sobe e chega a `showError`
  (`boards.ts:1157`) 🟢.
- **URL conhecida (`openKnownUrl`):** aberta **sem** confirmação, a partir da lista fixa
  `KNOWN_URLS` (`boards.ts:1190-1197`) 🟢.
- **Diagrama malformado:** o Mermaid falha e a área fica vazia; o erro chega ao log pelo
  `window.onerror` global (`html.ts:206-216`) 🟡.

## Dependências

- `gestao-de-cartoes` — os editores vivem nos modais de escrita
- `colunas-e-movimentacao` — a renderização ocorre dentro do ciclo de desenho da coluna
- `webview-utils` — todas as funções desta unit residem em `script.js`
- Cinco bibliotecas vendorizadas (tabela acima)

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Showdown no Webview, `marked` apenas para o CHANGELOG na extensão | `script.js:228`, `extension.ts:333` | 🟢 |
| Sanitização por remoção de `<script>`, e nada mais | `script.js:235` | 🟢 ⚠️ |
| Mermaid adiado até a exibição do modal | `boards.ts:2126-2134` | 🟢 |
| Links interceptados e confirmados pelo usuário | `boards.ts:1166-1178` | 🟢 |
| Progresso derivado do Markdown, sem campo próprio | CHANGELOG 1.8.0 | 🟢 |
| CodeMirror com um único modo carregado (markdown), apesar dos 121 versionados | `html.ts:179` | 🟢 |

## Estado Interno

| Estado | Onde | Observação |
|---|---|---|
| `MARKDOWN_EDITORS` | `script.js:1` | Instâncias CodeMirror ativas |

## Observabilidade

- 🟢 `window.onerror` global captura falhas de renderização e as envia ao log da extensão
  (`html.ts:206-216`)
- 🔴 Nenhum registro específico de falha de conversão, de diagrama ou de realce

## Riscos e Lacunas

- 🔴 **Sanitização insuficiente (Q6).** Showdown não sanitiza por padrão; remover `<script>`
  deixa passar atributos de evento e `<iframe>`. Com `enableScripts: true` e sem CSP, um cartão
  com `<img src=x onerror=…>` executa código no Webview. O vetor é real quando o quadro vem de
  repositório de terceiro
- 🔴 **Ausência de CSP** no documento (`html.ts:160-226`), contrariando a recomendação oficial
  de Webviews
- 🟡 Versões das cinco bibliotecas vendorizadas são desconhecidas: não há como saber se
  correções de segurança já publicadas foram aplicadas
- 🟢 A confirmação de URL externa é uma proteção real e bem construída — vale preservá-la em
  qualquer reimplementação
