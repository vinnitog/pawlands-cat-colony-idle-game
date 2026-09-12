# Catvolution: Infinite Idle — Plano de Produto e Vertical Slice

Este documento traduz `catvolution_infinite_idle_context.html` para o contrato
executável do Pawlands. A visão Catvolution é a direção atual do produto; os
sistemas maduros de Cat Colony Idle permanecem como a Era I, em vez de serem
reescritos sem necessidade.

## Decisão

O jogo começa como uma pequena colônia medieval de gatos e revela gradualmente
um universo incremental maior. Grimalkin, atividades, roster, expedições,
equipamento, loot e progresso offline formam a base. A nova camada de Evolução
permite pesquisar Cyber e Ciência, combiná-las no primeiro híbrido e então abrir
uma Nova Timeline.

Loop do MVP:

`agir ou esperar → receber recursos/loot → pesquisar → especializar ou combinar → abrir timeline → acelerar a próxima era`

Fora do primeiro vertical slice: novos mapas, combate ativo, Alien, Pirata,
Zumbi, Espaço, Quantum, cloud save, anúncios, compras e multiplayer.

## Modelo entregue

### Pesquisas

| Ramo | Pesquisa | Custo | Tempo oficial | Efeito |
| --- | --- | --- | --- | --- |
| Cyber T1 | Oficina Improvisada | 25 moedas + 3 novelos | 3 min | atividades 10% mais rápidas |
| Cyber T2 | Toca de Dados | 90 moedas + 12 novelos + 1 gema | 12 min | atividades mais 10% rápidas |
| Ciência T1 | Laboratório da Curiosidade | 25 moedas + 2 peixes | 3 min | +15% XP em atividades |
| Ciência T2 | Jardim Genético | 90 moedas + 3 catnip + 1 gema | 12 min | +5 pontos percentuais de drop raro |
| Híbrido T3 | Protocolo Bio-Ciborgue | 180 moedas + 12 peixes + 12 novelos + 2 gemas | 20 min | +10% XP e atividades mais 5% rápidas |

Existe uma pesquisa ativa por colônia. O custo é pago ao iniciar. O término usa
timestamp persistido e funciona offline. Durações em desenvolvimento continuam
usando o modo rápido já existente; produção usa os tempos oficiais.

### Fórmulas

```text
activityDurationMultiplier = max(0.65,
  1 - cyberBonuses - hybridBonus - min(0.10, shards * 0.01))

activityXpMultiplier =
  1 + scienceBonus + hybridBonus + min(0.20, shards * 0.02)

researchDurationMultiplier = max(0.50, 1 - shards * 0.05)
```

Os bônus são aditivos e têm caps. Poder e eficiência de expedição permanecem
nas fórmulas travadas de E0–E4; a nova camada não duplica multiplicadores ali.

### Nova Timeline

Desbloqueio: concluir todas as missões e estruturas da crônica atual e dominar
os cinco nós de Evolução. Recompensa:

```text
shards = min(5,
  1 + floor(levelsGanhosDaColonia / 10)
    + floor(coletasDeExpedicao / 50))
```

O reset remove recursos, roster adicional, equipamento, missões, estruturas e
pesquisas. Nome e classe do guardião permanecem. Número da timeline, Fragmentos
atuais, total histórico e data do último salto são permanentes.

## Economia e ritmo

| Recurso | Fontes atuais | Novo sumidouro | Limite/controle | Risco observado |
| --- | --- | --- | --- | --- |
| moedas | atividades, nível, missões, troféus | todas as pesquisas | custos por tier | competição com estruturas e gear |
| peixes/novelos/catnip | atividades | ramos e híbrido | custos fixos | Jardim depende de Explorar |
| gemas | missões e drops raros | T2, híbrido, recrutamento, loja | chance e custo | gargalo intencional, sujeito a playtest |
| XP | atividades, expedições, missões | curva de nível | bônus aditivo com cap | aceleração entre timelines |
| Fragmentos | Nova Timeline | aceleração permanente | prêmio 1–5; bônus com caps | crescimento sem limite nominal, efeito limitado |

Metas de playtest, ainda hipóteses: primeira pesquisa em 3–10 minutos; um T2 em
20–60 minutos; híbrido em 1–3 horas de jogo ativo; primeira timeline após a
conclusão natural da Era I. Não há punição por ausência nem limite temporal
adicional: atividades, expedições e pesquisa resolvem por timestamps.

## Cenários numéricos

Usando `Procurar Novelos` (3 min, 10–15 XP base):

| Estado | Duração | XP por conclusão | Observação |
| --- | ---: | ---: | --- |
| inicial | 3:00 | 10–15 | referência |
| Oficina + Laboratório | 2:42 | 11–17 | primeiro cruzamento de benefícios |
| cinco pesquisas, sem Fragmentos | 2:15 | 12–18 | bônus da era completos |
| cinco pesquisas + 5 Fragmentos | 2:06 | 13–20 | primeira aceleração permanente forte |
| caps (10+ Fragmentos) | 1:57 | 14–21 | velocidade limitada a 35%; XP permanente a 20% |

Os testes automatizados cobrem custo único, borda exata do timer, offline,
pré-requisitos, migração v6→v7, sanitização, caps, atividade beneficiada,
condições do prestige e preservação da identidade.

## Persistência e UX

- Save v7 adiciona apenas IDs de pesquisas, pesquisa ativa e metaprogressão.
- Saves v1–v6 migram com defaults sem perder o progresso anterior.
- Referências desconhecidas, timestamps inválidos e nós sem pré-requisito são
  descartados com fallback seguro.
- A Home responde onde a colônia está, quem trabalha, o que evoluiu e qual é o
  próximo passo.
- O Laboratório mostra custo, duração, requisitos, bônus e motivo de bloqueio.
- Timeline exige confirmação em duas etapas e lista precisamente o que reseta.
- Mobile usa cinco destinos primários no rodapé, touch targets e safe area.

## Lições reaproveitadas do VerbaJus Android

1. React/Vite continua como fonte única; Capacitor será um shell, não um fork.
2. `applicationId` é definitivo após publicação. Fixar somente com decisão
   registrada antes de criar o app na Play Console.
3. Build web, sync Android, testes Gradle, lint e teste em aparelho são gates
   diferentes. Compilar APK/AAB não prova navegação, background ou restauração.
4. O gesto Voltar deve fechar primeiro o modal, depois voltar de tela e somente
   minimizar na raiz; nunca deve confirmar reset ou apagar dados.
5. Safe areas, teclado, foco e navegação inferior precisam nascer no layout,
   não ser corrigidos no fim.
6. Release deve falhar fechado sem upload key externa ao Git; ativar Play App
   Signing no primeiro AAB e incrementar `versionCode` em todo upload.
7. Ícone 512×512, feature graphic 1024×500, ícones adaptativo/monocromático,
   splash e screenshots reais são entregáveis separados.
8. Backup e transferência precisam de política explícita. Como o save do jogo
   é local, a decisão deve considerar perda de progresso e migrações antes de
   configurar o manifesto Android.
9. Monetização e SDKs entram atrás de feature gates e só após o loop provar
   retenção. O primeiro build não inclui anúncios nem billing.

## Gate Android seguinte

Antes de gerar `android/`:

- confirmar e registrar o package name definitivo;
- estabilizar o vertical slice e o save v7;
- definir política de backup/cloud save;
- criar assets finais da marca Catvolution;
- então adicionar Capacitor, navegação Voltar e pipeline de release assinado.
