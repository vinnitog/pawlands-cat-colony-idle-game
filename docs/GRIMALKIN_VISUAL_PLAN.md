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

**Entregue.**

- O passe originalmente usou dez tiles do Tiny Dungeon em três recortes.
  A revisão G3.3b removeu os oito overlays arquitetônicos do núcleo real e do
  portão sul por conflito de linguagem com Tiny Town. Permanecem somente uma
  chama mural e uma alvenaria discreta na fachada da forja.
- Cada composição complementa um objeto-base deliberado; nenhum detalhe foi
  usado como piso, decal estrutural ou novo obstáculo.
- O passe preserva integralmente `ground`, `objects`, `solid`, spawn, NPCs,
  câmera, y-sort, atmosfera e interações. Se o atlas opcional falhar, todas as
  estruturas Tiny Town continuam presentes.

Critérios atendidos: camadas continuam com 384 entradas; hashes de `ground`,
`objects` e `solid` permanecem no baseline G1; cada interação e NPC mantém ao
menos duas aproximações livres e alcançáveis; os dois índices estão no catálogo
auditado, as coordenadas são únicas e cada sobreposição possui objeto-base
verificado.

### G3.3 — cidade viva idle

**Entregue.**

- O seletor puro `getWorldIdleSignals(state, now)` lê todo o roster e deriva,
  sem persistir, os estados `quiet`, `active`, `ready` e `full` da expedição.
  O preview usa tempo carregado, eficiência por poder, pulso oficial/runtime e
  o teto de 96 pulsos com os mesmos limites do motor.
- Os cinco postos de atividade identificam tipo, local compatível e o estado de
  cada gato designado, inclusive quando gatos no mesmo posto estão em fases
  diferentes. A transição para `ready` ocorre exatamente no `effectiveEndsAt`,
  inclusive para saves iniciados com duração oficial durante o modo local de
  10 segundos. Explorar o Quintal ocupa a praça e o eixo cívico, preservando o
  portão sul para a leitura visual das expedições.
- As cinco melhorias refletem o nível já salvo como `base`, `improved` ou
  `complete`; nenhum estado visual entra no save.
- O Boletim da colônia é uma camada DOM acessível com três blocos e atalhos de
  uma ação para Expedição, Atividades e Melhorias. Ele fica disponível enquanto
  há personagem em Grimalkin; quando nenhum personagem pode ocupar o mundo
  porque o líder está no Além, a camada é ocultada e o estado vazio mantém a
  ação direta para Expedição. O Boletim não usa `aria-live` nem anuncia
  contagens regressivas a cada segundo.
- O mapa continua opcional e cosmético. Marcadores Canvas foram deliberadamente
  deixados fora: o boletim entrega a informação com melhor legibilidade,
  teclado, toque e movimento reduzido, sem acoplar sinais ao renderer.

Critérios atendidos: expedição cobre ausente, ativo, coleta disponível e saco
cheio nos limites exatos; as regras puras de poder, eficiência e duração são
compartilhadas com os motores autoritativos, sem fórmulas duplicadas; atividades
cobrem ausência, paralelismo, conclusão e estados mistos no mesmo posto;
melhorias refletem os cinco níveis salvos. O seletor não importa economia,
storage, offline, RNG nem ações mutáveis; o progresso offline permanece
idêntico sem abrir o Mundo. Layout responsivo, foco visível, texto além de cor e
o contrato global de movimento reduzido preservam a informação.

### G3.3b — superfície principal e janelas idle

**Entregue.**

- Grimalkin passa a abrir como tela inicial e ocupa toda a área útil abaixo da
  topbar. O mapa lógico continua `24 × 16`; zoom de cobertura e câmera fazem o
  enquadramento responsivo sem alterar colisão, posição salva ou economia.
- A tela Início foi removida. O resumo global de ocupações fica na topbar,
  considera todo o roster e abre uma lista com atividade, expedição ou estado
  livre de cada gato.
