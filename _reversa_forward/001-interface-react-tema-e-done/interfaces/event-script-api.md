# Contrato: API dos scripts de evento do usuário

> Identificador: `001-interface-react-tema-e-done`
> Tipo: módulo Node carregado do workspace (`.vscode/vscode-kanban.js`)
> Base: `_reversa_sdd/domain.md#38-eventos-e-extensibilidade` (RD-42 a RD-48),
> `_reversa_sdd/code-analysis.md#algoritmo-1--despacho-de-eventos` (`src/workspaces.ts:600-886`)

## 1. Por que este contrato entra no plano

É a única superfície **pública para terceiros** do sistema. Um usuário escreveu código contra
ela, esse código vive no repositório dele, e a extensão o executa. Diferente da ponte interna,
aqui não há como coordenar uma migração: quebrar o contrato quebra automação alheia em silêncio.
G-12 registra que ele nunca foi versionado.

**Veredito da feature: contrato inalterado em tudo.** Esta ficha existe para tornar a promessa
verificável, não para descrever mudança.

## 2. Funções exportadas — congeladas por RF-05

| Evento interno | Função do script | Momento de disparo |
|---|---|---|
| `card_created` | `onCardCreated` | Após gravar o quadro com o cartão novo |
| `card_deleted` | `onCardDeleted` | Após gravar o quadro sem o cartão |
| `card_moved` | `onCardMoved` | Após gravar o quadro com o cartão na coluna nova |
| `card_updated` | `onCardUpdated` | Após gravar o quadro com o cartão editado |
| `column_cleared` | `onColumnCleared` | Após limpar Done em massa |
| `execute_card` | `onExecute` | Ao acionar o botão de execução, quando `canExecute` está ligado |
| — | `onTrackTime` | Ao acionar o rastreamento de tempo com `trackTime` do tipo `script` |
| qualquer | `onEvent` | Recuo, quando a função específica não existe |

Sete eventos nomeados mais o recuo, exatamente como hoje (`workspaces.ts:786-819`).

## 3. Invariantes que a feature precisa preservar

| # | Invariante | Origem | Como se verifica |
|---|---|---|---|
| I-1 | A gravação do quadro **precede** o disparo do evento | RD-42, RD-47 | Um script que leia o arquivo dentro do handler já enxerga a alteração |
| I-2 | Todo evento carrega `others`, cópia de todos os demais cartões | `board.js:1473`, achado E6 | Contar os cartões em `args.others` e comparar com o total menos um |
| I-3 | A identidade usada nos eventos é `__uid`, efêmero e regenerado a cada carga | `board.js:2013` | Um script que guarde `__uid` entre sessões falha — e precisa continuar falhando do mesmo jeito |
| I-4 | `setTag` e os quatro `moveTo*` continuam disponíveis nos argumentos | `workspaces.ts:863-877` | Chamar cada um dentro do handler e observar `setCardTag` e `moveCardTo` chegando ao Webview |
| I-5 | Um `moveTo*` dentro do handler provoca **nova** gravação, sem transação | `_reversa_sdd/state-machines.md#1-cartão--posição-no-quadro` | Contar as gravações do arquivo num roteiro com script reativo |
| I-6 | Alternar tema, ocultação, colapso ou modo **não dispara nenhum evento** | RN-08, RF-25 | Roteiro da §7 do `onboarding.md`: trinta alternâncias, zero linhas no log |
| I-7 | `globals` da configuração continua acessível dentro do script | `package.json` (`kanban.globals`) | Ler `args.globals` no handler |

I-6 é a única linha nova deste contrato, e é uma promessa de **ausência**: a feature acrescenta
três controles e nenhum deles fala com o script.

## 4. Como isto é verificado no `actions.md`

O critério de aceite de RF-05 exige que "um script de evento que registra cada chamada produza a
mesma sequência de eventos para o mesmo roteiro de ações". A verificação concreta:

1. Gravar a sequência de eventos produzida pelo roteiro de doze passos na versão **anterior**,
   antes de começar a implementação, com o script de `onboarding.md` §7.
2. Guardar esse log como referência dentro da feature.
3. Repetir o roteiro na versão nova e comparar linha a linha.

Sem o passo 1 executado **antes** da reescrita, não há referência com que comparar depois. É
uma dependência de ordem, não de esforço, e por isso precisa aparecer cedo no `actions.md`.

## 5. O que a feature deliberadamente não corrige

- A ausência de transação entre gravação e evento (I-5), que permite ao script provocar segunda
  gravação sem poder desfazer a primeira.
- O custo de `others` em quadros grandes (I-2).
- A ausência de versionamento do próprio contrato (G-12). Continua sem número de versão e sem
  garantia declarada.
- A execução do script **sem confirmação nem Workspace Trust**, que é o achado crítico C1 e o
  cartão [5] do quadro do projeto. Está no escopo negativo do `requirements.md` §6, e a feature
  apenas não pode ampliá-lo.
