# Qualidade dos sistemas de jogo

## Atributos, equipamento e conteúdo

- Manter atributos-base como verdade.
- Representar equipamento por IDs e definições de dados.
- Calcular modificadores e poder quando necessário; não persistir valor derivado.
- Separar slot, tier, poder, preço e origem do item.
- Validar IDs únicos, referências existentes, ranges e chances.
- Evitar um atributo dominante sem tradeoff ou teto.

Para progressão com equipamento, comparar pelo menos:

- sem gear;
- gear esperado para a zona;
- gear acima do tier;
- combinação extrema permitida.

## Persistência

- Versionar todo save.
- Migrar versões conhecidas e rejeitar versões desconhecidas com fallback seguro.
- Adicionar defaults para campos novos sem apagar progresso antigo.
- Validar números finitos, limites, IDs e relações temporais.
- Preservar valores fracionários quando participam do progresso.
- Testar save anterior, save atual, save parcial e save corrompido.
- Persistir dados autoritativos; reconstruir catálogos e valores derivados.

Para localStorage, considerar uma cópia do último save válido antes de evoluir
para slots ou escrita mais robusta.

## Game UI/UX

Toda tela de sistema deve responder imediatamente:

- o que está acontecendo;
- qual gato está envolvido;
- quanto já acumulou;
- qual é o limite;
- o que acontece ao clicar;
- por que uma ação está bloqueada.

Usar layout responsivo, foco visível, navegação por teclado e alvos adequados ao
toque. Não depender apenas de cor para raridade ou estado.

Não expor números sem contexto. Exibir poder junto da recomendação da zona e
traduzir eficiência em linguagem compreensível, sem esconder o valor detalhado
quando ele ajuda uma decisão.

## Game feel

Escalonar feedback:

- comum: mudança numérica e animação curta;
- conclusão ou nível: som, destaque e movimento moderados;
- gema ou gear raro: revelação distinta, sem interromper excessivamente o loop.

Associar feedback a eventos claros (`collect`, `levelUp`, `rareDrop`, `equip`).
Oferecer alternativa para movimento reduzido e evitar tremor de tela em ações
rotineiras de um idle casual.

## Cobertura

Transformar o design em testes:

- fórmulas nos limites inferior, nominal e superior;
- caps exatos e um passo além;
- migração de todas as versões suportadas;
- RNG controlado para drop comum, raro e ausência de drop;
- roster paralelo sem recompensa duplicada;
- UI com estados vazio, ativo, cheio, bloqueado e coletável;
- regressão de atividades, energia, economia e offline existentes.
