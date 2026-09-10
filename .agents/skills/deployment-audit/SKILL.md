---
name: deployment-audit
description: Audita build e deploy de aplicações React/Vite com backend Node/Express em Google Cloud, Firebase App Hosting ou Cloud Run, validando runtime env, secrets, health checks e persistência.
---

# Deployment Audit

## Procedimento
1. Ler `package.json`, scripts de build/start e entrypoint do servidor.
2. Identificar o alvo real de deploy antes de criar arquivos novos.
3. Confirmar que o build do Vite gera `dist` e que o servidor de produção serve os assets esperados.
4. Separar variáveis públicas `VITE_*` de segredos server-side.
5. Nunca colocar API keys sensíveis em `VITE_*`.
6. Confirmar `PORT`, health check, startup e bind em `0.0.0.0`.
7. Verificar que dados duráveis não dependem do filesystem da instância.
8. Confirmar variáveis de runtime e secrets no serviço alvo.
9. Fazer smoke test de health e fluxo CRUD após rollout.
10. Documentar rollback para revisão anterior.

## Guardrail
Não execute deploy destrutivo ou mude projeto/serviço/branch sem confirmação explícita do operador.
