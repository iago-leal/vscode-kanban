# Regression watch: número do cartão visível na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Gerado por: `/reversa-coding`

Este arquivo existe para a **próxima extração**. Quando `/reversa` rodar de novo sobre este
código, cada item abaixo é uma afirmação que precisa continuar verdadeira; um item violado é
regressão, não descoberta. O agente reverso preenche a seção "Histórico de re-extrações" ao
conferi-los.

## 1. Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após a mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `src/webview/ui/Card.tsx`, `aria-label` do `<article>` | O nome acessível do cartão abre pelo marcador — `[5] Foo` para o cartão de `id` `5` e título `Foo` — e os rótulos dos quatro botões de ação (`Execute`, `Track time of`, `Edit`, `Move`, mais `Details of` e `Delete`) continuam citando **só** o título | `redação` | Um rótulo de botão passando a conter colchete, ou o `aria-label` do cartão voltando a ser o título puro. O primeiro alonga quatro anúncios por cartão; o segundo desfaz RF-06 |
| W002 | `_reversa_sdd/domain.md#3.6`, RD-33 e a exportação | Nada que leia o título do cartão o leia pela **árvore do documento**. Exportação, filtro e ordenação continuam lendo o cartão do arquivo, onde o título não tem marcador | `ausência` | Código novo de exportação, de filtro, de ordenação ou de busca que use `textContent` do `<h3>` ou do `.vsckb-card-title`. O título sairia com `[N]` colado, e o nome do arquivo `.card.md` mudaria — contrato observado que RD-33 fixa |
| W003 | `src/webview/domain/card-number.ts` | A regra do marcador vive **inteira** no domínio, e o cartão a pede em vez de recalculá-la. Nenhum colchete literal nem fatiamento de cadeia dentro de `Card.tsx` | `presença` | Um segundo lugar decidindo o que o marcador diz. É a falha que `card-id.ts` e `boards.ts` já cometeram, e que o cartão `[12]` do quadro registra: duas cópias que divergem produzem identidades inconsistentes |
| W004 | `_reversa_sdd/domain.md#2 Glossário` | O `__uid` continua **jamais** exibido. O que a tela mostra é `CARD.id` | `ausência` | Qualquer leitura de `__uid` em `Card.tsx`, em `CardDetailsDialog.tsx` ou em `card-number.ts`. O `__uid` muda a cada carga e citá-lo não endereça nada entre sessões |
| W005 | `src/webview/theme/appearance.css` e `board.css` | O marcador é pintado **só** em `appearance.css` e só nomeando token; a geometria fica em `board.css`, que não pinta nem por variável | `presença` | Cor, tamanho de fonte ou peso aparecendo em `board.css`, ou valor literal em `appearance.css`. Desligado o sistema de design, o quadro tem de perder a cor, e não perde se uma segunda folha a redeclara |
| W006 | `_reversa_sdd/domain.md#3.2`, RD-07 e RD-08 | A exibição não gera, não corrige e não renumera identificador algum. A regra de geração continua fora de `src/webview/ui/` e de `src/webview/domain/card-number.ts` | `ausência` | `card-number.ts` importando de `card-id.ts`, ou escrevendo em `CARD.id`. Renumerar quebraria `references` e os scripts do usuário |
| W007 | `src/webview/ui/dialogs/CardDetailsDialog.tsx` | A linha `Identifier` mostra o valor **integral**, sem encurtamento, e é o único lugar onde um identificador longo pode ser lido por inteiro | `redação` | O diálogo passando a usar `cardNumberLabel`. O cartão já mostra a forma curta; repeti-la no diálogo fecharia a única saída para a cadeia completa |

Nenhum item acima nasceu de regra 🟡 ou 🔴: todos ou derivam de regra 🟢 do
`_reversa_sdd/domain.md`, ou de decisão da feature que a suíte já prende com asserção.

## 2. Observações, sem peso de regressão

Estas vieram de regras 🟡 ou de escolhas que podem legitimamente mudar de ideia. Um item
violado aqui é **decisão revista**, não regressão:

- **Corte pelos seis últimos caracteres** (RN-05, 🟡). O teto de oito caracteres e a cauda de
  seis são números escolhidos, não derivados. Se o quadro de alguém passar a ter identificadores
  simples de nove dígitos, o teto é o que se mexe, e mexer nele é ajuste, não defeito.
- **Repetição sem sinal** (RN-04, 🟡). Dois cartões com o mesmo `id` mostram o mesmo número e
  nada mais. Foi decidido pelo preço: detectar duplicata custaria varredura por pintura e uma
  variedade de cartão a mais. Se o quadro deixar de ser de mantenedor único, a conta muda.
- **Balão só quando houve corte** (D-07, 🟢 de decisão, 🟡 de origem). Balão que repete o que
  está escrito é ruído; se o projeto passar a usar balão como confirmação em toda parte, este
  item deixa de destoar.
- **Número fora do formulário de edição e da exportação** (escopo negativo). Foi decidido na
  sessão de esclarecimento de 2026-08-04, não esquecido. Levar o número à exportação renomearia
  toda exportação existente, o que W002 vigia pelo lado do dano.
- **Sem âncora `data-vsckb` para o marcador** (D-03, 🟡). A classe basta e não cria promessa
  nova enquanto a feature `002` está pausada. Retomada a `002`, promover o marcador a âncora é
  escolha aberta.

## 3. Histórico de re-extrações

> Vazio. A próxima execução de `/reversa` preenche esta seção ao conferir os itens do watch.

| Data | Extração | Itens verdes | Itens violados | Observação |
|---|---|---|---|---|
| — | — | — | — | — |

## 4. Arquivadas

> Vazio. Um item vem para cá quando a regra que ele vigia deixa de existir por decisão
> registrada, e não por descuido.

## 5. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-04 | Versão inicial gerada por `/reversa-coding`, com W001 a W007 | reversa |
