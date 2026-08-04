# Delta de dados: número do cartão visível na interface

> Identificador: `003-numero-visivel-do-cartao`
> Data: `2026-08-04`
> Modelo de referência: `_reversa_sdd/data-dictionary.md`, `_reversa_sdd/erd-complete.md`

## 1. Veredito

**Nenhuma mudança no modelo de dados.** Nenhum campo nasce, muda de tipo, muda de valor
padrão ou desaparece. O arquivo `.vscode/vscode-kanban.json` gravado depois desta feature é
idêntico ao que seria gravado antes, para qualquer entrada.

A feature lê um campo que já existia e que a interface não lia. É a diferença entre alterar o
modelo e alterar quem o consulta.

## 2. O campo em questão

| Campo | Onde vive | Tipo | Obrigatório | O que muda |
|-------|-----------|------|-------------|------------|
| `id` | Cada cartão, em qualquer das quatro colunas | Cadeia de caracteres | Não, no arquivo; sim, depois da carga | **Nada.** Passa a ser exibido |

Duas formas, decididas pela configuração `simpleIDs`, e nenhuma delas muda
(`_reversa_sdd/domain.md#3.2 Cartões`, RD-08):

| Forma | Exemplo | Comprimento típico | Como a feature a exibe |
|-------|---------|--------------------|------------------------|
| Simples (padrão) | `"5"`, `"42"` | 1 a 4 caracteres | Íntegra: `[5]` |
| Longa (`simpleIDs: false`) | `"20260804123456_412345678_a1b2c3d4e5f6a7b8"` | ~57 caracteres | Encurtada: `[…f6a7b8]` |
| Textual, escrita à mão | `"revisao-final"` | qualquer | Íntegra se tiver até oito caracteres; encurtada acima disso |
| Ausente ou vazia | — | — | Sem marcador algum (RF-10) |

A forma textual não é hipótese ociosa: `findNextSimpleCardId` a ignora ao calcular o maior
número (`src/boards.ts:1040-1056`), o que é precisamente a origem da não-unicidade admitida em
RN-04. A regra do marcador, por isso, trata o `id` como texto do começo ao fim, e não tenta
convertê-lo a número.

## 3. Estrutura nova, e onde ela **não** está

A feature acrescenta uma função pura, não um dado:

```
cardNumberLabel(id?: string): string | undefined
```

Ela deriva texto de exibição a partir do campo. Não guarda estado, não entra no cartão, não
viaja pela ponte, não é gravada. Um cartão em memória depois desta feature tem exatamente os
mesmos campos que tinha antes.

Em particular, o marcador **não** é acrescentado ao objeto do cartão, o que seria a saída
tentadora e errada: um campo derivado dentro do cartão precisaria ser retirado antes de
gravar, exatamente como o `__uid` precisa hoje (`src/webview/domain/identity.ts:5-7`), e
acrescentaria um segundo campo efêmero a esquecer.

## 4. Migração

Nenhuma. Não há dado a converter, nem quadro a reescrever, nem passo de atualização a rodar.
Um quadro escrito por qualquer versão anterior abre nesta sem tratamento, e um quadro escrito
por esta abre em qualquer versão anterior do mesmo modo.

## 5. Compatibilidade retroativa

| Situação | Comportamento |
|----------|---------------|
| Quadro de versão anterior, cartões com `id` simples | Todos os cartões passam a mostrar o número. É o caso corrente |
| Quadro com `simpleIDs: false` gravado antes | Cartões mostram os seis últimos caracteres, com o valor integral no balão e no diálogo |
| Quadro editado à mão, com cartão sem `id` | No editor, a extensão preenche o campo na carga (RD-07) e o cartão mostra o número atribuído. Na pré-visualização, que não normaliza, o cartão aparece sem marcador |
| Quadro com dois cartões de mesmo `id` | Ambos mostram o mesmo número, sem sinal de repetição (RN-04) |
| Folha de estilo do usuário escrita contra a interface 1.33.1 | Continua valendo. O marcador é elemento novo, com classe nova; nada foi renomeado nem removido |

## 6. Rastreabilidade

| Regra do legado | Origem | Como esta feature se relaciona |
|-----------------|--------|-------------------------------|
| RD-07 — todo cartão recebe `id` na carga, se não tiver | `_reversa_sdd/domain.md#3.2 Cartões` | Consumida, não alterada. É o que faz o marcador aparecer quase sempre no editor |
| RD-08 — por padrão o `id` é inteiro sequencial | idem | Consumida. Decide qual das duas formas de exibição se aplica |
| RD-12 — um cartão referencia outros por `references` | idem | Não tocada. O vínculo continua sem desenho, pelo cartão `[13]` |
| RD-33 — nome do arquivo Markdown exportado | `_reversa_sdd/domain.md#3.6 Exportação` | Não tocada, por decisão da sessão de esclarecimento de 2026-08-04 |
