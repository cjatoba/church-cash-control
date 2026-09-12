export interface CampaignArchiveRepository {
  setActive(id: string, active: boolean): Promise<void>;
}

export function archiveCampaign(repository: CampaignArchiveRepository, id: string): Promise<void> {
  return repository.setActive(id, false);
}

export function restoreCampaign(repository: CampaignArchiveRepository, id: string): Promise<void> {
  return repository.setActive(id, true);
}
