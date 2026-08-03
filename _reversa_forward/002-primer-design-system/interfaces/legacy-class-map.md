# Contrato: mapa de classes da versão 1.33.1

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Tipo: contrato de arquivo, consumido por `.vscode/vscode-kanban.css`
> Requisitos atendidos: RN-04, RF-12, RF-28

## 1. O que este contrato é

A interface da versão 1.33.1 expunha sessenta e oito nomes de classe e identificadores, todos com
prefixo `vsckb-`, gerados por concatenação de texto em `boards.ts` e manipulados por jQuery. Quem
escreveu `.vscode/vscode-kanban.css` escreveu contra eles.

A feature `001` renomeou tudo, e esta feature renomearia de novo. Duas quebras seguidas na mesma
superfície, sem aviso, é o defeito registrado no cartão `[35]` do quadro do projeto. Este contrato é
a resposta: uma folha de compatibilidade, gerada a partir do mapa abaixo, faz os nomes antigos
continuarem alcançando os elementos equivalentes.

O inventário foi extraído do código real da versão 1.33.1, recuperado do histórico do repositório no
commit anterior à remoção de `src/res/js/board.js`.

## 2. Como a compatibilidade é implementada

A folha `src/webview/theme/legacy-compat.css` é **gerada**, não escrita à mão, a partir da tabela
deste documento. Cada linha vira uma regra que aplica a classe antiga ao elemento que hoje carrega a
âncora correspondente:

```css
/* gerado a partir de legacy-class-map.md — não edite à mão */
[data-vsckb="card"]        { /* responde também por .vsckb-kanban-card */ }
```

Todo destino da coluna "âncora equivalente" é âncora declarada em `style-anchors.md`, e nenhuma
outra: as da estrutura do quadro vêm das seções 3 e 4 daquele documento, permanentes; as da barra
superior, dos diálogos e dos detalhes do cartão vêm da seção 5, cuja vida útil é a desta camada.
Mapear para algo que não seja âncora declarada é o defeito que este parágrafo existe para impedir,
porque a folha gerada apontaria para elemento que ninguém marcou.

A técnica concreta fica a cargo do `/reversa-coding`; o contrato aqui é **o mapa**, não o mecanismo.
O que o mecanismo precisa garantir: um seletor antigo escrito na folha do usuário produz o mesmo
efeito visual que produzia na 1.33.1, e a folha do usuário continua vencendo por ser a última da
cascata.

> **Reconciliação de 2026-08-03, na execução.** O mecanismo mudou; o mapa, não. A folha ilustrada
> acima **não pode existir**: CSS não tem aliasing de seletor. Uma regra escrita pelo usuário contra
> `.vsckb-kanban-card` casa os elementos que carregam essa classe e mais nada, e `:is()` ou
> `:where()` agrupam seletores dentro da regra em que aparecem, sem alcançar regra de terceiro.
>
> O artefato gerado passou a ser um **módulo**, `src/webview/theme/legacy-compat.ts`, e os nomes
> antigos voltam para os próprios elementos, aplicados no render pelo auxiliar
> `src/webview/ui/anchors.ts`. Um nome que era identificador na 1.33.1 volta como identificador; um
> que era classe, como classe. O efeito prometido no parágrafo acima é cumprido por inteiro, e a
> folha do usuário continua sendo a última injetada.
>
> Consequências registradas: `T041` versiona um módulo, e não uma folha; `T044` não tem folha de
> compatibilidade para servir, de modo que a cascata da §8 de `style-anchors.md` passa a ter dois
> níveis, não três. O gerador recusa destino que não seja âncora declarada, e
> `src/test/legacy-compat.unit.test.ts` reprova qualquer divergência entre este documento e o módulo.

## 3. Mapa suportado

### 3.1 Estrutura do quadro

