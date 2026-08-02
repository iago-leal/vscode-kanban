# Onboarding: como testar a nova interface do quadro

> Identificador: `001-interface-react-tema-e-done`
> Data: `2026-08-02`
> Público: você mesmo, daqui a alguns meses, sem lembrar de nada disto.

## 1. Preparar o ambiente

```bash
cd ~/dev/vscode-kanban
git checkout -b feat/001-interface-react   # ou a branch onde a feature foi entregue
npm ci
npm run build
```

Se o `npm ci` falhar, o problema quase certamente não é a feature: o pacote `vscode` deprecado
foi substituído no commit `d478cca`, e qualquer regressão aí bloqueia tudo. Confira antes de
investigar outra coisa.

## 2. Rodar a rede de segurança

```bash
npm run lint        # tslint com severidade de erro, gate desde 6a1bcc0
npm run test:unit   # Mocha puro, ~1 s: caracterização de ordenação e filtro
npm test            # suíte completa no extension host (abre um editor de verdade)
```

O que precisa ser verdade: **58 testes de caracterização passando, sem nenhuma asserção
alterada em relação ao commit `6d99e58`**. Se alguma asserção tiver mudado, a feature quebrou
RF-02, e o resto do roteiro não importa até isso ser resolvido.

## 3. Abrir a extensão em modo de desenvolvimento

1. Abra a pasta do projeto no VS Code.
2. Pressione `F5` para lançar a Extension Development Host.
3. Na janela nova, abra uma pasta de teste qualquer, com `.vscode/` gravável.
4. Paleta de comandos → **Kanban: Open Board ...**

Prepare **dois** quadros para o roteiro, em pastas diferentes: um vazio e um com pelo menos um
cartão em cada uma das quatro colunas, incluindo um de tipo `emergency`, um de tipo `bug` e um
sem tipo.

## 4. Roteiro de doze passos — preservação de comportamento (RF-02)

Antes de começar, guarde uma cópia de referência:

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
```

O que precisa ser verdade:

- o passo 7 mostra **todos** os cartões, e a interface não fica em estado de erro;
- a ordem dentro de cada coluna é prioridade decrescente, depois tipo, depois título;
- o `diff` mostra apenas as alterações que você fez de propósito, sem reordenação espúria nem
  campo novo.

## 5. Tema (RF-06 a RF-11)

1. Com o quadro aberto, localize o controle de tema na barra superior. Alcance-o **por `Tab`**,
   sem mouse, e acione com `Espaço`.
2. Acione três vezes: o controle passa por claro, escuro e volta a "seguir o editor". O estado
   corrente é legível sem acionar o controle.
3. Com o controle em "seguir o editor", troque o tema do VS Code
   (`Preferences: Color Theme`) de claro para escuro. **O quadro acompanha, sem recarregar o
   painel**; a posição de rolagem e o filtro aplicado permanecem.
4. Fixe o controle em claro e troque o tema do editor para escuro. O quadro **permanece claro**.
5. Feche o painel, abra o quadro da **outra** pasta. Ele abre no tema que você escolheu.
6. Confirme que nada foi criado nas pastas de workspace:

```bash
git -C <pasta-de-teste> status --porcelain .vscode/
```

A saída precisa estar vazia, ou conter apenas alterações do quadro que você fez de propósito.

## 6. Ocultação de concluídos, colapso e modo lista (RF-12 a RF-23)

1. Ative a ocultação de concluídos pela barra superior, por teclado. Nenhum cartão de Done
   aparece; a coluna Done fica como faixa, com o nome de exibição configurado e a contagem de
   cartões ocultos; as três colunas restantes ocupam o espaço liberado.
2. Confirme que o arquivo não mudou: `diff` contra a cópia feita antes de ativar.
3. Edite o título de um cartão de Todo e confirme. O arquivo é gravado **com os cartões de Done
   ainda presentes**.
4. Desative a ocultação. A coluna volta na mesma ordem de antes.
5. Aplique o filtro `is_bug` e reative a ocultação: aparecem os cartões `bug` de Todo, In
   Progress e Testing, e nenhum de Done.
6. Colapse In Progress individualmente e restaure. O arquivo não é gravado em nenhuma das duas
   ações.
7. Alterne para o modo lista: todos os cartões visíveis numa sequência vertical única, cada um
   indicando sua coluna. O conjunto é exatamente o das colunas visíveis.
8. No modo lista, mova um cartão de Todo para In Progress. O arquivo é gravado e o script de
   evento recebe o evento com os mesmos campos do modo colunas.
9. Feche e reabra: ocultação e modo de visualização voltam como estavam **naquela pasta**. Abra
   o quadro da outra pasta e confirme que ela tem as suas próprias preferências.
10. No quadro **vazio**, ative a ocultação: as três colunas continuam visíveis e vazias, e a
    faixa de Done informa zero cartões.

## 7. Ausência de efeito colateral (RF-25)

Crie `.vscode/vscode-kanban.js` na pasta de teste:

```js
const FS = require('fs');
const LOG = '/tmp/kanban-eventos.log';

