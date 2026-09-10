---
name: persistence-production
description: Audita e corrige persistência de dados em apps Node/Express executados em runtimes stateless, especialmente Cloud Run, garantindo provider durável e fail-closed em produção.
---

# Persistence Production

## Use quando
A aplicação grava dados em arquivos locais, perde dados após restart/redeploy, possui adapters filesystem/database, ou roda em infraestrutura stateless.

## Procedimento
1. Mapear o boundary de persistência e todos os adapters.
2. Identificar como o provider é selecionado por ambiente.
3. Confirmar se o runtime alvo possui filesystem durável.
4. Em produção stateless, exigir provider externo durável.
5. Proibir fallback silencioso para filesystem quando o provider durável falhar.
6. Preservar filesystem somente para dev/test quando explicitamente selecionado.
7. Validar seed/migration para não sobrescrever dados existentes.
8. Criar testes de seleção de provider e falha segura sem credenciais reais.
9. Verificar concorrência e operações atômicas em contadores/updates.
10. Atualizar documentação operacional quando o provider de produção mudar.

## Saída
Relate causa raiz, diff mínimo, validações executadas, risco residual e passos de rollout/rollback.
