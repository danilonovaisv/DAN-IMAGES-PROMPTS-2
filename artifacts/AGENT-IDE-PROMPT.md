# PROMPT DE EXECUÇÃO: DAN-IMAGES-PROMPTS-2

## Missão
Audite e corrija o repositório DAN-IMAGES-PROMPTS-2 com foco em persistência durável dos prompts e deploy Google/Firebase/Cloud Run, usando o menor diff funcional possível.

## Estado confirmado antes da execução
- Stack: React 19, Vite 8, TypeScript, Express 5.
- O frontend usa `src/services/api.ts` como boundary HTTP para `/api`.
- O backend seleciona `PromptRepository` por `PERSISTENCE_PROVIDER`.
- O valor padrão atual é `filesystem`.
- Existe adapter `FirestorePromptRepository`.
- O ambiente de produção documentado usa Google AI Studio / Cloud Run.
- O filesystem do Cloud Run não deve ser tratado como armazenamento durável.
- `package.json` já contém `pnpm lint`, `pnpm test`, `pnpm build`.
- Existem testes de persistência para o adapter de filesystem, mas a persistência de produção com Firestore ainda precisa de validação específica.

## Ordem obrigatória
1. Leia `AGENTS.md`, `.context/project-context.md`, `.context/conventions.md` e as skills existentes em `.agents/skills/`.
2. Leia `server/repositories/index.ts`, `server/repositories/firestorePromptRepository.ts`, `server/repositories/filePromptRepository.ts`, `server.ts`, `.env.example`, `firebase-applet-config.json`, `firestore.rules`, `package.json` e `tests/`.
3. Antes de editar, registre causa provável, arquivos afetados e risco de regressão.
4. Não altere contratos `PromptItem` ou rotas REST sem necessidade comprovada.
5. Faça a persistência de produção falhar de forma segura: em produção Google/Cloud Run, não aceite fallback silencioso de Firestore para filesystem efêmero.
6. Configure/documente `PERSISTENCE_PROVIDER=firestore` para produção. Preserve `filesystem` como opção explícita para desenvolvimento local/testes.
7. Se a inicialização do Firestore falhar em produção, encerre o startup com erro acionável, sem migrar silenciosamente para filesystem.
8. Preserve a migração/seed existente, evitando sobrescrever registros de usuário.
9. Crie ou ajuste testes que cubram seleção do provider e comportamento de falha segura. Não faça testes dependerem de credenciais reais.
10. Revise `firestore.rules` e autenticação. Não exponha segredos nem mova `GEMINI_API_KEY` para `VITE_*`.
11. Audite o deploy real. Se o projeto usa App Hosting, Cloud Run ou configuração gerenciada pelo AI Studio, documente exatamente quais variáveis precisam ser configuradas no runtime. Não invente `firebase.json`, workflow ou Dockerfile se o deploy atual não exigir.
12. Atualize `AGENTS.md` e `.context/project-context.md` somente se o contrato operacional/persistência mudar.
13. Execute:
   - `pnpm install --frozen-lockfile` se o workspace estiver limpo e dependências precisarem ser instaladas
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
14. Registre separadamente comandos executados, resultados e verificações manuais pendentes.
15. Não faça deploy até confirmar projeto, serviço/backend e branch alvo. Quando confirmado pelo operador, faça deploy e smoke test de `/api/health` e CRUD persistente com reinício/revisão.

## Critérios de aceite
- Prompt criado em produção continua disponível após nova instância/revisão.
- Produção não usa filesystem como fallback silencioso.
- Build, typecheck e testes passam.
- `GEMINI_API_KEY` permanece server-side.
- O deploy usa provider durável e o health check não revela segredos.
- Documentação descreve a topologia real e o procedimento de rollback.
