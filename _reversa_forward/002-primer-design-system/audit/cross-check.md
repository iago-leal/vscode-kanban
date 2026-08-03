# Cross-check: Quadro sobre sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Artefatos analisados:
> - `_reversa_forward/002-primer-design-system/requirements.md`
> - `_reversa_forward/002-primer-design-system/roadmap.md`
> - `_reversa_forward/002-primer-design-system/actions.md`
> Artefatos de apoio lidos: `data-delta.md`, `investigation.md`, `onboarding.md`,
> `interfaces/style-anchors.md`, `interfaces/legacy-class-map.md`,
> `_reversa_sdd/domain.md`, `_reversa_sdd/gaps.md`, `_reversa_sdd/architecture.md`,
> `_reversa_forward/001-interface-react-tema-e-done/roadmap.md`

**Nenhum dos artefatos analisados foi alterado.** Este relatório é o único arquivo escrito.

## Resumo

| Severidade | Quantidade |
|------------|------------|
| CRITICAL | 1 |
| HIGH | 8 |
| MEDIUM | 6 |
| LOW | 3 |
| **Total** | **18** |

## Achados

| ID | Severidade | Eixo | Descrição | Onde está |
|----|-----------|------|-----------|-----------|
| A001 | CRITICAL | Consistência | Dezenove das âncoras que o mapa de compatibilidade usa como "equivalente" não constam do contrato de âncoras. O mapa promete o que o contrato não declara, e nenhuma ação as instrumenta | `interfaces/legacy-class-map.md` §3.2 a §3.4 × `interfaces/style-anchors.md` §3 e §4; `actions.md` T036–T039 |
| A002 | HIGH | Consistência | `#vsckb-card-filter-modal` é mapeado para `[data-vsckb-dialog="filter"]`, mas não existe diálogo de filtro: o filtro é campo da barra superior desde a feature `001`. O mesmo documento, em §4, exclui `.vsckb-card-filter-expr` por o filtro estar marcado para mudar | `interfaces/legacy-class-map.md` §3.3 e §4; `src/webview/ui/TopBar.tsx:51` |
| A003 | HIGH | Cobertura | RF-06, abertura de quadro da versão 1.33.1 sem migração e sem perda de campo, não tem ação. `T056` cobre só os itens 2 e 3 de `onboarding.md` §11; o item 1 ficou órfão | `requirements.md` RF-06; `actions.md` fase 5 |
| A004 | HIGH | Cobertura | RF-26, tipografia resolvida pela pilha do sistema operacional sem arquivo de fonte empacotado, não tem ação nem teste. Nada no `actions.md` verifica que nenhuma fonte entra no pacote | `requirements.md` RF-26; `actions.md` |
| A005 | HIGH | Cobertura | O requisito não funcional de acessibilidade, contraste de 4,5 para 1 em texto corrido e 3 para 1 em texto grande, não tem ação. É o único requisito com critério numérico declarado e sem verificação atribuída | `requirements.md` §6; `actions.md` |
| A006 | HIGH | Cobertura | As seções 5 e 6 do `onboarding.md` — ciclo de tema, conteúdo rico, teclado, leitor de tela, escala de cinza e paridade entre arrastar e teclado — não têm ação de verificação. Cobrem RF-10, RF-13, RF-14, RF-15, RF-16 e RF-20, todos Must, todos com implementação atribuída e verificação órfã | `onboarding.md` §5 e §6; `actions.md` fase 5 |
| A007 | HIGH | Consistência | Contradição interna do roadmap: §5 afirma que `src/webview/adapters/` fica intocado, "porque são eles que os testes existentes cobrem", enquanto D-26 exige que o realce de sintaxe passe a derivar do modo de cor ativo | `roadmap.md` §5 × D-26 |
| A008 | HIGH | Cobertura | RF-03, protocolo de mensagens inalterado nos dezesseis comandos, não tem ação de verificação, embora tenha cenário Gherkin próprio. `T055` compara eventos e arquivo do quadro, não mensagens da ponte | `requirements.md` RF-03; `actions.md` T055 |
| A009 | HIGH | Consistência | Identificador fantasma: `src/test/theme-resolution.unit.test.ts` não existe. A asserção do ciclo de tema vive em `src/test/view-state.unit.test.ts` | `data-delta.md` §3.1; `onboarding.md` §2 |
| A010 | MEDIUM | Cobertura | RF-17, barreira de sanitização preservada ou mais estrita, não tem ação nem teste, apesar do cenário negativo declarado e da prioridade Must | `requirements.md` RF-17; `actions.md` |
| A011 | MEDIUM | Cobertura | A verificação de `onboarding.md` §7, diff byte a byte do arquivo do quadro após ações de aparência, não tem ação própria: RF-05 aparece apenas citado dentro de `T055`, que verifica outra coisa | `onboarding.md` §7; `actions.md` T055 |
| A012 | MEDIUM | Consistência | As lacunas G-02, G-20 e G-21 são atribuídas a `_reversa_sdd/domain.md#7`; a seção existe, mas as três vivem em `_reversa_sdd/gaps.md` | `data-delta.md` §7 |
| A013 | MEDIUM | Cobertura | O requisito de primeira tela em até um segundo com cem cartões, e o risco de o rótulo textual degradar a densidade do quadro, não têm ação de verificação, embora o roadmap prometa "verificação visual no roteiro com quadro de cem cartões" | `requirements.md` §6; `roadmap.md` §9; `actions.md` |
| A014 | MEDIUM | Cobertura | Os cenários "Quadro vazio" e "Cartão sem título e sem descrição" não têm ação nem teste correspondente | `requirements.md` §7; `actions.md` |
| A015 | MEDIUM | Sanidade | `T002` e `T056` estão marcadas `[//]` com o mesmo arquivo alvo, `package.json`, contrariando a regra do template. A ordem topológica as separa e `T056` só lê, mas a marcação é enganosa | `actions.md` T002, T056 |
| A016 | LOW | Consistência | O roadmap fala em "os vinte componentes" de `src/webview/ui/`; há dezesseis arquivos `.tsx` | `roadmap.md` §5 |
| A017 | LOW | Cobertura | O local do registro de versão das bibliotecas vendorizadas, `src/res/VENDORED.md`, é escolha do `actions.md`: nem D-29 nem RF-22 dizem onde a declaração deve viver | `actions.md` T047 × `roadmap.md` D-29 |
| A018 | LOW | Consistência | Contagem divergente de diálogos: o contrato de âncoras fala em cinco caixas, o mapa de compatibilidade lista seis identificadores de modal e o roadmap §8 fala em cinco | `interfaces/style-anchors.md` §3; `interfaces/legacy-class-map.md` §3.3; `roadmap.md` §8 |

