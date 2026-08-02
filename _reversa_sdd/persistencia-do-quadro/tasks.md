# Persistência do Quadro — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Biblioteca de I/O de arquivos disponível
- [ ] Unit `configuracao-do-workspace` disponível (fornece `simpleIDs`)
- [ ] Contrato de mensagens `setBoard` / `saveBoard` definido (ver `abertura-do-quadro`)

## Tarefas

- [ ] T-01, Implementar a fábrica de quadro vazio com as quatro colunas
  - Origem no legado: `boards.ts:1477-1484`
  - Critério de pronto: devolve objeto com `todo`, `in-progress`, `testing` e `done` vazios
  - Confiança: 🟢

- [ ] T-02, Implementar a leitura e desserialização do arquivo do quadro
  - Origem no legado: `boards.ts:1342-1346`
  - Critério de pronto: arquivo válido é lido; conteúdo nulo produz quadro vazio
  - Confiança: 🟢

- [ ] T-03, Tratar JSON malformado com erro nomeado e preservação do arquivo original
  - Origem no legado: `boards.ts:1342` (**ausência** de tratamento — melhoria proposta)
  - Critério de pronto: arquivo corrompido produz mensagem clara e não é sobrescrito
  - Confiança: 🔴 — comportamento não definido no legado

- [ ] T-04, Normalizar cada coluna para array, tolerando ausência e tipo errado
  - Origem no legado: `boards.ts:1407-1409`
  - Critério de pronto: arquivo sem uma coluna carrega com ela vazia
  - Confiança: 🟢

- [ ] T-05, Implementar a atribuição de `id` no modo simples: inteiro sequencial a partir do
      maior `id` numérico do quadro
  - Origem no legado: `boards.ts:1389-1405`, `:1432` (carga) **e** `board.js:1841-1852`,
    `:274-284` (criação) — a mesma lógica está implementada duas vezes
  - Critério de pronto: cartão sem `id` recebe `max + 1`; quadro vazio começa em 1; **uma única
    implementação atende aos dois caminhos**
  - Confiança: 🟢
  - 🟡 Ver `questions.md` Q2 antes de replicar o custo quadrático
  - 🟢 Ver `gaps.md` G-01: unificar as duas implementações é pré-requisito para que os dois
    caminhos não divirjam

- [ ] T-06, Implementar a atribuição de `id` no modo composto:
      `<YYYYMMDDHHmmss>_<aleatório>_<uuid sem hífens>`, com o prefixo de data apenas quando há
      `creation_time` válido
  - Origem no legado: `boards.ts:1413-1436`
  - Critério de pronto: os dois formatos (com e sem data) são gerados corretamente
  - Confiança: 🟢

- [ ] T-07, Normalizar `description` e `details`: string vira `{content, mime: 'text/plain'}`;
      MIME diferente de `text/markdown` é forçado a `text/plain`; conteúdo vazio vira indefinido
  - Origem no legado: `boards.ts:1354-1387`
  - Critério de pronto: os quatro casos (string, objeto markdown, objeto com MIME estranho,
    vazio) se comportam como especificado
  - Confiança: 🟢

- [ ] T-08, Implementar a gravação do quadro em JSON com indentação de dois espaços, tratando
      quadro nulo como vazio
  - Origem no legado: `workspaces.ts:1124-1133`
  - Critério de pronto: arquivo gravado é reidratável e produz *diff* legível
  - Confiança: 🟢

- [ ] T-09, Tornar a gravação atômica (arquivo temporário e renomeação)
  - Origem no legado: **ausente** — melhoria proposta
  - Critério de pronto: interrupção durante a gravação não deixa arquivo truncado
  - Confiança: 🟡

- [ ] T-10, Implementar a recarga sob demanda acionada pelo Webview
  - Origem no legado: `board.js:1212-1217`, `boards.ts:1211-1215`
  - Critério de pronto: alteração externa ao arquivo aparece após acionar a recarga
  - Confiança: 🟢

- [ ] T-11, Enviar o quadro normalizado ao Webview junto do filtro e das configurações
  - Origem no legado: `boards.ts:1457-1461`
  - Critério de pronto: o Webview recebe `{cards, filter, settings}` numa única mensagem
  - Confiança: 🟢

- [ ] T-12, Introduzir campo de versão de esquema no arquivo do quadro
  - Origem no legado: **ausente** — melhoria proposta pelo `erd-complete.md` §6
  - Critério de pronto: arquivos sem o campo são tratados como versão 1 e migrados na carga
  - Confiança: 🟡

## Tarefas de Teste

- [ ] TT-01, Carga de quadro completo preserva todos os cartões e suas colunas
- [ ] TT-02, Coluna ausente no arquivo é normalizada para vazia
- [ ] TT-03, Cartão sem `id` recebe `max + 1` no modo simples
- [ ] TT-04, Quadro vazio atribui o primeiro `id` como 1
- [ ] TT-05, Modo composto gera `id` com e sem prefixo de data conforme `creation_time`
- [ ] TT-06, Normalização de conteúdo cobre os quatro casos de `mime`
- [ ] TT-07, Conteúdo vazio remove o campo do objeto
- [ ] TT-08, Ida e volta (gravar e recarregar) preserva o quadro integralmente
- [ ] TT-09, JSON malformado produz erro nomeado e não corrompe o arquivo

## Tarefas de Migração de Dados

- [ ] TM-01, Ao introduzir o campo de versão (T-12), tratar todo arquivo existente como versão
      1 sem exigir ação do usuário
  - Origem no legado: formato descrito em `erd-complete.md`
  - Critério de pronto: arquivo de 2018 abre sem perda

## Ordem Sugerida

1. T-01, T-02 e T-04 formam o caminho mínimo de leitura.
2. T-07 em seguida: sem normalização de conteúdo a renderização não funciona.
3. T-05 e T-06 podem ser feitas em paralelo; ambas são funções puras e são os **primeiros
   testes recomendados** do projeto (ver `spec-impact-matrix.md` §4).
4. T-08 fecha o ciclo e permite testar ida e volta (TT-08).
5. T-03, T-09 e T-12 são endurecimento; nenhum existe no legado e todos reduzem risco real.
6. T-10 e T-11 dependem do contrato de mensagens já estar de pé.

## Lacunas Pendentes 🔴

- **T-03** — comportamento desejado diante de arquivo corrompido não está definido no legado.
- **Q2 (`questions.md`)** — semântica exigida da numeração sequencial (única × sem lacunas)
  afeta T-05.
- Política de resolução de conflito quando o arquivo muda fora do editor (lacuna L3 de
  `domain.md`) — nenhuma tarefa a cobre porque nenhuma decisão foi tomada.
