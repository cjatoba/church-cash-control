# Church Cash Control

Sistema de controle de caixa para igrejas. Cada igreja configura suas
próprias campanhas de arrecadação (nome, meta, período, regras) como dados
no banco — este repositório não conhece nem documenta campanhas de uma
igreja específica. Veja [`CLAUDE.md`](./CLAUDE.md#campanhas-e-regras-de-negócio-dados-no-banco-não-no-repositório)
para a convenção completa.

## Stack

- [Next.js](https://nextjs.org/docs) (App Router) + TypeScript (`strict`)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) + [Neon](https://neon.com/docs/introduction) (Postgres serverless)
- [Zod](https://zod.dev) para validação de dados externos (env vars, entradas de formulário/API)
- [Vitest](https://vitest.dev) para testes (TDD)
- ESLint (`typescript-eslint` strict + type-checked) + Prettier
- Deploy na [Vercel](https://vercel.com/docs)

Veja [`CLAUDE.md`](./CLAUDE.md) para as convenções de arquitetura, código e
processo de desenvolvimento deste projeto.

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local   # preencha DATABASE_URL com a connection string do Neon
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco de dados (Neon)

1. Crie uma conta gratuita em [console.neon.tech](https://console.neon.tech) e um projeto.
2. Copie a _connection string_ (variante _pooled_) e cole em `DATABASE_URL` no `.env.local`.
3. Rode as migrations: `pnpm db:generate` (gera SQL a partir do schema) e `pnpm db:migrate` (aplica).
4. Ao conectar o repositório na Vercel, instale a [integração Neon↔Vercel](https://neon.com/docs/guides/vercel):
   ela cria automaticamente um _branch_ de banco isolado para cada Pull Request/Preview Deployment,
   permitindo testar migrations sem afetar o banco de produção.

## Scripts

| Script                                       | Descrição                                        |
| -------------------------------------------- | ------------------------------------------------ |
| `pnpm dev`                                   | Sobe o servidor de desenvolvimento               |
| `pnpm build`                                 | Build de produção                                |
| `pnpm lint`                                  | ESLint                                           |
| `pnpm format` / `format:check`               | Prettier (aplica / apenas verifica)              |
| `pnpm typecheck`                             | `tsc --noEmit`                                   |
| `pnpm test` / `test:watch` / `test:coverage` | Vitest (uma vez / watch / com cobertura)         |
| `pnpm db:generate`                           | Gera migrations Drizzle a partir do schema       |
| `pnpm db:migrate`                            | Aplica migrations pendentes no banco configurado |
| `pnpm db:studio`                             | Abre o Drizzle Studio para inspecionar o banco   |

## Fluxo de contribuição

Nunca commitar diretamente na `main`. Toda mudança segue: branch própria →
commits (Conventional Commits) → Pull Request → CI verde → revisão → merge.
Detalhes completos em [`CLAUDE.md`](./CLAUDE.md).

## Versionamento

A versão segue [SemVer](https://semver.org/), calculada automaticamente a
partir dos Conventional Commits mergeados na `main` via
[semantic-release](https://semantic-release.gitbook.io/) — cada merge gera
tag e GitHub Release quando aplicável, sem bump manual. Detalhes em
[`CLAUDE.md`](./CLAUDE.md#versionamento-semver).

## Dados sensíveis e LGPD

Nenhum dado real (campanha, doador, telefone, CPF, chave Pix, credencial)
deve aparecer neste repositório — nem em código, nem em docs, nem em
testes. Esses dados vivem só no banco de dados de cada instância, com
acesso controlado. Ver [`CLAUDE.md`](./CLAUDE.md#dados-sensíveis-e-lgpd)
para as regras completas.
