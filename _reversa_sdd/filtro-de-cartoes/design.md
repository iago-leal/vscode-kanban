# Filtro de Cartões — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `vsckb_does_match` | `(expr, opts)` | `boolean` | `opts = {funcs, values}` |
| `compileExpression` | `(expr, funcs)` | `(values) => any` | Filtrex, vendorizado |

### Contrato do ambiente de avaliação 🟢

**Valores por cartão** (`board.js:898-926`):

| Nome | Tipo | Origem |
|---|---|---|
| `id`, `title`, `type` | string | campos do cartão |
| `prio`, `priority` | number | `prio`, com `NaN` → 0 |
| `cat`, `category` | string | `category` |
| `assigned_to` | string | `assignedTo.name` |
| `description`, `details` | string | conteúdo Markdown |
| `tag` | any | campo livre |
| `time` | number \| false | `creation_time` em epoch |
| `now`, `utc` | number | agora, local e UTC |
| `is_bug`, `is_issue` | boolean | tipo ∈ {bug, issue} |
| `is_note`, `is_task` | boolean | tipo ∈ {'', note, task} |
| `is_emergency`, `is_emerg` | boolean | tipo = emergency |
| `true`/`yes`, `false`/`no`, `null`, `undefined` | literais | — |

**Funções genéricas** (`script.js:63-192`): `all`, `any`, `concat`, `contains`, `debug`,
`float`, `int`, `integer`, `is_empty`, `is_nan`, `is_nil`, `norm`, `normalize`, `number`,
`regex`, `str`, `str_invoke`, `unix`.

**Funções por cartão** (`board.js:838-896`): `is_after(data, ouIgual?)`,
`is_before(data, ouIgual?)`, `is_older(dias, ouIgual?)`, `is_younger(dias, ouIgual?)`,
`is_cat(valor)`, `is_category(valor)`, `is_assigned_to(valor)`.

## Fluxo Principal

1. O botão de filtro abre o modal com a expressão corrente (`board.js:2136-2142`).
2. "Apply" grava a expressão em `cardDisplayFilter`, envia `saveFilter` à extensão, fecha o
   modal e re-renderiza (`board.js:2143-2153`).
3. A extensão grava `.vscode/vscode-kanban.filter` como *buffer* UTF-8
   (`workspaces.ts:564-573`).
4. Na renderização, para **cada cartão**, monta-se o contexto (valores e funções) e chama-se
   `vsckb_does_match` (`board.js:770-928`).
5. `vsckb_does_match` mescla funções e valores, compila com Filtrex e avalia
   (`script.js:193-212`).
6. Resultado verdadeiro renderiza o cartão; falso o omite.

Na abertura do quadro, `loadFilter` lê o arquivo e o filtro chega junto de `setBoard`
(`workspaces.ts:502-512`, `boards.ts:1457-1461`).

## Fluxos Alternativos

- **Expressão vazia:** devolve `true` sem compilar (`script.js:208`) 🟢.
- **Erro de compilação ou execução:** `catch` registra `vsckb_does_match().error: …` e devolve
  `true` (`script.js:213-217`) 🟢.
- **Arquivo de filtro inexistente:** `loadFilter` devolve string vazia
  (`workspaces.ts:504-511`) 🟢.
- **Falha ao ler o arquivo:** `showError` e o quadro abre sem filtro 🟢.
- **`creation_time` ausente ou inválido:** `time` vira `false` e as funções de data devolvem
  falso (`board.js:811-822`) 🟢.

## Dependências

- Filtrex (vendorizado) — compilação da expressão
- Moment (vendorizado) — comparações de data
- `webview-utils` — `vsckb_to_string`, `vsckb_normalize_str`, `vsckb_is_nil`, `vsckb_log`
- `colunas-e-movimentacao` — o filtro é aplicado dentro da renderização de cada coluna
- `persistencia-do-quadro` — arquivo irmão `.filter`

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Falha silenciosa que mostra tudo, em vez de esconder | `script.js:213-217` | 🟢 |
| Filtro persistido em arquivo próprio, não dentro do quadro | `workspaces.ts:313` | 🟢 |
| Ambiente com apelidos redundantes (`cat`/`category`, `prio`/`priority`, `is_emerg`/`is_emergency`) | `board.js:898-926` | 🟢 |
| Funções de data truncam ao início do dia antes de comparar | `board.js:786-801` | 🟢 |
| `all()` e `any()` acrescentadas na versão 1.19.0 | CHANGELOG | 🟢 |
| Otimização explícita de desempenho na versão 1.18.0 | CHANGELOG | 🟢 |

## Estado Interno

| Estado | Onde | Persistido? |
|---|---|---|
| `cardDisplayFilter` | global do Webview | Sim, em `.vscode/vscode-kanban.filter` |

## Observabilidade

- 🟢 Erros de filtro são registrados via `vsckb_log`, que chega ao log da extensão com a tag
  `WebView` (`boards.ts:1131-1138`)
- 🔴 O usuário não recebe nenhuma indicação visual de que a expressão falhou

## Riscos e Lacunas

- 🟢 **A expressão é compilada uma vez por cartão a cada renderização.** Em quadros grandes,
  isso multiplica o custo; compilar uma vez e reutilizar a função seria a otimização natural
- 🟡 A versão do Filtrex vendorizado é desconhecida, o que impede avaliar o comportamento exato
  do compilador e eventuais correções de segurança
- 🟡 `str_invoke` permite invocar qualquer método de string por nome, e `regex` aceita padrão
  arbitrário: a linguagem é mais poderosa do que a documentação sugere, ainda que confinada ao
  Webview
- 🟡 Mudanças no ambiente de valores quebram filtros salvos pelos usuários, sem aviso
  (`spec-impact-matrix.md` §2)
- 🟢 Bug menor confirmado: `for (i = 2; ...)` sem `let` em `script.js:163` cria variável global
  implícita
