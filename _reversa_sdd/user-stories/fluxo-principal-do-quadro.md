# User Stories — Fluxo principal do quadro

> Gerado pelo **Redator** (Reversa) em 2026-08-02
> Extraídas do comportamento observado, não de documentação de produto (que não existe).
> Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA

---

## Persona 🟡

**Pessoa desenvolvedora solo ou em equipe pequena**, que trabalha num repositório e quer
acompanhar tarefas sem trocar de contexto nem manter uma ferramenta externa sincronizada. Não
há outra persona no sistema: não existem papéis, permissões nem visões distintas.

---

## US-01 — Abrir o quadro do projeto

> **Como** pessoa desenvolvedora,
> **quero** abrir um quadro Kanban da pasta em que estou trabalhando,
> **para** ver minhas tarefas sem sair do editor.

**Critérios de aceitação** 🟢

```gherkin
Dado que abri uma pasta no editor
Quando aciono "Kanban: Open Board ..."
Então o quadro dessa pasta abre numa aba
E, se ainda não existir, o arquivo do quadro é criado vazio

Dado que tenho duas pastas abertas
Quando aciono o comando
Então escolho de qual pasta quero o quadro
```

**Unit:** `abertura-do-quadro` · **Valor:** entrada única do sistema

---

## US-02 — Registrar uma tarefa

> **Como** pessoa desenvolvedora,
> **quero** criar um cartão com título, tipo e prioridade,
> **para** não perder de vista o que precisa ser feito.

**Critérios de aceitação** 🟢

```gherkin
Dado o quadro aberto
Quando clico em "+" numa coluna e informo o título
Então o cartão aparece na coluna e é gravado no arquivo

Dado que acabei de criar um cartão com prioridade 3
Quando abro o modal para criar o próximo
Então a prioridade continua preenchida, para eu cadastrar vários em sequência
```

**Unit:** `gestao-de-cartoes` · **Valor:** o comportamento de campos preservados revela o caso
de uso real de **entrada em lote** 🟢

---

## US-03 — Descrever a tarefa com riqueza

> **Como** pessoa desenvolvedora,
> **quero** escrever descrição e detalhes em Markdown, com código, diagramas e listas de
> tarefas,
> **para** que o cartão sirva como documento de trabalho, não apenas como lembrete.

**Critérios de aceitação** 🟢

```gherkin
Dado que estou editando um cartão
Quando escrevo Markdown com um bloco de código
Então o bloco aparece com realce de sintaxe no cartão

Dado que escrevi uma lista de quatro tarefas e marquei duas
Quando vejo o cartão no quadro
Então uma barra de progresso indica 50%

Dado que escrevi um diagrama mermaid nos detalhes
Quando abro o modal de detalhes
Então o diagrama é renderizado
```

**Unit:** `renderizacao-markdown-e-diagramas` · **Valor:** o ESC desabilitado nos modais
confirma que o cartão é tratado como **documento**, não como item de lista 🟢

---

## US-04 — Mover a tarefa pelo fluxo

> **Como** pessoa desenvolvedora,
> **quero** mover um cartão entre Todo, In Progress, Testing e Done,
> **para** refletir o andamento real do trabalho.

**Critérios de aceitação** 🟢

```gherkin
Dado um cartão em Todo
Quando aciono o botão de mover para In Progress
Então o cartão muda de coluna e o arquivo é atualizado imediatamente

Dado dois cartões na mesma coluna com prioridades diferentes
Quando a coluna é exibida
Então o de maior prioridade aparece acima
```

**Unit:** `colunas-e-movimentacao`
🟢 **Limitação a comunicar:** não existe reordenação manual. A ordem é sempre prioridade, tipo
e título (ADR-006).

---

## US-05 — Encontrar tarefas num quadro cheio

> **Como** pessoa desenvolvedora com dezenas de cartões,
> **quero** filtrar o quadro por expressão,
> **para** enxergar só o que importa agora.

**Critérios de aceitação** 🟢

```gherkin
Dado um quadro com cartões de vários tipos
Quando aplico o filtro "is_bug"
Então apenas os bugs e issues aparecem

Dado que apliquei um filtro
Quando fecho e reabro o quadro
Então o mesmo filtro continua em vigor

Dado que escrevi uma expressão com erro de sintaxe
Quando aplico o filtro
Então todos os cartões continuam visíveis, em vez de o quadro parecer vazio
```

