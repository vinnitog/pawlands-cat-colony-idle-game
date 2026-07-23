# Fase 2 — Mundo explorável (plano técnico)

> Objetivo: transformar o Pawlands de um idle de telas em um **mundo
> caminhável** ao estilo do print 3 do Poke Idle World, porém **single-player**,
> com tema Cat-Sìth medieval e save local (sem backend, conforme o MVP).

## Duas realidades que mudam o plano (decidir antes de codar)

### 1. Nossos sprites são de vista LATERAL, não top-down
Os gatos do Cute Legends são *side-scroller* (andam para os lados, sem frames
de costas/frente). O print 3 é top-down com movimento em 4 direções. Opções:

- **(A) Top-down com personagem "lateral" que só espelha L/R** *(recomendado)* —
  o mapa é top-down, mas o gato é sempre desenhado de lado e vira ao andar.
  Muitos jogos stylized fazem isso. Reaproveita 100% do que temos (idle + run).
- **(B) Mundo em vista lateral** (town side-scroller) — coerente com os sprites,
  mas foge do "feeling" do print 3.
- **(C) Comissionar sprites 4-direções** — fiel ao print, custo de arte alto.

### 2. Precisamos de um TILESET (não temos)
O pack é só de personagens. Para chão/muros/prédios sem virar Frankenstein, o
ideal é um tileset **do mesmo artista (Elthen)** — a página do pack aponta
tilesets compatíveis. É uma dependência de asset a resolver (comprar/baixar +
checar licença), análoga ao que fizemos com os gatos.

## Stack de renderização

- **Recomendado: Canvas 2D próprio, leve** — sem dependência pesada nova (alinha
  com "sem over-engineering" do CLAUDE.md). Suficiente para tilemap + 1 gato +
  câmera + colisão.
- Alternativas: PixiJS (efeitos/perf, +dep), Phaser/Kaboom (motor completo, dep
  grande). Só se o Canvas puro apertar.

## Arquitetura

- **Estado do jogo (GameState) intacto.** O idle, save, offline continuam iguais.
- Novos módulos em `src/game/world/`:
  - `tilemap.ts` — dados do mapa (grid de tiles + camadas + colisão).
  - `renderer.ts` — desenha tiles + sprites no `<canvas>` (pixel-perfect).
  - `player.ts` — posição, velocidade, direção, animação (idle/run).
  - `camera.ts` — segue o jogador, respeita limites do mapa.
  - `interactions.ts` — zonas que, ao pisar/interagir, abrem telas existentes.
- **Ponte React ↔ Canvas:** um `WorldScreen.tsx` hospeda o `<canvas>` e roda o
  loop (`requestAnimationFrame`) por fora do React; usa o `GameProvider` para
  abrir os painéis (missões/melhorias/atividades) já prontos.
- **O mundo vira a "casa".** As Ordens/telas atuais continuam acessíveis: andar
  até o **Mural** abre Missões; a **Forja**, Melhorias; o **Portão de Caça**,
  Atividades. O mundo é a navegação; os sistemas idle são o conteúdo.

## Controles

- Desktop: WASD/setas.
- Mobile: d-pad na tela ou *tap-to-move*. (Responsivo, acessível.)
- Respeitar `prefers-reduced-motion` (sem shake/parallax exagerado).

## Milestones (single-player MVP)

| # | Entrega | Depende de |
|---|---|---|
| M0 | Decidir facing (A/B/C) + fonte do tileset | você |
| M1 | Canvas + tilemap estático de Grimalkin + câmera | tileset |
| M2 | Gato jogável: movimento + colisão + idle/run | M1 |
| M3 | Zonas de interação → abrem Missões/Melhorias/Atividades | M2 |
| M4 | Controles mobile + polish (luz/tocha, transições) | M3 |
| M5 | NPC com diálogo + flavor de Gemas/joalheiro | M3 |

## Fora de escopo (Fase 3, tier caro)
Multiplayer, chat mundial, mercado entre jogadores, contas/servidor autoritativo,
qualquer camada financeira. Isso é backend + anti-cheat — decisão de negócio, não
de código, e só depois do single-player provar o jogo.

## O que trava o início
1. **Facing** (A/B/C) — recomendo **A** (top-down + espelho L/R).
2. **Tileset** — precisa existir antes do M1. Recomendo tileset do Elthen
   (mesmo estilo). Sem ele, o M1 fica com placeholders feios.
