/**
 * Repository — 저장소 도메인 모델
 *
 * URL 파싱, owner 추출을 constructor에서 수행한다.
 * 생성 시점에 불변식(invariant)을 보장.
 */

import { parseRepoUrl } from "./project";

export interface RepositoryInput {
  provider: string;
  url?: string | null;
  name: string;
  defaultBranch: string;
  isPrimary?: boolean;
  role?: string;
}

export class Repository {
  readonly provider: string;
  readonly url: string | null;
  readonly owner: string | null;
  readonly name: string;
  readonly defaultBranch: string;
  readonly isPrimary: boolean;
  readonly role: string | undefined;

  constructor(input: RepositoryInput, isPrimary: boolean) {
    this.provider = input.provider;
    this.url = input.url || null;
    this.name = input.name;
    this.defaultBranch = input.defaultBranch;
    this.isPrimary = isPrimary;
    this.role = input.role;
    this.owner = this.resolveOwner();
  }

  private resolveOwner(): string | null {
    if (!this.url) return null;
    const parsed = parseRepoUrl(this.url);
    return parsed?.owner ?? null;
  }
}
