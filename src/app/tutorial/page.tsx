import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/auth";
import { completeTutorial } from "@/server/application/complete-tutorial";
import { selectAvailableGuideItems, tutorialGreeting } from "@/server/domain/onboarding";
import { createDbClient } from "@/server/infrastructure/db/client";
import { createTutorialProgressRepository } from "@/server/infrastructure/db/user-repository";
import { PageShell } from "@/app/_components/page-shell";
import { buildTutorialSteps } from "./_content/tutorial-steps";
import { TutorialCarousel } from "./tutorial-carousel";

export default async function TutorialPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  async function finish(): Promise<void> {
    "use server";

    const actionSession = await auth();
    if (!actionSession) {
      redirect("/login");
    }

    if (!actionSession.user.tutorialCompleted) {
      await completeTutorial(
        createTutorialProgressRepository(createDbClient()),
        actionSession.user.id,
      );
      await unstable_update({ user: { tutorialCompleted: true } });
    }

    redirect("/");
  }

  const steps = selectAvailableGuideItems(
    buildTutorialSteps(tutorialGreeting(session.user.name)),
    session.user,
  );
  const slides = steps.map(({ id, title, text, tip, icon, tone }) => ({
    id,
    title,
    text,
    tip,
    icon,
    tone,
  }));

  return (
    <PageShell>
      <TutorialCarousel slides={slides} finish={finish} />
    </PageShell>
  );
}
