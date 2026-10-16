export type PassData = { id: string; name: string; label: string; value: number };
export type ProviderCreateResult = { providerObjectId: string; saveUrl: string };

export interface WalletProvider {
  createPass(pass: PassData): Promise<ProviderCreateResult>;
  updatePass(providerObjectId: string, pass: PassData): Promise<void>;
  readonly mode: "google" | "mock";
}

const GOOGLE_API = "https://walletobjects.googleapis.com/walletobjects/v1";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

function base64Url(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function parsePem(pem: string) {
  const raw = pem.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const binary = atob(raw);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

async function signJwt(claims: Record<string, unknown>, privateKey: string) {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey("pkcs8", parsePem(privateKey), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput)));
  return `${signingInput}.${base64Url(signature)}`;
}

function required(name: "GOOGLE_WALLET_ISSUER_ID" | "GOOGLE_WALLET_CLASS_ID" | "GOOGLE_SERVICE_ACCOUNT_EMAIL" | "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

class GoogleWalletProvider implements WalletProvider {
  readonly mode = "google" as const;
  private readonly issuerId = required("GOOGLE_WALLET_ISSUER_ID");
  private readonly classId = required("GOOGLE_WALLET_CLASS_ID");
  private readonly email = required("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  private readonly privateKey = required("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

  private objectId(passId: string) { return `${this.issuerId}.${passId}`; }
  private object(pass: PassData, objectId: string) {
    return {
      id: objectId,
      classId: this.classId.includes(".") ? this.classId : `${this.issuerId}.${this.classId}`,
      cardTitle: { defaultValue: { language: "en-US", value: pass.name } },
      header: { defaultValue: { language: "en-US", value: pass.label } },
      subheader: { defaultValue: { language: "en-US", value: String(pass.value) } },
      textModulesData: [{ id: "live-value", header: pass.label, body: String(pass.value) }],
      barcode: { type: "QR_CODE", value: pass.id },
    };
  }

  private async accessToken() {
    const now = Math.floor(Date.now() / 1000);
    const assertion = await signJwt({ iss: this.email, scope: "https://www.googleapis.com/auth/wallet_object.issuer", aud: GOOGLE_TOKEN, iat: now, exp: now + 3600 }, this.privateKey);
    const response = await fetch(GOOGLE_TOKEN, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), signal: AbortSignal.timeout(10_000) });
    const data = (await response.json()) as { access_token?: string; error_description?: string };
    if (!response.ok || !data.access_token) throw new Error(`Google authentication failed: ${data.error_description ?? response.status}`);
    return data.access_token;
  }

  private async google(method: "POST" | "PATCH", path: string, body: unknown) {
    const response = await fetch(`${GOOGLE_API}${path}`, { method, headers: { authorization: `Bearer ${await this.accessToken()}`, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) });
    if (!response.ok) { const detail = await response.text(); throw new Error(`Google Wallet API ${method} failed (${response.status}): ${detail.slice(0, 300)}`); }
  }

  async createPass(pass: PassData) {
    const providerObjectId = this.objectId(pass.id);
    const object = this.object(pass, providerObjectId);
    await this.google("POST", "/genericObject", object);
    const now = Math.floor(Date.now() / 1000);
    const token = await signJwt({ iss: this.email, aud: "google", typ: "savetowallet", iat: now, payload: { genericObjects: [{ id: object.id, classId: object.classId }] } }, this.privateKey);
    return { providerObjectId, saveUrl: `https://pay.google.com/gp/v/save/${token}` };
  }

  async updatePass(providerObjectId: string, pass: PassData) {
    await this.google("PATCH", `/genericObject/${encodeURIComponent(providerObjectId)}`, {
      subheader: { defaultValue: { language: "en-US", value: String(pass.value) } },
    });
  }
}

class MockWalletProvider implements WalletProvider {
  readonly mode = "mock" as const;
  async createPass(pass: PassData) { return { providerObjectId: `mock.${pass.id}`, saveUrl: "" }; }
  async updatePass() { return; }
}

export function getWalletProvider(): WalletProvider { return process.env.WALLET_PROVIDER === "google" ? new GoogleWalletProvider() : new MockWalletProvider(); }
