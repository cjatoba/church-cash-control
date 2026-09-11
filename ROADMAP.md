# Roadmap do projeto

Este arquivo registra o **estado da implementação** (o que já existe e o
que está planejado) para que qualquer sessão — humana ou de IA — consiga
retomar o trabalho sem precisar re-descobrir o contexto. Ele complementa o
[`CLAUDE.md`](./CLAUDE.md) (que descreve _como_ mudar o código, não _o que_
falta mudar).

**Mantenha este arquivo atualizado**: ao concluir uma fatia, mova-a para
"Concluído"; ao planejar a próxima, adicione ao backlog antes de começar a
implementar.

## Concluído

- Fundação do projeto: Next.js (App Router) + TypeScript `strict`,
  Tailwind, ESLint/Prettier, Husky + commitlint, Vitest com cobertura,
  semantic-release (SemVer automático).
- Infraestrutura de banco: Drizzle ORM + Neon, cliente de conexão,
  validação de env vars via Zod (`src/shared/env.ts`).
- Value object `Money` (domínio, centavos inteiros) — TDD completo.
- **CI real** (`.github/workflows/ci.yml`, PR #6): job `quality` (lint,
  format check, typecheck, testes com cobertura, build) em push/PR para
  `main`, e job `release` (semantic-release) após o `quality` passar em
  push na `main`. Antes desta fatia, o arquivo era só referenciado no
  `CLAUDE.md` mas nunca existiu de fato — PRs eram mergeadas sem nenhum
  check automático além do deploy preview da Vercel.
- **Login mínimo (Auth.js v5, usuários individuais)** — PR #3: tabela
  `users`, regras de validação de credenciais, hash de senha, proteção de
  rotas, página `/login`. Primeiro usuário é criado via
  `pnpm user:create <email> <senha>` — não há tela de cadastro (fica para
  quando papéis de usuário forem definidos, ver backlog).
- **Troca de senha obrigatória no primeiro acesso** — PR #12: todo usuário
  nasce com `mustChangePassword = true`; o callback `authorized`
  (`src/auth.config.ts`) força redirecionamento para `/change-password`
  enquanto a flag estiver ativa, bloqueando o resto da aplicação. Ao salvar
  a nova senha a flag é zerada e a sessão é encerrada, exigindo novo login
  já com a senha definitiva. TDD completo em `domain`/`application`
  (`change-password.ts`), cobertura 100%.
- **Cadastro de campanha** — PR #8: domínio `Campaign` (nome, meta
  monetária, período de início/fim) + caso de uso de criação
  (`CampaignRepository` como porta, Dependency Inversion) + tabela
  `campaigns`/migration + repositório Drizzle + tela protegida
  `/campaigns/new`. TDD completo em `domain`/`application`, cobertura
  100%. Sem categorias de lançamento ainda (fica para o backlog).
- **Fix de CI** — PR #10: `pnpm lint` rodava antes do Next.js gerar
  `.next/types`, fazendo o ESLint tipado enxergar `PageProps<"/rota">`
  como `any` num checkout limpo (exatamente o que o CI faz) e falhar em
  `no-unsafe-assignment` em qualquer página que use `PageProps` — afetava
  as PRs #3 e #8. Corrigido no script `lint` (`package.json`), que agora
  roda `next typegen` antes do `eslint`, igual o `typecheck` já fazia.
- **Redirecionamento de usuário autenticado para fora do `/login`** — PR
  #17: o callback `authorized` (`src/auth.config.ts`) agora redireciona
  para `/` quem já está autenticado e acessa `/login` (ou `/change-password`
  já com a troca de senha concluída), em vez de mostrar o formulário de
  novo.

## Em andamento (PRs abertas)

Nenhuma no momento.

## Backlog (próximas fatias, em ordem)

1. Categorias de lançamento associadas a uma campanha.
2. Registro de lançamentos financeiros (entradas/saídas de caixa).
3. Relatórios / acompanhamento de progresso de arrecadação por campanha.
4. Cadastro de doadores/titulares de dados pessoais, com os mecanismos de
   acesso, correção e exclusão exigidos pela LGPD (ver `CLAUDE.md`).
5. Papéis de usuário (ex.: admin/tesoureiro) e fluxo de convite/cadastro
   de novos usuários (hoje só existe `pnpm user:create` via linha de
   comando).

## Como usar este arquivo

- Antes de iniciar uma nova fatia, confira se ela já está descrita aqui;
  se não estiver, adicione uma entrada breve ao backlog antes de
  implementar.
- Ao terminar e abrir PR, mova a entrada de "Backlog" para "Em andamento"
  (ou "Concluído" quando já mergeada), citando o número da PR.
- Não inclua aqui dados de uma instância real (nome de campanha real,
  metas, valores) — apenas o nome da _feature_, seguindo a mesma regra do
  `CLAUDE.md`.
