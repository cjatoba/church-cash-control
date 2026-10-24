export interface UserOption {
  id: string;
  name: string;
}

export interface UserListRepository {
  findAll(): Promise<UserOption[]>;
}

export function listUsers(repository: UserListRepository): Promise<UserOption[]> {
  return repository.findAll();
}
