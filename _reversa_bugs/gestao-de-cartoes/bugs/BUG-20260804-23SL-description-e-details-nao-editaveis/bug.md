---
schema_version: 1
id: BUG-20260804-23SL
display_number: 1
title: Description e Details não aceitam digitação no diálogo de edição de cartão
status: resolved
phase: delivering
severity: high
priority: P1
created: 2026-08-04
updated: 2026-08-04

origin:
  type: manual-report
  external_ref: null

area: webview
module: webview-dialogs
feature: gestao-de-cartoes
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "4/4 (reproduzido no harness de preview, dois campos)"
  suspected_triggers:
    - "campo de Markdown vazio no momento em que o editor é criado"

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_sdd/gestao-de-cartoes/requirements.md#requisitos-funcionais"
    - "_reversa_sdd/gestao-de-cartoes/requirements.md#critérios-de-aceitação"
    - "_reversa_sdd/gestao-de-cartoes/design.md#dependências"
    - "_reversa_sdd/addenda/002-primer-design-system.md#regras-sob-vigilância"
  affected_code:
    - "src/webview/ui/dialogs/MarkdownField.tsx"
    - "src/webview/adapters/code-editor.ts"
    - "src/webview/ui/dialogs/CardForm.tsx:186-201"
    - "src/webview/ui/dialogs/EditCardDialog.tsx"
    - "src/webview/theme/dialogs.css:87-89"
  root_cause:
    state: confirmed
    hypothesis: >-
      O wrapper que o design system desenha em volta do textarea é 'display: flex'. O editor
      que o adaptador abre por 'CodeMirror.fromTextArea' é inserido DENTRO desse wrapper e
      vira flex item com 'flex: 0 1 auto', de modo que sua largura passa a vir do conteúdo e
      não do container. Campo vazio significa conteúdo de largura zero: o editor encolhe até
      a calha dos números (38 px) e a área de escrita fica com 8 px, fora do alcance do
      clique. A folha do projeto declara ALTURA para o editor e nunca declarou largura.
    causal_path:
      - "CardForm monta dois MarkdownField (description, details)"
      - "MarkdownField renderiza o Textarea do design system, cujo wrapper é span display:flex"
      - "createCodeMirrorEditor chama fromTextArea: o div.CodeMirror entra como filho do wrapper"
      - "sem largura declarada, o flex item dimensiona por conteúdo (flex-basis auto)"
      - "conteúdo vazio => editor de 38 px; o clique do usuário cai no wrapper, não no editor"
      - "o editor nunca recebe foco e nada pode ser digitado"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: >-
          Medido no navegador: wrapper 448 px, div.CodeMirror 38 px, .CodeMirror-lines 8 px.
          Clique no meio do campo cai em 'vsckb-markdown-editor', CodeMirror-focused false.
      - ref: "evidence/reproduction.md"
        observation: >-
          Com 'width: 100%; min-width: 0' aplicado por CSSOM: editor 446 px, área de escrita
          416 px, clique cai em '.CodeMirror-lines', foco no textarea e digitação real de
          'escrito com a correcao aplicada'. Altura inalterada (114 e 153 px).
      - ref: "evidence/antes-defeituoso.png"
        observation: "captura do defeito, idêntica ao print do relator"
      - ref: "evidence/depois-corrigido.png"
        observation: "captura do mesmo diálogo com a correção candidata"
    code_refs:
      - file: "src/webview/theme/dialogs.css"
        symbol: ".vsckb-markdown-editor .CodeMirror"
        commit: "6dcc8c9"
      - file: "src/webview/adapters/code-editor.ts"
        symbol: "createCodeMirrorEditor"
        commit: "6dcc8c9"
  reproduction_tests:
    - "src/test/embedded-editor.unit.test.ts::the editor takes its width from the field, not from its content"
    - "evidence/reproduction.md (medição no navegador: 38 px, clique fora do editor)"
  regression_tests:
    - "src/test/embedded-editor.unit.test.ts::the editor still takes its height from the form"
    - "src/test/embedded-editor.unit.test.ts::the editor may shrink below its content"
    - "_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/.vscode/vscode-kanban.json (cartão 12, sem description e sem details)"