- O Boletim deixou de consumir uma coluna permanente. A opção no topo do mapa
  abre uma janela não modal, fechável e minimizável; janelas minimizadas usam um
  dock em grid no canto inferior esquerdo. Estado de janela é efêmero.
- Level up, energia e teleport preservam o gato responsável no evento. No
  Mundo, a aura é desenhada junto ao sprite; fora dele, envolve o brasão e usa
  os rótulos `LEVEL UP`, `ENERGY +N` e `BLINKING`.
- O trilho ornamental vertical foi removido e os ícones do menu receberam
  tamanho, contraste e foco mais legíveis.

Critérios atendidos: nenhum schema, timer, recompensa, cap offline, mapa lógico
ou regra idle mudou; janela responde a Escape e restaura foco; o Boletim mantém
seus três atalhos; `ground`, `objects` e `solid` permanecem no baseline G1; os
overlays arquitetônicos do atlas complementar não entram mais no runtime.

### G3.3c — moldura e precisão de exibição

**Entregue.**

- A área do Mundo recebe uma moldura responsiva de `16–100 px`, limitada
  proporcionalmente pela largura e altura disponíveis, reduzindo o
  cenário sem alterar o mapa lógico, a câmera, a colisão ou a posição salva.
- A opção Boletim usa somente o ícone na barra expansível, preservando alvo de
  `44 × 44 px`, nome acessível, tooltip visível em hover/foco e abertura em uma
  ação.
- A escala de renderização é quantizada para que cada tile ocupe uma quantidade
  inteira de pixels físicos; a câmera continua alinhada a pixels físicos e as
  frestas visuais entre tiles não reaparecem em escalas fracionárias.

Critérios atendidos: nenhum asset, dependência, schema, timer, recompensa,
coordenada, camada do mapa ou regra idle mudou; o zoom de cobertura permanece e
os controles continuam responsivos em desktop e mobile.

### G3.4 — distrito-diorama opcional

**Adiado após gate idle-first.**

G3.3 já comunica progresso e responsáveis e oferece atalhos sem movimento. Um
distrito-diorama agora repetiria informações de Grimalkin e da tela do Além,
acrescentando custo de arte, navegação, responsividade, acessibilidade, bundle e
QA sem valor idle validado.

Autorizar um piloto somente quando todos os critérios de entrada forem
atendidos:

- playtest estruturado com ao menos cinco jogadores, incluindo no mínimo dois
  em mobile e dois em desktop;
- pelo menos três dos cinco abrem Grimalkin sem instrução na segunda sessão e
  colocam uma nova região visual entre as duas melhorias que mais desejam;
- a cena responde a uma pergunta idle não coberta por Grimalkin ou Além e
  representa ao menos três estados derivados úteis;
- o piloto reutiliza os atlases e o runtime existentes, sem nova economia,
  recompensa, timer, campo de save ou dependência;
- entrada e saída em até duas ações, menu global sempre disponível e movimento
  reduzido preservado.

Mesmo autorizado, o piloto só pode ser aceito quando:

- o JavaScript produzido cresce no máximo `10 KB` gzip em relação ao commit
  anterior ao piloto;
- em uma execução repetível no mesmo dispositivo e resolução, o custo mediano
  de render fica até `5%` acima de Grimalkin;
- cenários pareados, partindo do mesmo save e horário, confirmam estado
  persistido, progresso offline e recompensas idênticos com a cena nunca aberta
  ou visitada repetidamente;
- testes de regressão confirmam que todas as funções continuam acessíveis pela
  interface em no máximo duas ações.

O marco G3 encerra em G3.3c sem lacuna mecânica. G3.4 permanece uma hipótese
pós-playtest, não uma dívida obrigatória.

Quatro direções, interiores navegáveis, novos mapas caminháveis e recompensas
por exploração ficam fora do G3. Só devem voltar ao roadmap após playtests
demonstrarem valor mensurável para o loop idle.
