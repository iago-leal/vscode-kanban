# Regression watch: adoção do sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Criado em: `2026-08-03`, primeira rodada de `/reversa-coding`

Este arquivo diz o que precisa continuar verdadeiro nas próximas extrações. O agente reverso, ao
rodar `/reversa` de novo sobre este projeto, confere cada item e preenche o histórico ao final.

## 1. Watch principal

Itens derivados da seção "Modificadas" de `legacy-impact.md`. Nenhuma regra 🟢 de domínio foi
alterada nesta rodada, de modo que o watch principal trata apenas dos dois contratos que mudaram.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| W001 | `package.json`, `engines.vscode` · `_reversa_sdd/architecture.md#8` | O piso do editor é `^1.78.0`, e a razão declarada é o seletor relacional e as consultas de contêiner das folhas do sistema (D-18) | presença | O piso voltar a `^1.62.0` ou subir sem decisão registrada; a extração descrever o piso antigo como vigente |
| W002 | `scripts/build-webview.js`, `BROWSER_TARGET` | O alvo do empacotador é `chrome108`, coerente com o Chromium que o piso do editor embarca | presença | Divergência entre o piso do manifesto e o alvo do empacotador, em qualquer direção. Os dois andam juntos, e separá-los produz código que o editor mínimo não interpreta |
| W003 | `package.json`, dependências · `_reversa_sdd/architecture.md#9.2`, dívida D7 | As dependências de aparência têm versão **exata**, sem intervalo, e `react-is` acompanha a linha do React instalado | redação | Reaparecer acento circunflexo em qualquer das quatro; `react-is` divergir da linha maior do React, o que faz `isElement` devolver falso sem erro visível |
| W004 | `src/webview/theme/primer-themes.ts` | O mapeamento entre tema em vigor e conjunto nomeado existe em **um** lugar, e apenas os quatro conjuntos oferecidos são importados | ausência | Nome de conjunto do sistema escrito fora deste arquivo; import de conjunto que o usuário não pode escolher, que carrega cerca de 118 KB por unidade sem alcance |

Acrescentados na segunda rodada, 2026-08-03, derivados da seção "Modificadas" de `legacy-impact.md`:

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| W005 | `src/webview/domain/types.ts` **e** `src/view-preferences.ts` · `data-delta.md` §3 | A preferência de tema tem os **mesmos quatro valores** nos dois lados da ponte. As duas declarações são obrigatórias — unidades de compilação separadas, nenhuma pode importar a outra — e mudam juntas | redação | Divergência entre as duas listas, em qualquer direção. O dano é silencioso: o lado da extensão valida o valor recebido antes de gravar, de modo que um valor conhecido só no Webview é descartado a caminho do armazenamento e a preferência não sobrevive ao recarregamento. Parente do cartão `[12]` do quadro |
| W006 | `src/webview/domain/view-state.ts`, `isHighContrast` · RF-09 | O alto contraste é **eixo separado** do modo de cor, decidido apenas pela escolha do usuário. A função que o decide **não recebe o tema do editor** | ausência | `isHighContrast` ganhar parâmetro de tema do editor; `resolveTheme` passar a devolver um terceiro valor além de claro e escuro; qualquer caminho que ligue alto contraste do editor a alto contraste do quadro. A regra hoje é cumprida por construção, e só se perde reescrevendo assinatura de propósito |
| W007 | `src/test/source-limits`, `visual-literals`, `layer-boundaries`, `no-font-assets`, `sanitizer-surface` | As cinco fronteiras estruturais da feature continuam **verificadas por teste**, sem lista de exceções: quatrocentas linhas por arquivo, nenhum valor visual literal, nenhum sistema de design nas camadas internas, nenhuma fonte no pacote, superfície de sanitização que não encolhe | presença | Teste removido, marcado como pendente, ou afrouxado com lista de arquivos isentos. Uma exceção declarada é o modo normal de uma regra de forma morrer sem que ninguém decida matá-la |
| W008 | `src/webview/domain/view-state.ts`, guarda de tipo | O guarda que aceita uma preferência gravada **deriva do ciclo**, em vez de repetir os literais | redação | O guarda voltar a enumerar valores por conta própria. Enquanto ele deriva, ampliar o ciclo e ampliar o guarda são um ato só; separando-os, um valor passa a ser oferecido pelo controle e recusado na leitura |

