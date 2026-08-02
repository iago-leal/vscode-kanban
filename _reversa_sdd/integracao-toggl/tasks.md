# Integração Toggl — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] **Decisão sobre Q4**: a integração continua ativa, migra para a v9 ou vira escopo negativo
- [ ] Unit `time-tracking` disponível (origem do despacho)
- [ ] Cliente HTTP com suporte a GET, POST e PUT
- [ ] Conta Toggl com token para verificação manual

## Tarefas

- [ ] T-01, Resolver o token aceitando valor literal ou caminho de arquivo, com caminho relativo
      resolvido a partir do diretório home
  - Origem no legado: `toggl.ts:71-94`
  - Critério de pronto: as duas formas produzem o mesmo token
  - Confiança: 🟢

- [ ] T-02, Lançar erro nomeado quando o token estiver vazio
  - Origem no legado: `toggl.ts:96-98`
  - Critério de pronto: mensagem "No API token defined!" chega ao usuário
  - Confiança: 🟢

- [ ] T-03, Migrar o armazenamento do token para o cofre de segredos do editor
  - Origem no legado: **ausente** — hoje o token vive no `settings.json`
  - Critério de pronto: o token não precisa mais transitar por arquivo versionável
  - Confiança: 🟡 — melhoria proposta

- [ ] T-04, Montar a autenticação Basic no formato `<token>:api_token` em base64
  - Origem no legado: `toggl.ts:100-102`
  - Critério de pronto: as chamadas autenticam
  - Confiança: 🟢
  - 🟢 Substituir `new Buffer` por `Buffer.from`, deprecado desde o Node 10

- [ ] T-05, Consultar o projeto configurado, tratando 404 como aviso e encerramento
  - Origem no legado: `toggl.ts:115-138`
  - Critério de pronto: projeto inexistente avisa e não dispara varredura
  - Confiança: 🟢

- [ ] T-06, Implementar a varredura de workspaces e projetos com indicador de progresso
  - Origem no legado: `toggl.ts:140-193`
  - Critério de pronto: a notificação nomeia o workspace em processamento
  - Confiança: 🟢

- [ ] T-07, Ordenar os projetos por nome e, em empate, por nome do workspace; dispensar o
      seletor quando houver um único
  - Origem no legado: `toggl.ts:297-328`
  - Critério de pronto: a ordenação é estável e o caso de item único não abre seletor
  - Confiança: 🟢

- [ ] T-08, Consultar a entrada de tempo corrente antes de decidir a ação
  - Origem no legado: `toggl.ts:198-214`
  - Critério de pronto: a decisão entre iniciar e parar é sempre correta
  - Confiança: 🟢

- [ ] T-09, Recusar o início quando a entrada corrente pertencer a outro projeto, com aviso
      explicativo
  - Origem no legado: `toggl.ts:216-224`
  - Critério de pronto: o aviso orienta a parar a entrada primeiro
  - Confiança: 🟢

- [ ] T-10, Iniciar a entrada com descrição (título do cartão), tags derivadas do contexto,
      identificador do projeto e origem `vscode-kanban`
  - Origem no legado: `toggl.ts:226-257`
  - Critério de pronto: a entrada aparece no Toggl com todos os campos
  - Confiança: 🟢

- [ ] T-11, Parar a entrada corrente do mesmo projeto e oferecer atalho para abrir o Toggl
  - Origem no legado: `toggl.ts:258-290`
  - Critério de pronto: a entrada é encerrada e o atalho abre o cronômetro
  - Confiança: 🟢

- [ ] T-12, Tratar códigos HTTP diferentes de 200 com erro contendo código e status
  - Origem no legado: `toggl.ts:104-111`
  - Critério de pronto: falha de rede produz mensagem inteligível
  - Confiança: 🟢

- [ ] T-13, Migrar todos os endpoints para a API v9
  - Origem no legado: `toggl.ts:117-270` (v8, descontinuada)
  - Critério de pronto: as seis operações funcionam contra a v9
  - Confiança: 🔴 — depende de Q4 e de verificação com credencial real

- [ ] T-14, Introduzir política de repetição para falhas transitórias de rede
  - Origem no legado: **ausente**
  - Critério de pronto: falha momentânea não aborta a operação
  - Confiança: 🟡 — melhoria proposta

## Tarefas de Teste

- [ ] TT-01, Token literal e token por arquivo produzem o mesmo resultado
- [ ] TT-02, Token vazio lança o erro nomeado
- [ ] TT-03, Cabeçalho de autenticação tem o formato esperado
- [ ] TT-04, Projeto configurado inexistente avisa e não varre
- [ ] TT-05, Ordenação de projetos é estável e correta em empate
- [ ] TT-06, Entrada corrente de outro projeto bloqueia o início
- [ ] TT-07, Ausência de entrada corrente inicia uma nova com os campos corretos
- [ ] TT-08, Tags são normalizadas, deduplicadas e ordenadas
- [ ] TT-09, Código HTTP diferente de 200 produz erro com código e status

> As chamadas devem ser testadas contra um duplo de teste (servidor local ou intercepção), não
> contra a API real.

## Tarefas de Migração de Dados

Não se aplica: nada é persistido localmente por esta unit.

## Ordem Sugerida

1. **Resolver Q4 antes de tudo.** Se a integração não é mais usada, a unit vira escopo negativo
   e nenhuma tarefa se justifica.
2. Sendo mantida: T-13 primeiro, porque a v8 provavelmente já não responde — não faz sentido
   reimplementar contra uma API morta.
3. T-01, T-02 e T-04 formam a base de autenticação.
4. T-08 a T-11 são o núcleo funcional.
5. T-05 a T-07 são a descoberta de projetos.
6. T-03, T-12 e T-14 são endurecimento.

## Lacunas Pendentes 🔴

- **Q4 (`questions.md`)** — a integração ainda é usada? Bloqueia toda a unit.
- **T-13** — a migração para a v9 exige credencial real para verificação; não é possível
  confirmar o formato das respostas apenas pelo código legado.
- Comportamento desejado quando o cartão é renomeado depois de iniciada a entrada: o vínculo,
  que é apenas pelo título, se rompe silenciosamente.
