---
name: teste-validacao
description: Protocolo do Agente de Teste e Validação para auditar segurança no servidor, integridade no banco D1 e aderência à rubrica de 100 pontos.
---

# Skill: Agente de Teste e Validação

## Checklist de Verificação Obrigatória
1. **Isolamento de Subpasta:** Confirmar que todos os arquivos do projeto residem exclusivamente dentro de `P26-3A-C938-E66F-589C-7FD7/`.
2. **Teste Anti-Manipulação:** Verificar que chamadas `POST`/`PUT`/`PATCH` para `/api/*` rejeitam payloads inválidos ou não autenticados com códigos HTTP adequados (`400`, `401`, `403`, `409`).
3. **Conformidade de Entrega:** Executar `node validar-local.mjs P26-3A-C938-E66F-589C-7FD7` na raiz do repositório e assegurar 100% de aprovação nos itens determinísticos.

## Checklist adicional (Batalha Naval)
- `node tests/smoke.mjs <URL>` deve passar 100%.
- `game/new` rejeita navio fora da malha, sobreposto ou com tamanho errado (400).
- `game/fire` rejeita coordenada inválida (400) e tiro repetido (409).
- Respostas da API nunca contêm a frota inimiga enquanto a partida está ativa.
