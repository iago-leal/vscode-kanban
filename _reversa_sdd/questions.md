# Perguntas para validação humana — vscode-kanban

> Modo de resposta: **arquivo** (`answer_mode: file`). Responda abaixo de cada pergunta, na
> linha `**Resposta:**`. Nenhuma pergunta bloqueia a extração.
>
> Aberto pelo **Arqueólogo** em 2026-08-02, revisado e fechado pelo **Revisor** na mesma data.
>
> **Prioridade:** Q1 e Q6 definem políticas de segurança que atravessam várias units — responda
> essas duas primeiro. As demais afetam uma unit cada.
>
> Lacunas que **não** dependem de decisão sua (as técnicas) estão em `gaps.md`, não aqui.

---

## Q1 — Execução de código arbitrário do workspace 🔴

**Contexto.** `src/workspaces.ts:769` carrega `.vscode/vscode-kanban.js` com
`vscode_helpers.loadModule` e o executa com `require` irrestrito e o `ExtensionContext`
completo nos argumentos. Basta abrir um repositório de terceiros que contenha esse arquivo
para que qualquer evento de cartão dispare o script. Com `openOnStartup: true`, isso ocorre
sem nenhuma ação do usuário.

**Pergunta.** Esse é um recurso deliberado a ser preservado como está, ou uma superfície de
ataque a ser fechada numa eventual evolução (confirmação explícita, allowlist de workspaces
confiáveis, ou uso do Workspace Trust do VS Code)?

**Impacto na spec.** Define se a extensibilidade por script entra nos requisitos como
capacidade de primeira classe ou como débito a mitigar.

**Resposta:**

---

## Q2 — Geração de IDs simples 🟡

**Contexto.** `src/boards.ts:1389-1405`: `FIND_NEXT_SIMPLE_CARD_ID()` percorre o quadro
inteiro a cada cartão sem `id` e devolve `max(ids numéricos) + 1`. Funciona porque `C.id` é
mutado antes da iteração seguinte, mas o custo é quadrático e a numeração depende da ordem
das colunas em `BOARD_COLMNS`.

**Pergunta.** A numeração sequencial precisa ser estritamente crescente e sem lacunas
(reaproveitando IDs de cartões apagados), ou basta ser única dentro do quadro?

**Impacto na spec.** Determina se a spec de identidade de cartão exige contador persistido ou
apenas unicidade.

**Resposta:**

---

## Q3 — Escopo de recursos do Webview 🔴

**Contexto.** `src/boards.ts:922-932` acrescenta `OS.homedir()` às `localResourceRoots` do
Webview, autorizando o carregamento de **qualquer arquivo sob o diretório home** como recurso.
Somado a `enableCommandUris: true` e à ausência de CSP, amplia bastante a superfície de
ataque.

**Pergunta.** Você sabe se essa inclusão do home atende a algum caso de uso real (por exemplo,
folha de estilo `vscode-kanban.css` guardada em `~`), ou é resíduo histórico que pode ser
restringido a `.vscode/` e `out/res`?

**Impacto na spec.** Define o requisito não-funcional de isolamento do Webview.

**Resposta:**

---

## Q4 — Situação da integração Toggl 🟡

**Contexto.** `src/toggl.ts` aponta inteiramente para `https://www.toggl.com/api/v8`. A v8 foi
descontinuada pelo fornecedor, com a v9 em `api.track.toggl.com`. Não foi possível verificar o
comportamento atual sem credencial.

**Pergunta.** A integração Toggl ainda é usada por você, ou pode ser documentada como
funcionalidade legada (possivelmente inoperante) na spec?

**Impacto na spec.** Decide se a feature `integracao-toggl` entra como requisito ativo, como
requisito a migrar para v9, ou como escopo negativo.

**Resposta:**

---

## Q5 — Número mágico na geração de identificadores 🟡

**Contexto.** `Math.floor(Math.random() * 597923979)` aparece em `boards.ts:1425` e
`board.js:2013`. Não há comentário nem constante nomeada explicando a origem do valor.

**Pergunta.** Há alguma razão conhecida para esse número específico, ou pode ser tratado como
arbitrário e substituído por um gerador de UUID padrão?

**Impacto na spec.** Baixo — afeta apenas a redação da regra de geração de identidade.

**Resposta:**

---

## Q6 — Sanitização do conteúdo dos cartões 🔴

**Contexto.** `src/res/js/script.js:235` remove apenas as tags `<script>` após a conversão
Markdown → HTML pelo Showdown. Atributos de evento (`onerror`, `onclick`) e elementos como
`<iframe>` passam intactos. Com `enableScripts: true` e sem CSP, um cartão contendo
`<img src=x onerror=...>` executa script no contexto do Webview.

**Pergunta.** O conteúdo dos cartões deve poder conter HTML arbitrário (o que é útil para
formatação rica e é o comportamento atual), ou a spec deve exigir sanitização real (DOMPurify
ou equivalente) mesmo ao custo de perder formatações?

**Impacto na spec.** Define o requisito de segurança da feature
`renderizacao-markdown-e-diagramas`.

**Resposta:**

---

## Q7 — Semântica do vínculo entre cartões 🔴

> Acrescentada pelo **Revisor**. Corresponde à lacuna G-02 de `gaps.md`.

**Contexto.** O campo `references` (`boards.ts:91`) guarda uma lista de identificadores de
outros cartões. A interface permite criar e remover vínculos, mas nada no código indica o que
o vínculo **significa**. Sem isso, três comportamentos ficam indefinidos: o que fazer ao excluir
um cartão referenciado, se o vínculo deveria ser bidirecional e se ciclos devem ser detectados.

**Pergunta.** Ao vincular o cartão A ao cartão B, qual é a intenção?

1. **Dependência** — A depende de B; excluir B deveria avisar ou bloquear;
2. **Subtarefa** — B faz parte de A; excluir A deveria propagar ou reparentar;
3. **Veja também** — associação livre; referência órfã é tolerável, bastando sinalizá-la.

**Impacto na spec.** Desbloqueia `vinculo-entre-cartoes/tasks.md` T-09 e T-10, e determina se
`gestao-de-cartoes/tasks.md` T-13 é necessária.

**Resposta:**

---

## Q8 — Comportamento diante de arquivo de quadro corrompido 🔴

> Acrescentada pelo **Revisor**. Corresponde à lacuna G-05 de `gaps.md`.

**Contexto.** `boards.ts:1342` faz `JSON.parse` do arquivo do quadro sem `try/catch`, sem cópia
de segurança e sem recuperação. Um `vscode-kanban.json` corrompido — por conflito de *merge* mal
resolvido, por exemplo — rejeita a promessa e chega ao usuário como erro genérico, sem que o
quadro abra.

**Pergunta.** Qual deve ser o comportamento?

1. **Falhar com clareza** — mensagem nomeada, arquivo preservado intacto, quadro não abre;
2. **Recuperar com cópia** — mover o arquivo corrompido para `.bak` e abrir um quadro vazio;
3. **Tentar reparar** — carregar as colunas que forem analisáveis e descartar o resto, avisando.

**Impacto na spec.** Desbloqueia `persistencia-do-quadro/tasks.md` T-03, e condiciona T-09
(escrita atômica) e T-12 (versão de esquema).

**Resposta:**
