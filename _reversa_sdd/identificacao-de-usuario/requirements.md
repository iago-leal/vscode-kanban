# Identificação de Usuário

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Detecção do nome da pessoa que usa o quadro, para pré-preencher o campo "Assigned To" de novos
cartões. Duas fontes em cascata: o Git local e o sistema operacional, ambas desativáveis.

## Responsabilidades

- Criar o cliente Git da pasta, quando houver repositório
- Consultar `git config user.name`
- Consultar o nome de usuário do sistema operacional como alternativa
- Enviar o nome ao Webview
- Pré-preencher o campo de responsável em novos cartões

## Regras de Negócio

- A detecção só ocorre no handshake de carregamento do quadro 🟢
- A primeira fonte é o Git, e só é consultada se houver diretório `.git` na pasta 🟢
- `noScmUser` desliga a consulta ao Git 🟢
- A segunda fonte é o sistema operacional, consultada apenas se o nome ainda estiver vazio 🟢
- `noSystemUser` desliga a consulta ao sistema 🟢
- Falha em qualquer consulta é silenciosa: o nome fica vazio e nada é enviado 🟢
- O nome só é enviado ao Webview quando não for vazio 🟢
- O nome pré-preenche "Assigned To" **apenas** se o campo estiver vazio 🟢
- O sistema é monousuário: o nome é descritivo e não restringe nada 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Detectar o nome via Git quando houver repositório | Should | Nome do `git config` aparece no campo |
| RF-02 | Recorrer ao nome do sistema operacional na ausência do Git | Should | Sem repositório, o nome do sistema aparece |
| RF-03 | Respeitar `noScmUser` e `noSystemUser` | Should | Com as duas ligadas, nenhum nome é detectado |
| RF-04 | Enviar o nome ao Webview apenas quando houver valor | Should | Nome vazio não gera mensagem |
| RF-05 | Pré-preencher "Assigned To" só quando vazio | Should | Valor digitado pelo usuário não é sobrescrito |
| RF-06 | Falhar em silêncio quando a consulta não funcionar | Could | Ausência de Git não gera erro visível |
| RF-07 | Permitir configurar o nome manualmente | Won't | 🟢 Ausente: só detecção automática |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Desempenho | Consulta ao Git por processo filho síncrono, no handshake | `boards.ts:1010-1012` | 🟢 |
| Privacidade | O nome detectado é gravado no arquivo do quadro, potencialmente versionado | `board.js:2047-2058` | 🟡 |
| Robustez | Três `try/catch` aninhados garantem que nenhuma falha interrompa a abertura | `boards.ts:998-1027` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado uma pasta com repositório Git e user.name configurado
Quando o quadro é aberto
Então o campo "Assigned To" de novos cartões vem preenchido com esse nome

Dado uma pasta sem repositório Git
Quando o quadro é aberto
Então o nome do usuário do sistema operacional é usado

Dado a configuração noScmUser ligada
E uma pasta com repositório Git
Quando o quadro é aberto
Então o Git não é consultado e o nome vem do sistema operacional

Dado noScmUser e noSystemUser ambos ligados
Quando o quadro é aberto
Então nenhum nome é detectado e o campo fica vazio

Dado que o usuário já digitou um nome no campo "Assigned To"
Quando a mensagem de usuário corrente chega
Então o valor digitado é preservado

Dado que o comando do Git falha
Quando o quadro é aberto
Então a abertura prossegue normalmente e nenhum erro é exibido
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Detecção via Git | Should | Conveniência; o quadro funciona sem ela |
| Alternativa pelo sistema | Should | Cobre projetos sem repositório |
| Chaves de desligamento | Should | Privacidade e controle |
| Preservar valor digitado | Should | Evita sobrescrever intenção do usuário |
| Falha silenciosa | Could | Coerente com o caráter acessório da unit |
| Configuração manual do nome | Won't | Ausente no legado |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/boards.ts:996-1034` | detecção dentro de `onLoaded` | 🟢 |
| `src/workspaces.ts:952-956` | `tryCreateGitClient` | 🟢 |
| `src/workspaces.ts:513-514` | repasse de `noScmUser` e `noSystemUser` | 🟢 |
| `src/res/js/board.js:2047-2058` | recepção de `setCurrentUser` | 🟢 |
| `src/res/js/board.js:1241-1258` | `vsckb_setup_assigned_to` | 🟢 |
| `src/res/js/board.js:548-586` | `vsckb_get_user_list` | 🟢 |
