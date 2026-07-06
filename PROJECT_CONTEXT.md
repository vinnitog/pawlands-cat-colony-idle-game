# PROJECT_CONTEXT.md - pawlands-cat-colony-idle

Gerado em: 2026-07-06 19:53:45
Atualizado em: 2026-07-06

## Descricao

Jogo de navegador/PWA inspirado em progresso idle simples, com tematica de gatos e identidade propria.

## Objetivo

Criar um MVP jogavel de Pawlands: Cat Colony Idle para navegador de PC e celular, com save local, progresso offline e estrutura preparada para virar PWA instalavel no futuro.

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

1. `senior-dev`
2. `ui-ux-expert`, quando houver front-end
3. `code-reviewer`
4. `qa-senior`
5. `qa-automate`
6. Validacao final com testes e diff
7. Commit/push em `develop` e PR `develop -> main`

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
