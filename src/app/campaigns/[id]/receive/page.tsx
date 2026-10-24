import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { NavListItem, NavSection } from "@/app/_components/nav-list";
import { CurrencyIcon, DocumentIcon, HeartIcon, InfoIcon } from "@/app/_components/icons";

export default async function ReceivePage({ params }: PageProps<"/campaigns/[id]/receive">) {
  const session = await auth();
  const { id: campaignId } = await params;
  if (!session?.user.canReceiveFunds) {
    redirect(`/campaigns/${campaignId}`);
  }

  return (
    <PageShell>
      <PageHeader
        backHref={`/campaigns/${campaignId}`}
        backLabel="Voltar para a campanha"
        title="O que você recebeu?"
        subtitle="Escolha uma opção para continuar."
      />

      <NavSection>
        <NavListItem
          href={`/campaigns/${campaignId}/donors?show=fixed`}
          title="Parcela de carnê"
          description="Doador pagou uma parcela de valor fixo"
          icon={<DocumentIcon />}
          iconTone="blue"
        />
        <NavListItem
          href={`/campaigns/${campaignId}/donors?show=loose`}
          title="Entrega de carnê avulso"
          description="Doador entregou um valor livre do carnê dele"
          icon={<CurrencyIcon />}
          iconTone="violet"
        />
        <NavListItem
          href={`/campaigns/${campaignId}/one-off-donations/new`}
          title="Doação sem carnê"
          description="Oferta pontual, com nome ou anônima"
          icon={<HeartIcon />}
          iconTone="green"
        />
      </NavSection>

      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <InfoIcon className="h-6 w-6 shrink-0 text-zinc-500" />
        <p className="text-[15px] text-zinc-700 dark:text-zinc-300">
          Doador novo? Cadastre primeiro em <strong>Doadores e carnês</strong>, na tela da campanha.
        </p>
      </div>
    </PageShell>
  );
}
