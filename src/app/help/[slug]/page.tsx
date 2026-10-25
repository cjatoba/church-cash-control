import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { selectAvailableGuideItems } from "@/server/domain/onboarding";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { NavListItem, NavSection } from "@/app/_components/nav-list";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { InfoIcon } from "@/app/_components/icons";
import { OpenMenuButton } from "@/app/_components/menu-sheet";
import { findHelpTopic } from "../_content/help-topics";

export default async function HelpTopicPage({ params }: PageProps<"/help/[slug]">) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;
  const topic = findHelpTopic(slug);
  if (!topic || selectAvailableGuideItems([topic], session.user).length === 0) {
    notFound();
  }

  const related = selectAvailableGuideItems(
    (topic.related ?? []).flatMap((relatedSlug) => findHelpTopic(relatedSlug) ?? []),
    session.user,
  );

  return (
    <PageShell>
      <PageHeader title={topic.title} backHref="/help" backLabel="Voltar para a ajuda" />

      <p className="mx-1 text-[17px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        {topic.summary}
      </p>

      <ol className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {topic.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-4 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              {index + 1}
            </span>
            <span className="pt-1 text-[17px] leading-snug">{step}</span>
          </li>
        ))}
      </ol>

      {topic.tip ? (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <InfoIcon className="h-6 w-6 shrink-0 text-blue-700 dark:text-blue-400" />
          <p className="text-[15px] text-zinc-700 dark:text-zinc-300">{topic.tip}</p>
        </div>
      ) : null}

      {topic.action && "opensMenu" in topic.action ? (
        <OpenMenuButton label={topic.action.label} />
      ) : topic.action ? (
        <Link
          href={topic.action.href}
          className={`${buttonBaseClassName} ${buttonClassNames.primaryLarge}`}
        >
          {topic.action.label}
        </Link>
      ) : null}

      {related.length > 0 ? (
        <NavSection title="Veja também">
          {related.map((relatedTopic) => (
            <NavListItem
              key={relatedTopic.slug}
              href={`/help/${relatedTopic.slug}`}
              title={relatedTopic.title}
            />
          ))}
        </NavSection>
      ) : null}
    </PageShell>
  );
}
