@AGENTS.md

# Church Cash Control — Guia do projeto

Controle de caixa para igrejas. Primeira frente: arrecadação para uma
campanha específica (compra de cadeiras). Mais regras de negócio serão
adicionadas incrementalmente — este arquivo descreve como qualquer mudança
neste repositório deve ser feita, não o que ainda falta construir.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS · Drizzle ORM + Neon
(Postgres) · Zod · Vitest · ESLint/Prettier · deploy na Vercel.

## Arquitetura

```
src/
  app/                         # Next.js App Router — apenas apresentação (rotas, páginas, layouts)
  server/
    domain/                    # Entidades e regras de negócio puras. Sem I/O, sem framework, sem imports de infra.
    application/                # Casos de uso: orquestram o domínio através de interfaces (portas).
    infrastructure/
      db/                      # Implementações concretas: cliente Neon/Drizzle, schema, repositórios.
  shared/                      # Utilitários cross-cutting (ex.: validação de env com Zod).
test/
  unit/                        # Espelha a estrutura de src/ (test/unit/domain, test/unit/shared, ...)
  integration/                 # Testes que tocam infraestrutura real (ex.: banco de dados)
```

Regra de dependência: `domain` não depende de nada fora dele.
`application` depende de `domain` e de **interfaces** (não implementações
concretas) para acessar infraestrutura. `infrastructure` implementa essas
interfaces. `app` (rotas Next.js) depende de `application`, nunca o
contrário. Isso é Dependency Inversion (SOLID) aplicado na prática — permite
testar regras de negócio sem banco de dados real.

## Princípios de código

- **SOLID e Clean Code**: uma responsabilidade por classe/função; novas
  variações de comportamento entram por composição/interfaces, não por
  `if/else` crescente; nomes revelam intenção o suficiente para o código
  dispensar comentários explicativos.
- **Proibido `any` e `unknown` não tratado.** `tsconfig.json` está em
  `strict` (+ `noUncheckedIndexedAccess`). O ESLint (`typescript-eslint`
  `strict-type-checked`) falha o build em `no-explicit-any`,
  `no-unsafe-assignment/call/member-access/return/argument`. Nunca usar
  `as any`, `as unknown as X` ou desabilitar a regra via comentário — se um
  tipo é genuinamente desconhecido (JSON externo, `process.env`, corpo de
  request), valide com **Zod** (`src/shared/env.ts` é o exemplo) e use o
  tipo inferido resultante.
- **Sem comentários óbvios.** Comente apenas o porquê de uma decisão não
  óbvia (ex.: por que `Money` usa centavos inteiros), nunca o que o código
  faz.
- **Sem código especulativo**: não adicionar abstrações, flags ou
  tratamentos de erro para cenários que a feature atual não exige.

## TDD — obrigatório

Todo código de `domain` e `application` é feito em ciclo RED → GREEN →
REFACTOR:

1. Escreva o teste que expressa a regra de negócio; rode e confirme que
   falha (RED) pelo motivo esperado (não por erro de digitação/import).
2. Implemente o mínimo para o teste passar (GREEN).
3. Refatore mantendo os testes verdes.

Os testes devem validar **regras de negócio**, não detalhes de
implementação — evite testes que só espelham o código (ex.: "chamou a
função X uma vez") sem checar comportamento observável. Cobertura mínima de
80% em `src/server/domain` e `src/server/application` é verificada no CI
(`vitest.config.mts`, seção `coverage.thresholds`). Ver
`test/unit/domain/money.test.ts` e `src/server/domain/money.ts` como
exemplo do ciclo completo.

Código de infraestrutura (`server/infrastructure`, rotas em `app/`) pode ser
coberto por testes de integração (`test/integration`) quando fizer sentido,
mas a lógica de negócio em si deve morar em `domain`/`application`, testável
sem banco de dados.

## Git e Pull Requests

- **Nunca commitar diretamente na `main`.** Toda mudança acontece em uma
  branch própria (`feat/...`, `fix/...`, `chore/...`).
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)
  (`commitlint` valida via hook `commit-msg`). O hook `pre-commit` roda
  `lint-staged` (ESLint + Prettier nos arquivos alterados).
- Ao terminar uma implementação, **abra um Pull Request contra `main`** —
  nunca faça merge/push direto. O CI (`.github/workflows/ci.yml`: lint,
  format check, typecheck, testes com cobertura, build) precisa estar verde
  antes da revisão.
- Branch protection na `main` (exigir PR + checks verdes antes de mergear)
  deve estar habilitada nas configurações do repositório no GitHub —
  configuração manual, fora do alcance de comandos git.

## Banco de dados

- Nunca importar `src/server/infrastructure/db/client.ts` a partir de
  `domain`/`application`; injete o `DbClient` (ou uma interface de
  repositório) como dependência.
- Alterações de schema: editar `src/server/infrastructure/db/schema.ts`,
  rodar `pnpm db:generate` para gerar a migration SQL em `./drizzle/`, e
  commitar o SQL gerado junto com a mudança de schema.
- Variáveis de ambiente sempre passam por `src/shared/env.ts`
  (`parseEnv`/`getEnv`), nunca acesse `process.env` diretamente fora desse
  módulo.

## Comandos úteis

`pnpm dev` · `pnpm lint` · `pnpm format:check` · `pnpm typecheck` ·
`pnpm test` / `test:watch` / `test:coverage` · `pnpm build` · `pnpm db:generate` /
`db:migrate` / `db:studio`.