## Impacto e direção dos achados CRITICAL e HIGH

### A001, CRITICAL — o contrato de compatibilidade aponta para âncoras que não existem

Os dois documentos de `interfaces/` são contratos consumidos pela folha de estilo do usuário, e não
se encaixam. `style-anchors.md` declara dezenove âncoras: treze estruturais e seis de estado. O
`legacy-class-map.md`, ao dizer qual âncora responde por cada nome da versão 1.33.1, usa dezenove
âncoras **que não estão nessa lista**:

`[data-vsckb-dialog="add-card" | "edit-card" | "card-details" | "delete-card" | "clear-done" |
"filter"]`, `[data-vsckb="action-save" | "action-reload" | "action-filter" | "action-add" |
"action-edit" | "action-clear"]`, `[data-vsckb="card-category" | "card-progress" |
"card-progress-bar" | "card-reference" | "card-references"]` e `[data-vsckb="dialog-confirm" |
"dialog-cancel"]`.

A consequência é encadeada. As ações de instrumentação, `T036` a `T039`, escrevem apenas as âncoras
declaradas em `style-anchors.md`, porque é o contrato que elas citam. A folha gerada em `T041`
apontaria, então, para elementos que ninguém marcou, e `T044` a serviria vazia. `T054`, a verificação
com folha de usuário real, falharia — ou pior, passaria, caso a regra de teste escolhida caísse por
acaso numa das dezenove âncoras que existem. RF-28 e RF-11 dependem, cada um, de metade desse
contrato, e a metade que falta é justamente a que cobre barra superior, ações de cartão e diálogos.

