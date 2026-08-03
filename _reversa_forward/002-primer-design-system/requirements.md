# Requirements: Quadro sobre sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

A feature `001` reconstruiu a interface do quadro em componentes, mas construiu junto o próprio
vocabulário visual: cento e vinte e três linhas de variáveis de cor em `tokens.css`, seiscentas e
oitenta e seis de regras em `board.css` e uma folha de ícones desenhada à mão. Essa camada é
autoral, e por isso é dívida: cada estado novo de controle, cada contraste, cada foco visível volta
a ser decisão de quem mantém o projeto, sozinho e sem revisão.

Esta feature substitui esse vocabulário por um **sistema de design mantido por terceiro**, do qual o
projeto passa a ser apenas consumidor. O ganho não é estético em primeiro lugar, e sim de custo de
manutenção: paleta, tipografia, espaçamento, estados de foco e variantes acessíveis passam a chegar
por atualização de dependência, não por decisão local. O comportamento do quadro, o formato do
arquivo e o contrato com os scripts do usuário permanecem intocados.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/adrs/003-interface-em-webview-com-jquery-vendorizado.md#Decisão` | A interface nasceu sobre jQuery e Bootstrap vendorizados, com seis bibliotecas somadas ao longo de 2018 e nenhum número de versão registrado. A dívida é reconhecida pelo autor original desde 2020 | 🟢 |
| `_reversa_sdd/architecture.md#9.2` | Dívidas de dependências: bibliotecas vendorizadas sem versão, sem caminho de atualização e sem avaliação de exposição a vulnerabilidades conhecidas | 🟢 |
| `_reversa_sdd/architecture.md#4` | O componente `board-ui` concentrava estado, renderização e interação em 2.161 linhas, com confiança 🔴; a feature `001` o dissolveu em `src/webview/` | 🟢 |
| `_reversa_sdd/architecture.md#8` | Qualidades do sistema: o Webview roda offline, sob restrição de origem, e nenhum recurso pode vir de rede em tempo de execução | 🟢 |
| `_reversa_forward/001-interface-react-tema-e-done/requirements.md#5` | Vinte e oito requisitos funcionais entregues, dos quais RF-02 a RF-05 fixam a preservação de comportamento, ordenação, protocolo de mensagens e eventos de script | 🟢 |
| `_reversa_forward/001-interface-react-tema-e-done/requirements.md#4` | Decisão D-03: o quadro deliberadamente **não** se pinta com as variáveis `--vscode-*`, porque um quadro que só pode seguir o editor não pode ser fixado contra ele (RF-09 daquela feature) | 🟢 |
| `_reversa_sdd/domain.md#3` | Quarenta e oito regras de domínio confirmadas, nenhuma delas dependente da aparência: o domínio do quadro é indiferente a como se pinta | 🟢 |
| `.vscode/vscode-kanban.json`, cartão `[35]` | A interface da `001` renomeou as classes de estilo e derruba o `vscode-kanban.css` de quem tiver um, sem nota de migração | 🟢 |

**Restrição declarada pelo dono do produto.** O sistema de design a adotar é o **Primer**, do GitHub,
nomeado explicitamente no pedido. A escolha é dada, não derivada: este documento não a submete a
comparação com alternativas. O restante do texto descreve o quê, e a nomeação aparece apenas aqui e
na seção 10, para que a auditoria de qualidade encontre o conflito registrado em vez de escondido.
Os dados que sustentam a viabilidade da escolha, apurados em 2026-08-03: pacote na versão 38.34.0,
publicado três dias antes desta data; organização mantenedora com cadência de release semanal;
compatibilidade declarada com a versão de React já em uso no projeto; catorze conjuntos de tema
prontos, entre eles quatro de alto contraste e seis para tipos de daltonismo.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Mantenedor intermitente | Voltar ao projeto depois de meses sem perder tempo decidindo cor de borda de botão em estado de foco | Precisa acrescentar um controle na barra superior e quer que ele já nasça com estados de foco, tamanho e contraste corretos, sem escrever CSS |
| Usuário do quadro | Ler e mover cartões dentro do editor sem sofrer com contraste ruim ou alvo de clique pequeno | Abre o quadro num tema escuro, arrasta um cartão de `todo` para `in progress` e confere a descrição em Markdown |
| Usuário com baixa visão ou daltonismo | Distinguir tipos de cartão e estados de coluna sem depender de acuidade cromática | Ativa um tema de alto contraste e continua distinguindo cartão de emergência de cartão comum |
| Usuário com folha de estilo própria | Preservar a customização que escreveu em `.vscode/vscode-kanban.css` | Atualiza a extensão e quer saber, antes de abrir o quadro, o que da sua folha continua valendo |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A paleta, a tipografia, o espaçamento, os ícones e os estados de interação do quadro
   deixam de ser definidos pelo projeto e passam a ser consumidos de um sistema de design externo
   versionado. 🟢
   - Origem no legado: `_reversa_sdd/adrs/003-interface-em-webview-com-jquery-vendorizado.md`
   - Tipo: alterada. Substitui a decisão D-03 da feature `001` no que toca à **origem** dos valores,
     preservando integralmente o que ela decidiu sobre o **controle** deles (ver RN-02).
   - Alcance, decidido em 2026-08-03: a substituição vale para os **controles** — botões, campos,
     seletores, caixas de diálogo, menus e rótulos de contagem. O cartão, a coluna e a área de
     arrastar permanecem composição do projeto, pintada com as variáveis do sistema adotado, porque
     nenhum sistema de design de propósito geral oferece quadro kanban (ver RN-07).

