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
- **Controle de carnês (compromisso de pagamento parcelado por doador) e
  doação avulsa** — PR #23: domínio `Donor` (só nome, minimização de dado
  pessoal), `PledgeType` (tipo de carnê configurável por campanha: nome +
  valor de parcela) e `Pledge`/`Installment` (carnê + parcelas geradas
  automaticamente, uma por mês, do mês de adesão até o fim do período da
  campanha) + tabelas `donors`/`pledge_types`/`pledges`/`installments` +
  repositórios Drizzle + telas `/campaigns/[id]/pledge-types`,
  `/campaigns/[id]/donors(/new)`. TDD completo, cobertura 100%. A mesma
  PR também cobriu, como sub-fatias:
  - Dar baixa em parcela (`payInstallment`, domínio `installment.ts`):
    tela `/campaigns/[id]/pledges/[pledgeId]` lista as parcelas do carnê
    com botão "Dar baixa" nas pendentes (data = hoje, valor = o da
    própria parcela; rejeita dar baixa em parcela já paga).
  - Doação avulsa (`OneOffDonation`, tabela `one_off_donations`):
    contribuição pontual (valor, data, nome livre opcional — em branco
    fica anônima) para quem não tem carnê, sem vínculo com um cadastro de
    doador; tela `/campaigns/[id]/one-off-donations/new`.
  - Painel mensal de acompanhamento de meta (`domain/monthly-progress.ts`,
    tela `/campaigns/[id]/monthly`): meta mensal = meta da campanha ÷ nº
    de meses do período; mês selecionável (limitado ao período da
    campanha, padrão = mês atual); lista quem pagou (parcela paga naquele
    mês + doações avulsas daquele mês) e quem ainda tem parcela pendente.
  - Categoria de lançamento (já existente antes desta PR) ficou fora
    desse fluxo — carnê e doação avulsa são conceitos próprios.

## Em andamento (PRs abertas)

- **Editar e arquivar campanha e categoria de lançamento** — PR #25: hoje
  só existia cadastro (criação) das duas — sem edição nem exclusão. A
  razão de entrar antes de "Registro de lançamentos financeiros genéricos"
  ficou mais forte porque carnês/parcelas/doações avulsas (ver
  `Concluído`) já referenciam `campaigns` por FK: excluir uma
  campanha/categoria arriscaria apagar dado financeiro real junto (a FK de
  `transaction_categories` já é `ON DELETE CASCADE` em relação a
  `campaigns` — ver `schema.ts`). Implementado como **exclusão lógica
  (soft delete)**: coluna `active` em `campaigns`/`transaction_categories`
  — arquivar marca a campanha/categoria como inativa (some das listas
  ativas) sem apagar nada, e é reversível (opção "Reativar"). Casos de
  uso `updateCampaign`, `archiveCampaign`/`restoreCampaign`,
  `updateTransactionCategory`,
  `archiveTransactionCategory`/`restoreTransactionCategory` (TDD
  completo) + telas `/campaigns/[id]/edit`, `/campaigns/[id]/categories`
  (lista de categorias, não existia antes) e
  `/campaigns/[id]/categories/[categoryId]/edit`. Aguardando validação no
  preview da Vercel antes do merge. A mesma PR também cobriu lacunas
  descobertas durante essa validação, fora do escopo original da fatia:
  - Editar uma campanha para encurtar o período não atualizava as
    parcelas de carnês já geradas. `updateCampaign` agora remove as
    parcelas ainda não pagas cujo vencimento ficou fora do novo período
    (`selectInstallmentsOutsidePeriod` em `domain/pledge.ts`); parcelas já
    pagas nunca são removidas, pois são histórico financeiro.
  - "Dar baixa" numa parcela sempre registrava o pagamento com a data
    atual, sem opção de informar uma data anterior. A tela de carnê
    (`/campaigns/[id]/pledges/[pledgeId]`) ganhou um campo de data por
    parcela (padrão: hoje, editável para qualquer data passada);
    `payInstallment` (domínio) passa a rejeitar data de pagamento no
    futuro.
  - A remoção automática de parcelas ao encurtar o período (item acima)
    acontecia sem avisar o usuário. A tela de editar campanha agora
    calcula no cliente (reaproveitando `selectInstallmentsOutsidePeriod`)
    quantas parcelas pendentes seriam removidas e pede confirmação num
    modal antes de salvar, caso alguma seria removida.
  - Decisão registrada para o caso inverso (aumentar o período): carnês
    existentes **não são estendidos automaticamente** — o doador que
    aderiu a um período não deve ganhar meses extras sem concordar.
    `updateCampaign` sinaliza quando o período foi estendido e a campanha
    já tem parcelas; a página de edição redireciona para
    `/?campaignExtended=1` e o painel mostra um aviso informativo (não
    bloqueante) explicando que os carnês não mudaram.
  - Depois de "dar baixa" numa parcela, não havia como corrigir a data se
    fosse informada errada por engano. Parcela paga ganhou um link
    "Editar" que abre um modal para corrigir só a data (o valor
    registrado não muda); `correctInstallmentPaymentDate` (domínio)
    exige que a parcela já esteja paga e rejeita data futura, espelhando
    `payInstallment`.

