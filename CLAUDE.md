@AGENTS.md
@ROADMAP.md

# Church Cash Control — Guia do projeto

Controle de caixa para igrejas: cada igreja cadastra suas próprias
campanhas de arrecadação (nome, meta, período, categorias) como **dados
configuráveis no banco** — o código não conhece nem hardcoda qual campanha
existe. Mais regras de negócio serão adicionadas incrementalmente — este
arquivo descreve como qualquer mudança neste repositório deve ser feita,
não o que ainda falta construir nem detalhes de uma instância específica.

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

## Telas novas: preview antes de implementar

Antes de criar ou alterar visualmente qualquer tela (`app/**/page.tsx` novo,
ou mudança de layout/navegação em uma existente), apresente um preview
(mockup) do resultado para aprovação do usuário **antes** de aplicar no
código do projeto. Só depois da aprovação explícita, implemente a tela de
fato (componente React/Tailwind real, integrado à `application`/`domain`
como o resto do projeto). Isso vale tanto para telas novas quanto para
navegação/links entre telas existentes (ex.: uma home vinculando às telas
de cadastro).

## Feedback de interação do usuário

Toda ação do usuário (clique em botão, submit de formulário) precisa de
feedback visível de que foi recebida — nunca deixar a tela parada e sem
resposta enquanto uma ação assíncrona processa (ex.: server action de
formulário). Concretamente:

- **Estado de carregamento**: botão de submit mostra estado
  pendente/desabilitado (ex.: `useFormStatus` do `react-dom`) enquanto a
  action roda — nunca fica com aparência de "nada aconteceu" por vários
  segundos. Como o padrão se repete em todo formulário do app, use um
  componente compartilhado (ex.: `SubmitButton`) em vez de duplicar a
  lógica em cada tela.
- **Resultado com próximo passo**: toda tela de sucesso/erro após uma ação
  (ex.: "Campanha criada com sucesso") também precisa indicar o que fazer
  em seguida — nunca deixar o usuário num beco sem saída sem link de
  volta/continuação.

## Escopo de uma fatia em andamento

