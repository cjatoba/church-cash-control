export interface UserOption {
  id: string;
  phone: string;
}

export interface UserListRepository {
  findAll(): Promise<UserOption[]>;
}

export function listUsers(repository: UserListRepository): Promise<UserOption[]> {
  return repository.findAll();
}