spec_verdict: spec-correta

change_risk:
  classification: baixa
  reasons:
    - "uma declaração de geometria numa folha de estilo, sem efeito em domínio, dados ou ponte"
    - "reversível por remoção; nenhum byte do arquivo do quadro muda"
    - "sem contrato externo atingido: nenhuma âncora de 'style-anchors.md' é renomeada"
    - "risco residual: a folha do usuário ('.vscode/vscode-kanban.css') é carregada por último e pode sobrescrever a largura"

change_set:
  - id: CHG-001
    kind: test
    artifact: "src/test/embedded-editor.unit.test.ts"
    purpose: "prova que a folha declara largura, altura e min-width para o editor embutido"
    diff: "fix/CHG-001.diff"
  - id: CHG-002
    kind: test
    artifact: "_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/.vscode/vscode-kanban.json"
    purpose: "acrescenta à fixture o cartão sem description e sem details, espécime que faltava"
    diff: "fix/CHG-002.diff"
  - id: CHG-003
    kind: code
    artifact: "src/webview/theme/dialogs.css"
    purpose: "o editor passa a tomar a largura do campo, e não do próprio conteúdo"
    diff: "fix/CHG-003.diff"
  - id: CHG-004
    kind: documentation
    artifact: "_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/README.md"
    purpose: "registra na tabela da fixture o que o cartão 12 exercita"
    diff: "fix/CHG-004.diff"
  - id: CHG-005
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260804-23SL-v001.md"
    purpose: "adendo aditivo: elemento vendorizado dentro de wrapper flex precisa de dimensão declarada (W018)"
    diff: null

versions:
  affected: "1.35.2 e 1.35.4 (ambas instaladas com a folha sem largura)"
  fixed_in: "1.35.5"

delivery:
  branch: "feat/interface-react-tema-e-done"
  build: "npm run build + vsce package 1.35.5 --no-update-package-json --allow-star-activation"
  package: "vscode-kanban-1.35.5.vsix (13.43 MB)"
  installed: "code --install-extension vscode-kanban-1.35.5.vsix --force (2026-08-04)"
  verified_in_package: >-
    A regra chega ao pacote e à extensão instalada:
    'vsckb-markdown-editor .CodeMirror{width:100%;min-width:0;height:calc(...)}'
  confirmed_by_reporter: >-
    iago, em 2026-08-04, no editor com a 1.35.5 carregada: "funcionou, criei um cartão teste".
    Cartão criado pelo botão '+' e os dois campos de Markdown escritos pela interface, que é
    exatamente o gesto que o relato original dizia impossível.
  commit: "4f3231d — Devolve largura ao editor de Markdown dos dialogos de cartao"
  merge: "6456b88 — merge de 'feat/interface-react-tema-e-done' em 'master' (--no-ff), suíte 259 passando em master"
  pending: []

closure:
  policy: package
  satisfied: true
resolution_kind: fixed
---

# Description e Details não aceitam digitação no diálogo de edição de cartão

## Summary

No diálogo `Edit a card of 'Todo'`, os campos Description e Details não recebem cursor nem
aceitam texto. Os demais campos do mesmo formulário (Title, Type, Prio, Category, Assigned to)
funcionam. O relator observou a falha num cartão criado pelo botão "+" do quadro e não a
observou em cartões de outros quadros. O defeito sobrevive a fechar e reabrir a aba do Kanban.

Com Description e Details travados, a edição de conteúdo do cartão fica impossível pela
interface: resta editar `.vscode/vscode-kanban.json` à mão.

## Expected Behavior

`_reversa_sdd/gestao-de-cartoes/requirements.md`, RF-03: "Editar título, tipo, prioridade,
categoria, responsável, descrição, detalhes e vínculos" — critério de aceitação declarado:
"Alterações persistem após recarga". A spec exige que descrição e detalhes sejam editáveis
pelo diálogo, sem condicionar a edição ao conteúdo prévio do campo.

