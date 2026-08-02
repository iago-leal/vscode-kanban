# Integração Toggl

> Unit da extração Reversa · 2026-08-02
> ⚠️ A API v8 usada em todo o módulo foi descontinuada pelo fornecedor (Q4 de `questions.md`).

## Visão Geral

Modo de rastreamento de tempo que delega o cronômetro ao serviço Toggl, iniciando e parando
entradas de tempo remotas a partir de um cartão do quadro.

## Responsabilidades

- Resolver o token de API, aceitando valor literal ou caminho de arquivo
- Descobrir os projetos Toggl disponíveis
- Consultar a entrada de tempo corrente
- Iniciar uma entrada nova ou parar a existente
- Informar o usuário do resultado e oferecer atalho para o Toggl

## Regras de Negócio

- `token` aceita o token literal **ou** o caminho de um arquivo que o contenha 🟢
- Caminho relativo é resolvido a partir do diretório home do usuário 🟢
- Token vazio lança "No API token defined!" 🟢
- A autenticação é Basic, com `<token>:api_token` em base64 🟢
- Com `project` configurado e existente, a varredura de workspaces é pulada 🟢
- Projeto configurado inexistente (404) apenas avisa e encerra, sem varrer 🟢
- Uma entrada corrente de **outro** projeto bloqueia o início: o usuário deve pará-la antes 🟢
- Entrada corrente do mesmo projeto é parada; ausência de entrada inicia uma nova 🟢
- A descrição da entrada é o título do cartão 🟢
- As tags são `vscode`, o nome da pasta, o `basename` da pasta e a coluna do cartão —
  normalizadas, deduplicadas e ordenadas 🟢
- `created_with` é sempre `vscode-kanban` 🟢
- O quick pick ordena por nome do projeto e, em empate, por nome do workspace 🟢
- Um único projeto dispensa o quick pick 🟢
- O cartão **não** guarda referência à entrada Toggl: o vínculo é indireto, pelo título 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Resolver o token a partir de valor literal ou arquivo | Must | As duas formas autenticam |
| RF-02 | Falhar com mensagem clara quando não houver token | Must | Erro nomeado é exibido |
| RF-03 | Consultar a entrada de tempo corrente antes de agir | Must | A decisão de iniciar ou parar é correta |
| RF-04 | Iniciar entrada com descrição, tags, projeto e origem | Must | A entrada aparece no Toggl com os dados certos |
| RF-05 | Parar a entrada corrente do mesmo projeto | Must | A entrada é encerrada no serviço |
| RF-06 | Recusar o início quando houver entrada de outro projeto | Must | Aviso pede a parada manual |
| RF-07 | Descobrir projetos por workspace quando `project` não estiver configurado | Should | O quick pick lista os projetos |
| RF-08 | Exibir progresso durante a varredura de workspaces | Should | A notificação informa o andamento |
| RF-09 | Oferecer atalho para abrir o Toggl após parar | Could | O botão abre o cronômetro no navegador |
| RF-10 | Migrar para a API v9 | Could | 🔴 Ausente — a v8 está descontinuada |
| RF-11 | Guardar o identificador da entrada no cartão | Won't | 🟢 O legado não persiste vínculo |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Segurança | Token em texto puro no `settings.json` quando não se usa a forma de arquivo | `toggl.ts:71` | 🟢 |
| Segurança | A forma de arquivo permite manter o token fora do repositório | `toggl.ts:76-92` | 🟢 |
| Segurança | `SecretStorage` do VS Code não é utilizado | ausência de código | 🟢 |
| Disponibilidade | Nenhuma política de repetição em falha de rede | ausência de código | 🟢 |
| Disponibilidade | Código HTTP diferente de 200 lança erro com código e status | `toggl.ts:104-111` | 🟢 |
| Manutenibilidade | Toda a integração aponta para a API v8, descontinuada | `toggl.ts:117-270` | 🟡 |

## Critérios de Aceitação

```gherkin
Dado a configuração trackTime com type toggl e um token válido
E nenhuma entrada de tempo corrente no Toggl
Quando o usuário aciona o botão de tempo num cartão
Então uma entrada é criada com a descrição igual ao título do cartão
E as tags incluem "vscode" e o nome da coluna

Dado uma entrada de tempo corrente do mesmo projeto
Quando o usuário aciona o botão
Então a entrada é encerrada
E é oferecido um atalho para abrir o Toggl

Dado uma entrada corrente pertencente a outro projeto
Quando o usuário aciona o botão
Então exibe-se aviso pedindo que a entrada seja parada primeiro
E nenhuma entrada nova é criada

Dado um token configurado como caminho relativo de arquivo existente
Quando a integração é acionada
Então o token é lido do arquivo relativo ao diretório home

Dado nenhum token configurado
Quando a integração é acionada
Então lança-se o erro "No API token defined!"

Dado um project configurado que não existe no Toggl
Quando a integração é acionada
Então exibe-se aviso de projeto não encontrado
E a varredura de workspaces não ocorre
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Resolução do token | Must | Sem ele nada funciona |
| Iniciar e parar entrada | Must | Razão de ser da unit |
| Bloqueio por entrada de outro projeto | Must | Evita registro de tempo no projeto errado |
| Descoberta de projetos | Should | Alternativa: configurar `project` |
| Indicador de progresso | Should | A varredura pode demorar |
| Atalho para o Toggl | Could | Conveniência |
| Migração para a v9 | Could | Depende de a integração ainda ser usada (Q4) |
| Persistir vínculo com a entrada | Won't | Ausente por desenho |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/toggl.ts:68-98` | resolução do token | 🟢 |
| `src/toggl.ts:100-111` | autenticação e erro HTTP | 🟢 |
| `src/toggl.ts:113-193` | descoberta de projetos | 🟢 |
| `src/toggl.ts:195-291` | início e parada da entrada | 🟢 |
| `src/toggl.ts:297-332` | ordenação e seleção de projeto | 🟢 |
| `src/workspaces.ts:734-745` | delegação a partir do despacho de eventos | 🟢 |
| `src/toggl.ts:30-59` | interfaces do domínio Toggl | 🟢 |
