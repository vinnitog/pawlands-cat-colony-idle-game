# Auditoria de assets gráficos

Data: 2026-07-25

## Decisão

Manter a identidade atual do Pawlands e usar packs externos como biblioteca
auxiliar. Os gatos continuam sendo os protagonistas; novos assets entram em
cenários, loot e equipamento onde o pixel art ajuda a integrar o mundo e a UI.

## Repositórios avaliados

### Superpowers Asset Packs

- Licença: CC0 1.0.
- Uso aprovado: fundos de zona, props, loot, equipamento e efeitos pontuais.
- Import aprovado: três fundos das zonas E2 e cinco ícones para E3/E4,
  incluindo ao menos uma arma e uma peça defensiva.
- Risco: os packs variam entre pixel art de 8–16 px e ilustrações maiores.
  Não misturar famílias dentro do mesmo componente.

### Game Icons

- Licença: CC-BY.
- Uso adiado: é útil para lacunas específicas, mas adicionaria obrigação de
  atribuição por autor e uma linguagem vetorial diferente dos sprites.
- Preferência: continuar usando os SVGs internos do `GameIcon` quando o asset
  não precisar parecer um item físico.

### Pixelorama

- Licença do editor: MIT.
- Uso aprovado como ferramenta externa para recorte, recoloração, animação e
  spritesheets.
- Não é dependência do app e nenhum código do editor será embarcado.

## Regras de integração

- Ampliar pixel art somente em múltiplos inteiros quando possível.
- Usar `image-rendering: pixelated`.
- Exibir os itens de 7–12 px com pelo menos 32 px na UI.
- Não aplicar blur nem interpolação bilinear.
- Manter contorno escuro, silhueta legível e no máximo uma paleta dominante por
  tela.
- Fundos de zona devem ficar atrás de véu/gradiente para preservar contraste do
  texto.
- Ícones de item podem receber moldura e fundo de raridade; a cor nunca será o
  único indicador.
- Assets externos precisam de arquivo de origem, licença e commit auditado.
- Não importar bibliotecas inteiras: somente arquivos usados ou já vinculados a
  uma fase aprovada.

## Assets rejeitados agora

- Personagens humanos e monstros do pack Medieval Fantasy: competem com a
  fantasia de colônia felina e têm escala diferente dos gatos atuais.
- HUD completo dos packs: conflita com o pergaminho, brasão e molduras já
  estabelecidos.
- Fundos modernos, espaciais e de deserto: não servem às três zonas iniciais.
- Game Icons em massa: tamanho e custo de atribuição desnecessários para o MVP.

## Ajustes após inspeção individual

- `backgrounds/28.png` foi escolhido para Campos Sussurrantes; o fundo recebe
  névoa fria na UI para evitar aparência alegre demais.
- `backgrounds/24.png` já entrega profundidade e mistério ao Bosque das Brumas.
- `backgrounds/29.png` recebe véu azulado para ler como ruína assombrada.
- `items/5.png` foi nomeado `bone-charm`, pois sua silhueta pequena não comunica
  elmo com segurança.