2. **RN-02:** Os três estados de preferência de tema — claro fixo, escuro fixo e seguir o editor —
   permanecem, e cada um passa a designar um conjunto nomeado do sistema adotado. A independência
   cromática em relação ao editor é preservada: nos dois estados fixos, mudar o tema do editor não
   altera o quadro. 🟢
   - Origem no legado: `_reversa_forward/001-interface-react-tema-e-done/requirements.md#4` (D-03)
   - Tipo: alterada. Muda de onde vêm as duas paletas, não quem escolhe entre elas.

3. **RN-03:** A distinção entre tipos de cartão deixa de depender apenas de cor e passa a ter também
   um sinal não cromático, legível por quem não distingue matizes. 🟡
   - Origem no legado: `_reversa_forward/001-interface-react-tema-e-done/requirements.md#5` (RF-24,
     que exigia distinção visual sem especificar o canal)
   - Tipo: alterada. Estreita um requisito que a `001` deixou satisfeito só pela cor.

4. **RN-04:** A superfície que a folha de estilo do usuário pode alcançar passa a ser um contrato
   declarado e versionado, e não um efeito colateral dos nomes internos de classe. Chama-se **âncora
   de estilo** cada seletor que o projeto se compromete a manter estável entre versões justamente
   para que a folha do usuário possa alcançá-lo. 🟢
   - Origem no legado: `_reversa_sdd/adrs/003-interface-em-webview-com-jquery-vendorizado.md` e o
     cartão `[35]` do quadro do projeto
   - Tipo: nova. Hoje não existe contrato algum: o usuário estiliza o que consegue alcançar, e cada
     refatoração quebra o que ele escreveu.
   - Alcance, decidido em 2026-08-03: além das âncoras novas, o quadro mantém uma camada de
     compatibilidade que faz os nomes de classe da versão 1.33.1 continuarem alcançando os elementos
     equivalentes. Folhas escritas contra a interface antiga seguem valendo sem edição.
   - Níveis, decididos na auditoria de 2026-08-03: a âncora é **permanente** quando existe enquanto o
     quadro existir, e **de compatibilidade** quando existe para servir a camada da versão 1.33.1 e
     dura o que ela durar. A promessa de estabilidade é a mesma nos dois casos; o que difere é o
     gatilho de remoção. Nenhuma âncora, de nenhum nível, some sem nota no `CHANGELOG.md` e elevação
     de versão maior.

5. **RN-05:** O piso de versão do editor suportado passa a ser a primeira versão cujo motor de
   renderização interpreta os recursos de folha de estilo que o sistema de design emprega, entre eles
   o seletor relacional e as consultas de contêiner. Versões abaixo do piso deixam de ser suportadas
   de forma declarada, em vez de degradarem em silêncio. 🟢
   - Origem no legado: `package.json`, campo `engines.vscode`, hoje em `^1.62.0`, de outubro de 2021,
     e `scripts/build-webview.js`, cujo alvo de compilação é o motor correspondente a essa data
   - Tipo: nova. A estimativa corrente é VS Code 1.78, de abril de 2023; o número exato é apurado no
     plano, contra a tabela de motor de renderização por versão do editor.
   - Consequência: o alvo de compilação do empacotador sobe junto, deixando de emitir código
     rebaixado para um motor que nenhuma instalação suportada usa.

6. **RN-06:** Nenhum recurso da interface pode ser obtido de rede em tempo de execução. Folhas de
   estilo e ícones do sistema de design são empacotados junto da extensão, e a tipografia é resolvida
   pela pilha de fontes do próprio sistema operacional, sem arquivo de fonte a transferir. 🟢
   - Origem no legado: `_reversa_sdd/architecture.md#8` e
     `_reversa_sdd/adrs/003-interface-em-webview-com-jquery-vendorizado.md#Contexto`
   - Tipo: nova como enunciado, confirmatória na prática. O sistema já se comporta assim; a regra
     impede que a adoção do sistema de design abra a primeira exceção.

