# Onboarding: como verificar o quadro sobre o sistema de design adotado

> Identificador: `002-primer-design-system`
> Data: `2026-08-03`
> Roadmap: `_reversa_forward/002-primer-design-system/roadmap.md`

Este roteiro é para quem vai testar a feature pela primeira vez, inclusive o próprio mantenedor
daqui a alguns meses. Cada seção diz o que fazer, o que precisa ser verdade e o que fazer se não for.

## 0. Antes de qualquer alteração: capturar a referência

**Este passo é irreversível se pulado.** Executado sobre a base já alterada, ele não mede mais nada.

**A base atual já não é a versão 1.33.1**, e por isso o caminho aqui é sempre o do item 1 abaixo. A
feature `001` reconstruiu a interface e moveu `board.js` e `script.js` para `reference/legacy/`; o
que resta no repositório é o oráculo lido por `scripts/capture-reference.js`, não a interface que se
quer medir. Conferir antes de começar:

```bash
git stash list                      # confirme que não há alteração desta feature aplicada
git log --oneline -1                # a base traz a feature 001; não é a 1.33.1
```

1. Instale a versão publicada 1.33.1 num perfil limpo do editor, ou faça `git checkout` da etiqueta
   correspondente e compile.
2. Ative o script de registro de eventos descrito na seção 7 do `onboarding.md` da feature `001`.
3. Execute o roteiro de doze passos da seção 3 deste documento.
4. Guarde os dois arquivos produzidos:

```bash
mkdir -p _reversa_forward/001-interface-react-tema-e-done/reference
cp /tmp/events.log       _reversa_forward/001-interface-react-tema-e-done/reference/events.log
cp .vscode/vscode-kanban.json _reversa_forward/001-interface-react-tema-e-done/reference/board-after.json
```

Sem esses dois arquivos, os critérios RF-02, RF-04 e RF-27 não têm base de comparação, e o critério
de pronto não pode ser fechado.

## 1. Preparar o ambiente

```bash
node --version                      # precisa ser compatível com o toolchain da feature 001
npm ci                              # instala a partir do package-lock.json versionado
npm run build
```

O que precisa ser verdade:

- `npm ci` não emite aviso de par não satisfeito para `@primer/react`;
- `package.json` traz as três dependências com **versão exata**, sem acento circunflexo;
- `package-lock.json` aparece modificado no `git status` e vai junto no commit.

Se `npm ci` reclamar de par de React, confira se alguém subiu o React para uma versão fora de
`18.x || 19.x`.

## 2. Rodar a rede de segurança

```bash
npm run lint
npm test
```

O que precisa ser verdade:

- a suíte passa inteira;
- o `git diff` dos arquivos de teste mostra **uma única** asserção alterada, a do ciclo do controle
  de tema em `src/test/view-state.unit.test.ts`, que passa de três para quatro acionamentos
  por causa do alto contraste (ver `data-delta.md` §3.1);
- nenhuma outra asserção foi tocada. Qualquer outra alteração em teste é sinal de que o comportamento
  mudou e o teste foi acomodado, e não o contrário.

## 3. Roteiro de doze passos — preservação de comportamento (RF-02, RF-04)

Guarde a referência antes:

```bash
cp .vscode/vscode-kanban.json /tmp/quadro-antes.json
```

Execute, na ordem:

1. Criar um cartão em Todo, com título, descrição em Markdown e prioridade 5.
2. Editar o título desse cartão.
3. Movê-lo para In Progress.
4. Movê-lo para Testing e depois para Done.
5. Abrir os detalhes de um cartão com descrição contendo um diagrama Mermaid e um bloco de código.
6. Aplicar o filtro `is_bug`.
7. Digitar uma expressão de filtro inválida, por exemplo `is_bug ((`.
8. Limpar o filtro.
9. Iniciar e parar o rastreamento de tempo num cartão de In Progress.
10. Excluir um cartão, confirmando o diálogo.
11. Usar o botão **Clear** da coluna Done.
12. Fechar e reabrir o painel.

Depois:

```bash
diff /tmp/quadro-antes.json .vscode/vscode-kanban.json
diff _reversa_forward/001-interface-react-tema-e-done/reference/events.log /tmp/events.log
```

O que precisa ser verdade:

- o passo 7 mostra **todos** os cartões, e a interface não fica em estado de erro;
- a ordem dentro de cada coluna é prioridade decrescente, depois tipo, depois título;
- o primeiro `diff` mostra apenas as alterações feitas de propósito;
- o segundo `diff` é **vazio**: a sequência de eventos e os campos recebidos pelo script, incluindo
  `others` e `__uid`, são idênticos aos da referência da versão 1.33.1.

## 4. A prova de que nada foi redeclarado localmente (RF-24, RN-07)

Este é o teste central da feature, e ele funciona pelo avesso.

1. Abra o quadro.
2. Nas ferramentas de desenvolvedor do Webview, desabilite a folha de estilo do sistema de design.

O que precisa ser verdade:

- o quadro fica **sem cor**: cartões, colunas e controles perdem fundo, borda e tonalidade de texto;
- a geometria permanece, porque `board.css` continua respondendo por ela.

Se algum elemento continuar colorido, ele está declarando valor visual próprio, o que viola RN-07.
Encontre o arquivo pelo inspetor e remova o literal.

## 5. Tema, alto contraste e conteúdo rico (RF-07 a RF-09, RF-16)

1. Com o quadro em "seguir o editor", troque o tema do editor. O quadro acompanha, sem recarga.
2. Acione o controle de tema quantas vezes forem os estados oferecidos. O ciclo passa por claro fixo,
   escuro fixo e alto contraste, e volta a "seguir o editor", sem repetir nem pular.
