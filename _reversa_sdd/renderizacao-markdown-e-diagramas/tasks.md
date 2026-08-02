# Renderização de Markdown e Diagramas — Tarefas de Implementação

> Unit da extração Reversa · 2026-08-02

## Pré-requisitos

- [ ] Conversor de Markdown disponível na camada de interface
- [ ] Unit `gestao-de-cartoes` disponível (modais de escrita)
- [ ] **Decisão sobre a política de sanitização** (Q6) — ver Lacunas Pendentes

## Tarefas

- [ ] T-01, Implementar a conversão de Markdown em HTML para descrição e detalhes
  - Origem no legado: `script.js:227-296`
  - Critério de pronto: formatação básica (negrito, listas, títulos, tabelas) aparece
  - Confiança: 🟢

- [ ] T-02, Sanitizar o HTML gerado com biblioteca dedicada, em vez de remover apenas `<script>`
  - Origem no legado: `script.js:235` (comportamento atual, insuficiente)
  - Critério de pronto: atributos de evento e elementos perigosos são removidos; a formatação
    legítima é preservada
  - Confiança: 🔴 — depende da decisão de Q6

- [ ] T-03, Declarar Content-Security-Policy no documento do Webview
  - Origem no legado: **ausente** (`html.ts:160-226`)
  - Critério de pronto: a política bloqueia script inline não autorizado, e a interface segue
    funcional
  - Confiança: 🟡 — exige verificação manual de toda a interface (ver `spec-impact-matrix.md` C3)

- [ ] T-04, Aplicar realce de sintaxe aos blocos de código
  - Origem no legado: `script.js:3-8`
  - Critério de pronto: bloco com linguagem declarada aparece colorido
  - Confiança: 🟢

- [ ] T-05, Renderizar diagramas Mermaid apenas quando o modal de detalhes for exibido
  - Origem no legado: `script.js:9-23`, `boards.ts:2126-2134`
  - Critério de pronto: o diagrama aparece ao abrir o detalhe, e não antes
  - Confiança: 🟢

- [ ] T-06, Derivar barra de progresso de listas de tarefas na descrição
  - Origem no legado: CHANGELOG 1.8.0, renderização em `board.js:730-1211`
  - Critério de pronto: 2 de 4 itens marcados exibem 50%
  - Confiança: 🟢

- [ ] T-07, Interceptar âncoras do conteúdo e encaminhar a abertura à camada de extensão
  - Origem no legado: `script.js:220-225`, `:227-296`
  - Critério de pronto: clique em link não navega dentro do Webview
  - Confiança: 🟢

- [ ] T-08, Exibir confirmação antes de abrir URL externa, com o texto e o endereço visíveis
  - Origem no legado: `boards.ts:1149-1188`
  - Critério de pronto: só após confirmação o alvo é aberto
  - Confiança: 🟢

- [ ] T-09, Manter a lista fixa de URLs conhecidas, abertas sem confirmação
  - Origem no legado: `boards.ts:394-401`, `:1190-1197`
  - Critério de pronto: os seis destinos conhecidos abrem direto; qualquer outro exige
    confirmação
  - Confiança: 🟢

- [ ] T-10, Integrar editor de Markdown com realce nos modais de escrita
  - Origem no legado: `script.js:1`, `:309-322`, `html.ts:177-179`
  - Critério de pronto: os campos de descrição e detalhes usam o editor
  - Confiança: 🟢

- [ ] T-11, Gravar conteúdo editado sempre com MIME `text/markdown`
  - Origem no legado: `board.js:423-438`
  - Critério de pronto: o campo gravado traz o MIME correto
  - Confiança: 🟢

- [ ] T-12, Reduzir os modos de linguagem vendorizados ao que é efetivamente carregado
  - Origem no legado: 121 modos versionados, um carregado (`html.ts:179`)
  - Critério de pronto: o pacote encolhe sem perda funcional
  - Confiança: 🟢 — melhoria de higiene, sem risco

## Tarefas de Teste

- [ ] TT-01, Markdown básico é convertido corretamente
- [ ] TT-02, Tag `<script>` não sobrevive à conversão
- [ ] TT-03, Atributo de evento não sobrevive à conversão (após T-02)
- [ ] TT-04, `<iframe>` não sobrevive à conversão (após T-02)
- [ ] TT-05, Conteúdo `text/plain` é exibido sem conversão
- [ ] TT-06, Lista de tarefas produz percentual correto
- [ ] TT-07, Link externo exige confirmação; URL conhecida não exige
- [ ] TT-08, Diagrama Mermaid só é renderizado ao abrir o detalhe
- [ ] TT-09, Conteúdo vazio não anexa nada ao cartão

## Tarefas de Migração de Dados

- [ ] TM-01, Verificar o impacto de T-02 sobre cartões existentes que usem HTML embutido
      legítimo (tabelas, imagens, quebras de linha)
  - Critério de pronto: nenhum cartão real perde formatação relevante

## Ordem Sugerida

1. **T-02 é decisão antes de tarefa**: resolver Q6 primeiro determina se a implementação é
   permissiva (como hoje) ou restritiva.
2. T-01 e T-04 formam o caminho feliz da exibição.
3. T-07 a T-09 (links) podem entrar cedo; já estão bem resolvidos no legado.
4. T-05 e T-06 são refinamentos de exibição.
5. T-10 e T-11 dependem dos modais.
6. T-03 por último dentro do bloco de segurança, porque é a mudança com maior chance de quebrar
   a interface e exige verificação manual.
7. T-12 é independente e pode ser feita a qualquer momento.

## Lacunas Pendentes 🔴

- **Q6 (`questions.md`)** — o conteúdo do cartão deve poder conter HTML arbitrário (comportamento
  atual, útil para formatação rica) ou a spec deve exigir sanitização real, ainda que ao custo de
  perder formatações? Bloqueia T-02 e condiciona T-03.
- Versões desconhecidas das bibliotecas vendorizadas envolvidas na renderização.
