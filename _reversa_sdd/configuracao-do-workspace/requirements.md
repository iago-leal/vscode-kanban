# Configuração do Workspace

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Leitura, recarga e distribuição das treze chaves de configuração `kanban.*`, declaradas no
manifesto da extensão com escopo `resource` — isto é, por pasta de workspace.

## Responsabilidades

- Declarar o esquema de configuração no manifesto
- Ler a configuração da pasta corrente
- Recarregar quando o usuário alterar `settings.json`
- Derivar as configurações enviadas ao Webview
- Aplicar os valores padrão

## Regras de Negócio

- O escopo é `resource`: cada pasta tem sua configuração 🟢
- A fonte é `<workspace>/.vscode/settings.json`, seção `kanban` 🟢
- Uma recarga durante outra recarga é reagendada em 1 segundo (proteção contra reentrância) 🟢
- `simpleIDs` e `cleanupExports` têm padrão **verdadeiro**; todas as demais chaves booleanas
  têm padrão falso 🟢
- `maxExportNameLength` tem padrão 48, e valores inválidos caem nele 🟢
- `noTimeTrackingIfIdle` vira `hideTimeTrackingIfIdle` na fronteira com o Webview 🟢
- `canTrackTime` é derivada, não configurada: verdadeira quando `trackTime` não é nulo nem
  `false` 🟢
- A recarga dispara `openBoardOnStartup`, de modo que `openOnStartup` reabre o quadro a cada
  mudança de configuração 🟡
- Nomes de coluna vazios ou só com espaços caem nos nomes padrão 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Declarar as treze chaves com tipo, descrição e padrão | Must | O editor oferece autocompletar e validação |
| RF-02 | Ler a configuração por pasta | Must | Pastas distintas podem ter configurações distintas |
| RF-03 | Recarregar ao alterar `settings.json` | Must | A mudança vale sem reiniciar o editor |
| RF-04 | Proteger contra recarga reentrante | Must | Alterações rápidas não geram laço |
| RF-05 | Derivar `BoardSettings` para o Webview | Must | O Webview recebe apenas o que precisa |
| RF-06 | Aplicar os valores padrão documentados | Must | Ausência de chave não quebra o sistema |
| RF-07 | Validar `trackTime` conforme as três formas aceitas | Should | Forma inválida não quebra a abertura |
| RF-08 | Avisar sobre chave desconhecida ou valor inválido | Could | 🔴 Ausente no legado |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Robustez | Proteção contra reentrância com atraso fixo de 1 s | `workspaces.ts:394-404` | 🟢 |
| Segurança | `trackTime.token` fica em texto puro no `settings.json` | `package.json:147-150` | 🟢 |
| Compatibilidade | Escopo `resource` permite configuração por pasta em multi-root | `package.json:36` | 🟢 |
| Correção | Nenhuma validação além do esquema JSON do manifesto | ausência de código | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um settings.json com kanban.columns.todo igual a "Backlog"
Quando o quadro é aberto
Então o cabeçalho da primeira coluna exibe "Backlog"

Dado nenhuma chave kanban configurada
Quando o quadro é aberto
Então todos os padrões valem: simpleIDs verdadeiro, exportOnSave falso, cleanupExports verdadeiro

Dado o quadro aberto
Quando o usuário altera kanban.simpleIDs no settings.json
Então a configuração é recarregada sem reiniciar o editor

Dado duas alterações de configuração em menos de um segundo
Quando a segunda ocorre durante o processamento da primeira
Então a segunda é reagendada e nenhuma se perde

Dado kanban.maxExportNameLength com valor zero
Quando a exportação ocorre
Então o limite efetivo é 48

Dado kanban.trackTime com type "toggl" sem token
Quando o rastreamento é acionado
Então lança-se erro informando a ausência do token
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Declaração e leitura | Must | Toda unit depende |
| Recarga dinâmica | Must | Sem ela, mudar configuração exigiria reiniciar |
| Proteção contra reentrância | Must | Evita laço em alterações rápidas |
| Derivação para o Webview | Must | Contrato entre os dois containers |
| Validação de `trackTime` | Should | As três formas precisam ser distinguidas |
| Aviso de valor inválido | Could | O legado silencia em vários casos |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `package.json:33-169` | esquema de configuração contribuído | 🟢 |
| `src/workspaces.ts:93-163` | interface `Config` | 🟢 |
| `src/workspaces.ts:381-389` | `initialize` e `configSource` | 🟢 |
| `src/workspaces.ts:394-417` | `onDidChangeConfiguration` | 🟢 |
| `src/workspaces.ts:574-585` | derivação de `BoardSettings` | 🟢 |
| `src/workspaces.ts:356-362` | `canTrackTime` derivada | 🟢 |
| `src/workspaces.ts:485-490` | nomes de coluna | 🟢 |
