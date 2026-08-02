# Gestão de Cartões

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Ciclo de vida do cartão dentro do quadro: criação, edição, visualização de detalhes e exclusão.
É a unit com que o usuário mais interage e a que dispara a maioria dos eventos de script.

## Responsabilidades

- Criar cartões numa coluna, pelo botão "+" do cabeçalho
- Editar todos os campos de um cartão existente
- Exibir o cartão em modo de detalhe, somente leitura
- Excluir um cartão, com confirmação
- Disparar os eventos `card_created`, `card_updated` e `card_deleted`
- Manter os campos de entrada preenchidos entre criações sucessivas

## Regras de Negócio

- `title` é o único campo obrigatório 🟢
- O tipo oferecido na interface tem três opções: Bug / issue, Emergency e Note / task (vazio,
  pré-selecionado) 🟢
- Ao criar um cartão, os campos prioridade, responsável e tipo **não** são limpos, para
  facilitar entrada em lote 🟢
- O campo "Assigned To" é pré-preenchido com o usuário detectado, apenas se estiver vazio 🟢
- Descrição e detalhes são editados em CodeMirror e gravados sempre como `text/markdown` 🟢
- A tecla ESC não fecha os modais de criação e edição, para não perder texto digitado 🟢
- A exclusão exige confirmação em modal com botões "NO!" e "Yes" 🟢
- Excluir um cartão **não** remove as referências que outros cartões façam a ele 🟡
- A gravação do quadro ocorre **antes** do disparo do evento correspondente 🟢
- `creation_time` é gravado em UTC no momento da criação 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Criar cartão numa coluna a partir do botão "+" | Must | O cartão aparece na coluna e é persistido |
| RF-02 | Exigir título não vazio | Must | Tentativa sem título não cria cartão |
| RF-03 | Editar título, tipo, prioridade, categoria, responsável, descrição, detalhes e vínculos | Must | Alterações persistem após recarga |
| RF-04 | Excluir cartão mediante confirmação | Must | Cartão some do quadro e do arquivo |
| RF-05 | Exibir modal de detalhes em modo leitura, com Markdown renderizado | Should | Descrição e detalhes aparecem formatados |
| RF-06 | Preservar prioridade, responsável e tipo entre criações sucessivas | Should | Segundo cartão nasce com os mesmos valores |
| RF-07 | Registrar `creation_time` em UTC | Should | O campo aparece no JSON em ISO 8601 |
| RF-08 | Disparar eventos de criação, atualização e exclusão | Should | O script do usuário recebe os três eventos |
| RF-09 | Impedir fechamento acidental por ESC | Could | ESC não fecha os modais de criação e edição |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Usabilidade | ESC desabilitado nos modais de escrita (`data-keyboard="false"`) | `boards.ts:529`, `:678` | 🟢 |
| Usabilidade | Limite de 255 caracteres no campo de descrição da edição | `boards.ts:746` | 🟢 |
| Desempenho | Cada evento carrega cópia de todos os demais cartões | `board.js:1473` | 🟢 |
| Integridade | Não há transação entre gravação e evento | `board.js:1459-1477` | 🟢 |
| Segurança | O conteúdo do cartão é renderizado com sanitização limitada | `script.js:235` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado o quadro aberto
Quando o usuário clica em "+" na coluna Todo, preenche o título e confirma
Então um cartão aparece em Todo
E o arquivo do quadro contém o novo cartão com creation_time em UTC
E o evento card_created é disparado

Dado um cartão existente
Quando o usuário altera a prioridade de 0 para 5 e salva
Então o cartão sobe na ordenação da coluna
E o evento card_updated é disparado com o cartão antigo e o novo

Dado um cartão existente
Quando o usuário aciona a exclusão e confirma com "Yes"
Então o cartão desaparece do quadro e do arquivo
E o evento card_deleted é disparado

Dado o modal de criação aberto com texto digitado
Quando o usuário pressiona ESC
Então o modal permanece aberto e o texto é preservado

Dado que o usuário acabou de criar um cartão com prioridade 3 e tipo bug
Quando abre novamente o modal de criação
Então prioridade e tipo continuam preenchidos com 3 e bug
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Criar, editar e excluir | Must | Razão de existir do sistema |
| Persistência da alteração | Must | Sem ela nada sobrevive à sessão |
| Confirmação de exclusão | Must | Operação destrutiva sem desfazer |
| Modal de detalhes | Should | Leitura confortável, com alternativa (editar) |
| Eventos de cartão | Should | Base da extensibilidade |
| Campos preservados entre criações | Should | Fluxo de entrada em lote |
| ESC desabilitado | Could | Proteção contra perda acidental |
| Desfazer exclusão | Won't | 🔴 Não existe no legado |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/res/js/board.js:1834-1928` | criação de cartão e evento `card_created` | 🟢 |
| `src/res/js/board.js:71-257` | `vsckb_edit_card` e evento `card_updated` | 🟢 |
| `src/res/js/board.js:1020-1100` | exclusão e evento `card_deleted` | 🟢 |
| `src/res/js/board.js:587-729` | `vsckb_open_card_detail_window` | 🟢 |
| `src/res/js/board.js:340-351` | `vsckb_get_assigned_to_val` | 🟢 |
| `src/res/js/board.js:423-438` | `vsckb_get_card_description_markdown` | 🟢 |
| `src/res/js/board.js:531-546` | `vsckb_get_prio_val` | 🟢 |
| `src/boards.ts:529-799` | HTML dos modais de criação e edição | 🟢 |
| `src/boards.ts:829-859` | HTML do modal de detalhes | 🟢 |
