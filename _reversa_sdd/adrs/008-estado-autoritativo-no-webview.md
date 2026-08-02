# ADR-008 — Estado autoritativo do quadro no Webview

> ADR **retroativo**, reconstruído pelo Detetive.
> Decisão **implícita**, jamais declarada, mas que governa toda a arquitetura.

- **Status:** aceito e vigente desde a versão 1.0.1 (2018-05-27)
- **Confiança:** 🟢 no comportamento · 🔴 na motivação (nenhuma evidência textual)

## Contexto

Extensão e Webview são dois processos que trocam mensagens. Alguém precisa ser dono do estado
do quadro: o extension host (que tem o disco) ou o Webview (que tem a interface).

## Decisão

O **Webview é o dono**. A variável global `allCards` em `board.js:2` é a única cópia viva do
quadro. A extensão:

1. lê o JSON do disco e **entrega** o quadro inteiro via `setBoard`;
2. não guarda cópia nem acompanha alterações;
3. recebe o quadro inteiro de volta em `saveBoard` e o grava como veio.

## Evidências

- `let allCards;` no escopo global (`board.js:2`)
- `setBoard` substitui o estado por completo (`board.js:2006-2021`)
- `saveBoard` envia `allCards` inteiro (`board.js:1237`)
- `KanbanBoard` não tem campo de quadro: só `_openOptions`, `_panel` e os dois arrays de
  listeners (`boards.ts:407-410`)
- `saveBoardTo(board, file)` grava o objeto recebido, sem mesclar (`workspaces.ts:1124-1133`)

## Alternativas consideradas 🟡

| Alternativa | Por que provavelmente foi descartada |
|---|---|
| Estado na extensão, com o Webview enviando comandos (`addCard`, `moveCard`) | Exigiria um protocolo bem maior e sincronização bidirecional a cada operação |
| Estado espelhado nos dois lados | Duplicaria a fonte de verdade e exigiria reconciliação |
| Estado no disco, relido a cada operação | Custo de I/O a cada clique |

A escolha é natural para quem constrói a interface primeiro: o `board.js` já precisa do quadro
todo para renderizar; guardar mais uma cópia na extensão pareceria redundante.

## Consequências

**Positivas** 🟢
- Protocolo mínimo: seis comandos em cada direção dão conta de tudo.
- A interface responde sem ida e volta ao extension host.
- `retainContextWhenHidden: true` preserva o estado ao trocar de aba, sem recarregar nada.

**Negativas** 🟢
- **Última gravação vence.** Não há reconciliação: um `git pull` que altere o arquivo é
  sobrescrito pelo próximo `saveBoard` do quadro aberto.
- O quadro aberto em segundo plano pode ficar horas defasado; só o botão "Reload Board"
  ressincroniza.
- O quadro inteiro trafega pela ponte a cada gravação, e **os demais cartões trafegam de novo**
  em `others` a cada evento (`board.js:1473`).
- A lógica de domínio migrou para o Webview: ordenação, geração de `__uid` e filtragem vivem em
  JavaScript não modularizado, fora do alcance do compilador TypeScript.
- Testar a lógica de domínio exige um Webview: é a causa raiz da cobertura de testes nula.

## Status hoje

Vigente. É a **decisão arquitetural mais consequente do sistema** e a que mais restringe
qualquer evolução: enquanto o domínio morar em `board.js`, ele continuará sem tipos, sem
módulos e sem testes. Mover o modelo para o extension host — deixando o Webview como camada de
apresentação — é o pré-requisito de qualquer melhoria estrutural séria, e provavelmente era o
que a "grande refatoração" anunciada em 2020 pretendia fazer.
