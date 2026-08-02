# Time Tracking — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Unit `configuracao-do-workspace` disponível (`trackTime`, `noTimeTrackingIfIdle`)
- [ ] Unit `scripts-de-evento-do-usuario` disponível (o despacho vive em `raiseEvent`)
- [ ] Unit `gestao-de-cartoes` disponível (campo `tag`)
- [ ] Biblioteca de manipulação de datas e de formatação de duração

## Tarefas

- [ ] T-01, Implementar a determinação de disponibilidade: verdadeiro quando `trackTime` não é
      nulo nem `false`
  - Origem no legado: `workspaces.ts:356-362`
  - Critério de pronto: os quatro casos (`false`, ausente, `true`, objeto) resolvem corretamente
  - Confiança: 🟢

- [ ] T-02, Implementar o despacho por modo: booleano, `script`, `toggl` e desconhecido
  - Origem no legado: `workspaces.ts:717-757`
  - Critério de pronto: cada modo aciona o handler correto
  - Confiança: 🟢

- [ ] T-03, Decidir e implementar o comportamento para `type` desconhecido
  - Origem no legado: `workspaces.ts:747-748` (silêncio total)
  - Critério de pronto: erro de digitação na configuração produz aviso ao usuário
  - Confiança: 🟡 — melhoria proposta sobre o legado

- [ ] T-04, Inicializar a estrutura de tempo no `tag` quando ausente
  - Origem no legado: `workspaces.ts:893-906`
  - Critério de pronto: primeiro acionamento cria `{seconds: 0, entries: []}`
  - Confiança: 🟢

- [ ] T-05, Acrescentar carimbo UTC em formato ISO a cada acionamento
  - Origem no legado: `workspaces.ts:910-913`
  - Critério de pronto: o array cresce em um a cada clique
  - Confiança: 🟢

- [ ] T-06, Implementar o cálculo do total como soma dos pares, recalculado do zero
  - Origem no legado: `workspaces.ts:915-937`
  - Critério de pronto: quatro carimbos produzem a soma de dois intervalos
  - Confiança: 🟢
  - 🟢 Esta é aritmética pura: **candidata a um dos primeiros testes do projeto**

- [ ] T-07, Validar os carimbos antes de somar, ignorando ou sinalizando os inválidos
  - Origem no legado: **ausente** — `NaN` contamina o total
  - Critério de pronto: carimbo inválido não corrompe o acumulado
  - Confiança: 🟡 — melhoria proposta

- [ ] T-08, Persistir o estado por meio do mecanismo de gravação de `tag`
  - Origem no legado: `workspaces.ts:939`
  - Critério de pronto: o tempo sobrevive à recarga do quadro
  - Confiança: 🟢

- [ ] T-09, Exibir mensagem de início ou de parada, esta com a duração humanizada
  - Origem no legado: `workspaces.ts:941-949`
  - Critério de pronto: as duas mensagens aparecem nos momentos corretos
  - Confiança: 🟢

- [ ] T-10, Exibir a mensagem **apenas** após confirmação de que a gravação ocorreu
  - Origem no legado: `workspaces.ts:939-949` (o legado ignora o retorno de `setTag`)
  - Critério de pronto: falha na gravação não produz mensagem de sucesso
  - Confiança: 🟡 — corrige inconsistência

- [ ] T-11, Renderizar o botão de tempo no rodapé do cartão quando disponível, ocultando-o em
      Todo e Done se configurado
  - Origem no legado: `board.js:1000-1019`, `workspaces.ts:583`
  - Critério de pronto: o botão aparece e desaparece conforme as duas chaves
  - Confiança: 🟢

- [ ] T-12, Proteger o histórico de tempo contra sobrescrita por scripts do usuário
  - Origem no legado: **ausente** — `tag` é compartilhado
  - Critério de pronto: substituir `tag` por script não apaga o histórico, ou o faz com aviso
  - Confiança: 🟡 — depende de decisão sobre o contrato de `tag`

- [ ] T-13, Exibir o tempo acumulado no próprio cartão, não só na mensagem momentânea
  - Origem no legado: **ausente**
  - Critério de pronto: o cartão mostra o total acumulado
  - Confiança: 🔴 — funcionalidade nova

## Tarefas de Teste

- [ ] TT-01, Disponibilidade resolve corretamente para os quatro formatos de `trackTime`
- [ ] TT-02, Primeiro acionamento cria a estrutura e registra um carimbo
- [ ] TT-03, Segundo acionamento fecha o intervalo e calcula o total
- [ ] TT-04, Quatro carimbos produzem a soma de dois intervalos
- [ ] TT-05, Número ímpar de carimbos indica cronômetro correndo e não soma o aberto
- [ ] TT-06, Corrigir o array à mão corrige o total no acionamento seguinte
- [ ] TT-07, Carimbo inválido não corrompe o total (após T-07)
- [ ] TT-08, `type` desconhecido produz aviso (após T-03)
- [ ] TT-09, Botão oculto em Todo e Done com a chave ligada

## Tarefas de Migração de Dados

Não se aplica: a estrutura em `tag['time-tracking']` permanece compatível.

## Ordem Sugerida

1. T-01 e T-02 estabelecem o despacho.
2. **T-04 a T-06 são o núcleo e devem vir cedo**, por serem puros e testáveis isoladamente.
3. T-08 fecha o ciclo de persistência.
4. T-09 e T-11 completam a experiência.
5. T-03, T-07 e T-10 são correções de robustez sobre o legado.
6. T-12 e T-13 dependem de decisões de contrato e de produto.

## Lacunas Pendentes 🔴

- **T-13** — não há visualização do tempo acumulado no cartão; o dado é gravado mas quase
  invisível.
- **T-12** — contrato de uso do campo `tag` entre a extensão e os scripts do usuário nunca foi
  definido.
- 🟡 Comportamento desejado diante de carimbos corrompidos por edição manual.
