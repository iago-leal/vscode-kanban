# Time Tracking

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Cronômetro por cartão, com três modos mutuamente exclusivos: interno (carimbos alternados no
próprio cartão), por script do usuário e por Toggl. Esta unit cobre a lógica comum e o modo
interno; o modo Toggl tem unit própria (`integracao-toggl`).

## Responsabilidades

- Decidir se o recurso está disponível para o workspace
- Exibir ou ocultar o botão de tempo no cartão
- Despachar o evento `track_time` para o modo configurado
- Implementar o modo interno de carimbos alternados
- Calcular e persistir o tempo acumulado no `tag` do cartão

## Regras de Negócio

- `canTrackTime` é verdadeiro sempre que `trackTime` não for nulo nem `false` 🟢
- Com `trackTime: true`, usa-se o modo interno 🟢
- Com `trackTime.type` igual a `''` ou `script`, o handler é o `onTrackTime` do usuário e
  `options` é repassado 🟢
- Com `trackTime.type` igual a `toggl` ou `toggle`, delega-se à unit `integracao-toggl` 🟢
- Qualquer outro `type` **desliga o recurso silenciosamente**, sem aviso 🟢
- Com `noTimeTrackingIfIdle`, o botão some nas colunas Todo e Done 🟢
- No modo interno, cada acionamento acrescenta um instante UTC ao array `entries` 🟢
- O total `seconds` é a soma dos pares (início, fim), recalculado do zero a cada acionamento 🟢
- Número ímpar de carimbos significa cronômetro correndo; o intervalo aberto não entra no total 🟢
- A mensagem exibida diferencia início e parada, e a parada mostra a duração humanizada 🟢
- O estado vive em `tag['time-tracking']`, campo livre que scripts também escrevem 🟡

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Determinar a disponibilidade do recurso a partir da configuração | Must | `trackTime: false` não exibe botão |
| RF-02 | Exibir o botão de tempo nos cartões quando disponível | Must | O botão aparece no rodapé do cartão |
| RF-03 | Alternar início e parada a cada acionamento | Must | Dois acionamentos fecham um intervalo |
| RF-04 | Acumular o total em segundos no cartão | Must | O campo `seconds` reflete a soma dos pares |
| RF-05 | Persistir o estado do cronômetro no cartão | Must | O tempo sobrevive à recarga |
| RF-06 | Ocultar o botão em Todo e Done quando configurado | Should | Com a chave ligada, só In Progress e Testing exibem |
| RF-07 | Delegar ao script do usuário no modo `script` | Should | `onTrackTime` é chamado com `options` |
| RF-08 | Delegar ao Toggl no modo correspondente | Should | Ver unit `integracao-toggl` |
| RF-09 | Exibir mensagem distinta para início e parada, com duração | Should | A parada informa a duração acumulada |
| RF-10 | Avisar quando o `type` for desconhecido | Could | 🟢 O legado silencia |
| RF-11 | Exibir tempo em andamento antes da parada | Won't | 🟢 O total só contabiliza pares fechados |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Integridade | O total é recalculado do zero, tornando o array a fonte de verdade | `workspaces.ts:915-937` | 🟢 |
| Robustez | Ausência de validação dos carimbos existentes antes de somar | `workspaces.ts:917-934` | 🟢 |
| Desempenho | Recálculo O(n) sobre os carimbos a cada acionamento | `workspaces.ts:917` | 🟢 |
| Interoperabilidade | O estado convive com dados livres de scripts no mesmo `tag` | `workspaces.ts:893-906` | 🟡 |

## Critérios de Aceitação

```gherkin
Dado a configuração kanban.trackTime igual a true
Quando o quadro é aberto
Então o botão de tempo aparece nos cartões

Dado um cartão sem registro de tempo
Quando o usuário aciona o botão pela primeira vez
Então um carimbo UTC é acrescentado
E a mensagem informa que o rastreamento começou

Dado um cartão com um carimbo aberto
Quando o usuário aciona o botão novamente
Então um segundo carimbo é acrescentado
E o total em segundos passa a refletir a diferença entre os dois
E a mensagem informa a parada com a duração humanizada

Dado um cartão com quatro carimbos fechados
Quando o total é recalculado
Então seconds é a soma dos dois intervalos

Dado a configuração noTimeTrackingIfIdle ligada
Quando o quadro é renderizado
Então cartões em Todo e Done não exibem o botão de tempo

Dado a configuração trackTime com type "desconhecido"
Quando o usuário aciona o botão
Então nada acontece e nenhum aviso é exibido
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Alternância e acúmulo | Must | Núcleo da funcionalidade |
| Persistência no cartão | Must | Sem ela o tempo se perde |
| Disponibilidade por configuração | Must | Recurso desligado por padrão |
| Ocultação em colunas ociosas | Should | Refinamento da versão 1.10.0 |
| Delegação a script e a Toggl | Should | Extensibilidade, com alternativa (modo interno) |
| Mensagens distintas | Should | Único retorno visual do estado |
| Aviso de `type` inválido | Could | Falha silenciosa é confusa |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/workspaces.ts:356-362` | `Workspace.canTrackTime` | 🟢 |
| `src/workspaces.ts:717-757` | despacho por modo dentro de `raiseEvent` | 🟢 |
| `src/workspaces.ts:892-950` | `Workspace.trackTime` (modo interno) | 🟢 |
| `src/workspaces.ts:583` | `hideTimeTrackingIfIdle` | 🟢 |
| `src/res/js/board.js:1000-1019` | botão e evento `track_time` | 🟢 |
| `src/boards.ts:136`, `:161` | campos `canTrackTime` e `hideTimeTrackingIfIdle` | 🟢 |
