# Colônia de vários gatos — plano técnico

> A feature-âncora: cumprir a promessa do nome (*Cat Colony Idle*). Vários gatos
> na colônia, cada um designado a uma atividade **em paralelo** — o multiplicador
> idle de verdade. Single-player, save local, sem backend (segue o MVP).

## Decisões travadas (com o usuário)
1. **Modelo de valor:** atividades **paralelas** — cada gato pode estar em uma
   atividade ao mesmo tempo. N gatos ≈ N× produção idle.
2. **Energia:** **regen passiva no tempo** para todos os gatos. `Dormir` vira
   acelerador opcional. Evita microgerenciar sono de N gatos.
3. **Recrutamento:** **gemas, classe aleatória** (gacha leve). Sink premium de
   Gemas, custo escalando por gato.

## Modelo de dados (a mudança central)

Hoje o jogo assume **um** gato: `state.cat` + um único `state.activeActivity`.

```
// Antes
GameState { cat: Cat; activeActivity: ActiveActivity | null; ... }

// Depois
GameState {
  cats: Cat[];              // roster da colônia
  leaderId: string;         // quem anda no mundo / é a "cara" do jogo
  ...
}
Cat {
  id, name, catClass, level, xp, energy, maxEnergy, stats,
  activity: ActiveActivity | null;   // atividade fica NO gato (colocada)
}
```

- **Recursos, inventário e Gemas continuam um pool compartilhado** da colônia
  (um tesouro só). **Por gato:** energia, XP, nível, stats e a atividade atual.
- `leaderId` referencia um `Cat.id` do roster. O mundo desenha o líder.

### Migração v1 → v2 (não perder saves)
- Bump `saveSchemaVersion` 1 → 2. `migrateGameSave` ganha um caminho real de
  upgrade (hoje ele descarta saves de versão diferente).
- v1→v2: `cats = [oldCat]`, `leaderId = oldCat.id`,
  `oldCat.activity = oldState.activeActivity`. Comportamento idêntico com 1 gato.
- Guardas de robustez: roster nunca vazio; `leaderId` sempre aponta para um gato
  existente (senão cai no `cats[0]`).

## Refatoração dos sistemas

| Sistema | Mudança |
|---|---|
| `activitySystem` | `startActivity(state, catId, activityId, now, opts)` e `completeCatActivity(state, catId, ...)`. XP/energia vão para **aquele** gato; recursos para o pool. |
| `levelSystem` | `addXpToState` → `addXpToCat(state, catId, xp)`. |
| `offlineSystem` | percorre **todos** os gatos: aplica regen de energia + completa a atividade concluída de cada um (hoje completa só uma). |
| `missionSystem` | `catLevel` passa a olhar o **maior nível** do roster (mantém missões alcançáveis). `activitiesCompleted` já é um total global. |
| `upgradeSystem` | bônus continuam **da colônia** (globais). Sem mudança de lógica. |
| `energia` | novo: `ENERGY_REGEN_PER_MIN`; aplicado por tick ativo e no catch-up offline, com teto em `maxEnergy`. |

## Recrutamento (gemas, classe aleatória)

- Novo local no mundo: **Refúgio de Grimalkin** (um novo letreiro/NPC), abre a
  tela **Colônia**.
- `recruitCat(state, random)`: custo em Gemas escalando com o tamanho do roster
  (ex.: `custo(n) = base + passo * (n - 1)`, começando no 2º gato). Sorteia
  classe entre as 5 e um nome de um pool temático; stats iniciais = base da classe.
- **Teto** de roster (ex.: 8 gatos) por sanidade de UI/perf e curva de custo.
- Pool de nomes temáticos (Cat-Sìth/medieval) em `src/game/data/catNames.ts`.

## UI

- **Tela Colônia** (hub novo): cards de gato — retrato, nome, classe, nível,
  barra de energia, atividade atual + timer. Ações por card: **Designar
  atividade**, **Tornar líder**. Botão **Recrutar** (mostra custo em Gemas).
- **Designar atividade:** a partir do card do gato, abre a lista de atividades
  (reusa `ActivityCard`, agora ciente do gato). Bônus diário e pesca do lago
  seguem valendo por atividade.
- **Mundo:** o líder anda como hoje. O **Portão do Além** abre a Colônia (ou a
  lista de atividades já no contexto do líder). *Polish futuro:* gatos ociosos
  perambulando pelo pátio como ambiente.
- **Recompensas paralelas:** várias conclusões ao mesmo tempo → **fila** de
  avisos (ou um aviso agregado "3 gatos voltaram"). Ajuste no `gameProvider`.

## Fases (milestones)

| # | Entrega | Visível? | Status |
|---|---|---|---|
| **C0** | Refator do modelo: roster + `leaderId` + `Cat.activity` + migração v1→v2, **preservando 100%** o comportamento de 1 gato. Testes atuais verdes. | Não | ✅ feito |
| **C1** | Regen passiva de energia + offline percorrendo todos os gatos. | Sutil | ✅ feito |
| **C2** | Recrutamento (sink de gemas, classe aleatória) + tela Colônia (visualizar + trocar líder). | Sim | ✅ feito |
| **C3** | Designar atividades por gato → **paralelismo ao vivo** (o multiplicador). Aviso agregado ("N gatos voltaram"), offline colhe todos. | Sim | ✅ feito |
| **C4** | Polish: gatos ambiente no mundo, **rebalanço** (renda paralela multiplica — revisar custos). | Sim | pendente |

> **Estratégia de menor risco:** C0 é uma refatoração *invisível e comportamento-
> preservante* — sai com todos os testes atuais verdes antes de qualquer feature
> nova. Só depois empilhamos C1→C4, cada uma em seu commit.

## Riscos e mitigação
- **Refator amplo** (activity/level/offline/missions/provider/UI): mitigado por
  fazer C0 sem mudança de comportamento e com a suíte de testes como rede.
- **Balanceamento:** atividades paralelas multiplicam a renda — provável rescala
  de custos de upgrades/missões numa passada após C3 (previsto no C4).
- **UX de recompensas simultâneas:** resolver com fila/agregação (C3/C4).
- **Performance:** N pequeno (teto ~8); ticks por segundo são triviais.

## Fora de escopo (continua Fase 3, tier caro)
Multiplayer, contas, servidor autoritativo, mercado entre jogadores, qualquer
camada financeira. Combate/equipamento e Expedição no Além seguem como trilhas
próprias do médio prazo (ver `ROADMAP.md`), independentes da colônia.
