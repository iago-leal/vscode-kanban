# Requirements: Nova interface do quadro — tema alternável e ocultação de concluídos

> Identificador: `001-interface-react-tema-e-done`
> Data: `2026-08-02`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A interface do quadro é reconstruída sobre uma base de componentes moderna, substituindo o
arquivo único de 2.161 linhas em escopo global que hoje concentra estado, renderização e
interação. A disposição da tela é redesenhada, e não apenas repintada: as colunas passam a ser
colapsáveis e o quadro ganha um modo alternativo de visualização em lista. Sobre essa base
entram os dois recursos pedidos: um **controle de tema** de três estados — claro, escuro e
seguir o editor — e um **modo de ocultar os concluídos**, que colapsa a coluna Done sem tocar
no arquivo do quadro. O beneficiário é o mantenedor que usa o quadro diariamente dentro do
editor e hoje convive com uma estética de 2018, sem integração com o tema do editor e sem meio
de reduzir o ruído visual da coluna Done.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/architecture.md#1-estilo-arquitetural` | O domínio do quadro vive em `board.js`, dentro do Webview, sem tipos, módulos ou testes; a separação existente é por processo, não por responsabilidade | 🟢 |
| `_reversa_sdd/architecture.md#4-componentes-e-responsabilidades` | `board-ui` (`src/res/js/board.js`) tem 2.161 linhas e coesão baixa: "o arquivo é o sistema inteiro" | 🟢 |
| `_reversa_sdd/adrs/008-estado-autoritativo-no-webview.md` | O estado autoritativo do quadro é a variável global `allCards` no Webview; a extensão grava o que recebe | 🟢 |
| `_reversa_sdd/code-analysis.md#módulo-7--board-ui` | 33 funções e 6 variáveis no escopo global do documento; `allCards` é a fonte de verdade viva | 🟢 |
| `_reversa_sdd/code-analysis.md#módulo-4--html` | O documento do Webview é montado por concatenação de strings, com 6 CSS e 10 scripts vendorizados e sem Content-Security-Policy | 🟢 |
| `_reversa_sdd/code-analysis.md#módulo-3--boards` | Protocolo de mensagens Webview ↔ extensão: `onLoaded`, `saveBoard`, `saveFilter`, `raiseEvent`, `reloadBoard`, `log`, `openExternalUrl`, `openKnownUrl`; sentido inverso `setBoard`, `setTitleAndFilePath`, `setCurrentUser`, `moveCardTo`, `setCardTag`, `webviewIsVisible`. Cerca de 470 das 1.509 linhas do arquivo são HTML literal dos diálogos | 🟢 |
| `_reversa_sdd/domain.md#31-estrutura-do-quadro` | Quatro colunas fixas (`todo`, `in-progress`, `testing`, `done`), renomeáveis apenas na exibição (RD-01, RD-02) | 🟢 |
| `_reversa_sdd/domain.md#33-ordenação-e-apresentação` | Ordenação por prioridade decrescente, depois tipo, depois título; a ordem manual não é preservada (RD-14 a RD-17). Cores fixas por tipo: emergency vermelho, bug fundo escuro, demais azul-informação (RD-18) | 🟢 |
| `_reversa_sdd/domain.md#34-filtro` | O filtro afeta apenas a exibição e nunca apaga nem move cartões (RD-23); é persistido por workspace em `.vscode/vscode-kanban.filter` (RD-22); expressão inválida mostra todos os cartões (RD-21) | 🟢 |
| `_reversa_sdd/domain.md#35-time-tracking` | Com `noTimeTrackingIfIdle`, o botão de tempo desaparece em Todo e Done (RD-29) — única regra que atribui semântica às colunas | 🟢 |
| `_reversa_sdd/domain.md#38-eventos-e-extensibilidade` | Sete eventos vão ao script do usuário, sempre com `others`; a gravação do quadro precede o disparo (RD-42 a RD-48) | 🟢 |
| `_reversa_sdd/code-analysis.md#algoritmo--identidade-efêmera` | `__uid` é regenerado a cada carga e é a identidade usada por `setCardTag` e `moveCardTo` | 🟢 |
| `_reversa_sdd/architecture.md#8-qualidades-do-sistema` | Testabilidade 🔴 muito baixa; acessibilidade 🔴 não avaliada; segurança 🔴 frágil (sem CSP, sanitização limitada) | 🟢 |
| `_reversa_sdd/architecture.md#11-sequência-recomendada-de-evolução` | A extração recomenda destravar o build e criar rede de testes de caracterização **antes** de tocar em `board.js` — passos já executados nos commits `d478cca`, `6d99e58` e `6a1bcc0` | 🟡 |
| `_reversa_sdd/gaps.md` | Vocabulário de tipos divergente entre seletor, filtro e cores (`issue`, `task` órfãos) — a nova interface herda a divergência se não a resolver | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Mantenedor intermitente (usuário principal) | Acompanhar o próprio trabalho sem sair do editor | Abre o quadro do projeto após semanas de pausa e quer ver de imediato o que está em andamento, sem a coluna Done acumulada de meses competindo por atenção |
| Mantenedor em sessão longa de codificação | Manter conforto visual | Trabalha com o editor em tema escuro e quer que o quadro acompanhe, alternando para claro em ambiente iluminado sem reabrir nada |
| Mantenedor em painel estreito | Ler o quadro ao lado do código | Mantém o quadro num painel dividido com menos de 600 px e precisa de uma leitura vertical, sem quatro colunas espremidas |
| Autor de script de evento | Continuar automatizando o quadro | Mantém `.vscode/vscode-kanban.js` movendo cartões e gravando `tag`; espera que a troca de interface não quebre os sete eventos nem o formato de `others` |
| Colaborador que recebe o repositório | Abrir o quadro versionado de outra pessoa | Faz `git clone`, abre o quadro e vê os mesmos cartões, com a interface adaptada ao tema do editor dele |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A visualização do quadro passa a ter um estado de **tema** com três valores de preferência — claro, escuro e seguir o editor — que resolvem em dois conjuntos de cores efetivos, claro e escuro. O estado é independente dos dados do quadro. 🟢
   - Origem no legado: nova; hoje não existe noção de tema no sistema (`_reversa_sdd/code-analysis.md#módulo-4--html` descreve CSS fixo)
   - Tipo: nova
