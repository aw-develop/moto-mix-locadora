declare namespace Cloudflare {
  interface Env {
    ADMIN_EMAILS?: string;
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD_HASH?: string;
    DB: D1Database;
    BUCKET: R2Bucket;
  }
}
