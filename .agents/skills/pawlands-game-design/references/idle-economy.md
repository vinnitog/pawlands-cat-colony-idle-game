# Economia e progressão idle

## Estruturar o loop

Descrever sempre:

`agir ou esperar → receber → investir ou escolher → aumentar capacidade → desbloquear`

Se uma recompensa não alimenta escolha, progressão ou fantasia, questionar sua
presença.

## Medir antes de balancear

Definir metas observáveis:

- tempo até a primeira recompensa;
- tempo até a primeira melhoria;
- duração útil de uma sessão;
- tempo até desbloqueio de zona;
- rendimento online e offline;
- capacidade máxima antes de coletar.

Na ausência de metas aprovadas, apresentar intervalos como hipótese e pedir
playtest; não disfarçar chute como balanceamento.

## Valor esperado

Para cada entrada de loot:

`EV = chance * quantidadeMédia * valorUnitário`

Somar o EV dos itens, moedas e gemas separadamente. Manter XP separado da moeda
para não ocultar duas curvas em um único número.

Comparar também:

`basePulsesPerHour = 3_600_000 / PULSE_MS`

`effectivePulsesPerHour = basePulsesPerHour * efficiency`

`EV por hora = effectivePulsesPerHour * EV por pulso`

Usar a mesma unidade ao comparar atividades, zonas e gatos. Não multiplicar a
eficiência novamente se `pulsosPorHora` já representar pulsos efetivos.

## Fontes e sumidouros

Montar uma tabela:

| Recurso | Fontes | Sumidouros | Limite | Risco |
|---|---|---|---|---|
| moedas | atividades, troféus | loja, ferreiro | preço/tempo | inflação |
| gemas | missões, drop raro | recrutamento, raridades | chance e custo | trivialização |
| XP | atividades, expedição | níveis | curva de XP | progressão rápida |

Não exigir equilíbrio perfeito em cada fase, mas impedir fontes permanentes sem
limite ou propósito.

## Offline e caps

- Basear progresso em timestamps persistidos, nunca em timers que precisam ficar
  ativos.
- Tratar relógio retrocedendo como duração zero e reancorar com segurança.
- Preservar `elapsedMs % PULSE_MS`: após processar pulsos-base inteiros, avançar
  o timestamp somente por `wholeBasePulses * PULSE_MS`, não diretamente para
  `now`. Assim, saves e loads frequentes não apagam tempo parcial.
- Converter o tempo decorrido em pulsos-base, aplicar a eficiência e limitar
  `accumulatedPulses` à capacidade do saco. Um gato fraco demora mais para atingir
  o mesmo teto; não recebe um teto de tempo menor.
- Não introduzir um limite de tempo separado sem decisão explícita de design. O
  teto da Expedição é a capacidade acumulada do saco.
- Preservar frações necessárias à eficiência entre saves e coletas. Regra padrão
  para a E1: resolver XP e loot somente para pulsos inteiros e manter o resto
  como carry do gato para a mesma zona mesmo depois que a coleta o trouxer para
  casa. Não usar arredondamento comum nem rolagens parciais independentes.
- Testar invariância de frequência: quatro coletas de `0.25` pulso devem produzir
  exatamente o mesmo pulso resolvido que uma coleta de `1.0`, sem perder XP,
  alterar chances ou permitir rerolls.
- Mostrar ao jogador o cap e quando o saco ficará cheio.
- Nunca remover o que já foi acumulado por ultrapassar o cap.

## Retornos e multiplicadores

- Preferir bônus aditivos ou soft caps no início do MVP.
- Avaliar o efeito combinado de roster, gear, nível, zona e offline.
- Evitar multiplicadores que se alimentam mutuamente sem teto.
- Se um gato forte ultrapassa a dificuldade, aplicar o teto de eficiência antes
  de aumentar loot raro.
- Separar velocidade de caça de qualidade de loot; isso mantém knobs
  independentes.

## Cenários obrigatórios

Calcular ao menos:

1. gato inicial na primeira zona;
2. gato adequado numa zona intermediária;
3. gato abaixo da recomendação numa zona avançada;
4. gato acima da recomendação no teto de eficiência;
5. roster com vários gatos durante o cap offline completo.

Verificar tempo de coleta, XP, valor vendável, gemas esperadas e impacto nos
custos seguintes.