2. **RN-02:** "Seguir o editor" é o valor padrão e acompanha mudanças de tema do editor enquanto o quadro está aberto. Os valores claro e escuro são escolhas explícitas e prevalecem sobre o tema do editor enquanto estiverem registrados. 🟢
   - Origem no legado: nova
   - Tipo: nova
3. **RN-03:** A preferência de tema é registrada **por instalação do editor**, não por pasta de workspace: vale para todos os quadros do usuário e não trafega no repositório. 🟢
   - Origem no legado: diverge deliberadamente de `_reversa_sdd/domain.md#34-filtro` RD-22, que persiste o filtro por workspace; tema é preferência da pessoa, filtro é recorte do projeto
   - Tipo: nova
4. **RN-04:** A visualização do quadro passa a ter um estado de **ocultação de concluídos**, booleano, que **colapsa a coluna Done inteira**, redistribuindo o espaço horizontal entre as três colunas restantes. 🟢
   - Origem no legado: nova
   - Tipo: nova
5. **RN-05:** A ocultação de concluídos **não altera o arquivo do quadro**: nenhum cartão é removido, movido ou marcado, e o conteúdo gravado em `.vscode/vscode-kanban.json` é idêntico ao que seria gravado com a ocultação desligada. 🟢
   - Origem no legado: estende `_reversa_sdd/domain.md#34-filtro` RD-23, que já estabelece que o filtro afeta apenas a exibição
   - Tipo: nova (por analogia a regra confirmada)
6. **RN-06:** A ocultação de concluídos e o filtro de cartões compõem-se por conjunção: um cartão é exibido quando o filtro o aprova **e** ele não está oculto pela regra de concluídos. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#34-filtro` RD-20
   - Tipo: nova
7. **RN-07:** A preferência de ocultação é registrada **por pasta de workspace**, no mesmo escopo do filtro: cada projeto guarda a sua. 🟢
   - Origem no legado: alinha-se a `_reversa_sdd/domain.md#34-filtro` RD-22
   - Tipo: nova
8. **RN-08:** Alternar tema, ocultação ou modo de visualização **não dispara gravação do quadro** nem qualquer dos sete eventos enviados ao script do usuário. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#38-eventos-e-extensibilidade` RD-42 e RD-47, que definem quando eventos ocorrem
   - Tipo: nova
9. **RN-09:** O quadro passa a ter dois **modos de visualização**: colunas, o padrão, e lista. No modo lista, os cartões aparecem numa sequência vertical única, cada um indicando a que coluna pertence, sujeitos ao mesmo filtro, à mesma ocultação e à mesma ordenação. 🟢
   - Origem no legado: nova; a estrutura de quatro colunas de `_reversa_sdd/domain.md#31-estrutura-do-quadro` permanece intacta no modelo de dados, muda apenas a apresentação
   - Tipo: nova
10. **RN-10:** Qualquer coluna pode ser colapsada e restaurada individualmente; o colapso é estado de exibição e não cria, remove nem reordena colunas. A ocultação de concluídos é o caso particular em que a coluna Done nasce colapsada. 🟢
    - Origem no legado: preserva `_reversa_sdd/domain.md#31-estrutura-do-quadro` RD-02, que proíbe criar, remover e reordenar colunas
    - Tipo: nova
