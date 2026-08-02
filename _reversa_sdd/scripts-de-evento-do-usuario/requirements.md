# Scripts de Evento do Usuário

> Unit da extração Reversa · 2026-08-02
> ⚠️ Unit com a maior exposição de segurança do sistema (ADR-004, Q1 de `questions.md`).

## Visão Geral

Mecanismo de extensibilidade que carrega e executa `.vscode/vscode-kanban.js` do workspace,
entregando-lhe eventos do quadro e uma API para reagir: mover cartões, gravar dados e acessar
o contexto da extensão.

## Responsabilidades

- Despachar sete eventos do quadro para o script do usuário
- Carregar o módulo do workspace quando existir
- Escolher a função pelo nome do evento, com fallback genérico
- Montar os argumentos entregues ao script
- Expor os métodos de mutação (`setTag`, `moveTo*`)
- Manter estado por workspace e por sessão

## Regras de Negócio

- O script é carregado de `<workspace>/.vscode/vscode-kanban.js` 🟢
- A ausência do arquivo simplesmente encerra o despacho, sem erro 🟢
- Sete eventos são despachados: `card_created`, `card_deleted`, `card_moved`, `card_updated`,
  `column_cleared`, `execute_card`, `track_time` 🟢
- Sem a função específica do evento, tenta-se `onEvent` como fallback 🟢
- `column_cleared` é o único evento sem `tag` e sem `uid` nos argumentos 🟢
- O botão de execução no cartão só aparece com `canExecute` ligado 🟢
- `args.setTag` e `args.moveTo*` aceitam o objeto do cartão **ou** seu identificador de sessão 🟢
- Cartão não encontrado nos métodos de mutação lança `Error('Card not found')` 🟢
- `globals` e `options` são entregues como **clones**, não como referências 🟢
- `state` vive enquanto a pasta estiver aberta; `session` atravessa workspaces 🟢
- A gravação do quadro **precede** o disparo do evento: o script não pode vetar a operação 🟢
- 🔴 O script recebe `require` irrestrito e o `ExtensionContext` completo, sem sandbox nem
  confirmação

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Carregar o módulo do workspace quando presente | Must | O script é executado ao ocorrer o evento |
| RF-02 | Despachar os sete eventos com a carga correta | Must | Cada handler recebe `data` conforme o catálogo |
| RF-03 | Cair no fallback `onEvent` quando faltar a função específica | Must | Script só com `onEvent` recebe todos os eventos |
| RF-04 | Entregar `setTag` funcional | Must | O dado gravado sobrevive à recarga |
| RF-05 | Entregar os quatro métodos de movimentação | Must | `moveToDone()` move o cartão |
| RF-06 | Entregar `globals` e `options` clonados | Should | Alterar o clone não afeta a configuração |
| RF-07 | Manter `state` por workspace e `session` por sessão | Should | Dados persistem entre eventos |
| RF-08 | Exibir botão de execução conforme `canExecute` | Should | Com a chave desligada, o botão não aparece |
| RF-09 | Exigir confirmação antes da primeira execução de um script | Could | 🔴 Ausente no legado |
| RF-10 | Declarar suporte a workspaces não confiáveis no manifesto | Could | 🔴 Ausente no legado |
| RF-11 | Restringir `require` a uma lista permitida | Won't | 🟢 O legado expõe `require` completo |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Segurança | Execução de código de terceiro com privilégios da extensão | `workspaces.ts:769` | 🟢 |
| Segurança | `ExtensionContext` completo entregue ao script | `workspaces.ts:620` | 🟢 |
| Segurança | `require` sem restrição | `workspaces.ts:629-633` | 🟢 |
| Segurança | Nenhuma declaração de `untrustedWorkspaces` no manifesto | `package.json` | 🟢 |
| Desempenho | Cada evento carrega cópia de todos os demais cartões | `board.js:1473` | 🟢 |
| Integridade | Sem transação entre gravação e evento | `board.js:1459-1477` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um workspace sem .vscode/vscode-kanban.js
Quando um cartão é movido
Então nenhum script é executado e nenhum erro ocorre

Dado um script que exporta onCardMoved
Quando um cartão é movido de Todo para Done
Então onCardMoved recebe data com card, from "todo", to "done" e others

Dado um script que exporta apenas onEvent
Quando qualquer um dos sete eventos ocorre
Então onEvent é chamado com o nome do evento em args.name

Dado um script que chama args.setTag({x: 1})
Quando o evento termina
Então o cartão passa a ter tag {x: 1} no arquivo do quadro

Dado um script que chama args.moveToDone()
Quando o evento card_created ocorre
Então o cartão recém-criado passa para a coluna Done

Dado um script que chama args.moveToDone("uid-inexistente")
Quando o evento ocorre
Então lança-se Error("Card not found")

Dado o evento column_cleared
Quando o handler é chamado
Então args.tag e args.uid não estão definidos
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Carga e despacho | Must | Núcleo da extensibilidade |
| Métodos de mutação | Must | Sem eles o script só observa |
| Fallback `onEvent` | Must | Padrão documentado no CHANGELOG 1.3.0 |
| Clonagem de `globals` e `options` | Should | Protege a configuração de mutação acidental |
| Estados `state` e `session` | Should | Permitem lógica com memória |
| Confirmação e workspace trust | Could | Ausentes; corrigem a exposição central |
| Restrição de `require` | Won't | Quebraria scripts existentes |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/workspaces.ts:600-886` | `Workspace.raiseEvent` | 🟢 |
| `src/workspaces.ts:759-808` | carga do módulo e escolha da função | 🟢 |
| `src/workspaces.ts:618-636` | montagem dos argumentos | 🟢 |
| `src/workspaces.ts:638-673` | `GET_UID` | 🟢 |
| `src/workspaces.ts:675-699` | `TRY_FIND_CARD` | 🟢 |
| `src/workspaces.ts:701-715` | `MOVE_TO` | 🟢 |
| `src/workspaces.ts:836-878` | `setTag` e os quatro `moveTo*` | 🟢 |
| `src/workspaces.ts:168-201` | interface `EventScriptModule` | 🟢 |
| `src/boards.ts:1199-1209` | comando `raiseEvent` vindo do Webview | 🟢 |
| `src/res/js/board.js:983`, `:1009`, `:1052`, `:1470`, `:1688`, `:1877` | pontos de disparo | 🟢 |