| Nome da 1.33.1 | Âncora equivalente | Observação |
|----------------|--------------------|------------|
| `#vsckb-card-todo` | `[data-vsckb-column="todo"]` | Era identificador, vira atributo |
| `#vsckb-card-in-progress` | `[data-vsckb-column="in-progress"]` | |
| `#vsckb-card-testing` | `[data-vsckb-column="testing"]` | |
| `#vsckb-card-done` | `[data-vsckb-column="done"]` | |
| `.vsckb-card-list` | `[data-vsckb="column-body"]` | |
| `.vsckb-primary-card-header` | `[data-vsckb="column-header"]` | |
| `.vsckb-primary-card-body` | `[data-vsckb="column-body"]` | Colide com `vsckb-card-list` na 1.33.1; ambos apontam para o mesmo elemento |
| `.vsckb-kanban-card` | `[data-vsckb="card"]` | |
| `.vsckb-kanban-card-title` | `[data-vsckb="card-title"]` | |
| `.vsckb-kanban-card-body` | `[data-vsckb="card-body"]` | |
| `.vsckb-kanban-card-footer` | `[data-vsckb="card-footer"]` | |
| `.vsckb-kanban-card-type` | `[data-vsckb-card-type]` | |
| `.vsckb-kanban-card-category` | `[data-vsckb="card-category"]` | |
| `.vsckb-kanban-card-info` | `[data-vsckb="card-footer"]` | |
| `.vsckb-kanban-card-progress` | `[data-vsckb="card-progress"]` | |
| `.vsckb-kanban-card-progress-bar` | `[data-vsckb="card-progress-bar"]` | |
| `.vsckb-kanban-card-col` | `[data-vsckb="column"]` | |
| `.vsckb-title` | `[data-vsckb="card-title"]` | Nome genérico na 1.33.1, usado em cinco lugares; o mapa liga ao título de cartão, que é o uso dominante |
| `.vsckb-body` | `[data-vsckb="card-body"]` | Mesma ressalva |

### 3.2 Barra superior e ações

| Nome da 1.33.1 | Âncora equivalente |
|----------------|--------------------|
| `#vsckb-save-board-btn` | `[data-vsckb="action-save"]` |
| `#vsckb-reload-board-btn` | `[data-vsckb="action-reload"]` |
| `#vsckb-filter-cards-btn` | `[data-vsckb="action-filter"]` |
| `.vsckb-additional-header-btns` | `[data-vsckb="board-header"]` |
| `.vsckb-add-btn` | `[data-vsckb="action-add"]` |
| `.vsckb-edit-btn` | `[data-vsckb="action-edit"]` |
| `.vsckb-clear-btn` | `[data-vsckb="action-clear"]` |
| `.vsckb-buttons` | `[data-vsckb="card-actions"]` |

### 3.3 Caixas de diálogo

| Nome da 1.33.1 | Âncora equivalente |
|----------------|--------------------|
| `#vsckb-add-card-modal` | `[data-vsckb-dialog="add-card"]` |
| `#vsckb-edit-card-modal` | `[data-vsckb-dialog="edit-card"]` |
| `#vsckb-card-details-modal` | `[data-vsckb-dialog="card-details"]` |
| `#vsckb-delete-card-modal` | `[data-vsckb-dialog="delete-card"]` |
| `#vsckb-clear-done-modal` | `[data-vsckb-dialog="clear-done"]` |
| `.vsckb-yes-btn`, `.vsckb-no-btn` | `[data-vsckb="dialog-confirm"]`, `[data-vsckb="dialog-cancel"]` |
| `.vsckb-save-btn`, `.vsckb-apply-btn` | `[data-vsckb="dialog-confirm"]` |

### 3.4 Vínculo entre cartões

| Nome da 1.33.1 | Âncora equivalente |
|----------------|--------------------|
| `.vsckb-ref-badge` | `[data-vsckb="card-reference"]` |
| `.vsckb-badge-list` | `[data-vsckb="card-references"]` |
| `.vsckb-list-of-linked-cards` | `[data-vsckb="card-references"]` |

## 4. O que **não** é mapeado, e por quê

