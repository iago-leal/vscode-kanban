# Vínculo entre Cartões

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Capacidade de um cartão referenciar outros cartões do mesmo quadro, pela aba "References" dos
modais de criação e edição. Introduzida na versão 1.14.0, em resposta à issue #9.

## Responsabilidades

- Oferecer, nos modais de escrita, um seletor com os demais cartões do quadro
- Acrescentar e remover vínculos de um cartão
- Persistir os vínculos no campo `references` do cartão
- Exibir a lista de cartões vinculados
- Permitir abrir o detalhe de um cartão vinculado a partir da lista

## Regras de Negócio

- Os vínculos são armazenados como lista de `id` de outros cartões 🟢
- O seletor lista todos os cartões do quadro exceto o próprio 🟢
- 🔴 A semântica do vínculo não está definida: pode significar dependência, subtarefa ou
  "veja também" (lacuna L2 de `domain.md`)
- 🔴 Não há integridade referencial: nada impede referência a `id` inexistente
- Excluir um cartão referenciado **não** limpa as referências dos demais 🟡
- O vínculo é unidirecional: referenciar B a partir de A não cria o inverso 🟢
- Não há detecção de ciclo entre vínculos 🟡

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Listar os demais cartões do quadro num seletor | Must | O próprio cartão não aparece na lista |
| RF-02 | Acrescentar vínculo pelo botão de correntinha | Must | O cartão escolhido aparece na lista de vinculados |
| RF-03 | Persistir os vínculos em `references` | Must | Após recarga, os vínculos permanecem |
| RF-04 | Exibir a lista de cartões vinculados no modal | Must | Os títulos dos vinculados aparecem |
| RF-05 | Remover um vínculo | Should | O cartão sai da lista e do JSON |
| RF-06 | Abrir o detalhe de um cartão vinculado | Should | Clicar no vinculado abre seu detalhe |
| RF-07 | Sinalizar vínculo órfão (`id` inexistente) | Could | 🔴 Não existe no legado |
| RF-08 | Criar vínculo bidirecional automaticamente | Won't | 🟢 O legado é unidirecional |
| RF-09 | Detectar ciclos entre vínculos | Won't | 🟡 Ausente |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Integridade | Nenhuma validação de existência do `id` referenciado | ausência de código | 🟢 |
| Desempenho | A lista de "outros cartões" percorre o quadro inteiro a cada abertura de modal | `board.js:510-529` | 🟢 |
| Usabilidade | A aba de vínculos convive com descrição e detalhes no mesmo modal | `boards.ts:588-592` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um quadro com três cartões
Quando o usuário abre o modal de edição do primeiro
Então o seletor de vínculos lista os outros dois, e não o primeiro

Dado o modal de edição aberto
Quando o usuário escolhe um cartão no seletor e aciona o botão de vínculo
Então o cartão escolhido aparece na lista de vinculados

Dado um cartão com dois vínculos
Quando o quadro é gravado e recarregado
Então o campo references contém os dois ids

Dado um cartão vinculado a outro
Quando o cartão referenciado é excluído
Então 🟡 a referência permanece no primeiro, apontando para um id inexistente
E o comportamento desejado precisa ser definido

Dado um cartão com vínculos
Quando o usuário remove um vínculo e salva
Então o id correspondente some do campo references
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Acrescentar e persistir vínculo | Must | Razão de ser da unit |
| Seletor sem o próprio cartão | Must | Evita autorreferência trivial |
| Exibir vinculados | Must | Sem isso o vínculo é invisível |
| Remover vínculo | Should | Simetria da operação |
| Navegar até o vinculado | Should | Conveniência com alternativa |
| Sinalizar órfão | Could | Depende de decidir a semântica |
| Bidirecionalidade e ciclos | Won't | Ausentes por desenho ou por omissão |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/boards.ts:91` | campo `references` na interface `BoardCard` | 🟢 |
| `src/boards.ts:588-622` | HTML da aba de vínculos (criação) | 🟢 |
| `src/boards.ts:737-771` | HTML da aba de vínculos (edição) | 🟢 |
| `src/res/js/board.js:1259-1383` | `vsckb_setup_card_link_list` | 🟢 |
| `src/res/js/board.js:286-312` | `vsckb_find_parent_cards_of` | 🟢 |
| `src/res/js/board.js:258-273` | `vsckb_find_card_by_id` | 🟢 |
| `src/res/js/board.js:510-529` | `vsckb_get_other_cards` | 🟢 |
