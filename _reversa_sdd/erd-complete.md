# ERD — Modelo de dados

> Gerado pelo **Arquiteto** (Reversa) em 2026-08-02 · 🟢 CONFIRMADO salvo indicação
>
> ⚠️ **Não existe banco de dados.** O que segue é o **modelo lógico** das estruturas
> serializadas em JSON, apresentado em notação ERD por convenção do Reversa. Não há tabelas,
> chaves estrangeiras nem integridade referencial — apenas objetos aninhados e uma referência
> por identificador que **o sistema não valida**.

---

## 1. Modelo completo

```mermaid
erDiagram
    BOARD ||--o{ CARD : "contém em 4 colunas fixas"
    CARD ||--o| CARD_CONTENT : "description"
    CARD ||--o| CARD_CONTENT : "details"
    CARD ||--o| ASSIGNED_TO : "assignedTo"
    CARD ||--o| TAG : "tag (livre)"
    TAG ||--o| TIME_TRACKING : "time-tracking"
    TIME_TRACKING ||--o{ TIME_ENTRY : "entries (carimbos)"
    CARD }o--o{ CARD : "references (sem integridade) ⚠️"
    BOARD_SETTINGS ||--|{ COLUMN_SETTINGS : "4 colunas"
    WORKSPACE ||--|| BOARD : "1 por pasta"
    WORKSPACE ||--|| CONFIG : "kanban.* em settings.json"
    WORKSPACE ||--o| FILTER : "vscode-kanban.filter"
    WORKSPACE ||--o| EVENT_SCRIPT : "vscode-kanban.js"
    CONFIG ||--o| TRACK_TIME : "trackTime"
    BOARD ||--o{ EXPORT_FILE : "gera quando exportOnSave"

    BOARD {
        array todo "BoardCard[]"
        array in_progress "BoardCard[] — chave 'in-progress'"
        array testing "BoardCard[]"
        array done "BoardCard[]"
    }

    CARD {
        string title PK_logica "obrigatório — único campo sem '?'"
        string id "gerado na carga se ausente"
        string type "'' | bug | emergency | issue | note | task"
        number prio "ausente equivale a 0"
        string category "rótulo livre"
        string creation_time "ISO 8601 UTC"
        array references "string[] de ids ⚠️ sem validação"
        string __uid "TRANSITÓRIO — não persistido"
    }

    CARD_CONTENT {
        string content
        string mime "text/markdown | text/plain"
    }

    ASSIGNED_TO {
        string name
    }

    TAG {
        any dados_livres "escrito por scripts do usuário"
    }

    TIME_TRACKING {
        number seconds "recalculado do zero a cada acionamento"
        array entries "carimbos ISO alternando início e fim"
    }

    TIME_ENTRY {
        string timestamp "ISO 8601 UTC"
    }

    BOARD_SETTINGS {
        boolean canExecute
        boolean canTrackTime "derivado de trackTime"
        boolean hideTimeTrackingIfIdle "vem de noTimeTrackingIfIdle"
        boolean simpleIDs "padrão true"
    }

    COLUMN_SETTINGS {
        string name "nome de exibição"
    }

    CONFIG {
        boolean canExecute
        boolean cleanupExports "padrão TRUE ⚠️"
        boolean exportOnSave
        string exportPath
        any globals
        number maxExportNameLength "padrão 48"
        boolean noScmUser
        boolean noSystemUser
        boolean noTimeTrackingIfIdle
        boolean openOnStartup
        boolean simpleIDs
    }

    TRACK_TIME {
        string type "'' | script | toggl | toggle"
        string token "literal ou caminho de arquivo"
        number project "id do projeto Toggl"
        any options "para type script"
    }

    FILTER {
        string expressao "texto puro"
    }

    EVENT_SCRIPT {
        function onCardCreated
        function onCardDeleted
        function onCardMoved
        function onCardUpdated
        function onColumnCleared
        function onExecute
        function onTrackTime
        function onEvent "fallback"
    }

    EXPORT_FILE {
        string nome "vscode-kanban_coluna_indice_titulo.card.md"
        string conteudo "título, Meta, Description, Details"
    }

    WORKSPACE {
        string folder_name
        number folder_index
        string root_path
    }
```

---

## 2. Cardinalidades