11. **RN-11:** As cores por tipo de cartão preservam a semântica dos três grupos — emergency, bug e demais —, mas os tons são recalibrados por tema para garantir contraste legível em claro e em escuro. 🟡
    - Origem no legado: **altera** `_reversa_sdd/domain.md#33-ordenação-e-apresentação` RD-18, cujos valores fixos tornam o cartão de tipo bug, hoje de fundo escuro, ilegível sobre um quadro escuro
    - Tipo: alterada
12. **RN-12:** Todas as regras de estrutura, ordenação, filtro, tempo, exportação e eventos confirmadas na extração permanecem válidas e observáveis após a reconstrução da interface, com a única exceção de RD-18, alterada por RN-11. 🟢
    - Origem no legado: `_reversa_sdd/domain.md#3-regras-de-domínio` RD-01 a RD-48
    - Tipo: alterada apenas na implementação, inalterada no comportamento
13. **RN-13:** Quando há cartões ocultos por qualquer motivo — coluna colapsada ou ocultação de concluídos —, a interface informa quantos são, de modo que a ausência deles nunca seja confundida com perda de dados. 🟢
    - Origem no legado: nova; responde ao risco de silêncio apontado em `_reversa_sdd/domain.md#34-filtro`, onde um filtro errado esconde cartões sem aviso
    - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | A interface do quadro é reconstruída sobre uma base de componentes com estado explícito, substituindo o script único em escopo global | Must | Nenhum arquivo de interface do quadro excede 400 linhas; nenhuma função excede 50 linhas; o estado do quadro não é lido nem escrito por variável global do documento | 🟢 |