Acrescentados na terceira rodada, 2026-08-03, derivados da seção "Modificadas" de `legacy-impact.md`:

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| W009 | `src/webview/theme/board.css` · RN-07, RF-24 | A folha do quadro declara **geometria e nada mais**: nenhuma cor, raio, sombra ou tamanho de fonte, literal ou variável. É a única prova de que desligar o sistema de design deixa o quadro sem cor | ausência | Qualquer propriedade que pinte reaparecer ali. Uma só basta: com uma segunda origem de cor, a prova pelo avesso deixa de valer e ninguém percebe, porque o quadro continua bonito. `visual-literals.unit.test.ts` reprova |
| W010 | `src/webview/theme/theme-provider.tsx` · RF-09 | O alto contraste vem da **escolha do usuário**. O provedor alimenta `isHighContrast` com a preferência, nunca com o que o editor mostra | ausência | `EDITOR.highContrast` voltar a alimentar o contexto de tema. Foi assim que a feature `001` o deixou, e a mudança é de uma palavra: reverter é fácil e silencioso |
| W011 | `src/webview/ui/anchors.ts` · `interfaces/style-anchors.md` | Instrumentar a âncora e devolver o nome da 1.33.1 são **um ato só**. Todo elemento marcado passa por `anchored` | presença | Um componente escrever `data-vsckb` à mão. O elemento fica alcançável pela âncora e some do alcance da folha antiga, sem erro: separar os dois atos é como a camada de compatibilidade morre aos poucos |
| W012 | `scripts/generate-legacy-compat.js` · `legacy-class-map.md` §5 | O módulo de compatibilidade é **gerado** do mapa, e o mapa é a fonte de verdade. O gerador recusa destino que não seja âncora declarada | redação | O módulo editado à mão, ou um destino que `style-anchors.md` não declare. O segundo é o pior: a folha do usuário deixa de casar e o único sintoma é ela parar de funcionar. `node ./scripts/generate-legacy-compat.js --check` e `legacy-compat.unit.test.ts` reprovam |
| W013 | `scripts/theme-tokens.js` · RNF de desempenho | As duas podas de folha continuam no empacotador: os conjuntos de cor podados aos tokens que a interface nomeia, com fecho transitivo, e as folhas dos componentes que não embarcam servidas vazias | presença | Qualquer uma das duas ser removida "para simplificar a construção". A folha salta de 131 KB para 439 KB, contra teto de 400 KB, e a falha aparece só quando alguém medir. A poda de componente compensa uma limitação do empacotador, não um descuido do pacote: se uma versão futura do esbuild passar a descartar a folha do módulo podado, a segunda poda vira redundante e pode sair — verificar antes, medindo |
| W014 | `src/webview/theme/primer-themes.ts` | `primitives.css` é importado junto dos quatro conjuntos. Ele declara raio, espessura, espaçamento e escala tipográfica, que não mudam com a cor | presença | O import sumir. Os componentes resolvem as próprias medidas para nada e desabam; a falha aparece como diagramação errada, nunca como erro |
| W015 | `src/html.ts` · RF-19, cartão `[7]` | A política de segurança de conteúdo é declarada, recusa o que não nomeia e proíbe conexão. `'unsafe-eval'` é dívida do avaliador de filtro, e some quando ele for substituído | presença | A política sumir, ou `'unsafe-inline'` aparecer em `style-src` — o que é diferente de `style-src-attr`, e muito mais largo. Acrescentar cláusula para acomodar o sistema de design é o que o requisito não funcional proíbe, e não foi preciso |
| W016 | `src/res/VENDORED.md` · dívida D7 | As seis bibliotecas vendorizadas continuam declarando versão e impressão digital, e um arquivo trocado leva a linha correspondente junto | redação | Um arquivo de `src/res/js/` mudar sem a impressão digital mudar. A dívida D7 volta ao estado em que estava: nomes sem identidade, e nenhuma pergunta sobre vulnerabilidade respondível |

