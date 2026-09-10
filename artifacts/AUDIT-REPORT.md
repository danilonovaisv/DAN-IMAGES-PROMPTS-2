# AUDITORIA TÉCNICA: DAN-IMAGES-PROMPTS-2

## Resumo
A causa mais provável da perda de prompts em produção é a seleção padrão de `filesystem` em `server/repositories/index.ts`. O projeto já possui um adapter Firestore funcional, mas `.env.example` mantém `PERSISTENCE_PROVIDER="filesystem"`. Em runtime stateless como Cloud Run, arquivos locais não constituem armazenamento durável.

## Evidências confirmadas
- React 19 + Vite 8 + TypeScript + Express 5.
- `src/App.tsx` recarrega prompts pela API, portanto a UI não é a fonte de verdade.
- `src/services/api.ts` centraliza CRUD em `/api/prompts`.
- `server.ts` inicializa `getPromptRepository()`.
- `server/repositories/index.ts` usa `PERSISTENCE_PROVIDER || 'filesystem'`.
- Existe `FirestorePromptRepository` e configuração de projeto/database Firebase.
- `.context/project-context.md` já registra que arquivos locais não são duráveis em Cloud Run.
- `tests/persistence.test.ts` valida reinícios apenas do repository filesystem em diretório local.
- Não foi encontrado workflow de deploy GitHub Actions do app; somente Dependabot aparece nos workflows consultados.

## Correção recomendada
1. Produção: `PERSISTENCE_PROVIDER=firestore`.
2. Remover fallback silencioso Firestore -> filesystem em produção.
3. Manter filesystem apenas para desenvolvimento/teste explicitamente.
4. Adicionar testes do factory de repository e comportamento fail-closed.
5. Validar credenciais/IAM e database ID no runtime.
6. Smoke test após rollout: create -> read -> nova instância/revisão -> read novamente.

## Segurança
`GEMINI_API_KEY` deve continuar exclusivamente server-side. Variáveis `VITE_*` são client-exposed no build Vite e não devem conter segredos.

## Deploy
O repositório contém build/start compatíveis com um serviço Node: `vite build` + bundle do servidor e `node dist/server.cjs`. O alvo exato configurado no AI Studio/Firebase precisa ser confirmado no console antes de disparar rollout.