`design.md#dependências` registra CodeMirror como a dependência que serve "editores de descrição
e detalhes"; o adendo `002-primer-design-system.md` mantém esse acoplamento sob vigilância
(`W018`) por depender de nomes de classe da biblioteca vendorizada.

A spec **não** distingue cartão novo de cartão antigo, nem campo vazio de campo preenchido: pelo
contrato vigente, os dois casos editam igual. Não é `spec-gap`.

## Actual Behavior

Abertura do diálogo de edição do cartão "Tela do controle financeiro" (coluna Todo do quadro do
projeto `experimento`): as duas áreas de texto aparecem montadas, com a calha de numeração de
linha do CodeMirror desenhada e o algarismo `1` visível em cada uma, ambas vazias. Clicar dentro
delas não produz cursor e a digitação não entra. Os campos acima do formulário respondem
normalmente.

A falha persiste depois de fechar e reabrir a aba do Kanban, o que descarta um estado transitório
de uma única montagem do diálogo.

## Steps to Reproduce

1. Abrir um quadro pelo comando **Kanban: Open Board ...**
2. Criar um cartão pelo botão "+" da coluna Todo, preenchendo apenas o título (e deixando
   Description e Details em branco)
3. Salvar
4. Reabrir o mesmo cartão pelo diálogo de edição
5. Clicar no campo Description e tentar digitar; repetir em Details

Observado nos passos 5: nenhum dos dois campos aceita texto.
Fechar e reabrir a aba do Kanban e repetir os passos 4 e 5 reproduz o mesmo resultado.

## Evidence

- `evidence/edit-card-description-details-nao-editaveis.png` — o diálogo aberto, com os dois
  campos montados, vazios e irresponsivos
- `evidence/cartao-no-arquivo.json` — o cartão como está gravado no quadro: sem as chaves
  `description` e `details`, que a interface remove quando o campo é salvo em branco
  (`CardForm.tsx`, `setContent`)
- Relato bruto: `../../intake/relato-20260804-0748.md`

## Suspected Area

> **Resolvido em 2026-08-04.** A causa é a hipótese 1 e 2 combinadas, e o mecanismo é mais
> simples do que as duas supunham: não é a altura, é a **largura**. O editor colapsa a 38 px
> por ser flex item sem largura declarada dentro do wrapper do design system. Medições em
> `evidence/reproduction.md`; hipótese 3 (ciclo de montagem) refutada — o editor está montado
> e funcional, apenas com 8 px de área de escrita. As hipóteses originais ficam abaixo como
> registro do que se pensou antes de medir.

Hipóteses, todas por inspeção de código e **nenhuma verificada** (redação original):

1. **Campo vazio no momento da criação do editor.** O cartão que falhou é o único do quadro sem
   `description` nem `details`; nos quadros onde a edição funciona, os campos têm conteúdo. O
   `MarkdownField` entrega o valor por `defaultValue` do `<textarea>` e o CodeMirror lê o
   elemento ao ser criado, de modo que um editor de uma linha vazia é exatamente o cenário do
   print.
2. **Altura fixa maior que a área clicável.** `dialogs.css:87-89` fixa a altura do `.CodeMirror`
   em `rows × 1.5em + 16px` (cinco e sete linhas), enquanto o conteúdo ocupa uma linha só. Se o
   `.CodeMirror-lines` não acompanhar a altura declarada, o clique abaixo da primeira linha cai
   fora da região que dá foco ao editor. Isso explicaria por que campos com texto respondem e
   campos vazios não.
3. **Ciclo de montagem do editor.** `MarkdownField` abre o editor uma única vez (`useEffect` com
   dependências vazias) e devolve `dispose()` (que chama `toTextArea()`) no cleanup. Uma
   remontagem do mesmo componente é ponto sensível, embora a persistência após reabrir a aba
   torne esta hipótese a mais fraca das três.

O limite de 255 caracteres exclusivo do diálogo de edição (`EditCardDialog.tsx`) **não** explica
o sintoma sozinho: Details não tem limite e falhou igual.