## Backlog (próximas fatias, em ordem)

1. Registro de lançamentos financeiros genéricos (entradas/saídas de caixa
   fora do fluxo de carnê/doação avulsa) — revisar se ainda é necessário
   como fatia própria, ou se carnê + doação avulsa já cobre o caso de uso
   real.
2. Relatórios / acompanhamento de progresso de arrecadação por campanha —
   parte disso (meta mensal) já é coberta pelo painel mensal de carnês
   (ver `Concluído`); revisar o que sobra como fatia própria depois dele.
3. Cadastro de doadores/titulares de dados pessoais: evoluir a entidade
   `Donor` (hoje só nome, ver `Concluído`) com os demais dados quando
   necessário, e prever os mecanismos de acesso, correção e
   exclusão/anonimização exigidos pela LGPD (ver `CLAUDE.md`).
4. Papéis de usuário (ex.: admin/tesoureiro) e fluxo de convite/cadastro
   de novos usuários (hoje só existe `pnpm user:create` via linha de
   comando).
5. Confirmação ao sair (logout): pedir confirmação ("Deseja realmente
   sair?") antes de encerrar a sessão, em vez de sair direto no clique.
6. Painel mensal reativo: trocar o mês no seletor deve atualizar a tela
   sozinho, sem precisar clicar em "Ver" — hoje o `<select>` depende de um
   botão de submit separado.
7. Skeletons de carregamento em todas as telas que buscam dado no
   servidor (painel inicial, listas de categorias/tipos de
   carnê/doadores, painel mensal, detalhe de carnê, telas de editar) —
   ver regra já registrada em `CLAUDE.md`, seção "Skeletons de
   carregamento"; falta aplicar retroativamente nas telas existentes.
8. Log de atividades (auditoria): registrar ações relevantes (ex.: dar
   baixa/corrigir parcela, arquivar/reativar, editar campanha) com quem
   fez e quando, consultável numa tela da aplicação. Pontos a decidir
   antes de implementar: depende de papéis de usuário (item 4) para
   controlar quem pode consultar; log fica maior com o tempo (custo de
   armazenamento no Neon) — definir se há retenção/expurgo; se o log
   guardar nome de doador/valor vinculado a uma ação, entra na mesma
   categoria de dado sensível da seção LGPD do `CLAUDE.md`.

## Como usar este arquivo

- Antes de iniciar uma nova fatia, confira se ela já está descrita aqui;
  se não estiver, adicione uma entrada breve ao backlog antes de
  implementar.
- Ao terminar e abrir PR, mova a entrada de "Backlog" para "Em andamento"
  (ou "Concluído" quando já mergeada), citando o número da PR.
- Não inclua aqui dados de uma instância real (nome de campanha real,
  metas, valores) — apenas o nome da _feature_, seguindo a mesma regra do
  `CLAUDE.md`.
