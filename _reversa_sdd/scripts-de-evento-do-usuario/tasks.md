# Scripts de Evento do Usuário — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] **Decisão sobre Q1**: o mecanismo permanece como está, ganha confirmação, ou passa a
      depender do Workspace Trust
- [ ] Unit `abertura-do-quadro` disponível (protocolo de mensagens)
- [ ] Unit `gestao-de-cartoes` e `colunas-e-movimentacao` disponíveis (origem dos eventos)
- [ ] Unit `configuracao-do-workspace` disponível (`globals`, `canExecute`)

## Tarefas

- [ ] T-01, Declarar `capabilities.untrustedWorkspaces` no manifesto da extensão
  - Origem no legado: **ausente** no `package.json`
  - Critério de pronto: em pasta não confiável, o comportamento declarado é respeitado
  - Confiança: 🟡 — mitigação de menor custo para o risco central

- [ ] T-02, Exigir confirmação explícita do usuário antes da primeira execução de um script
      novo, memorizando a decisão por workspace
  - Origem no legado: **ausente** — o legado executa sem perguntar
  - Critério de pronto: script desconhecido não roda antes de autorização
  - Confiança: 🔴 — depende de Q1

- [ ] T-03, Carregar o módulo do workspace quando o arquivo existir, encerrando em silêncio
      quando não existir
  - Origem no legado: `workspaces.ts:759-769`
  - Critério de pronto: ausência do arquivo não gera erro
  - Confiança: 🟢

- [ ] T-04, Escolher a função pelo nome do evento, com fallback para o handler genérico
  - Origem no legado: `workspaces.ts:771-806`
  - Critério de pronto: script só com o handler genérico recebe todos os eventos
  - Confiança: 🟢

- [ ] T-05, Montar os argumentos base (dados, caminho do quadro, configuração global clonada,
      logger, nome do evento, estados)
  - Origem no legado: `workspaces.ts:618-636`
  - Critério de pronto: todos os campos do contrato estão presentes
  - Confiança: 🟢

- [ ] T-06, Revisar o que é exposto ao script: contexto da extensão e função de carga de módulos
  - Origem no legado: `workspaces.ts:620`, `:629-633`
  - Critério de pronto: decisão registrada sobre manter, restringir ou substituir por uma API
    estreita
  - Confiança: 🔴 — depende de Q1

- [ ] T-07, Definir `tag` e `uid` como acessores derivados do cartão do evento, ausentes no
      evento de limpeza de coluna
  - Origem no legado: `workspaces.ts:789-791`, `:815-833`
  - Critério de pronto: o evento de limpeza não expõe os dois campos
  - Confiança: 🟢

- [ ] T-08, Implementar a resolução de cartão que aceita objeto ou identificador, lançando erro
      nomeado quando não encontrar
  - Origem no legado: `workspaces.ts:638-673`
  - Critério de pronto: as três entradas (nulo, objeto, identificador) resolvem corretamente
  - Confiança: 🟢

- [ ] T-09, Implementar a gravação de dados no cartão, atualizando a cópia local apenas quando a
      operação for confirmada
  - Origem no legado: `workspaces.ts:836-859`
  - Critério de pronto: o dado sobrevive à recarga
  - Confiança: 🟢

- [ ] T-10, Implementar os quatro métodos de movimentação
  - Origem no legado: `workspaces.ts:701-715`, `:863-877`
  - Critério de pronto: cada método move para a coluna correspondente e persiste
  - Confiança: 🟢

- [ ] T-11, Manter dois níveis de estado: por workspace e por sessão do editor
  - Origem no legado: `workspaces.ts:634-635`
  - Critério de pronto: dados persistem entre eventos nos escopos corretos
  - Confiança: 🟢

- [ ] T-12, Registrar em log qual script foi carregado e qual função foi invocada
  - Origem no legado: **ausente** — execução silenciosa
  - Critério de pronto: cada invocação deixa rastro auditável
  - Confiança: 🟡 — alinhado ao princípio de erros barulhentos

- [ ] T-13, Decompor o despacho em unidades menores (resolução de handler, montagem de
      argumentos, métodos de mutação, invocação)
  - Origem no legado: `workspaces.ts:600-886` (~286 linhas, cinco responsabilidades)
  - Critério de pronto: nenhuma função acima de 50 linhas
  - Confiança: 🟢

- [ ] T-14, Recarregar o módulo quando o arquivo mudar, em vez de depender do cache do
      carregador
  - Origem no legado: comportamento implícito do `require`
  - Critério de pronto: alterar o script passa a valer sem recarregar a janela
  - Confiança: 🟡

- [ ] T-15, Avaliar reduzir a carga `others` enviada em cada evento
  - Origem no legado: `board.js:1473`
  - Critério de pronto: decisão registrada; se aceita, o script busca os demais cartões sob
    demanda em vez de recebê-los sempre
  - Confiança: 🟡 — mudaria contrato público

## Tarefas de Teste

- [ ] TT-01, Ausência do arquivo de script não gera erro
- [ ] TT-02, Cada um dos sete eventos chega à função correspondente com a carga esperada
- [ ] TT-03, Handler genérico recebe todos os eventos quando os específicos faltam
- [ ] TT-04, Evento de limpeza de coluna não expõe `tag` nem `uid`
- [ ] TT-05, Resolução de cartão funciona com objeto, com identificador e com ausência
- [ ] TT-06, Identificador inexistente lança erro nomeado
- [ ] TT-07, Gravação de dados no cartão persiste
- [ ] TT-08, Os quatro métodos de movimentação funcionam
- [ ] TT-09, Configuração global entregue é um clone, não a referência
- [ ] TT-10, Erro dentro do script chega ao usuário sem derrubar a extensão

## Tarefas de Migração de Dados

- [ ] TM-01, Preservar a compatibilidade do contrato de argumentos: scripts existentes vivem
      fora deste repositório e não são versionados
  - Origem no legado: `spec-impact-matrix.md` §2 (contrato público não versionado)
  - Critério de pronto: um script de 2018 continua funcionando, ou a quebra é anunciada e
    documentada

## Ordem Sugerida

1. **T-01 primeiro**: é a mitigação de menor custo e maior efeito para o risco central.
2. T-03 a T-05 formam o despacho básico.
3. T-07 a T-11 completam o contrato de argumentos.
4. T-13 logo em seguida, enquanto o comportamento está fresco: decompor depois fica mais caro.
5. T-12 e T-14 são melhorias de operação.
6. T-02, T-06 e T-15 dependem de decisões que mudam contrato ou experiência.

## Lacunas Pendentes 🔴

- **Q1 (`questions.md`)** — o mecanismo é recurso deliberado a preservar ou superfície a
  fechar? Bloqueia T-02 e T-06, e condiciona a forma de T-01.
- **TM-01** — não há inventário de scripts existentes; qualquer quebra de contrato é invisível
  até falhar na máquina do usuário.
- Comportamento desejado quando o módulo do usuário tem erro de sintaxe: hoje o erro sobe sem
  tratamento específico.