## Acceptance Criteria

```gherkin
Dado um cartão sem descrição e sem detalhes no arquivo do quadro
Quando o usuário abre o diálogo de edição e clica em qualquer ponto do campo Description
Então o campo recebe o cursor e aceita digitação
E o mesmo vale para o campo Details

Dado o campo Description preenchido pelo diálogo de edição
Quando o usuário salva
Então o arquivo do quadro passa a conter description como { content, mime: "text/markdown" }

Dado um cartão criado pelo botão "+" na sessão corrente
Quando o usuário o reabre para edição sem recarregar a aba
Então os dois campos de Markdown se comportam como os de qualquer outro cartão
```

## Traceability

| Eixo | Referência |
|---|---|
| Spec (comportamento esperado) | `gestao-de-cartoes/requirements.md` RF-03 e critérios de aceitação |
| Spec (dependência do editor) | `gestao-de-cartoes/design.md#dependências`; adendo `002` `W018` |
| Código onde aparece | `MarkdownField.tsx`, `code-editor.ts`, `CardForm.tsx:186-201`, `dialogs.css:87-89` |
| Causa raiz | não investigada (cabe ao `/reversa-debugger-fix`) |
| Testes de reprodução | nenhum |
| Testes de regressão | nenhum |

## Resolution

`resolution_kind: fixed` · corrigido em 2026-08-04 · **entrega em curso** (a closure policy
`package` ainda não está satisfeita: falta o merge e a confirmação na janela do editor).

### Causa raiz (confirmada)

O wrapper que o design system desenha em volta do `<textarea>` é `display: flex`. O editor aberto
por `CodeMirror.fromTextArea` entra dentro dele e vira flex item com `flex: 0 1 auto`, de modo que
a largura passa a vir do conteúdo e não do container. Campo vazio significa conteúdo de largura
zero: o editor encolhia a 38 px, dos quais 30 eram a calha dos números e 8 a área de escrita. O
clique caía no wrapper, ao lado do editor, que nunca recebia foco.

A folha declarava **altura** para esse editor desde a feature `002`, com um comentário que discute
altura e só altura. A largura nunca foi declarada porque texto a esconde: um editor com uma linha
dentro se estica e parece certo. Daí o defeito ser visível apenas em cartão sem descrição, e
sumir assim que qualquer caractere entrasse por outra via — que foi o que o relator observou.

### Veredito de spec

**`spec-correta`**, aprovado por iago em 2026-08-04. RF-03 já exigia que descrição e detalhes
fossem editáveis, sem condicionar isso a conteúdo prévio; quem divergiu foi a folha de estilo.
Nada da spec original precisa ser relido.

Acompanha um adendo **aditivo**, também aprovado: `_reversa_sdd/addenda/bug-BUG-20260804-23SL-v001.md`.
Ele não corrige regra alguma — acrescenta a que faltava. A vigilância `W018` do adendo `002`
registrava o acoplamento ao CodeMirror vendorizado como risco abstrato; agora se sabe a condição
concreta que o faz quebrar, e ela vale para qualquer elemento de terceiro inserido dentro de um
controle do design system.

### Change set

| CHG | Tipo | Artefato | Propósito |
|---|---|---|---|
| `CHG-001` | test | `src/test/embedded-editor.unit.test.ts` | largura, altura e `min-width` declaradas |
| `CHG-002` | test | fixture do sandbox, cartão `12` | o espécime sem `description` nem `details` |
| `CHG-003` | code | `src/webview/theme/dialogs.css` | a correção |
| `CHG-004` | documentation | `README.md` do sandbox | o que o cartão `12` exercita |
| `CHG-005` | specification | `addenda/bug-BUG-20260804-23SL-v001.md` | a regra que faltava em `W018` |

### O diff da correção

