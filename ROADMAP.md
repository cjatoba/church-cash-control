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
    granulares (ver "Em andamento" abaixo — a fatia de papéis de usuário
    subiu de prioridade justamente por essa fatia depender de mais de um
    usuário real usando o app). Categorias de lançamento
    (`TransactionCategory`, já cadastráveis) continuam sem uso associado
    até aparecer necessidade concreta de categorizar cada repasse/gasto
    por tipo.

## Em andamento (PRs abertas)

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
  nova senha temporária para quem ainda não trocou a original. Papel
  restringe, por ora, só o acesso à própria tela de gerenciar usuários
  (`canManageUsers`) — decisão registrada de não implementar múltiplos
  papéis por usuário nem um sistema de permissões granulares (tabela de
  features por usuário): cada regra de permissão futura (ex.: só quem
  tem papel X cria campanha) deve tratar `admin` como superusuário
  (`role === "admin" || role === "X"`), o que já cobre o caso de uma
  mesma pessoa ser admin e também responsável pela arrecadação sem
  precisar acumular papéis. Ver item 3 do backlog para os próximos
  papéis/gates cogitados (gerenciador de campanha, visualização para o
  pastor).

## Backlog (próximas fatias, em ordem)

1. Relatórios / acompanhamento de progresso de arrecadação por campanha —
   parte disso (meta mensal) já é coberta pelo painel mensal de carnês
   (ver `Concluído`); revisar o que sobra como fatia própria depois dele.
   Inclui mostrar no card de cada campanha do painel inicial quanto já foi
   arrecadado (não só a meta), pra dar visão geral sem precisar entrar na
   campanha. Cuidado de implementação: calcular isso com uma (ou duas)
   query agregada (`SUM ... GROUP BY campanha`) trazendo o total de todas
   as campanhas de uma vez — nunca uma query por campanha no loop da
   listagem, que degradaria com o número de campanhas e penaliza mais
   ainda por causa da latência de conexão do Neon serverless.
2. Cadastro de doadores/titulares de dados pessoais: evoluir a entidade
   `Donor` (hoje só nome, ver `Concluído`) com os demais dados quando
   necessário, e prever os mecanismos de acesso, correção e
   exclusão/anonimização exigidos pela LGPD (ver `CLAUDE.md`).
3. Mais papéis de usuário e permissões por tela — pedido concreto do
   uso real do app (hoje só existe o gate de gerenciar usuários, ver "Em
   andamento"): restringir quem cria/edita campanha (papel "gerenciador
   de campanha") e quem dá baixa em parcela/doação avulsa (papel
   "responsável pela arrecadação", já existente), e adicionar um papel
   de só visualização (ex.: pastor acompanhando o que entra e o status
   geral, sem poder editar nada). Decisão já registrada (ver "Em
   andamento"): continuar com um único papel por usuário, tratando
   `admin` como superusuário em cada checagem de permissão — evita
   precisar de múltiplos papéis por usuário (ex.: admin que também é
   responsável pela arrecadação já teria acesso de qualquer forma).
   Escopo maior que o gate único de hoje: precisa mapear, tela a tela,
   quais ações ficam restritas a qual papel antes de implementar.
4. Confirmação ao sair (logout): pedir confirmação ("Deseja realmente
   sair?") antes de encerrar a sessão, em vez de sair direto no clique.
5. Painel mensal reativo: trocar o mês no seletor deve atualizar a tela
   sozinho, sem precisar clicar em "Ver" — hoje o `<select>` depende de um
   botão de submit separado.
6. Skeletons de carregamento em todas as telas que buscam dado no
   servidor (painel inicial, listas de categorias/tipos de
   carnê/doadores, painel mensal, detalhe de carnê, telas de editar) —
   ver regra já registrada em `CLAUDE.md`, seção "Skeletons de
   carregamento"; falta aplicar retroativamente nas telas existentes
   (`/users` já nasceu com o próprio `loading.tsx`, ver "Em andamento").
7. Log de atividades (auditoria): registrar ações relevantes (ex.: dar
   baixa/corrigir parcela, arquivar/reativar, editar campanha) com quem
   fez e quando, consultável numa tela da aplicação. Pontos a decidir
   antes de implementar: hoje só existe o papel admin/responsável pela
   arrecadação para restringir quem gerencia usuários (ver "Em
   andamento") — definir se esse mesmo papel controla quem pode
   consultar o log, ou se log de auditoria exige um papel próprio; log
   fica maior com o tempo (custo de armazenamento no Neon) — definir se
   há retenção/expurgo; se o log guardar nome de doador/valor vinculado a
   uma ação, entra na mesma categoria de dado sensível da seção LGPD do
   `CLAUDE.md`.
8. Revisão de usabilidade/poluição visual em **todas as telas existentes
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
9. Revisão de nomenclatura simples em todas as telas existentes: nomes
   técnicos/jargão em rótulos de campo, títulos de tela, botões e
   mensagens (ex.: "Custodiante" trocado por "Recebido por" ainda na fase
   de desenho da fatia "Dinheiro em mãos", ver `Concluído` acima) devem
   ser revisados e simplificados retroativamente em toda a aplicação — ver
   regra registrada no `CLAUDE.md`, seção "Nomenclatura simples". Pode ser
   combinado com o item 8 (revisão de usabilidade) por serem passes gerais
   parecidos — decidir com o usuário se entram juntos ou em momentos
   separados.

## Como usar este arquivo

- Antes de iniciar uma nova fatia, confira se ela já está descrita aqui;
  se não estiver, adicione uma entrada breve ao backlog antes de
  implementar.
- Ao terminar e abrir PR, mova a entrada de "Backlog" para "Em andamento"
  (ou "Concluído" quando já mergeada), citando o número da PR.
- Não inclua aqui dados de uma instância real (nome de campanha real,
  metas, valores) — apenas o nome da _feature_, seguindo a mesma regra do
  `CLAUDE.md`.
