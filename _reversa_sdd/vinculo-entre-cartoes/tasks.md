# Vínculo entre Cartões — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Unit `gestao-de-cartoes` disponível (modais de criação e edição)
- [ ] Unit `persistencia-do-quadro` disponível (campo `references`)
- [ ] **Decisão sobre a semântica do vínculo** (lacuna L2) — ver Lacunas Pendentes

## Tarefas

- [ ] T-01, Acrescentar a aba "References" aos modais de criação e edição, com seletor e botão
      de vínculo
  - Origem no legado: `boards.ts:588-622`, `:737-771`
  - Critério de pronto: a aba aparece nos dois modais
  - Confiança: 🟢

- [ ] T-02, Popular o seletor com todos os cartões do quadro exceto o corrente
  - Origem no legado: `board.js:510-529`, `:1259-1383`
  - Critério de pronto: o próprio cartão nunca aparece na lista
  - Confiança: 🟢

- [ ] T-03, Acrescentar vínculo evitando duplicata pelo mesmo `id`
  - Origem no legado: `board.js:17-33`
  - Critério de pronto: vincular duas vezes o mesmo cartão produz uma única entrada
  - Confiança: 🟢

- [ ] T-04, Exibir a lista de cartões vinculados com seus títulos resolvidos
  - Origem no legado: `board.js:1259-1383`, `:258-273`
  - Critério de pronto: os títulos aparecem, não os identificadores
  - Confiança: 🟢

- [ ] T-05, Permitir remover um vínculo da lista
  - Origem no legado: `board.js:1259-1383`
  - Critério de pronto: o `id` sai do array e do JSON após salvar
  - Confiança: 🟢

- [ ] T-06, Persistir os vínculos no campo `references` do cartão
  - Origem no legado: `boards.ts:91`
  - Critério de pronto: os vínculos sobrevivem à recarga
  - Confiança: 🟢

- [ ] T-07, Permitir abrir o detalhe de um cartão vinculado a partir da lista
  - Origem no legado: `board.js:1259-1383`
  - Critério de pronto: clicar no vinculado abre seu modal de detalhes
  - Confiança: 🟢

- [ ] T-08, Implementar a busca reversa (quais cartões referenciam este)
  - Origem no legado: `board.js:286-312`
  - Critério de pronto: a função devolve todos os cartões que apontam para o informado
  - Confiança: 🟢

- [ ] T-09, Sinalizar vínculos órfãos em vez de omiti-los silenciosamente
  - Origem no legado: **ausente** — o legado apenas não exibe
  - Critério de pronto: vínculo para `id` inexistente aparece marcado como quebrado
  - Confiança: 🟡 — melhoria proposta

- [ ] T-10, Definir e implementar o comportamento na exclusão de um cartão referenciado
  - Origem no legado: **ausente** — lacuna L2
  - Critério de pronto: comportamento documentado e consistente (limpar, avisar ou preservar)
  - Confiança: 🔴 — depende da decisão de semântica

## Tarefas de Teste

- [ ] TT-01, Seletor não inclui o próprio cartão
- [ ] TT-02, Vincular duas vezes o mesmo cartão não duplica a entrada
- [ ] TT-03, Vínculos persistem entre sessões
- [ ] TT-04, Remover vínculo o retira do JSON
- [ ] TT-05, Busca reversa encontra todos os cartões que referenciam o alvo
- [ ] TT-06, Vínculo para `id` inexistente é tratado conforme a decisão de T-09 e T-10

## Tarefas de Migração de Dados

Não se aplica: `references` já existe no formato desde a versão 1.14.0.

## Ordem Sugerida

1. **T-10 antes de tudo**, porque a decisão de semântica determina o resto. Sem ela, T-09 e a
   validação de integridade ficam sem critério.
2. T-01 a T-04 formam o caminho feliz.
3. T-05 e T-07 completam a experiência.
4. T-06 é consequência direta de T-03 e T-05.
5. T-08 pode ser feita a qualquer momento; é função pura e testável.
6. T-09 depois de T-10.

## Lacunas Pendentes 🔴

- **Semântica de `references` (L2)** — bloqueante para T-09 e T-10. As três leituras possíveis
  levam a comportamentos diferentes:
  - *dependência*: excluir o referenciado deveria avisar ou bloquear;
  - *subtarefa*: excluir o pai deveria propagar ou reparentar;
  - *veja também*: a referência órfã é tolerável, bastando sinalizá-la.
- Ausência de detecção de ciclo: nenhuma tarefa a cobre, por depender da mesma decisão.