```diff
+ * The width is here for the same reason as the height and was missing for a
+ * worse one. That wrapper is a FLEX container, so the editor inside it is a
+ * flex item, and a flex item with no width of its own is sized by its content.
+ * [...] (BUG-20260804-23SL)
  */
 .vsckb-markdown-editor .CodeMirror {
+    width: 100%;
+    min-width: 0;
     height: calc(var(--vsckb-editor-rows, 5) * 1.5em + 16px);
 }
```

Diffs completos em `fix/CHG-001.diff` a `fix/CHG-004.diff`. O adendo é um arquivo novo, sem diff.

### Vermelho e verde

Antes de `CHG-003`:

```
The size of the embedded Markdown editor
  1) the editor takes its width from the field, not from its content
  ✔ the editor still takes its height from the form
  2) the editor may shrink below its content
```

Depois:

```
The size of the embedded Markdown editor
  ✔ the editor takes its width from the field, not from its content
  ✔ the editor still takes its height from the form
  ✔ the editor may shrink below its content

259 passing (221ms)
```

Verificação na tela, com a folha corrigida e o cartão `12` da fixture (`npm run preview --
--sandbox`): editor de 446 px, área de escrita de 416 px, clique caindo em `.CodeMirror-lines`,
foco no editor e texto digitado nos **dois** campos. Captura: `evidence/verificado-na-tela.png`.

### Entrega

`vscode-kanban-1.35.5.vsix` construída com `npm run build` (obrigatório: `vsce:prepublish` só roda
`tsc` e deixaria o Webview velho no pacote) e instalada com `--force`. Conferido dentro do pacote
e dentro da extensão instalada que a regra chega com `width` e `min-width`.

Durante a entrega apareceu a armadilha conhecida: havia uma **1.35.4** instalada, mais nova em
número e mais velha em conteúdo, que venceria qualquer 1.35.3. Foi por isso que a correção saiu
como 1.35.5. As três versões e o que cada uma declara:

| Versão instalada | Regra do editor |
|---|---|
| 1.35.2 | (a regra ainda não existia) |
| 1.35.4 | só `height` — a defeituosa que estava vencendo |
| 1.35.5 | `width: 100%; min-width: 0; height: …` |

### Confirmação do relator

Em 2026-08-04, com a 1.35.5 carregada no editor, iago confirmou: *"funcionou, criei um cartão
teste"*. Cartão criado pelo botão "+" e os dois campos escritos pela interface — o gesto que o
relato original dizia impossível. Esta é a evidência que este projeto trata como decisiva, acima
de qualquer suíte verde: nenhum defeito de aparência daqui foi jamais achado por teste.

### Closure policy satisfeita

| Exigência da policy `package` | Estado |
|---|---|
| Correção com causa raiz confirmada | ✅ medida no navegador |
| Testes de reprodução e regressão | ✅ `embedded-editor.unit.test.ts` + fixture |
| Veredito de spec | ✅ `spec-correta`, com adendo aditivo aprovado |
| Versão corrigida empacotada e instalada | ✅ `1.35.5`, regra conferida dentro do pacote |
| Confirmação na tela pelo relator | ✅ 2026-08-04 |
| Merge | ✅ `6456b88` em `master`, com a suíte em 259 passando |

Fechado em 2026-08-04. A pasta recebe `DONE.md` e passa a ser somente leitura.

## Agent Notes

- **Verificar na tela antes de declarar pronto.** Nenhum defeito de aparência ou interação deste
  projeto foi achado por teste automatizado. A closure policy é `package`: a build local precisa
  ser empacotada e a `.vsix` reinstalada antes de qualquer conclusão, porque a extensão instalada
  no editor pode estar servindo um Webview mais antigo que o código-fonte.
- A reprodução deve começar por **isolar as duas variáveis que o relato mistura**: campo vazio
  contra campo preenchido, e cartão da sessão contra cartão carregado do arquivo. As duas geram
  cenários diferentes e só uma delas está no print.
- O quadro de `~/dev/experimento` é o espécime: um único cartão, sem `description` nem `details`.
  Reproduzir em quadro novo é preferível a mexer nele.
- Nenhuma relação com outro bug proposta: este é o primeiro registro do contexto.
