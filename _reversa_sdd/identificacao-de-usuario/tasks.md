# Identificação de Usuário — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Unit `abertura-do-quadro` disponível (handshake de carregamento)
- [ ] Unit `configuracao-do-workspace` disponível (`noScmUser`, `noSystemUser`)
- [ ] Cliente Git acessível a partir da pasta do workspace

## Tarefas

- [ ] T-01, Criar o cliente Git da pasta do workspace, tolerando a ausência de repositório
  - Origem no legado: `workspaces.ts:952-956`
  - Critério de pronto: pasta sem Git não gera erro
  - Confiança: 🟢

- [ ] T-02, Verificar a existência do diretório `.git` antes de qualquer consulta
  - Origem no legado: `boards.ts:1000-1004`
  - Critério de pronto: sem `.git`, o comando não é executado
  - Confiança: 🟢

- [ ] T-03, Consultar `git config user.name` respeitando a chave de desligamento
  - Origem no legado: `boards.ts:1008-1014`
  - Critério de pronto: com a chave ligada, o Git não é consultado
  - Confiança: 🟢

- [ ] T-04, Substituir a execução síncrona por consulta assíncrona
  - Origem no legado: `boards.ts:1010-1012` (`execSync` bloqueia o *event loop*)
  - Critério de pronto: o handshake não bloqueia o processo da extensão
  - Confiança: 🟡 — melhoria proposta

- [ ] T-05, Recorrer ao nome de usuário do sistema quando o Git não fornecer, respeitando a
      chave correspondente
  - Origem no legado: `boards.ts:1019-1027`
  - Critério de pronto: a cascata funciona nas quatro combinações das duas chaves
  - Confiança: 🟢

- [ ] T-06, Enviar o nome ao Webview apenas quando não for vazio
  - Origem no legado: `boards.ts:1029-1033`
  - Critério de pronto: nome vazio não gera mensagem
  - Confiança: 🟢

- [ ] T-07, Preencher o campo de responsável somente quando estiver vazio
  - Origem no legado: `board.js:2047-2058`
  - Critério de pronto: valor digitado pelo usuário é preservado
  - Confiança: 🟢

- [ ] T-08, Registrar em log qual fonte forneceu o nome, ou por que nenhuma forneceu
  - Origem no legado: **ausente** — falha totalmente silenciosa
  - Critério de pronto: é possível diagnosticar campo vazio inesperado
  - Confiança: 🟡 — alinhado ao princípio de erros barulhentos

- [ ] T-09, Documentar a implicação de privacidade: o nome detectado é gravado no arquivo do
      quadro, que costuma ser versionado
  - Origem no legado: descrições atuais das chaves não mencionam isso
  - Critério de pronto: a documentação explicita o comportamento e as chaves de desligamento
  - Confiança: 🟢

- [ ] T-10, Implementar a coleta dos nomes já usados no quadro, para sugestão no campo
  - Origem no legado: `board.js:548-586`
  - Critério de pronto: os nomes existentes aparecem como sugestão
  - Confiança: 🟢

- [ ] T-11, Avaliar permitir a configuração manual do nome, dispensando a detecção
  - Origem no legado: **ausente**
  - Critério de pronto: decisão registrada; se aceita, uma chave define o nome diretamente
  - Confiança: 🟡

## Tarefas de Teste

- [ ] TT-01, Pasta com Git e `user.name` configurado devolve esse nome
- [ ] TT-02, Pasta sem Git recorre ao nome do sistema
- [ ] TT-03, Chave de desligamento do Git impede a consulta
- [ ] TT-04, Chave de desligamento do sistema impede a alternativa
- [ ] TT-05, Ambas as chaves ligadas resultam em nenhum nome
- [ ] TT-06, Falha do comando do Git não interrompe a abertura do quadro
- [ ] TT-07, Nome vazio não gera mensagem ao Webview
- [ ] TT-08, Campo já preenchido não é sobrescrito

## Tarefas de Migração de Dados

Não se aplica: nada é persistido por esta unit além do valor gravado nos cartões.

## Ordem Sugerida

1. T-01 a T-03 formam a fonte primária.
2. T-05 completa a cascata; T-06 e T-07 fecham o caminho até a interface.
3. T-04 e T-08 são melhorias de robustez e devem vir logo depois, enquanto o fluxo está fresco.
4. T-09 e T-10 são independentes.
5. T-11 é decisão de produto.

## Lacunas Pendentes 🔴

- Nenhuma bloqueante. A unit é acessória: o quadro funciona integralmente sem ela.
- 🟡 A implicação de privacidade (nome gravado em arquivo versionado) merece decisão explícita,
  ainda que o comportamento atual seja defensável e desligável.
