export interface BackendEnvironment {
  readonly DB: D1Database;
  readonly BUCKET: R2Bucket;
  readonly SESSION_SECRET?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
}
export interface RequestIdentity {
  readonly isAdmin: boolean;
  readonly signedIn: boolean;
  readonly userId: string | null;
  readonly email: string;
  readonly name: string;
}
export interface RequestContext {
  readonly request: Request;
  readonly env: BackendEnvironment;
  readonly identity: RequestIdentity;
  readonly url: URL;
}