Só existem dois desfechos coerentes, e a escolha é de quem mantém o projeto, não deste relatório:
ampliar `style-anchors.md` para declarar as dezenove âncoras que o mapa já usa, assumindo o
compromisso de estabilidade sobre elas; ou reduzir o mapa ao que o contrato promete, o que encolhe a
cobertura de trinta e sete para dezoito nomes e precisa aparecer em §4 do mapa como exclusão
declarada. Caminho sugerido: `/reversa-clarify`, para registrar a decisão no `requirements.md`, e
depois `/reversa-plan`, que é o skill dono de `interfaces/`. Este skill não altera nenhum dos dois.

### A002, HIGH — o mapa promete equivalência a um elemento que não existe

`#vsckb-card-filter-modal` é mapeado para `[data-vsckb-dialog="filter"]`, mas a interface da feature
`001` não tem diálogo de filtro: o filtro é um campo da barra superior, em `TopBar.tsx:51`. Nenhuma
ação cria esse diálogo, e o escopo negativo proíbe funcionalidade nova. O mesmo documento se
contradiz em §4, ao excluir `.vsckb-card-filter-expr` porque "o campo de expressão do filtro será
substituído por controles visuais": se o filtro está marcado para mudar, mapear o modal dele é
prometer estabilidade sobre a mesma superfície recusada duas linhas adiante. A linha deveria migrar
para a tabela de não mapeados. Direção: `/reversa-plan`, junto de A001.

### A003, A004, A005, A006, A008 — cinco requisitos Must com implementação e sem verificação

O padrão é o mesmo nos cinco, e por isso vale lê-los juntos. O `actions.md` atribui ação a quem
*constrói* cada requisito, mas a fase 5 só recolheu as verificações que o roadmap listou
explicitamente no plano de migração, §8. Ficaram de fora as que vivem apenas no `onboarding.md`:
abertura de quadro antigo (§11, item 1), ausência de arquivo de fonte no pacote, contraste medido,
teclado e leitor de tela (§6), conteúdo rico acompanhando o tema (§5) e igualdade do protocolo de
mensagens. São seis verificações órfãs cobrindo nove requisitos, e RF-13 e RF-14 são, pelo próprio
`requirements.md` §8, "o principal ganho que justifica adotar um sistema de design maduro".

Nada aqui contradiz decisão tomada: é lacuna de decomposição, não conflito. Direção: `/reversa-to-do`
regenerando a fase 5 depois que A001 e A002 estiverem resolvidos, já que a resolução daqueles muda o
conteúdo de `T054` e pode acrescentar ações de instrumentação.

### A007 — o roadmap se contradiz sobre os adaptadores

§5 promete `src/webview/adapters/` intocado e justifica a promessa: são esses arquivos que os testes
existentes cobrem, e alterá-los confundiria a causa de qualquer teste que falhasse. D-26, porém,
manda o tema do realce de sintaxe derivar do modo de cor ativo, e o realce é servido hoje por uma
folha de tema escuro fixa, com o adaptador em `adapters/highlight.ts`.

A decomposição contornou isso mantendo o adaptador intacto e concentrando a escolha em `T035`, sobre
`Markdown.tsx`, e `T043`, sobre `html.ts` — leitura defensável, e registrada nas notas de execução do
`actions.md`. Mas é interpretação do decompositor, não decisão registrada. Se a implementação
concluir que o adaptador precisa mudar, a promessa de §5 cai sem que ninguém a tenha revogado.
Direção: `/reversa-plan`, para que §5 diga o que de fato fica intocado.

### A009 — arquivo de teste inexistente citado como alvo de alteração

