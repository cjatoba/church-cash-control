import type { UserCapabilities } from "../domain/user-capabilities";

export interface ManagedUser extends UserCapabilities {
  id: string;
  name: string;
  phone: string | null;
  mustChangePassword: boolean;
  active: boolean;
}

export interface ManagedUserListRepository {
  findAll(): Promise<ManagedUser[]>;
}

export function listManagedUsers(repository: ManagedUserListRepository): Promise<ManagedUser[]> {
  return repository.findAll();
}
