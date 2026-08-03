# Contrato: âncoras de estilo do quadro

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Tipo: contrato de arquivo, consumido por `.vscode/vscode-kanban.css`
> Requisitos atendidos: RN-04, RF-11

## 1. O que este contrato é

Uma **âncora de estilo** é um seletor que o projeto se compromete a manter estável entre versões,
para que a folha de estilo do usuário possa alcançar o elemento correspondente. Fora desta lista não
há promessa alguma: nome de classe interno pode mudar a qualquer momento, e o nome de classe do
sistema de design adotado é hasheado e muda quando o componente muda.

Este contrato é o que substitui o arranjo tácito de hoje, em que o usuário estiliza o que consegue
alcançar pelo inspetor e descobre na atualização seguinte que já não alcança.

As âncoras vêm em dois níveis, e a diferença é de vida útil, não de força. As das seções 3 e 4 são
permanentes: existem enquanto o quadro existir. As da seção 5 servem à camada de compatibilidade com
a versão 1.33.1 e duram o que ela durar. Enquanto existirem, a promessa é a mesma nos dois casos.

## 2. Forma da âncora

Toda âncora é um **atributo de dados**, nunca um nome de classe.

```css
[data-vsckb="card"]              { /* alcança todo cartão */ }
[data-vsckb="column"]            { /* alcança toda coluna */ }
[data-vsckb-column="done"]       { /* alcança a coluna Done */ }
```

A escolha por atributo, e não por classe, tem três razões. Não colide com a classe hasheada do
sistema adotado, que ocupa o espaço de nomes de classe do documento. Sobrevive a refatoração de
componente, porque o atributo é escrito deliberadamente e não gerado. E torna a promessa legível no
próprio documento: quem inspeciona vê o atributo e sabe que aquilo é contrato, não acidente.

## 3. Âncoras estruturais

| Âncora | Alcança | Estável desde |
|--------|---------|---------------|
| `[data-vsckb="board"]` | A raiz do quadro, onde também vivem os atributos de tema | 002 |
| `[data-vsckb="board-header"]` | A barra superior inteira | 002 |
| `[data-vsckb="columns"]` | O contêiner das quatro colunas, no modo de colunas | 002 |
| `[data-vsckb="column"]` | Cada coluna, nos dois modos | 002 |
| `[data-vsckb="column-header"]` | O cabeçalho da coluna, com nome de exibição e contagem | 002 |
| `[data-vsckb="column-body"]` | A pilha rolável de cartões da coluna | 002 |
| `[data-vsckb="card"]` | Cada cartão, nos dois modos de visualização | 002 |
| `[data-vsckb="card-title"]` | O título do cartão | 002 |
| `[data-vsckb="card-body"]` | A área de descrição renderizada do cartão | 002 |
| `[data-vsckb="card-footer"]` | A faixa de metadados do cartão | 002 |
| `[data-vsckb="card-actions"]` | O grupo de ações do cartão | 002 |
| `[data-vsckb="list"]` | O contêiner do modo lista | 002 |
| `[data-vsckb="dialog"]` | Qualquer uma das cinco caixas de diálogo | 002 |

## 4. Âncoras de estado

Estas qualificam as estruturais e permitem estilizar por condição, não por elemento.

| Âncora | Verdadeira quando |
|--------|-------------------|
| `[data-vsckb-column="todo" \| "in-progress" \| "testing" \| "done"]` | Identifica qual das quatro colunas |
| `[data-vsckb-card-type="emergency" \| "bug" \| "note" \| "issue"]` | Identifica o tipo do cartão |
| `[data-vsckb-collapsed]` | A coluna está colapsada |
| `[data-vsckb-dragging]` | O cartão está sendo arrastado |
| `[data-vsckb-drop-target]` | A coluna é destino válido do arrasto em curso |
| `[data-vsckb-view="columns" \| "list"]` | Modo de visualização ativo, na raiz do quadro |

## 5. Âncoras de compatibilidade

Estas existem e são alcançáveis como as demais, mas **a vida útil delas é a da camada de
compatibilidade da versão 1.33.1**, descrita em `legacy-class-map.md` §5. Enquanto
`legacy-compat.css` existir, elas existem; quando a camada for removida — mudança incompatível, com
nota no `CHANGELOG.md` e elevação de versão maior —, elas saem junto.

