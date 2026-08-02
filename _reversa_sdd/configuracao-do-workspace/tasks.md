# Configuração do Workspace — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] API de configuração do editor disponível, com suporte a escopo por recurso
- [ ] Manifesto da extensão editável

## Tarefas

- [ ] T-01, Declarar as dezesseis chaves de configuração no manifesto, com tipo, descrição e
      valor padrão
  - Origem no legado: `package.json:33-169`
  - Critério de pronto: o editor oferece autocompletar e validação de tipo
  - Confiança: 🟢

- [ ] T-02, Declarar `trackTime` como união das três formas (booleano, script e Toggl)
  - Origem no legado: `package.json:114-165`
  - Critério de pronto: as três formas são aceitas pelo esquema
  - Confiança: 🟢

- [ ] T-03, Implementar a leitura da configuração por pasta de workspace
  - Origem no legado: `workspaces.ts:382-386`, `:408-409`
  - Critério de pronto: pastas distintas leem configurações distintas
  - Confiança: 🟢

- [ ] T-04, Implementar a recarga ao alterar o arquivo de configuração
  - Origem no legado: `workspaces.ts:394-417`
  - Critério de pronto: alteração vale sem reiniciar o editor
  - Confiança: 🟢

- [ ] T-05, Proteger contra recarga reentrante, reagendando a chamada concorrente
  - Origem no legado: `workspaces.ts:395-404`
  - Critério de pronto: alterações em rajada não geram laço nem perda
  - Confiança: 🟢

- [ ] T-06, Aplicar os valores padrão, com atenção às duas chaves cujo padrão é verdadeiro
  - Origem no legado: `workspaces.ts:555`, `:584`
  - Critério de pronto: ausência de chave produz o padrão documentado
  - Confiança: 🟢

- [ ] T-07, Derivar as configurações enviadas ao Webview, incluindo a renomeação de
      `noTimeTrackingIfIdle`
  - Origem no legado: `workspaces.ts:574-585`
  - Critério de pronto: o Webview recebe exatamente os cinco campos do contrato
  - Confiança: 🟢
  - 🟢 Considerar uniformizar o nome nos dois lados, eliminando a renomeação na fronteira

- [ ] T-08, Derivar a disponibilidade do rastreamento de tempo a partir de `trackTime`
  - Origem no legado: `workspaces.ts:356-362`
  - Critério de pronto: os quatro formatos resolvem corretamente
  - Confiança: 🟢

- [ ] T-09, Resolver nomes de coluna com queda para o padrão quando vazios ou só com espaços
  - Origem no legado: `workspaces.ts:485-490`
  - Critério de pronto: nome com espaços cai no padrão
  - Confiança: 🟢

- [ ] T-10, Restringir a reabertura automática do quadro à ativação, em vez de a cada recarga
  - Origem no legado: `workspaces.ts:413`, `:590-598` (comportamento atual)
  - Critério de pronto: alterar a configuração com o quadro fechado não o abre
  - Confiança: 🟡 — corrige comportamento provavelmente não intencional

- [ ] T-11, Validar valores fora do esquema e avisar o usuário em vez de silenciar
  - Origem no legado: **ausente** — o legado substitui pelo padrão sem aviso
  - Critério de pronto: `trackTime.type` inválido produz mensagem clara
  - Confiança: 🟡 — alinhado ao princípio de erros barulhentos

- [ ] T-12, Registrar em log cada recarga de configuração
  - Origem no legado: **ausente**
  - Critério de pronto: é possível diagnosticar por que um valor não surtiu efeito
  - Confiança: 🟡

- [ ] T-13, Documentar de forma destacada que `cleanupExports` vem ligado e apaga arquivos
  - Origem no legado: `package.json:44-47` (descrição atual não menciona o risco)
  - Critério de pronto: a descrição da chave explicita o comportamento destrutivo
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Configuração ausente produz todos os padrões documentados
- [ ] TT-02, `simpleIDs` e `cleanupExports` são verdadeiros por omissão
- [ ] TT-03, Recarga reentrante é reagendada sem perda
- [ ] TT-04, Derivação para o Webview produz os cinco campos corretos
- [ ] TT-05, Disponibilidade de rastreamento resolve os quatro formatos
- [ ] TT-06, Nome de coluna vazio cai no padrão
- [ ] TT-07, `maxExportNameLength` inválido cai em 48
- [ ] TT-08, Após T-10, alterar a configuração não reabre o quadro

## Tarefas de Migração de Dados

- [ ] TM-01, Preservar os nomes das chaves existentes: alterá-los quebraria o `settings.json` de
      todos os usuários
  - Critério de pronto: um `settings.json` de 2018 continua válido

## Ordem Sugerida

1. T-01 e T-02 primeiro: o esquema é pré-requisito de tudo.
2. T-03 a T-06 formam a leitura e os padrões.
3. T-07 a T-09 são as derivações consumidas por outras units.
4. T-10 corrige o comportamento de reabertura — depende de `abertura-do-quadro` já estar de pé.
5. T-11 a T-13 são melhorias de robustez e de comunicação.

## Lacunas Pendentes 🔴

- Nenhuma lacuna bloqueante nesta unit. As decisões pendentes (T-10, T-11) são correções de
  comportamento cujo efeito é local e verificável.
