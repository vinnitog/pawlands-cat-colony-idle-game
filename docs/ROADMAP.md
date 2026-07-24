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
- [ ] Mais **missões/quests** e diálogos com gancho de missão.
- [ ] **Sons/feedback** (SFX de clique, colheita, compra) — precisa de assets.
- [ ] **Balanceamento** dos números do idle.
- [ ] Verificar **PWA instalável** + deploy GitHub Pages (workflow já existe).

## 🎯 Médio prazo (features maiores, single-player)
1. **Colônia de vários gatos** ⭐ — a promessa do nome. Recrutar gatos (sink de
   Gemas), cada um de uma classe, produzindo recursos. Maior salto de valor.
2. **Expedição idle no Além** ⭐ (inspirado no auto-hunt do Baiak Idle) — pelo
   portão, o gato caça sozinho ao longo do tempo e traz XP + loot. Dá uso ao
   ataque/defesa das classes. Zonas em tiers (fáceis→difíceis), gated por gear.
3. **Equipamento equipável** — arma/armadura com stats, de loot/loja/boss
   (não só +stat permanente). Ferreiro/joalheiro forjam/vendem gear.
4. **Loot tables** — expedições/atividades dropando itens variados pra vender.
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
