# G3.0 — auditoria de assets gratuitos

Data da decisão: 2026-07-26.

## Objetivo e limites

Selecionar arte complementar gratuita para Grimalkin sem transformar o mundo em
uma camada obrigatória de exploração. Esta auditoria não autoriza importação de
binários: G3.0 registra proveniência, compatibilidade e uma shortlist; a entrada
no runtime depende da G3.1.

Limites:

- uso exclusivamente visual, sem alterar save, economia ou progresso offline;
- tiles de `16 × 16 px`, compatíveis com o Canvas 2D atual;
- Tiny Town continua sendo o atlas-base e o fallback;
- nenhum personagem, sprite direcional ou asset pago entra nesta etapa;
- no máximo um novo atlas no runtime e 24 papéis semânticos catalogados.

## Fontes auditadas

| Pacote | Origem oficial | Versão | Licença | Conteúdo declarado | ZIP auditado | SHA-256 do ZIP |
|---|---|---:|---|---:|---:|---|
| Kenney Tiny Dungeon | [kenney.nl/assets/tiny-dungeon](https://kenney.nl/assets/tiny-dungeon) | 1.0 | CC0 1.0 | 130 arquivos, tiles de `16 × 16 px` | `kenney_tiny-dungeon.zip`, 98.530 bytes | `C109438AB06F65FD80F9B2686A4CF9C7C11DC64444B47333EC71D602F8BB5FC7` |
| Kenney Tiny Battle | [kenney.nl/assets/tiny-battle](https://kenney.nl/assets/tiny-battle) | 1.0 | CC0 1.0 | 190 arquivos, tiles de `16 × 16 px` | `kenney_tiny-battle.zip`, 131.452 bytes | `7751EC7D9A07E57BAA9FA1174D6F78FCD779A050377227AFEE77993C73CB5F9E` |

A licença CC0 permite uso, modificação e distribuição sem exigência de
atribuição. Mesmo assim, Pawlands deve manter esta proveniência e uma cópia da
licença junto do asset que vier a ser importado. Os hashes foram calculados
localmente com SHA-256 sobre os ZIPs obtidos das páginas oficiais em 2026-07-26;
qualquer arquivo com tamanho ou hash diferente exige nova verificação antes da
importação.

## Compatibilidade

### Tiny Dungeon

- grade de `16 × 16 px`, igual ao `TILE` do mundo;
- linguagem medieval coerente com cidade-fortaleza, ruínas, forja e portão;
- útil como complemento de alvenaria e props, sem exigir substituição integral
  do Tiny Town;
- deve passar por teste de paleta e contraste ao lado do atlas-base;
- não resolve sprites de gatos em quatro direções.

**Decisão:** aprovado como único candidato da G3.1.

### Tiny Battle

- grade tecnicamente compatível de `16 × 16 px`;
- predominância militar/moderna destoa da fantasia medieval felina;
- água e bandeiras poderiam ser aproveitadas isoladamente, mas a água G2 já
  possui animação e leitura satisfatórias;
- importar outro atlas para poucos elementos aumenta bundle, catálogo e custo
  de manutenção sem benefício proporcional.

**Decisão:** não importar. Reavaliar apenas se uma necessidade visual futura não
puder ser atendida pelo Tiny Town, Tiny Dungeon ou efeitos G2.

## Shortlist semântica do Tiny Dungeon

Esta lista define papéis candidatos, não índices de atlas. Os índices devem ser
atribuídos e validados na G3.1 a partir do pacote cujo hash corresponda ao
registro acima. O primeiro passe pode usar no máximo 12 destes 24 papéis.

| ID semântico candidato | Uso pretendido | Área prioritária |
|---|---|---|
| `dungeonFloorStone` | piso de pedra interior/fortificado | núcleo real |
| `dungeonFloorDebris` | variação de piso com detritos | portão |
| `dungeonWallFace` | face frontal de muralha | núcleo real |
| `dungeonWallTop` | coroamento de muralha | núcleo real |
| `dungeonWallCorner` | canto legível de alvenaria | núcleo real |
| `dungeonWallDamaged` | trecho antigo ou danificado | portão |
| `dungeonArch` | arco de entrada monumental | portão |
| `dungeonDoor` | porta medieval fechada | núcleo real |
| `dungeonStairs` | acesso visual entre níveis | núcleo real |
| `dungeonColumn` | suporte arquitetônico | núcleo real |
| `dungeonPortcullis` | grade de entrada protegida | portão |
| `dungeonFence` | limite fortificado sem colisão nova | portão |
| `dungeonTorch` | fonte visual de luz | portão |
| `dungeonFlame` | foco de luz cerimonial | núcleo real |
| `dungeonSpikes` | risco visual desativado/decorativo | portão |
| `dungeonTrapdoor` | acesso técnico decorativo | forja |
| `dungeonChest` | armazenamento decorativo | núcleo real |
| `dungeonChestOpen` | variação de armazenamento | forja |
| `dungeonSarcophagus` | peça histórica/cerimonial | núcleo real |
| `dungeonFenceGate` | passagem visual de oficina | forja |
| `dungeonSword` | produção e guarda | forja |
| `dungeonShield` | heráldica felina substituível | núcleo real |
| `dungeonPotion` | insumo alquímico decorativo | forja |
| `dungeonBones` | vestígio antigo discreto | portão |

## Gate para G3.1

A importação só pode prosseguir quando:

1. o arquivo obtido da origem oficial corresponder ao SHA-256 registrado;
2. a licença CC0 acompanhar o asset no repositório;
3. um inventário visual confirmar os índices dos papéis escolhidos;
4. uma prancha visual lado a lado confirmar escala, transparência e contraste
   aceitáveis junto ao Tiny Town; os três recortes no mapa pertencem à G3.2;
5. o plano de fallback carregar Grimalkin apenas com Tiny Town se o atlas
   complementar falhar;
6. nenhuma mudança em `SAVE_VERSION`, colisões, economia ou dependências for
   necessária.

## Riscos conhecidos

- misturar paletas pode deixar Grimalkin com aparência de dois jogos;
- tiles de dungeon podem escurecer demais um idle casual acolhedor;
- alguns papéis da shortlist podem não possuir um tile isolado adequado e devem
  ser descartados, não improvisados por índices semelhantes;
- um segundo atlas aumenta uma requisição e precisa de fallback explícito;
- CC0 reduz risco jurídico, mas não elimina a obrigação interna de conservar
  origem, versão e integridade do pacote.
