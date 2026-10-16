import { getWalletProvider, type PassData } from "@/lib/wallet-provider";

export class HttpError extends Error { constructor(readonly status: number, message: string) { super(message); } }
const idPattern = /^[A-Za-z0-9_-]{12,72}$/;

export function validateNewPass(input: unknown): Omit<PassData, "id"> {
  if (!input || typeof input !== "object") throw new HttpError(400, "JSON body is required.");
  const raw = input as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const value = raw.value;
  if (!name || name.length > 60) throw new HttpError(400, "name must be 1–60 characters.");
  if (!label || label.length > 60) throw new HttpError(400, "label must be 1–60 characters.");
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1_000_000_000) throw new HttpError(400, "value must be a finite number between -1,000,000,000 and 1,000,000,000.");
  return { name, label, value };
}

export function validateUpdate(input: unknown) {
  if (!input || typeof input !== "object" || typeof (input as Record<string, unknown>).value !== "number") throw new HttpError(400, "value must be a number.");
  const value = (input as { value: number }).value;
  if (!Number.isFinite(value) || Math.abs(value) > 1_000_000_000) throw new HttpError(400, "value must be a finite number between -1,000,000,000 and 1,000,000,000.");
  return value;
}

export async function createPass(input: unknown) {
  const data = validateNewPass(input); const id = crypto.randomUUID().replace(/-/g, ""); const provider = getWalletProvider();
  const created = await provider.createPass({ id, ...data });
  return { id, saveUrl: created.saveUrl, value: data.value, mode: provider.mode };
}

export async function updatePass(id: string, input: unknown) {
  if (!idPattern.test(id)) throw new HttpError(400, "Invalid pass ID.");
  const value = validateUpdate(input);
  const provider = getWalletProvider();
  if (provider.mode !== "google") throw new HttpError(409, "Live Google Wallet credentials are required to update a pass.");
  // The Google object ID is issuer ID + the pass ID returned at creation.
  // It remains addressable after a Vercel serverless function restarts.
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  if (!issuerId) throw new Error("Missing server configuration: GOOGLE_WALLET_ISSUER_ID");
  await provider.updatePass(`${issuerId}.${id}`, { id, name: "", label: "", value });
  return { id, value, updated: true };
}
