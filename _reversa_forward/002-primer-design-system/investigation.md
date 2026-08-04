# Investigation: adoção de sistema de design mantido externamente

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Roadmap: `_reversa_forward/002-primer-design-system/roadmap.md`

## 1. Pergunta que motivou a investigação

A escolha do sistema de design foi dada pelo dono do produto e não está sob avaliação. O que este
documento investiga é o que decorre dela: o que a adoção exige do projeto, o que ela custa, o que ela
substitui de fato e onde ela encosta nas restrições que o Webview já tem.

## 2. Apuração das versões e do estado de manutenção

Consulta ao registro público de pacotes em 2026-08-03:

| Pacote | Versão | Última publicação |
|--------|--------|-------------------|
| `@primer/react` | 38.34.0 | 2026-07-31 |
| `@primer/primitives` | 11.10.0 | 2026-07-30 |
| `@primer/octicons-react` | 19.32.0 | 2026-07-29 |

Pares declarados por `@primer/react`: `react`, `react-dom`, `react-is` e os respectivos tipos, em
`18.x || 19.x`. O projeto está em React 18.3.1, dentro da faixa, sem necessidade de subir.

Filtro de longevidade, aplicado como o mantenedor exige antes de aceitar qualquer dependência: última
publicação de três dias atrás nos três pacotes; organização por trás, não indivíduo; cadência semanal
observável no histórico; documentação pública mantida. Passa com folga. O contraste com o que está
sendo substituído é o argumento central da feature: o ADR-003 registra nove bibliotecas vendorizadas
**sem número de versão registrado**, sem caminho de atualização e sem como avaliar exposição a
vulnerabilidades conhecidas.

## 3. A questão do motor de renderização

Foi a única incógnita técnica real do documento de requisitos, e foi resolvida por apuração direta em
vez de estimativa.

**O problema.** O pacote publicado do sistema de design usa, em algumas folhas, o seletor relacional
`:has()` e consultas de contêiner. Ambos exigem Chromium 105 ou superior. O projeto declarava suporte
a partir de VS Code 1.62 e compilava o pacote para Chromium 91.

**Quanto disso é estrutural.** Nada. A inspeção do pacote publicado mostrou seis folhas com o seletor
relacional, todas em uso cosmético: preenchimento de botão que contém indicação de atalho de teclado,
supressão de separador ao lado do item selecionado num controle segmentado, arredondamento de borda
quando o último filho de um grupo está vazio. As consultas de contêiner aparecem em quatro
componentes de layout responsivo, um deles já envolvido em consulta de suporte. Num motor sem esses
recursos, as regras não se aplicam e os componentes seguem funcionais.

**Onde estava o risco de verdade.** No JavaScript, não na folha de estilo. O empacotador transpila
sintaxe mas não implementa interface de programação ausente. A varredura do pacote encontrou duas
fora do alcance do Chromium 91: `Object.hasOwn`, disponível a partir do Chromium 93, usada sem guarda
no componente de diálogo; e `checkVisibility`, disponível a partir do Chromium 105, esta já protegida
por verificação de tipo com caminho alternativo. A primeira quebraria de forma dura.

**A apuração do piso.** O arquivo `.yarnrc` do repositório do editor declara a versão do Electron de
cada release:

| VS Code | Electron | Chromium |
|---------|----------|----------|
| 1.70 | 18.3.5 | — |
| 1.73 a 1.77 | 19.x | 102 |
| **1.78** | **22.3.5** | **108** |

O índice público de releases do Electron confirma o mapeamento: a série 19 corresponde a Chromium
102, e a série 22, a Chromium 108. O salto acontece exatamente entre 1.77 e 1.78, e 108 supera com
folga o 105 exigido. Daí `engines.vscode: ^1.78.0` e alvo de compilação `chrome108`, em D-18.

A estimativa registrada no documento de requisitos, "VS Code 1.78, abril de 2023, a confirmar", foi
confirmada.

## 4. Alternativas avaliadas

### 4.1 Sobre o piso de versão

| Alternativa | Por que foi descartada |
|-------------|------------------------|
| Manter `^1.62.0` e absorver a degradação | Viável, e por pouco. A degradação de folha de estilo é cosmética, mas `Object.hasOwn` no componente de diálogo quebraria de forma dura, e proteger caso a caso significa auditar o pacote a cada atualização de dependência. Trocar manutenção contínua por um piso mais alto é o negócio certo para quem mantém sozinho e de forma intermitente |
| Saltar para a versão mínima sob suporte da Microsoft | Exclui mais instalações sem ganho proporcional. O ganho está em 105; tudo acima disso é custo social sem contrapartida técnica |
| Manter o piso e reescrever localmente as regras afetadas | Reintroduz exatamente a dívida que a feature vem eliminar: folha autoral sobre folha de terceiro, com obrigação de reconciliar a cada versão |