7. **RN-07:** O cartão e a coluna, por não terem correspondente no sistema de design adotado,
   permanecem componentes do projeto, mas não podem declarar valor visual próprio: toda cor, medida,
   raio e sombra que usam vem das variáveis do sistema. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2`, que define cartão e coluna como conceitos do
     domínio do quadro, sem correspondência em vocabulário de interface genérico
   - Tipo: nova. Delimita o que RN-01 alcança e o que fica de fora, evitando que "adotar o sistema"
     seja lido como "reescrever o quadro inteiro".

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Os controles interativos do quadro — botões, campos, seletores, caixas de diálogo, rótulos de contagem e menus — são renderizados por componentes do sistema de design adotado, e não por marcação e folha de estilo autorais | Must | Nenhum arquivo sob `src/webview/ui/` declara cor, raio de borda, sombra ou tamanho de fonte em valor literal; toda propriedade visual vem de variável do sistema adotado | 🟢 |
| RF-02 | O comportamento observável do quadro é preservado integralmente: criar, editar, mover, excluir cartão; abrir detalhes; aplicar filtro; rastrear tempo; alternar tema, ocultação, colapso e modo de visualização | Must | A suíte de testes existente passa sem que nenhuma asserção seja alterada, e o roteiro de doze passos de `_reversa_forward/001-interface-react-tema-e-done/onboarding.md` produz a mesma sequência de estados | 🟢 |
| RF-03 | O protocolo de mensagens entre Webview e extensão permanece inalterado em nomes e formato de dados | Must | Os dezesseis comandos vigentes continuam sendo emitidos e aceitos com nome e formato idênticos aos de `_reversa_forward/001-interface-react-tema-e-done/interfaces/webview-bridge.md` | 🟢 |
| RF-04 | Os eventos enviados ao script de evento do usuário continuam disparando nos mesmos momentos e com os mesmos campos, incluindo `others` e `__uid` | Must | Um script que registre todos os eventos produz sequência e campos idênticos aos capturados na referência da feature `001` | 🟢 |
| RF-05 | O arquivo do quadro permanece byte a byte idêntico quando a única ação do usuário for de aparência | Must | Alternar tema, ocultação, colapso e modo de visualização, e comparar `.vscode/vscode-kanban.json` antes e depois: os bytes coincidem | 🟢 |
| RF-06 | Quadros criados por versões anteriores abrem sem migração e sem perda de campo | Must | Um arquivo produzido pela versão 1.33.1, com cartões contendo `id`, `tag`, `references` e `time-tracking`, abre e regrava sem alteração espúria | 🟢 |
| RF-07 | Os estados de preferência de tema da feature `001` — claro fixo, escuro fixo e seguir o editor — permanecem disponíveis com a mesma semântica, e o controle percorre em ciclo todos os estados oferecidos | Must | Tantos acionamentos consecutivos quantos forem os estados oferecidos retornam o controle ao estado inicial, sem repetir nem pular estado; em estado fixo, alternar o tema do editor não altera o quadro; em "seguir o editor", altera sem recarregar o painel | 🟢 |
| RF-08 | O tema claro e o tema escuro do quadro são conjuntos completos do sistema de design adotado, não valores redefinidos pelo projeto | Must | Os arquivos de tema do projeto contêm apenas o mapeamento entre estado de preferência e conjunto nomeado; nenhuma variável de cor é redeclarada localmente | 🟢 |
| RF-09 | O usuário pode escolher, além de claro e escuro, ao menos um conjunto de alto contraste | Should | O controle de tema oferece a variante de alto contraste, e escolhê-la altera a aparência do quadro sem recarregar o painel | 🟢 |
| RF-10 | O tipo do cartão é distinguível por um sinal que não seja a cor | Must | Convertida a tela para escala de cinza, um cartão de emergência continua distinguível de um cartão comum | 🟡 |
| RF-11 | O quadro declara as âncoras de estilo que a folha do usuário pode alcançar, e essas âncoras não mudam entre versões de correção nem de funcionalidade | Must | Existe uma lista documentada de seletores estáveis; uma folha de usuário escrita contra ela continua funcionando após a atualização | 🟢 |
| RF-12 | A atualização avisa o usuário de folha própria de que a superfície de estilo mudou, antes que ele abra o quadro e a encontre quebrada | Must | O `CHANGELOG.md` traz a nota de alteração incompatível e o `README.md` traz a seção de migração com o mapa entre a superfície antiga e a nova | 🟢 |
| RF-13 | Todo elemento interativo é alcançável e acionável por teclado, com foco sempre visível | Must | Percorrendo o quadro apenas por teclado, cada controle recebe foco visível e é acionável, e nenhuma armadilha de foco existe nas caixas de diálogo | 🟢 |
| RF-14 | Todo elemento interativo expõe nome acessível e estado a tecnologias assistivas | Must | Cada botão da barra superior e cada ação de cartão tem nome acessível não vazio; controles de estado expõem o estado corrente | 🟢 |
| RF-15 | A movimentação de cartão por arrastar e soltar é preservada, e existe caminho equivalente por teclado | Must | Um cartão pode ir de `todo` a `in progress` tanto pelo ponteiro quanto exclusivamente pelo teclado, com o mesmo resultado gravado | 🟡 |
| RF-16 | A renderização de Markdown, de diagramas e de código realçado é preservada, e o tema desses conteúdos acompanha o tema do quadro | Must | Um cartão com Markdown, diagrama e bloco de código renderiza os três; alternar o tema muda a aparência dos três sem recarregar o painel | 🟢 |
| RF-17 | A barreira de sanitização do conteúdo Markdown é preservada ou tornada mais estrita, nunca menos | Must | Um cartão cuja descrição contenha marcação de script não a executa, e o conjunto de elementos permitidos não cresce em relação ao vigente | 🟢 |
| RF-18 | Nenhum recurso da interface é obtido de rede durante a execução | Must | Com a máquina desconectada, o quadro abre e renderiza integralmente, e o registro de requisições do Webview não acusa nenhuma requisição externa | 🟢 |
| RF-19 | O documento do Webview declara uma política de segurança de conteúdo que admite a folha do sistema de design sem afrouxar as demais diretivas | Must | O documento traz a política declarada; nenhuma fonte externa é admitida e a execução de script segue restrita ao pacote da própria extensão | 🟡 |
| RF-20 | Os dois modos de visualização, colunas e lista, oferecem o mesmo conjunto de cartões e as mesmas ações | Must | Com filtro e ocultação ativos, o conjunto exibido em lista é exatamente o exibido em colunas, e editar, mover, excluir, abrir detalhes e rastrear tempo estão acessíveis nos dois | 🟢 |
| RF-21 | O piso de versão do editor é declarado e verificado, e o alvo de compilação do empacotador acompanha esse piso | Must | O campo `engines.vscode` traz o piso definido em RN-05; o alvo declarado em `scripts/build-webview.js` corresponde ao motor de renderização dessa versão; e o quadro abre e renderiza corretamente na versão do piso, com o seletor relacional e as consultas de contêiner surtindo efeito | 🟢 |
| RF-22 | As bibliotecas vendorizadas cuja função o sistema de design adotado absorve são removidas do projeto | Should | Nenhuma cópia sem número de versão permanece em `src/res/` para função que o sistema adotado já cumpre; as que permanecem estão listadas com versão declarada | 🟢 |
| RF-23 | Nenhum arquivo de interface ultrapassa quatrocentas linhas | Should | A contagem de linhas de todo arquivo sob `src/webview/` fica igual ou abaixo de quatrocentas | 🟢 |
| RF-24 | O cartão, a coluna e a área de arrastar permanecem componentes do projeto, pintados exclusivamente com as variáveis do sistema adotado | Must | Os arquivos de cartão e de coluna não declaram nenhum valor visual literal; retirada a folha do sistema adotado, esses elementos ficam sem cor, o que prova que nada foi redeclarado localmente | 🟢 |
| RF-25 | Os ícones do quadro passam a vir do conjunto de ícones do sistema de design adotado, empacotados com a extensão | Must | Nenhum ícone permanece desenhado à mão no projeto para função que o conjunto adotado cobre, e o quadro renderiza todos os ícones sem rede | 🟢 |
| RF-26 | A tipografia do quadro segue a escala do sistema de design adotado, resolvida pela pilha de fontes do sistema operacional | Must | Nenhum arquivo de fonte é empacotado nem transferido, e os tamanhos e pesos de texto do quadro correspondem aos da escala do sistema adotado | 🟢 |
| RF-27 | A referência de comportamento da versão 1.33.1 é capturada antes de qualquer alteração desta feature | Must | Existem, na pasta de referência da feature `001`, o registro de eventos e o arquivo de quadro produzidos pelo roteiro de doze passos executado sobre a versão 1.33.1 | 🟢 |
| RF-28 | Os nomes de classe da versão 1.33.1 continuam alcançando os elementos equivalentes do quadro, por camada de compatibilidade | Must | Uma folha de estilo escrita contra a interface da versão 1.33.1 continua sendo aplicada, sem edição, na versão desta feature | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | O pacote da interface não ultrapassa 900 KB de código e 400 KB de folha de estilo, já minificados | A linha de base medida em 2026-08-03 é de 179 KB de código e 11 KB de folha; cada conjunto de tema do sistema adotado ocupa cerca de 118 KB, e dois conjuntos mais os de alto contraste explicam a folga pedida. O limite existe para que o crescimento seja decisão, não descoberta | 🟢 |
| Desempenho | O quadro pinta a primeira tela em até um segundo numa máquina de desenvolvimento corrente, para um quadro de cem cartões | O Webview carrega de disco local, sem rede; acima disso a percepção é de travamento | 🟡 |
| Desempenho | Alternar tema, ocultação, colapso ou modo de visualização não recarrega o painel | Requisito herdado da feature `001`, que o resolveu por troca de atributo na raiz | 🟢 |
| Segurança | A superfície de sanitização não cresce, e a política de segurança de conteúdo do documento não é afrouxada para acomodar o sistema de design | `_reversa_sdd/architecture.md#9.4` e cartão `[7]` do quadro do projeto | 🟢 |
| Segurança | Toda dependência nova entra com versão exata, e o arquivo de trava é versionado junto | Sem isso a adoção repete a dívida do ADR-003, que é justamente a ausência de versão registrada | 🟢 |
| Manutenibilidade | O domínio de exibição, os adaptadores e a ponte de mensagens permanecem livres de qualquer referência ao sistema de design | A feature `001` separou domínio de apresentação; acoplar o domínio à biblioteca de interface anularia a separação e prenderia a lógica a uma escolha de aparência | 🟢 |
| Manutenibilidade | Existe um ponto único de mapeamento entre estado de preferência de tema e conjunto nomeado do sistema | Trocar o conjunto de tema deve ser edição de uma tabela, não caça a valores espalhados | 🟢 |
| Acessibilidade | O contraste entre texto e fundo satisfaz a razão de 4,5 para 1 em texto corrido e 3 para 1 em texto grande, nos temas claro e escuro | Critério objetivo e verificável por ferramenta; hoje o projeto não tem nenhum critério declarado | 🟢 |
| Observabilidade | Falha ao carregar o pacote da interface produz mensagem nomeada e visível, e não tela em branco | `_reversa_sdd/architecture.md#9.3`: o sistema falha em silêncio em mais de um caminho | 🟡 |
| Compatibilidade | A suíte de testes existente permanece verde sem alteração de asserção | É o único instrumento que hoje prova que o comportamento não regrediu | 🟢 |

