# Investigação: número do cartão visível na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`

## 1. A pergunta de fundo

Por que um campo que existe desde a primeira versão, que ganhou forma legível em 2018 a pedido
de um usuário e que serve de endereço em toda conversa sobre o quadro nunca chegou à tela?

A extração responde por meia frase em `_reversa_sdd/domain.md#3.2 Cartões`: a issue #17 pediu
identificadores legíveis **para citar "o cartão 42" numa conversa**, e o autor entregou a
configuração `simpleIDs` com padrão verdadeiro — o único caso do histórico em que um padrão de
comportamento foi trocado depois de publicado. O identificador ficou legível; a interface
seguiu sem mostrá-lo. A leitura provável é que a citação imaginada acontecia com o arquivo
aberto ao lado, e não olhando o quadro. Oito anos depois, quem cita o número é um agente, e o
arquivo não está aberto ao lado.

O que confirma a lacuna: uma varredura por `\.id\b` sob `src/webview/ui/` encontra o
identificador em **um** lugar, `Column.tsx:121`, e ali ele serve de chave de reconciliação da
lista, nunca de texto. O diálogo de detalhes lista coluna, tipo, prioridade, categoria,
responsável e criação, e não o identificador.

## 2. Onde a regra pode morar

Três lugares eram possíveis, e o projeto já decidiu o assunto por outros meios.

| Lugar | O que pesa a favor | O que pesa contra |
|---|---|---|
| Dentro de `Card.tsx` | Nenhum arquivo novo | O projeto não tem renderizador de componentes em teste — nem `jsdom`, nem biblioteca de renderização nas dependências de desenvolvimento. Regra ali é regra sem teste possível |
| Em `use-board.ts`, ao montar a vista | O marcador chegaria pronto ao componente | Mistura apresentação com a montagem da vista visível, que hoje só filtra e ordena |
| **Em `src/webview/domain/`** | É onde mora a lógica testável, e o único alvo da suíte de cobertura obrigatória (`out/webview/domain/**`, piso de sessenta por cento) | Um arquivo a mais, de poucas linhas |

A terceira venceu por um motivo que não é de gosto: `package.json` mede cobertura **apenas**
de `out/webview/domain/**`. Regra escrita fora dali é regra que a suíte não vê.

## 3. Como este projeto verifica interface

Esta é a investigação que mais muda o plano, e vale registrá-la por extenso, porque contraria
o que se esperaria de um projeto com trinta arquivos de teste.

**Não existe teste de renderização.** As dependências de desenvolvimento não trazem
`jsdom`, `@testing-library/react` nem equivalente. Os testes de interface do projeto operam de
duas maneiras: verificam funções puras do domínio, ou **leem o código-fonte como texto**, com
os auxiliares de `src/test/sources.ts` (`sourceOf`, `sourcesUnder`, `withoutComments`,
`offenceReport`). É assim que `view-parity.unit.test.ts` prova que os dois layouts oferecem as
mesmas ações: lendo os fontes e constatando que ambos entregam o mesmo componente e as mesmas
ações.

**A evidência que pega defeito é o olho.** O cabeçalho de `scripts/preview.js` é explícito:
três defeitos passaram por uma suíte verde e só foram achados numa captura de tela — a coluna
que esmagava os cartões a vinte e oito pixels (cartão `[36]`), o quadro servido sem sistema de
design algum (cartão `[43]`) e o quadro que perdeu o significado das cores (cartões `[41]` e
`[46]`). O harness de pré-visualização nasceu disso: é o pacote real carregado num navegador
com hospedeiro fingido.

**E a pré-visualização não fecha o veredito.** O mesmo cabeçalho diz o que ela não alcança —
ciclo de vida do painel, ponte real, classes de tema que o editor escreve no corpo do
documento, qualquer coisa que toque o sistema de arquivos. Um cartão verificado por ela está
verificado para `testing`, jamais para `done`.

Consequência para esta feature: os critérios de aceite do `requirements.md` que falam em
"teste de renderização" se realizam como **teste de unidade da função pura** mais **leitura de
fonte** que prende o componente à função, e o resto é verificação na tela, primeiro no
navegador e depois no editor.

## 4. A divisão das folhas de estilo

`visual-literals.unit.test.ts` impõe três regras que não são a mesma escrita três vezes, e
errar qual é qual quebra a suíte:

1. Componentes sob `src/webview/ui/` não podem carregar literal visual — cor, raio, sombra,
   tamanho de fonte escritos à mão. Podem nomear variável do sistema de design.
2. `theme/board.css` e `theme/dialogs.css` declaram **geometria** e não podem pintar de forma
   alguma, nem por variável. É o que prova que, desligado o sistema de design, o quadro perde
   a cor.
3. `theme/appearance.css` existe para pintar, e cada declaração que pinta **tem de** nomear um
   token.

O precedente exato do marcador já está escrito: `vsckb-card-time` divide-se entre
`board.css`, onde recebe `overflow`, `text-overflow` e `white-space`, e `appearance.css`, onde
recebe `font-size: var(--text-caption-size)` e `color: var(--fgColor-muted)`. O marcador segue
o mesmo par.

## 5. Âncora de estilo ou classe simples

A camada de compatibilidade da feature `002` merece exame, porque parecia impor trabalho que
não impõe.

