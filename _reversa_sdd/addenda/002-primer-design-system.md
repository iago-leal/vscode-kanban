# Adendo: quadro sobre sistema de design mantido externamente

> Identificador da feature: `002-primer-design-system`
> Data: `2026-08-03`
> Cenário: `legado`
> Origem: `_reversa_forward/002-primer-design-system/`

Este adendo anota o que mudou no sistema depois da extração, para que quem leia
`_reversa_sdd/` — pessoa ou agente — não tome por corrente uma descrição já defasada. Ele não
corrige os artefatos da extração: aponta para eles e diz como devem ser lidos agora.

## Vigência

Vigente desde 2026-08-03.

## Resumo da entrega

A feature substitui o vocabulário visual autoral do quadro — a folha de variáveis de cor, as regras
de aparência e os ícones desenhados à mão que a feature `001` produziu — por um sistema de design
mantido por terceiro, do qual o projeto passa a ser apenas consumidor. O ganho perseguido é de custo
de manutenção, não de estética: paleta, tipografia, espaçamento, estados de foco e variantes
acessíveis passam a chegar por atualização de dependência. Comportamento do quadro, formato do
arquivo e contrato com os scripts do usuário permanecem intocados.

**Entrega parcial.** Das 69 ações de `actions.md`, **5 estão concluídas** e 64 seguem abertas, duas
delas bloqueadas por decisão pendente. O que já é fato no repositório é a preparação: piso do editor
elevado, alvo do empacotador ajustado, dependências de aparência instaladas em versão exata e o
ponto único de mapeamento entre tema e conjunto nomeado criado. **Nenhum componente de interface foi
migrado**, e a origem das cores continua sendo a folha autoral `theme/tokens.css`. Uma reexecução
deste sincronizador complementará o adendo quando as fases seguintes fecharem.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/architecture.md` | `#8` — Qualidades do sistema | delta-de-contrato-externo | O piso do editor subiu de `^1.62.0` para `^1.78.0` e o alvo do empacotador, de `chrome91` para `chrome108`: leia a compatibilidade de instalação descrita ali como restrita a editores 1.78 ou posteriores |
| `_reversa_sdd/architecture.md` | `#4` — Componentes e responsabilidades | componente-novo | Ao sucessor de `board-ui` acrescentou-se `src/webview/theme/primer-themes.ts`, único lugar que conhece os nomes dos conjuntos de cor do sistema adotado e o único que importa folhas de tema. Nasce isolado: nenhum módulo o consome até a Fase 3 |
| `_reversa_sdd/architecture.md` | `#9.2` — Dívidas de dependências | delta-de-contrato-externo | Três dependências de aparência entraram com versão **exata**, e `react-is` foi fixado na linha do React instalado. A dívida D7, das bibliotecas vendorizadas sem versão declarada, **continua intacta**: quem a colhe é uma ação ainda aberta |
| `_reversa_sdd/architecture.md` | `#9.2`, dívida D8 | regra-nova | A dívida do pacote `vscode` deprecado, colhida antes desta feature, deixou um efeito não previsto: o commit da versão 1.33.1 não compila, o que torna a referência de comportamento daquela versão inobtenível. Ver `legacy-impact.md` §2 da feature |
| `_reversa_sdd/domain.md` | `#3` — Regras de domínio | — (sem impacto) | Nenhuma das 48 regras foi alterada. A rodada não abriu nenhum arquivo de domínio, adaptador, ponte ou persistência, e os 137 testes de caracterização passam sem alteração de asserção |

Contagem por tipo: **3** `delta-de-contrato-externo`, **1** `componente-novo`, **1** `regra-nova`.
Nenhum `regra-alterada`, `regra-removida`, `componente-extinto` ou `delta-de-dados`.

## Regras sob vigilância

`W001`, `W002`, `W003`, `W004`.

Conteúdo e critério de violação de cada um em
`_reversa_forward/002-primer-design-system/regression-watch.md`, que traz também quatro observações
sem peso de regressão — entre elas o teto de folha do requisito de desempenho, hoje ocupado em 390
KB de 400 KB apenas pelos conjuntos de tema.

## Fontes

- `_reversa_forward/002-primer-design-system/legacy-impact.md`
- `_reversa_forward/002-primer-design-system/regression-watch.md`
- `_reversa_forward/002-primer-design-system/requirements.md`
- `_reversa_forward/002-primer-design-system/actions.md`
- `_reversa_forward/002-primer-design-system/progress.jsonl`

---

## Atualização 2026-08-03 — segunda rodada de `/reversa-coding`

Sincronização parcial de novo: **16 das 69 ações** estão concluídas, contra as 5 registradas acima.
Entraram a Fase 2 inteira salvo `T013`, mais `T015` e `T016` da Fase 3. Uma terceira execução deste
sincronizador complementará o adendo quando as fases seguintes fecharem.

