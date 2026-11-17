---
name: serverless-d1-discord
description: Diretrizes e padrões para implementação de Cloudflare Pages Functions com persistência relacional no Cloudflare D1 e autenticação Discord OAuth2.
---

# Skill: Arquitetura Serverless Cloudflare Functions + D1 + Discord OAuth2

## Regras Obrigatórias
1. **Validação na Borda:** Toda regra de negócio, pontuação, cronômetro ou verificação de permissão deve executar nas Cloudflare Pages Functions (`functions/api/*`).
2. **Queries Parametrizadas no D1:** Sempre utilizar `env.DB.prepare("...").bind(...)` para prevenir SQL Injection.
3. **Sessão Discord OAuth2:** Importar e validar `user_id`, `username` e `avatar` via fluxo OAuth2 do Discord, armazenando sessões assinadas em cookie `HttpOnly`.

## Regras aplicadas no Batalha Naval
- Validar no servidor: limites 10x10, tamanhos [5,4,3,3,2], sem sobreposição (`functions/_game.js`).
- A frota inimiga fica só no D1; a API devolve apenas `agua`, `acerto` ou `afundado`.
- OAuth2 com `state` em cookie HttpOnly; sessão `sid` na tabela `sessions`; consultas sempre com `bind`.
- Placar atualizado só quando o servidor detecta o fim da partida, via `env.DB.batch`.
