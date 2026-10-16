import { env } from "cloudflare:workers";
export function GET() { return Response.json({ ok: true, provider: env.WALLET_PROVIDER === "google" ? "google" : "mock" }); }
