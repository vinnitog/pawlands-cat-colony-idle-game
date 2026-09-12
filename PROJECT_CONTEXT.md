# PROJECT_CONTEXT.md - pawlands-cat-colony-idle

Gerado em: 2026-07-06 19:53:45
Atualizado em: 2026-09-12

## Descricao

`Catvolution: Infinite Idle` é a evolução do Pawlands/Cat Colony Idle: um jogo
incremental em que todo o universo é formado por gatos e a colônia progride por
tecnologia, ciência, mutações, eras e combinações entre caminhos.

## Objetivo

Criar um MVP jogável de Catvolution para navegador, PWA e futura publicação na
Google Play. O MVP preserva a colônia medieval, exploração e loot existentes e
adiciona árvores Cyber/Ciência, híbridos e o primeiro prestige, com save local e
progresso offline.

## Publico Alvo

Jogadores de idle/casual e fas de progressao com tema fofo de gatos.

## Caracteristicas Informadas

- Interface visual: Sim
- Login/autenticacao: Nao no MVP
- Banco de dados online: Nao no MVP
- Offline/PWA: Sim
- Mobile: Sim, via navegador responsivo
- Dashboard/graficos: Dashboard de jogo, sem graficos complexos no MVP
- API propria: Nao no MVP
- Integracoes externas: Nao no MVP
- Multiusuario: Nao no MVP

## Stack Escolhida

```text
React + Vite + TypeScript
```

## Motivo Da Stack

O MVP precisa de interface responsiva, estado de jogo local, telas de atividades/missoes/melhorias e regras de progressao offline. React organiza a UI e o estado, Vite mantem o ciclo de desenvolvimento leve e TypeScript protege os modelos de dados do jogo.

Supabase foi removido do escopo inicial porque o MVP aprovado deve rodar sem backend, sem login, sem banco online e sem multiplayer.

## Alternativas Rejeitadas

HTML/CSS/JS vanilla: pode limitar a evolucao com varias telas e regras de estado. Backend customizado ou Supabase: rejeitados no MVP para evitar custo e manutencao antes de existir necessidade real de sincronizacao online.

## Revisao Obrigatoria De Stack

Antes da primeira feature real, o `senior-dev` validou que React + Vite + TypeScript e save local fazem mais sentido para o objetivo atual do projeto do que React + Vite + Supabase.

Se houver front-end, `ui-ux-expert` deve validar impacto visual e UX.

O `code-reviewer` deve apontar risco de stack inadequada, excesso de complexidade ou falta de base para evolucao.

## Workflow Padrao

1. `pawlands-game-design`, quando houver impacto em mecanicas, progressao, economia, balanceamento, offline ou persistencia
2. `senior-dev`
3. `ui-ux-expert`, quando houver front-end
4. `code-reviewer`
5. `qa-senior`
6. `qa-automate`
7. Validacao final com testes e diff
8. Commit/push em `develop` e PR `develop -> main`

## Comandos De Validacao

```powershell
.\test.cmd
npm.cmd test
git diff --check
```

## Notas De Escopo

- Trabalhar sempre em `develop`.
- Nunca fazer push direto para `main`.
- Preservar alteracoes existentes do usuario.
- Fazer staging explicito por arquivo.
- Manter documentacao de contexto versionada neste arquivo.
- Save local inicial usa `localStorage` com adaptador isolado para futura migracao para IndexedDB.
- Estrutura preparada para PWA instalavel, Capacitor ou Trusted Web Activity depois do MVP.
- Deploy estatico via GitHub Pages usa GitHub Actions em `main`, build `dist` e Vite `base` em `/pawlands-cat-colony-idle-game/`.

## Direcao Visual

- O MVP deve parecer um jogo idle casual, nao um dashboard generico.
- Priorizar cenario de colonia felina, cartas tematicas, icones SVG internos e feedback visual claro.
- Manter arte simples e substituivel por assets finais no futuro.
- Toda tela nova deve respeitar a linguagem visual de acampamento/quintal, recursos ilustrados e botoes com game feel.
- Grimalkin representa a Era I dentro de uma identidade arcano-tecnológica maior.
- Cyber usa violeta/ciano; Ciência usa verdes bioluminescentes; híbridos combinam
  as duas linguagens sem transformar a interface em dashboard.
- A estratégia e o balanceamento desta transição estão em `docs/CATVOLUTION_PLAN.md`.
