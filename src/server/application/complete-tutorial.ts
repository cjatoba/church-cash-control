export interface TutorialProgressRepository {
  markTutorialCompleted(userId: string): Promise<void>;
}

export async function completeTutorial(
  repository: TutorialProgressRepository,
  userId: string,
): Promise<void> {
  await repository.markTutorialCompleted(userId);
}