**O que a seção anterior afirmava continua verdadeiro**, e vale repetir porque é o que mais engana
quem lê a extração de longe: nenhum componente de interface foi migrado, a origem das cores continua
sendo a folha autoral `theme/tokens.css`, e o sistema de design adotado **ainda não é consumido por
módulo algum** — o pacote construído não carrega uma linha dele. O que esta rodada acrescentou foi a
rede de verificação da feature e o único delta de modelo que ela prevê.

### Advertência sobre a base de comparação

Quase todo o delta abaixo incide sobre território que a extração **não descreve**. `_reversa_sdd/`
retrata a versão 1.33.1, cujo Webview não tinha tema, nem estado de exibição, nem `src/webview/`:
tudo isso nasceu na feature `001`, que segue **pausada e nunca convergida** — não há adendo dela em
`addenda/`. Os apontadores desta tabela levam, portanto, à seção mais próxima do assunto, e a coluna
`Delta` diz o que falta ali. Quem precisar do quadro completo tem de ler `001` e `002` em sequência.

### Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/data-dictionary.md` | `#14` — Estado global do VS Code | delta-de-dados | A tabela lista duas chaves. Há uma terceira desde a feature `001`, `vsckb.viewPreferences.theme`, válida para a instalação inteira; esta feature ampliou o conjunto de valores que ela aceita de três para quatro, acrescentando o alto contraste. Nada muda no arquivo do quadro |
| `_reversa_sdd/data-dictionary.md` | `#11` — Protocolo de mensagens do Webview | delta-de-contrato-externo | Os comandos `saveViewPreferences` e `setViewPreferences`, ausentes do catálogo porque nasceram na `001`, continuam com nome e forma idênticos. Só o conjunto de valores do campo `theme` cresceu. Os dezesseis comandos que a extração cataloga permanecem intactos |
| `_reversa_sdd/architecture.md` | `#9.1` — Dívidas estruturais | regra-nova | Acrescente-se à lista uma dívida que a extração não tinha como ver: o mesmo contrato declarado **duas vezes**, em unidades de compilação que não podem se importar (`src/webview/domain/types.ts` e `src/view-preferences.ts`), com o lado da extensão validando o valor recebido antes de gravar. Divergência entre as duas produz descarte silencioso, não erro. É a mesma mecânica de D1 e do cartão `[12]` do quadro, sobre outro par de arquivos |
| `_reversa_sdd/architecture.md` | `#9.4` — Dívidas de segurança, C4 · `permissions.md` §5 | regra-nova | C4, sanitização insuficiente de Markdown, **continua aberta**: a barreira não melhorou. O que passou a existir é trava automática contra encolhimento dela — a superfície vigente está transcrita em teste, e removê-la exige redeclará-la de propósito |
| `_reversa_sdd/architecture.md` | `#4` — Componentes e responsabilidades | componente-novo | Ao sucessor de `board-ui` acrescentou-se uma rede de cinco fronteiras verificadas por teste: limite de quatrocentas linhas por arquivo, ausência de valor visual literal, ausência do sistema de design nas camadas internas, ausência de fonte no pacote e não encolhimento da sanitização. A suíte foi de 137 para 173 testes |
| `_reversa_sdd/domain.md` | `#3.1` e `#3.2` — Estrutura do quadro e cartões | — (sem impacto) | Nenhuma das 48 regras foi alterada. Elas ganharam verificação que não tinham: um quadro vazio, ou que chegue sem coluna alguma, ainda apresenta as quatro colunas contando zero; um cartão sem título e sem descrição permanece visível, endereçável e sem ganhar campo que não tinha |

Contagem por tipo nesta atualização: **1** `delta-de-dados`, **1** `delta-de-contrato-externo`,
**2** `regra-nova`, **1** `componente-novo`. Nenhum `regra-alterada`, `regra-removida`,
`componente-extinto` ou `delta-de-contrato-externo` sobre o legado da 1.33.1.

### Regras sob vigilância

Acrescentados nesta rodada: `W005`, `W006`, `W007`, `W008`. Com os anteriores, oito ao todo.

Conteúdo e critério de violação de cada um em
`_reversa_forward/002-primer-design-system/regression-watch.md`, que traz também, entre as
observações sem peso de regressão, **o estado esperado da suíte**: 173 testes passando e 2 falhando,
os dois pela mesma folha `theme/board.css`, que a ação `T040` encolhe. Uma re-extração que encontre
essas duas falhas está vendo o previsto; três ou mais, ou falha em outro arquivo, é regressão.

### Fontes

- `_reversa_forward/002-primer-design-system/legacy-impact.md` (regravado, cobre as duas rodadas)
- `_reversa_forward/002-primer-design-system/regression-watch.md`
- `_reversa_forward/002-primer-design-system/actions.md`
- `_reversa_forward/002-primer-design-system/progress.jsonl`
- `_reversa_forward/002-primer-design-system/data-delta.md`

