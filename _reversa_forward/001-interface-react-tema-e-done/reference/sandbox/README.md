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
