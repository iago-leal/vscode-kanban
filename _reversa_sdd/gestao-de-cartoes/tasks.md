# Gestão de Cartões — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Unit `persistencia-do-quadro` disponível
- [ ] Unit `abertura-do-quadro` disponível (protocolo de mensagens)
- [ ] Unit `identificacao-de-usuario` disponível (pré-preenchimento do responsável)
- [ ] Editor de Markdown disponível na camada de interface

## Tarefas

- [ ] T-01, Implementar o modal de criação com os campos título, tipo, prioridade, categoria,
      responsável, descrição, detalhes e vínculos
  - Origem no legado: `boards.ts:529-650`
  - Critério de pronto: todos os campos presentes e funcionais
  - Confiança: 🟢

- [ ] T-02, Popular o seletor de tipo com Bug / issue, Emergency e Note / task (vazio, padrão)
  - Origem no legado: `board.js:2093-2103`
  - Critério de pronto: três opções, com a terceira pré-selecionada
  - Confiança: 🟢
  - 🟡 Avaliar antes se `issue`, `note` e `task` devem entrar no seletor — ver lacuna L5 de
    `domain.md`

- [ ] T-03, Criar o cartão com `creation_time` em UTC e persistir
  - Origem no legado: `board.js:1834-1876`
  - Critério de pronto: o cartão aparece na coluna e no arquivo, com data válida
  - Confiança: 🟢

- [ ] T-04, Preservar prioridade, tipo e responsável entre criações sucessivas
  - Origem no legado: commits de 2018-05-29 ("no reset of prio field for new cards")
  - Critério de pronto: o segundo cartão nasce com os valores do primeiro
  - Confiança: 🟢

- [ ] T-05, Implementar o modal de edição preenchendo os campos com os valores atuais e
      preservando `id` e `creation_time` ao salvar
  - Origem no legado: `board.js:71-213`
  - Critério de pronto: editar não altera identidade nem data de criação
  - Confiança: 🟢

- [ ] T-06, Guardar cópia do cartão antes da edição e entregá-la como `oldCard` no evento
  - Origem no legado: `board.js:214-216`
  - Critério de pronto: o evento traz os dois estados
  - Confiança: 🟢

- [ ] T-07, Implementar a exclusão com modal de confirmação ("NO!" e "Yes")
  - Origem no legado: `boards.ts:652-676`, `board.js:1020-1100`
  - Critério de pronto: só "Yes" exclui; o cartão some do quadro e do arquivo
  - Confiança: 🟢

- [ ] T-08, Implementar o modal de detalhes em modo leitura, com Markdown e diagramas
      renderizados e botão para editar
  - Origem no legado: `boards.ts:829-859`, `board.js:587-729`
  - Critério de pronto: descrição e detalhes aparecem formatados
  - Confiança: 🟢

- [ ] T-09, Normalizar os valores de entrada: responsável vazio vira indefinido, prioridade
      vazia vira indefinida, descrição vazia remove o campo
  - Origem no legado: `board.js:340-351`, `:423-438`, `:531-546`
  - Critério de pronto: campos vazios não poluem o JSON
  - Confiança: 🟢

- [ ] T-10, Desabilitar o fechamento por ESC nos modais de criação e edição
  - Origem no legado: `boards.ts:529`, `:678` (issue #8)
  - Critério de pronto: ESC não fecha nem descarta o texto
  - Confiança: 🟢

- [ ] T-11, Disparar `card_created`, `card_updated` e `card_deleted` com `{card, column,
      others}` (mais `oldCard` na atualização), **após** a persistência
  - Origem no legado: `board.js:1877`, `:214`, `:1052`
  - Critério de pronto: o script do usuário recebe os três eventos com a carga correta
  - Confiança: 🟢

- [ ] T-12, Uniformizar o limite de caracteres da descrição entre criação e edição
  - Origem no legado: `boards.ts:746` (limite presente só na edição — assimetria)
  - Critério de pronto: os dois modais têm o mesmo comportamento
  - Confiança: 🟡 — corrige inconsistência do legado

- [ ] T-13, Limpar ou sinalizar referências órfãs ao excluir um cartão referenciado
  - Origem no legado: **ausente** — lacuna L2 de `domain.md`
  - Critério de pronto: comportamento definido e consistente
  - Confiança: 🔴 — depende de decisão sobre a semântica de `references`

## Tarefas de Teste

- [ ] TT-01, Criar cartão com título produz cartão persistido com `creation_time` válido
- [ ] TT-02, Criar cartão sem título não cria nada
- [ ] TT-03, Editar preserva `id` e `creation_time`
- [ ] TT-04, Evento de atualização traz `card` e `oldCard` distintos
- [ ] TT-05, Excluir com confirmação remove do quadro e do arquivo
- [ ] TT-06, Cancelar exclusão preserva o cartão
- [ ] TT-07, Campos vazios não aparecem no JSON gravado
- [ ] TT-08, Segunda criação preserva prioridade, tipo e responsável
- [ ] TT-09, Prioridade não numérica é tratada como zero na ordenação

## Tarefas de Migração de Dados

Não se aplica: a unit opera sobre o formato já definido em `persistencia-do-quadro`.

## Ordem Sugerida

1. T-01 a T-03 formam o caminho mínimo (criar e persistir).
2. T-09 logo em seguida, porque toda a normalização de entrada depende dela.
3. T-05 e T-06 (edição) antes de T-07 (exclusão), por reaproveitarem o mesmo modal.
4. T-11 depois que criação, edição e exclusão estiverem estáveis.
5. T-04, T-08 e T-10 são refinamentos de experiência e podem vir depois.
6. T-12 e T-13 dependem de decisões (assimetria e semântica de vínculo).

## Lacunas Pendentes 🔴

- **T-13** — semântica de `references` e comportamento na exclusão (lacuna L2).
- **T-02** — vocabulário de tipos divergente entre seletor, filtro e cores (lacuna L5).
- Ausência de desfazer: nenhuma tarefa a cobre porque nenhuma decisão foi tomada a respeito.
