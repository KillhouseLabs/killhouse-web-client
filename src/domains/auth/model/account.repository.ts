export interface AccountRecord {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
}

export interface AccountRepository {
  findAccessToken(
    userId: string,
    provider: string,
    accountId?: string
  ): Promise<{ access_token: string | null } | null>;

  findOAuthAccounts(
    userId: string
  ): Promise<
    Pick<
      AccountRecord,
      "id" | "provider" | "providerAccountId" | "access_token"
    >[]
  >;

  findProviderStatuses(
    userId: string,
    providers: string[]
  ): Promise<Pick<AccountRecord, "provider" | "scope">[]>;

  findByProviderAccount(
    provider: string,
    providerAccountId: string
  ): Promise<AccountRecord | null>;

  refreshTokens(
    provider: string,
    providerAccountId: string,
    data: {
      access_token?: string | null;
      refresh_token?: string | null;
      expires_at?: number | null;
      scope?: string | null;
    }
  ): Promise<void>;

  updateById(
    id: string,
    data: Partial<Omit<AccountRecord, "id" | "userId">>
  ): Promise<void>;

  create(data: {
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    access_token?: string | null;
    refresh_token?: string | null;
    expires_at?: number | null;
    scope?: string | null;
    token_type?: string | null;
  }): Promise<AccountRecord>;
}
