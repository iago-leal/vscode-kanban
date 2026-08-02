# Plano de Exploração — vscode-kanban

> Criado pelo Reversa em 2026-08-02
> Marque cada tarefa com ✅ quando concluída.
> Você pode editar este plano antes de iniciar: adicione, remova ou reordene tarefas conforme necessário.

---

## Fase 1: Reconhecimento 🔍

- [x] ✅ **Scout** — Mapeamento de estrutura de pastas e tecnologias
- [x] ✅ **Scout** — Análise de dependências e gerenciadores de pacotes
- [x] ✅ **Scout** — Identificação de entry points, CI/CD e configurações

## Decisão de organização das specs 🗂️

> Entre o Scout e o Arqueólogo, o Reversa pergunta como você quer organizar as specs (por módulo, caso de uso, endpoint, híbrida, por features ou customizada). A escolha fica persistida em `.reversa/config.toml` na seção `[specs]` e não será reperguntada em execuções futuras. Para reapresentar o menu, remova manualmente a seção.

## Fase 2: Escavação 🏗️

> Módulos identificados pelo Scout em 2026-08-02. Ordem escolhida por dependência: núcleo primeiro, periferia depois.

- [x] ✅ **Arqueólogo** — Análise do módulo `extension` (`src/extension.ts`, 586 LOC)
- [x] ✅ **Arqueólogo** — Análise do módulo `workspaces` (`src/workspaces.ts`, 1.134 LOC)
- [x] ✅ **Arqueólogo** — Análise do módulo `boards` (`src/boards.ts`, 1.509 LOC)
- [x] ✅ **Arqueólogo** — Análise do módulo `html` (`src/html.ts`, 307 LOC)
- [x] ✅ **Arqueólogo** — Análise do módulo `toggl` (`src/toggl.ts`, 333 LOC)
- [x] ✅ **Arqueólogo** — Análise do módulo `announcements` (`src/announcements.ts`, 102 LOC)
- [x] ✅ **Arqueólogo** — Análise do módulo `board-ui` (`src/res/js/board.js`, 2.161 LOC)
- [x] ✅ **Arqueólogo** — Análise do módulo `webview-utils` (`src/res/js/script.js`, 520 LOC)

## Fase 3: Interpretação 🧠

- [x] ✅ **Detetive** — Arqueologia Git e ADRs retroativos
- [x] ✅ **Detetive** — Regras de negócio implícitas e máquinas de estado
- [x] ✅ **Detetive** — Matriz de permissões (RBAC/ACL)
- [x] ✅ **Arquiteto** — Diagramas C4 (Contexto, Containers, Componentes)
- [x] ✅ **Arquiteto** — ERD completo e integrações externas
- [x] ✅ **Arquiteto** — Spec Impact Matrix

## Fase 4: Geração 📝

- [x] ✅ **Redator** — Specs SDD por componente
- [x] ✅ **Redator** — OpenAPI (se aplicável)
- [x] ✅ **Redator** — User Stories (se aplicável)
- [x] ✅ **Redator** — Code/Spec Matrix

## Fase 5: Revisão ✅

- [x] ✅ **Revisor** — Revisão cruzada de specs
- [x] ✅ **Revisor** — Resolução de lacunas com o usuário
- [x] ✅ **Revisor** — Relatório de confiança final

---

## Agentes Independentes

> Execute estes agentes quando os recursos estiverem disponíveis — podem rodar em qualquer fase.

- [ ] **Visor** — Análise de interface via screenshots _(não executado: nenhuma screenshot fornecida)_
- [x] ⊘ **Data Master** — _não aplicável: o sistema não tem banco de dados_
- [ ] **Design System** — Extração de tokens de design _(disponível: src/res/css/board.css e style.css)_
- [ ] **Tracer** — Análise dinâmica _(requer a extensão rodando no editor)_

---

## Próximo passo

Após o Time de Descoberta concluir e o `_reversa_sdd/` estar populado, você pode disparar um dos fluxos seguintes:

- `/reversa-migrate`: orquestrador do **Time de Migração** (Paradigm Advisor → Curator → Strategist → Designer → Screen Translator → Inspector). Gera as specs do sistema novo. Saída em `_reversa_sdd/migration/` e `_reversa_sdd/screens/`.
- `/reversa-reconstructor`: gera plano bottom-up para reimplementar o software a partir das specs do legado (uma tarefa por sessão).
