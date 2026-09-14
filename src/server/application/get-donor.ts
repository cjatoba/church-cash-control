export interface DonorDetail {
  name: string;
  anonymizedAt: Date | null;
}

export interface DonorDetailRepository {
  findById(id: string): Promise<DonorDetail | null>;
}

export function getDonor(
  repository: DonorDetailRepository,
  id: string,
): Promise<DonorDetail | null> {
  return repository.findById(id);
}
