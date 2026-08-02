# ADR-007 — Ativação irrestrita (`activationEvents: ["*"]`)

> ADR **retroativo**, reconstruído pelo Detetive.

- **Status:** aceito e vigente desde a versão 1.0.1 (2018-05-27)
- **Confiança:** 🟢 na decisão · 🟡 na motivação

## Contexto

O VS Code permite declarar quando uma extensão deve ser carregada: ao rodar um comando
(`onCommand`), ao abrir um tipo de arquivo (`onLanguage`), ao existir um arquivo no workspace
(`workspaceContains`), ou sempre (`*`). Carregar cedo custa tempo de inicialização do editor
para todos os usuários.

## Decisão

Declarar `"activationEvents": ["*"]` (`package.json:21-23`), ativando a extensão **em toda
abertura do VS Code**, independentemente de o usuário usar o quadro.

## Evidências

- `package.json:21-23`
- `activate()` registra o *workspace watcher* e chama `reload()` (`extension.ts:269-298`)
- `openBoardOnStartup` depende de configuração já carregada em cada `Workspace`
  (`workspaces.ts:590-598`)
- O aviso de recrutamento é exibido na ativação (`extension.ts:363-367`)

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| `onCommand:extension.kanban.openBoard` | Não cobriria `openOnStartup`, que precisa agir antes de qualquer comando |
| `workspaceContains:.vscode/vscode-kanban.json` | Cobriria a maioria dos casos reais e teria sido a escolha adequada 🟡 — mas não ativaria em pasta ainda sem quadro |
| Combinação de `onCommand` e `workspaceContains` | Solução idiomática hoje; exigiria pensar o ciclo de vida com mais cuidado |

## Consequências

**Positivas** 🟢
- `openOnStartup` funciona sem depender de gatilho nenhum.
- O *watcher* de workspaces está pronto desde o início da sessão.
- O aviso de recrutamento alcança todos os usuários — provavelmente relevante para o autor,
  que buscava colaboradores.

**Negativas** 🟢
- **Custo de inicialização imposto a todos**, inclusive a quem nunca abre o quadro: criação de
  diretório em `~`, leitura do `package.json`, montagem do logger, varredura de workspaces.
- Escrita síncrona de log no *event loop* do extension host (`extension.ts:193`) passa a
  ocorrer desde a inicialização.
- Combinada com o ADR-004, mantém a extensão sempre pronta a executar o script do workspace:
  falta apenas o evento de cartão.
- O Marketplace sinaliza `*` como prática desaconselhada desde 2019.

## Status hoje

Vigente e **desalinhada com a prática atual**. `workspaceContains:.vscode/vscode-kanban.json`
combinado com `onCommand` cobriria praticamente todos os casos com custo próximo de zero. É a
mudança de melhor relação entre benefício e esforço em todo o sistema: uma linha do
`package.json`, com ganho para todos os usuários.
