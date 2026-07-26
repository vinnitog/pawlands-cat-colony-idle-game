# Pawlands — Roadmap

> Documento vivo. Regra de trabalho: **sempre atacar o item mais simples e
> rápido de entregar primeiro**, em commits pequenos por etapa.

## ✅ Feito
- **Identidade:** redesign medieval, lore Cat-Sìth (`docs/LORE.md`), 5 classes
  (cavaleiro/arqueiro/mago/ninja/rei), tela de seleção de starter.
- **Mundo (Fase 2):** Grimalkin caminhável — tilemap, colisão, câmera, gato
  correndo, NPCs + diálogo (Vittorio, Aldric, Rei Grimalkin), lojas (joalheiro +
  forja), lago + pescaria, bosque, painel de time, status de atividade, salvar
  posição, terreno melhorado.
- **Economia:** Gemas (ganho raro + missões), sinks nas lojas.
- **Loop idle base:** atividades, melhorias, missões, inventário, save local +
  progresso offline.
- **Bônus diário:** uma atividade em destaque por dia (rotação determinística
  por dia UTC) rende **XP em dobro + chance extra de gema**, com selo no card.
  O bônus é decidido pelo dia de início (honrado mesmo concluindo offline).

## 🔜 Curto prazo (polish — dá pra fazer sozinho, ordem de simplicidade)
- [x] Pesca com **bônus no lago** — pescar no Lago de Grimalkin (mundo) rende
      **+50% peixe e +25% XP** vs. iniciar `Pescar` pela tela. Flag `atLake`
      persiste no save.
- [x] Mais **missões/quests** e diálogos com gancho de missão — 5 novas missões
      (13 no total), 3 encomendadas por NPCs (Vittorio/Aldric/Rei Grimalkin) com
      chip "Pedido de" no card e status vivo da quest na fala/loja do NPC.
- [ ] **Sons/feedback** (SFX de clique, colheita, compra) — precisa de assets.
- [x] **Balanceamento** dos números do idle — 1ª passada: Pescar 10→8 min
      (era a pior atividade core por minuto) e Caixa de Papelão nv3 exige 1
      caixa em vez de 2 (paredão de grind de um recurso raro do Explorar).
- [ ] Verificar **PWA instalável** + deploy GitHub Pages (workflow já existe).

## 🎯 Médio prazo (features maiores, single-player)
1. ✅ **Colônia de vários gatos** — ENTREGUE (fases C0→C4 em
   `docs/COLONY_PLAN.md`): roster + migração, regen passiva, recrutamento por
   gemas (curva 10→115), atividades paralelas por gato, gatos ociosos
   perambulando por Grimalkin e tela Colônia com arte medieval.
2. ✅ **Expedição idle no Além — ENTREGUE (E0→E4)** ⭐ — pelo portão, o gato
   caça sozinho e acumula XP + loot. Cinco zonas, progresso offline com cap,
   rendimento por poder sem punição, troféus vendáveis, gemas e arte própria.
   📋 Plano em
   `docs/EXPEDITION_PLAN.md` (decisões: caçada contínua, rendimento por
   poder sem punir, loot = troféus vendáveis + gemas). **Inclui o equipamento
   (E3)** — o poder do gato soma atributos + gear.
3. ✅ **Equipamento equipável — ENTREGUE (E3)** — arma/armadura
   com `power`, vendidas pelo ferreiro e dropadas em expedições.
4. ✅ **Loot tables de expedição — ENTREGUE (E4)** — seis troféus com
   probabilidades por zona e venda individual/em lote no inventário.
5. **Mais mundo** — novas zonas/mapas além do pátio.

## 💡 Ideias emprestadas do Baiak Idle (idle-RPG auto-hunt)
- ✅ **Bônus diário** — atividade turbinada do dia (retenção barata). *(feito)*
- ✅ **Métricas de eficiência** (XP/min por atividade) pra o jogador otimizar. *(feito)*
- **Bosses** e **prestígio/rebirth** — longo prazo, depois de ter combate.
- **MMO** (mercado/guilda/PvP/ranking) — Fase 3 (tier caro).

## 💳 Dependem do usuário (asset/compra)
- **Pistoleiro** (6ª classe) — arte real (editar `.aseprite` ou comissão).
- **Tileset do Elthen** — acabamento premium do terreno (US$10, download).

## 🔒 Longo prazo / decisão de negócio (Fase 3)
Multiplayer com economia e servidor (o modelo do Poke Idle World): contas,
backend autoritativo, mercado entre jogadores, anti-cheat, cripto opcional.
Tier caro (meses + infra + risco). Recomendação: **provar o single-player
primeiro**. Ver `docs/PHASE2_PLAN.md`.

## Bifurcação
O jogo hoje é um idle single-player sólido com mundo caminhável. Maior valor
imediato = **Colônia de vários gatos**. Combate e multiplayer vêm depois.

## Conclusão da crônica atual

Ao reivindicar todas as missões e levar todas as melhorias ao nível máximo,
o jogador conclui a **crônica atual**. O MVP reconhece esse marco nas telas de
Missões e Melhorias, sem resetar o save, conceder recompensa adicional ou
interromper atividades e expedições.

Um capstone narrativo jogável deve chegar junto de uma expansão de conteúdo.
Prestígio/rebirth permanece adiado até existirem combate, curva de endgame e
recompensa permanente suficientes para justificar um reset voluntário.

## Grimalkin visual

- [x] **G0 — auditoria e planta:** contrato do mapa, distritos e critérios
      documentados em `docs/GRIMALKIN_VISUAL_PLAN.md`.
- [x] **G1 — cidade-fortaleza Tiny Town:** mapa 24×16 recomposto com muralhas,
      portão sul, eixo cívico, distritos, casas, caminhos e posição salva segura.
- [x] **G2 — profundidade e atmosfera:** y-sort, sombras, água, luz e névoa,
      seguidos de playtest visual.
- [ ] **G3 — expansão premium:** avaliar Elthen, personagens em quatro direções,
      interiores e novos distritos/mapas.
