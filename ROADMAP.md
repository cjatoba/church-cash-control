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
  `pnpm user:create <email> <senha>` — cadastro de novos usuários pela
  própria aplicação ficou para a fatia de papéis de usuário (ver "Em
  andamento").
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
- **Editar e arquivar campanha e categoria de lançamento** — PR #25: hoje
  só existia cadastro (criação) das duas — sem edição nem exclusão. A
  razão de entrar antes de "Registro de lançamentos financeiros genéricos"
  ficou mais forte porque carnês/parcelas/doações avulsas (ver acima)
  já referenciam `campaigns` por FK: excluir uma
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
  `/campaigns/[id]/categories/[categoryId]/edit`. A mesma PR também
  cobriu lacunas descobertas durante a validação em preview, fora do
  escopo original da fatia:
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
  - No modal de "Dar baixa", as opções "Escolher outra data"/"Cancelar"
    eram dois links de texto pequenos colados um no outro — risco real de
    toque errado no celular. Viraram botões com alvo de toque maior
    (pill, `py-2.5`) e mais espaçados; o mesmo padrão foi aplicado nos
    outros modais desta PR (editar campanha, corrigir data de pagamento)
    por consistência.
  - Corrigir a data não resolvia o caso de dar baixa por engano numa
    parcela que nem deveria estar paga. O modal "Editar" ganhou uma
    segunda seção ("Reverter para pendente") com confirmação em dois
    passos (mais fricção de propósito, por ser mais consequente que só
    corrigir a data); `revertInstallmentPayment` (domínio) só permite
    reverter uma parcela que já está paga.
- **Dinheiro em mãos** (rastreio de custódia) e forma de pagamento por
  doação — PR #27. Substitui a fatia genérica de "lançamentos financeiros
  de entrada/saída" cogitada antes: o caso de uso real era este. Hoje uma
  parcela paga ou doação avulsa não registrava quem ficou responsável pelo
  valor recebido nem a forma de pagamento (Pix/dinheiro); quando o valor
  arrecadado passa por mais de uma pessoa até virar uma compra da
  campanha, faltava visibilidade de quem está com quanto. Adicionado:
  - Forma de pagamento (Pix/dinheiro) e "Recebido por" (usuário do
    sistema, padrão o usuário logado, mas selecionável) em toda entrada
    de dinheiro (parcela paga, doação avulsa) — visível na própria tela
    do carnê (`/campaigns/[id]/pledges/[pledgeId]`).
  - Tela "Dinheiro em mãos" por campanha (`/campaigns/[id]/money-in-hand`):
    saldo de cada usuário (recebido menos repassado) e histórico de
    repasses. Histórico de recebimentos (quem recebeu cada parcela/doação)
    não entrou nessa tela — fica visível na tela do carnê; doação avulsa
    ainda não tem tela de listagem própria (lacuna pré-existente, fora do
    escopo desta fatia).
  - Registro de repasse (parcial ou total) de um usuário para um
    destinatário em texto livre (sem cadastro próprio por ora — só
    promover para cadastro se aparecer necessidade concreta de ver
    histórico por destinatário).
  - "Recebido por"/"quem repassou" é sempre selecionável (não travado no
    usuário logado, para cobrir quem recebeu o valor mas não tem acesso
    ao app no momento de registrar), mas quem de fato executou o
    registro (usuário da sessão) fica sempre gravado à parte e é
    destacado sempre que diferir do valor selecionado — mantém
    rastreabilidade sem exigir fluxo de aprovação.
  - Decisão registrada: um fluxo de aprovação explícito (registro
    pendente até confirmação de quem recebeu de fato) ficou fora do
    escopo por ora — revisar quando existirem papéis de usuário mais
    granulares (ver entrada de papéis de usuário logo abaixo — essa
    fatia subiu de prioridade justamente por essa depender de mais de um
    usuário real usando o app). Categorias de lançamento
    (`TransactionCategory`, já cadastráveis) continuam sem uso associado
    até aparecer necessidade concreta de categorizar cada repasse/gasto
    por tipo.
- **Papéis de usuário (admin/responsável pela arrecadação) e convite de
  novos usuários** — PR #28: tabela `users` ganha `role` (enum
  admin/fundraiser — rótulo "Responsável pela arrecadação"; usuários
  existentes migram como admin), `phone` (opcional) e `active` (soft
  delete). Tela `/users` lista usuários ativos e desativados, com opção
  de desativar (bloqueia login; admin não pode desativar a própria
  conta) e reativar; `/users/new` convida um novo usuário (e-mail,
  celular opcional, papel) gerando senha temporária mostrada uma única
  vez — reaproveita `mustChangePassword` já existente — com botão
  opcional para abrir o WhatsApp já com a mensagem de convite pronta
  (incluindo a URL de login do próprio ambiente — produção ou preview,
  derivada do host da requisição) quando o celular é informado (sem
  depender de provedor de e-mail); `/users/[id]/reset-password` gera
  nova senha temporária para quem ainda não trocou a original;
  `/users/[id]/edit` permite corrigir e-mail, celular e papel de um
  usuário já cadastrado (papel fica travado — select desabilitado — ao
  editar a própria conta, para ninguém se trancar fora da tela de
  gerenciar usuários por engano; reforçado também no caso de uso, não só
  na tela). Papel restringe, por ora, só o acesso à própria tela de
  gerenciar usuários (`canManageUsers`) — decisão registrada de não
  implementar um sistema de permissões granulares baseado em tabela de
  features por usuário. Ver fatia de capacidades por usuário (PR #32,
  logo abaixo): a ideia inicial era um único papel por usuário com
  `admin` como superusuário, mas apareceu um
  caso real (voluntário que cadastra campanha mas não gerencia usuário
  nem faz arrecadação) que não cabe nisso — a direção revista é cada
  usuário acumular um ou mais papéis independentes (ex.: colunas
  booleanas por capacidade: gerenciar usuários, gerenciar campanha,
  receber arrecadação), não implementada ainda.
  - Lição aprendida durante a validação em preview: a migration
    `0008_add-user-role-and-phone.sql` foi editada in-place para trocar
    o valor do enum de `treasurer` para `fundraiser` depois de já ter
    sido aplicada no banco de preview num deploy anterior — o
    `drizzle-kit migrate` não reaplica uma migration já registrada só
    porque o conteúdo do arquivo mudou, então o banco de preview
    continuou com o enum antigo (`treasurer`) mesmo com o código já
    esperando `fundraiser`, quebrando o convite de usuário com esse
    papel. Corrigido com uma migration nova
    (`0010_rename_treasurer_to_fundraiser.sql`,
    `ALTER TYPE ... RENAME VALUE`) em vez de editar a migration antiga de
    novo. Regra prática: uma vez que uma migration foi commitada (e
    principalmente depois de rodar em qualquer ambiente), sempre corrigir
    com uma migration nova — nunca editar o arquivo de uma migration já
    aplicada.
  - Também corrigido nesta PR: formulários de convidar/editar usuário
    limpavam os dados digitados quando a submissão dava erro, obrigando
    redigitar tudo (ver item 9 do backlog para o mesmo problema nos
    formulários mais antigos do app).
  - Também corrigido: erro de e-mail já cadastrado (e qualquer outro erro
    de regra de negócio do domínio/aplicação) aparecia como mensagem
    genérica "Confira os dados informados", sem dizer qual era o
    problema de verdade. `toFriendlyErrorMessage`
    (`src/app/_lib/action-error-message.ts`) agora mostra a mensagem do
    próprio erro lançado pelo domínio/aplicação (já escrita em português
    e pensada pro usuário final) e só cai no texto genérico para erro de
    validação do Zod ou qualquer exceção inesperada — evita vazar
    detalhe técnico sem esconder um erro que já é amigável.
