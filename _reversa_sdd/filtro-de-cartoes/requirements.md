# Filtro de Cartões

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Linguagem de expressão booleana que decide, cartão a cartão, o que aparece no quadro. É a
funcionalidade mais elaborada do sistema: 25 funções e 24 valores disponíveis ao usuário,
compilados por Filtrex dentro do Webview.

## Responsabilidades

- Oferecer um modal para digitar e aplicar a expressão de filtro
- Compilar a expressão e avaliá-la para cada cartão
- Expor um ambiente rico de valores e funções por cartão
- Persistir a expressão em `.vscode/vscode-kanban.filter`
- Restaurar o filtro salvo ao abrir o quadro

## Regras de Negócio

- Expressão vazia mostra todos os cartões 🟢
- Expressão inválida (erro de compilação ou de execução) **também** mostra todos os cartões,
  registrando o erro no log 🟢
- O filtro afeta apenas a exibição: nunca move, altera nem exclui cartões 🟢
- A expressão é persistida por workspace, num arquivo próprio 🟢
- Aplicar o filtro persiste imediatamente e re-renderiza o quadro 🟢
- `is_bug` é verdadeiro para os tipos `bug` e `issue` 🟢
- `is_note` e `is_task` são verdadeiros para tipo vazio, `note` e `task` 🟢
- `is_emergency` e `is_emerg` são verdadeiros apenas para `emergency` 🟢
- As funções de data comparam contra `creation_time`; cartão sem data válida devolve falso 🟢
- `is_older` e `is_younger` comparam em dias inteiros, truncando ao início do dia 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Abrir modal de filtro com a expressão atual preenchida | Must | O modal mostra o filtro em vigor |
| RF-02 | Compilar e aplicar a expressão a cada cartão | Must | Só os cartões aprovados aparecem |
| RF-03 | Persistir a expressão ao aplicar | Must | O filtro sobrevive ao fechar e reabrir |
| RF-04 | Restaurar o filtro salvo na abertura do quadro | Must | O quadro abre já filtrado |
| RF-05 | Mostrar todos os cartões quando a expressão for vazia | Must | Limpar o campo revela tudo |
| RF-06 | Mostrar todos os cartões quando a expressão for inválida | Should | Erro de sintaxe não esconde o quadro |
| RF-07 | Expor valores do cartão (título, tipo, prioridade, categoria, responsável, datas, tag) | Should | `prio > 3` funciona |
| RF-08 | Expor funções de texto, número, data e expressão regular | Should | `regex(title, "^bug")` funciona |
| RF-09 | Oferecer link para a documentação da linguagem | Could | O link abre a seção de ajuda no GitHub |
| RF-10 | Sinalizar erro de sintaxe ao usuário | Won't | 🟢 O legado apenas loga e mostra tudo |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Robustez | Falha na avaliação nunca esconde o quadro | `script.js:213-217` | 🟢 |
| Desempenho | A expressão é compilada **uma vez por cartão**, a cada renderização | `board.js:836`, `script.js:209` | 🟢 |
| Desempenho | O CHANGELOG 1.18.0 registra otimização explícita do filtro | CHANGELOG | 🟢 |
| Segurança | `regex` e `str_invoke` aceitam entrada arbitrária, confinada ao Webview | `script.js:146-176` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado cartões dos tipos bug, emergency e vazio
Quando o filtro "is_bug" é aplicado
Então apenas os cartões do tipo bug ou issue aparecem

Dado o filtro "prio > 3"
Quando o quadro é renderizado
Então apenas cartões com prioridade maior que 3 aparecem

Dado uma expressão com erro de sintaxe
Quando o filtro é aplicado
Então todos os cartões continuam visíveis
E o erro é registrado no log

Dado um filtro aplicado
Quando o usuário fecha e reabre o quadro
Então o mesmo filtro continua em vigor

Dado o filtro "is_older(7)"
E um cartão criado há dez dias
Quando o quadro é renderizado
Então esse cartão aparece

Dado o filtro "is_assigned_to('iago')"
E um cartão sem responsável
Quando o quadro é renderizado
Então esse cartão não aparece
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Compilação e avaliação | Must | Núcleo da funcionalidade |
| Persistência do filtro | Must | Sem ela o filtro é inútil entre sessões |
| Falha para "mostrar tudo" | Must | Protege contra a impressão de perda de dados |
| Ambiente de valores e funções | Should | O que torna o filtro poderoso |
| Funções de data | Should | Casos de uso reais (cartões antigos) |
| Link de ajuda | Could | Conveniência |
| Sinalização de erro de sintaxe | Won't | Ausente por decisão implícita |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/res/js/script.js:58-218` | `vsckb_does_match` e ambiente de funções | 🟢 |
| `src/res/js/board.js:770-928` | montagem do contexto por cartão | 🟢 |
| `src/res/js/board.js:2136-2157` | modal de filtro e aplicação | 🟢 |
| `src/boards.ts:861-894` | HTML do modal de filtro | 🟢 |
| `src/boards.ts:1235-1250` | comando `saveFilter` | 🟢 |
| `src/workspaces.ts:502-512` | leitura de `.filter` | 🟢 |
| `src/workspaces.ts:564-573` | gravação de `.filter` | 🟢 |
| `src/res/js/filtrex.js` | biblioteca vendorizada | 🟡 versão desconhecida |
