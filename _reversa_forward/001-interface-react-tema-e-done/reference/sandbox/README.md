# Sandbox de verificação manual

Abra **esta pasta** como workspace no Extension Development Host, e não a raiz do projeto.

O roteiro de doze passos de `../../onboarding.md` §4 exclui um cartão (passo 10) e limpa a
coluna `Done` (passo 11). Rodá-lo sobre a raiz destruiria o quadro real do projeto, que tem
35 cartões e é o registro de trabalho dele.

O quadro daqui é fixture: nasceu para ser maltratado. Se ficar inconsistente, restaure com

```bash
git checkout -- _reversa_forward/001-interface-react-tema-e-done/reference/sandbox/.vscode/vscode-kanban.json
```

## O que cada cartão exercita

| Cartão | Para quê |
|---|---|
| 1, 2, 3 | Empate de prioridade: a ordem deve sair `emergency`, `bug`, genérico |
| 4 | `description` como string crua, a forma antiga do arquivo. Ao salvar, vira `{ content, mime }` — é o comportamento do legado, e o `diff` deve mostrar isso |
| 5 | Prioridade suja: `'5xyz'` vale 5 e o cartão fica acima dos de prio 3 |
| 6 | `issue` responde `is_bug` no filtro e recebe a cor genérica — divergência preservada |
| 7 | Markdown completo: diagrama Mermaid, bloco de código realçado, tabela, lista de tarefas com barra em 2 de 3, e link externo que deve pedir confirmação |
| 8 | `is_assigned_to("iago")` |
| 9 | `is_older(300)` |
| 10, 11 | Descartáveis: use nos passos 10 e 11 do roteiro |
| 12 | Cartão sem `description` e sem `details`: os dois editores de Markdown nascem vazios. Abra-o em **Edit** e escreva nos dois campos — foi o caso que faltava aqui quando o BUG-20260804-23SL colapsou o editor a 38 px de largura |
| sem `id` | RF-10 da feature `003`: cartão cujo campo `id` está **ausente do arquivo**. Não pode desenhar marcador algum — nem `[]`, nem `[undefined]`, nem `[null]` —, e o resto do cartão é pintado normalmente. Só se vê aqui: no editor, a normalização da carga preencheria o campo (RD-07) |
| `id` longo | RF-09 com RN-05: identificador de cinquenta e sete caracteres, na forma que `simpleIDs: false` produz. O cartão mostra `[…f6a7b8]`, com reticências e os seis últimos caracteres; o ponteiro sobre o marcador revela a cadeia inteira, e o diálogo de detalhes a escreve por extenso na linha `Identifier` |
| `id` repetido | RN-04: carrega o `id` `7`, o mesmo do cartão de **In Progress**. Os dois mostram `[7]` e **nenhum** sinal de repetição é desenhado. É a decisão registrada, não um defeito: a interface exibe o que está gravado |
