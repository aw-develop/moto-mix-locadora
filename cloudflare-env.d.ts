declare namespace Cloudflare {
  interface Env {
    SESSION_SECRET?: string;
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD_HASH?: string;
    DB: D1Database;
    BUCKET: R2Bucket;
  }
}
