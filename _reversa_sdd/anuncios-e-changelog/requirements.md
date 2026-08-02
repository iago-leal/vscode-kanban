# Anúncios e Changelog

> Unit da extração Reversa · 2026-08-02

## Visão Geral

Comunicação da extensão com o usuário na ativação: exibição do CHANGELOG quando a versão muda e
de um aviso único convidando à refatoração do projeto. É a unit de menor peso técnico e a de
maior valor documental — o aviso é o registro explícito de que a "grande refatoração" anunciada
em 2020 nunca ocorreu.

## Responsabilidades

- Comparar a versão instalada com a última vista pelo usuário
- Renderizar o `CHANGELOG.md` num Webview de leitura quando a versão mudar
- Exibir o aviso de recrutamento enquanto não for silenciado
- Persistir os dois estados no armazenamento global do editor

## Regras de Negócio

- O CHANGELOG aparece uma única vez por versão 🟢
- O controle é a chave `vsckbLastKnownVersion` no armazenamento global 🟢
- O Webview do CHANGELOG é criado **sem scripts**, ao contrário do quadro 🟢
- O aviso reaparece enquanto a chave correspondente não valer exatamente `'3'` 🟢
- A opção "Later" não grava nada, por desenho: o aviso volta 🟢
- **Abrir o link externo com sucesso equivale a "não mostrar de novo"** 🟢
- Falha ao abrir o navegador faz o aviso reaparecer na ativação seguinte 🟢
- O estado é de escopo de **usuário**, não de workspace: vale para todos os projetos 🟢
- Falhas em qualquer das duas rotinas são engolidas e não impedem a ativação 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Exibir o CHANGELOG quando a versão instalada mudar | Should | Após atualizar, o CHANGELOG abre uma vez |
| RF-02 | Não repetir a exibição na mesma versão | Should | Reabrir o editor não mostra de novo |
| RF-03 | Renderizar o CHANGELOG sem scripts habilitados | Should | O Webview não executa JavaScript |
| RF-04 | Exibir o aviso enquanto não silenciado | Could | O aviso aparece na ativação |
| RF-05 | Silenciar o aviso ao escolher "Don't show again" | Could | O aviso não volta |
| RF-06 | Oferecer atalhos para a issue e para a página do autor | Could | Os links abrem no navegador |
| RF-07 | Não interromper a ativação em caso de falha | Should | Erro em qualquer rotina é silencioso |
| RF-08 | Carregar anúncios de fonte externa | Won't | 🟢 TODO sem ação desde 2020 |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência | Confiança |
|------|--------------------|-----------|-----------|
| Segurança | Webview do CHANGELOG com `enableScripts: false` | `extension.ts:328` | 🟢 |
| Segurança | `marked` chamado com `sanitize` e `mangle` (opções removidas em versões posteriores) | `extension.ts:333-339` | 🟢 |
| Robustez | Toda a rotina do CHANGELOG está sob `try/catch` com `finally` | `extension.ts:301-360` | 🟢 |
| Usabilidade | O aviso é exibido a cada ativação até ser silenciado | `announcements.ts:36-37` | 🟢 |

## Critérios de Aceitação

```gherkin
Dado que o usuário atualizou a extensão para uma versão nova
Quando o editor é aberto
Então o CHANGELOG é exibido uma vez
E a nova versão é registrada no armazenamento global

Dado que a versão registrada é igual à instalada
Quando o editor é aberto
Então o CHANGELOG não é exibido

Dado que o arquivo CHANGELOG.md não existe
Quando a extensão é ativada
Então nenhum erro é exibido e a versão ainda assim é registrada

Dado que o aviso nunca foi silenciado
Quando a extensão é ativada
Então o aviso é exibido com quatro opções

Dado o aviso exibido
Quando o usuário escolhe "Later"
Então nada é gravado e o aviso volta na próxima ativação

Dado o aviso exibido
Quando o usuário escolhe a primeira opção e o link abre com sucesso
Então o aviso é silenciado permanentemente

Dado o aviso exibido
Quando o usuário escolhe a primeira opção e o navegador falha ao abrir
Então o aviso volta na próxima ativação
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Exibir CHANGELOG por versão | Should | Comunicação de mudanças, sem impacto funcional |
| Não repetir na mesma versão | Should | Evita incômodo |
| Falha silenciosa | Should | Nenhuma das duas rotinas é essencial |
| Aviso de recrutamento | Could | Específico da situação do projeto em 2020 |
| Anúncios de fonte externa | Won't | TODO sem ação desde outubro de 2020 |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---|---|---|
| `src/extension.ts:301-360` | exibição condicional do CHANGELOG | 🟢 |
| `src/extension.ts:112` | constante `KEY_LAST_KNOWN_VERSION` | 🟢 |
| `src/announcements.ts:30-102` | `showAnnouncements` | 🟢 |
| `src/announcements.ts:20-21` | chave e valor de silenciamento | 🟢 |
| `src/extension.ts:363-367` | invocação na ativação | 🟢 |
| `CHANGELOG.md` | conteúdo exibido | 🟢 |
