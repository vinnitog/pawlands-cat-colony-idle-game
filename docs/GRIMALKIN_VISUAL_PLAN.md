# Grimalkin — plano visual G0→G3.4

## Contrato preservado

- Stack: React + Vite + TypeScript, mundo em Canvas 2D.
- Mapa: **24 × 16 tiles**, `TILE = 16`.
- Arte G1: somente o atlas Tiny Town CC0 já publicado em
  `public/tiles/tiny_town.png` (`12 × 12`, índices `0..143`).
- Permanecem o renderer, as camadas `ground`/`objects`, colisão, câmera, schema
  de save, economia e mecânicas.
- Interações fixas:
  - Mural `(8,8)`;
  - Forja `(15,8)`;
  - Portão do Além `(12,12)`;
  - Lago/Pesca `(7,12)`.
- Spawn e NPCs existentes permanecem em suas coordenadas enquanto continuarem
  acessíveis.

## Planta funcional

```text
┌──────────────── muralha norte ────────────────┐
│ bosque  casas mercantis   núcleo real  bosque │
│         ┌─────────────┐  ┌──────────┐         │
│ oeste   │ mercado     ├──┤ praça    ├── forja │
│         └─────────────┘  └────┬─────┘   leste │
│ mural/joalheiro          eixo cívico           │
│ lago-jardim sudoeste          │     residências│
│ pesca ───────────────────── portão sul          │
└──────────────── muralha sul / saída ──────────┘
```

O eixo cívico liga o portão sul à praça central e ao núcleo real. O caminho
oeste atende o mural, o joalheiro, as casas mercantis e o lago-jardim; o ramo
leste atende a forja e Aldric. Árvores e props formam grupos nas bordas dos
distritos, sem poluir o centro nem fechar os corredores.

## G0 — auditoria e planta

**Entregue.**

- Inventariar atlas, renderer, mapa, colisão, interações, NPCs e posição salva.
- Travar dimensões, coordenadas funcionais e limites de asset.
- Definir distritos, eixo visual, corredores e critérios automatizáveis.

Critério: plano versionado e nenhuma troca de schema, mecânica ou economia.

## G1 — recomposição Tiny Town

**Entregue.**

- Muralha de pedra contínua no perímetro e portão no sul.
- Eixo portão→praça, caminhos com centro, bordas e cantos.
- Distrito mercantil oeste, forja leste, núcleo real norte/centro,
  lago-jardim sudoeste e casas completas de mais de uma cobertura.
- Vegetação agrupada, props funcionais e praça central legível.
- Posição salva validada antes de criar o jogador: posição livre é preservada;
  posição sólida ou externa cai no tile livre mais próximo ou no spawn seguro.

Critérios:

- arrays com `24 × 16` entradas;
- todo índice visual entre `0` e `143`;
- quatro interações nas coordenadas travadas;
- flood-fill do spawn alcança adjacências das quatro interações;
- cada interação e NPC possui ao menos duas aproximações livres e alcançáveis;
- NPCs e spawn preservados;
- testes e build sem regressões.

## G2 — profundidade e atmosfera

**Entregue.**

- Ordenação determinística por baseline Y entre jogador, NPCs, gatos da colônia
  e objetos do mapa.
- Sombras de contato nos personagens.
- Lago com duas fases de brilho usando os tiles `132..140`, alternadas a cada
  `600 ms`.
- Luzes estáticas sutis na praça, forja e portão, névoa periférica em ciclo de
  `18 s` e vignette discreta.
- Composição limitada: água até `0,18`, névoa até `0,07`, luzes até `0,14` e
  vignette até `0,14`, preservando a leitura do pixel art.
- `prefers-reduced-motion` reativo: congela água, névoa, animações ociosas e
  deslocamento dos gatos ambientes sem bloquear o movimento comandado pelo
  jogador.

Critério atendido sem novos assets, dependências, mecânicas, colisões ou mudanças
no schema de save.

## G3 — identidade visual idle-first

O mundo é uma representação viva da colônia, não uma camada obrigatória de
exploração. Movimento manual permanece cosmético e opcional: atividades,
expedições, lojas, coleta e progressão devem continuar acessíveis pela interface
em no máximo duas ações, sem caminhar até um NPC ou edifício.

