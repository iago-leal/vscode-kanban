# Exportação Markdown

> Unit da extração Reversa · 2026-08-02
> ⚠️ Contém a operação destrutiva do sistema: limpeza por glob (ADR-005).

## Visão Geral

Geração de um arquivo Markdown por cartão, a cada gravação do quadro, quando `exportOnSave`
está ligado. Existe para tornar os cartões legíveis fora do editor, em *pull request*, wiki ou
documentação.

## Responsabilidades

- Resolver o diretório de destino da exportação
- Apagar exportações anteriores, quando configurado
- Gerar o nome de arquivo saneado e truncado, resolvendo colisões
- Montar o Markdown do cartão com metadados, descrição e detalhes
- Gravar um arquivo por cartão de todas as colunas

## Regras de Negócio

- A exportação ocorre a cada gravação do quadro, se `exportOnSave` estiver ligado 🟢
- `exportPath` vazio resolve para `.vscode/`; caminho relativo resolve a partir de `.vscode/` 🟢
- `cleanupExports` tem padrão **verdadeiro** e apaga por glob `vscode-kanban_*.card.md` no
  diretório de destino 🔴
- O nome segue `vscode-kanban_<coluna>_<índice na coluna>_<título>` 🟢
- O nome é saneado para o sistema de arquivos e truncado em `maxExportNameLength` 🟢
- `maxExportNameLength` inválido ou menor que 1 volta a 48 🟢
- Colisão de nome resolve-se por sufixo **decrescente** a partir de zero (`0`, `-1`, `-2`, …) 🟢
- Tipo vazio é exportado como `note` 🟢
- Os metadados aparecem em `## Meta`, com as chaves em ordem alfabética 🟢
- O rodapé de atribuição é fixo e sempre presente 🟢
- A falha na gravação do quadro **não** impede a exportação 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Exportar um arquivo por cartão a cada gravação, quando ligado | Must | Quadro com 5 cartões gera 5 arquivos |
| RF-02 | Resolver o destino conforme `exportPath` | Must | Caminho relativo resolve a partir de `.vscode/` |
| RF-03 | Sanear e truncar o nome do arquivo | Must | Título com barras não quebra a gravação |
| RF-04 | Resolver colisão de nomes | Must | Dois cartões de mesmo título geram dois arquivos |
| RF-05 | Incluir metadados em ordem alfabética | Should | Column, Type, Category, Creation time, Assigned to |
| RF-06 | Incluir descrição e detalhes quando presentes | Should | Seções aparecem apenas se houver conteúdo |
| RF-07 | Apagar exportações anteriores antes de regerar | Should | Cartão excluído não deixa arquivo órfão |
| RF-08 | Confirmar antes de apagar arquivos do usuário | Could | 🔴 Ausente no legado |
| RF-09 | Exportar sob demanda, por comando | Could | 🟢 Ausente: só automático |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Segurança | Exclusão por glob no diretório informado pelo usuário, sem confirmação | `workspaces.ts:970-986` | 🟢 |
| Desempenho | Apaga e regera todos os arquivos a cada gravação, inclusive por movimentação | `workspaces.ts:528` | 🟢 |
| Integridade | O índice no nome muda quando cartões se movem, renomeando arquivos dos demais | `workspaces.ts:1021` | 🟢 |
| Correção | Escape HTML aplicado a conteúdo Markdown | `workspaces.ts:1087-1094` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado exportOnSave ligado e um quadro com três cartões
Quando o quadro é gravado
Então três arquivos .card.md são criados no destino

Dado exportPath com o valor "docs/cartoes"
Quando a exportação ocorre
Então os arquivos são gravados em .vscode/docs/cartoes

Dado dois cartões com o mesmo título na mesma coluna
Quando a exportação ocorre
Então dois arquivos distintos são criados, com sufixo diferenciador

Dado um cartão com título maior que maxExportNameLength
Quando a exportação ocorre
Então o nome do arquivo é truncado no limite configurado

Dado maxExportNameLength com valor zero
Quando a exportação ocorre
Então o limite efetivo é 48

Dado cleanupExports ligado e arquivos anteriores no destino
Quando a exportação ocorre
Então os arquivos com o prefixo vscode-kanban_ são apagados antes da regeração
E 🔴 arquivos do usuário com esse mesmo prefixo também são apagados

Dado um cartão sem descrição
Quando a exportação ocorre
Então o arquivo não contém a seção Description
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Geração do arquivo por cartão | Must | Razão de ser da unit |
| Resolução do destino | Must | Determina onde os arquivos vão |
| Saneamento e truncamento | Must | Sem isso a gravação falha em títulos comuns |
| Resolução de colisão | Must | Títulos repetidos são frequentes |
| Metadados e conteúdo | Should | O que torna o arquivo útil |
| Limpeza de anteriores | Should | Evita órfãos, ao custo de risco |
| Confirmação antes de apagar | Could | Mitigaria o risco da limpeza |
| Exportação sob demanda | Could | Reduziria o custo por gravação |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/workspaces.ts:959-1122` | `exportBoardCardsTo` | 🟢 |
| `src/workspaces.ts:528-562` | gancho na gravação do quadro | 🟢 |
| `src/workspaces.ts:970-986` | limpeza por glob | 🟢 |
| `src/workspaces.ts:1019-1053` | nome, saneamento, truncamento e colisão | 🟢 |
| `src/workspaces.ts:1060-1119` | montagem do Markdown | 🟢 |
| `src/workspaces.ts:311` | constante da extensão de arquivo | 🟢 |