| Relação | Cardinalidade | Confiança | Observação |
|---|---|---|---|
| Workspace → Board | 1 : 1 | 🟢 | Um quadro por pasta, em caminho fixo |
| Board → Card | 1 : N | 🟢 | Distribuídos em quatro arrays; um cartão pertence a exatamente uma coluna |
| Card → CardContent | 1 : 0..2 | 🟢 | `description` e `details`, ambos opcionais |
| Card → AssignedTo | 1 : 0..1 | 🟢 | Objeto com um único campo |
| Card → Tag | 1 : 0..1 | 🟢 | Campo `any` |
| Tag → TimeTracking | 1 : 0..1 | 🟢 | Chave `time-tracking` |
| TimeTracking → TimeEntry | 1 : N | 🟢 | Array de carimbos; paridade indica se corre |
| **Card ↔ Card** | N : M | 🔴 | Via `references`; **sem integridade referencial** |
| BoardSettings → ColumnSettings | 1 : 4 | 🟢 | Fixo |
| Config → TrackTime | 1 : 0..1 | 🟢 | Booleano ou objeto |
| Board → ExportFile | 1 : N | 🟢 | Derivado, regerado a cada gravação |

---

## 3. Identidade

| Conceito | Campo | Escopo | Estabilidade | Gerado por |
|---|---|---|---|---|
| Identidade persistente do cartão | `id` | Quadro | Estável entre sessões | `boards.ts:1411-1437`, na carga |
| Identidade de sessão | `__uid` | Sessão do Webview | **Regenerada a cada carga** | `board.js:2013` |
| Vínculo entre cartões | `references[]` | Quadro | Aponta para `id` | Usuário, pela interface |

🔴 **Sem chave primária declarada.** `title` é o único campo obrigatório, mas não é único.
`id` é a chave lógica de fato, e é atribuída **na carga**, não na criação — um cartão inserido
à mão no JSON só ganha `id` quando o quadro é aberto.

🔴 **`references` não tem integridade.** Nada impede referência a `id` inexistente; a exclusão
de um cartão não limpa as referências dos demais (`board.js:1052` só remove o cartão). A
interface simplesmente não exibe o vínculo quebrado.

---

## 4. Invariantes do modelo 🟢

| # | Invariante | Onde é garantida |
|---|---|---|
| I1 | O quadro tem exatamente as quatro chaves de coluna | `newBoard()` e `asArray` na carga |
| I2 | Toda coluna é um array, mesmo se ausente ou de outro tipo no arquivo | `boards.ts:1408` |
| I3 | Todo cartão tem `id` após a carga | `boards.ts:1411-1437` |
| I4 | `mime` é `text/markdown` ou `text/plain`, nunca outro | `boards.ts:1374-1383` |
| I5 | Conteúdo vazio faz o campo desaparecer | `boards.ts:1368-1370` |
| I6 | `seconds` é sempre a soma dos pares de `entries` | `workspaces.ts:915-937` |
| I7 | Um cartão está em exatamente uma coluna | Estrutura do objeto |

### Invariantes que **não** existem 🔴

| Ausência | Risco |
|---|---|
| `id` único dentro do quadro | Dois cartões podem ter o mesmo `id` após edição manual |
| `references` apontando para `id` existente | Vínculos órfãos silenciosos |
| `type` restrito a um conjunto | Qualquer string é aceita e tratada como genérica |
| `prio` numérico | String não numérica vira 0 na ordenação, sem aviso |
| `creation_time` em formato válido | Data inválida faz o cartão perder ordenação temporal e filtros de data |
| Esquema validado na carga | JSON estruturalmente errado quebra o `JSON.parse` |

---

## 5. Volumetria esperada 🟡

| Entidade | Ordem de grandeza típica | Limite prático |
|---|---|---|
| Quadros por usuário | 1 por projeto aberto | — |
| Cartões por quadro | dezenas | 🟡 Sem limite declarado; o quadro inteiro é serializado a cada operação |
| Carimbos de tempo por cartão | dezenas a centenas | 🟡 Recálculo O(n) a cada acionamento |
| Arquivos exportados | 1 por cartão | 🟡 Apagados e regerados a cada gravação |

O ponto de degradação previsível é o **payload de eventos**: cada evento carrega `others` com
todos os demais cartões (`board.js:1473`), de modo que o custo por interação cresce
linearmente com o tamanho do quadro. Em quadros de dezenas de cartões, irrelevante; em
centenas, perceptível.

---

## 6. Migração de esquema 🔴

**Não existe versionamento do arquivo do quadro.** Nenhum campo `version` ou `schemaVersion`,
nenhuma rotina de migração. A compatibilidade é mantida por **tolerância na carga**: campos
ausentes viram padrões, tipos errados são coagidos, colunas extras são descartadas.

Funcionou por quatro anos porque o modelo não mudou de forma incompatível — a única mudança
de comportamento relevante, o `simpleIDs` de 2018, foi introduzida como configuração e não
alterou arquivos existentes.

Qualquer evolução que altere o modelo deveria começar por introduzir esse campo de versão.
