# Roadmap: Quadro sobre sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Requirements: `_reversa_forward/002-primer-design-system/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature `001` já fez o trabalho estrutural: dissolveu o `board-ui` de 2.161 linhas em domínio,
adaptadores, ponte e componentes, e isolou toda a aparência em dois arquivos, `theme/tokens.css` e
`theme/board.css`. Esta feature é, por isso, um delta estreito e fundo: **troca a origem dos valores
visuais sem tocar em nada que decida comportamento**.

O caminho tem quatro movimentos. Primeiro, `tokens.css` é extinto e os conjuntos de cor passam a vir
de `@primer/primitives`, selecionados pelos atributos que a própria biblioteca lê, no mesmo elemento
raiz onde hoje mora `data-vsckb-theme`. Segundo, os componentes de `ui/` deixam de ser marcação
autoral e passam a compor os controles de `@primer/react`, ficando `board.css` reduzido ao que é
geometria de quadro: a faixa das colunas, a pilha de cartões e a área de arrastar. Terceiro, o piso de
versão do editor sobe para 1.78, o que traz o motor de renderização de Chromium 102 para 108 e torna
íntegro o acabamento dos componentes. Quarto, nasce uma folha de compatibilidade que faz os nomes de
classe da versão 1.33.1 continuarem alcançando os elementos equivalentes, para que a folha de estilo
de quem já customizou não quebre pela segunda vez seguida.

