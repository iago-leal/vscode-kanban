# Relatório de Confiança — vscode-kanban

> Gerado pelo **Revisor** (Reversa) em 2026-08-02 · `doc_level: completo`
> Método: contagem de marcadores de confiança em todos os artefatos gerados.
> Fórmula: `confiança = (🟢 + 🟡 × 0,5) ÷ total`

---

## Resumo Geral

| Nível | Quantidade | Percentual |
|---|---|---|
| 🟢 CONFIRMADO | 1.084 | 74,8% |
| 🟡 INFERIDO | 207 | 14,3% |
| 🔴 LACUNA | 158 | 10,9% |
| **Total** | **1.449** | 100% |

**Confiança geral: 82,0%**

Para um projeto sem documentação de arquitetura, sem ADRs, sem testes de domínio e parado há
quase quatro anos, 82% é um resultado alto. A razão é estrutural: o sistema é **pequeno em
código próprio** (~6.900 linhas), **explícito** (regras em condicionais e constantes, não em
configuração externa) e **sem infraestrutura oculta** — não há banco, fila nem serviço cuja
lógica escapasse à leitura do código.

---

## Por unit de spec

| Unit | 🟢 | 🟡 | 🔴 | Total | Confiança |
|---|---|---|---|---|---|
| `filtro-de-cartoes/` | 48 | 6 | 2 | 56 | **91%** |
| `integracao-toggl/` | 60 | 7 | 4 | 71 | **89%** |
| `identificacao-de-usuario/` | 42 | 7 | 3 | 52 | **88%** |
| `anuncios-e-changelog/` | 42 | 7 | 3 | 52 | **88%** |
| `abertura-do-quadro/` | 44 | 8 | 3 | 55 | 87% |
| `gestao-de-cartoes/` | 48 | 6 | 5 | 59 | 86% |
| `exportacao-markdown/` | 51 | 5 | 6 | 62 | 86% |
| `configuracao-do-workspace/` | 46 | 8 | 4 | 58 | 86% |
| `scripts-de-evento-do-usuario/` | 58 | 8 | 9 | 75 | 83% |
| `colunas-e-movimentacao/` | 52 | 4 | 10 | 66 | 82% |
| `renderizacao-markdown-e-diagramas/` | 47 | 4 | 9 | 60 | 82% |
| `time-tracking/` | 43 | 13 | 5 | 61 | 81% |
| `persistencia-do-quadro/` | 43 | 9 | 12 | 64 | **74%** |
| `vinculo-entre-cartoes/` | 31 | 9 | 8 | 48 | **74%** |
| **Subtotal das units** | **655** | **101** | **83** | **839** | **84,1%** |

### Artefatos transversais

| Categoria | 🟢 | 🟡 | 🔴 | Total | Confiança |
|---|---|---|---|---|---|
| Inventário, dependências, análise de código, dicionário | 155 | 21 | 12 | 188 | 88,6% |
| Domínio, máquinas de estado, permissões | 91 | 13 | 11 | 115 | 84,3% |
| Arquitetura, C4, ERD, matrizes | 131 | 50 | 42 | 223 | 70,0% |
| ADRs (8) | 25 | 15 | 5 | 45 | 72,2% |
| Fluxogramas (6) | 10 | 1 | 1 | 12 | 87,5% |
| User stories | 14 | 4 | 4 | 22 | 72,7% |
| **Subtotal transversal** | **429** | **106** | **75** | **610** | **79,0%** |

---

## Leitura dos extremos

**As duas units mais confiáveis** — `filtro-de-cartoes` (91%) e `integracao-toggl` (89%) — são
aquelas cuja lógica está inteiramente contida numa única função extensa e explícita. Não há o
que inferir: as 25 funções do ambiente de filtro e os seis endpoints do Toggl estão escritos.

**As duas menos confiáveis** têm causas distintas:

- `vinculo-entre-cartoes` (74%) — a **semântica** do vínculo não existe no código. Sabe-se o
  que a funcionalidade faz, não o que ela significa. É lacuna de intenção, não de leitura.
- `persistencia-do-quadro` (74%) — concentra as decisões **não tomadas**: o que fazer com
  arquivo corrompido, com conflito de gravação, com versionamento de esquema. O legado
  simplesmente não define comportamento nesses casos, e a spec registra isso em vez de inventar.