### Escopo negativo

O que esta feature explicitamente **não** faz:

- Não altera o formato do arquivo do quadro nem o esquema de cartão.
- Não muda o conjunto de colunas nem a semântica de movimentação entre elas.
- Não acrescenta funcionalidade de quadro: nenhum campo novo de cartão, nenhuma coluna nova,
  nenhuma ação nova. O que existe passa a ser renderizado de outro modo.
- Não resolve os cartões de segurança pendentes do quadro do projeto que independem desta camada,
  entre eles a execução de script do workspace sem confirmação e a raiz de recursos que hoje inclui
  o diretório do usuário.
- Não decide o destino da integração com serviço externo de cronometragem.
- Não reescreve a extensão fora do Webview: `src/extension.ts`, `src/boards.ts` e `src/workspaces.ts`
  só mudam no estritamente necessário para servir a folha de estilo e declarar a política de
  segurança de conteúdo.
- Não reconstrói o cartão nem a coluna sobre as primitivas de superfície e caixa do sistema adotado.
  Ambos permanecem composição do projeto, sujeitos apenas à restrição de RN-07.
- Não empacota arquivo de fonte: a tipografia é resolvida pela pilha de fontes do sistema operacional.

### Herança da feature `001`

A feature `001` foi pausada com quarenta e seis das cinquenta ações concluídas. Das quatro abertas,
esta feature absorve duas e antecipa uma, conforme decidido em 2026-08-03:

| Ação da `001` | Destino |
|---------------|---------|
| `T001`, capturar a referência de comportamento da versão 1.33.1 | **Executada antes de qualquer alteração desta feature.** A captura só tem valor sobre uma base ainda não modificada, e é pré-requisito da comparação. Vira RF-27 |
| `T043`, comparar a sequência de eventos com a referência | Absorvida. Passa a ser o critério de aceite de RF-04, executado uma vez, sobre a interface definitiva |
| `T048`, README com a interface nova e capturas de tela | Absorvida por RF-12. Capturas feitas uma vez só, já com o sistema de design adotado |
| `T050`, roteiro final de critérios de pronto | Absorvido. Passa a ser o critério de encerramento desta feature |