`data-delta.md` §3.1 e `onboarding.md` §2 mandam alterar a asserção do ciclo de tema em
`src/test/theme-resolution.unit.test.ts`, arquivo que não existe. O teste vive em
`view-state.unit.test.ts`, o que as notas da feature `001` já haviam registrado. O `actions.md`
aponta para o arquivo real em `T008`, de modo que a execução não trava; o que resta é a instrução de
verificação do `onboarding.md`, que manda conferir o `git diff` de um arquivo inexistente e, seguida
ao pé da letra, aprovaria uma suíte alterada em outro lugar. Direção: `/reversa-plan`, dono dos dois
documentos.

## Verificado e conforme

**Cobertura**

- As treze decisões técnicas do roadmap, D-17 a D-29, têm ao menos uma ação correspondente: D-17
  (`T004`), D-18 (`T002`, `T003`), D-19 (`T006`, `T017`, `T018`), D-20 (`T017`, `T019`), D-21
  (`T040`), D-22 (`T007`, `T041`), D-23 (`T036`–`T039`), D-24 (`T023`), D-25 (`T021`), D-26 (`T035`,
  `T043`), D-27 (`T024`), D-28 (`T042`), D-29 (`T047`).
- Vinte e três dos vinte e oito requisitos funcionais têm implementação atribuída; os cinco com
  problema estão em A003, A004 e A008.
- RF-27 e a herança da feature `001` estão honradas: `T001` executa a captura antes de tudo, e `T055`
  absorve `T043` e `T050` daquela feature, `T050` absorve `T048`.
- O escopo negativo é respeitado pelo `actions.md`: nenhuma ação toca a semântica de `references`, o
  conjunto de colunas, a integração de cronometragem externa nem os cartões de segurança que
  independem desta camada.

**Consistência**

- RF-03 fala em dezesseis comandos, e a conta fecha com D-05 da feature `001`: catorze existentes
  mais `saveViewPreferences` e `setViewPreferences`.
- D-28 apoia-se em D-16 da feature `001`, e D-16 é de fato o que diz ser: emite o valor de uso único
  nos scripts e deixa o documento pronto para a política, sem declará-la.
- A regra de cascata de `style-anchors.md` §7 aparece no `actions.md` na ordem certa: pacote
  (`T044`), compatibilidade (`T044`), folha do usuário por último (`T045`).
- O vocabulário é estável nos três documentos: "âncora de estilo", "conjunto nomeado", "camada de
  compatibilidade", "modo de cor ativo" e "piso de versão" aparecem com o mesmo sentido em todos.
- Os números do piso de versão são coerentes entre RN-05, D-18, `investigation.md` §3 e
  `onboarding.md` §11: `^1.78.0` e `chrome108`, com a fonte citada.

**Coerência com o legado**

- Os componentes citados existem em `_reversa_sdd/architecture.md` §4: `board-ui`, `html` e `boards`.
- Nenhuma decisão contraria regra 🟢 de `_reversa_sdd/domain.md`: RD-14 e RD-17, que governam
  ordenação e não preservação de ordem manual, permanecem intocadas, e o `data-delta.md` confirma que
  as quatro colunas, o `__uid` e o formato do arquivo não mudam.
- As lacunas preservadas de propósito — semântica de `references`, erro de digitação em
  `BOARD_COLMNS` e o número mágico do `__uid` — continuam registradas como não resolvidas, coerentes
  com o escopo negativo. A única ressalva é o endereço citado, em A012.

**Sanidade do `actions.md`**

- Cinquenta e seis ações, IDs únicos, numeração contínua de `T001` a `T056`, sem reciclagem.
- Todas as dependências apontam para IDs existentes.
- Nenhum ciclo: toda dependência aponta para ID estritamente menor, o que dá ordem topológica trivial.
- Vinte e sete das vinte e oito ações `[//]` não compartilham arquivo alvo com outra ação paralela; a
  exceção está em A015.
- A cadeia crítica declarada, de catorze elos, confere com o grafo de dependências.

## Histórico

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-03 | Versão inicial gerada por `/reversa-audit` | reversa |
