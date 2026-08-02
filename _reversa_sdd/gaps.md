# Lacunas — vscode-kanban

> Gerado pelo **Revisor** (Reversa) em 2026-08-02 · `doc_level: completo`
> Lacunas que permaneceram sem resposta ao fim da extração, com severidade.
>
> As lacunas que **só o usuário pode resolver** estão em `questions.md` (Q1 a Q6). Aqui ficam
> todas, inclusive as que não dependem de decisão humana e sim de trabalho técnico.

---

## Legenda de severidade

| Nível | Critério |
|---|---|
| 🔴 **Crítico** | Bloqueia reimplementação fiel, ou representa risco de segurança ou de perda de dados |
| 🟡 **Moderado** | Afeta a qualidade da spec ou a evolução, mas não impede reimplementar |
| 🟢 **Cosmético** | Inconsistência menor, sem efeito sobre comportamento |

---

## Críticas 🔴

### G-01 — Lógica de geração de identificador duplicada em dois idiomas

**Encontrado na revisão.** A geração de `id` existe duas vezes, com a mesma semântica:

| Onde | Quando age | Arquivo |
|---|---|---|
| Webview | Na criação do cartão | `board.js:1841-1852` e `:274-284` |
| Extensão | Na carga, para cartões sem `id` | `boards.ts:1411-1437` e `:1389-1405` |

As duas implementações precisam permanecer equivalentes; divergirem produz identidades
inconsistentes conforme a origem do cartão. É consequência direta do ADR-008 (domínio no
Webview) e o exemplo mais claro do custo dessa decisão.

**Encaminhamento:** unificar numa única implementação antes de qualquer mudança na identidade.
Registrado em `persistencia-do-quadro/tasks.md` T-05.

### G-02 — Semântica de `references` indefinida

Não é possível determinar, pelo código, se um vínculo significa dependência, subtarefa ou
associação livre. Isso bloqueia decidir o comportamento correto na exclusão de um cartão
referenciado e a pertinência de bidirecionalidade e de detecção de ciclo.

**Encaminhamento:** `questions.md` Q7. Bloqueia `vinculo-entre-cartoes/tasks.md` T-09 e T-10.

### G-03 — Política de segurança da execução de scripts do workspace

O mecanismo executa código de terceiros com privilégios da extensão, sem confirmação nem
Workspace Trust. Não é possível saber, pelo código, se isso é recurso deliberado ou omissão
histórica.

**Encaminhamento:** `questions.md` Q1. Bloqueia `scripts-de-evento-do-usuario/tasks.md` T-02 e
T-06.

### G-04 — Política de sanitização do conteúdo dos cartões

A remoção de `<script>` é a única barreira. Não é possível decidir, sem o usuário, se o
conteúdo deve poder conter HTML arbitrário ou se a sanitização deve ser real.

**Encaminhamento:** `questions.md` Q6. Bloqueia
`renderizacao-markdown-e-diagramas/tasks.md` T-02 e condiciona T-03.

### G-05 — Comportamento diante de arquivo de quadro corrompido

`JSON.parse` sem tratamento, sem cópia de segurança e sem recuperação. O legado não define
comportamento: apenas falha.

**Encaminhamento:** `questions.md` Q8. Registrado em `persistencia-do-quadro/tasks.md` T-03.

### G-06 — Escopo das raízes de recurso do Webview

O diretório home inteiro está autorizado como raiz de recurso. Não é possível determinar se
isso atende a algum caso de uso real (folha de estilo customizada em `~`) ou é resíduo.

**Encaminhamento:** `questions.md` Q3. Condiciona `abertura-do-quadro/tasks.md` T-06.

---

## Moderadas 🟡

### G-07 — Situação real da integração Toggl

A API v8 está descontinuada. Sem credencial, não foi possível verificar se a integração ainda
funciona. Toda a unit `integracao-toggl` fica condicionada.
**Encaminhamento:** `questions.md` Q4.

### G-08 — Semântica exigida da numeração sequencial de cartões

Única no quadro, ou estritamente crescente sem lacunas? Afeta o algoritmo e o custo.
**Encaminhamento:** `questions.md` Q2.

### G-09 — Ausência de limite de trabalho em progresso

O produto se chama Kanban e não implementa o mecanismo definidor do método. Não é lacuna de
extração — é ausência real de funcionalidade, que a spec registra explicitamente.
**Encaminhamento:** decisão de produto. `colunas-e-movimentacao/tasks.md` T-11.

### G-10 — Ausência de histórico de transições

