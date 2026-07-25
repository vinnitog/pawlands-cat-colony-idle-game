# Grimalkin — plano visual G0→G3

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

**Pendente.**

- Ordenação por profundidade (`y-sort`) entre jogador, NPCs e objetos altos.
- Sombras de contato, movimento de água e acabamento de luz/névoa.
- Playtest visual em desktop e mobile, preservando caminhos e interações.

Critério: ganhar profundidade e atmosfera sem reduzir leitura, desempenho ou
acessibilidade.

## G3 — expansão premium

**Pendente.**

- Avaliar e licenciar o tileset premium do Elthen.
- Migrar personagens para quatro direções, se houver sprites compatíveis.
- Planejar interiores e novos distritos/mapas sem descartar o G1.

Critério: auditoria de licença, integração e custo aprovada antes de importar
qualquer asset pago ou ampliar o schema do mundo.
