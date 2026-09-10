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
- **Login mínimo (Auth.js v5, usuários individuais)** — PR #3
  (`feat/minimal-login`), **aberta, ainda não mergeada**: tabela `users`,
  regras de validação de credenciais, hash de senha, proteção de rotas,
  página `/login`. Primeiro usuário é criado via `pnpm user:create`.

## Backlog (próximas fatias, em ordem)

1. **Adicionar `.github/workflows/ci.yml`** (job `quality`: lint, format
   check, typecheck, testes com cobertura, build; job `release`:
   semantic-release após `quality` passar em push na `main`). O
   `CLAUDE.md` já descreve esse pipeline, mas o arquivo nunca existiu de
   fato — hoje PRs mergeiam sem nenhum check automático além do deploy
   preview da Vercel. **Bloqueado**: a integração GitHub do Claude não
   tem o escopo `workflow`, necessário para criar/atualizar arquivos
   nesse caminho — precisa ser aplicado manualmente por quem tem acesso
   (branch `chore/add-ci-workflow`, conteúdo já revisado).
2. **Cadastro de campanha** — depende do login (PR #3). Domínio
   `Campaign` (nome, meta monetária, período de início/fim), caso de uso
   de criação, schema/migration, repositório e uma tela protegida para
   cadastrar.
3. Categorias de lançamento associadas a uma campanha.
4. Registro de lançamentos financeiros (entradas/saídas de caixa).
5. Relatórios / acompanhamento de progresso de arrecadação por campanha.
6. Cadastro de doadores/titulares de dados pessoais, com os mecanismos de
   acesso, correção e exclusão exigidos pela LGPD (ver `CLAUDE.md`).
7. Papéis de usuário (ex.: admin/tesoureiro) e fluxo de convite/cadastro
   de novos usuários (hoje só existe `pnpm user:create` via linha de
   comando).

## Como usar este arquivo

- Antes de iniciar uma nova fatia, confira se ela já está descrita aqui;
  se não estiver, adicione uma entrada breve ao backlog antes de
  implementar.
- Ao terminar e abrir PR, mova a entrada de "Backlog" para "Concluído",
  citando o número da PR e se ela já foi mergeada.
- Não inclua aqui dados de uma instância real (nome de campanha real,
  metas, valores) — apenas o nome da _feature_, seguindo a mesma regra do
  `CLAUDE.md`.