Acrescentados na quarta rodada, 2026-08-03, na reconciliação pós-entrega do cartão `[45]`:

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| W017 | `src/webview/theme/appearance.css` · RN-07, RF-24, D-21.1 | A folha de aparência **só pinta, e só por token**: toda declaração de cor, raio, sombra ou tamanho de fonte nomeia `var(--…)` do sistema de design, nenhuma escreve valor. E ela continua **importada** por `ui/App.tsx` | ausência | Um literal aparecer ali — hexadecimal, comprimento ou nome de cor de CSS —, o que restaura a segunda origem de cor que RN-07 proíbe e faz a prova por token deixar de valer em silêncio, porque o quadro continua bonito. Ou o import sumir: a folha então passa em todas as regras pintando nada, e o quadro volta ao estado sem cor semântica dos cartões `[41]` e `[46]`. `visual-literals.unit.test.ts` reprova os dois, e o segundo teste existe **porque** o primeiro sozinho não o pegaria |
| W018 | `src/webview/theme/appearance.css`, bloco do editor · cartão `[39]` | O tema do editor de Markdown vive junto do resto da aparência e nomeia os mesmos tokens: fundo, primeiro plano, medianiz, cursor, seleção e os tokens de sintaxe do modo markdown | presença | O bloco sumir numa reorganização de folhas. **Já aconteceu uma vez**: as regras equivalentes viviam em `theme/board.css` sobre tokens autorais, e a feature `002` levou as duas coisas embora sem que nada as substituísse. O sintoma é uma página branca de biblioteca dentro de um diálogo escuro — o objeto mais visível da tela —, e nenhum dos 231 testes o viu, nem da primeira nem da segunda vez. Enquanto não houver teste, este item é a única guarda |
| W019 | `src/webview/theme/appearance.css`, regras de tipografia · `interfaces/style-anchors.md` | Toda regra que disputa propriedade com um componente do sistema de design é qualificada pela **âncora de estilo** do elemento, e não por classe simples | redação | A qualificação cair, por parecer verbosa. Um seletor de classe simples empata em especificidade com a classe que o componente traz, e quem vence passa a depender de qual import o empacotador emitiu primeiro: a diagramação fica certa ou errada por acidente de ordem, e muda sem que ninguém toque no estilo |

## 2. Observações, sem peso de regressão

Itens que ainda não são regra confirmada: ou tratam de código que a feature vai mexer nas fases
seguintes, ou nasceram de medição desta rodada e valem como alerta.

- **A referência de comportamento da versão 1.33.1 continua devendo.** `T001` está `failed`, e com
  ela ficam sem base de comparação RF-02, RF-04 e RF-27. Nenhuma re-extração deve tratar a paridade
  com a 1.33.1 como verificada enquanto isso não se resolver.
- **A folha de compatibilidade não existe.** `T007` está `failed` por defeito de contrato, e
  `interfaces/legacy-class-map.md` §2 continua prometendo um mecanismo que o meio escolhido não
  comporta. Até a decisão sobre D-22, o cartão `[35]` do quadro segue integralmente em aberto: quem
  tiver `.vscode/vscode-kanban.css` escrito contra a 1.33.1 continua sem cobertura.
- **O teto de folha do RNF de desempenho está prestes a ser rompido.** Os quatro conjuntos de tema
  medem 390.235 B minificados, contra teto de 400 KB, e a sonda com oito componentes chegou a
  618.984 B. `T051` vai reprovar se nada mudar.
- **`theme/tokens.css` ainda é a origem das cores.** D-19 o extingue em `T018`, que não rodou. Uma
  extração feita agora encontraria o arquivo vivo e em uso, o que está correto para este momento.

Acrescentadas na segunda rodada, 2026-08-03:

- **Dois testes estão vermelhos de propósito, e não são regressão.** `source-limits` e
  `visual-literals` reprovam pelo mesmo arquivo, `theme/board.css`: 686 linhas contra o teto de
  quatrocentas, e 121 declarações que pintam. Ambos fecham em `T040`, e a mensagem de falha dos dois
  nomeia essa ação. Quem retomar o projeto e encontrar a suíte em 173 passando e 2 falhando está
  vendo o estado esperado; **três ou mais falhas, ou falha em outro arquivo, é regressão de verdade.**
- **`src/webview/ui/` já está limpo de valor visual literal.** A feature `001` o deixou assim, e o
  teste de `T011` o confirma hoje. Isso não é conquista desta feature: é ponto de partida que não
  pode ser perdido durante a migração de componentes da Fase 3.