| RF-02 | O comportamento observável do quadro é preservado: criar, editar, mover, excluir cartão; abrir detalhes; aplicar filtro; rastrear tempo | Must | A suíte de caracterização existente passa sem alteração de asserções; um roteiro manual de doze passos produz o mesmo arquivo `.json` antes e depois | 🟢 |
| RF-03 | A ordenação dentro da coluna permanece por prioridade decrescente, depois tipo, depois título | Must | Para um quadro de entrada fixo, a sequência exibida e a sequência gravada são idênticas às da versão anterior | 🟢 |
| RF-04 | O protocolo de mensagens entre Webview e extensão permanece inalterado em nomes e formato de dados | Must | Os catorze comandos listados em §2 continuam sendo emitidos e aceitos com os mesmos campos; nenhum novo comando é obrigatório para o funcionamento básico | 🟢 |
| RF-05 | Os sete eventos enviados ao script do usuário continuam sendo disparados nos mesmos momentos e com os mesmos campos, incluindo `others` e `__uid` | Must | Um script de evento que registra cada chamada produz a mesma sequência de eventos para o mesmo roteiro de ações | 🟢 |
| RF-06 | A barra superior do quadro apresenta um controle de tema acessível por clique e por teclado | Must | O controle é alcançável por navegação sequencial de foco e acionável por tecla de espaço ou entrada | 🟢 |
| RF-07 | O controle de tema percorre três estados — claro, escuro e seguir o editor — e o estado corrente é sempre identificável sem acionar o controle | Must | Três acionamentos consecutivos retornam ao estado inicial; o estado corrente é legível por rótulo, ícone distinto ou ambos | 🟢 |
| RF-08 | No estado "seguir o editor", trocar o tema do editor com o quadro aberto muda a aparência do quadro sem recarregar o painel | Must | Com o quadro aberto nesse estado, alternar o tema do editor de claro para escuro troca o conjunto de cores do quadro, preservando rolagem, filtro e diálogos abertos | 🟡 |
| RF-09 | Nos estados claro e escuro, a aparência do quadro não muda quando o tema do editor muda | Must | Com o quadro em claro explícito e o editor alternado para escuro, o quadro permanece claro | 🟢 |
| RF-10 | A preferência de tema sobrevive ao fechamento e à reabertura do quadro e vale para todos os quadros da instalação | Must | Escolher escuro num quadro, fechar o painel, abrir o quadro de **outra** pasta de workspace: o segundo quadro abre escuro; nenhum arquivo do workspace é criado ou alterado por essa escolha | 🟢 |
| RF-11 | O estado padrão do tema, na ausência de preferência registrada, é "seguir o editor" | Must | Numa instalação sem preferência gravada e com o editor em tema escuro, o quadro abre escuro e o controle indica o estado "seguir o editor" | 🟢 |
| RF-12 | A barra superior do quadro apresenta um controle de ocultação de concluídos, acessível por clique e por teclado | Must | O controle é alcançável por navegação sequencial de foco, expõe seu estado ligado ou desligado a tecnologias assistivas e é acionável por teclado | 🟢 |
| RF-13 | Com a ocultação ativa, a coluna Done é colapsada: nenhum cartão dela aparece e o espaço liberado é redistribuído entre as três colunas restantes | Must | Num quadro com pelo menos um cartão em cada coluna, ao ativar a ocultação a contagem de cartões visíveis cai exatamente pelo número de cartões em `done`, e a largura das três colunas restantes aumenta | 🟢 |
| RF-14 | A coluna colapsada permanece identificável na tela, com seu nome de exibição e a contagem de cartões ocultos | Must | Com quatro cartões em `done` e a ocultação ligada, a faixa da coluna colapsada apresenta o nome configurado da coluna e o número quatro | 🟢 |
| RF-15 | Com a ocultação ativa, o arquivo do quadro permanece com todos os cartões | Must | O conteúdo de `.vscode/vscode-kanban.json` é byte a byte idêntico antes e depois de ativar a ocultação, e permanece completo após uma gravação subsequente provocada por edição de outro cartão | 🟢 |
| RF-16 | Desativar a ocultação restaura a coluna e seus cartões imediatamente, na mesma ordem em que apareceriam sem ela | Must | A sequência exibida após desativar é idêntica à sequência exibida antes de ativar, para o mesmo quadro | 🟢 |
| RF-17 | A ocultação de concluídos compõe-se com o filtro de cartões por conjunção | Must | Com o filtro aprovando apenas cartões de tipo `bug` e a ocultação ligada, exibem-se os cartões `bug` de todas as colunas exceto `done` | 🟢 |
| RF-18 | A preferência de ocultação sobrevive ao fechamento e à reabertura do quadro, e é registrada por pasta de workspace | Should | Ativar a ocultação num projeto, fechar e reabrir: continua ativa; abrir o quadro de outra pasta: a ocultação daquele projeto é independente | 🟢 |
| RF-19 | Qualquer uma das quatro colunas pode ser colapsada e restaurada individualmente pelo usuário | Should | Colapsar In Progress reduz a coluna à faixa com nome e contagem; restaurá-la devolve os cartões na mesma ordem; o arquivo do quadro não é alterado por nenhuma das duas ações | 🟢 |
| RF-20 | O quadro oferece um modo de visualização em lista, alternável pelo usuário, além do modo de colunas | Must | Alternar para lista exibe todos os cartões visíveis numa sequência vertical única, cada um indicando a coluna a que pertence | 🟢 |
| RF-21 | O modo lista respeita filtro, ocultação de concluídos e ordenação vigentes | Must | Com filtro ativo e ocultação ligada, o conjunto de cartões da lista é exatamente o conjunto que apareceria somando as colunas visíveis do modo colunas | 🟢 |
| RF-22 | As ações disponíveis sobre um cartão são as mesmas nos dois modos de visualização | Must | Editar, mover, excluir, abrir detalhes e rastrear tempo estão acessíveis no modo lista com o mesmo efeito que no modo colunas | 🟢 |
| RF-23 | A preferência de modo de visualização sobrevive à reabertura e é registrada por pasta de workspace | Should | Escolher lista num projeto, fechar e reabrir: abre em lista; o quadro de outra pasta abre no modo registrado para ela | 🟡 |
| RF-24 | As cores por tipo de cartão preservam a distinção entre emergency, bug e demais em ambos os temas | Must | Nos dois temas, os três grupos são visualmente distinguíveis entre si e do fundo, com contraste de texto igual ou superior a 4,5:1; nenhum grupo fica indistinguível do fundo do quadro | 🟢 |
| RF-25 | Alternar tema, ocultação, colapso de coluna ou modo de visualização não provoca gravação do quadro nem disparo de evento ao script do usuário | Must | Com um script que registra cada evento e um observador do arquivo do quadro, dez alternâncias de cada controle produzem zero eventos e zero gravações de `.vscode/vscode-kanban.json` | 🟢 |
| RF-26 | Quadros criados pela versão anterior abrem sem migração nem perda de campo | Must | Um arquivo de quadro produzido pela versão 1.33.1, com cartões contendo `id`, `tag`, `references` e descrição em Markdown, abre com todos os campos preservados e grava sem alteração espúria | 🟢 |
| RF-27 | Os elementos interativos do quadro expõem rótulo textual e estado a tecnologias assistivas | Should | Cada botão da barra superior e cada ação de cartão tem nome acessível não vazio; controles de dois ou três estados anunciam o estado corrente | 🟡 |
| RF-28 | A renderização do conteúdo Markdown do cartão preserva a barreira de sanitização existente ou a torna mais estrita, nunca menos | Must | Um cartão cuja descrição contenha `<script>` não executa script; o conjunto de elementos e atributos permitidos após a mudança é subconjunto ou igual ao anterior | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Restrição de tecnologia | A base de componentes da interface é React, por decisão explícita do solicitante nesta feature | Pedido do usuário no argumento de `/reversa-requirements`; registrado aqui por ser restrição imposta, não escolha derivada dos requisitos | 🟢 |
| Desempenho | Alternar tema, ocultação, colapso ou modo de visualização reflete na tela em até 200 ms para um quadro de até 500 cartões | Hoje cada operação re-renderiza o quadro inteiro (`_reversa_sdd/code-analysis.md#módulo-7--board-ui`); o novo limite impede regressão perceptível | 🟡 |
| Desempenho | A abertura do quadro até a primeira renderização completa não excede 1,5 s para 500 cartões, medida do `onLoaded` ao fim da pintura | O fluxo de abertura já serializa o quadro inteiro pela ponte (`_reversa_sdd/architecture.md#51-abertura-do-quadro`) | 🟡 |
| Desempenho | O pacote de interface entregue ao Webview não excede 500 KB comprimido, excluídas as bibliotecas vendorizadas de editor, diagramas e realce de sintaxe | O sistema hoje carrega dez scripts vendorizados sem controle de tamanho (`_reversa_sdd/code-analysis.md#módulo-4--html`); a mudança não deve piorar o custo de carga | 🟡 |
| Segurança | A reconstrução não amplia a superfície de execução do Webview: nada de novo caminho que insira HTML não sanitizado vindo do conteúdo do cartão | Achado C4 em `_reversa_sdd/code-analysis.md#síntese-dos-achados-por-severidade`: a sanitização atual remove apenas `<script>` | 🟢 |
| Segurança | O documento do Webview passa a ser compatível com uma política de segurança de conteúdo restritiva, sem código embutido em atributo nem avaliação dinâmica de texto como código | Achado C3: hoje não há política alguma, e o estilo de montagem por concatenação de strings dificulta adotá-la | 🟢 |
| Compatibilidade | Nenhuma configuração existente do namespace do quadro muda de nome, tipo ou padrão | As treze propriedades estão documentadas em `_reversa_sdd/inventory.md#10-configuração-contribuída`; quebrá-las invalidaria configurações de usuários | 🟢 |
| Compatibilidade | A extensão continua funcionando na versão mínima de editor hoje declarada no manifesto | `_reversa_sdd/inventory.md#1-identidade-do-projeto` | 🟢 |
| Manutenibilidade | Nenhum arquivo de código próprio da interface excede 400 linhas e nenhuma função excede 50 linhas | Limites do Princípio 5.6 do mantenedor; hoje três arquivos violam o primeiro e dois o segundo (`_reversa_sdd/code-analysis.md#métricas`) | 🟢 |
| Manutenibilidade | Cada biblioteca vendorizada que sobreviver à reconstrução é acessada por um adaptador próprio e isolado; nenhum componente de interface a referencia diretamente | Condição para que a substituição futura de editor, diagramas ou conversor de Markdown seja local e não exija nova reescrita | 🟢 |
| Testabilidade | A lógica de decisão de exibição — ordenação, filtro, ocultação, colapso e modo de visualização — é exercitável por teste sem instanciar a interface | Testabilidade hoje é 🔴 porque o domínio está preso ao Webview (`_reversa_sdd/architecture.md#8-qualidades-do-sistema`) | 🟢 |
| Testabilidade | A cobertura de teste da lógica de exibição do quadro atinge no mínimo 60% | Limite do Princípio 5.2 do mantenedor; a cobertura atual do domínio é próxima de zero | 🟢 |
| Observabilidade | Toda falha de renderização é registrada com mensagem nomeada pela ponte de log existente; nenhum bloco de captura de erro fica vazio | A extração conta dez blocos de captura vazios (`_reversa_sdd/architecture.md#8-qualidades-do-sistema`) | 🟢 |
| Reprodutibilidade | O processo de construção da interface é determinístico, com versões fixadas no manifesto e arquivo de trava versionado | Princípio 5.3 do mantenedor; o projeto já versiona o arquivo de trava | 🟢 |
| Acessibilidade | Contraste mínimo de 4,5:1 para texto normal em ambos os temas, e foco visível em todo elemento interativo | Acessibilidade hoje é 🔴 não avaliada (`_reversa_sdd/architecture.md#8-qualidades-do-sistema`) | 🟡 |
| Usabilidade | O quadro permanece utilizável em largura de painel a partir de 600 px no modo colunas, e a partir de 320 px no modo lista, sem rolagem horizontal do documento | As quatro colunas fixas competem por espaço em painel dividido (`_reversa_sdd/domain.md#31-estrutura-do-quadro`); o modo lista é a resposta para o painel estreito | 🟡 |