---

## Atualização 2026-08-03 — terceira rodada de `/reversa-coding`

Sincronização parcial pela terceira vez, e a última que ainda precisa desse rótulo: **61 das 69
ações** estão concluídas, contra as 16 registradas acima. As oito abertas são todas de verificação
em editor rodando, com olho humano; nenhuma é de implementação, e nenhuma está travada por decisão
pendente. Estão nomeadas ao final desta seção.

**O que as duas seções anteriores afirmavam deixou de valer no ponto que mais importa.** Elas diziam
que nenhum componente de interface fora migrado e que a origem das cores continuava sendo a folha
autoral. Ambas as coisas caíram nesta rodada: `theme/tokens.css` foi extinto, `theme/board.css`
encolheu de 686 para 382 linhas sem nenhuma declaração que pinte, e todo componente da interface
passou a ser composição sobre controles do sistema adotado. **A origem das cores deixou de ser o
projeto**, e é essa a frase que resume a feature.

A advertência sobre a base de comparação, registrada na segunda rodada, **continua inteiramente
válida** e fica mais pesada agora: a extração retrata a versão 1.33.1, cujo Webview não tinha tema,
nem estado de exibição, nem `src/webview/`. Boa parte do delta abaixo incide sobre território que
`_reversa_sdd/` não descreve, herdado da feature `001`, que segue pausada e sem adendo em
`addenda/`. Os apontadores levam à seção mais próxima do assunto, e a coluna `Delta` diz o que falta
ali.

### Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/architecture.md` | `#4` — Componentes e responsabilidades | componente-extinto | A folha autoral de variáveis de cor não existe mais, e a folha do quadro guarda geometria e nada mais, verificado por teste. Leia qualquer descrição de vocabulário visual próprio como extinta: paleta, tipografia, espaçamento, anel de foco e estado pressionado chegam por atualização de dependência |
| `_reversa_sdd/architecture.md` | `#4` — Componentes e responsabilidades | regra-alterada | Doze arquivos de interface migrados para composição sobre controles do sistema, mais `IconButton.tsx`, que saiu de dentro de `Card.tsx` ao deixar de ter um só consumidor. O componente que a extração descreve como "o arquivo é o sistema inteiro", com 2.161 linhas, já não existia nessa forma desde a feature `001`; agora nem o vocabulário visual do sucessor é do projeto |
| `_reversa_sdd/architecture.md` | `#4` — Componentes e responsabilidades | componente-novo | A camada de compatibilidade com a 1.33.1: `src/webview/ui/anchors.ts`, o módulo gerado `theme/legacy-compat.ts` e o gerador `scripts/generate-legacy-compat.js`. Trinta e nove nomes de classe e identificador da 1.33.1 voltam para os elementos. O contrato mudou de veículo, não de promessa: `interfaces/legacy-class-map.md` §2 mandava cumprir isso com folha CSS, e nenhuma folha o faz, porque CSS não tem aliasing de seletor |
| `_reversa_sdd/architecture.md` | `#9.2` — Dívidas de dependências, D7 | regra-nova | **Corrige o que a primeira rodada registrou.** Ali se leu que D7 continuava intacta; ela foi colhida. `src/res/VENDORED.md` declara Mermaid 7.0.0, CodeMirror 5.39.0, Moment 2.22.1, highlight.js 9.12.0 e Showdown 1.8.6 com a impressão digital de cada arquivo. Filtrex não declara versão em lugar nenhum do artefato distribuído, e por isso responde apenas pelo SHA-256 |
| `_reversa_sdd/architecture.md` | `#9.4` — Dívidas de segurança · `permissions.md` `#5` — Fronteiras de confiança | regra-nova | O documento servido passou a declarar o que pode carregar: `default-src 'none'`, origem própria para folha, fonte e imagem, `connect-src 'none'` e script só com o valor de uso único. Duas leituras importam. `'unsafe-eval'` fica declarado e é dívida de `filtrex.js:57`, que compila a expressão do usuário com `new Function`, **não** do sistema de design, que não avalia nada. E C4, a sanitização insuficiente de Markdown, **continua aberta**: a barreira não melhorou, apenas ficou impedida de encolher |
| `_reversa_sdd/architecture.md` | `#8` — Qualidades do sistema | regra-nova | O empacotador virou parte da entrega. Duas podas de folha em `scripts/theme-tokens.js` sustentam o requisito de desempenho: os conjuntos de cor podados aos tokens que a interface nomeia, com fecho transitivo, e as folhas dos componentes que não embarcam servidas vazias, porque o empacotador não remove a folha de um componente que a poda de código já descartou. Sem as duas, 439 KB contra teto de 400; com elas, 131 KB. O código foi para 756 KB de um teto de 900 |
| `_reversa_sdd/architecture.md` | `#5.1` — Abertura do quadro | regra-nova | O painel em branco deixou de ser desfecho possível: o ponto de montagem carrega, em texto e com diagramação própria, o aviso de que a interface não carregou, substituído pela interface no primeiro render. O documento passou a servir os dois conjuntos de realce de código, claro e escuro, e a folha do usuário continua sendo a última carregada, agora com a razão registrada |
| `_reversa_sdd/data-dictionary.md` | `#13` — Arquivos e caminhos | delta-de-contrato-externo | `.vscode/vscode-kanban.css` continua sendo lido e aplicado por último, mas os nomes contra os quais uma folha antiga foi escrita mudaram. Trinta e nove voltam pela camada de compatibilidade; quatro âncoras declaradas em contrato não alcançam elemento algum, porque os controles correspondentes não existem mais. Nota de quebra no `CHANGELOG.md` e seção de migração no `README.md` |
| `_reversa_sdd/domain.md` | `#3.1` a `#3.8` — Regras de domínio | — (sem impacto) | Nenhuma das 48 regras foi alterada, e nenhuma rodada abriu arquivo de persistência, de adaptador ou de exportação. Três verificações novas fixam isso: um cartão da 1.33.1 com `id`, `tag`, `references` e cronometragem atravessa carga e gravação byte a byte idêntico, e o `__uid` da sessão nunca chega ao arquivo; os dezesseis comandos da ponte continuam com nome e forma idênticos, conferidos nas duas direções; e trinta mudanças de exibição não movem um byte do quadro |
| `_reversa_sdd/domain.md` | `#4` — Comportamentos que revelam intenção | — (sem impacto) | Duas afordâncias mudaram de propósito, sem tocar em regra. Mover um cartão virou menu com os destinos nomeados, no lugar da fileira de ícones: os movimentos oferecidos são os mesmos, quem os decide é o mesmo, e o que se grava é idêntico. E o tipo do cartão passou a ser dito em palavras além da cor, para que dois cartões continuem distinguíveis em escala de cinza. Uma extração que compare capturas de tela com a feature `001` verá diferença aqui, e ela é deliberada |