Estes nomes da 1.33.1 não têm equivalente e **não** serão cobertos. A lista é explícita para que a
ausência seja informação, e não descoberta:

| Nome da 1.33.1 | Razão |
|----------------|-------|
| `#vsckb-new-card-*`, `#vsckb-edit-card-*` (campos individuais de formulário) | Eram identificadores de campo dentro dos formulários, manipulados por jQuery. Os campos passam a ser componentes do sistema adotado, cuja estrutura interna não é contrato de ninguém. Estilizar campo individual por identificador nunca foi caso de uso plausível de folha de usuário |
| `*-tab`, `*-tab-pane`, `*-tablist` | Vocabulário de abas do Bootstrap, que saiu do projeto na feature `001` |
| `.vsckb-markdown-editor` | Ligado à instância de CodeMirror, cuja estrutura pertence à biblioteca |
| `#vsckb-card-filter-modal` | Não há mais diálogo de filtro: desde a feature `001` o filtro é campo da barra superior, e criar um diálogo só para receber o nome antigo seria funcionalidade nova, vedada pelo escopo negativo. O controle em si continua alcançável por `[data-vsckb="action-filter"]`, que é âncora declarada |
| `.vsckb-card-filter-expr` | O campo de expressão do filtro será substituído por controles visuais, conforme o cartão `[2]` do quadro do projeto. Ancorar nele seria prometer estabilidade a algo já marcado para mudar |
| `.vsckb-with-known-url`, `.vsckb-url`, `.vsckb-help-link` | Elementos de conteúdo auxiliar sem correspondente estrutural |
| `.vsckb-card-`, prefixo truncado | Artefato de concatenação de texto no código antigo, nunca foi classe real |
| `.vsckb-task-list`, `.vsckb-card-type-list` | Listas internas de formulário, mesma razão dos campos |
| `.vsckb-time`, `.vsckb-creation-time`, `.vsckb-details`, `.vsckb-description`, `.vsckb-type`, `.vsckb-card` | Nomes genéricos demais, reutilizados em contextos diferentes na 1.33.1. Mapear qualquer um deles para um único destino produziria efeito errado em pelo menos um dos usos, o que é pior que não mapear |

Dos sessenta e oito nomes inventariados na versão 1.33.1, **trinta e nove são mapeados**, um por
célula das tabelas de §3. Os demais ficam de fora, cobertos pelas vinte entradas da tabela acima —
cinco delas famílias de identificador de formulário, que respondem por vários nomes cada. A cobertura
é da **estrutura visível** do quadro, que é o que folha de usuário realmente estiliza, e não do
interior dos formulários.

> As contagens desta seção foram reapuradas em 2026-08-03, na auditoria cruzada: a versão inicial
> dizia "trinta e sete mapeados e trinta e um de fora", números que não fechavam com as tabelas nem
> com o total de sessenta e oito. Conferir contando as células, não relendo esta frase.

## 5. Vida útil

A camada de compatibilidade é transitória por natureza, mas não tem data de remoção definida nesta
feature. Removê-la será mudança incompatível, com nota no `CHANGELOG.md` e elevação de versão maior,
e só deve acontecer quando houver evidência de que ninguém depende mais dela.

Remover a camada remove junto as âncoras de `style-anchors.md` §5, que existem para servi-la. As das
seções 3 e 4 daquele documento não são afetadas: sobrevivem à remoção, porque a promessa delas nunca
dependeu desta camada.

Enquanto existir, o mapa deste documento é a fonte de verdade: alterar `legacy-compat.css` sem
alterar esta tabela quebra o contrato, porque o arquivo é gerado a partir dela.

## 6. Verificação

O cenário "A folha escrita contra a interface antiga continua valendo", em `requirements.md` §7, e a
seção 9 do `onboarding.md` verificam este contrato. O teste mínimo é uma folha com uma regra contra
`.vsckb-kanban-card` e outra contra `#vsckb-card-done`, que precisam surtir efeito sem edição.