A feature `001` permanece registrada em `paused-features` e não será retomada isoladamente: ao final
desta, suas quatro ações estarão cumpridas aqui.

## 7. Critérios de Aceitação

```gherkin
Cenário: A aparência do quadro passa a vir do sistema de design
  Dado um quadro aberto com cartões nas quatro colunas
  Quando eu inspeciono a folha de estilo aplicada aos botões da barra superior
  Então nenhuma cor, raio de borda ou tamanho de fonte é valor literal escrito pelo projeto
  E toda propriedade visual resolve para uma variável do sistema de design adotado

Cenário: O comportamento do quadro não regride
  Dado o roteiro de doze passos da feature anterior e a referência de eventos por ele capturada
  Quando eu executo o mesmo roteiro sobre a interface nova
  Então a sequência de eventos recebida pelo script do usuário é idêntica à da referência
  E o arquivo do quadro ao final é idêntico ao da referência

Cenário: Os estados de tema sobrevivem à troca de sistema
  Dado o quadro em "seguir o editor" e o editor em tema claro
  Quando eu aciono o controle de tema tantas vezes quantos forem os estados oferecidos
  Então o quadro passa por claro fixo, escuro fixo e alto contraste, e volta a "seguir o editor"
  E nenhum estado é repetido nem pulado no percurso
  E em cada estado o conjunto de cores aplicado é um conjunto nomeado do sistema adotado

Cenário: O tema fixo resiste à troca de tema do editor
  Dado o quadro em tema claro fixo
  Quando eu troco o tema do editor para escuro
  Então o quadro permanece claro
  E nenhuma gravação do arquivo do quadro ocorre

Cenário: O tipo do cartão é legível sem cor
  Dado um quadro com um cartão de emergência, um de defeito e um comum na mesma coluna
  Quando eu observo a tela convertida para escala de cinza
  Então os três continuam distinguíveis entre si

Cenário: O quadro inteiro é operável por teclado
  Dado o quadro aberto e o foco no primeiro elemento interativo
  Quando eu percorro a interface usando apenas a tecla de tabulação e as teclas de ativação
  Então todo controle recebe foco visível ao ser alcançado
  E abrir e fechar uma caixa de diálogo devolve o foco ao controle que a abriu

Cenário: A folha de estilo do usuário continua valendo
  Dado um arquivo '.vscode/vscode-kanban.css' escrito contra as âncoras de estilo declaradas
  Quando eu atualizo a extensão para a versão desta feature
  Então as regras dessa folha continuam sendo aplicadas ao quadro

Cenário: A folha escrita contra a interface antiga continua valendo
  Dado um arquivo '.vscode/vscode-kanban.css' escrito contra os nomes de classe da versão 1.33.1
  Quando eu atualizo a extensão para a versão desta feature
  Então as regras dessa folha continuam sendo aplicadas, sem que eu edite uma linha

Cenário: Cartão e coluna não redeclaram valor visual
  Dado o quadro renderizado com a folha do sistema de design removida
  Quando eu observo os cartões e as colunas
  Então nenhum deles apresenta cor, raio ou sombra próprios
  E isso prova que todo valor visual vinha do sistema adotado

Cenário: Ícones e tipografia vêm do sistema adotado
  Dado o quadro aberto com o computador desconectado da rede
  Quando eu observo os ícones da barra superior e das ações de cartão
  Então todos são renderizados a partir do conjunto empacotado com a extensão
  E nenhum arquivo de fonte é transferido, pois a tipografia resolve pela pilha do sistema operacional

Cenário: A referência de comportamento existe antes da primeira alteração
  Dado o projeto na versão 1.33.1, sem nenhuma alteração desta feature aplicada
  Quando eu executo o roteiro de doze passos com o registrador de eventos ativo
  Então o registro de eventos e o arquivo de quadro resultantes ficam guardados na pasta de referência
  E servem de base de comparação para todos os critérios de preservação de comportamento

Cenário: O alvo de compilação acompanha o piso declarado
  Dado o piso de versão do editor declarado em 'engines.vscode'
  Quando eu comparo esse piso com o alvo de compilação do empacotador
  Então os dois correspondem ao mesmo motor de renderização
  E o seletor relacional e as consultas de contêiner surtem efeito na versão do piso

Cenário negativo: A interface não busca nada na rede
  Dado o computador desconectado da rede
  Quando eu abro o quadro
  Então o quadro renderiza integralmente, com tipografia, ícones e cores corretos
  E o registro de requisições do Webview não acusa nenhuma requisição a domínio externo

Cenário negativo: Conteúdo malicioso no cartão não executa
  Dado um cartão cuja descrição contenha marcação de script
  Quando eu abro os detalhes desse cartão
  Então o script não é executado
  E o conteúdo é exibido como texto

Cenário negativo: Editor abaixo do piso declarado
  Dado um editor em versão anterior ao piso declarado em 'engines.vscode'
  Quando eu tento instalar a extensão
  Então a instalação é recusada pelo próprio editor com a mensagem de incompatibilidade
  E nenhum quadro é aberto com renderização degradada em silêncio

Cenário negativo: O pacote da interface falha ao carregar
  Dado um pacote de interface ausente ou corrompido
  Quando eu abro o quadro
  Então uma mensagem nomeada de falha é exibida no painel
  E o painel não permanece em branco sem explicação

Cenário: O protocolo de mensagens permanece o mesmo
  Dado o quadro aberto com o registro de mensagens do Webview ativo
  Quando eu crio, edito, movo e excluo um cartão
  Então cada mensagem trocada com a extensão tem nome e formato idênticos aos declarados
    em 'interfaces/webview-bridge.md' da feature anterior

Cenário: Quadro de versão anterior abre sem migração
  Dado um arquivo de quadro produzido pela versão 1.33.1, com cartões contendo
    'id', 'tag', 'references' e campos de cronometragem
  Quando eu abro esse quadro e o fecho sem editar nada
  Então nenhum campo é perdido, acrescentado ou reordenado no arquivo

Cenário: Escolha de conjunto de alto contraste
  Dado o quadro aberto e o controle de tema disponível
  Quando eu escolho a variante de alto contraste
  Então a aparência do quadro muda sem que o painel recarregue
  E a preferência sobrevive a fechar e reabrir o quadro

Cenário: A atualização avisa antes de quebrar
  Dado que a superfície de estilo mudou nesta versão
  Quando eu leio o 'CHANGELOG.md' da versão
  Então encontro a nota de alteração incompatível
  E o 'README.md' traz a seção de migração com o mapa entre a superfície antiga e a nova

Cenário: Elementos interativos se anunciam a tecnologias assistivas
  Dado o quadro aberto sob um leitor de tela
  Quando eu percorro os controles da barra superior e as ações de um cartão
  Então cada um anuncia nome não vazio
  E os controles de estado anunciam o estado corrente

Cenário: Mover cartão pelo ponteiro e pelo teclado dá o mesmo resultado
  Dado um cartão na coluna 'todo'
  Quando eu o movo para 'in progress' arrastando com o ponteiro
  E desfaço a alteração e repito o movimento usando apenas o teclado
  Então o arquivo do quadro resultante é idêntico nos dois caminhos

Cenário: Conteúdo rico do cartão acompanha o tema
  Dado um cartão cuja descrição contenha texto em Markdown, um diagrama e um bloco de código
  Quando eu abro os detalhes desse cartão e alterno o tema do quadro
  Então os três são renderizados
  E a aparência dos três acompanha o tema sem que o painel recarregue

Cenário: A política de segurança de conteúdo não é afrouxada
  Dado o documento do Webview gerado pela extensão
  Quando eu leio a política de segurança de conteúdo declarada nele
  Então nenhuma origem externa é admitida para script, folha de estilo ou fonte
  E a execução de script segue restrita ao pacote da própria extensão

Cenário: Os dois modos de visualização são equivalentes
  Dado um quadro com filtro ativo e ocultação de concluídos ligada
  Quando eu alterno entre o modo de colunas e o modo de lista
  Então o conjunto de cartões exibido é o mesmo nos dois modos
  E editar, mover, excluir, abrir detalhes e rastrear tempo estão acessíveis nos dois

Cenário: As bibliotecas absorvidas saem do projeto
  Dado o conjunto de bibliotecas copiadas para dentro do projeto sem número de versão
  Quando eu inspeciono o projeto após esta feature
  Então nenhuma delas permanece para função que o sistema de design adotado já cumpre
  E cada uma que permanece está declarada com número de versão

Cenário: Nenhum arquivo de interface passa de quatrocentas linhas
  Dado o conjunto de arquivos sob 'src/webview/'
  Quando eu conto as linhas de cada um
  Então nenhum ultrapassa quatrocentas linhas

Cenário: Quadro vazio
  Dado um quadro sem nenhum cartão em nenhuma das quatro colunas
  Quando eu o abro
  Então as quatro colunas são exibidas com contagem zero
  E os controles da barra superior permanecem acionáveis

Cenário negativo: Cartão sem título e sem descrição
  Dado um cartão cujo título e cuja descrição estejam vazios
  Quando eu o exibo no quadro
  Então o cartão é renderizado com sua identificação e permanece selecionável
  E nenhuma área da interface fica em branco sem indicação do que é
```

