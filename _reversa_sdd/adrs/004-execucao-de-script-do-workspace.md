# ADR-004 — Extensibilidade por execução de script do workspace

> ADR **retroativo**, reconstruído pelo Detetive.
> ⚠️ Esta é a decisão de maior impacto em segurança do sistema.

- **Status:** aceito e vigente desde a versão 1.3.0 (2018-05-30), ampliado em 1.4.0 e 1.21.0
- **Confiança:** 🟢 na decisão · 🟢 na ampliação · 🟡 na motivação

## Contexto

Cinco dias após o primeiro *commit*, o autor quis permitir que o usuário reagisse a eventos do
quadro — mover cartão, criar cartão, rastrear tempo — com lógica própria. Sem servidor e sem
sistema de plugins, restava executar código local.

## Decisão

Carregar e executar `<workspace>/.vscode/vscode-kanban.js` como **módulo Node**, via
`vscode_helpers.loadModule` (`workspaces.ts:769`), sempre que um evento do quadro ocorrer e o
arquivo existir. Ao módulo são entregues argumentos que incluem `require` irrestrito e o
`ExtensionContext` completo.

A decisão foi ampliada duas vezes:

| Versão | Data | Ampliação |
|---|---|---|
| 1.3.0 | 2018-05-30 | Eventos de cartão despachados ao script |
| 1.4.0 | 2018-05-31 | `require()` acrescentado aos argumentos, *"which can also access the modules of that extension"* |
| 1.21.0 | 2018-07-04 | `canExecute` e `onExecute`: botão no cartão que roda função do usuário |

## Evidências

- `loadModule<EventScriptModule>(SCRIPT_FILE.fsPath)` (`workspaces.ts:769`)
- `require: (id) => require(toStringSafe(id))` (`workspaces.ts:629-633`)
- `extension: this.extension` nos argumentos (`workspaces.ts:620`)
- CHANGELOG 1.4.0 e 1.21.0
- Nenhuma verificação de confiança, confirmação ou allowlist em todo o caminho

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| Configuração declarativa (regras em JSON) | Menos poderosa; não cobriria integrações como o Toggl por script |
| `vm` do Node com contexto restrito | Exigiria decidir o que expor; `require` livre era mais simples e mais útil |
| Sistema de plugins publicados | Infraestrutura desproporcional a uma extensão de uma pessoa |
| Exigir confirmação do usuário na primeira execução | Provavelmente nem foi cogitado: em 2018 o **Workspace Trust do VS Code ainda não existia** (chegou em 2021, na versão 1.57) e a prática de executar código do workspace era comum |

## Consequências

**Positivas** 🟢
- Extensibilidade real: o usuário integra qualquer serviço sem tocar na extensão.
- O próprio modo `trackTime.type = "script"` é construído sobre esse mecanismo.
- O script pode manter estado entre eventos (`args.state`) e entre workspaces (`args.session`).

**Negativas** 🔴
- **Execução de código de terceiro com privilégios da extensão**, sem confirmação. Clonar um
  repositório com `.vscode/vscode-kanban.js` e mexer em qualquer cartão basta.
- Com `openOnStartup: true` no `settings.json` versionado do repositório, o quadro abre
  sozinho, reduzindo ainda mais a ação necessária do usuário.
- `args.extension` expõe `globalState` e `secrets` da extensão.
- Não há registro nem auditoria de qual script rodou.

## Contexto histórico importante 🟢

Julgar esta decisão pelos padrões de hoje seria anacrônico. Em 2018 o VS Code **não tinha**
Workspace Trust, e executar `.vscode/*.js` era prática difundida. O que mudou não foi o
código, e sim o ambiente: desde 2021 o editor oferece
`capabilities.untrustedWorkspaces` no manifesto, e a extensão **não o declara** — de modo que
hoje a omissão é uma escolha, ainda que por inércia.

## Status hoje

Vigente e **não mitigada**. Registrada como Q1 em `questions.md`. Qualquer evolução deveria,
no mínimo, declarar `untrustedWorkspaces` no `package.json` e exigir confirmação explícita na
primeira execução de um script novo — sem remover a capacidade, que é legítima e útil.
