# Wallet Pulse

Create a Google Wallet generic pass, save it on Android, then update that same Wallet object through an API.

## Architecture

The Next.js app exposes `POST /passes` and `POST /passes/:id`. `WalletProvider` isolates Google-specific code. Google object IDs are deterministic (`issuerId.passId`), so the deployed Vercel function can update the same object without requiring a Cloudflare database binding.

The Google provider uses the Wallet REST API server-side, creates a `genericObject`, sets its QR code value to the application pass ID, and creates the signed `https://pay.google.com/gp/v/save/...` link. Service-account credentials never reach the browser.

## Google setup

1. Complete Google Wallet issuer onboarding and enable the Google Wallet API.
2. Create a Generic Pass class in the Wallet Business Console and give the service account issuer access.
3. Add the deployment secrets below, setting `WALLET_PROVIDER=google`.

| Secret | Value |
| --- | --- |
| `GOOGLE_WALLET_ISSUER_ID` | Google Wallet issuer ID |
| `GOOGLE_WALLET_CLASS_ID` | Exact Generic Class ID shown by the Google Wallet API |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Issuer-authorized service-account email |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | PEM private key; literal `\\n` is supported |

Until those exist, the default `mock` provider lets you validate the web flow without pretending that it is a real Wallet update.

## Run locally

```sh
# Add the Google configuration above to .env.local.
npm run build
npm run dev
```

To perform the real Android test, set `WALLET_PROVIDER=google` and use actual issuer credentials. Do not expose the service-account private key to the browser.

## API

```sh
curl -X POST http://localhost:5173/passes -H 'content-type: application/json' \
  -d '{"name":"Alex","label":"Balance","value":40}'

curl -X POST http://localhost:5173/passes/PASS_ID -H 'content-type: application/json' \
  -d '{"value":55}'
```

`400` indicates invalid input, `409` indicates that live Google configuration is absent, and `502` indicates a provider failure. The health probe is `GET /health`.

## Deployment and verification

Production runs on Vercel at `https://wallet-pulse-ten.vercel.app`. The production API has been verified to create and then update a real Google Wallet Generic Object. For the final phone proof, open the site while signed in with one of the issuer's demo test accounts, create a pass, tap **Save to Google Wallet**, then update its value in the same browser session.
