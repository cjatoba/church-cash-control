import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { selectAvailableGuideItems } from "@/server/domain/onboarding";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { NavListItem, NavSection } from "@/app/_components/nav-list";
import { PlayIcon } from "@/app/_components/icons";
import { helpGroups, helpTopics } from "./_content/help-topics";

export default async function HelpPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const availableSlugs = new Set(
    selectAvailableGuideItems(helpTopics, session.user).map((topic) => topic.slug),
  );
  const groups = helpGroups
    .map((group) => ({
      title: group.title,
      topics: helpTopics.filter(
        (topic) => group.topicSlugs.includes(topic.slug) && availableSlugs.has(topic.slug),
      ),
    }))
    .filter((group) => group.topics.length > 0);

  return (
    <PageShell>
      <PageHeader title="Ajuda" backHref="/menu" backLabel="Voltar para o menu" />

      <Link
        href="/tutorial"
        className="flex items-center gap-4 rounded-2xl bg-zinc-900 p-4 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-700 dark:bg-zinc-300">
          <PlayIcon />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[17px] font-semibold">Ver o tutorial de novo</span>
          <span className="text-[15px] text-zinc-300 dark:text-zinc-600">
            Um resumo rápido de como o app funciona
          </span>
        </span>
      </Link>

      {groups.map((group) => (
        <NavSection key={group.title} title={group.title}>
          {group.topics.map((topic) => (
            <NavListItem key={topic.slug} href={`/help/${topic.slug}`} title={topic.title} />
          ))}
        </NavSection>
      ))}
    </PageShell>
  );
}