Contagem por tipo nesta atualização: **4** `regra-nova`, **1** `componente-novo`, **1**
`componente-extinto`, **1** `regra-alterada`, **1** `delta-de-contrato-externo`. Nenhum
`regra-removida` e nenhum `delta-de-dados` — o único delta de modelo da feature, a preferência de
tema de três para quatro valores, já foi registrado na atualização anterior.

**Somando as três rodadas**, o adendo registra 16 impactos: 7 `regra-nova`, 3
`delta-de-contrato-externo`, 3 `componente-novo`, 1 `componente-extinto`, 1 `regra-alterada` e 1
`delta-de-dados`.

### Regras sob vigilância

Acrescentados nesta rodada: `W009` a `W016`. Com os anteriores, dezesseis ao todo.

Conteúdo e critério de violação de cada um em
`_reversa_forward/002-primer-design-system/regression-watch.md`, que traz também, entre as
observações sem peso de regressão, **o estado esperado da suíte, agora mudado**: as duas falhas que
a rodada anterior anunciava como esperadas fecharam, e a suíte está em **216 testes, todos
passando**. Qualquer falha, a partir daqui, é regressão de verdade. Quatro observações da segunda
rodada foram arquivadas por cumprimento, com data e razão registradas em §4 daquele arquivo.

### O que continua devendo

Oito ações abertas, todas de verificação com editor rodando e olho humano: `T001`, `T050`, `T055`,
`T056`, `T061`, `T062`, `T063` e `T067`. Uma delas tem impedimento que não é só de ambiente: a
referência de comportamento da versão 1.33.1 é inexequível pelos dois caminhos que a própria ação
oferece, porque não há etiqueta, o commit correspondente não compila e a versão publicada abre em
branco no editor atual. Enquanto isso não se resolver, **nenhuma re-extração deve tratar a paridade
com a 1.33.1 como verificada**, e com ela ficam sem base de comparação RF-02, RF-04 e RF-27.

Outras onze ações de verificação foram fechadas por teste automatizado, que é verificação mais forte
que a inspeção única prevista no roteiro, porque roda a cada execução da suíte.

### Fontes

- `_reversa_forward/002-primer-design-system/legacy-impact.md` (regravado, cobre as três rodadas)
- `_reversa_forward/002-primer-design-system/regression-watch.md`
- `_reversa_forward/002-primer-design-system/actions.md`
- `_reversa_forward/002-primer-design-system/progress.jsonl`
- `_reversa_forward/002-primer-design-system/interfaces/style-anchors.md`
- `_reversa_forward/002-primer-design-system/interfaces/legacy-class-map.md`
