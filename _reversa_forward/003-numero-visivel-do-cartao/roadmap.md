# Roadmap: número do cartão visível na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Requirements: `_reversa_forward/003-numero-visivel-do-cartao/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature é exibição pura: nada do que está gravado muda, e nenhum arquivo da extensão é
tocado. O trabalho todo cabe no Webview, e se divide em três movimentos. Primeiro, uma função
pura no domínio decide o texto do marcador a partir do `id` — devolve `[5]`, devolve
`[…f6a7b8]` quando a cadeia é longa, e devolve nada quando não há identificador. Segundo, o
cartão passa esse texto ao começo do próprio título e ao nome acessível do cartão. Terceiro,
a aparência do marcador entra pela folha que pinta, e sua geometria pela folha que posiciona,
como o projeto exige desde a feature `002`. O diálogo de detalhes ganha uma linha a mais na
lista de fatos que já mantém.

A lógica inteira mora na função pura, e é ali que os testes de unidade a alcançam. O que
sobra no componente é ligação, verificável por leitura de fonte e por observação na tela — que
neste projeto é a única evidência que já pegou defeito de aparência.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`. Nada a confrontar, nada em conflito.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| n/a — nenhum princípio registrado | Rodar `/reversa-principles` continua sendo opção aberta, e esta feature não depende disso | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | A regra do marcador vira função pura em `src/webview/domain/card-number.ts`, fora de qualquer componente | O domínio é onde o projeto mantém a lógica testável, e a única suíte de cobertura obrigatória mede `out/webview/domain/**` com piso de sessenta por cento. Regra dentro do componente ficaria sem teste possível: o projeto não tem renderizador de componentes em teste | Calcular o texto dentro de `Card.tsx`; calcular no `use-board.ts` ao montar a vista | 🟢 |
| D-02 | O marcador é o primeiro filho do `<h3>` do título, não um elemento irmão | RF-04 pede o número na mesma linha do título. O título é bloco; um irmão abriria linha própria e obrigaria a reescrever a caixa de informação, que hoje é uma coluna de `flex` com espaçamento fixo | Irmão do `h3` com `display: flex` no contêiner; marcador na faixa do tipo — descartado porque essa faixa é inteiramente omitida em cartão sem tipo e sem botões, e o número sumiria justamente nos cartões mais simples (`Card.tsx:143`) | 🟢 |
| D-03 | O marcador recebe a classe `vsckb-card-number` e **nenhuma** âncora `data-vsckb` nova | Âncora é promessa de contrato com a folha de estilo do usuário, declarada em `interfaces/style-anchors.md` da feature `002` — que está pausada. Criar promessa nova aqui obrigaria a alterar artefato de outra feature. A classe já satisfaz RF-11 e dá seletor estável | Acrescentar `card-number` a `AnchorName` e ao contrato de âncoras; não dar nome algum ao elemento | 🟡 |
| D-04 | A pintura do marcador entra em `theme/appearance.css` nomeando tokens; a geometria, se houver, em `theme/board.css` | A divisão é regra testada: `board.css` e `dialogs.css` declaram geometria e **não podem pintar**, nem por variável; `appearance.css` pinta e só pela nomeação de token (`src/test/visual-literals.unit.test.ts`). O par `--fgColor-muted` mais peso normal reproduz o que `vsckb-card-time` já faz | Declarar cor em `board.css`; usar valor literal | 🟢 |
| D-05 | Identificador de até oito caracteres aparece inteiro; acima disso, reticências mais os seis últimos | O identificador simples é um inteiro, e oito dígitos comportam qualquer quadro real. O teto mantém o marcador com no máximo oito caracteres visíveis nos dois modos, o que é o que protege a linha do título (RF-05) | Cortar por largura em pixels, que exigiria medir na pintura; usar o prefixo de data e hora, descartado na sessão de esclarecimento | 🟡 |
| D-06 | O nome acessível do **cartão** passa a incluir o número; os rótulos dos botões de ação continuam citando só o título | O cartão é anunciado uma vez e é onde o número informa. Levá-lo aos botões produziria `Edit '[5] Corrigir o editor'` quatro vezes por cartão, alongando cada anúncio sem acrescentar nada | Incluir em todos os rótulos; não incluir em lugar nenhum, o que contraria RF-06 | 🟡 |
| D-07 | O atributo de título — o balão do ponteiro — só aparece quando o texto foi encurtado | Balão que repete o que já está escrito é ruído, e o projeto já evita isso: `vsckb-card-progress` só o usa para revelar a percentagem que a barra não escreve | Balão sempre presente | 🟢 |
| D-08 | Os casos que o quadro real não tem — sem identificador, identificador longo, identificador repetido — entram como cartões novos na fixture `reference/sandbox/` | A fixture existe para ser maltratada, e é o que o `npm run preview -- --sandbox` serve. Sem ela, os três casos negativos de RF-10, RF-09 e RN-04 não teriam como ser vistos | Editar o quadro do projeto, que é registro de trabalho real; criar fixture nova, duplicando o que já há | 🟡 |
| D-09 | Nenhum arquivo de `src/` fora de `src/webview/` é tocado | A extensão só atribui identificador na carga, e essa regra não muda (`src/boards.ts:968-994`). Mexer ali arrastaria a feature para o território do cartão `[12]`, que é a duplicação da regra de geração | Unificar a geração de identificadores de passagem | 🟢 |

## 4. Premissas

Nenhuma. As três dúvidas do `requirements.md` foram resolvidas na sessão de esclarecimento de
2026-08-04, e nenhuma decisão acima repousa sobre lacuna aberta.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `board-ui` — domínio do Webview | `_reversa_sdd/architecture.md#Módulo 7 — board-ui` | componente-novo | `src/webview/domain/card-number.ts`: a regra que traduz `id` em marcador exibível |
| `board-ui` — cartão | `_reversa_sdd/code-analysis.md#Módulo 7 — board-ui` | regra-alterada | `src/webview/ui/Card.tsx` passa a abrir o título com o marcador e a incluí-lo no nome acessível |
| `board-ui` — diálogo de detalhes | `_reversa_sdd/gestao-de-cartoes/design.md` | regra-alterada | `CardDetailsDialog.tsx` ganha a linha `Identifier` na lista de fatos, com o valor integral |
| Aparência | `_reversa_sdd/addenda/002-primer-design-system.md` | regra-alterada | `theme/appearance.css` pinta o marcador por token; `theme/board.css` recebe a geometria, se alguma for necessária |
| Fixture de verificação | `_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/` | regra-alterada | Três cartões novos para os casos que o quadro real não produz, com o `README.md` da fixture atualizado |
| Suíte | `src/test/` | componente-novo | `card-number.unit.test.ts`: a regra em unidade, mais a leitura de fonte que prende o componente à regra |

Componentes **não** tocados, e a razão de cada um: `extension`, `workspaces`, `boards`,
`html`, `toggl` e `announcements` não participam — o identificador já chega pronto ao Webview,
e a exibição não volta pela ponte.

## 6. Delta no modelo de dados

- Resumo das mudanças: nenhuma. Nenhum campo nasce, muda de tipo ou desaparece; o arquivo
  `.vscode/vscode-kanban.json` gravado depois da feature é idêntico, byte a byte, ao que
  seria gravado antes. O que muda é a leitura de um campo que já existia e não era lido.
- Detalhe completo em: `_reversa_forward/003-numero-visivel-do-cartao/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| n/a | n/a | n/a |

Nenhum contrato externo muda, e vale dizer de quais se está falando, porque três passariam
perto:

- **O arquivo do quadro** continua com o mesmo formato (seção 6).
- **O protocolo da ponte** entre extensão e Webview não ganha nem perde mensagem: o
  identificador já viaja dentro do cartão.
- **As âncoras de estilo** de `interfaces/style-anchors.md` (feature `002`) não são alteradas,
  por decisão D-03. O marcador acrescenta uma classe, o que amplia a superfície de estilo sem
  renomear nem remover nada — não há promessa nova a manter.
- **Os scripts de evento do usuário** recebem os mesmos dados de sempre.

## 8. Plano de migração

Não há migração de dados. O que existe é ordem de trabalho, e ela importa porque a regra
precisa estar testada antes de o componente depender dela:

1. Escrever `card-number.ts` e a suíte de unidade que o cobre, incluindo cadeia vazia,
   identificador textual, inteiro comum e cadeia longa.
2. Ligar o cartão à regra: marcador no título e no nome acessível.
3. Acrescentar a linha `Identifier` ao diálogo de detalhes.
4. Pintar em `appearance.css` e posicionar em `board.css`.
5. Acrescentar os três cartões à fixture e atualizar o `README.md` dela.
6. Verificar na tela pelo `npm run preview`, sobre o quadro do projeto e sobre a fixture,
   seguindo o `onboarding.md`.
7. Verificar no editor, que é o único lugar onde o veredito vale para `done` — a fixture serve
   ao `testing`, como o quadro trata essa evidência desde o cartão `[36]`.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| O marcador dentro do `<h3>` herda estilo do usuário escrito contra `.vsckb-title` ou `.vsckb-kanban-card-title`, nomes que a camada de compatibilidade devolve ao título | médio | médio | O marcador declara a própria cor, o que o protege de herança de cor; e tem classe própria, pela qual o usuário o neutraliza. Registrar o caso no `regression-watch.md` |
| O texto do título passa a conter o número, e algo que leia o título pela árvore do documento passa a lê-lo com o marcador junto | baixo | baixa | Nada no projeto lê o título pela árvore: a exportação, o filtro e a ordenação leem o cartão do arquivo. Verificar no `legacy-impact.md` |
| `Card.tsx` está a sessenta e seis linhas do teto de quatrocentas que `source-limits.unit.test.ts` impõe | baixo | baixa | A ligação são poucas linhas, porque a regra mora fora. Se o arquivo estourar, a saída é repartir o cartão, não elevar o teto |
| Cor do marcador sem contraste suficiente em algum dos quatro estados de tema | médio | baixa | Usar o mesmo token que `vsckb-card-time` já usa, que `theme-contrast.unit.test.ts` guarda |
| Os cartões novos da fixture atrapalharem o roteiro de doze passos da feature `001`, que exclui cartão e limpa a coluna `Done` | baixo | média | Acrescentar os três ao fim da coluna `Todo`, longe dos cartões `10` e `11` que o roteiro consome, e documentá-los no `README.md` da fixture |
| Quadro com muitos cartões e a varredura visual pelo número ficar lenta para o olho, por o marcador competir com o título | baixo | baixa | Tom secundário e peso normal, que é o que separa o marcador do título sem exigir cor nova |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Suíte de unidade verde, com `card-number` coberto e nenhuma asserção existente alterada
- [ ] `npm run preview` sobre o quadro do projeto mostrando o número em todos os cartões, nos
      dois layouts e nos quatro estados de tema
- [ ] `npm run preview -- --sandbox` mostrando os três casos negativos como o `requirements.md`
      descreve
- [ ] Verificação no editor, com a extensão empacotada da build local
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-04 | Versão inicial gerada por `/reversa-plan` | reversa |
