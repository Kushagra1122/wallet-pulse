declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    WALLET_PROVIDER?: "google" | "mock";
    GOOGLE_WALLET_ISSUER_ID?: string;
    GOOGLE_WALLET_CLASS_ID?: string;
    GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  }
}
