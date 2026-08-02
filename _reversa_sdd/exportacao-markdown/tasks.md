# Exportação Markdown — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Unit `persistencia-do-quadro` disponível (gancho na gravação)
- [ ] Unit `configuracao-do-workspace` disponível (quatro chaves de exportação)
- [ ] Biblioteca de saneamento de nome de arquivo

## Tarefas

- [ ] T-01, Resolver o diretório de destino: vazio vira `.vscode/`, relativo resolve a partir de
      `.vscode/`, absoluto é usado como está
  - Origem no legado: `workspaces.ts:530-541`
  - Critério de pronto: os três casos resolvem corretamente
  - Confiança: 🟢

- [ ] T-02, Resolver o comprimento máximo do nome, com queda para 48 quando inválido ou menor
      que 1
  - Origem no legado: `workspaces.ts:543-551`
  - Critério de pronto: valores `0`, negativo, textual e ausente resultam em 48
  - Confiança: 🟢

- [ ] T-03, Substituir a limpeza por glob por uma lista de arquivos efetivamente gerados
  - Origem no legado: `workspaces.ts:970-986` (comportamento atual, destrutivo)
  - Critério de pronto: apenas arquivos criados pela extensão são removidos
  - Confiança: 🟡 — corrige o risco central da unit (ADR-005)

- [ ] T-04, Registrar em log quantos arquivos foram apagados e quantos gravados
  - Origem no legado: **ausente** — a operação é silenciosa
  - Critério de pronto: cada exportação deixa rastro auditável
  - Confiança: 🟡 — melhoria proposta, alinhada ao princípio de erros barulhentos

- [ ] T-05, Montar o nome do arquivo no formato
      `vscode-kanban_<coluna>_<índice na coluna>_<título>`
  - Origem no legado: `workspaces.ts:968`, `:1019-1024`
  - Critério de pronto: o nome reflete coluna, posição e título
  - Confiança: 🟢
  - 🟢 Avaliar remover o índice do nome: ele torna a exportação instável a cada movimentação

- [ ] T-06, Sanear o nome para o sistema de arquivos e truncar no limite
  - Origem no legado: `workspaces.ts:1026-1030`
  - Critério de pronto: título com barras, dois-pontos e acentos gera nome válido
  - Confiança: 🟢

- [ ] T-07, Resolver colisão de nomes com sufixo determinístico
  - Origem no legado: `workspaces.ts:1032-1053` (sufixo decrescente)
  - Critério de pronto: dois cartões de mesmo título geram dois arquivos distintos
  - Confiança: 🟢
  - 🟡 Considerar sufixo crescente (`-1`, `-2`), mais convencional que o decrescente atual

- [ ] T-08, Montar o bloco de metadados com as chaves em ordem alfabética, omitindo as vazias
  - Origem no legado: `workspaces.ts:1060-1095`
  - Critério de pronto: apenas metadados presentes aparecem, sempre na mesma ordem
  - Confiança: 🟢

- [ ] T-09, Exportar tipo vazio como `note`
  - Origem no legado: `workspaces.ts:1055-1058`
  - Critério de pronto: cartão sem tipo sai com `Type: note`
  - Confiança: 🟢

- [ ] T-10, Formatar `creation_time` como `YYYY-MM-DD HH:mm:ss (UTC)`, omitindo quando inválido
  - Origem no legado: `workspaces.ts:1070-1078`
  - Critério de pronto: data válida aparece formatada; inválida é omitida sem erro
  - Confiança: 🟢

- [ ] T-11, Acrescentar as seções de descrição e detalhes apenas quando houver conteúdo
  - Origem no legado: `workspaces.ts:1097-1111`
  - Critério de pronto: cartão sem descrição não gera a seção
  - Confiança: 🟢

- [ ] T-12, Remover o escape HTML do conteúdo Markdown, mantendo-o apenas onde for pertinente
  - Origem no legado: `workspaces.ts:1087-1094` (escape na camada errada)
  - Critério de pronto: título com `&` sai literal no arquivo Markdown
  - Confiança: 🟢 — corrige defeito confirmado

- [ ] T-13, Incluir o rodapé de atribuição ao final de cada arquivo
  - Origem no legado: `workspaces.ts:1113-1117`
  - Critério de pronto: o rodapé aparece em todos os arquivos
  - Confiança: 🟢

- [ ] T-14, Avaliar tornar a exportação sob demanda, por comando, em vez de a cada gravação
  - Origem no legado: `workspaces.ts:528` (sempre automática)
  - Critério de pronto: decisão registrada; se aceita, um comando dedicado dispara a exportação
  - Confiança: 🟡 — reduz o custo por movimentação

## Tarefas de Teste

- [ ] TT-01, Destino resolve corretamente nos três casos de `exportPath`
- [ ] TT-02, Limite de nome cai para 48 em valores inválidos
- [ ] TT-03, Nome saneado sobrevive a títulos com caracteres proibidos
- [ ] TT-04, Nome é truncado no limite configurado
- [ ] TT-05, Dois cartões de mesmo título geram arquivos distintos
- [ ] TT-06, Metadados saem em ordem alfabética, sem as chaves vazias
- [ ] TT-07, Tipo vazio sai como `note`
- [ ] TT-08, Data inválida não quebra a exportação
- [ ] TT-09, Seções ausentes quando não há conteúdo
- [ ] TT-10, Após T-03, arquivo do usuário com o mesmo prefixo **não** é apagado

## Tarefas de Migração de Dados

- [ ] TM-01, Ao adotar T-03, tratar exportações já existentes no destino: sem lista prévia, o
      primeiro ciclo não saberá o que é dele
  - Critério de pronto: estratégia definida (por exemplo, adotar tudo o que casa com o prefixo
    numa única migração e registrar na lista)

## Ordem Sugerida

1. T-01, T-02, T-05 e T-06 formam a resolução de destino e nome.
2. T-08 a T-13 montam o conteúdo — todos puros e verificáveis por comparação de texto.
3. T-07 fecha o caminho feliz.
4. **T-03 e T-04 são as tarefas de maior valor**: eliminam a única operação destrutiva não
   confirmada do sistema e tornam-na auditável.
5. T-12 corrige defeito confirmado, de custo trivial.
6. T-14 é decisão de produto.

## Lacunas Pendentes 🔴

- Estratégia de transição para a lista de arquivos gerados (TM-01).
- Decisão sobre manter o índice de coluna no nome do arquivo (T-05), que hoje causa renomeação
  em cascata a cada movimentação.
