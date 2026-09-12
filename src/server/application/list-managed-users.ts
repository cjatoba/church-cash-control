import type { UserRole } from "../domain/user-role";

export interface ManagedUser {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  mustChangePassword: boolean;
  active: boolean;
}

export interface ManagedUserListRepository {
  findAll(): Promise<ManagedUser[]>;
}

export function listManagedUsers(repository: ManagedUserListRepository): Promise<ManagedUser[]> {
  return repository.findAll();
}