A seção de **arquitetura e matrizes** tem a menor confiança entre os transversais (70%), o que
é esperado: ali estão as recomendações de evolução e as estimativas de risco, que são
inferência por natureza.

---

## Lacunas pendentes 🔴

Consolidadas em `gaps.md` (23 itens) e, quando dependem de decisão humana, em `questions.md`
(8 perguntas — Q7 e Q8 acrescentadas nesta revisão). Distribuição:

| Severidade | Quantidade | Dependem de decisão humana |
|---|---|---|
| 🔴 Crítica | 6 | 4 |
| 🟡 Moderada | 10 | 5 |
| 🟢 Cosmética | 7 | 1 |

### Por unit afetada

| Unit | Lacuna | Pergunta |
|---|---|---|
| `scripts-de-evento-do-usuario` | Política de segurança da execução de scripts | Q1 |
| `persistencia-do-quadro` | Semântica exigida da numeração de cartões | Q2 |
| `abertura-do-quadro` | Escopo das raízes de recurso do Webview | Q3 |
| `integracao-toggl` | A integração ainda é usada? | Q4 |
| `persistencia-do-quadro` | Origem do número mágico na geração de identificadores | Q5 |
| `renderizacao-markdown-e-diagramas` | Política de sanitização do conteúdo | Q6 |
| `vinculo-entre-cartoes` | Semântica de `references` | Q7 |
| `persistencia-do-quadro` | Comportamento com arquivo corrompido | Q8 |

---

## Histórico de reclassificações

| De | Para | Afirmação | Evidência |
|---|---|---|---|
| 🟡 | 🟢 | Barras de progresso derivam da contagem de caixas marcadas em listas de tarefas | `board.js:1139-1180` |
| 🟡 | 🟢 | A conversão de Markdown também estiliza tabelas e torna imagens responsivas | `script.js:238-246` |
| 🟢 | 🟢 (corrigido) | O `id` é atribuído **na criação e também na carga**, com a lógica duplicada em dois idiomas | `board.js:1841-1852` e `boards.ts:1411-1437` |
| 🟡 | 🟢 | Limite de 255 caracteres existe apenas no modal de edição | `boards.ts:746` (ausente no modal de criação) |
| 🟡 | 🟢 | ESC desabilitado nos dois modais de escrita | `boards.ts:529` e `:678` |

A terceira linha é a correção mais relevante da revisão: a spec original afirmava que a
identidade era atribuída **apenas** na carga. A verificação no código mostrou que existem
**duas implementações equivalentes**, uma em cada lado da ponte. Registrado como G-01 e
incorporado a `persistencia-do-quadro/`.

---

## Recomendações

- [ ] **Antes de qualquer código**, responder Q1 e Q6 em `questions.md`: as duas definem
      políticas de segurança que atravessam várias units e mudam o desenho, não apenas a
      implementação.
- [ ] **Unificar a geração de identificadores** (G-01) antes de tocar em identidade de cartão.
      Duas implementações equivalentes em idiomas diferentes é dívida que se paga em bug
      silencioso.
- [ ] **Destravar o *build* primeiro** (`architecture.md` §11): o pacote `vscode` 1.1.37 está
      deprecado e seu `postinstall` provavelmente falha hoje. Nenhuma outra recomendação é
      executável sem isso.
- [ ] **Escrever os testes de caracterização** propostos em `spec-impact-matrix.md` §4 antes de
      qualquer refatoração. As seis primeiras funções da lista são puras e testáveis sem
      Webview.
- [ ] `vinculo-entre-cartoes` e `persistencia-do-quadro` são as units que mais se beneficiam de
      uma conversa de dez minutos: quase toda a incerteza delas é de **decisão**, não de
      extração.
- [ ] Registrar explicitamente na documentação do produto que **não há limite de WIP** (G-09).
      O nome do produto cria uma expectativa que o comportamento não atende.

---

## Nota metodológica

O percentual mede a **confiança da extração**, não a qualidade do sistema extraído. Um sistema
com problemas graves e código explícito produz confiança alta — é exatamente o caso aqui. Os
82% dizem que as specs descrevem fielmente o vscode-kanban; a avaliação do que foi descrito
está em `architecture.md` §8 e §9.