- **A linha de base do pacote mudou.** `main.js` está em 183.054 B, contra os 182.918 B com que
  `T051` compara, e `main.css` continua em 11.314 B. O sistema de design ainda não entra em nenhum
  dos dois. A diferença de 136 B é do quarto estado de tema e do ícone provisório.
- **O ícone `theme-contrast` é provisório.** Desenhado à mão em `icons.tsx` para satisfazer o mapa
  exaustivo de `TopBar.tsx`, sai em `T021` junto com os demais. Uma extração feita agora o
  encontraria e o descreveria como ícone autoral, o que está correto para este momento.

Acrescentadas na terceira rodada, 2026-08-03:

- **As duas falhas anunciadas como esperadas fecharam.** `source-limits` e `visual-literals` passaram
  a verde em `T040`. A suíte está em **216 testes, todos passando**, e é esse o estado esperado
  agora: qualquer falha é regressão de verdade.
- **A medição do pacote mudou de patamar, e é a que `T051` fixa.** `main.js` está em **756.193 B**
  contra teto de 900 KB — 82% dele —, e `main.css` em **131.332 B** contra 400 KB. O código cresceu
  573 KB de uma vez, que é o sistema de design entrando; a folga de 18% é pouca, e cada componente
  novo cobra a sua parte. Vale medir a cada feature que acrescente componente.
- **Quatro âncoras declaradas não alcançam elemento.** `action-save`, `action-clear`,
  `card-reference` e `card-references`, mais o diálogo `clear-done`. Reconciliadas em
  `style-anchors.md` §7.1 e fixadas em teste, com o tamanho da lacuna declarado. Uma extração feita
  agora encontraria as âncoras prometidas no contrato e ausentes do DOM, o que está correto para
  este momento e é registrado para não ser lido como defeito.
- **`theme/tokens.css` não existe mais**, e `theme/board.css` tem 382 linhas. Uma extração feita
  antes desta rodada descreveria o contrário, e a observação da rodada anterior sobre esse arquivo
  fica **arquivada** pelo cumprimento.
- **O ícone `theme-contrast` continua desenhado à mão**, e agora é o único. O conjunto adotado não
  tem nada que diga alto contraste, e o mais próximo não é distribuído. A observação anterior, que o
  dava como provisório até `T021`, fica corrigida: ele sobreviveu a `T021` por falta de substituto,
  não por esquecimento.
- **O menu de mover substituiu a fileira de botões.** Os movimentos oferecidos e o que se grava são
  idênticos; a afordância mudou. Uma extração que compare capturas de tela com a feature `001` verá
  diferença aqui, e ela é deliberada (`T024`, RF-15).

Acrescentadas na quarta rodada, 2026-08-03, na reconciliação pós-entrega do cartão `[45]`:

- **As medições da terceira rodada foram tiradas de um pacote quebrado, e a correção nunca voltou
  para cá.** Onde se lê `main.css` em **131.332 B**, o número foi medido enquanto a poda descartava
  as folhas dos oitenta e dois componentes — isto é, mediu um pacote **sem estilo algum**, e o
  relatório de economia ficava mais impressionante quanto mais quebrado estava. O defeito e a
  correção estão no cartão `[43]` do quadro; a medição, não. Os números apurados hoje, com o
  empacotador de produção:

  | O que | Medida | Teto | Ocupação |
  |---|---|---|---|
  | `main.css`, com as duas podas | **317.810 B** | 400 KB | 78% |
  | `main.css`, sem poda nenhuma | **637.169 B** | 400 KB | 156% — reprova |
  | `main.js` | **756.485 B** | 900 KB | 82% |

  Os 317.810 B já incluem `theme/appearance.css`, que custou cerca de 5,5 KB — a folha em si é
  pequena, e o que ela acrescenta ao pacote são sobretudo os tokens que passou a nomear e que a
  poda, por isso, deixou de descartar. É o mecanismo funcionando: a poda serve o que a interface
  pede, e pedir mais custa mais.