**Unit:** `filtro-de-cartoes` · **Valor:** 25 funções e 24 valores disponíveis; a
funcionalidade mais elaborada do sistema 🟢

---

## US-06 — Medir o tempo gasto

> **Como** pessoa desenvolvedora,
> **quero** iniciar e parar um cronômetro no cartão,
> **para** saber quanto tempo cada tarefa consumiu.

**Critérios de aceitação** 🟢

```gherkin
Dado a configuração de rastreamento ligada
Quando aciono o botão de tempo num cartão
Então o cronômetro começa e sou avisado

Quando aciono novamente
Então o cronômetro para e sou informado da duração acumulada

Dado a configuração de ocultar em colunas ociosas
Quando vejo um cartão em Todo ou Done
Então o botão de tempo não aparece
```

**Unit:** `time-tracking`
🟡 **Limitação a comunicar:** o tempo acumulado só aparece na mensagem momentânea da parada;
não há visualização permanente no cartão.

---

## US-07 — Levar as tarefas para fora do editor

> **Como** pessoa desenvolvedora,
> **quero** que meus cartões virem arquivos Markdown,
> **para** citá-los em *pull request*, wiki ou documentação.

**Critérios de aceitação** 🟢

```gherkin
Dado a exportação ligada
Quando gravo o quadro
Então cada cartão vira um arquivo Markdown com metadados, descrição e detalhes

Dado que excluí um cartão
Quando o quadro é gravado
Então o arquivo correspondente é removido
```

**Unit:** `exportacao-markdown`
🔴 **Risco a comunicar:** a limpeza apaga por padrão qualquer arquivo com o prefixo da extensão
no diretório escolhido, inclusive os que ela não criou.

---

## US-08 — Automatizar reações do quadro

> **Como** pessoa desenvolvedora,
> **quero** escrever um script que reaja a eventos do quadro,
> **para** integrar o Kanban ao meu fluxo (notificações, integrações, regras próprias).

**Critérios de aceitação** 🟢

```gherkin
Dado um arquivo de script no meu workspace exportando um handler de movimentação
Quando movo um cartão
Então meu handler é chamado com o cartão, a origem e o destino

Dado meu handler
Quando ele chama o método de mover para Done
Então o cartão passa para Done e o quadro é gravado
```

**Unit:** `scripts-de-evento-do-usuario`
🔴 **Risco a comunicar:** o mesmo mecanismo executa scripts de **repositórios de terceiros** com
privilégios da extensão, sem confirmação.

---

## US-09 — Versionar o acompanhamento junto do código

> **Como** pessoa desenvolvedora,
> **quero** que o quadro seja um arquivo no repositório,
> **para** que histórico, *branch* e revisão valham também para as tarefas.

**Critérios de aceitação** 🟢

```gherkin
Dado que uso o quadro
Quando faço commit da pasta .vscode
Então o quadro viaja com o código, com diff legível

Dado que troco de branch
Quando abro o quadro
Então vejo as tarefas daquele branch
```

**Unit:** `persistencia-do-quadro` · **Valor:** é a tese central do produto (ADR-001)
🟡 **Limitação a comunicar:** não há resolução de conflito. Se o arquivo mudar fora do editor
com o quadro aberto, a próxima gravação sobrescreve.

---

## Histórias ausentes 🔴

O que um usuário de Kanban esperaria e **não** existe:

| História esperada | Situação |
|---|---|
| "Quero limitar quantos cartões ficam em In Progress" | Ausente — não há limite de WIP (L1) |
| "Quero ver quanto tempo cada cartão levou de Todo até Done" | Impossível — não há histórico de transições |
| "Quero arrastar cartões para reordenar minha fila" | Ausente por decisão (ADR-006) |
| "Quero uma coluna de Backlog ou de Bloqueado" | Ausente por decisão (ADR-002) |
| "Quero desfazer uma exclusão" | Ausente |
| "Quero ver o quadro de outra pessoa da equipe" | Fora de escopo: monousuário por desenho |

A primeira é a mais significativa: **o produto se chama Kanban mas não implementa o limite de
trabalho em progresso**, que é o mecanismo definidor do método. É um quadro de cartões, e
qualquer evolução deve assumir isso explicitamente.