- **Relatórios / acompanhamento de progresso de arrecadação por
  campanha** — PR #30: card de cada campanha no painel inicial passa a
  mostrar quanto já foi arrecadado (parcelas pagas + doações avulsas),
  além da meta, com uma barra de progresso — antes só a meta aparecia,
  exigindo entrar na campanha (painel mensal) para ter essa visão.
  `CampaignSummary` ganha `raisedTotal`; o cálculo usa duas queries
  agregadas (`SUM ... GROUP BY campanha`) trazendo o total de todas as
  campanhas de uma vez, em vez de uma query por campanha no loop da
  listagem (mesmo padrão já usado em `custody-repository.ts`). Escopo
  restante do relatório de progresso (além do que já é coberto pelo
  painel mensal de carnês e por esta fatia) fica para revisão futura, se
  aparecer necessidade concreta.
- **Mais papéis de usuário e permissões por tela** — PR #32: substitui o
  enum `role` (admin/responsável pela arrecadação) por três capacidades
  booleanas independentes por usuário (`canManageUsers`,
  `canManageCampaigns`, `canReceiveFunds`) — decisão de modelo tomada com
  o usuário: um único papel com `admin` como superusuário não cobria o
  caso real de um voluntário que cadastra campanha mas não gerencia
  usuário nem faz arrecadação. Acesso de só visualização = nenhuma
  capacidade marcada. Cada ação de mutação do app (criar/editar/arquivar
  campanha e categoria, criar tipo de carnê → `canManageCampaigns`;
  cadastrar doador/carnê, dar baixa/corrigir/reverter parcela, doação
  avulsa, repasse → `canReceiveFunds`; gerenciar usuários →
  `canManageUsers`, já existente) passa a checar a capacidade
  correspondente, na página e na própria server action (defesa em
  profundidade, mesmo padrão de `/users`). Migration faz backfill dos
  usuários existentes (admin → as três capacidades; responsável pela
  arrecadação → só `canReceiveFunds`). `pnpm user:create` (primeiro
  usuário do sistema) passa a conceder as três capacidades.
  - **Lição aprendida durante a validação em preview**: o mecanismo de
    "migrations aplicadas automaticamente no deploy da Vercel" (script
    `vercel-build`) estava silenciosamente quebrado — o log de build
    mostrava `[✓] migrations applied successfully!`, mas
    `drizzle-kit migrate` não aplicava nada de fato nem gravava linha em
    `drizzle.__drizzle_migrations`. Isso passou despercebido por várias
    PRs anteriores: o banco de **produção** estava parado desde a
    migration `0007` (sem `role`/`phone`/`active` das PRs #25/#28), ou
    seja, o login em produção já estava quebrado antes desta fatia, só
    que nunca tinha sido notado porque a validação de cada PR sempre
    aconteceu no ambiente de preview. Corrigido aplicando manualmente,
    via SQL direto, as migrations pendentes nos dois bancos (`0011`/`0012`
    no preview; `0008` a `0012` em produção) e inserindo as linhas
    correspondentes em `drizzle.__drizzle_migrations` com o hash correto
    (`sha256` do conteúdo de cada arquivo, mesmo algoritmo do
    `drizzle-orm/migrator`) para o próximo deploy automático não tentar
    reaplicá-las. A causa raiz de por que `drizzle-kit migrate` finge
    sucesso sem aplicar nada continua sem explicação — ver item 1 do
    backlog.

## Em andamento (PRs abertas)

- **Investigar por que `drizzle-kit migrate` finge sucesso sem aplicar
  migrations de verdade** no deploy da Vercel (ver lição aprendida da PR
  #32 e item 1 do backlog anterior) — PR #35.

## Backlog (próximas fatias, em ordem)

1. Cadastro de doadores/titulares de dados pessoais: evoluir a entidade
   `Donor` (hoje só nome, ver `Concluído`) com os demais dados quando
   necessário, e prever os mecanismos de acesso, correção e
   exclusão/anonimização exigidos pela LGPD (ver `CLAUDE.md`).
2. Confirmação ao sair (logout): pedir confirmação ("Deseja realmente
   sair?") antes de encerrar a sessão, em vez de sair direto no clique.
3. Painel mensal reativo: trocar o mês no seletor deve atualizar a tela
   sozinho, sem precisar clicar em "Ver" — hoje o `<select>` depende de um
   botão de submit separado.
4. Skeletons de carregamento em todas as telas que buscam dado no
   servidor (painel inicial, listas de categorias/tipos de
   carnê/doadores, painel mensal, detalhe de carnê, telas de editar) —
   ver regra já registrada em `CLAUDE.md`, seção "Skeletons de
   carregamento"; falta aplicar retroativamente nas telas existentes
   (`/users` já nasceu com o próprio `loading.tsx`, ver `Concluído`, PR #28).
5. Log de atividades (auditoria): registrar ações relevantes (ex.: dar
   baixa/corrigir parcela, arquivar/reativar, editar campanha) com quem
   fez e quando, consultável numa tela da aplicação. Pontos a decidir
   antes de implementar: definir se `canManageUsers` também controla quem
   pode consultar o log, ou se log de auditoria exige uma capacidade
   própria; log fica maior com o tempo (custo de armazenamento no Neon) —
   definir se há retenção/expurgo; se o log guardar nome de doador/valor
   vinculado a uma ação, entra na mesma categoria de dado sensível da
   seção LGPD do `CLAUDE.md`.
6. Revisão de usabilidade/poluição visual em **todas as telas existentes
   do app** — não é uma correção pontual de uma tela específica, é um
   passe geral obrigatório em toda a aplicação. Pontos a considerar em
   cada tela: hierarquia tipográfica (títulos, subtítulos e itens de
   lista não podem competir todos no mesmo peso/tamanho), separação
   visual entre seções (linha divisória ou agrupamento em vez de só
   espaço em branco — hoje várias telas empilham seções num único bloco
   contínuo), uso consistente de cor com significado (ex.: verde/âmbar
   para pago/pendente nos dois lados, não só num), ícones para escaneio
   rápido sem precisar ler todo o texto, e alvos de toque maiores/mais
   espaçados no geral (não só em modais — foi o caso do modal de "Dar
   baixa", já corrigido). Escopo grande — decidir com o usuário a ordem
   das telas antes de começar, mas o item em si cobre o app inteiro, não
   uma tela isolada.
7. Revisão de nomenclatura simples em todas as telas existentes: nomes
   técnicos/jargão em rótulos de campo, títulos de tela, botões e
   mensagens (ex.: "Custodiante" trocado por "Recebido por" ainda na fase
   de desenho da fatia "Dinheiro em mãos", ver `Concluído` acima) devem
   ser revisados e simplificados retroativamente em toda a aplicação — ver
   regra registrada no `CLAUDE.md`, seção "Nomenclatura simples". Pode ser
   combinado com o item 6 (revisão de usabilidade) por serem passes gerais
   parecidos — decidir com o usuário se entram juntos ou em momentos
   separados.
8. Revisar todos os formulários existentes do app (campanha, categoria,
   doador, tipo de carnê, doação avulsa, repasse etc.) quanto a duas
   lacunas encontradas e corrigidas nos formulários de convidar/editar
   usuário (ver `Concluído`, PR #28), que os formulários mais antigos
   provavelmente também têm:
   - Não preservar os dados digitados quando a submissão dá erro: o
     React reseta os campos não controlados assim que a server action
     termina, mesmo em caso de erro de validação, não só em sucesso; a
     correção é a action devolver os valores enviados no estado de erro
     e usá-los como `defaultValue`.
   - Mostrar sempre uma mensagem genérica ("Confira os dados
     informados") em vez da mensagem específica de um erro de regra de
     negócio (ex.: "E-mail já cadastrado", "Nome da campanha já existe"
     se aplicável) — usar `toFriendlyErrorMessage`
     (`src/app/_lib/action-error-message.ts`) em vez de um `catch`
     genérico.

## Como usar este arquivo

- Antes de iniciar uma nova fatia, confira se ela já está descrita aqui;
  se não estiver, adicione uma entrada breve ao backlog antes de
  implementar.
- Ao terminar e abrir PR, mova a entrada de "Backlog" para "Em andamento"
  (ou "Concluído" quando já mergeada), citando o número da PR.
- Não inclua aqui dados de uma instância real (nome de campanha real,
  metas, valores) — apenas o nome da _feature_, seguindo a mesma regra do
  `CLAUDE.md`.