### Rastreio entre requisito e cenário

| Requisito | Cenário que o verifica |
|-----------|------------------------|
| RF-01 | A aparência do quadro passa a vir do sistema de design |
| RF-02 | O comportamento do quadro não regride |
| RF-03 | O protocolo de mensagens permanece o mesmo |
| RF-04 | O comportamento do quadro não regride |
| RF-05 | O comportamento do quadro não regride; O tema fixo resiste à troca de tema do editor |
| RF-06 | Quadro de versão anterior abre sem migração |
| RF-07 | Os estados de tema sobrevivem à troca de sistema; O tema fixo resiste à troca de tema do editor |
| RF-08 | A aparência do quadro passa a vir do sistema de design; Os estados de tema sobrevivem à troca de sistema |
| RF-09 | Escolha de conjunto de alto contraste |
| RF-10 | O tipo do cartão é legível sem cor |
| RF-11 | A folha de estilo do usuário continua valendo |
| RF-12 | A atualização avisa antes de quebrar |
| RF-13 | O quadro inteiro é operável por teclado |
| RF-14 | Elementos interativos se anunciam a tecnologias assistivas |
| RF-15 | Mover cartão pelo ponteiro e pelo teclado dá o mesmo resultado |
| RF-16 | Conteúdo rico do cartão acompanha o tema |
| RF-17 | Conteúdo malicioso no cartão não executa |
| RF-18 | A interface não busca nada na rede |
| RF-19 | A política de segurança de conteúdo não é afrouxada |
| RF-20 | Os dois modos de visualização são equivalentes |
| RF-21 | Editor abaixo do piso declarado |
| RF-22 | As bibliotecas absorvidas saem do projeto |
| RF-23 | Nenhum arquivo de interface passa de quatrocentas linhas |
| RF-24 | Cartão e coluna não redeclaram valor visual |
| RF-25 | Ícones e tipografia vêm do sistema adotado |
| RF-26 | Ícones e tipografia vêm do sistema adotado |
| RF-27 | A referência de comportamento existe antes da primeira alteração |
| RF-28 | A folha escrita contra a interface antiga continua valendo |
| RF-21 (alvo de compilação) | O alvo de compilação acompanha o piso declarado |
| RNF de observabilidade | O pacote da interface falha ao carregar |
| Estados vazios e iniciais | Quadro vazio; Cartão sem título e sem descrição |

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 adoção do sistema de design nos controles | Must | É a feature. Sem ela, nada mais aqui tem razão de ser |
| RF-02, RF-03, RF-04, RF-05 e RF-06, preservação de comportamento, protocolo, eventos, arquivo e compatibilidade | Must | O arquivo do quadro é versionado e compartilhado entre pessoas, e os scripts de evento são código de terceiros. Regressão silenciosa aqui destrói trabalho alheio, e é o risco número um de qualquer feature de aparência |
| RF-07, RF-08 preservação dos três estados de tema sobre os conjuntos do sistema | Must | A feature `001` foi entregue com esse contrato ao usuário; quebrá-lo numa troca de biblioteca seria regressão de funcionalidade disfarçada de refatoração |
| RF-10 distinção de tipo sem depender de cor | Must | O tipo do cartão governa a ordenação e a leitura de urgência. Depender só de matiz exclui parte real dos usuários, e o custo de corrigir agora é uma fração do de corrigir depois |
| RF-11, RF-12 âncoras estáveis e aviso de migração | Must | Sem elas a feature repete, agravado, o defeito já registrado no cartão `[35]`: quebrar a customização do usuário sem avisar. O aviso é barato; o silêncio é que custa caro |
| RF-13, RF-14 operação por teclado e nome acessível | Must | É o principal ganho que justifica adotar um sistema de design maduro em vez de continuar autoral. Deixar de fora seria pagar o custo da adoção sem receber o benefício |
| RF-16, RF-17 renderização de conteúdo e barreira de sanitização | Must | Markdown, diagramas e código são o conteúdo do cartão, não enfeite; e piorar a segurança numa feature de estética é inaceitável |
| RF-18, RF-19 ausência de rede e política de conteúdo declarada | Must | O Webview roda offline por contrato desde 2018. A adoção de um sistema de design de origem externa é exatamente o momento em que essa garantia corre risco de ser perdida por descuido |
| RF-20 paridade entre os dois modos de visualização | Must | Contrato já entregue pela feature `001` |
| RF-21 piso de versão declarado | Must | O sistema de design emprega recursos de folha de estilo que motores antigos não interpretam. Sem piso declarado, o quadro degrada em silêncio na máquina de quem não sabe por quê |
| RF-09 conjunto de alto contraste | Should | Ganho real e de custo quase nulo, já que os conjuntos vêm prontos, mas não é condição de uso |
| RF-15 caminho de teclado equivalente ao arrastar | Should | Arrastar e soltar é o gesto central do quadro e hoje não tem equivalente por teclado. Corrigir é ganho substancial, porém é funcionalidade nova, e não preservação |
| RF-22 remoção das bibliotecas vendorizadas absorvidas | Should | Colhe a dívida do ADR-003 na hora certa, mas pode ser feita em passo seguinte sem prejudicar a entrega |
| RF-23 limite de quatrocentas linhas por arquivo | Should | Disciplina de manutenção declarada, verificável e barata; não bloqueia a entrega |
| RF-24 cartão e coluna sem valor visual próprio | Must | É o que impede a adoção de virar meia adoção: um cartão com cor própria reintroduz, no elemento mais visto do quadro, exatamente a dívida que a feature vem eliminar |
| RF-25, RF-26 ícones e tipografia do sistema adotado | Must | Ícone desenhado à mão e escala tipográfica autoral são a mesma dívida da paleta. Adotar cor e deixar ícone e texto de fora entrega um terço do benefício pelo custo inteiro |
| RF-27 referência de comportamento capturada antes da primeira alteração | Must | É pré-condição temporal, não esforço: depois da primeira alteração, a referência da versão 1.33.1 deixa de ser obtenível, e todos os critérios de preservação de comportamento ficam sem base de comparação |
| RF-28 compatibilidade com os nomes de classe da versão 1.33.1 | Must | Decisão de 2026-08-03: preservar quem escreveu folha própria contra a interface antiga, em vez de quebrá-la duas vezes seguidas, na `001` e de novo aqui |
| RNF de desempenho do pacote | Should | Limite existe para tornar o crescimento visível, não para travar a adoção |
| RNF de observabilidade da falha de carregamento | Could | Melhora real de diagnóstico, sem impedir o uso normal |

