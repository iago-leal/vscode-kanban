# Abertura do Quadro — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] API de extensão do VS Code disponível (`@types/vscode`, engine ≥ 1.62)
- [ ] Unit `configuracao-do-workspace` disponível (fornece `Config` e `BoardSettings`)
- [ ] Unit `persistencia-do-quadro` disponível (fornece leitura e criação do arquivo)
- [ ] Unit `identificacao-de-usuario` disponível (fornece o nome corrente)

## Tarefas

- [ ] T-01, Contribuir o comando `extension.kanban.openBoard` com categoria "Kanban" e título
      "Open Board ..."
  - Origem no legado: `package.json:26-32`
  - Critério de pronto: o comando aparece na paleta
  - Confiança: 🟢

- [ ] T-02, Registrar um observador de pastas de workspace que instancie um objeto de workspace
      por pasta **local** (esquema de URI `''` ou `file`)
  - Origem no legado: `extension.ts:269-298`
  - Critério de pronto: pasta remota não gera instância; pasta local gera
  - Confiança: 🟢

- [ ] T-03, Implementar a seleção de pasta: lista com nome (ou `Workspace #<índice>`) e caminho
      absoluto; pular o seletor com uma única pasta; avisar quando não houver nenhuma
  - Origem no legado: `extension.ts:226-257`
  - Critério de pronto: os três casos (0, 1, N pastas) se comportam como especificado
  - Confiança: 🟢

- [ ] T-04, Garantir a existência de `.vscode/` e de `vscode-kanban.json`, criando o quadro
      vazio quando ausente, e abortar com aviso se qualquer caminho tiver tipo errado
  - Origem no legado: `workspaces.ts:445-469`
  - Critério de pronto: primeira abertura cria arquivo com as quatro colunas vazias
  - Confiança: 🟢

- [ ] T-05, Montar as opções de abertura (resolvedor de arquivo, carregador de filtro,
      listeners de gravação, configurações de coluna, cliente Git, título)
  - Origem no legado: `workspaces.ts:471-587`
  - Critério de pronto: todos os campos de `OpenBoardOptions` preenchidos conforme `design.md`
  - Confiança: 🟢

- [ ] T-06, Criar o painel Webview com scripts habilitados, *find widget*, retenção de contexto
      e raízes de recurso
  - Origem no legado: `boards.ts:1102-1113`
  - Critério de pronto: o painel abre e carrega os recursos locais
  - Confiança: 🟢
  - ⚠️ **Revisar antes de reimplementar:** as raízes incluem o diretório home
    (`questions.md` Q3) e não há CSP (`questions.md` Q6)

- [ ] T-07, Implementar o handshake: aguardar `onLoaded` do Webview, então enviar `setBoard`,
      `setTitleAndFilePath` e, quando houver nome, `setCurrentUser`
  - Origem no legado: `boards.ts:983-1034`
  - Critério de pronto: o quadro aparece populado sem ação do usuário
  - Confiança: 🟢

- [ ] T-08, Impedir painel duplicado: devolver `false` se já existir painel para o quadro
  - Origem no legado: `boards.ts:1078-1080`
  - Critério de pronto: acionar o comando duas vezes não duplica a aba
  - Confiança: 🟢

- [ ] T-09, Descartar o painel parcial e restaurar o estado em caso de falha na criação
  - Origem no legado: `boards.ts:1281-1286`
  - Critério de pronto: falha simulada não deixa painel órfão
  - Confiança: 🟢

- [ ] T-10, Implementar a abertura na inicialização governada por `openOnStartup`
  - Origem no legado: `workspaces.ts:590-598`
  - Critério de pronto: com a chave ligada, o quadro abre ao carregar a pasta
  - Confiança: 🟢
  - 🟡 **Decisão pendente:** no legado isso dispara a cada mudança de configuração; avaliar se
    o comportamento deve ser restrito à ativação

- [ ] T-11, Restringir a ativação da extensão a `workspaceContains:.vscode/vscode-kanban.json`
      combinado com `onCommand`, em vez de `*`
  - Origem no legado: `package.json:21-23` (comportamento atual a **substituir**)
  - Critério de pronto: a extensão não ativa em pasta sem quadro, e `openOnStartup` continua
    funcionando onde há quadro
  - Confiança: 🟡 — melhoria proposta pelo ADR-007, não comportamento do legado

## Tarefas de Teste

- [ ] TT-01, Abertura em pasta sem quadro cria o arquivo com quatro colunas vazias
- [ ] TT-02, Abertura com múltiplas pastas apresenta seletor e respeita a escolha
- [ ] TT-03, Ausência de workspace produz aviso e nenhum painel
- [ ] TT-04, `.vscode` como arquivo produz aviso e aborta
- [ ] TT-05, Segunda abertura do mesmo quadro não duplica o painel
- [ ] TT-06, Título reflete o nome da pasta, e `Workspace #<índice>` quando o nome é vazio
- [ ] TT-07, Handshake popula o quadro sem interação

## Tarefas de Migração de Dados

Não se aplica: a unit não altera o formato do quadro.

## Ordem Sugerida

1. T-01 e T-02 primeiro: sem comando e sem instância de workspace nada mais é exercitável.
2. T-04 antes de T-05, porque as opções dependem dos caminhos resolvidos.
3. T-06 e T-07 juntos: o painel sem handshake abre vazio e não é verificável.
4. T-08 e T-09 são endurecimento e podem vir depois do caminho feliz.
5. T-10 depende de `configuracao-do-workspace`.
6. T-11 por último, já com o restante estável, para poder verificar que a ativação restrita não
   quebra `openOnStartup`.

## Lacunas Pendentes 🔴

- **Q3 (`questions.md`)** — escopo das raízes de recurso do Webview. Bloqueia a decisão final
  de T-06.
- **Q6 (`questions.md`)** — política de CSP e sanitização, ligada à mesma tarefa.
- 🟡 Comportamento pretendido de `openOnStartup` diante de mudanças de configuração (T-10).
