# Legacy impact: número do cartão visível na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Âncora: legado — `_reversa_sdd/architecture.md` e `_reversa_sdd/domain.md`
> Gerado por: `/reversa-coding`

## 1. O que esta feature fez ao legado

Quase nada, e é esse o ponto. O identificador do cartão já existia, já era gravado, já era
atribuído na carga e já servia de endereço em conversa; o que faltava era a interface o
mostrar. Nenhuma regra de domínio foi alterada, nenhum campo nasceu ou mudou de forma, e
nenhum arquivo da extensão foi tocado. O delta inteiro é de **leitura**: um campo que estava
no arquivo e não chegava aos olhos passa a chegar.

Isso restringe o impacto ao módulo 7 do legado, `board-ui`, e dentro dele à camada que a
feature `001` criou. Os módulos `extension`, `workspaces`, `boards`, `html`, `toggl` e
`announcements` não participam: o identificador chega pronto ao Webview e a exibição não volta
pela ponte.

## 2. Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/webview/domain/card-number.ts` | `board-ui` — domínio do Webview | `componente-novo` | LOW | Módulo novo, sem precedente no legado. Não substitui nada e nada dependia dele até esta feature |
| `src/webview/ui/Card.tsx` | `board-ui` — cartão | `regra-nova` | MEDIUM | O texto do `<h3>` do título passa a conter o marcador, e o nome acessível do `<article>` passa a abrir por ele. É a única mudança desta feature que altera o que já era pintado |
| `src/webview/ui/dialogs/CardDetailsDialog.tsx` | `board-ui` — diálogo de detalhes | `regra-nova` | LOW | A lista de fatos ganha um par; os seis existentes não mudam de rótulo, de valor nem de ordem relativa |
| `src/webview/theme/appearance.css` | Aparência | `regra-nova` | LOW | Um seletor a mais, pintando por token. Nenhuma regra existente foi alterada |
| `src/webview/theme/board.css` | Geometria | `regra-nova` | LOW | Um seletor a mais, com margem e `white-space`. Nada que pinte |
| `src/test/card-number.unit.test.ts` | Suíte | `componente-novo` | LOW | Arquivo novo, descoberto por varredura. Nenhuma asserção existente foi alterada: a suíte foi de 268 para 270 casos, todos verdes |
| `.../001-…/reference/sandbox/.vscode/vscode-kanban.json` | Fixture de verificação | `delta-de-dados` | LOW | Três cartões ao fim de `Todo`, todos de prioridade 0. Os cartões `10` e `11`, que o roteiro de doze passos da feature `001` consome, ficaram intocados |
| `.../001-…/reference/sandbox/README.md` | Fixture de verificação | `regra-nova` | LOW | Três linhas na tabela, descrevendo o que cada cartão novo exercita |

Nenhum impacto CRITICAL ou HIGH. O mais alto é o MEDIUM de `Card.tsx`, e a seção 3 diz por
que ele não é maior do que parece.

## 3. Diff conceitual, por componente

### `board-ui` — domínio do Webview

Passa a existir um módulo que traduz `id` em texto exibível. A tradução tem três casos:
identificador ausente, vazio ou de brancos não produz marcador algum; até oito caracteres, o
valor sai entre colchetes; acima disso, saem reticências e os seis últimos caracteres. O
identificador é tratado como **texto** do começo ao fim, e nunca convertido a número — ler
`007` como sete poria na tela um valor que não está no arquivo, e o legado tolera
identificadores que não são inteiros (é justamente o que `nextSimpleCardId` ignora ao contar).

O módulo lê e nada mais. Não gera, não corrige, não renumera. A regra de geração continua onde
sempre esteve, em `card-id.ts` e em `boards.ts` — inclusive duplicada, que é o cartão `[12]`
do quadro e não era desta feature resolver.

### `board-ui` — cartão

Duas mudanças, e convém distingui-las porque uma é visível e a outra não.

A visível: o `<h3>` do título ganha um primeiro filho, um `<span class="vsckb-card-number">`,
omitido inteiramente quando não há identificador. Dentro do título, e não ao lado dele, porque
o título é bloco e um irmão abriria linha própria. A faixa do tipo era a outra candidata e foi
descartada: ela é omitida por completo em cartão sem tipo e sem botões, e o número sumiria
justamente nos cartões mais simples do quadro.

A invisível, e mais importante para quem for reextrair: o **nome acessível do cartão** deixou
de ser o título e passou a ser `[N] título`. Os rótulos dos quatro botões de ação continuam
recebendo o título puro. Antes desta feature havia uma variável só, `NAME`, servindo aos dois
propósitos; agora há duas, e confundi-las produziria `Edit '[5] Corrigir o editor'` quatro
vezes por cartão. A suíte prende as duas pontas: `card-number.unit.test.ts` lê o fonte e
exige que os quatro rótulos continuem interpolando `NAME`.

