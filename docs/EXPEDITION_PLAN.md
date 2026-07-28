# Expedição idle no Além — plano técnico

> Pelo Portão do Além, um gato caça sozinho ao longo do tempo e traz XP + loot.
> Dá função real ao ataque/defesa (hoje quase decorativos) e à progressão de
> equipamento. Single-player, save local, sem backend.

## Decisões travadas (com o usuário)
1. **Formato: caçada contínua.** O gato fica caçando indefinidamente e vai
   **acumulando** XP e loot num "saco", com teto (offline cap). Você volta
   quando quiser e coleta. É o auto-hunt do Baiak Idle, e o que mais diferencia
   das atividades atuais.
2. **Risco: rendimento menor, sem punir.** Poder do gato vs. dificuldade da zona
   define a **velocidade** do loot; gato fraco caça devagar, nunca perde nada.
   → **Poder inclui equipamento**, não só atributos (condição do usuário).
3. **Loot: XP + troféus vendáveis + gemas raras.** Troféus do Além (itens novos)
   vendidos por moedas, + XP para o gato, + chance rara de gema. Alimenta a
   economia atual e abre caminho para o equipamento.

## Poder do gato

```
power(cat) = atributos + equipamento
           = (attack*2 + defense + level*1.5) + equipPower(cat)
```

- `equipPower` soma o `power` das peças equipadas (arma + armadura).
- A fórmula reserva o termo de equipamento **desde a E0**; as peças chegam na
  fase E3. Até lá `equipPower = 0` e o poder é só de atributos.

## Núcleo: caçada contínua

- Enviar um gato a uma **Zona** ocupa o gato (como uma atividade — não pode fazer
  outra coisa). Estado novo em `Cat.expedition` (separado de `Cat.activity`).
- O gato acumula **"pulsos de caça"** ao longo do tempo:
  `basePulses = floor((timeCarryMs + elapsedMs) / PULSE_MS)` e
  `pulsos = basePulses * efficiency`, com teto `EXPEDITION_CAP`.
- `efficiency = clamp(power / zone.recommendedPower, 0.25, 1.5)` — fraco rende
  devagar (mín. 0.25), forte tem teto suave (1.5) para não trivializar.
- **Coletar** a qualquer momento: converte os pulsos acumulados em recompensa
  (XP + rolagens da loot table), esvazia o saco e traz o gato para casa.
- Frações são preservadas por gato e zona em dois carries independentes:
  milissegundos abaixo de um pulso-base e pulsos efetivos abaixo de uma rolagem.
  Assim, várias coletas curtas equivalem a uma coleta longa e não permitem
  reroll. Ao atingir o teto do saco, não existe overflow oculto.
- **Offline**: no load, avança o saco por `elapsed` (respeitando o cap). Reusa o
  arcabouço de `processOfflineProgress`.
- **Energia**: no MVP a expedição **não** drena energia (o teto de tempo é o
  limitador), mas o gato ocupado também não regenera. Revisitar no balanceamento
  — energia como combustível é candidata.

Parâmetros iniciais da E1: `PULSE_MS = 5 min` e `EXPEDITION_CAP = 96` pulsos
efetivos, equivalentes a 8 horas na eficiência nominal `1.0`.

## Zonas (tiers)

`src/game/data/zones.ts`:

| Zona | Poder recomendado | Desbloqueio | Sabor |
|---|---|---|---|
| Campos Sussurrantes | 6 | inicial | ratos-fantasma, sardinhas espectrais |
| Bosque das Brumas | 14 | nível 4 de um gato | penas do Além |
| Ruínas de Grimalkin | 26 | 5 coletas nos Campos | relíquias, gema rara |
| Pântano das Almas | 40 | 5 coletas nas Ruínas | amuletos e ossos antigos |
| Limiar do Eclipse | 60 | 8 coletas no Pântano | fragmentos do eclipse |

- Zona tem `recommendedPower`, `unlock`, `lootTable`, `xpPerPulse`.
- Loot table = lista de `{ item, chancePorPulso, quantidade }` + `gemChance`.

## Loot / troféus

- Novos itens vendáveis (ex.: `spectralSardine`, `phantomFur`, `grimaldeRelic`)
  no `Inventory`/`SpecialItemKey`, vendidos por moedas (nova ação de venda, ou
  o joalheiro compra). Bump de schema para o inventário estendido.
- Chance rara de **gema** e, a partir da E3, chance rara de **peça de gear**.

### Loot rico e venda (E4)

| Zona | Troféus por pulso | XP/pulso | Gema/pulso |
|---|---|---:|---:|
| Campos Sussurrantes | Sardinha Espectral 18% (1–2) | 2 | 0,2% |
| Bosque das Brumas | Pelo Fantasma 14% (1–2); Sardinha 3,5% | 4 | 0,4% |
| Ruínas de Grimalkin | Relíquia 10%; Pelo 4,5%; Talismã de Osso 1,8% | 7 | 0,8% |
| Pântano das Almas | Amuleto de Alma 7,5%; Talismã 3,5%; Relíquia 2,5% | 10 | 1,0% |
| Limiar do Eclipse | Fragmento do Eclipse 5,5%; Amuleto 3%; Talismã 2% | 14 | 1,2% |

- Troféus podem ser vendidos individualmente ou em lote no inventário.
- A venda aceita apenas IDs de troféu, nunca gear ou itens especiais, atualiza
  moedas/totais/missões e falha sem mutar o estado quando a quantidade é zero.