exports.onEvent = async (args) => {
    FS.appendFileSync(LOG, `${ args.name }\n`);
};
```

Depois:

```bash
rm -f /tmp/kanban-eventos.log
cp .vscode/vscode-kanban.json /tmp/quadro-antes-alternancias.json
```

Recarregue o quadro e alterne **dez vezes** o tema, dez vezes a ocultação e dez vezes o modo de
visualização. Então:

```bash
cat /tmp/kanban-eventos.log 2>/dev/null      # precisa não existir ou estar vazio
diff /tmp/quadro-antes-alternancias.json .vscode/vscode-kanban.json   # precisa não ter saída
```

Uma linha sequer no log ou uma diferença no arquivo reprova RF-25.

## 8. Contraste e sanitização (RF-24, RF-28)

1. Em tema escuro, confira que os cartões `emergency`, `bug` e sem tipo são distinguíveis entre
   si e do fundo. Meça o contraste do texto de cada um com o conta-gotas das DevTools do Webview
   (`Developer: Open Webview Developer Tools`): mínimo de 4,5:1.
2. Repita em tema claro.
3. Crie um cartão cuja descrição contenha:

```markdown
<script>vsckb_log('nao deveria rodar')</script>
<img src=x onerror="vsckb_log('nem isto')">
Texto normal depois.
```

O que precisa ser verdade: nenhum dos dois executa, e "Texto normal depois." aparece. A barreira
de hoje remove apenas `<script>` (`script.js:235`), de modo que o segundo caso **pode** ser uma
melhora — o que a feature proíbe é ficar pior.

## 9. Compatibilidade com quadros antigos (RF-26)

Pegue um `.vscode/vscode-kanban.json` gravado pela versão 1.33.1, com cartões que tenham `id`,
`tag`, `references` e descrição em Markdown. Abra-o, confira que todos os campos aparecem e que
nenhuma gravação espontânea altera o arquivo enquanto você apenas olha o quadro.

## 10. Se algo falhar

| Sintoma | Onde olhar primeiro |
|---|---|
| Quadro em branco ao abrir | `Developer: Open Webview Developer Tools`, aba Console. Erro de carga do pacote aparece ali |
| Tema não acompanha o editor | A premissa de D-03 no `roadmap.md` §4: a classe `vscode-dark` no `<body>` do Webview |
| Ocultação vazando entre pastas | Chave por `fsPath` do `workspaceState`, em `data-delta.md` §5 |
| Ordem dos cartões diferente da versão anterior | Decisão D-07 do `roadmap.md`: a ordenação precisa ser aplicada ao payload de `saveBoard` |
| Diagramas ou realce de sintaxe sumidos | Adaptadores em `src/webview/adapters/`, passo 4 do plano de migração |
| Log da extensão | `~/.vscode-kanban/.logs/*.log` |