### Escopo negativo

Não fazem parte desta feature, ainda que adjacentes:

- Correção das cinco falhas de segurança críticas catalogadas na extração (execução de script do workspace, raízes de recurso, política de segurança de conteúdo, sanitização de Markdown e limpeza de exportações por glob). Esta feature apenas **não pode piorá-las** e deve deixar o terreno pronto para a política de segurança de conteúdo.
- Substituição do filtro digitável por controles visuais. A ocultação de concluídos é um controle próprio, não o início da substituição do filtro.
- Customização de colunas — criação, remoção e reordenação —, limite de trabalho em progresso, reordenação manual de cartões e semântica de vínculo entre cartões. O colapso de coluna previsto em RN-10 é estado de exibição e não abre exceção a RD-02.
- Unificação do vocabulário divergente de tipos de cartão. As cores mudam de tom (RN-11), mas o conjunto de tipos reconhecidos por seletor, filtro e cores permanece como está.
- Migração da integração de tempo para a versão vigente da interface de programação do fornecedor externo.
- Substituição das bibliotecas vendorizadas de editor de código, renderização de diagramas, conversão de Markdown e realce de sintaxe. Elas são encapsuladas atrás de adaptadores, não trocadas.

## 7. Critérios de Aceitação

```gherkin
Cenário: Percorrer os três estados do controle de tema
  Dado um quadro aberto com o controle de tema no estado "seguir o editor"
  Quando o usuário aciona o controle três vezes
  Então o controle passa por claro e escuro e retorna a "seguir o editor"
  E o arquivo do quadro no disco permanece inalterado

Cenário: Seguir o editor acompanha a troca de tema
  Dado um quadro aberto com o controle de tema em "seguir o editor" e o editor em tema claro
  Quando o usuário troca o tema do editor para escuro
  Então o quadro passa a exibir o conjunto de cores escuro sem recarregar o painel
  E a posição de rolagem e o filtro aplicado são preservados

Cenário: Escolha explícita prevalece sobre o tema do editor
  Dado um quadro aberto com o controle de tema em claro por escolha do usuário
  Quando o usuário troca o tema do editor para escuro
  Então o quadro permanece no conjunto de cores claro

Cenário: Preferência de tema vale para toda a instalação
  Dado um quadro exibido em escuro por escolha explícita do usuário
  Quando o usuário fecha o painel e abre o quadro de outra pasta de workspace
  Então esse segundo quadro é exibido em escuro
  E nenhum arquivo dentro das pastas de workspace foi criado ou alterado pela escolha

Cenário: Ocultar os concluídos colapsa a coluna
  Dado um quadro com três cartões em Todo e quatro cartões em Done
  Quando o usuário ativa a ocultação de concluídos
  Então nenhum dos quatro cartões de Done aparece na tela
  E a coluna Done aparece colapsada, com seu nome de exibição e o número quatro
  E as três colunas restantes ocupam o espaço liberado
  E o arquivo do quadro continua contendo os sete cartões

Cenário: Restaurar os concluídos
  Dado um quadro com a ocultação de concluídos ativa
  Quando o usuário desativa a ocultação
  Então a coluna Done volta a exibir seus cartões
  E a ordem exibida é a mesma de antes da ocultação

Cenário: Ocultação é preferência do projeto
  Dado um quadro com a ocultação de concluídos ativa na pasta de workspace A
  Quando o usuário abre o quadro da pasta de workspace B pela primeira vez
  Então o quadro de B abre com a ocultação desativada

Cenário: Ocultação combinada com filtro
  Dado um quadro com cartões de tipo bug em Todo e em Done
  E um filtro que aprova apenas cartões de tipo bug
  Quando o usuário ativa a ocultação de concluídos
  Então aparecem os cartões bug de Todo
  E não aparece nenhum cartão de Done

Cenário: Colapsar uma coluna qualquer
  Dado um quadro no modo colunas com cartões em In Progress
  Quando o usuário colapsa a coluna In Progress
  Então a coluna reduz-se a uma faixa com seu nome de exibição e a contagem de cartões
  E o arquivo do quadro não é gravado

Cenário: Alternar para o modo lista
  Dado um quadro no modo colunas com cartões em todas as quatro colunas
  Quando o usuário alterna para o modo lista
  Então todos os cartões visíveis aparecem numa sequência vertical única
  E cada cartão indica a coluna a que pertence

Cenário: Modo lista respeita filtro e ocultação
  Dado um quadro com a ocultação de concluídos ativa e um filtro que aprova apenas cartões de tipo bug
  Quando o usuário alterna para o modo lista
  Então a lista contém exatamente os cartões bug das colunas Todo, In Progress e Testing
  E nenhum cartão de Done aparece na lista

Cenário: Ações do cartão no modo lista
  Dado um quadro no modo lista
  Quando o usuário move um cartão de Todo para In Progress
  Então o arquivo do quadro é gravado com o cartão na nova coluna
  E o script de evento recebe o evento de movimentação com os mesmos campos do modo colunas

Cenário: Distinção de tipos no tema escuro
  Dado um quadro em tema escuro com um cartão de tipo emergency, um de tipo bug e um sem tipo
  Quando o quadro é renderizado
  Então os três cartões são visualmente distinguíveis entre si e do fundo do quadro
  E o contraste entre o texto e o fundo de cada cartão é de pelo menos 4,5 para 1

Cenário: Alternância não grava e não dispara evento
  Dado um quadro aberto e um script de evento que registra cada chamada recebida
  Quando o usuário alterna dez vezes o tema, dez vezes a ocultação e dez vezes o modo de visualização
  Então o script não registra nenhuma chamada
  E o arquivo do quadro não é regravado nenhuma vez

Cenário: Edição com ocultação ativa preserva os concluídos
  Dado um quadro com a ocultação de concluídos ativa e quatro cartões em Done
  Quando o usuário edita o título de um cartão de Todo e confirma
  Então o arquivo do quadro é gravado
  E os quatro cartões de Done continuam presentes no arquivo

Cenário: Abertura de quadro criado pela versão anterior
  Dado um arquivo de quadro gravado pela versão anterior da extensão, com cartões contendo identificador, marcador livre, vínculos e descrição em Markdown
  Quando o usuário abre o quadro
  Então todos os cartões aparecem com os mesmos campos
  E nenhuma gravação espontânea altera o arquivo

Cenário: Filtro inválido continua mostrando tudo
  Dado um quadro aberto e a ocultação de concluídos desativada
  Quando o usuário digita uma expressão de filtro sintaticamente inválida
  Então todos os cartões continuam visíveis
  E a interface não fica em estado de erro

Cenário: Conteúdo de cartão com script embutido
  Dado um cartão cuja descrição contém um bloco de script
  Quando o quadro renderiza esse cartão
  Então o script não é executado
  E o restante da descrição é exibido normalmente

Cenário: Quadro vazio com ocultação ativa
  Dado um quadro sem nenhum cartão
  Quando o usuário ativa a ocultação de concluídos
  Então as três colunas restantes continuam visíveis e vazias
  E a faixa da coluna Done colapsada informa zero cartões
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 reconstrução da interface sobre base de componentes | Must | É a condição da feature: sem ela, tema, ocultação e modo lista seriam mais dívida sobre o arquivo de 2.161 linhas |
| RF-02 a RF-05 preservação de comportamento, ordenação, protocolo e eventos | Must | Regressão silenciosa aqui quebra quadros e scripts de usuários reais; é o risco número um apontado pela extração |
| RF-06, RF-07 controle de tema e seus três estados | Must | Pedido explícito da feature |
| RF-08, RF-09, RF-11 semântica dos três estados | Must | Sem elas o tri-estado é decorativo: não se distingue "seguir" de uma escolha fixa |
| RF-10 persistência da preferência de tema por instalação | Must | Um controle que esquece a escolha a cada abertura resolve pela metade |
| RF-12 a RF-17 controle, colapso, identificação, não destrutividade, restauração e composição com filtro | Must | Definem a semântica correta da ocultação; sem elas o recurso é ambíguo ou perigoso |
| RF-20 a RF-22 modo lista, com paridade de conjunto e de ações | Must | Pedido explícito na resposta de esclarecimento; um modo lista que não aceita as mesmas ações é meia funcionalidade |
| RF-24 distinção de tipos em ambos os temas | Must | Sem isso o tema escuro torna o cartão de tipo bug ilegível, regressão direta causada pela própria feature |
| RF-25 ausência de efeito colateral das alternâncias | Must | Gravação espúria interage com a ordenação in place e reescreve o arquivo do usuário sem que ele tenha editado nada |
| RF-26 compatibilidade com quadros existentes | Must | O arquivo do quadro é versionado e compartilhado; incompatibilidade destrói trabalho alheio |
| RF-28 preservação da barreira de sanitização | Must | Piorar a segurança numa feature de estética seria regressão inaceitável |
| RF-18 persistência da ocultação por workspace | Should | Conveniente e coerente com o filtro, que já persiste, mas não bloqueia o uso |
| RF-19 colapso de qualquer coluna | Should | Generaliza o mecanismo já exigido pela ocultação; barato depois dele, dispensável antes |
| RF-23 persistência do modo de visualização | Should | Mesma natureza da persistência da ocultação, sem ser condição de uso |
| RF-27 rótulos e estados acessíveis | Should | Melhora real de qualidade, hoje inexistente; não bloqueia a entrega |
| Requisitos não funcionais de desempenho | Should | Limites de proteção contra regressão, não metas de otimização |
| Requisitos não funcionais de testabilidade e cobertura | Must | O mantenedor opera de forma intermitente; sem rede de testes a reescrita é irreversível na prática |
| Requisito não funcional de adaptador por biblioteca vendorizada | Must | É o que impede a reconstrução de virar substituição de todas as bibliotecas na mesma entrega |
| Requisitos não funcionais de acessibilidade e usabilidade em painel estreito | Could | Desejáveis, verificáveis, porém sacrificáveis se o prazo apertar |
| Unificação do vocabulário divergente de tipos de cartão | Won't | Alteraria comportamento observável do filtro; merece feature própria |

## 9. Esclarecimentos

### Sessão 2026-08-02

- **Q:** Qual a semântica e o alcance do controle de tema — binário ou tri-estado, preferência por instalação ou por pasta de workspace?
  **R:** Tri-estado, com claro, escuro e seguir o editor; preferência registrada por instalação do editor. Integrado em RN-01, RN-02, RN-03 e nos requisitos RF-06 a RF-11.

- **Q:** Qual o alcance e a persistência da ocultação de concluídos — ocultar apenas os cartões ou colapsar a coluna; preferência por instalação ou por pasta de workspace?
  **R:** Colapsar a coluna Done inteira, redistribuindo o espaço entre as três restantes; preferência registrada por pasta de workspace, no mesmo escopo do filtro. Integrado em RN-04, RN-07 e nos requisitos RF-12 a RF-18.

- **Q:** Que grau de mudança "atualizar layout" autoriza — repintura, ajuste de densidade, redesenho da disposição ou redesenho amplo com modo alternativo de visualização?
  **R:** Redesenho amplo, incluindo um modo de visualização em lista além do quadro. Integrado em RN-09, RN-10 e nos requisitos RF-19 a RF-23, além do requisito não funcional de usabilidade em painel estreito.

- **Q:** O que fazer com as cores por tipo de cartão no tema escuro, dado que RD-18 fixa o tipo bug em fundo escuro?
  **R:** Manter a semântica dos três grupos e recalibrar os tons por tema para garantir contraste. Integrado em RN-11 e no requisito RF-24; RD-18 passa a constar como regra alterada.

## 10. Lacunas

- 🟢 **Fronteira da reconstrução — RESOLVIDA em 2026-08-02, na abertura de `/reversa-plan`.** A pergunta era se a reconstrução cobria apenas o quadro e seus cartões ou alcançava também os diálogos de adicionar, editar e ver detalhes, hoje gerados como cerca de 470 linhas de HTML literal dentro de `boards.ts` (`_reversa_sdd/code-analysis.md#módulo-3--boards`). **Decisão do solicitante: os diálogos entram no escopo**, com editor de código, diagramas e conversão de Markdown atrás de adaptadores. Razões acolhidas: o redesenho amplo escolhido em RN-09 tornaria incoerente um diálogo com a estética anterior, e dividir o Webview entre duas pilhas criaria dois donos do mesmo estado autoritativo descrito no ADR-008. Registrada como decisão D-09 do `roadmap.md`. Não restam lacunas abertas nesta feature.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-02 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-08-02 | Quatro dúvidas resolvidas por `/reversa-clarify`: tri-estado de tema por instalação, colapso da coluna Done por workspace, redesenho amplo com modo lista e recalibração das cores por tema. Regras de negócio reescritas de 8 para 13 itens, requisitos funcionais de 20 para 28, cenários de aceitação de 12 para 19 | reversa |
| 2026-08-02 | Última lacuna fechada na abertura de `/reversa-plan`: a reconstrução alcança também os três diálogos, que saem de `boards.ts`. Seção 10 sem marcadores 🔴 | reversa |

