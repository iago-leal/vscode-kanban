# Anúncios e Changelog — Design Técnico

> Unit da extração Reversa · 2026-08-02

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `showAnnouncements` | `(context: vscode.ExtensionContext)` | `Promise<void>` | Aviso único |
| passo 6 de `activate` | — | — | Exibição do CHANGELOG |

### Chaves no armazenamento global 🟢

| Chave | Valor de "já visto" | Escopo |
|---|---|---|
| `vsckbLastKnownVersion` | a versão exibida | usuário |
| `vsckb_announcement_20201009_655f729b` | exatamente `'3'` | usuário |

A chave do aviso embute a data de criação (09/10/2020) e um sufixo aleatório — convenção que
permitiria vários anúncios coexistindo, embora exista apenas um 🟡.

## Fluxo Principal

### CHANGELOG (`extension.ts:301-360`)

1. Lê `packageFile.version`, normalizada.
2. Compara com `globalState['vsckbLastKnownVersion']`.
3. Diferindo, resolve `../CHANGELOG.md` e verifica a existência.
4. Existindo, lê o conteúdo e cria um Webview `vscodeKanbanBoardChangelog` com
   `enableScripts: false`, `enableCommandUris: false` e `enableFindWidget: false`.
5. Converte o Markdown com `marked`, usando `{breaks, gfm, mangle, silent, sanitize}`.
6. No `finally`, grava a versão nova — **mesmo que a exibição tenha falhado**.

### Aviso (`announcements.ts:30-102`)

1. Lê a chave do aviso; valendo exatamente `'3'`, retorna sem fazer nada.
2. Exibe aviso com quatro opções: YES, "No, but DONATE", Later e "Don't show again".
3. Conforme a escolha:
   - **YES**: abre a issue 16 no GitHub; `doNotShowAgain` recebe **o retorno de `openExternal`**;
   - **DONATE**: abre um segundo diálogo; escolhendo a página do autor, mesmo mecanismo;
   - **Later** ou fechar: nada é gravado;
   - **Don't show again**: `doNotShowAgain` recebe `true`.
4. No `finally`, grava `'3'` se `doNotShowAgain` for verdadeiro.

## Fluxos Alternativos

- **`packageFile` indefinido** (falha ao ler o manifesto): a comparação não ocorre e nada é
  exibido (`extension.ts:305`) 🟢.
- **`CHANGELOG.md` ausente:** nada é exibido, mas a versão é registrada assim mesmo
  (`extension.ts:316-347`) 🟢.
- **Erro ao criar o Webview:** `tryDispose` no painel parcial e o erro é relançado, sendo
  capturado pelo `try` externo (`extension.ts:340-344`) 🟢.
- **Falha ao abrir o link externo:** `openExternal` devolve falso, o aviso não é silenciado e
  volta na ativação seguinte 🟢.
- **Usuário fecha o diálogo sem escolher:** equivale a "Later" 🟢.

## Dependências

- `extension` — ambas as rotinas rodam dentro de `activate`
- `marked` — conversão do CHANGELOG
- `fs-extra` — leitura do arquivo
- API do editor — `globalState`, `createWebviewPanel`, `showWarningMessage`, `openExternal`

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---|---|---|
| CHANGELOG num Webview sem scripts, ao contrário do quadro | `extension.ts:328` | 🟢 |
| Versão registrada mesmo quando a exibição falha | `extension.ts:352-358` | 🟢 |
| Chave de anúncio com data e sufixo aleatório | `announcements.ts:20` | 🟡 |
| Abrir o link com sucesso silencia o aviso | `announcements.ts:62`, `:84` | 🟢 |
| "Later" deliberadamente não grava nada | `announcements.ts:48-51` | 🟢 |
| Estado de escopo de usuário, não de workspace | `globalState` | 🟢 |
| Anúncio embutido no código, com TODO para fonte externa | `announcements.ts:31` | 🟢 |

## Estado Interno

Nenhum em memória 🟢. Todo o estado vive no armazenamento global do editor.

## Observabilidade

🔴 Nenhuma. Ambas as rotinas têm `try/catch` vazios: uma falha ao exibir o CHANGELOG ou o aviso
é indistinguível de não haver nada a exibir.

## Riscos e Lacunas

- 🟡 **`marked` com `sanitize` e `mangle`**: opções removidas nas versões seguintes da
  biblioteca. Atualizar a dependência exige mudar este código (`dependencies.md`, risco 6)
- 🟢 **Vínculo curioso entre abrir link e silenciar**: quem clica em YES e tem o navegador
  funcionando nunca mais vê o aviso, ainda que não tenha efetivamente ajudado; quem clica e
  falha ao abrir continua vendo
- 🟢 O aviso é de outubro de 2020 e convida a portar a extensão para React — é o registro mais
  claro de que a refatoração pretendida nunca aconteceu (ADR-003)
- 🟢 O TODO de carregar anúncios de fonte externa está sem ação há mais de cinco anos
- 🟡 O aviso é exibido a **todos** os usuários, em todos os workspaces, na primeira ativação
  após a instalação — inclusive hoje, para quem instalar a extensão pela primeira vez
