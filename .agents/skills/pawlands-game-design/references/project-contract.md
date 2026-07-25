# Contrato de design do Pawlands

## Fontes de verdade

Ler, conforme o escopo:

- `PROJECT_CONTEXT.md`: produto, stack e restrições do MVP;
- `docs/ROADMAP.md`: sequência macro;
- `docs/COLONY_PLAN.md`: roster e paralelismo;
- `docs/EXPEDITION_PLAN.md`: decisões E0–E4.

Em conflito, prevalece a decisão explícita mais recente do usuário. Não alterar
documentos nem código somente para fazê-los concordar; apontar a divergência.

## Pilares

- Idle/casual acolhedor, com progresso compreensível em sessões curtas.
- Fantasia de desenvolver uma colônia de gatos medievais.
- Cada gato deve ganhar função sem transformar o roster em microgerenciamento.
- O jogador volta por curiosidade e recompensa, não por medo de perder.
- Sistemas devem funcionar em PC e celular, com save local e progresso offline.
- O visual deve parecer jogo, evitando padrões de dashboard corporativo.

## Restrições do MVP

- React + Vite + TypeScript.
- Sem login, backend, banco remoto ou multiplayer.
- Estado autoritativo persistido localmente e migrado por schema.
- Dependências novas somente quando o ganho superar claramente o custo.
- Conteúdo e regras testáveis fora da interface sempre que possível.

## Decisões travadas da Expedição

- Caçada contínua com XP e loot acumulados em um saco limitado.
- Coleta voluntária; gato fraco rende mais devagar e não perde loot.
- Loot: troféus vendáveis, gemas raras e XP.
- Equipamento entra na E3.
- Poder:

  `attack * 2 + defense + level * 1.5 + equipmentPower`

- Eficiência:

  `clamp(power / zone.recommendedPower, 0.25, 1.5)`

- Zonas iniciais: Campos Sussurrantes, Bosque das Brumas e Ruínas de Grimalkin.
- Energia não é combustível da expedição no MVP atual.

## Integração com o fluxo

Esta skill decide regras e critérios. Quando houver implementação:

1. `pawlands-game-design`;
2. `senior-dev`;
3. `ui-ux-expert` se tocar front-end;
4. `code-reviewer`;
5. `qa-senior`;
6. `qa-automate`;
7. validação final;
8. commit em `develop`, push e PR para `main`.