## 9. Esclarecimentos

### Sessão 2026-08-03

- **Q:** O sistema de design emprega, em alguns componentes, recursos de folha de estilo que só
  existem em motores de renderização a partir de 2022, e o projeto declara suporte a partir de
  outubro de 2021. O projeto eleva o piso de versão do editor ou o mantém e absorve a degradação?
  **R:** Elevar o piso para a primeira versão cujo motor interpreta o seletor relacional e as
  consultas de contêiner. A estimativa é VS Code 1.78, de abril de 2023, com o número exato apurado
  no plano. O alvo de compilação do empacotador sobe junto.
  *Apuração que sustentou a pergunta:* os seis usos do seletor relacional no pacote publicado são
  cosméticos — preenchimento de botão com atalho de teclado, separador ao lado do item selecionado,
  arredondamento quando o último filho está vazio — e as consultas de contêiner aparecem em quatro
  componentes de layout responsivo, um deles já protegido por consulta de suporte. Manter o piso era
  viável; a escolha por elevá-lo é de acabamento íntegro e simplicidade de manutenção, não de
  necessidade técnica. Registra-se o risco remanescente a verificar no plano: interface de programação
  de JavaScript ausente no motor antigo, que o empacotador não supre, falharia de forma dura e não
  cosmética. Elevar o piso remove também esse risco. (RN-05, RF-21)

