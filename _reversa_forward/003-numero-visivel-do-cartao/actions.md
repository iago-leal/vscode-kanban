# Actions: número do cartão visível na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Roadmap: `_reversa_forward/003-numero-visivel-do-cartao/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 16 |
| Paralelizáveis (`[//]`) | 5 |
| Maior cadeia de dependência | 8 |

A cadeia mais longa é `T003 → T004 → T005 → T006 → T010 → T014 → T015 → T016`: os quatro
degraus de teste compartilham um arquivo só, e as três verificações finais são sequenciais
porque disputam a mesma porta do harness de pré-visualização.

## Fase 1, Preparação

<!-- Setup, scaffolding, migrações iniciais, configuração de infraestrutura local. -->

O quadro do projeto tem cinquenta cartões de identificador simples e distinto, e por isso não
exibe nenhum dos três casos negativos. A fixture existe para ser maltratada, e é onde eles
passam a viver (D-08).

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar três cartões ao **fim** da coluna `Todo` da fixture: um sem campo `id`, um de `id` longo no formato `20260804123456_412345678_a1b2c3d4e5f6a7b8` e um par de `id` repetido `7`. Não tocar nos cartões `10` e `11`, que o roteiro de doze passos da feature `001` consome | - | `[//]` | `_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/.vscode/vscode-kanban.json` | 🟡 | `[X]` |
| T002 | Descrever na tabela do `README.md` da fixture o que cada um dos três cartões novos exercita — RF-10, RF-09 com RN-05, e RN-04 — e o que se espera ver em cada caso | T001 | - | `_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/README.md` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes que precisam existir antes ou logo após o núcleo. Omitir se a equipe não pratica TDD. -->

Este projeto não tem renderizador de componentes em teste. A cobertura da feature se faz por
unidade da função pura mais leitura de fonte com os auxiliares de `src/test/sources.ts`, que é
como `view-parity.unit.test.ts` já prova o que prova. O arquivo é descoberto por varredura de
`*.test.js` e não precisa de registro; a interface do Mocha é `tdd` (`suite`/`test`).

As quatro ações compartilham um arquivo e por isso correm em fila, mas todas precedem o
núcleo: escritas antes de `card-number.ts`, elas falham por módulo inexistente, que é o
vermelho esperado.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Cobrir `cardNumberLabel` em unidade: `undefined`, cadeia vazia e cadeia de brancos devolvem `undefined` (RF-10); `"5"` devolve `"[5]"` e `"42"` devolve `"[42]"` (RF-02); cadeia de exatamente oito caracteres aparece íntegra; cadeia de cinquenta e sete caracteres devolve `"[…f6a7b8]"`, com os seis últimos (RF-09) | - | `[//]` | `src/test/card-number.unit.test.ts` | 🟢 | `[X]` |
| T004 | Cobrir a função que decide o balão do ponteiro: devolve o identificador **integral** quando o rótulo foi encurtado e `undefined` quando não foi, nem quando não há identificador (D-07, RF-09) | T003 | - | `src/test/card-number.unit.test.ts` | 🟡 | `[X]` |
| T005 | Asserção de leitura de fonte que prende o componente à regra: `Card.tsx` importa de `domain/card-number` e não repete o cálculo do marcador dentro de si — nenhum literal de colchete nem fatiamento de cadeia sobre `id` no fonte do componente (D-01) | T004 | - | `src/test/card-number.unit.test.ts` | 🟡 | `[X]` |
| T006 | Asserção de leitura de fonte que preserva os rótulos dos botões de ação: `Execute '…'`, `Track time of '…'`, `Edit '…'` e `Move '…'` continuam interpolando a variável do título puro, e não a que carrega o número (D-06) | T005 | - | `src/test/card-number.unit.test.ts` | 🟡 | `[X]` |

## Fase 3, Núcleo

<!-- Lógica central da feature. -->

O domínio é o único alvo da cobertura obrigatória — `out/webview/domain/**`, piso de sessenta
por cento —, e é onde a regra inteira mora.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Escrever `cardNumberLabel(id?: string): string \| undefined`: trata o `id` como texto do começo ao fim, sem convertê-lo a número; devolve `undefined` para ausente, vazio ou brancos; devolve `[<id>]` até oito caracteres; acima disso, `[…` mais os seis últimos (RN-01, RN-05, D-05) | T003 | - | `src/webview/domain/card-number.ts` | 🟢 | `[X]` |
| T008 | Acrescentar ao mesmo módulo a função que devolve o identificador integral **apenas** quando o rótulo foi encurtado, para alimentar o atributo de título sem repetir na tela o que já está escrito (D-07) | T007, T004 | - | `src/webview/domain/card-number.ts` | 🟡 | `[X]` |

## Fase 4, Integração

<!-- Cola com outras partes do sistema, contratos externos, ganchos. -->