O domínio de exibição, os adaptadores das seis bibliotecas sobreviventes e a ponte de mensagens não
são tocados. É deliberado: são eles que provam, pelos testes que já existem, que o comportamento não
regrediu.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`. Na ausência dele, esta feature responde aos princípios
globais do mantenedor, e o registro abaixo existe para que a checagem não fique implícita.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Estabilidade acima de novidade | O sistema adotado é mantido por organização, com release semanal e versão publicada há três dias. Substitui código autoral sem manutenção compartilhada | respeita |
| Erros barulhentos acima de desempenho | `MissingVendorError` já existe para as bibliotecas servidas como global; a folha do sistema de design ganha verificação equivalente, para que a falta dela seja mensagem nomeada e não quadro sem cor | respeita |
| Reprodutibilidade acima de tempo de primeira execução | Três dependências novas entram com versão exata e `package-lock.json` versionado, ao contrário das nove vendorizadas sem versão que o ADR-003 registra | respeita |
| Documentação para o eu de daqui a doze meses | O mapa de classes antigas e a lista de âncoras de estilo viram contrato escrito em `interfaces/`, não convenção tácita | respeita |
| Baixo acoplamento, sem biblioteca externa dentro da regra de negócio | `domain/` permanece sem uma linha de importação do sistema de design. A restrição é verificável por inspeção e vira ação própria | respeita |
| Arquivo acima de 400 linhas é dívida | `board.css` tem 686 linhas hoje e encolhe; nenhum arquivo novo pode nascer acima do limite | respeita |

## 3. Decisões técnicas

A numeração continua a da feature `001`, que terminou em D-16, para que a rastreabilidade entre as
duas seja direta.

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-17 | Entram `@primer/react` 38.34.0, `@primer/primitives` 11.10.0 e `@primer/octicons-react` 19.32.0, com versão **exata**, sem intervalo | Versão exata é o que o ADR-003 não teve, e é a diferença entre atualizar por decisão e atualizar por acidente. Os pares declarados aceitam o React 18.3.1 já instalado, então não há efeito colateral de versão | Intervalo com acento de circunflexo, que reintroduz atualização não deliberada; fixar só a maior, que não protege contra mudança de menor | 🟢 |
| D-18 | O piso sobe para `engines.vscode: ^1.78.0` e o alvo do empacotador passa de `chrome91` para `chrome108` | Apurado, não estimado: o `.yarnrc` do repositório do editor mostra Electron 19.1.9 na versão 1.77 e 22.3.5 na 1.78, e o índice de releases do Electron mapeia esses para Chromium 102 e 108. O seletor relacional e as consultas de contêiner exigem 105 | Manter `^1.62.0`, que preserva instalações de 2021 ao custo de acabamento degradado e do risco de interface de programação ausente; saltar para a versão mínima sob suporte, que exclui sem ganho proporcional | 🟢 |
| D-19 | `theme/tokens.css` é **extinto**. Os conjuntos de cor passam a ser os arquivos de tema de `@primer/primitives`, importados pelo pacote | É o objeto da feature: enquanto houver um arquivo de cor autoral, a manutenção continua sendo do projeto. Extinguir é mais honesto que manter vazio | Manter `tokens.css` como camada de tradução sobre o sistema, o que recria a dívida com passo a mais; redefinir variáveis do sistema localmente, que é a mesma coisa com nome pior | 🟢 |
| D-20 | O tema é selecionado pelos atributos que a biblioteca lê no elemento raiz, no mesmo lugar onde hoje o `theme-provider.tsx` escreve `data-vsckb-theme`. O `ViewState` continua sendo a única fonte da preferência | Preserva integralmente D-03 e D-14 da feature `001`: o mecanismo de troca já é atributo na raiz, sem recarga, e só muda o nome do atributo. Nenhum estado novo nasce | Provedor de tema em contexto de React como fonte da preferência, que duplicaria a fonte de verdade que o `ViewState` já é | 🟢 |
| D-21 | `theme/board.css` encolhe para geometria de quadro — faixa de coluna, pilha de cartões, área de arrastar, colapso — e não declara nenhum valor de cor, raio, sombra ou tamanho de fonte | Cumpre RN-07 e RF-24 de forma verificável: retirada a folha do sistema, o quadro fica sem cor, o que prova que nada foi redeclarado | Reescrever cartão e coluna sobre as primitivas de caixa do sistema, descartado na sessão de esclarecimentos por custo desproporcional | 🟢 |
| D-21.1 | **Emenda de 2026-08-03, pós-entrega.** A folha vira um par: `theme/board.css` segue como acima, e `theme/appearance.css` nasce como a única que pinta, e só nomeando `var(--token)` do sistema | D-21 cumpriu a prova e produziu um efeito não previsto: sem lugar legítimo onde nomear token, o quadro ficou de fato sem cor semântica — tipo de cartão e coluna na mesma paleta neutra (cartões `[41]`, `[42]` e `[46]`). O par mantém a prova e devolve o lugar: desligado o sistema, cada `var()` resolve para nada e a tinta vai junto. É o argumento que `ui/App.tsx` já usava para os dois tokens da casca | Espalhar `sx` pelos componentes, descartado por coesão: "que cor é um bug" passaria a ter uma resposta por arquivo. Afrouxar D-21 e deixar `board.css` pintar, descartado porque apaga a prova em vez de reformulá-la | 🟢 |
| D-22 | A camada de compatibilidade com a versão 1.33.1 é uma folha **própria e gerada a partir de um mapa declarado**, servida depois do pacote e antes da folha do usuário | A classe do sistema adotado é hasheada e muda entre versões; ancorar a compatibilidade nela seria construir sobre areia. O mapa é do projeto, versionado, e o contrato fica em `interfaces/legacy-class-map.md` | Reusar os nomes de classe do sistema como âncora, que quebra a cada atualização de dependência; abandonar a compatibilidade, descartado na sessão de esclarecimentos | 🟢 |
| D-23 | As âncoras de estilo são atributos de dados próprios do projeto, não nomes de classe | Atributo de dados não colide com a classe hasheada do sistema, sobrevive a refatoração de componente e é legível no contrato. Contrato em `interfaces/style-anchors.md` | Classe própria com prefixo, que reintroduz a colisão que a `001` já sofreu | 🟢 |
| D-24 | O tipo do cartão ganha um rótulo textual visível, além da cor | É o único canal que sobrevive à conversão para escala de cinza e ao daltonismo, e é o que RF-10 exige. O componente de rótulo do sistema já traz as variantes | Padrão de textura ou borda tracejada, que distingue mas não informa; ícone sozinho, que exige aprendizado prévio | 🟡 |
| D-25 | `ui/icons.tsx` é extinto e substituído pelos ícones do conjunto adotado, importados individualmente | Importação individual é o que permite ao empacotador descartar os cerca de seiscentos ícones não usados. Ícone desenhado à mão é a mesma dívida da paleta, em outra superfície | Importar o conjunto inteiro, que infla o pacote sem necessidade; manter os ícones autorais, descartado na sessão de esclarecimentos | 🟢 |
| D-26 | O tema do Mermaid e o do realce de sintaxe passam a derivar do modo de cor ativo, lido do mesmo atributo de raiz | Hoje o realce usa uma folha de tema escuro fixa, `hljs-atom-one-dark.css`, que num quadro claro fica errada. Derivar do modo corrige um defeito existente sem trabalho extra | Manter as folhas fixas, que perpetua o descasamento; gerar tema de diagrama a partir das variáveis, que é caro para o ganho | 🟡 |
| D-27 | O caminho por teclado para mover cartão é um menu de ação por cartão, com as colunas de destino | Reaproveita o menu do sistema adotado, que já resolve foco, escape e navegação por seta. Arrastar e soltar permanece como está, e o teclado passa a ser caminho equivalente, não substituto | Reimplementar arrastar com eventos de teclado, que é o problema mais caro da acessibilidade de quadro e não cabe nesta feature | 🟡 |
| D-28 | A política de segurança de conteúdo é declarada em `html.ts`, com origem própria para estilo e fonte, e execução de script restrita ao valor de uso único já emitido por D-16 | O valor de uso único já existe desde a feature `001`; falta a declaração da política, que é o cartão `[7]` do quadro do projeto. Fazer agora é barato porque a folha do sistema é a primeira folha nova desde então | Deixar para depois, que obrigaria a revisitar `html.ts` uma segunda vez | 🟡 |
| D-29 | RF-22 é reinterpretado: nenhuma biblioteca vendorizada é removida, e todas as seis passam a ter versão declarada | Achado do plano: Filtrex, Showdown, Mermaid, highlight.js, CodeMirror e Moment são funcionais, e o sistema adotado não substitui nenhuma. As que ele absorveria, jQuery e Bootstrap, já saíram na `001`. Remover nada e declarar versão é o que resta de real | Fingir que a feature colhe a dívida D7 por inteiro, que seria promessa falsa no `actions.md` | 🟢 |

## 4. Premissas

Nenhuma. As três dúvidas do `requirements.md` foram resolvidas na sessão de esclarecimentos de
2026-08-03, e a única verificação que restou, o número exato do piso de versão, foi apurada neste
plano e virou D-18, com fonte citada.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `theme` (da feature `001`) | `src/webview/theme/tokens.css` | componente-extinto | Os dois conjuntos de cor autorais dão lugar aos arquivos de tema do sistema adotado |
| `theme` (da feature `001`) | `src/webview/theme/theme-provider.tsx` | regra-alterada | Passa a escrever os atributos que a biblioteca lê, em vez de `data-vsckb-theme`; a lógica de resolução do tri-estado não muda |
| `theme` (da feature `001`) | `src/webview/theme/board.css` | regra-alterada | Encolhe de 686 linhas para geometria de quadro, sem nenhum valor visual literal |
| `board-ui` | `_reversa_sdd/architecture.md#4`, hoje `src/webview/ui/` | regra-alterada | Os dezesseis componentes passam a compor controles do sistema adotado; cartão, coluna e área de arrastar permanecem próprios |
| `board-ui` | `src/webview/ui/icons.tsx` | componente-extinto | Substituído pelo conjunto de ícones do sistema adotado |
| `html` | `_reversa_sdd/architecture.md#4`, `src/html.ts` | contrato-alterado | Passa a declarar a política de segurança de conteúdo e a servir a folha de compatibilidade na ordem correta de cascata |
| `boards` | `_reversa_sdd/architecture.md#4`, `src/boards.ts` | regra-alterada | Apenas a ordem de injeção da folha do usuário, que precisa continuar sendo a última |
| — | `src/webview/theme/legacy-compat.css` | componente-novo | Folha gerada a partir do mapa de classes da versão 1.33.1 |
| — | `package.json`, `scripts/build-webview.js` | regra-alterada | Três dependências novas com versão exata; piso do editor e alvo do empacotador sobem juntos |

