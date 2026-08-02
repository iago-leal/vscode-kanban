# Renderização de Markdown e Diagramas

> Unit da extração Reversa · 2026-08-02
> ⚠️ Unit com a lacuna de segurança mais direta do sistema (Q6 de `questions.md`).

## Visão Geral

Conversão do conteúdo Markdown dos cartões em HTML renderizado, com realce de sintaxe,
diagramas Mermaid, barras de progresso derivadas de listas de tarefas e edição assistida por
CodeMirror.

## Responsabilidades

- Converter Markdown em HTML para descrição e detalhes
- Aplicar realce de sintaxe aos blocos de código
- Renderizar diagramas Mermaid embutidos
- Derivar barras de progresso de listas de tarefas
- Oferecer editores CodeMirror nos modais de escrita
- Interceptar links para abertura controlada

## Regras de Negócio

- A conversão usa Showdown, no Webview 🟢
- Tags `<script>` são removidas do HTML resultante 🟢
- 🔴 Atributos de evento (`onerror`, `onclick`) e elementos como `<iframe>` **não** são removidos
- Listas de tarefas em Markdown viram barras de progresso no cartão, calculadas pela contagem
  de caixas marcadas em `ul.vsckb-task-list li.task-list-item input[type="checkbox"]` 🟢
  *(reclassificado de 🟡 na revisão: evidência direta em `board.js:1139-1180`)*
- A conversão também estiliza tabelas (classes do Bootstrap) e torna imagens responsivas 🟢
- Links no Markdown são interceptados e abertos com confirmação do usuário 🟢
- Diagramas Mermaid são renderizados no modal de detalhes ao ser exibido 🟢
- O editor de Markdown usa CodeMirror com modo markdown e realce 🟢
- Descrição e detalhes editados pela interface são sempre gravados como `text/markdown` 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Converter Markdown em HTML na exibição do cartão | Must | Negrito, listas e títulos aparecem formatados |
| RF-02 | Remover conteúdo executável do HTML gerado | Must | Tag `<script>` não sobrevive à conversão |
| RF-03 | Oferecer editor com realce de sintaxe | Should | O editor destaca a sintaxe Markdown |
| RF-04 | Renderizar diagramas Mermaid | Should | Um bloco `mermaid` vira diagrama no detalhe |
| RF-05 | Aplicar realce a blocos de código | Should | Blocos com linguagem aparecem coloridos |
| RF-06 | Derivar barra de progresso de lista de tarefas | Should | 2 de 4 itens marcados exibem 50% |
| RF-07 | Interceptar links e pedir confirmação antes de abrir | Should | Clicar num link externo abre o diálogo de confirmação |
| RF-08 | Sanitizar de fato o HTML gerado | Could | 🔴 Ausente no legado — ver Q6 |
| RF-09 | Declarar Content-Security-Policy no documento | Could | 🔴 Ausente no legado |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Segurança | Única sanitização é a remoção de `<script>` | `script.js:235` | 🟢 |
| Segurança | Webview com scripts habilitados e sem CSP | `boards.ts:1109`, `html.ts:160-226` | 🟢 |
| Segurança | Abertura de URL externa exige confirmação explícita | `boards.ts:1149-1188` | 🟢 |
| Desempenho | Mermaid só é acionado ao exibir o modal de detalhes | `boards.ts:2126-2134` | 🟢 |
| Compatibilidade | Cinco bibliotecas vendorizadas participam desta unit | `html.ts:167-184` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um cartão cuja descrição contém "**negrito**"
Quando o cartão é renderizado
Então o texto aparece em negrito

Dado uma descrição contendo uma tag script
Quando o cartão é renderizado
Então a tag é removida do HTML resultante

Dado uma descrição contendo um atributo de evento como onerror
Quando o cartão é renderizado
Então 🔴 o atributo sobrevive no legado
E o comportamento desejado precisa ser decidido antes da reimplementação

Dado uma descrição com uma lista de quatro tarefas, duas marcadas
Quando o cartão é renderizado
Então uma barra de progresso indica 50%

Dado um detalhe contendo um bloco de diagrama mermaid
Quando o modal de detalhes é exibido
Então o diagrama é renderizado

Dado um link externo no Markdown
Quando o usuário clica no link
Então um diálogo pede confirmação antes de abrir a URL
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Conversão de Markdown | Must | Todo cartão depende |
| Remoção de conteúdo executável | Must | Única barreira de segurança existente |
| Editor com realce | Should | Conforto de escrita, com alternativa |
| Mermaid e realce de código | Should | Diferencial anunciado na versão 1.15.1 |
| Barra de progresso | Should | Feature anunciada na versão 1.8.0 |
| Confirmação de link | Should | Proteção real, já implementada |
| Sanitização completa e CSP | Could | Ausentes; corrigem a lacuna mais séria |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/res/js/script.js:227-296` | `vsckb_from_markdown` | 🟢 |
| `src/res/js/script.js:3-8` | `vsckb_apply_highlight` | 🟢 |
| `src/res/js/script.js:9-23` | `vsckb_apply_mermaid` | 🟢 |
| `src/res/js/script.js:309-322` | `vsckb_invoke_for_md_editor` | 🟢 |
| `src/res/js/script.js:220-225` | `vsckb_external_url` | 🟢 |
| `src/res/js/board.js:35-70` | `vsckb_append_card_content` | 🟢 |
| `src/res/js/board.js:396-438` | normalização de descrição | 🟢 |
| `src/boards.ts:1149-1188` | confirmação de URL externa | 🟢 |
| `src/html.ts:167-184` | carga das bibliotecas vendorizadas | 🟢 |
