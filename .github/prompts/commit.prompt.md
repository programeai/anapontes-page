---
description: "Cria commits git atomicos com plano, aprovacao previa e sem coautoria do Copilot"
name: "commit"
argument-hint: "Contexto opcional: objetivo das mudancas ou preferencia de agrupamento"
agent: "agent"
---
Voce vai criar commits git para as alteracoes atuais do repositorio, seguindo este fluxo estrito.
Use o argumento do comando (se houver) como contexto adicional de prioridade/escopo.

Objetivo:
- Produzir commits pequenos, coerentes e reversiveis.
- Garantir aprovacao do usuario antes de gravar qualquer commit.
- Nao incluir atribuicao ao Copilot em nenhuma mensagem.
- Responder sempre no idioma da conversa atual.

Passo a passo obrigatorio:
1. Entender o que mudou:
   - Rodar `git status`.
   - Rodar `git diff` (e `git diff --staged` se necessario).
   - Identificar grupos logicos de mudanca.
2. Planejar commits:
   - Separar por historia funcional coerente.
   - Nao misturar refactor com mudanca funcional.
   - Nao misturar migration/schema com regra de negocio.
   - Nao misturar testes de camadas diferentes no mesmo commit, exceto quando o teste pertence diretamente ao codigo alterado.
3. Definir mensagens no formato Conventional Commits:
   - `<tipo>(<escopo>): <descricao curta no imperativo>`
   - Tipos permitidos: `feat`, `fix`, `refactor`, `test`, `chore`, `migration`, `docs`.
   - Escrever como se o proprio usuario tivesse escrito.
4. Mostrar plano e pedir confirmacao antes de executar:

   Plano de commits:
   --------------------------
   Commit 1: <mensagem>
     - <arquivo>
     - <arquivo>

   Commit 2: <mensagem>
     - <arquivo>
   --------------------------
   Total: <N> commits

   Pergunta obrigatoria:
   "Planejo criar <N> commit(s) com essas alteracoes. Podemos prosseguir?"

5. So depois da confirmacao:
   - Fazer `git add` apenas com caminhos especificos de cada commit (nunca `git add -A` e nunca `git add .`).
   - Criar os commits na ordem planejada.
   - Ao final, rodar `git log --oneline -n <N>` e mostrar o resultado relevante.

6. Push opcional (sempre perguntar):
   - Depois de criar os commits e mostrar o log, perguntar:
   "Deseja que eu faca push desses commit(s) para a branch atual?"
   - So executar push apos confirmacao explicita do usuario.

Regras criticas:
- Nunca adicionar `Co-Authored-By`.
- Nunca usar mensagens como "Generated with Copilot".
- Nunca reverter alteracoes que nao foram solicitadas.
- Se encontrar mudancas inesperadas durante o processo, parar e perguntar ao usuario como proceder.

Formato da resposta:
- Primeiro: plano de commits.
- Depois: pergunta de confirmacao.
- Apos confirmacao: resumo objetivo do que foi commitado e log final.
- Por fim: pergunta de push opcional.