O que **não** muda, e a razão de não mudar: `src/webview/domain/`, `src/webview/adapters/` e
`src/webview/bridge/` ficam intocados, porque são eles que os testes existentes cobrem e que provam a
ausência de regressão. Alterá-los nesta feature confundiria a causa de qualquer teste que falhasse.

**Ressalva sobre os adaptadores, registrada na auditoria de 2026-08-03 (A007).** D-26 exige que o
tema do realce de sintaxe derive do modo de cor ativo, e o realce é servido hoje por uma folha de
tema escuro fixa. A exigência é cumprida **sem tocar no adaptador**: o adaptador de realce continua
recebendo o tema por parâmetro, como o de diagramas já recebe; o que muda é quem escolhe a folha
(`src/webview/ui/Markdown.tsx`) e o que a extensão serve (`src/html.ts`). Caso a implementação
conclua que o adaptador precisa mudar, a promessa deste parágrafo cai e precisa ser revista **antes**
da alteração, não depois — é justamente o tipo de erosão silenciosa que a regra existe para impedir.

## 6. Delta no modelo de dados

- Resumo das mudanças: o arquivo do quadro não muda em nada. O único delta é no estado de
  visualização, que já vive fora do arquivo: a preferência de tema passa a admitir um quarto valor,
  o de alto contraste, e o valor gravado deixa de ser um nome interno para ser o nome do conjunto do
  sistema adotado. A leitura de preferências gravadas pela feature `001` continua válida por
  conversão de entrada.
