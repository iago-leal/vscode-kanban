# Adendo: o identificador do cartão passa a ser exibido

> Identificador da feature: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Cenário: `legado`
> Origem: `_reversa_forward/003-numero-visivel-do-cartao/`

Este adendo anota o que mudou no sistema depois da extração, para que quem leia
`_reversa_sdd/` — pessoa ou agente — não tome por corrente uma descrição já defasada. Ele não
corrige os artefatos da extração: aponta para eles e diz como devem ser lidos agora.

## Vigência

Vigente desde 2026-08-04.

## Resumo da entrega

O cartão sempre teve `id`, sempre o recebeu na carga e sempre serviu de endereço em conversa, sem
que nada na tela o revelasse: citar "o cartão [35]" obrigava a abrir o JSON. A feature põe o número
na face do cartão, nos dois layouts, e expõe o valor integral no diálogo de detalhes. O delta é
inteiramente de **leitura**: nenhum campo nasceu ou mudou de forma, nenhuma regra de domínio foi
alterada e nenhum arquivo da extensão foi tocado — o impacto se restringe ao módulo `board-ui` e,
dentro dele, à camada que a feature `001` criou.

**Entrega parcial.** Das 16 ações de `actions.md`, **15 estão concluídas** e resta `T016`, a
verificação dentro do editor: a build, o empacotamento como `1.35.6` e a instalação foram feitos, e
as duas regras de `.vsckb-card-number` foram conferidas no `main.css` do pacote instalado, mas
`Developer: Reload Window`, a repetição do roteiro §2.1 e a travessia do quadro pelo teclado com
leitor de tela só acontecem com alguém olhando. A verificação em navegador, pelo harness de
pré-visualização, já correu inteira nos dois layouts, nos dois temas e nos três casos negativos.
Uma reexecução deste sincronizador complementará o adendo quando `T016` fechar.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/architecture.md` | `#4` — Componentes e responsabilidades | componente-novo | Ao sucessor de `board-ui` acrescentou-se `src/webview/domain/card-number.ts`, único lugar que decide o que o marcador diz. Nasce consumido apenas por `Card.tsx`: lê e nada mais — não gera, não corrige, não renumera |
| `_reversa_sdd/architecture.md` | `#4`, componente do cartão | regra-nova | Duas mudanças em `Card.tsx`, e a segunda é a que importa para quem reextrair: o `<h3>` do título ganha um primeiro filho `<span class="vsckb-card-number">`, e o **nome acessível** do `<article>` deixou de ser o título e passou a `[N] título`. Os rótulos dos quatro botões de ação continuam recebendo o título puro; onde havia uma variável `NAME` servindo aos dois propósitos, agora há duas |
| `_reversa_sdd/architecture.md` | `#4`, diálogo de detalhes | regra-nova | A lista de fatos ganha o par `Identifier`, à frente de `Column`, com o valor **integral** e sem encurtamento. É o único lugar onde um identificador longo pode ser lido por inteiro, já que o cartão mostra apenas a cauda |
| `_reversa_sdd/architecture.md` | `#9.1`, dívida D1 | — (sem impacto) | A dívida "domínio no Webview, sem tipos nem testes" **continua de pé**, mas leia-a sabendo que o módulo novo entrou tipado e coberto por unidade: é o primeiro pedaço de domínio do Webview que não a exemplifica |
| `_reversa_sdd/domain.md` | `#2` — Glossário | regra-nova | O `id` deixou de ser identidade persistente apenas para o código e passou a ser campo **exibido**. O `__uid` continua jamais exibido, e é o que W004 vigia — nenhum arquivo desta feature o lê |
| `_reversa_sdd/domain.md` | `#3.2` — Cartões | — (sem impacto) | RD-07 e RD-08 intactas: nenhum arquivo da extensão foi tocado e a feature não lê nem escreve `simpleIDs`. Ela reage ao **comprimento** do que chega, o que cobre os dois modos sem depender da configuração |
| `_reversa_sdd/domain.md` | `#3.3` — Ordenação e apresentação | regra-nova | A apresentação do cartão passa a ter uma regra de largura que a extração não registrava, por a interface nunca ter exibido o campo: até oito caracteres o `id` sai íntegro entre colchetes; acima disso, saem reticências e os seis últimos, com a cadeia inteira no atributo de título. O `id` é tratado como texto do começo ao fim, nunca convertido a número. RD-14 a RD-19 seguem sem alteração |
| `_reversa_sdd/domain.md` | `#3.6` — Exportação | — (sem impacto) | RD-33 intacta: o `id` não entrou no nome do arquivo `.card.md` nem no corpo. A exportação ficou fora por escopo negativo, e W002 vigia o dano pelo outro lado — nada que leia o título deve passar a lê-lo pela árvore do documento, onde agora ele vem com o marcador colado |
| `_reversa_sdd/data-dictionary.md` | `#2` — `BoardCard` | — (sem impacto) | Nenhum campo nasceu, mudou de forma ou de obrigatoriedade. A seção "Geração de `id` na carga" continua descrevendo a única regra de geração que existe, e ela permanece duplicada entre `card-id.ts` e `boards.ts` — o cartão `[12]` do quadro, que não era desta feature resolver |

Contagem por tipo: **4** `regra-nova`, **1** `componente-novo`, **4** linhas sem impacto sobre o
artigo apontado. Nenhum `regra-alterada`, `regra-removida`, `componente-extinto`,
`delta-de-contrato-externo` — nem `delta-de-dados` sobre o modelo da extração.

Houve um delta de dados, mas **fora** dos artefatos da extração e fora do quadro do projeto: três
cartões ao fim da coluna `Todo` da fixture de verificação da feature `001` — um sem `id`, um de `id`
longo e um par de `id` repetido —, que existem para exercitar os casos negativos. Detalhe em
`legacy-impact.md` §2 da feature.

## Regras sob vigilância

`W001`, `W002`, `W003`, `W004`, `W005`, `W006`, `W007`.

Conteúdo e critério de violação de cada um em
`_reversa_forward/003-numero-visivel-do-cartao/regression-watch.md`, que traz também cinco
observações sem peso de regressão — entre elas o teto de oito caracteres e a cauda de seis, que são
números escolhidos e não derivados, e a decisão de não sinalizar identificador repetido.

## Fontes

- `_reversa_forward/003-numero-visivel-do-cartao/legacy-impact.md`
- `_reversa_forward/003-numero-visivel-do-cartao/regression-watch.md`
- `_reversa_forward/003-numero-visivel-do-cartao/requirements.md`
- `_reversa_forward/003-numero-visivel-do-cartao/actions.md`
- `_reversa_forward/003-numero-visivel-do-cartao/progress.jsonl`