3. Em claro fixo, troque o tema do editor para escuro. O quadro **não** muda.
4. Feche e reabra o painel. A preferência sobreviveu.
5. Abra um cartão com Markdown, diagrama e bloco de código e alterne o tema.

O que precisa ser verdade:

- o bloco de código acompanha o tema. Se ele continuar escuro num quadro claro, D-26 não foi
  aplicada e o defeito herdado da folha de realce fixa continua ali;
- o diagrama acompanha o tema;
- nada disso grava o arquivo do quadro (ver seção 7).

## 6. Acessibilidade (RF-10, RF-13 a RF-15)

1. Percorra o quadro inteiro usando apenas a tecla de tabulação. Todo controle recebe foco visível.
2. Abra e feche um diálogo pelo teclado. O foco volta ao controle que o abriu, e a tecla de escape
   fecha sem armadilha de foco.
3. Mova um cartão de Todo para In Progress pelo menu de ação, sem usar o ponteiro. Depois desfaça e
   repita arrastando. O arquivo do quadro resultante é idêntico nos dois caminhos.
4. Converta a tela para escala de cinza, pelo filtro de acessibilidade do sistema operacional ou pelo
   emulador de deficiência visual das ferramentas de desenvolvedor. Um cartão de emergência continua
   distinguível de um comum, pelo rótulo textual.
5. Com um leitor de tela ativo, percorra a barra superior. Cada controle anuncia nome não vazio e,
   quando tem estado, o estado corrente.

## 7. Ausência de efeito colateral (RF-05)

```bash
cp .vscode/vscode-kanban.json /tmp/antes-aparencia.json
```

Alterne tema, ocultação de concluídos, colapso de coluna e modo de visualização, várias vezes.

```bash
diff /tmp/antes-aparencia.json .vscode/vscode-kanban.json
```

O que precisa ser verdade: o `diff` é **vazio**, byte a byte. Com um script de evento ativo, nenhum
evento é disparado por essas ações.

## 8. Ausência de rede e política de conteúdo (RF-18, RF-19)

1. Desconecte a máquina da rede, ou ative o modo offline nas ferramentas de desenvolvedor.
2. Abra o quadro.

O que precisa ser verdade:

- o quadro renderiza integralmente, com ícones, cores e tipografia corretos;
- a aba de rede das ferramentas de desenvolvedor não acusa nenhuma requisição a domínio externo;
- o documento traz a política de segurança de conteúdo declarada, e o console não mostra violação.

Se algum ícone sumir, é sinal de que ele está sendo buscado de fora, o que viola RN-06.

## 9. Folha de estilo do usuário (RF-11, RF-12, RF-28)

Escreva um `.vscode/vscode-kanban.css` de teste com três regras, uma por nível de promessa:

1. contra uma âncora permanente de `interfaces/style-anchors.md` §3 ou §4, por exemplo
   `[data-vsckb="card"]`;
2. contra uma âncora de compatibilidade de `interfaces/style-anchors.md` §5, por exemplo
   `[data-vsckb-dialog="add-card"]`;
3. contra um nome de classe da versão 1.33.1 listado em `interfaces/legacy-class-map.md` §3, por
   exemplo `.vsckb-kanban-card` ou `#vsckb-card-done`.

A terceira regra é a que prova a camada de compatibilidade de ponta a ponta: ela só funciona se a
segunda âncora existir no elemento e se a folha gerada ligar uma coisa à outra.

O que precisa ser verdade:

- as três regras são aplicadas;
- a folha do usuário vence a do sistema de design, porque é a última da cascata. Se não vencer, a
  ordem de injeção em `boards.ts` está errada.

## 10. Medida do pacote (RNF de desempenho)

```bash
ls -l out/res/webview/main.js out/res/webview/main.css
```

Linha de base medida em 2026-08-03, antes desta feature: 182.918 bytes de código e 11.314 de folha.
O teto declarado no `requirements.md` é de 900 KB de código e 400 KB de folha, já minificados.

Registre o número obtido no `actions.md`. Se estourar, o caminho é reduzir os conjuntos de tema
carregados de imediato, não elevar o teto em silêncio.

## 11. Compatibilidade e piso de versão (RF-06, RF-21)

1. Abra um quadro produzido pela versão 1.33.1, com cartões contendo `id`, `tag`, `references` e
   campos de cronometragem. Feche sem editar. Nenhum campo é perdido, acrescentado ou reordenado.
2. Confirme que `engines.vscode` declara `^1.78.0` e que o alvo em `scripts/build-webview.js` é
   `chrome108`. Os dois precisam corresponder ao mesmo motor de renderização (D-18).
3. Verifique, no editor da versão do piso, que os componentes com seletor relacional aparecem com o
   acabamento correto.

## 12. Se algo falhar

- **Quadro sem cor nenhuma, inclusive nos controles:** a folha do sistema de design não foi carregada.
  Confira se o pacote importa os arquivos de tema e se a política de conteúdo não está bloqueando.
- **Quadro com cara certa mas ferramentas de desenvolvedor acusando violação de política:** a política
  está mais estrita do que a folha exige. Ajuste a diretiva de estilo, nunca removendo a política.
- **Teste falhando fora da asserção do ciclo de tema:** pare e investigue. É regressão de
  comportamento, não acomodação de teste.
- **Ícone faltando:** importação individual esquecida, ou o empacotador descartou o ícone por não ver
  a referência. Confira a importação nomeada.
- **Folha do usuário deixando de valer:** verifique a ordem de injeção em `boards.ts` e se a âncora
  usada consta de `interfaces/style-anchors.md`.
