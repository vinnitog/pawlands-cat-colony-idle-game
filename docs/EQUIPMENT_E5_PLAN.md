# Equipamento e clareza visual — E5.0 a E5.2

## Contrato

- O core idle, o pulso técnico de 5 minutos, o cap de 96, as chances existentes
  e a fórmula de poder permanecem inalterados.
- A linguagem visível usa **ciclo de caça**; nomes internos e documentação
  técnica podem continuar usando `pulse`.
- Poder continua derivado de atributos e equipamentos, nunca persistido.

## E5.0 — catálogo legível

- Toda oferta de loja possui ícone ou arte.
- Ofertas ficam agrupadas em equipamentos, melhorias permanentes e suprimentos.
- “Pulso” deixa a interface do Além e vira “ciclo de caça”.
- `Elmo de Guerra`, que era uma melhoria permanente sem item equipável, passa a
  se chamar `Postura de Guerra`.

## E5.1 — cabeça e patas

- Novos slots `head` e `feet`.
- Forja: Elmo de Ferro e Botas de Batedor, ambos básicos e com +1 poder.
- Além: Coroa do Eclipse e Passos da Bruma, ambos raros e com +2 poder.
- O conjunto básico passa de +4 para +6 poder; o máximo raro passa de +9 para
  +13. A eficiência continua limitada a 1,5×.
- Botas não alteram movimento ou criam salto: Grimalkin continua top-down e o
  core idle não recebe uma segunda fórmula de velocidade.
- Save v5 migra para v6 preenchendo os dois slots com `null` e preservando os
  slots existentes.

## E5.2 — painel de equipamento

- O card do gato mostra os quatro slots juntos ao retrato.
- Slot vazio tem rótulo textual; item equipado mostra arte, nome e poder.
- A visualização reutiliza os assets do inventário e não sobrepõe peças nos
  sprites animados.

## Validação

- Sem gear: nenhum bônus.
- Básico completo: +6 poder.
- Raro máximo: +13 poder.
- Save v5 válido preserva arma e armadura e recebe cabeça/patas vazias.
- Equipar, trocar e desequipar respeita slot, quantidade e gato ocupado.
- Loja e painel permanecem utilizáveis por teclado, toque e em largura mobile.

## Fora de escopo

- Salto, velocidade de caçada, atributos secundários e overlays sobre sprites.
- Novas fontes de loot, mudanças de chance, preço, XP, cap ou duração.
