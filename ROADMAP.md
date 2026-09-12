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
- **Categorias de lançamento associadas a uma campanha** — PR #19: domínio
  `TransactionCategory` (`campaignId`, nome, tipo entrada/saída) + caso de
  uso de criação (`TransactionCategoryRepository` como porta) + tabela
  `transaction_categories`/migration (FK para `campaigns`, `ON DELETE
CASCADE`) + repositório Drizzle + tela protegida
  `/campaigns/[id]/categories/new`. TDD completo, cobertura 100%. A
  mesma PR também cobriu lacunas descobertas durante a validação em
  preview, fora do escopo original da fatia:
  - Painel inicial (`/`) substituindo o placeholder padrão do Next.js:
    lista campanhas cadastradas com atalhos "+ Nova campanha" e "+
    Categoria" por campanha, em vez de exigir digitar rota na mão
    (`listCampaigns`/`CampaignListRepository`, `CampaignSummary` no
    domínio).
  - Feedback de interação em todo formulário do app (login, trocar senha,
    nova campanha, nova categoria): botão com estado de carregamento
    (`SubmitButton` compartilhado, `useFormStatus`) e fluxo de
    erro/sucesso via `useActionState` — erro mantém a pessoa no
    formulário com os dados preservados (antes recarregava a página e
    perdia tudo); sucesso de campanha volta pro painel, sucesso de
    categoria limpa o formulário para cadastrar a próxima. Link fixo "←
    Voltar para o painel" nos formulários de campanha/categoria (antes
    não existia nenhuma saída antes de submeter).
  - Aplicação manual das migrations de `campaigns`/`transaction_categories`
    nos bancos Neon de `production` e `preview`, que estavam pendentes
    desde a PR #8 (a automação desse passo foi resolvida depois, ver
    entrada abaixo).
- **Migrations aplicadas automaticamente no deploy da Vercel.** O script
  `vercel-build` (`package.json`) roda `pnpm db:migrate` antes de
  `next build`, contra o `DATABASE_URL` do ambiente do deploy (Production
  ou Preview) — resolve a causa raiz da quebra de PR #19 (migrations de
  `campaigns`/`transaction_categories` pendentes em produção/preview por
  dias sem ninguém notar). Ver `CLAUDE.md`, seção "Banco de dados".

## Em andamento (PRs abertas)

- **Controle de carnês, sub-fatias 1 e 2 (doador + tipo de carnê + carnê
  com parcelas geradas automaticamente; dar baixa em parcela)** — PR #23.
  Ver detalhes no item 1 do backlog abaixo.

## Backlog (próximas fatias, em ordem)

1. **Controle de carnês (compromisso de pagamento parcelado por doador) e
   doação avulsa.** Motivação: além de acompanhar entrada/saída total por
   categoria, uma campanha precisa saber, por doador, quanto já foi pago
   de um compromisso parcelado (carnê), quanto falta, e quem já quitou (e
   por isso não deve mais ser cobrado nos próximos meses) — além de
   registrar contribuições avulsas de quem não tem carnê, e acompanhar se
   a meta mensal (meta da campanha ÷ nº de meses do período) está sendo
   atingida. Decisões de modelagem já fechadas:
   - Doador cadastra só nome por enquanto (minimização de dado pessoal —
     ver seção LGPD do `CLAUDE.md`); dado de contato fica para quando o
     item "doadores/LGPD" (item 5) for retomado.
   - Tipo de carnê é dado configurável por campanha (nome + valor de
     parcela), não hardcoded.
   - Parcelas são geradas automaticamente, uma por mês, com o valor do
     tipo de carnê, do mês em que o carnê é criado até o mês final do
     período da campanha — sem campo de "quantidade de parcelas" à parte.
   - Categoria de lançamento (já existente) fica fora desse fluxo; carnê e
     doação avulsa são conceitos próprios.

   Fatiado em (agrupadas na mesma PR #23 enquanto ela estiver aberta):
   1. Doador + tipo de carnê + carnê com parcelas geradas automaticamente
      (cadastro de doador, cadastro de tipo de carnê por campanha, tela de
      vincular doador a um tipo de carnê). **Implementada, ver "Em
      andamento" acima.**
   2. Dar baixa em parcela (registrar pagamento; data = hoje e valor = o
      da própria parcela, sem pagamento parcial por enquanto) — tela
      `/campaigns/[id]/pledges/[pledgeId]` com uma linha por parcela.
      **Implementada, ver "Em andamento" acima.**
   3. Doação avulsa (contribuição sem carnê, vinculada a um doador
      cadastrado ou a um nome livre).
   4. Painel mensal de acompanhamento de meta (meta mensal batida ou não,
      quem pagou/quem ainda não pagou no mês).

2. **Editar e excluir campanha e categoria de lançamento.** Hoje só existe
   cadastro (criação) das duas — sem edição nem exclusão. A razão de vir
   **antes** de "Registro de lançamentos financeiros" (item 3) continua
   valendo mesmo com o adiantamento do item 1: uma vez que lançamentos ou
   carnês existirem referenciando `campaigns`/`transaction_categories` por
   FK, excluir uma campanha/categoria passa a arriscar apagar dado
   financeiro real junto (a FK de `transaction_categories` já é
   `ON DELETE CASCADE` em relação a `campaigns` — ver `schema.ts`). Regra
   de exclusão já decidida: **exclusão lógica (soft delete)** — arquivar
   marca a campanha/categoria como inativa (some das listas ativas e das
   opções de novo lançamento/categoria/carnê) sem apagar nada, e é
   reversível. Preview das telas (painel com "Editar"/"Arquivar", tela de
   editar campanha, lista de categorias com editar/arquivar, tela de
   editar categoria) já aprovado; falta implementar.
3. Registro de lançamentos financeiros genéricos (entradas/saídas de caixa
   fora do fluxo de carnê/doação avulsa) — revisar se ainda é necessário
   como fatia própria depois do item 1, ou se carnê + doação avulsa já
   cobre o caso de uso real.
4. Relatórios / acompanhamento de progresso de arrecadação por campanha —
   parte disso (meta mensal) já é coberta pela sub-fatia 4 do item 1;
   revisar o que sobra como fatia própria depois dele.
5. Cadastro de doadores/titulares de dados pessoais: evoluir a entidade
   `Donor` (hoje só nome, ver item 1) com os demais dados quando
   necessário, e prever os mecanismos de acesso, correção e
   exclusão/anonimização exigidos pela LGPD (ver `CLAUDE.md`).
6. Papéis de usuário (ex.: admin/tesoureiro) e fluxo de convite/cadastro
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
