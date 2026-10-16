# Wallet Pulse

Create a Google Wallet generic pass, save it on Android, then update the same Wallet object through an API. The database keeps a stable application pass ID → Google Wallet object ID mapping.

## Architecture

The Next/Vinext app exposes `POST /passes` and `POST /passes/:id`. `PassService` owns validation, persistence, and update ordering; `WalletProvider` isolates Google-specific code. A D1 record is changed only after the provider reports a successful update.

The Google provider uses the Wallet REST API server-side, creates a `genericObject`, sets its QR code value to the application pass ID, and creates the signed `https://pay.google.com/gp/v/save/...` link. Service-account credentials never reach the browser.

## Google setup

1. Complete Google Wallet issuer onboarding and enable the Google Wallet API.
2. Create a Generic Pass class in the Wallet Business Console and give the service account issuer access.
3. Add the deployment secrets below, setting `WALLET_PROVIDER=google`.

| Secret | Value |
| --- | --- |
| `GOOGLE_WALLET_ISSUER_ID` | Google Wallet issuer ID |
| `GOOGLE_WALLET_CLASS_ID` | Full class ID (`issuerId.classId`) or the class suffix |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Issuer-authorized service-account email |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | PEM private key; literal `\\n` is supported |

Until those exist, the default `mock` provider lets you validate the web flow without pretending that it is a real Wallet update.

## Run locally

```sh
cp .env.example .env.local
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_*.sql
npm run dev
```

The app needs a local D1 migration before `POST /passes` can write data. To perform the real Android test, set `WALLET_PROVIDER=google` and use actual issuer credentials as deployment secrets.

## API

```sh
curl -X POST http://localhost:5173/passes -H 'content-type: application/json' \
  -d '{"name":"Alex","label":"Balance","value":40}'

curl -X POST http://localhost:5173/passes/PASS_ID -H 'content-type: application/json' \
  -d '{"value":55}'
```

`400` indicates invalid input, `404` an unknown pass, `409` a mismatched provider, and `502` a provider/database failure. The health probe is `GET /health`.

## Verification still required

The deployed UI can be exercised in mock mode immediately. Live Google Wallet acceptance requires the project owner to supply an issuer ID, pass class, and service-account secret, then save on a real Android device and verify that the existing pass refreshes.
