export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  password: string | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserRecord>;
  updatePassword(email: string, password: string): Promise<UserRecord>;
  delete(id: string): Promise<void>;
}
