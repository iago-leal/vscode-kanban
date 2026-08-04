# Onboarding: verificar o número do cartão na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Para: quem vai olhar esta feature pela primeira vez, inclusive o autor daqui a seis meses

Este documento é o roteiro de verificação. Ele existe porque, neste projeto, **a suíte verde
nunca pegou um defeito de aparência**: os três que apareceram — a coluna que esmagava os
cartões, o quadro sem sistema de design, o quadro que perdeu o significado das cores — foram
achados numa captura de tela (`scripts/preview.js`, cabeçalho).

O roteiro tem três estágios, do mais barato ao mais caro. Nenhum substitui o seguinte.

---

## §1. Estágio 1 — a suíte

Custa segundos e cobre a regra, não a aparência.

```bash
npm run test:unit
```

Espera-se: verde, com a suíte nova de `card-number` entre as que rodaram. Se qualquer asserção
**existente** tiver mudado para o verde acontecer, o trabalho está errado — a suíte é a base de
comparação, não o alvo.

Cobertura do domínio, que tem piso de sessenta por cento e onde a regra nova mora:

```bash
npm run test:coverage
```

---

## §2. Estágio 2 — a tela, no navegador

O harness de pré-visualização carrega o pacote real num navegador com hospedeiro fingido.
É onde os defeitos de aparência aparecem.

### 2.1 O quadro do projeto

```bash
npm run preview
```

Abre em `http://localhost:8777` com os cinquenta cartões reais deste projeto, todos de
identificador simples. Confira, na ordem:

1. **Todo cartão tem número.** Percorra as quatro colunas. Nenhum cartão sem marcador.
2. **O número bate com o arquivo.** O cartão "Execução de script do workspace sem confirmação"
   é o `[5]`; "Webview sem Content Security Policy" é o `[7]`. Confira dois ou três contra
   `.vscode/vscode-kanban.json`.
3. **O número abre a linha do título**, na mesma linha, em tom mais apagado que o título.
4. **O título não perdeu linha.** Compare com uma captura anterior à feature, ou estreite a
   janela: o título deve quebrar onde quebrava.
5. **Cartão sem tipo continua mostrando o número.** Alguns cartões não têm etiqueta de tipo e,
   por isso, não desenham a faixa superior. O número tem de estar lá assim mesmo — foi o caso
   que decidiu a posição.

### 2.2 Os quatro estados de tema

```bash
npm run preview -- --theme dark
npm run preview -- --theme light
```

Confira nos dois que o número é legível e que continua mais apagado que o título sem sumir no
fundo. Os estados de alto contraste e o de seguir o editor completam os quatro, e o controle
de tema da própria barra superior alcança todos.

### 2.3 O layout de lista

Estreite a janela do navegador até o quadro trocar de layout. Cada cartão da lista tem de
mostrar o número, na mesma notação. É o mesmo componente, de modo que a falha aqui seria
falha de largura, não de código.

### 2.4 Os casos negativos, na fixture

```bash
npm run preview -- --sandbox
```

Serve a fixture de `_reversa_forward/001-interface-react-tema-e-done/reference/sandbox/`, que
existe para ser maltratada. Depois desta feature ela tem três cartões novos:

| Cartão | O que exercita | O que se espera ver |
|---|---|---|
| sem `id` | RF-10 | Nenhum marcador. Não pode aparecer `[]`, `[undefined]` nem `[null]` |
| `id` longo | RF-09, RN-05 | `[…` seguido de seis caracteres. Passe o ponteiro: o balão mostra a cadeia inteira |
| `id` repetido | RN-04 | Dois cartões com o mesmo número, **sem** sinal de repetição. É o comportamento decidido, não um defeito |

O cartão sem `id` só pode ser visto aqui: a pré-visualização não passa pela normalização da
extensão, ao passo que o editor preencheria o campo na carga (RD-07).

### 2.5 O diálogo de detalhes

Abra os detalhes de qualquer cartão pelo botão ⓘ. A lista de fatos tem uma linha nova,
`Identifier`, com o valor **integral** — inclusive para o cartão de identificador longo, que é
o único lugar onde a cadeia inteira pode ser lida.

Restaurar a fixture, se ela ficar inconsistente:

```bash
git checkout -- _reversa_forward/001-interface-react-tema-e-done/reference/sandbox/.vscode/vscode-kanban.json
```

---

## §3. Estágio 3 — o editor

A pré-visualização é um navegador, não o editor: ciclo de vida do painel, ponte real, classes
de tema que o editor escreve no corpo do documento e tudo que toca o sistema de arquivos são
fingidos. **Um cartão verificado por ela está verificado para `testing`, jamais para `done`** —
é como este quadro trata essa evidência desde o cartão `[36]`.

### 3.1 Empacotar a build local

Duas armadilhas moram aqui, e as duas fazem parecer que o código regrediu.

```bash
npm run build     # obrigatório: 'vscode:prepublish' só roda 'tsc' e não constrói o Webview
ls -d ~/.vscode/extensions/mkloubert.vscode-kanban-*   # veja qual versão está instalada
npx @vscode/vsce package <versão-maior> --no-update-package-json --allow-star-activation
code --install-extension vscode-kanban-<versão>.vsix --force
```

- `<versão-maior>` tem de ser maior que **todas** as instaladas, não que a do manifesto:
  sessões antigas deixam versões altas para trás e o editor carrega a maior.
- Sem `npm run build`, o pacote leva o `out/res/` da build anterior, e a interface parece não
  ter mudado.

Confirme que o pacote leva o trabalho desta sessão:

```bash
grep -c "vsckb-card-number" ~/.vscode/extensions/mkloubert.vscode-kanban-<versão>/out/res/webview/main.css
```

### 3.2 Recarregar e olhar

A janela já aberta continua com a extensão antiga carregada. Rode **Developer: Reload Window**
antes de qualquer conclusão. Depois:

1. Abra o quadro por **Kanban: Open Board ...** — refaça as verificações de §2.1.
2. Troque o tema do editor e confirme que o número acompanha, inclusive no modo que segue o
   editor.
3. Percorra o quadro **só pelo teclado**. O foco tem de continuar visível, e o cartão anunciado
   passa a começar pelo número.
4. Com um leitor de tela ativo, confirme que o cartão `[5]` de título `Foo` é anunciado como
   `[5] Foo`, e que os botões de ação continuam citando **só** o título — `Edit 'Foo'`, e não
   `Edit '[5] Foo'`. Foi decisão explícita, para não alongar quatro anúncios por cartão.

### 3.3 O teste que fecha o círculo

Peça ao agente que cite um cartão pelo número — "o que falta no `[16]`?" — e localize-o na
tela sem abrir o arquivo. É o problema que originou a feature, e é assim que se sabe que ele
acabou.

---

## §4. O que **não** deve ter mudado

Confira, porque uma feature de exibição que altera dado é uma feature errada:

```bash
git diff --stat .vscode/vscode-kanban.json    # nada
git status src/extension.ts src/workspaces.ts src/boards.ts src/toggl.ts    # limpos
```

- O arquivo do quadro não muda ao abrir e salvar pela interface nova.
- Nenhum arquivo da extensão foi tocado: a feature vive inteira sob `src/webview/`.
- A folha de estilo de um usuário escrita contra a interface 1.33.1 continua valendo; o
  marcador acrescenta classe, não renomeia nenhuma.