- **`W013` afirmava "de 131 KB para 439 KB", e nenhum dos dois números se sustenta.** O primeiro é
  a medição do pacote quebrado, acima; o segundo não corresponde a nada que se possa medir hoje —
  sem as duas podas o pacote dá **637.169 B**, e não 439 KB. O item continua **correto no
  princípio**, e as duas podas devem permanecer; o que se corrige aqui são os números com que ele
  descreve a violação. Leia `W013` com a tabela acima no lugar deles.

  O `[43]` deixou uma lição que vale anexada a `W013`: **uma poda que descarta tudo não é uma poda
  eficiente**. O relatório de economia precisa ser lido junto com a contagem do que sobreviveu, que
  é o que a guarda em `theme-tokens.js` passou a exigir — se nenhuma folha de componente sobrevive,
  a construção falha em vez de anunciar o recorde.

- **`W009` descreve `theme/board.css` como "a única prova", e deixou de ser.** A prova virou par
  com `W017`: a primeira folha não pinta, a segunda só pinta por token. `W009` continua válido
  palavra por palavra sobre o arquivo que nomeia — nada mudou em `board.css` —, mas quem o ler
  isoladamente concluirá que qualquer cor no projeto é violação, e fechará a porta que os cartões
  `[41]`, `[42]` e `[46]` abriram. Os dois se leem juntos.

- **`theme/board.css` tem 396 linhas, e não 382.** A observação da terceira rodada registrava o
  número anterior. O teto de quatrocentas continua respeitado, agora com quatro linhas de folga —
  estreito o bastante para que a próxima emenda de geometria precise cortar comentário antes de
  acrescentar regra, o que já aconteceu uma vez nesta reconciliação. `theme/appearance.css` tem 308.

- **O estado esperado da suíte passou de 216 para 231 testes, todos passando.** Os quinze novos são
  da entrega dos cartões `[41]`, `[42]` e `[46]`, e dois deles são os de `W017`. Qualquer falha
  continua sendo regressão de verdade.

- **Os três controles da barra superior nomeiam a ação, e não o estado.** Em quadro claro o botão
  diz `Dark`; em colunas, `List`; o dos finalizados, `Show finished (8)` quando estão ocultos.
  `aria-pressed` saiu dos três, e o estado passou a viajar no nome acessível. Uma extração que
  compare com a redação original de RF-14 verá divergência aparente; a razão está na nota de
  2026-08-03 do `requirements.md`, e repor o atributo seria o erro — `aria-pressed="false"` sobre um
  botão que diz `Dark` é verdade sobre o quadro e mentira sobre o botão.

## 3. Histórico de re-extrações

<!-- Preenchido pelo agente reverso quando /reversa rodar de novo. -->

| Data | Item | Situação | Observação |
|------|------|----------|------------|
| — | — | — | — |

## 4. Arquivadas

<!-- Itens que deixaram de valer, com a data e a razão. -->

| Data | Item | Razão |
|------|------|-------|
| 2026-08-03 | Observação "`theme/tokens.css` ainda é a origem das cores" | Cumprida: `T018` o extinguiu e `T040` encolheu `board.css` à geometria |
| 2026-08-03 | Observação "o teto de folha do RNF de desempenho está prestes a ser rompido" | Resolvida por `scripts/theme-tokens.js`. Substituída por `W013`, que vigia a solução em vez do sintoma |
| 2026-08-03 | Observação "a folha de compatibilidade não existe" | Resolvida: a compatibilidade deixou de ser folha. Substituída por `W011` e `W012` |
| 2026-08-03 | Observação "dois testes estão vermelhos de propósito" | Cumprida em `T040`. O estado esperado passou a ser 216 testes passando e nenhuma falha |
| 2026-08-03 | Observação da terceira rodada "a medição do pacote mudou de patamar", nos números | Medida sobre o pacote quebrado do cartão `[43]`. Substituída pela tabela de medições da quarta rodada em §2. O **patamar** que ela anunciava continua certo; os bytes, não |
| 2026-08-03 | Observação da terceira rodada "`theme/board.css` tem 382 linhas" | Superada: são 396 depois da divisão das folhas. Substituída na quarta rodada |
| 2026-08-03 | Observação da terceira rodada "a suíte está em 216 testes" | Superada: 231 depois dos cartões `[41]`, `[42]` e `[46]`. Substituída na quarta rodada |
