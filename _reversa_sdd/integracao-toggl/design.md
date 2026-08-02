# Integração Toggl — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `trackTime` | `(args: TrackTimeEventArguments, settings: TimeTrackingByToggleSettings)` | `Promise<void>` | `this` é o `Workspace` |

### Contrato de configuração 🟢

```json
{
  "kanban": {
    "trackTime": {
      "type": "toggl",
      "token": "<token literal ou caminho de arquivo>",
      "project": 123456
    }
  }
}
```

`type` aceita as duas grafias, `toggl` e `toggle` — o código as trata como equivalentes
(`workspaces.ts:734-735`), provável concessão a um erro de digitação comum 🟡.

### Endpoints consumidos 🟢

| Método | Caminho | Uso | Tratamento |
|---|---|---|---|
| GET | `/api/v8/projects/{id}` | Projeto configurado | 200 usa; 404 avisa e encerra |
| GET | `/api/v8/workspaces` | Lista workspaces | ≠ 200 lança |
| GET | `/api/v8/workspaces/{id}/projects` | Projetos do workspace | ≠ 200 lança |
| GET | `/api/v8/time_entries/current` | Entrada corrente | ≠ 200 lança |
| POST | `/api/v8/time_entries/start` | Inicia entrada | ≠ 200 lança |
| PUT | `/api/v8/time_entries/{id}/stop` | Para entrada | ≠ 200 lança |

Base: `https://www.toggl.com`. Autenticação: `Authorization: Basic base64(<token>:api_token)`.

### Corpo do início 🟢

```json
{
  "time_entry": {
    "description": "<título do cartão>",
    "tags": ["<coluna>", "<pasta>", "vscode"],
    "pid": 123456,
    "created_with": "vscode-kanban"
  }
}
```

As tags passam por normalização, remoção de vazias, deduplicação e ordenação alfabética
(`toggl.ts:237-242`).

## Fluxo Principal

1. Resolve o token: se o valor apontar para arquivo existente (absoluto, ou relativo a `~`),
   lê o conteúdo; caso contrário, usa o literal (`toggl.ts:71-94`).
2. Token vazio lança `Error('No API token defined!')`.
3. Monta a autenticação Basic (`toggl.ts:100-102`).
4. Se `project` for numérico, consulta o projeto: 200 forma a lista com um item; 404 avisa e
   encerra (`toggl.ts:115-138`).
5. Lista vazia dispara a varredura: `GET /workspaces`, depois os projetos de cada workspace,
   sob uma notificação de progresso (`toggl.ts:140-193`).
6. Monta o quick pick ordenado por projeto e workspace (`toggl.ts:195-310`).
7. Lista vazia avisa "No Toggl project found!"; um único item é escolhido automaticamente;
   vários abrem o seletor (`toggl.ts:312-328`).
8. Na ação do item escolhido, consulta a entrada corrente (`toggl.ts:198-214`).
9. Decide: entrada de outro projeto bloqueia; entrada do mesmo projeto para; ausência inicia
   (`toggl.ts:216-290`).

## Fluxos Alternativos

- **Arquivo de token inexistente:** o valor é usado como token literal — o `try/catch` de
  `toggl.ts:87` engole a verificação 🟢.
- **Falha HTTP em qualquer chamada:** `THROW_HTTP_ERROR` monta mensagem com código e status; o
  erro sobe até `showError` 🟢.
- **Nenhum projeto encontrado:** aviso e encerramento 🟢.
- **Usuário cancela o quick pick:** nada acontece 🟢.
- **Parada bem-sucedida:** mensagem com o botão "Open Toggl ...", que abre o cronômetro no
  navegador 🟢.

## Dependências

- `time-tracking` — origem do despacho
- `extension` — `open` (abertura do navegador), `showError`, `ActionQuickPickItem`
- `vscode-helpers` — `GET`, `POST`, `PUT`, `from` (LINQ), `compareValuesBy`
- `fs-extra` — leitura do arquivo de token
- API Toggl v8 — serviço externo

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| Token aceito como valor ou caminho de arquivo, para não versionar segredo | `toggl.ts:76-92` | 🟢 |
| Caminho relativo resolvido a partir do home, não do workspace | `toggl.ts:77-81` | 🟢 |
| `project` configurado como atalho que evita a varredura | `toggl.ts:115-138` | 🟢 |
| Bloqueio explícito quando há entrada de outro projeto | `toggl.ts:217-224` | 🟢 |
| Tags derivadas do contexto (pasta e coluna), não configuráveis | `toggl.ts:229-232` | 🟢 |
| Aceitação das duas grafias, `toggl` e `toggle` | `workspaces.ts:734-735` | 🟡 |
| Nenhum vínculo persistido entre cartão e entrada de tempo | ausência de código | 🟢 |

## Estado Interno

Nenhum 🟢. Todo o estado relevante vive no serviço remoto. A cada acionamento, a decisão é
tomada a partir da consulta à entrada corrente — desenho sem estado local, portanto sem risco
de dessincronização.

## Observabilidade

- 🟢 Erros HTTP produzem mensagem com código e status, que chegam ao log por `showError`
- 🟢 A varredura exibe progresso nomeando o workspace em processamento
- 🔴 Sucessos não são registrados: não há como auditar quais entradas foram criadas

## Riscos e Lacunas

- 🟡 **API v8 descontinuada** (Q4): a v9 vive em `api.track.toggl.com` e mudou autenticação e
  formato de resposta. É plausível que a integração esteja inteiramente quebrada hoje; não foi
  possível verificar sem credencial
- 🟢 **Token em texto puro** no `settings.json` quando não se usa a forma de arquivo, num
  arquivo que costuma ser versionado
- 🟢 `SecretStorage` do VS Code, disponível desde 2021 e feito exatamente para este caso, não é
  utilizado
- 🟢 Nenhuma política de repetição: falha momentânea de rede aborta a operação
- 🟡 O vínculo cartão ↔ entrada depende do título; renomear o cartão rompe a associação
- 🟢 `ME.folder.name` e `Path.basename(ME.folder.name)` geram a mesma tag; a duplicata é
  eliminada pela deduplicação
