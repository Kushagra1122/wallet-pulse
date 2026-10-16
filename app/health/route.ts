export const runtime = "nodejs";
export function GET() { return Response.json({ ok: true, provider: process.env.WALLET_PROVIDER === "google" ? "google" : "mock" }); }
