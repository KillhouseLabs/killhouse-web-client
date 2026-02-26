export interface VerificationTokenRecord {
  identifier: string;
  token: string;
  expires: Date;
}

export interface VerificationTokenRepository {
  findByToken(token: string): Promise<VerificationTokenRecord | null>;
  create(data: {
    identifier: string;
    token: string;
    expires: Date;
  }): Promise<VerificationTokenRecord>;
  deleteByIdentifier(identifier: string): Promise<void>;
  deleteByIdentifierAndToken(identifier: string, token: string): Promise<void>;
}
