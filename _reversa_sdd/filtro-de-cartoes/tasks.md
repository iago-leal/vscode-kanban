# Filtro de Cartões — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Biblioteca de compilação de expressão disponível (o legado usa Filtrex vendorizado)
- [ ] Unit `colunas-e-movimentacao` disponível (a filtragem ocorre na renderização)
- [ ] Unit `persistencia-do-quadro` disponível (arquivo irmão `.filter`)

## Tarefas

- [ ] T-01, Implementar o modal de filtro com campo de expressão, exemplo como *placeholder* e
      botão "Apply"
  - Origem no legado: `boards.ts:861-894`
  - Critério de pronto: o modal abre com a expressão em vigor preenchida
  - Confiança: 🟢

- [ ] T-02, Implementar a avaliação da expressão com ambiente de funções e valores injetáveis
  - Origem no legado: `script.js:58-218`
  - Critério de pronto: `prio > 3` filtra corretamente
  - Confiança: 🟢

- [ ] T-03, Garantir que expressão vazia devolva verdadeiro sem compilar
  - Origem no legado: `script.js:206-208`
  - Critério de pronto: campo vazio mostra todos os cartões
  - Confiança: 🟢

- [ ] T-04, Garantir que erro de compilação ou execução registre log e devolva verdadeiro
  - Origem no legado: `script.js:213-217`
  - Critério de pronto: expressão inválida mostra tudo e deixa rastro no log
  - Confiança: 🟢

- [ ] T-05, Implementar as 18 funções genéricas do ambiente
  - Origem no legado: `script.js:63-192`
  - Critério de pronto: cada função tem teste de contrato
  - Confiança: 🟢
  - 🟢 Corrigir, ao reimplementar, a variável global implícita de `script.js:163`

- [ ] T-06, Implementar as 7 funções por cartão (datas, categoria, responsável)
  - Origem no legado: `board.js:838-896`
  - Critério de pronto: `is_older(7)` e `is_assigned_to('nome')` funcionam
  - Confiança: 🟢

- [ ] T-07, Montar os 24 valores por cartão, incluindo os apelidos redundantes e os predicados
      de tipo
  - Origem no legado: `board.js:898-926`
  - Critério de pronto: `is_bug` cobre `bug` e `issue`; `is_note` cobre vazio, `note` e `task`
  - Confiança: 🟢

- [ ] T-08, Persistir a expressão em `.vscode/vscode-kanban.filter` ao aplicar
  - Origem no legado: `board.js:2147-2148`, `workspaces.ts:564-573`
  - Critério de pronto: o arquivo é criado com o texto da expressão
  - Confiança: 🟢

- [ ] T-09, Restaurar o filtro salvo na abertura, tolerando arquivo ausente
  - Origem no legado: `workspaces.ts:502-512`
  - Critério de pronto: o quadro abre já filtrado; sem arquivo, abre sem filtro
  - Confiança: 🟢

- [ ] T-10, Compilar a expressão **uma vez por renderização** e reutilizar a função para todos
      os cartões
  - Origem no legado: `board.js:836` (o legado compila por cartão — otimizar)
  - Critério de pronto: comportamento idêntico com uma única compilação por ciclo
  - Confiança: 🟡 — melhoria proposta

- [ ] T-11, Sinalizar visualmente ao usuário quando a expressão for inválida, sem esconder
      cartões
  - Origem no legado: **ausente** — o legado apenas loga
  - Critério de pronto: erro de sintaxe produz indicação visível no modal
  - Confiança: 🟡 — melhoria proposta

- [ ] T-12, Documentar a linguagem de filtro junto da spec, com a lista completa de valores e
      funções
  - Origem no legado: link externo para o README no GitHub (`boards.ts:880`)
  - Critério de pronto: a referência está no repositório, não só numa URL externa
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Expressão vazia mostra todos os cartões
- [ ] TT-02, Expressão inválida mostra todos os cartões e registra log
- [ ] TT-03, `is_bug` aprova tipos `bug` e `issue` e reprova os demais
- [ ] TT-04, `is_note` aprova vazio, `note` e `task`
- [ ] TT-05, `prio > 3` filtra por prioridade, tratando ausência como zero
- [ ] TT-06, `is_older` e `is_younger` comparam em dias truncados
- [ ] TT-07, Cartão sem `creation_time` reprova em todas as funções de data
- [ ] TT-08, `is_assigned_to` compara de forma normalizada
- [ ] TT-09, Filtro persiste e é restaurado entre sessões
- [ ] TT-10, Filtragem não altera, move nem exclui cartão algum

## Tarefas de Migração de Dados

- [ ] TM-01, Filtros salvos por usuários seguem válidos: qualquer mudança no ambiente de
      valores ou funções deve preservar os nomes existentes
  - Origem no legado: `spec-impact-matrix.md` §2
  - Critério de pronto: um `.filter` de 2018 continua avaliando igual

## Ordem Sugerida

1. T-02 primeiro, com T-03 e T-04 juntas: o comportamento de falha define a semântica.
2. T-05 e T-07 em seguida — funções puras, testáveis isoladamente e sem depender da interface.
3. T-06 depois, por depender de biblioteca de datas.
4. T-08 e T-09 fecham o ciclo de persistência.
5. T-01 pode vir a qualquer momento; é a camada mais fina.
6. T-10 e T-11 são melhorias; T-12 é documentação e pode ser feita em paralelo.

## Lacunas Pendentes 🔴

- Versão do Filtrex vendorizado desconhecida: impede avaliar correções de segurança já
  publicadas pela biblioteca.
- Comportamento desejado diante de expressão inválida (silêncio × sinalização) — T-11 propõe
  mudança, mas a decisão é do mantenedor.