Sem registro de quando um cartão mudou de coluna, nenhuma métrica de fluxo é possível. Exigiria
mudança de modelo de dados.
**Encaminhamento:** `colunas-e-movimentacao/tasks.md` T-12.

### G-11 — Versões desconhecidas das bibliotecas vendorizadas

Nove bibliotecas em `src/res/`, sem número de versão em lugar algum. Impossível avaliar
exposição a vulnerabilidades conhecidas ou planejar atualização.
**Encaminhamento:** identificar versão por assinatura de conteúdo, ou substituir por
dependências gerenciadas. `dependencies.md` risco 2.

### G-12 — Contrato público dos scripts nunca versionado

`EventScriptFunctionArguments` é API consumida por código fora deste repositório. Não há
inventário nem versionamento: qualquer quebra só aparece na máquina do usuário.
**Encaminhamento:** `scripts-de-evento-do-usuario/tasks.md` TM-01.

### G-13 — Política de conflito quando o arquivo muda fora do editor

Última gravação vence, sem detecção. Com o quadro versionado, o cenário `git pull` com quadro
aberto é plausível.
**Encaminhamento:** decisão técnica. Sem tarefa associada, por falta de decisão.

### G-14 — Comportamento pretendido de `openOnStartup`

Hoje reabre a cada mudança de configuração, não só na ativação. Parece efeito colateral, não
intenção.
**Encaminhamento:** `configuracao-do-workspace/tasks.md` T-10.

### G-15 — Destino do aviso de recrutamento

O aviso é de 2020, convida a uma refatoração que não ocorreu, e continua sendo exibido a quem
instala a extensão hoje.
**Encaminhamento:** `anuncios-e-changelog/tasks.md` T-07.

### G-16 — Contrato de uso do campo `tag`

A extensão guarda o histórico de tempo em `tag['time-tracking']`, e os scripts do usuário
escrevem no mesmo campo. Nenhum contrato define a convivência.
**Encaminhamento:** `time-tracking/tasks.md` T-12.

---

## Cosméticas 🟢

### G-17 — Vocabulário divergente de tipos de cartão

`issue`, `note` e `task` são reconhecidos pelo filtro e pela exportação, mas não existem no
seletor da interface. Um cartão `issue` é `is_bug` no filtro, mas recebe cor de tipo genérico.
**Encaminhamento:** `gestao-de-cartoes/tasks.md` T-02.

### G-18 — Limite de 255 caracteres apenas no modal de edição

Presente em `boards.ts:746`, ausente no modal de criação. Assimetria confirmada, provavelmente
não intencional.
**Encaminhamento:** `gestao-de-cartoes/tasks.md` T-12.

### G-19 — Renomeação de chave na fronteira

`noTimeTrackingIfIdle` vira `hideTimeTrackingIfIdle` ao cruzar para o Webview. Fonte de
confusão ao ler o código.
**Encaminhamento:** `configuracao-do-workspace/tasks.md` T-07.

### G-20 — Erro de digitação em constante do domínio

`BOARD_COLMNS` (`boards.ts:388`) preservado desde 2018. Corrigir não altera comportamento.
**Encaminhamento:** `colunas-e-movimentacao/tasks.md` T-01.

### G-21 — Origem do número mágico 597923979

Presente em dois lugares, sem comentário nem constante nomeada.
**Encaminhamento:** `questions.md` Q5.

### G-22 — Variável global implícita no filtro

`for (i = 2; ...)` sem `let` em `script.js:163`. Passa silenciosamente por falta de modo
estrito.
**Encaminhamento:** `filtro-de-cartoes/tasks.md` T-05.

### G-23 — Escape HTML aplicado a conteúdo Markdown

Na exportação, um título com `&` sai como `&amp;` no arquivo `.md`.
**Encaminhamento:** `exportacao-markdown/tasks.md` T-12.

---

## Consolidação

| Severidade | Quantidade | Dependem de decisão humana | Dependem só de trabalho técnico |
|---|---|---|---|
| 🔴 Crítica | 6 | 4 (G-02, G-03, G-04, G-06) | 2 (G-01, G-05) |
| 🟡 Moderada | 10 | 5 | 5 |
| 🟢 Cosmética | 7 | 1 (G-21) | 6 |
| **Total** | **23** | **10** | **13** |

**Nenhuma lacuna impede reimplementar o sistema.** As seis críticas afetam decisões de
segurança e de semântica, não a compreensão do comportamento: uma equipe com estas specs
conseguiria reconstruir a extensão fielmente, escolhendo por conta própria as políticas que as
lacunas deixam em aberto.