- **Q:** O sistema adotado oferece controles, mas não oferece quadro kanban. A adoção cobre apenas os
  controles, ou cartão e coluna também são construídos a partir das primitivas do sistema?
  **R:** Apenas os controles. O cartão, a coluna e a área de arrastar permanecem composição do
  projeto, com a restrição de não declararem nenhum valor visual próprio. (RN-01, RN-07, RF-01, RF-24)

- **Q:** A folha de estilo do usuário ganha um contrato de âncoras estáveis, deixa de ser suportada,
  ou ganha âncoras mais compatibilidade com os nomes da versão 1.33.1?
  **R:** Âncoras estáveis mais camada de compatibilidade com os nomes da versão 1.33.1. Folhas
  escritas contra a interface antiga continuam valendo sem edição. (RN-04, RF-11, RF-12, RF-28)

- **Q:** As quatro ações abertas da feature `001` ficam nela, migram para esta, ou se dividem?
  **R:** Divisão. `T001` é executada agora, antes de qualquer alteração, porque a referência da versão
  1.33.1 só é obtenível sobre base não modificada; `T043`, `T048` e `T050` são absorvidas por esta
  feature e cumpridas uma única vez, sobre a interface definitiva. (RF-04, RF-12, RF-27)

- **Q:** O quadro adota os ícones e a tipografia do sistema de design, ou mantém os autorais?
  **R:** Adota ambos. Os ícones vão empacotados com a extensão e a tipografia resolve pela pilha de
  fontes do sistema operacional, sem arquivo de fonte a transferir, o que preserva a garantia de
  ausência de rede. (RN-01, RN-06, RF-25, RF-26)

### Sessão 2026-08-03, auditoria cruzada

Duas decisões tomadas depois de `/reversa-audit` apontar que os dois contratos de `interfaces/` não
se encaixavam. O relatório está em `audit/cross-check.md`, achados A001 e A002.

- **Q:** As âncoras que a camada de compatibilidade precisa alcançar — barra superior, diálogos,
  progresso e vínculos do cartão — entram no contrato de âncoras estáveis, ou o mapa da versão
  1.33.1 encolhe para o que o contrato já alcança?
  **R:** Entram, num nível próprio: **âncoras de compatibilidade**, declaradas em
  `interfaces/style-anchors.md` §5, cuja vida útil é a da camada da versão 1.33.1. Enquanto ela
  existir, a promessa é a mesma das âncoras permanentes; quando for removida, elas saem junto, na
  mesma elevação de versão maior. A razão de não as tornar permanentes: vários desses destinos são
  detalhe interno de componente, e prometer estabilidade eterna sobre a barra de progresso do cartão
  congelaria o que a feature seguinte tem direito de mudar. (RN-04, RF-11, RF-28)

- **Q:** O que fazer com `#vsckb-card-filter-modal`, que o mapa da versão 1.33.1 apontava para um
  diálogo de filtro?
  **R:** Passa para a lista de não mapeados. Não há diálogo de filtro desde a feature `001`: o filtro
  é campo da barra superior, e criar um só para receber o nome antigo seria funcionalidade nova,
  vedada pelo escopo negativo. O controle continua alcançável por `[data-vsckb="action-filter"]`.
  (RF-28)

## 10. Lacunas

> Nenhuma lacuna aberta. As três dúvidas do documento inicial foram resolvidas na sessão de
> esclarecimentos de 2026-08-03, e uma delas, a do piso de versão, deixou como resíduo uma
> **verificação** para o plano, não uma decisão: apurar o número exato da versão do editor e conferir
> se alguma interface de programação de JavaScript exigida pelo sistema de design falta no motor
> correspondente.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-03 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-08-03 | RF-07 e seu cenário reconciliados por `/reversa-plan`: o ciclo do controle de tema deixa de fixar três acionamentos, porque o alto contraste de RF-09 acrescenta um quarto estado. Registrado em `data-delta.md` §3.1 | reversa |
| 2026-08-03 | Cinco dúvidas resolvidas por `/reversa-clarify`. Acrescentados RN-07 e RF-24 a RF-28; RN-01, RN-04, RN-05, RN-06, RF-21 e o escopo negativo reescritos; acrescentada a subseção de herança da feature `001` | reversa |
| 2026-08-03 | Duas decisões registradas após `/reversa-audit` (A001 e A002): as âncoras de compatibilidade ganham nível próprio no contrato, e o modal de filtro sai do mapa da versão 1.33.1. RN-04 estreitado para distinguir os dois níveis de promessa | iago |

## Pendências de Qualidade

Registradas após a auto-validação contra `.reversa/templates/quality-template.md`, por não serem
resolvíveis sem contrariar a intenção do documento:

- **Q-018 (SoluçãoImplícita), reprovado por decisão consciente.** O item exige que nenhum nome de
  biblioteca ou produto comercial apareça no documento. O sistema de design foi nomeado pelo dono do
  produto como restrição de entrada, não escolhido como solução para um problema aqui levantado.
  A nomeação está confinada à seção 2, sob rótulo explícito de restrição, e nenhum requisito
  funcional depende dela para ser lido ou verificado. Registrar em vez de esconder, conforme Q-020.

- **Q-014 (EdgeCases), parcialmente atendido.** Concorrência, retentativa e tempo limite não se
  aplicam a esta feature: o Webview é local, sem rede em tempo de execução (RF-18) e sem operação
  assíncrona nova. A gravação concorrente do arquivo do quadro é comportamento herdado e explicitamente
  fora de escopo, tratado como cartão próprio no quadro do projeto.