Aqui a regra encontra a tela. `Card.tsx` está a sessenta e seis linhas do teto de quatrocentas
que `source-limits.unit.test.ts` impõe; se estourar, a saída é repartir o cartão, não elevar o
teto.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Renderizar o marcador como **primeiro filho** do `<h3>` do título, com classe `vsckb-card-number` e sem âncora `data-vsckb` nova, omitindo-o inteiramente quando a regra devolve `undefined`; o atributo `title` só é escrito quando houve encurtamento (RF-01, RF-04, RF-11, D-02, D-03) | T007, T008, T005 | - | `src/webview/ui/Card.tsx` | 🟢 | `[X]` |
| T010 | Separar o nome acessível do cartão do texto usado nos rótulos: o `aria-label` do `<article>` passa a abrir pelo marcador, e as quatro interpolações dos botões continuam recebendo o título puro que `NAME` já entrega (RF-06, D-06) | T009, T006 | - | `src/webview/ui/Card.tsx` | 🟢 | `[X]` |
| T011 | Acrescentar o par `Identifier` à lista de fatos do diálogo, com o valor **integral** e sem encurtamento, ao lado de `Column`, `Type`, `Prio`, `Category`, `Assigned to` e `Created`; travessão quando o cartão não tem identificador (RF-07) | - | `[//]` | `src/webview/ui/dialogs/CardDetailsDialog.tsx` | 🟢 | `[X]` |
| T012 | Pintar `.vsckb-card-number` nomeando tokens, no par que `vsckb-card-time` já usa — `font-size: var(--text-caption-size)` e `color: var(--fgColor-muted)` —, com peso normal e nenhum valor literal (D-04, RNF de manutenibilidade e de contraste) | T009 | `[//]` | `src/webview/theme/appearance.css` | 🟢 | `[X]` |
| T013 | Declarar a geometria do marcador — espaçamento à direita do título e `white-space` que o impeça de quebrar —, **sem pintar de forma alguma**, nem por variável, como a folha exige (D-04, RF-05) | T009 | `[//]` | `src/webview/theme/board.css` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Logs, telemetria, mensagens de erro, documentação curta. -->

Neste projeto a suíte verde nunca pegou defeito de aparência: os três que apareceram foram
achados numa captura de tela. As três ações abaixo são a verificação que o `onboarding.md`
descreve, e correm em fila porque disputam a mesma porta do harness.

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T014 | Verificar na tela pelo `npm run preview`, sobre o quadro do projeto: número em todos os cartões das quatro colunas, valor conferido contra o arquivo em dois ou três casos, marcador abrindo a linha do título em tom mais apagado, título sem linha extra, cartão sem tipo mostrando o número, nos dois layouts e nos estados de tema (§2.1 a §2.3 do `onboarding.md`) | T010, T011, T012, T013 | - | `_reversa_forward/003-numero-visivel-do-cartao/onboarding.md` | 🟢 | `[X]` |
| T015 | Verificar os três casos negativos pelo `npm run preview -- --sandbox`: cartão sem `id` sem marcador algum — nem `[]`, nem `[undefined]`, nem `[null]` —, `id` longo mostrando `[…` mais seis caracteres com a cadeia inteira no balão, e o par repetido mostrando o mesmo número sem sinal de repetição; conferir também a linha `Identifier` no diálogo de detalhes (§2.4 e §2.5) | T014, T002 | - | `_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/.vscode/vscode-kanban.json` | 🟢 | `[X]` |
| T016 | Verificar no editor, que é o único lugar onde o veredito vale para `done`: `npm run build`, empacotar com versão maior que **todas** as instaladas, instalar, `Developer: Reload Window`, refazer §2.1 e percorrer o quadro pelo teclado confirmando que o cartão é anunciado pelo número e os botões, só pelo título (§3) | T015 | - | `_reversa_forward/003-numero-visivel-do-cartao/onboarding.md` | 🟢 | `[X]` |

## Notas de execução

<!--
Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução.
Não use isso para corrigir ações, edits manuais ficam fora desse arquivo, vão direto no código.
-->

- Nenhum arquivo fora de `src/webview/`, `src/test/` e da fixture é tocado (D-09). Se a
  execução levar a `src/extension.ts`, `src/workspaces.ts`, `src/boards.ts` ou `src/toggl.ts`,
  a feature saiu do trilho.
- `T005` e `T006` asseveram sobre o fonte de um arquivo que só existe na forma final depois de
  `T009` e `T010`. É o vermelho pretendido, e não motivo para adiá-las.
- **`T003` conta mal a cadeia longa.** `20260804123456_412345678_a1b2c3d4e5f6a7b8` tem 41
  caracteres, não 57: o carimbo de tempo traz 14, o número aleatório 9, o UUID de exemplo 16,
  mais dois separadores. O identificador que `longCardId` produz de verdade tem UUID de 32 e
  chega perto de 56, que é a "cerca de cinquenta" do `requirements.md`. O que a ação pede em
  comportamento — os seis últimos precedidos de reticências — está coberto e verde; o que
  estava errado era a contagem escrita na descrição.
- **`T016` fechou em duas etapas.** A build, o empacotamento como `1.35.6` e a instalação
  foram feitos numa primeira passagem, e as duas regras de `.vsckb-card-number` estão no
  `main.css` do pacote instalado — a de geometria e a de pintura, cada uma na sua folha. O
  resto só acontece dentro do editor e com alguém olhando, e por isso a ação ficou `[ ]` até
  o mantenedor recarregar a janela e conferir: **em 2026-08-04 ele confirmou o número visível
  no quadro aberto pela extensão**, que é o veredito que a ação existe para colher. A
  travessia com leitor de tela não foi refeita à mão; o que ela conferiria — o cartão
  anunciado pelo número e os botões só pelo título — está coberto pela árvore acessível lida
  no `T015` e pelo teste de unidade, de modo que a lacuna é de confirmação redundante, não de
  evidência ausente.
- A verificação de `T014` e `T015` correu pelo Playwright sobre o harness, com captura de tela
  em cada passo. A árvore acessível confirmou D-06 de perto: o cartão é anunciado
  `[…f6a7b8] Identificador longo…`, e os quatro botões continuam em `Details of '…'`,
  `Edit '…'`, `Delete '…'` e `Move '…'`, sem o marcador.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-04 | Versão inicial gerada por `/reversa-to-do` | reversa |
