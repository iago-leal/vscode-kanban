# Persistência do Quadro

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Leitura, normalização e gravação do arquivo `.vscode/vscode-kanban.json`, que é a
representação persistida do quadro. Inclui a tolerância a arquivos incompletos ou editados à
mão e a atribuição de identificadores aos cartões.

## Responsabilidades

- Ler o arquivo do quadro e transformá-lo num objeto normalizado
- Garantir que as quatro colunas existam e sejam arrays
- Atribuir `id` a cartões que não tenham
- Normalizar `description` e `details` para o formato `{content, mime}`
- Gravar o quadro completo em JSON indentado
- Recarregar o quadro sob demanda (botão "Reload Board")

## Regras de Negócio

- O arquivo mora sempre em `<workspace>/.vscode/vscode-kanban.json` 🟢
- O JSON é gravado com indentação de dois espaços, para *diff* legível 🟢
- Conteúdo nulo no arquivo produz um quadro vazio, não um erro 🟢
- Coluna ausente ou de tipo errado é normalizada para array vazio 🟢
- Colunas extras presentes no arquivo são ignoradas na carga e perdidas na gravação 🟡
- O `id` é gerado **na criação do cartão** (Webview) e, como rede de segurança, **também na
  carga** para cartões que cheguem sem ele — por exemplo, inseridos manualmente no JSON 🟢
- Cartão sem `id` recebe inteiro sequencial `max(ids numéricos) + 1` quando `simpleIDs` (padrão) 🟢
- Sem `simpleIDs`, o `id` é `<YYYYMMDDHHmmss>_<aleatório>_<uuid sem hífens>`; o prefixo de data
  só aparece quando há `creation_time` válido 🟢
- `mime` diferente de `text/markdown` é forçado a `text/plain` 🟢
- Conteúdo vazio faz `description`/`details` virar `undefined` e desaparecer do JSON 🟢
- A gravação substitui o arquivo inteiro; não há mesclagem nem detecção de conflito 🟢
- 🔴 Não há validação de esquema, cópia de segurança nem tratamento de JSON malformado

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Ler e desserializar o arquivo do quadro | Must | Quadro válido é carregado integralmente |
| RF-02 | Normalizar as quatro colunas para arrays | Must | Arquivo sem a chave `testing` carrega com `testing: []` |
| RF-03 | Atribuir `id` a todo cartão que não tenha | Must | Cartão inserido à mão ganha `id` na abertura |
| RF-04 | Normalizar conteúdo para `{content, mime}` | Must | String simples vira objeto com `text/plain` |
| RF-05 | Gravar o quadro em JSON indentado com dois espaços | Must | Arquivo gravado é legível em *diff* |
| RF-06 | Recarregar o quadro do disco sob demanda | Should | Botão "Reload Board" traz alterações externas |
| RF-07 | Criar quadro vazio quando o conteúdo for nulo | Should | Arquivo com `null` não quebra a abertura |
| RF-08 | Validar o esquema do arquivo antes de usar | Could | 🔴 Não existe no legado — proposto |
| RF-09 | Gravar cópia de segurança antes de sobrescrever | Could | 🔴 Não existe no legado — proposto |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Integridade | Gravação sem escrita atômica: `writeFile` direto sobre o arquivo final | `workspaces.ts:1129-1133` | 🟢 |
| Integridade | Ausência de tratamento de erro no `JSON.parse` | `boards.ts:1342` | 🟢 |
| Desempenho | O quadro inteiro é reescrito a cada alteração de um único cartão | `boards.ts:1217-1233` | 🟢 |
| Desempenho | A atribuição de IDs simples é quadrática no número de cartões sem `id` | `boards.ts:1389-1405` | 🟢 |
| Compatibilidade | Tolerância na carga substitui versionamento de esquema | `boards.ts:1407-1442` | 🟡 |

## Critérios de Aceitação

```gherkin
Dado um arquivo de quadro válido com cartões nas quatro colunas
Quando o quadro é carregado
Então todos os cartões aparecem em suas colunas de origem

Dado um arquivo de quadro sem a chave "testing"
Quando o quadro é carregado
Então a coluna Testing existe e está vazia

Dado um cartão inserido manualmente no JSON sem o campo "id"
E a configuração simpleIDs em seu padrão verdadeiro
Quando o quadro é carregado
Então o cartão recebe um id inteiro maior que todos os ids numéricos existentes

Dado um cartão cuja descrição é a string "texto simples"
Quando o quadro é carregado
Então a descrição vira um objeto com content "texto simples" e mime "text/plain"

Dado um cartão com mime "application/json"
Quando o quadro é carregado
Então o mime é forçado para "text/plain"

Dado um arquivo de quadro com JSON malformado
Quando o quadro é carregado
Então 🔴 o legado propaga o erro sem recuperação nem cópia de segurança
E o comportamento desejado precisa ser definido antes da reimplementação
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Leitura e normalização | Must | Todo fluxo depende |
| Atribuição de `id` | Must | Identidade é pré-requisito de vínculos e scripts |
| Gravação indentada | Must | É o que torna o quadro versionável (ADR-001) |
| Normalização de conteúdo | Must | Sem ela a renderização quebra |
| Recarga sob demanda | Should | Único mecanismo de ressincronização |
| Validação de esquema | Could | Ausente no legado, mas elimina a classe de falha mais grave |
| Escrita atômica e cópia de segurança | Could | Ausente no legado |
| Versionamento de esquema | Won't (no legado) | 🔴 Não existe; necessário se o modelo mudar |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/boards.ts:1336-1462` | `KanbanBoard.reloadBoard` | 🟢 |
| `src/boards.ts:1354-1387` | `SET_CARD_CONTENT` | 🟢 |
| `src/boards.ts:1389-1405` | `FIND_NEXT_SIMPLE_CARD_ID` | 🟢 |
| `src/boards.ts:1477-1484` | `newBoard` | 🟢 |
| `src/workspaces.ts:1124-1133` | `saveBoardTo` | 🟢 |
| `src/workspaces.ts:345-351` | `Workspace.boardFile` | 🟢 |
| `src/res/js/board.js:1228-1240` | `vsckb_save_board` | 🟢 |
| `src/res/js/board.js:1212-1217` | `vsckb_reload_board` | 🟢 |
