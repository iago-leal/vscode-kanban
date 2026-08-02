# Contrato: ponte de mensagens Webview ↔ extensão

> Identificador: `001-interface-react-tema-e-done`
> Tipo: fila assíncrona de mensagens (`postMessage`), local, sem rede
> Base: `_reversa_sdd/code-analysis.md#módulo-3--boards` (`src/boards.ts:1115-1262`)

## 1. Forma da mensagem

Inalterada nos dois sentidos:

```ts
{ command: string, data?: any }
```

Sem envelope, sem identificador de correlação, sem confirmação de recebimento. Não há
requisição e resposta emparelhadas: cada lado emite e segue. **Nenhuma mensagem é idempotente
por construção** — `saveBoard` duas vezes grava duas vezes.

## 2. Comandos existentes — congelados por RF-04

### 2.1 Webview → extensão

| Comando | `data` | Efeito | Muda? |
|---|---|---|---|
| `log` | `{ message: string }` | `console.log` e logger em nível debug | não |
| `onLoaded` | — | Recarrega o quadro, envia título, usuário e filtro | não |
| `openExternalUrl` | `{ url, text }` | Abre após confirmação do usuário | não |
| `openKnownUrl` | chave de `KNOWN_URLS` | Abre sem confirmação; a lista é fixa no código | não |
| `raiseEvent` | `{ name, data }` | Encaminha ao `raiseEvent` do Workspace | não |
| `reloadBoard` | — | Relê o JSON do disco | não |
| `saveBoard` | `Board` completo | Notifica os listeners de gravação | não |
| `saveFilter` | `string` | Notifica os listeners de filtro | não |

### 2.2 Extensão → Webview

| Comando | `data` | Efeito | Muda? |
|---|---|---|---|
| `setBoard` | `{ cards, settings }` | Substitui o quadro; gera `__uid` de cada cartão | não |
| `setTitleAndFilePath` | `{ title, filePath }` | Atualiza cabeçalho | não |
| `setCurrentUser` | `{ name }` | Define o usuário detectado | não |
| `moveCardTo` | `{ card: __uid, column }` | Move por comando de script | não |
| `setCardTag` | `{ card: __uid, tag }` | Grava `tag` por comando de script | não |
| `webviewIsVisible` | — | Sinaliza que o painel voltou a ficar visível | não |

**Nenhum campo, nome ou tipo acima é alterado pela feature.** O critério de aceite de RF-04
verifica exatamente isto.

## 3. Comandos novos

Dois, ambos **opcionais**: sem eles, o quadro abre nos padrões de `data-delta.md` §4. É o que
permite acrescentá-los sem violar a cláusula de RF-04 que proíbe tornar comando novo obrigatório
para o funcionamento básico.

### 3.1 `saveViewPreferences` — Webview → extensão

Emitido quando o usuário altera tema, ocultação, colapso ou modo de visualização.

```ts
{
    command: 'saveViewPreferences',
    data: {
        theme?: 'light' | 'dark' | 'follow-editor',
        hideDone?: boolean,
        collapsedColumns?: Array<'todo' | 'in-progress' | 'testing' | 'done'>,
        viewMode?: 'columns' | 'list'
    }
}
```

| Aspecto | Definição |
|---|---|
| Campos ausentes | Preservam o valor gravado. O payload é um delta, não um estado completo |
| Roteamento | `theme` vai para `globalState`; os demais para `workspaceState` chaveado por `fsPath` |
| Idempotência | **Sim.** Gravar o mesmo valor duas vezes tem o mesmo efeito de gravá-lo uma vez |
| Efeito colateral proibido | Não grava o quadro, não dispara evento ao script do usuário (RN-08, RF-25) |
| Erro de gravação | Registrado pelo logger com mensagem nomeada; a interface **não** reverte o estado visual, porque a preferência já vale para a sessão corrente |
| Valor desconhecido | Ignorado, com registro em log. Um `theme: 'sepia'` vindo de estado corrompido não derruba o quadro |
| Tempo limite | n/a — sem resposta esperada |

### 3.2 `setViewPreferences` — extensão → Webview

Emitido uma vez em resposta a `onLoaded`, antes ou depois de `setBoard`, sem ordem garantida.

```ts
{
    command: 'setViewPreferences',
    data: {
        theme: 'light' | 'dark' | 'follow-editor',
        hideDone: boolean,
        collapsedColumns: Array<ColumnKey>,
        viewMode: 'columns' | 'list'
    }
}
```

| Aspecto | Definição |
|---|---|
| Campos | Sempre completos, com os padrões preenchidos pela extensão |
| Precedência | Prevalece sobre o cache local de `vscode.getState()` usado na pintura otimista (D-06) |
| Ausência | Se a mensagem nunca chegar, o quadro segue com o cache local ou com os padrões. Não há tela de espera |
| Idempotência | **Sim** |
| Coerência | A extensão garante a invariante de `data-delta.md` §4: `hideDone` verdadeiro implica `'done'` em `collapsedColumns` |

## 4. Ordem de abertura

```
Webview                          Extensão
   |  onLoaded  ------------------->|
   |                                | lê quadro, filtro, usuário e preferências
   |<---------- setViewPreferences  |   (novo, opcional)
   |<---------- setBoard            |
   |<---------- setTitleAndFilePath |
   |<---------- setCurrentUser      |
```

O Webview **não pode** assumir ordem entre as quatro mensagens de volta. A pintura otimista de
D-06 existe justamente para que a ausência ou o atraso de `setViewPreferences` não produza tela
vazia nem piscar de tema.

## 5. O que a feature não faz nesta ponte

- Não introduz confirmação de recebimento, correlação nem transação. A gravação continua
  precedendo o disparo de evento, como descrito em `_reversa_sdd/architecture.md#52-alteração-de-cartão`.
- Não reduz o payload de `saveBoard`, que continua sendo o quadro inteiro.
- Não altera `raiseEvent`, que continua carregando `others` com cópia de todos os demais cartões
  (achado E6).
- Não muda a assimetria entre `openExternalUrl`, que confirma, e `openKnownUrl`, que não.
