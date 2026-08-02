# Colunas e Movimentação — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Unit `persistencia-do-quadro` disponível
- [ ] Unit `configuracao-do-workspace` disponível (nomes de coluna)
- [ ] Unit `gestao-de-cartoes` disponível (cartões a mover)

## Tarefas

- [ ] T-01, Definir a constante das quatro colunas na ordem `todo`, `in-progress`, `testing`,
      `done`
  - Origem no legado: `boards.ts:388-393`
  - Critério de pronto: a ordem é usada consistentemente na renderização e na exportação
  - Confiança: 🟢
  - 🟢 Observação: no legado a constante se chama `BOARD_COLMNS`, com erro de digitação;
    corrigir o nome não altera comportamento

- [ ] T-02, Resolver o nome de exibição de cada coluna a partir da configuração, com queda para
      o padrão quando vazio ou só espaços
  - Origem no legado: `board.js:486-508`, `boards.ts:427-447`
  - Critério de pronto: nome customizado aparece; nome vazio cai no padrão
  - Confiança: 🟢

- [ ] T-03, Renderizar as quatro colunas com suas cores de cabeçalho e o botão "+"
  - Origem no legado: `boards.ts:452-522`
  - Critério de pronto: as quatro colunas aparecem com identidade visual distinta
  - Confiança: 🟢

- [ ] T-04, Implementar a função de peso de prioridade, tratando valor não numérico como zero
  - Origem no legado: `board.js:440-450`
  - Critério de pronto: `prio` ausente, vazio ou textual resulta em zero
  - Confiança: 🟢

- [ ] T-05, Implementar a função de peso de tipo: `emergency` = −2, `bug` = −1, demais = 0
  - Origem no legado: `board.js:452-462`
  - Critério de pronto: os três casos e o genérico devolvem os pesos corretos
  - Confiança: 🟢

- [ ] T-06, Implementar a ordenação encadeada (prioridade, tipo, título) **sobre uma cópia** do
      array, sem mutar o estado persistido
  - Origem no legado: `board.js:464-484` (o legado muta in place — corrigir)
  - Critério de pronto: a ordem exibida é a esperada e a ordem do arquivo não muda sozinha
  - Confiança: 🟢 no algoritmo · 🟡 na correção da mutação

- [ ] T-07, Implementar a movimentação por botão: remover da origem, inserir no destino,
      persistir, re-renderizar e disparar `card_moved`
  - Origem no legado: `board.js:1459-1477`
  - Critério de pronto: o cartão muda de coluna, persiste e o evento traz `from` e `to`
  - Confiança: 🟢

- [ ] T-08, Montar o rodapé do cartão com um botão por coluna de destino, exceto a atual
  - Origem no legado: `board.js:1479-1583`
  - Critério de pronto: cartão em Todo mostra três botões de destino
  - Confiança: 🟢

- [ ] T-09, Implementar o comando `moveCardTo` vindo da extensão, resolvendo o cartão pelo
      identificador de sessão e ignorando identificador inexistente
  - Origem no legado: `board.js:1933-2005`
  - Critério de pronto: `moveToDone()` de um script move o cartão; identificador inválido não
    causa efeito nem erro
  - Confiança: 🟢

- [ ] T-10, Implementar a limpeza em massa da coluna Done, com modal de confirmação e evento
      `column_cleared` contendo os cartões removidos
  - Origem no legado: `boards.ts:801-827`, `board.js:1660-1700`
  - Critério de pronto: após confirmar, Done fica vazia e o evento traz a lista
  - Confiança: 🟢

- [ ] T-11, Avaliar a introdução de limite de trabalho em progresso por coluna
  - Origem no legado: **ausente** — lacuna L1 de `domain.md`
  - Critério de pronto: decisão registrada; se aceita, o limite bloqueia ou avisa na
    movimentação
  - Confiança: 🔴 — funcionalidade nova, não presente no legado

- [ ] T-12, Avaliar o registro de histórico de transições por cartão
  - Origem no legado: **ausente** — `state-machines.md` §1
  - Critério de pronto: decisão registrada; se aceita, o modelo ganha o campo correspondente
  - Confiança: 🔴 — exige mudança de modelo de dados

## Tarefas de Teste

- [ ] TT-01, Ordenação por prioridade decrescente
- [ ] TT-02, Desempate por tipo com prioridades iguais
- [ ] TT-03, Desempate por título com prioridade e tipo iguais
- [ ] TT-04, Prioridade não numérica é tratada como zero
- [ ] TT-05, Ordenação não altera a ordem do array de origem (regressão da correção do T-06)
- [ ] TT-06, Movimentação persiste e dispara evento com origem e destino corretos
- [ ] TT-07, `moveCardTo` com identificador inexistente não altera o quadro
- [ ] TT-08, Limpeza de Done esvazia a coluna e reporta os cartões removidos
- [ ] TT-09, Nome de coluna vazio cai no padrão

## Tarefas de Migração de Dados

Não se aplica, salvo se T-12 for aceita — nesse caso, cartões existentes ficam sem histórico e
o modelo precisa tolerar a ausência do campo.

## Ordem Sugerida

1. T-01 a T-03 estabelecem a estrutura visual.
2. T-04 a T-06 são funções puras: **os melhores candidatos aos primeiros testes automatizados
   do projeto** (ver `spec-impact-matrix.md` §4).
3. T-07 e T-08 dependem da ordenação já estável.
4. T-09 exige o protocolo de mensagens e a unit de scripts.
5. T-10 é independente e pode entrar a qualquer momento.
6. T-11 e T-12 são decisões de produto, não de implementação.

## Lacunas Pendentes 🔴

- **T-11** — ausência de limite de WIP: o produto se chama Kanban mas não implementa o
  mecanismo central do método.
- **T-12** — ausência de histórico de transições, que inviabiliza qualquer métrica de fluxo.
- 🟡 Comportamento de `noTimeTrackingIfIdle` quando as colunas são renomeadas.
