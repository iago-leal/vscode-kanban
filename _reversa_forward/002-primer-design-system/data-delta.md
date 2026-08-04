# Delta de dados: quadro sobre sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Base de comparação: `_reversa_sdd/erd-complete.md`, `_reversa_sdd/data-dictionary.md` e
> `_reversa_forward/001-interface-react-tema-e-done/data-delta.md`

## 1. Veredito em uma linha

**O modelo persistido do quadro não muda, e o modelo de exibição muda num único ponto:** a
preferência de tema deixa de admitir três valores e passa a admitir quatro. Todo o resto do
`ViewState` fica exatamente como a feature `001` o deixou.

## 2. Entidades inalteradas

| Entidade | Onde vive | Mudança |
|---|---|---|
| `Board` | `.vscode/vscode-kanban.json` | nenhuma |
| `BoardCard` | dentro de `Board` | nenhuma |
| Colunas `todo`, `in-progress`, `testing`, `done` | chaves de `Board`, constante `BOARD_COLMNS` (`boards.ts:388`) | nenhuma, inclusive o erro de digitação da constante (G-20) |
| Filtro | `.vscode/vscode-kanban.filter` | nenhuma |
| Exportações | `<exportPath>/*.card.md` | nenhuma |
| Estado global do aviso | `globalState` | nenhuma |
| Campo efêmero `__uid` | gerado na recepção de `setBoard` | nenhuma. Mesma fórmula, mesmo número mágico, mesma regeneração a cada carga |

A semântica de `references` continua indefinida (G-02) e esta feature, como a anterior, **não** a
define. Está no escopo negativo e permanece como cartão próprio do quadro do projeto.

## 3. Delta no `ViewState`

O tipo muda em um lugar só:

```ts
// antes, feature 001
type ThemePreference = 'light' | 'dark' | 'follow-editor';

// depois, feature 002
type ThemePreference = 'light' | 'dark' | 'high-contrast' | 'follow-editor';
```

Os demais membros do `ViewState` — `hideDone`, `collapsedColumns` e `viewMode` — não mudam de tipo,
de padrão nem de invariante. A invariante de coerência entre `hideDone` e `collapsedColumns`
permanece: `hideDone` verdadeiro implica `'done'` presente em `collapsedColumns`.

### 3.1 Efeito no ciclo do controle de tema

O ciclo declarado em `src/webview/domain/view-state.ts:26` passa de três para quatro estados:

```ts
// antes
export const THEME_CYCLE: ThemePreference[] = ['follow-editor', 'light', 'dark'];

// depois
export const THEME_CYCLE: ThemePreference[] = ['follow-editor', 'light', 'dark', 'high-contrast'];
```

**Atenção ao teste existente.** `src/test/view-state.unit.test.ts` verifica, por RF-07 da
feature `001`, que **três** acionamentos consecutivos retornam ao estado inicial. Com quatro estados,
passam a ser quatro acionamentos. Esta é a **única asserção de teste que esta feature precisa
alterar**, e a alteração é consequência direta da resposta 5a somada a RF-09, não relaxamento de
critério. Todo o resto da suíte permanece intocado, conforme RF-02.

O `requirements.md` desta feature reformula o critério em RF-07 sem fixar o número três, de modo que
a exigência passa a ser "percorrer todos os estados e retornar ao inicial", que é o que a regra
sempre quis dizer.

### 3.2 Efeito na resolução do tema

A função de resolução em `src/webview/domain/view-state.ts:64` recebe um caso a mais. A regra de
`'follow-editor'` não muda: continua espelhando o tema do editor, e o alto contraste só é aplicado
por escolha explícita, nunca por dedução do editor. Isso preserva RF-08 e RF-09 da feature `001`.

## 4. Delta na persistência das preferências

Nenhuma mudança de **local**. Vale D-04 da feature `001`: preferência de tema em `globalState`,
válida para a instalação; ocultação, colapso e modo de visualização em `workspaceState`, por pasta.

O que muda é o conjunto de valores aceitos em `globalState`, e por isso existe conversão de entrada.

| Situação na leitura | Comportamento |
|---|---|
| Valor gravado é `'light'`, `'dark'` ou `'follow-editor'` | Aceito como está. Preferências gravadas pela feature `001` continuam válidas |
| Valor gravado é `'high-contrast'` | Aceito. Só pode ter sido gravado por esta versão ou posterior |
| Valor gravado é desconhecido, ausente ou de tipo errado | Cai no padrão `'follow-editor'`, como já fazia `isThemePreference` em `view-state.ts:223`. Nenhum código novo é necessário |

**Migração de dados: nenhuma.** A conversão é de leitura, e o guarda de tipo que a implementa já
existe. Uma instalação que volte da versão desta feature para a anterior encontra `'high-contrast'`
gravado, não o reconhece e cai no padrão, sem erro e sem perda: a degradação é graciosa nos dois
sentidos.

## 5. Delta no protocolo de mensagens

Os comandos `saveViewPreferences` e `setViewPreferences`, criados por D-05 da feature `001`,
permanecem com nome e forma idênticos. O único delta é o conjunto de valores que o campo `theme`
transporta, ampliado conforme §3.

Isso **não** é alteração de contrato no sentido de RF-03: o campo já era do tipo `ThemePreference`, e
o contrato sempre foi definido pelo tipo, não pela enumeração literal dos valores no documento. Está
registrado aqui por honestidade, para que quem ler o contrato da feature `001` saiba onde procurar a
diferença.

## 6. Delta nos arquivos servidos ao Webview

Não é modelo de dados no sentido estrito, mas é estado em disco que a extensão lê e serve, e por isso
entra aqui.

| Arquivo | Situação |
|---|---|
| `src/webview/theme/tokens.css` | **Extinto** (D-19) |
| Arquivos de tema do sistema adotado | **Novos**, importados pelo pacote, um por conjunto oferecido |
| `src/webview/theme/board.css` | Mantido, encolhido à geometria de quadro (D-21) |
| `src/webview/theme/legacy-compat.css` | **Novo**, gerado a partir do mapa de `interfaces/legacy-class-map.md` (D-22) |
| `src/res/css/hljs-atom-one-dark.css` | Deixa de ser folha única de tema escuro fixo; passa a haver conjunto claro e escuro, escolhidos pelo modo de cor ativo (D-26) |
| `.vscode/vscode-kanban.css` | Inalterado em local e em precedência: continua sendo a **última** folha da cascata |

## 7. O que continua sem definição

As lacunas registradas em `_reversa_sdd/gaps.md` não são tocadas por esta feature, e nenhuma delas
bloqueia a entrega:

- G-02, semântica do vínculo entre cartões via `references`.
- G-20, erro de digitação na constante `BOARD_COLMNS`, preservado porque corrigi-lo é mudança de
  comportamento disfarçada de correção ortográfica.
- G-21, origem do número mágico na fórmula de `__uid`, preservado pela mesma razão da feature `001`.
