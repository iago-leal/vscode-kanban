# Anúncios e Changelog — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Acesso ao armazenamento global do editor
- [ ] Conversor de Markdown disponível na camada da extensão
- [ ] `CHANGELOG.md` presente na raiz do pacote

## Tarefas

- [ ] T-01, Comparar a versão instalada com a última registrada no armazenamento global
  - Origem no legado: `extension.ts:305-311`
  - Critério de pronto: versões iguais não disparam exibição
  - Confiança: 🟢

- [ ] T-02, Exibir o CHANGELOG num painel de leitura, sem scripts e sem URIs de comando
  - Origem no legado: `extension.ts:321-339`
  - Critério de pronto: o painel abre e não executa JavaScript
  - Confiança: 🟢

- [ ] T-03, Converter o Markdown do CHANGELOG com opções compatíveis com a versão atual da
      biblioteca
  - Origem no legado: `extension.ts:333-339` (usa `sanitize` e `mangle`, removidas)
  - Critério de pronto: a conversão funciona sem opções obsoletas
  - Confiança: 🟢 — correção necessária ao atualizar a dependência

- [ ] T-04, Registrar a versão exibida, inclusive quando a exibição falhar
  - Origem no legado: `extension.ts:352-358`
  - Critério de pronto: falha na exibição não faz o painel reaparecer indefinidamente
  - Confiança: 🟢

- [ ] T-05, Tolerar a ausência do arquivo de changelog sem erro
  - Origem no legado: `extension.ts:316`
  - Critério de pronto: arquivo ausente não interrompe a ativação
  - Confiança: 🟢

- [ ] T-06, Registrar em log as falhas das duas rotinas, em vez de engoli-las
  - Origem no legado: `extension.ts:351`, `announcements.ts:97` (blocos vazios)
  - Critério de pronto: falha deixa rastro diagnosticável
  - Confiança: 🟡 — alinhado ao princípio de erros barulhentos

- [ ] T-07, Decidir o destino do aviso de recrutamento
  - Origem no legado: `announcements.ts:30-102`
  - Critério de pronto: o aviso é removido, atualizado ou mantido, com a decisão registrada
  - Confiança: 🔴 — o aviso é de 2020 e convida a uma refatoração que não ocorreu

- [ ] T-08, Desvincular o silenciamento do sucesso na abertura do link
  - Origem no legado: `announcements.ts:62`, `:84`
  - Critério de pronto: a decisão de não mostrar de novo depende só da escolha do usuário
  - Confiança: 🟢 — corrige comportamento contraintuitivo

- [ ] T-09, Avaliar a carga de anúncios a partir de fonte externa
  - Origem no legado: `announcements.ts:31` (TODO sem ação desde 2020)
  - Critério de pronto: decisão registrada; a implementação exigiria acesso à rede na ativação
  - Confiança: 🟡 — avaliar o custo de privacidade antes

- [ ] T-10, Reconsiderar a exibição do CHANGELOG completo, que hoje abre uma aba a cada
      atualização
  - Origem no legado: `extension.ts:321-339`
  - Critério de pronto: decisão registrada sobre manter, resumir ou apenas notificar
  - Confiança: 🟡

## Tarefas de Teste

- [ ] TT-01, Versão nova dispara a exibição uma única vez
- [ ] TT-02, Versão igual não dispara nada
- [ ] TT-03, Arquivo de changelog ausente não interrompe a ativação
- [ ] TT-04, Falha na criação do painel não impede o registro da versão
- [ ] TT-05, Aviso não aparece quando a chave já vale o valor de silenciamento
- [ ] TT-06, "Later" não grava e o aviso volta
- [ ] TT-07, "Don't show again" silencia permanentemente
- [ ] TT-08, Após T-08, falha ao abrir o link não afeta a decisão de silenciar

## Tarefas de Migração de Dados

- [ ] TM-01, Preservar as duas chaves do armazenamento global: alterá-las faria o CHANGELOG e o
      aviso reaparecerem para toda a base instalada
  - Origem no legado: `extension.ts:112`, `announcements.ts:20`
  - Critério de pronto: usuários existentes não veem nada reaparecer

## Ordem Sugerida

1. T-01, T-02, T-04 e T-05 formam a rotina do changelog.
2. **T-03 é obrigatória** se a biblioteca de Markdown for atualizada — hoje o código depende de
   opções que já não existem.
3. T-06 é melhoria transversal de baixo custo.
4. T-07 é decisão antes de tarefa: mantido o aviso, T-08 o corrige; removido, ambas caem.
5. T-09 e T-10 são avaliações de produto.

## Lacunas Pendentes 🔴

- **T-07** — o aviso convida a uma refatoração anunciada em 2020 e nunca realizada, e continua
  sendo exibido a quem instalar a extensão hoje. Manter, atualizar ou remover é decisão de quem
  assume a manutenção.