`anchors.ts` marca cada elemento com `data-vsckb="<nome>"` e devolve, no mesmo ato, os nomes de
classe que a versão 1.33.1 usava — dois atos que não podiam ficar separados, porque CSS não
tem apelido de seletor. `AnchorName` é tipo fechado, e `legacy-compat.unit.test.ts` guarda a
relação em três direções: todo nome que o mapa promete chega a algum elemento, nada do que foi
excluído entra sem querer, e **toda âncora declarada é carregada por algum elemento**.

O ponto que decide D-03 é a direção dessa terceira verificação. Ela vai de declarado para
carregado: uma âncora prometida que ninguém carrega é falha, porque o seletor do usuário
silenciosamente não casa com nada. O contrário não é verificado, de modo que um elemento com
classe nova e sem âncora não quebra nada. Como âncora é promessa que vive em
`interfaces/style-anchors.md` — artefato da feature `002`, que está pausada —, criar uma aqui
custaria alterar contrato de outra feature por um ganho que a classe já entrega.

Vale notar de passagem: o mapa legado tem `card-reference` e `card-references`, com os nomes
`vsckb-ref-badge` e `vsckb-list-of-linked-cards`, listados entre as âncoras que **nenhum
elemento carrega**. A versão 1.33.1 desenhava distintivos dos cartões vinculados, e a
interface atual não os desenha, porque o que o vínculo significa nunca foi decidido — é o
cartão `[13]` do quadro. Se um dia o vínculo for desenhado, ele mostrará números de cartão, e
o marcador desta feature é a peça que faltava para isso ser legível. Nada a fazer agora.

## 6. Quantos caracteres cabem

O identificador tem duas formas, e a escolha do teto depende de qual delas se está protegendo.

- **Simples**: o maior inteiro do quadro mais um (`card-id.ts:32-46`). Num quadro de
  cinquenta cartões, dois dígitos. Oito dígitos comportam qualquer quadro que este projeto
  venha a ter.
- **Longa**: `YYYYMMDDHHmmss_<aleatório>_<uuid sem hífens>` — quatorze mais até nove mais
  trinta e dois, mais dois separadores: perto de cinquenta e sete caracteres
  (`card-id.ts:55-61`).

Um teto de oito caracteres separa as duas formas limpo: a simples nunca é encurtada, a longa
sempre é, e o marcador nunca passa de oito caracteres visíveis — `[…f6a7b8]` tem exatamente
oito entre colchetes contando as reticências como um. É o que sustenta RF-05, que proíbe o
marcador de empurrar o título para linha extra.

A sessão de esclarecimento decidiu **os seis últimos**, e não o prefixo, por uma razão que a
forma longa deixa clara: o começo é o carimbo de tempo, idêntico entre cartões criados no mesmo
segundo, ao passo que o fim é uuid e discrimina.

## 7. Onde estão os casos negativos

O quadro do projeto tem cinquenta cartões, todos com identificador simples e distinto. Não
serve para ver o que a feature faz sem identificador, com identificador longo ou com
identificador repetido.

A fixture `_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/` existe
justamente para isso — nasceu para ser maltratada, diz o seu `README.md` — e é o que
`npm run preview -- --sandbox` serve. Os doze cartões dela cobrem empate de prioridade,
descrição em cadeia crua, prioridade suja, Markdown completo, cartão sem texto nenhum. Nenhum
cobre identidade, o que é natural: nenhuma feature anterior olhou para o identificador.

Três cartões novos fecham a lacuna, e o `README.md` da fixture, que documenta o que cada cartão
exercita, é atualizado junto. Cuidado ao posicioná-los: o roteiro de doze passos da feature
`001` exclui um cartão e limpa a coluna `Done`, consumindo os cartões `10` e `11`.

Um detalhe da pré-visualização a favor: ela serve o arquivo do quadro **sem passar pela
normalização da extensão**, de modo que um cartão sem `id` chega ao Webview sem `id`. No
editor real, `boards.ts` preencheria o campo na carga, e RF-10 quase nunca se manifestaria. A
pré-visualização é o único lugar onde esse caso pode ser visto.

## 8. Fontes

- `_reversa_sdd/domain.md#3.2 Cartões` — RD-06 a RD-13 e a nota sobre a origem de `simpleIDs`
- `_reversa_sdd/domain.md#3.6 Exportação` — RD-33, o nome do arquivo exportado
- `_reversa_sdd/code-analysis.md#Módulo 3 — boards` — normalização da carga
- `_reversa_sdd/addenda/002-primer-design-system.md` — adendo vigente sobre a aparência
- `src/webview/domain/card-id.ts` — as duas formas do identificador
- `src/webview/domain/identity.ts` — `__uid` e por que não se exibe
- `src/webview/ui/Card.tsx`, `src/webview/ui/anchors.ts` — o cartão e as âncoras
- `src/webview/theme/legacy-compat.ts` — o que a camada de compatibilidade devolve
- `src/test/visual-literals.unit.test.ts`, `src/test/legacy-compat.unit.test.ts`,
  `src/test/view-parity.unit.test.ts`, `src/test/sources.ts` — as regras da suíte
- `scripts/preview.js` e `scripts/preview/` — o harness de pré-visualização e seus limites
- `_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/README.md` — a fixture