- Detalhe completo em: `_reversa_forward/002-primer-design-system/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Âncoras de estilo do quadro | arquivo, folha de estilo do usuário | `_reversa_forward/002-primer-design-system/interfaces/style-anchors.md` |
| Mapa de classes da versão 1.33.1 | arquivo, folha de estilo do usuário | `_reversa_forward/002-primer-design-system/interfaces/legacy-class-map.md` |
| Ponte de mensagens entre Webview e extensão | mensagem | Inalterado. Vale o contrato de `_reversa_forward/001-interface-react-tema-e-done/interfaces/webview-bridge.md`, exceto pelo valor novo de tema, descrito em `data-delta.md` |
| Eventos do script do usuário | mensagem | Inalterado. Vale o contrato de `_reversa_forward/001-interface-react-tema-e-done/interfaces/event-script-api.md` |

## 8. Plano de migração

1. **Capturar a referência antes de tudo.** Executar o roteiro de doze passos sobre a versão 1.33.1,
   guardando registro de eventos e arquivo de quadro. Sem isso, nenhum critério de preservação de
   comportamento tem base de comparação, e a captura deixa de ser possível na primeira alteração.
2. Subir o piso do editor e o alvo do empacotador, e confirmar que a suíte segue verde. Passo isolado,
   para que qualquer quebra tenha causa única.
3. Instalar as três dependências com versão exata e versionar o arquivo de trava.
4. Trocar a origem dos conjuntos de cor: importar os temas do sistema, extinguir `tokens.css` e
   reapontar o `theme-provider.tsx` para os atributos novos. Ao fim deste passo o quadro já deve
   abrir, com os componentes ainda autorais herdando a paleta nova.
5. Migrar os controles componente a componente, do mais isolado ao mais acoplado: barra superior,
   depois cartão, depois coluna, depois os cinco diálogos. Cada um com a suíte verde antes do próximo.
6. Encolher `board.css` à geometria e verificar, retirando a folha do sistema, que o quadro fica sem
   cor. É o teste de que RN-07 foi cumprida.
7. Gerar a folha de compatibilidade a partir do mapa e verificar com uma folha de usuário real escrita
   contra a versão 1.33.1.
8. Declarar a política de segurança de conteúdo e confirmar, com a máquina desconectada, que o quadro
   renderiza inteiro.
9. Comparar a sequência de eventos com a referência do passo 1 e executar o roteiro de doze passos
   completo, que é o critério de encerramento herdado da feature `001`.
10. Atualizar `README.md` e `CHANGELOG.md` com a nota de alteração incompatível, o mapa de migração da
    folha de estilo e as capturas de tela, feitas uma vez só, sobre a interface definitiva.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| O pacote cresce além do limite declarado, porque cada conjunto de tema ocupa cerca de 118 KB e o alto contraste soma mais | médio | alto | Importar apenas os conjuntos efetivamente oferecidos ao usuário, e medir o pacote como ação própria do `actions.md`, com o número registrado. Se estourar, o alto contraste passa a carregamento sob demanda |
| A classe hasheada do sistema adotado muda entre versões e quebra qualquer coisa ancorada nela | alto | alto | D-22 e D-23 já respondem: âncora é atributo de dados do projeto, compatibilidade é folha própria. Nenhum contrato aponta para nome de classe de terceiro |
| A folha do sistema entra na cascata depois da folha do usuário e passa a vencê-la | alto | médio | A ordem de injeção vira ação verificável: pacote, compatibilidade, folha do usuário, nessa ordem. O cenário de aceitação cobre |
| O empacotador não descarta o que não é usado do sistema adotado, por ele ser distribuído em módulos com efeito colateral de folha de estilo | médio | médio | Importação individual por componente e por ícone, medida do pacote antes e depois, e comparação com a linha de base de 179 KB de código e 11 KB de folha |
| Elevar o piso do editor exclui instalações de terceiros que hoje usam a extensão | médio | baixo | É consequência aceita e declarada da resposta 1a. A mitigação é social, não técnica: nota no `CHANGELOG.md` e no `README.md`, e a versão anterior permanece instalável pela Marketplace |
| Migrar vinte componentes numa tacada torna impossível localizar a causa de uma regressão | alto | médio | O passo 5 do plano de migração é explicitamente incremental, com a suíte verde entre um componente e o próximo |
| O rótulo textual de tipo de cartão ocupa espaço e degrada a densidade do quadro | baixo | médio | Verificação visual no roteiro de `onboarding.md`, com quadro de cem cartões. Se degradar, o rótulo passa a forma compacta com nome acessível completo |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] A suíte existente passa sem que nenhuma asserção tenha sido alterada
- [ ] A sequência de eventos do roteiro de doze passos é idêntica à referência da versão 1.33.1
- [ ] Retirada a folha do sistema de design, o quadro fica sem cor, provando que nada foi redeclarado
- [ ] Com a máquina desconectada, o quadro abre e renderiza integralmente
- [ ] Uma folha de estilo escrita contra a versão 1.33.1 continua sendo aplicada sem edição
- [ ] Nenhum arquivo sob `src/webview/` passa de 400 linhas
- [ ] O pacote medido está dentro do limite declarado no `requirements.md`, com o número registrado
- [ ] `README.md` e `CHANGELOG.md` atualizados, com capturas de tela da interface definitiva

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-03 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-08-03 | Correções após `/reversa-audit`: ressalva sobre os adaptadores em §5 (A007) e contagem de componentes de `src/webview/ui/` corrigida de vinte para dezesseis (A016) | iago |