Se, durante a implementação de uma fatia, o usuário pedir algo novo que
não faz parte do escopo dela, **adicione ao backlog do `ROADMAP.md` em
vez de implementar na hora** — a menos que o pedido seja necessário para
a fatia atual continuar (ex.: um bug/lacuna na própria funcionalidade que
está sendo implementada, descoberto ao validar; ver exemplos de "lacunas
descobertas durante a validação em preview" no `ROADMAP.md`). Nesse caso,
sim, implemente como parte da fatia atual. Na dúvida se algo bloqueia a
continuidade ou é só um pedido novo, pergunte antes de decidir sozinho.

## Skeletons de carregamento

Toda tela que busca dado no servidor antes de renderizar (`page.tsx` com
`await` numa query) precisa de um `loading.tsx` (mecanismo nativo do
Next.js App Router) com um skeleton no lugar do conteúdo — nunca deixar a
tela em branco enquanto a query roda, nem só durante a navegação inicial:
também vale quando a mesma rota recarrega dados por causa de uma mudança
de estado (ex.: trocar um filtro que navega para a rota com outra
`searchParams`). Use o componente `Skeleton` compartilhado
(`src/app/_components/skeleton.tsx`) em vez de duplicar `animate-pulse`
em cada tela. Telas que só renderizam um formulário sem nenhuma leitura
prévia do banco (ex.: `/campaigns/new`) não precisam de `loading.tsx`.

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
  `lint-staged` (ESLint + Prettier nos arquivos alterados). O tipo do commit
  (`fix`, `feat`, `BREAKING CHANGE`) não é só estilo — é o que determina o
  bump de versão SemVer (ver seção abaixo), então use o tipo certo.
- Ao terminar uma implementação, **abra um Pull Request contra `main`** —
  nunca faça merge/push direto. O CI (`.github/workflows/ci.yml`: lint,
  format check, typecheck, testes com cobertura, build) precisa estar verde
  antes da revisão.
- **Abrir a PR não exige autorização adicional do usuário** — pode (e deve)
  ser feito assim que a fatia terminar de ser implementada, sem esperar
  pedido explícito, justamente para já disponibilizar o preview automático
  da Vercel para validação.
- **Nunca mergear a PR sem validação explícita do usuário.** É o merge, não
  a abertura da PR, que exige autorização explícita. Após abrir a PR, o
  usuário valida a feature no ambiente de preview (deploy automático da
  Vercel por PR) e só então confirma se o merge pode ser feito. CI verde
  é pré-requisito, não substituto dessa validação manual.
- Branch protection na `main` (exigir PR + checks verdes antes de mergear)
  deve estar habilitada nas configurações do repositório no GitHub —
  configuração manual, fora do alcance de comandos git.

## Versionamento (SemVer)

A versão do projeto segue [SemVer](https://semver.org/) e é derivada
automaticamente dos Conventional Commits mergeados na `main`, via
[semantic-release](https://semantic-release.gitbook.io/) (job `release` em
`.github/workflows/ci.yml`, roda depois que `quality` passa):

- `fix:` → **patch** (`x.y.Z`)
- `feat:` → **minor** (`x.Y.0`)
- `feat!:`, `fix!:` ou rodapé `BREAKING CHANGE:` → **major** (`X.0.0`)
- `chore:`, `docs:`, `test:`, `refactor:`, `ci:` sem `!` → não geram release

A cada push na `main` (isto é, a cada PR mergeada) o semantic-release calcula
a próxima versão, cria a tag git e uma GitHub Release com o changelog gerado
a partir das mensagens de commit — sem exigir nenhum passo manual de bump de
versão. Ele **não** commita de volta na `main` (sem plugin `@semantic-release/git`):
isso mantém "nunca commitar direto na main" sem exceção, mas por consequência
o campo `version` do `package.json` não é atualizado automaticamente — a
versão real do projeto é a última tag/GitHub Release, não esse campo.

## Banco de dados

- Nunca importar `src/server/infrastructure/db/client.ts` a partir de
  `domain`/`application`; injete o `DbClient` (ou uma interface de
  repositório) como dependência.
- Alterações de schema: editar `src/server/infrastructure/db/schema.ts`,
  rodar `pnpm db:generate` para gerar a migration SQL em `./drizzle/`, e
  commitar o SQL gerado junto com a mudança de schema.
- **Migrations são aplicadas automaticamente no deploy da Vercel**: o
  script `vercel-build` (`package.json`) roda `pnpm db:migrate` antes de
  `next build`, usando o `DATABASE_URL` do ambiente do deploy (Production
  ou Preview). Ou seja, qualquer migration SQL commitada em `./drizzle/`
  é aplicada automaticamente no banco correto antes de cada deploy — não
  há passo manual pendente. Isso não roda no CI do GitHub Actions (job
  `quality`), que continua usando `next build` sem tocar em banco real.
- Variáveis de ambiente sempre passam por `src/shared/env.ts`
  (`parseEnv`/`getEnv`), nunca acesse `process.env` diretamente fora desse
  módulo.

## Autenticação

Login mínimo via [Auth.js v5](https://authjs.dev) (usuários individuais,
tabela `users`, sessão JWT — sem tabelas de conta/sessão do adapter):

- `src/auth.config.ts`: configuração leve (páginas, callback `authorized`
  que decide o que fica atrás do login) — usada pelo `src/proxy.ts`.
- `src/auth.ts`: configuração completa, com o Credentials provider
  (`authorize` valida via `parseCredentials` + `verifyPassword`).
- `src/proxy.ts`: Proxy do Next.js (renomeado de `middleware` na v16) que
  protege todas as rotas exceto `/login` e assets, via `NextAuth(authConfig).auth`.
- Não há tela de cadastro de usuário — o primeiro usuário é criado com
  `pnpm user:create <email> <senha>` (`scripts/create-user.ts`). Uma feature
  de convite/cadastro fica para quando houver papéis definidos.
- `token`/`session` do Auth.js são tipados como `Record<string, unknown>`
  internamente; sempre estreite com `typeof x === "..."` antes de atribuir
  (ver `src/auth.ts`) em vez de usar `as`/`any`.
- Todo usuário nasce com `mustChangePassword = true` (default da coluna
  `must_change_password`). O callback `authorized` (`src/auth.config.ts`)
  força redirecionamento para `/change-password` enquanto essa flag for
  verdadeira, bloqueando o resto da aplicação. Ao salvar a nova senha
  (`changePassword`, `src/server/application/change-password.ts`), a flag é
  zerada e a sessão é encerrada (`signOut`) para obrigar um novo login já
  com a senha definitiva — evita ter que reemitir o JWT em memória.

## Campanhas e regras de negócio: dados no banco, não no repositório

Este projeto é a base para **qualquer** igreja configurar suas próprias
campanhas de arrecadação, cada uma com seu nome, meta, período e regras.
Isso é dado, não código:

- **Nunca** referenciar uma campanha, meta ou regra de negócio específica
  de uma instância real em código, nomes de variáveis/tabelas/branches,
  comentários, mensagens de commit, testes (além de fixtures claramente
  genéricas, ex.: `"Campanha de teste"`), `README.md` ou `CLAUDE.md`. Esses
  arquivos descrevem a plataforma, não uma instância dela.
- Se uma feature exige um exemplo, use um nome de campanha obviamente
  fictício e genérico (ex.: `"Campanha X"`), nunca uma campanha real da
  igreja do usuário.
- `domain`/`application` modelam o **conceito** de campanha (nome, meta,
  período, categorias de lançamento) de forma agnóstica — a instância de
  cada igreja é uma linha no banco, cadastrada em tempo de uso, não uma
  branch, config file ou constante no código.

## Dados sensíveis e LGPD

Este sistema lida com dados financeiros e, potencialmente, dados pessoais
(nome, telefone, CPF, chave Pix de doadores/tesoureiros). Trate tudo isso
como dado sensível sob a LGPD (Lei 13.709/2018) desde o design:

- **Nunca commitar** credenciais, connection strings reais, tokens de API,
  números de telefone, chave Pix, CPF ou qualquer dado pessoal real — nem
  em código, nem em `.env*` versionado, nem em comentários, nem em
  `README.md`/`CLAUDE.md`, nem em fixtures/seeds de teste. Segredos vivem
  em variáveis de ambiente (Neon/Vercel), nunca no repositório; use sempre
  dados fictícios em exemplos e testes.
- **Minimização**: colete e persista só os dados pessoais estritamente
  necessários para a finalidade (ex.: identificar um doador para emitir
  recibo), nunca "pra garantir" ou "pode ser útil depois".
- **Nunca logar dado pessoal** (`console.log`, mensagens de erro, eventos de
  analytics) — nem acidentalmente ao logar um objeto inteiro; logue apenas
  identificadores técnicos (ids), nunca nome/telefone/CPF/chave Pix.
- Campos pessoais sensíveis (CPF, telefone, chave Pix) devem ser tratados
  como tal no schema/repositório desde o início (controle de acesso por
  papel, nunca expostos em endpoints/relatórios que não precisem deles).
- Ao implementar cadastro de doadores/titulares de dados, prever desde já
  os mecanismos que a LGPD exige: acesso aos próprios dados, correção e
  exclusão/anonimização mediante solicitação do titular.
- Isso vale para qualquer artefato que possa ser publicado ou compartilhado
  (README, PR, issue, log de CI): nada de dado real de uma igreja/pessoa
  específica neles.

## Comandos úteis

`pnpm dev` · `pnpm lint` · `pnpm format:check` · `pnpm typecheck` ·
`pnpm test` / `test:watch` / `test:coverage` · `pnpm build` · `pnpm db:generate` /
`db:migrate` / `db:studio`.
