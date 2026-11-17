---
name: vanilla-dom-ui
description: Padrões de construção de interfaces responsivas em HTML5, CSS3 e JavaScript puro (Vanilla JS) sem frameworks externos.
---

# Skill: Interface Web em HTML5, CSS3 e JavaScript Puro (Vanilla JS)

## Regras Obrigatórias
1. **Zero Frameworks de UI:** Proibido o uso de React, Vue, Angular, Svelte ou bibliotecas equivalentes. Toda atualização de estado deve usar a API nativa do DOM.
2. **Tipografia Limpa:** Nunca aplicar `text-shadow` ou `filter: drop-shadow(...)` em elementos de texto. Utilizar contraste de cor, peso tipográfico (`700`/`800`) e pílulas de fundo sólidas.
3. **Rastreabilidade no Rodapé:** Exibir obrigatoriamente a Chave Única (`P26-3A-C938-E66F-589C-7FD7`) no elemento `<footer>` da aplicação.

## Regras aplicadas no Batalha Naval
- Células da malha são `<button>` com `aria-label`; DOM via `createElement`/`textContent`.
- Grid com unidades relativas; foco visível; `prefers-reduced-motion` respeitado.
- O cliente só renderiza o que o servidor devolve em `/api/status` e `/api/game/*`.