Contrato comum a todas as etapas G3:

- nenhum loot, bônus, missão, preço, produção ou desbloqueio depende de abrir ou
  percorrer o Mundo;
- sinais do cenário apenas leem estado autoritativo já existente;
- `saveSchemaVersion`, economia, recompensas, timers, RNG, progresso offline,
  colisões e coordenadas funcionais permanecem inalterados;
- mapa-base continua com `24 × 16` tiles de `16 px`, preservando G1 e G2;
- Tiny Town permanece disponível como fallback;
- nenhum asset pago ou nova dependência de runtime entra nesta sequência.

### G3.0 — auditoria de assets gratuitos

**Entregue.**

- Tiny Dungeon v1.0 selecionado como candidato para alvenaria, ruínas e props
  medievais.
- Tiny Battle v1.0 rejeitado nesta etapa por sua linguagem militar/moderna e
  pelo baixo ganho de importar um segundo atlas apenas para água ou bandeiras.
- Origem, licença CC0, hashes, compatibilidade e shortlist semântica registrados
  em [`G3_ASSET_AUDIT.md`](G3_ASSET_AUDIT.md).
- Nenhum binário importado.

Critério: proveniência verificável, decisão registrada e no máximo 24 papéis
semânticos candidatos antes de qualquer alteração no runtime.

### G3.1 — importação mínima e catálogo

**Entregue.**

- Importar somente um atlas Tiny Dungeon necessário ao runtime e seu arquivo de
  licença/proveniência.
- Centralizar no máximo 24 entradas semânticas e usar no máximo 12 no primeiro
  passe; índices crus novos não podem se espalhar pelo mapa ou renderer.
- Preservar Tiny Town como fallback se o atlas complementar falhar.

Critérios atendidos: atlas `192 × 176 px`, transparência, licença, hashes e 24
índices validados; uma nova requisição opcional no Mundo; `details` ainda vazio;
zero dependências e `saveSchemaVersion` intacta.

### G3.2 — passe visual seletivo

**Pendente.**

- Prototipar três recortes: núcleo real, forja e Portão do Além.
- Usar Tiny Dungeon apenas onde melhorar simultaneamente a leitura funcional e
  a coerência de paleta/escala; não substituir todo o mapa por obrigação.
- Preservar colisões, spawn, NPCs, câmera, y-sort, atmosfera e interações.

Critérios: camadas continuam com 384 entradas; collision layer idêntica ao
baseline; cada interação e NPC mantém ao menos duas aproximações livres e
alcançáveis; nenhum índice inválido ou objeto sobreposto silenciosamente.

### G3.3 — cidade viva idle

**Pendente.**

- Expedição ativa aparece no portão e identifica o gato responsável.
- Atividades em andamento geram sinais ambientais discretos nos locais
  compatíveis.
- Saco cheio ou coleta disponível recebe destaque informativo, sem interromper
  o loop.
- Melhorias concluídas alteram detalhes do cenário a partir do nível já salvo.
- Hotspots podem abrir as mesmas telas existentes, mantendo o menu como rota
  principal.

Critérios: expedição cobre estados ausente, ativo e coleta disponível;
atividades cobrem ausente e ativa; melhorias refletem os níveis já salvos. Todo
sinal atualiza no próximo render do estado, não chama funções econômicas nem
RNG; progresso offline é idêntico sem abrir o Mundo; movimento reduzido preserva
a informação.

### G3.4 — distrito-diorama opcional

**Pendente.**

- Validar no máximo um piloto, preferencialmente os arredores do Portão do
  Além, acessado instantaneamente por seletor ou transição cosmética.
- Representar desbloqueios existentes e oferecer atalhos às telas atuais, sem
  loot exclusivo, moeda, produção ou caminhada obrigatória.
- Não persistir `mapId`: reload e saves antigos retornam com segurança a
  Grimalkin.

Critérios: entrada e saída em no máximo duas ações; saída e menu global sempre
visíveis; nenhum campo novo no save; desempenho e movimento reduzido equivalem
ao mapa-base.

Quatro direções, interiores navegáveis, novos mapas caminháveis e recompensas
por exploração ficam fora do G3. Só devem voltar ao roadmap após playtests
demonstrarem valor mensurável para o loop idle.