### `board-ui` — diálogo de detalhes

A lista de fatos ganha o par `Identifier`, à frente de `Column`, com o valor **integral** e sem
encurtamento. É o único lugar onde um identificador longo pode ser lido por inteiro, já que o
cartão mostra apenas a cauda. Travessão quando o cartão não tem identificador, como os demais
campos vazios da mesma lista já faziam.

### Aparência e geometria

A divisão que a feature `002` impôs foi respeitada, e é ela que `visual-literals.unit.test.ts`
guarda: `appearance.css` pinta e só nomeando token — `--text-caption-size`,
`--base-text-weight-normal`, `--fgColor-muted`, o mesmo par que `vsckb-card-time` já usava —,
enquanto `board.css` declara a margem e o `white-space` e não pinta de forma alguma. O peso é
declarado em vez de herdado porque o título é semibold, e um marcador do mesmo peso se leria
como parte dele.

## 4. Regras preservadas

Todas as regras 🟢 do `_reversa_sdd/domain.md` que passam perto desta feature continuam
intactas, e a maioria delas nem foi tocada, apenas lida:

| Regra | Enunciado | Como se sabe que sobreviveu |
|---|---|---|
| RD-06 | Título é o único campo obrigatório | O marcador é omitido quando não há `id`; o cartão sem identificador é pintado normalmente, e está na fixture para ser visto |
| RD-07 | Todo cartão recebe `id` na carga, se não tiver | Nenhum arquivo da extensão foi tocado. `git status src/extension.ts src/workspaces.ts src/boards.ts src/toggl.ts` sai limpo |
| RD-08 | Por padrão o `id` é um inteiro sequencial (`simpleIDs: true`) | A feature não lê nem escreve `simpleIDs`; ela reage ao **comprimento** do que chega, o que cobre os dois modos sem depender da configuração |
| RD-09 a RD-12 | Formato de `creation_time`, MIME dos textos, campo vazio some do JSON, `references` | Nada nesta feature escreve no arquivo. `git diff --stat .vscode/vscode-kanban.json` não mostra alteração |
| RD-33 | Um arquivo Markdown por cartão, nomeado por coluna, índice e título | A exportação ficou de fora por decisão registrada no escopo negativo: o nome do arquivo é contrato observado, e o `id` não entrou nele nem no corpo |
| Glossário, `__uid` | O `__uid` é efêmero de sessão e não deve ser exibido | O que a interface exibe vem de `CARD.id`, e `__uid` não é lido por nenhum arquivo desta feature |

Além dessas, a suíte inteira do projeto é evidência de preservação: 270 casos verdes, dos quais
268 já existiam e nenhum foi alterado para o verde acontecer.

## 5. Regras modificadas

Nenhuma regra 🟢 do `_reversa_sdd/domain.md` foi alterada ou removida. O que mudou é
comportamento da interface que a extração não registrava como regra de domínio, por a interface
nunca o ter feito:

| O que mudou | De | Para | Consequência a vigiar |
|---|---|---|---|
| Nome acessível do cartão | o título do cartão | `[N] título`, com o marcador à frente | Qualquer teste, script ou automação que localize um cartão pelo nome acessível exato deixa de casar. Nenhum existe hoje na suíte, mas é o que W001 vigia |
| Texto do `<h3>` do título na árvore do documento | só o título | marcador mais título | Algo que leia o título pela árvore passa a lê-lo com o marcador junto. Nada no projeto o faz — exportação, filtro e ordenação leem o cartão do arquivo, não da tela —, e é o que W002 vigia |
| Superfície de estilo do cartão | sem seletor para o número | `.vsckb-card-number` | Acréscimo, não renomeação: a folha de um usuário escrita contra a interface 1.33.1 continua valendo. O cartão `[35]` do quadro trata da nota de migração |

## 6. O que deliberadamente não foi tocado

- `src/extension.ts`, `src/workspaces.ts`, `src/boards.ts`, `src/toggl.ts` — a decisão D-09 do
  roadmap manda a feature inteira viver sob `src/webview/`, e mexer na geração de identificador
  a arrastaria para o território do cartão `[12]`.
- `.vscode/vscode-kanban.json` — o quadro do projeto é registro de trabalho real. Os três casos
  negativos foram para a fixture, que existe para ser maltratada.
- `src/webview/theme/legacy-compat.ts` — o marcador acrescenta classe e não renomeia nenhuma,
  de modo que o mapa de compatibilidade não tem nada de novo a mapear.
- `interfaces/style-anchors.md` da feature `002` — nenhuma âncora `data-vsckb` nova foi criada,
  por decisão D-03, justamente para não alterar artefato de uma feature pausada.

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-04 | Versão inicial gerada por `/reversa-coding` | reversa |
