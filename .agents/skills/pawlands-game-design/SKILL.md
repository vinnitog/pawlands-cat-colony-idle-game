---
name: pawlands-game-design
description: Projeta e revisa sistemas de game design específicos de Pawlands, cobrindo core loop idle, progressão, economia, expedições, atributos, equipamento, loot, balanceamento, progresso offline, persistência, game UI/UX e game feel. Use neste projeto antes da implementação quando uma ideia, feature ou ajuste alterar mecânicas, recompensas, custos, ritmo, desbloqueios, save schema ou experiência de jogo; não use para bugs puramente técnicos nem para styling gráfico sem impacto em mecânica ou game feel.
---

# Pawlands Game Design

Transformar uma ideia em regras mensuráveis e compatíveis com o jogo antes de
entregar a implementação ao fluxo de desenvolvimento.

## Fluxo obrigatório

1. Confirmar o workspace e ler `AGENTS.md`, `PROJECT_CONTEXT.md` e o plano da
   feature afetada.
2. Ler [project-contract.md](references/project-contract.md) em toda tarefa.
3. Classificar o impacto:
   - progressão, economia, recompensas ou offline:
     ler [idle-economy.md](references/idle-economy.md);
   - atributos, equipamento, save, UI ou feedback:
     ler [system-quality.md](references/system-quality.md).
4. Separar decisões já travadas de decisões ainda abertas. Não reabrir uma
   decisão travada sem pedido explícito do usuário.
5. Produzir um brief de design curto:
   - objetivo do jogador;
   - verbo ou decisão repetida;
   - entradas, saídas e cadência;
   - fórmula e parâmetros ajustáveis;
   - desbloqueio e limites;
   - estado persistido e migração;
   - feedback visível;
   - riscos e casos de teste.
6. Calcular ou simular os pontos sensíveis. Nunca aprovar balanceamento apenas
   por impressão.
7. Se o usuário pediu código, entregar o brief ao `senior-dev` e seguir todo o
   fluxo de revisão e QA definido em `AGENTS.md`.

## Regras de decisão

- Preservar React + Vite + TypeScript e save local enquanto o escopo continuar
  single-player e offline-first.
- Tratar atributos-base, itens e progresso como dados autoritativos; recalcular
  poder, eficiência e outros valores derivados.
- Preferir tabelas de conteúdo e funções puras a regras espalhadas na UI.
- Toda fonte econômica precisa de um sumidouro ou limite compreensível.
- Toda espera precisa mostrar progresso, capacidade e próxima recompensa.
- Recompensar retorno sem transformar ausência em punição.
- Usar caps e retornos decrescentes antes de remover recompensa já conquistada.
- Manter a interface com aparência de jogo medieval felino, não de dashboard.
- Escalar feedback pela raridade: ação comum discreta, marco forte, drop raro
  memorável.
- Registrar suposições quando faltarem metas de tempo ou dados de playtest.

## Verificação mínima de balanceamento

Para qualquer fórmula de rendimento, custo ou poder:

1. Avaliar pelo menos um estado inicial, um intermediário e um avançado.
2. Comparar ganho por minuto/hora e tempo até o próximo objetivo.
3. Calcular o valor esperado de loot aleatório.
4. Verificar efeitos de múltiplos gatos e progresso offline no mesmo período.
5. Procurar loops que se autoaceleram sem limite.
6. Transformar cada risco relevante em teste automatizado ou cenário manual.

## Formato da resposta de design

Entregar nesta ordem:

1. **Decisão:** proposta recomendada em poucas linhas.
2. **Modelo:** estados, fórmulas e parâmetros.
3. **Economia e ritmo:** fontes, sumidouros, caps e metas de tempo.
4. **Persistência e UX:** o que salvar e o que o jogador precisa enxergar.
5. **Validação:** cenários numéricos e testes.
6. **Fora de escopo:** o que fica para outra fase.

Evitar documentação extensa quando uma tabela ou três cenários numéricos
resolvem a decisão.

## Inspirações

Esta skill adapta princípios das skills `rpg`, `save-systems`, `game-ui-ux` e
`game-feel` do projeto Apache-2.0
[awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)
ao contexto React/TypeScript e idle de Pawlands.