### 4.2 Sobre a extensão da adoção

Descartada a reconstrução de cartão e coluna sobre as primitivas de caixa do sistema, decidida na
sessão de esclarecimentos. A razão técnica que sustenta a decisão do usuário: nenhum sistema de
design de propósito geral oferece quadro kanban, e as primitivas de caixa que ele oferece resolvem
espaçamento e superfície, não a geometria de colunas com pilha rolável e área de soltar. O ganho
seria uniformidade de vocabulário; o custo seria reescrever a parte do código que os testes de
comportamento mais tocam, sem que nenhum requisito exigisse.

### 4.3 Sobre a compatibilidade da folha de estilo do usuário

| Alternativa | Por que foi descartada |
|-------------|------------------------|
| Ancorar a compatibilidade nos nomes de classe do sistema adotado | Esses nomes são hasheados. O `ButtonBase`, por exemplo, aparece como `prc-Button-ButtonBase-9n-Xk` na versão inspecionada, e o sufixo muda quando o componente muda. Construir contrato sobre eles é prometer estabilidade que não está sob controle do projeto |
| Abandonar a customização por folha própria | Descartado pelo usuário. Tecnicamente seria o mais barato, mas quebraria a folha de quem customizou duas vezes seguidas, na feature `001` e de novo aqui |
| Manter os nomes de classe da feature `001` como âncora | Não resolve: quem tem folha escrita hoje escreveu contra a versão 1.33.1, não contra a `001`, que ainda não foi publicada |

### 4.4 Sobre a distinção não cromática do tipo de cartão

| Alternativa | Por que foi descartada |
|-------------|------------------------|
| Textura ou borda tracejada | Distingue mas não informa: o usuário vê que aquele cartão é diferente e não sabe em quê |
| Ícone sozinho | Exige aprendizado prévio da convenção, e o quadro não tem legenda |
| Rótulo textual, **escolhido** | É o único canal que sobrevive à escala de cinza, ao daltonismo e ao leitor de tela ao mesmo tempo, e o componente de rótulo do sistema já traz as variantes prontas |

## 5. Achado que altera o alcance de um requisito

RF-22 pedia a remoção das bibliotecas vendorizadas cuja função o sistema adotado absorve. A inspeção
de `src/res/` mostrou seis sobreviventes: Filtrex, Showdown, Mermaid, highlight.js, CodeMirror e
Moment. **O sistema de design não substitui nenhuma delas**, porque todas são funcionais e não de
apresentação: linguagem de filtro, conversão de Markdown, diagramas, realce de sintaxe, edição de
texto e formatação de data.

As duas que ele absorveria, jQuery e Bootstrap, já saíram na feature `001`, conforme D-08 daquele
roadmap. Daí D-29: o requisito é reinterpretado como declaração de versão das seis sobreviventes, que
é o que resta de real e cumpre a parte alcançável da dívida D7 registrada em
`_reversa_sdd/architecture.md#9.2`. Fingir alcance maior produziria ação impossível no `actions.md`.

## 6. Defeito existente que a feature corrige de passagem

O realce de sintaxe é servido hoje por `src/res/css/hljs-atom-one-dark.css`, uma folha de tema
**escuro fixo**. Num quadro em tema claro, o bloco de código aparece com fundo escuro, destoante do
entorno. Como D-26 faz o tema do realce derivar do modo de cor ativo, o defeito se resolve sem
trabalho adicional. Registrado aqui para que apareça no `CHANGELOG.md` como correção, e não passe por
efeito colateral não intencional.

## 7. Fontes

- Registro público de pacotes, consultado em 2026-08-03 para versão, data de publicação e pares
  declarados dos três pacotes.
- Pacote publicado `@primer/react` 38.34.0, inspecionado localmente: 104 folhas de estilo, das quais
  6 com seletor relacional e 4 com consultas de contêiner; varredura de interfaces de programação no
  código distribuído.
- Pacote publicado `@primer/primitives` 11.10.0, inspecionado localmente: 14 conjuntos de tema, entre
  eles 4 de alto contraste e 6 para tipos de daltonismo; cerca de 118 KB por conjunto.
- `.yarnrc` do repositório do editor, tags 1.70.0 a 1.78.0, para a versão do Electron por release.
- Índice público de releases do Electron, para o mapeamento entre série do Electron e versão do
  Chromium.
- [Primer React, guia de instalação](https://primer.style/product/getting-started/react/), para a
  exigência de importar os arquivos de tema e de o empacotador saber lidar com folha importada de
  módulo JavaScript.
- `_reversa_sdd/adrs/003-interface-em-webview-com-jquery-vendorizado.md` e
  `_reversa_sdd/architecture.md#9.2`, para a dívida que a feature colhe.
- `_reversa_forward/001-interface-react-tema-e-done/roadmap.md`, decisões D-01 a D-16, para o que a
  feature anterior fixou e esta preserva.