A razão de existirem num nível próprio, e não entre as estruturais: o mapa da versão 1.33.1 precisa
de destino para trinta e seis nomes antigos, e vários desses destinos são detalhe interno de
componente — a barra de progresso do cartão, por exemplo. Prometer estabilidade permanente sobre
detalhe interno congelaria o que a feature seguinte tem todo o direito de mudar. Prometer
estabilidade enquanto a camada durar é o compromisso honesto: quem escreveu folha contra a versão
1.33.1 continua atendido, e o projeto não fica preso ao formato interno para sempre.

### 5.1 Ações da barra superior

| Âncora | Alcança |
|--------|---------|
| `[data-vsckb="action-save"]` | O botão de gravar o quadro |
| `[data-vsckb="action-reload"]` | O botão de recarregar o quadro |
| `[data-vsckb="action-filter"]` | O controle de filtro da barra superior |
| `[data-vsckb="action-add"]` | Cada botão de acrescentar cartão |
| `[data-vsckb="action-edit"]` | Cada botão de editar cartão |
| `[data-vsckb="action-clear"]` | O botão de limpar a coluna Done |

### 5.2 Caixas de diálogo

| Âncora | Alcança |
|--------|---------|
| `[data-vsckb-dialog="add-card"]` | O diálogo de acréscimo de cartão |
| `[data-vsckb-dialog="edit-card"]` | O diálogo de edição de cartão |
| `[data-vsckb-dialog="card-details"]` | O diálogo de detalhes do cartão |
| `[data-vsckb-dialog="delete-card"]` | O diálogo de confirmação de exclusão |
| `[data-vsckb-dialog="clear-done"]` | O diálogo de confirmação de limpeza da coluna Done |
| `[data-vsckb="dialog-confirm"]` | O botão de confirmação de qualquer diálogo |
| `[data-vsckb="dialog-cancel"]` | O botão de cancelamento de qualquer diálogo |

Cinco diálogos, quatro componentes: a confirmação de exclusão e a de limpeza são o mesmo componente,
distinguido pelo valor de `data-vsckb-dialog`.

### 5.3 Detalhes do cartão

| Âncora | Alcança |
|--------|---------|
| `[data-vsckb="card-category"]` | A categoria exibida no cartão |
| `[data-vsckb="card-progress"]` | O indicador de progresso das tarefas do cartão |
| `[data-vsckb="card-progress-bar"]` | A barra preenchida dentro do indicador |
| `[data-vsckb="card-reference"]` | Cada vínculo para outro cartão |
| `[data-vsckb="card-references"]` | O contêiner dos vínculos |

## 6. Atributos que **não** são âncora

Os atributos que o sistema de design adotado lê para escolher o conjunto de cor vivem na mesma raiz,
mas **não** fazem parte deste contrato: pertencem à biblioteca, e mudá-los quebra o tema em vez de
estilizá-lo. Estão documentados aqui apenas para que ninguém os confunda com âncora.

## 7. O que este contrato não promete

- **Nenhum nome de classe.** Nem os do projeto, nem os do sistema de design. Uma folha de usuário
  escrita contra nome de classe pode quebrar em qualquer versão, sem aviso, exceto pelo que a camada
  de compatibilidade da versão 1.33.1 cobre, descrita em `legacy-class-map.md`.
- **Nenhuma estrutura de aninhamento.** Que `[data-vsckb="card-title"]` seja filho direto de
  `[data-vsckb="card"]` é verdade hoje e não é promessa. Escreva seletores de descendência, não de
  filho direto.
- **Nenhum valor computado.** Cor, medida e espaçamento vêm do sistema adotado e mudam quando ele
  muda. Quem quiser fixá-los precisa declará-los na própria folha.

## 8. Regra de cascata

A ordem de injeção no documento é, e permanece:

1. o pacote da interface, com a folha do sistema de design;
2. a folha de compatibilidade da versão 1.33.1;
3. `.vscode/vscode-kanban.css`, a folha do usuário.

A folha do usuário é sempre a última e, em igualdade de especificidade, vence. Isso está verificado
pelo cenário de aceitação correspondente e pela seção 9 do `onboarding.md`.

## 9. Versionamento do contrato

Acrescentar âncora é mudança compatível e entra em versão de funcionalidade. Remover ou renomear
âncora é mudança incompatível: exige nota no `CHANGELOG.md`, seção de migração no `README.md` e
elevação da versão maior. Enquanto a âncora existir, o elemento que ela alcança não muda de
significado.

A regra vale para os dois níveis, com uma diferença de gatilho. As âncoras das seções 3 e 4 só saem
por decisão deliberada de removê-las. As da seção 5 saem também por consequência: quando a camada de
compatibilidade da versão 1.33.1 for removida, elas caem junto, na mesma elevação de versão maior e
sob a mesma nota. Nenhuma das duas some em silêncio.