- Valores unitários: Sardinha 8, Pelo 18, Relíquia 45, Talismã 65, Amuleto 90
  e Fragmento do Eclipse 140 moedas.
- As peças raras da E3 continuam exclusivas do Bosque e das Ruínas; as duas
  zonas novas não adicionam gear nesta fase.

## Equipamento (E3 — satisfaz "poder inclui equipamento")

- `Cat.equipment: { weapon: GearId | null; armor: GearId | null }`.
- `GearDef { id, name, slot, power, tier, price, origin, art }` em
  `src/game/data/gear.ts`.
- **Fontes:** ferreiro (Aldric) vende tiers básicos por moedas/gemas; expedições
  dropam peças raras (ponte para a feature "loot tables" do roadmap).
- Equipar/desequipar no card do gato (tela Colônia) ou numa aba de equipamento.
- `equipPower(cat)` entra na fórmula de poder → melhora a eficiência nas zonas.

### Parâmetros fechados da E3

| ID | Nome | Slot | Tier | Poder | Origem |
|---|---|---|---|---:|---|
| `ironClaw` | Garra de Ferro | arma | básico | +2 | Aldric, 100 moedas |
| `guardArmor` | Armadura do Guarda | armadura | básico | +2 | Aldric, 140 moedas |
| `mistFang` | Presa da Bruma | arma | raro | +5 | Bosque das Brumas, 0,15% por pulso |
| `grimaldeAegis` | Égide de Grimalde | armadura | raro | +4 | Ruínas de Grimalkin, 0,10% por pulso |

- O inventário guarda somente peças **não equipadas**, como contagens por
  `GearId`. Cada slot do gato guarda apenas o ID equipado.
- Equipar consome uma unidade do inventário; trocar devolve a peça anterior;
  desequipar devolve a peça ao inventário.
- Trocas só podem ocorrer com o gato em casa, sem atividade ou expedição.
- O poder continua derivado em runtime e nunca é persistido:
  `(attack*2 + defense + level*1.5) + soma do power equipado`.
- A loja aceita custos em moedas e gemas. Os itens antigos continuam usando
  gemas; as duas peças básicas usam moedas.
- O save sobe de v3 para **v4**. Migrações v1/v2/v3 criam slots vazios e
  contagens zero; saves v4 sanitizam IDs incompatíveis com cada slot.

## Fases

| # | Entrega | Visível? |
|---|---|---|
| **E0** | Modelo (`Cat.expedition`, zonas, troféus), `getCatPower()` com termo de equip zerado, migração de schema. | Não |
| **E1** | Motor da caçada contínua: acúmulo por tempo, eficiência por poder, coleta, offline cap. Testado headless. | Não |
| **E2** | Tela Expedição pelo Portão do Além: escolher zona, enviar gato, ver progresso/saco, coletar. Arte medieval. | Sim |
| **E3** | Equipamento: gear, equipar, ferreiro vende, poder inclui equip, drop raro de gear. | Sim |
| **E4** | Loot tables ricas + venda de troféus + balanceamento; Pântano das Almas e Limiar do Eclipse. | Sim |

E0→E4 está entregue. A E4 preserva `PULSE_MS = 5 min`, cap de 96 pulsos e a
eficiência entre 0,25 e 1,5; portanto não reabre as decisões travadas do loop.

## Balanço da E4

Na eficiência nominal 1,0 (12 pulsos/h), o valor esperado dos troféus e o XP
ficam:

| Zona | Moedas esperadas/h | XP/h |
|---|---:|---:|
| Campos Sussurrantes | 25,9 | 24 |
| Bosque das Brumas | 48,7 | 48 |
| Ruínas de Grimalkin | 77,8 | 84 |
| Pântano das Almas | 121,8 | 120 |
| Limiar do Eclipse | 140,4 | 168 |

O cap nominal permanece em 8 horas. Esses números são uma **hipótese inicial de
playtest**, não uma promessa de economia final: medir tempo até desbloqueio,
frequência de coleta, valor efetivo por poder e sensação dos drops raros.
Também observar a escala multi-gato e o endgame, pois expedições paralelas podem
ampliar a renda total mesmo com o teto individual.

> **Menor risco primeiro:** E0/E1 são pura lógica com a suíte de testes como
> rede (como foi a C0 da colônia). UI só na E2.

## Integração com o que já existe
- Reusa: roster + `updateCat`, padrão de recompensa (`RewardBundle`,
  `mergeRewardBundles`), offline, energia passiva, `describeQuestStatus`-style.
- Um gato em expedição conta como **ocupado** (não perambula, não faz atividade).
- Missão nova possível: "traga X troféus" (gancho com o motor de missões atual).

## Riscos
- **Escopo:** épico grande. Mitigado pelo fatiamento E0→E4, cada fase num commit.
- **Balanceamento:** renda contínua + paralela (N gatos em N zonas) escala rápido.
  A E4 manteve pulso/cap, enriqueceu o loot e registrou a régua para playtest.
- **Save:** E4 foi entregue no schema **v5**. O estado atual usa schema **v6**
  após E5.1, com migrações testadas de v1 a v5, coleções/carries das cinco
  zonas e sanitização de IDs/slots.

## Fora de escopo (segue Fase 3)
Bosses, prestígio/rebirth, multiplayer. Combate detalhado (turnos/animação) fica
para depois — aqui o "combate" é abstraído no poder vs. dificuldade.