## Pendências de Qualidade

Registradas após três iterações de auto-validação contra `.reversa/templates/quality-template.md`:

- **Q-018 (SoluçãoImplícita), reprovado por decisão do solicitante.** O critério proíbe nomear biblioteca ou framework no documento. O argumento da feature impõe React explicitamente, de modo que a restrição foi registrada como tal na primeira linha dos Requisitos Não Funcionais, e não infiltrada nos requisitos funcionais — estes descrevem o comportamento esperado sem depender do nome da tecnologia. A reprovação fica visível em vez de silenciada.
- **Q-019 e Q-020 (Princípios), não avaliáveis.** O projeto não tem `.reversa/principles.md`. Na ausência dele, as regras de negócio foram conferidas contra os princípios gerais do mantenedor, sobretudo os limites de tamanho de arquivo e função, a exigência de cobertura mínima e a preferência por erro barulhento. Rodar `/reversa-principles` tornaria essa conferência verificável.
- **Q-011 (Cobertura), ressalva.** RN-11 altera a regra confirmada RD-18 e a cita corretamente. RN-03 diverge de RD-22 de forma deliberada, ao registrar o tema por instalação enquanto o filtro persiste por workspace: a divergência está declarada, mas produz duas políticas de escopo convivendo no mesmo produto, o que merece nota no plano.
