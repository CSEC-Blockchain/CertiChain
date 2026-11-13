# CertiChain

Tamper-resistant blockchain certificate issuing and public verification dApp. Certificates are committed on-chain as **hashes only** — no personal data ever touches the blockchain.

Built with **Hardhat 3** (Solidity `0.8.28` + `node:test` + `viem` + Ignition) and **Next.js 16** (`wagmi` v3 + `viem` v2, App Router, Tailwind CSS 4).

## Features

- **Issue certificates** from an authorized institution wallet (`/issue`) — name, course, unique Certificate ID, issue date.
- **Public verification** (`/verify`) — no wallet or login required. Enter a Certificate ID, paste a verification link, or scan/upload a QR code.
- **Revocation** — the owner wallet can permanently revoke a certificate.
- **Shareable links + QR codes** — every issued certificate produces a verification URL and a downloadable PNG QR.
- **Full-credential verification** — optional student details are checked against an on-chain `dataHash`, not just ID existence.
- **EIP-6963 multi-wallet discovery** — works with MetaMask and other injected browser wallets.

## How It Works

CertiChain never stores names, courses, or dates on-chain. Instead, the issuer's browser computes:

```text
certIdHash = keccak256(utf8(certId))
dataHash   = keccak256(utf8(`${studentName}|${course}|${certId}|${issueDate}`))
```

Only these two hashes, an issue timestamp, and a revocation flag are written to the `CertiChain` contract. Verification recomputes the hashes client-side and asks the contract whether the `certIdHash` exists and (optionally) whether `dataHash` matches.

| Status    | Meaning                                      |
|-----------|----------------------------------------------|
| `VALID`   | Certificate exists, not revoked, hash match  |
| `REVOKED` | Certificate was issued but later revoked     |
| `INVALID` | Not found, or data hash mismatch             |

### Smart contract surface (`contracts/contracts/CertiChain.sol`)

| Function | Access | Purpose |
|---|---|---|
| `issueCertificate(certIdHash, dataHash)` | owner only | Register a new certificate |
| `revokeCertificate(certIdHash)` | owner only | Permanently revoke a certificate |
| `verifyCertificate(certIdHash, dataHash)` | public (view) | Full verification incl. data hash |
| `getCertificateStatus(certIdHash)` | public (view) | Status by ID hash only |
| `getCertificate(certIdHash)` | public (view) | Read stored hash metadata (no PII) |

Errors (`NotOwner`, `EmptyHash`, `CertificateAlreadyExists`, `CertificateNotFound`, `CertificateAlreadyRevoked`) and events (`CertificateIssued`, `CertificateRevoked`) are defined for precise UX handling.

## Repository Layout

- [`contracts/`](contracts/) — `CertiChain.sol`, `node:test` suite, Ignition deploy module, ABI export script.
- [`web/`](web/) — Next.js frontend (`/`, `/issue`, `/verify`) with wallet connection, QR generation/scanning, and verification logic.

```text
CertiChain/
├── contracts/
│   ├── contracts/CertiChain.sol      # The registry contract
│   ├── test/CertiChain.ts            # node:test + viem test suite
│   ├── ignition/modules/CertiChain.ts
│   └── scripts/export-abi.mjs        # Copies ABI → ../web/lib
└── web/
    ├── app/                          # App Router pages (/, /issue, /verify)
    ├── components/                   # Wallet, forms, QR, certificate document
    └── lib/                          # Hashing, contract reads, chain config
```

## Prerequisites

- Node.js ≥ 20 and npm
- A browser wallet (MetaMask or any EIP-6963 wallet) for issuing/revoking

## Local Development Workflow

1. **Test contracts**
   ```bash
   cd contracts
   npm install
   npm test
   ```
2. **Start a local Hardhat node**
   ```bash
   cd contracts
   npm run node
   ```
3. **Deploy `CertiChain` locally** (in a second terminal)
   ```bash
   cd contracts
   npm run deploy:local:reset
   ```
   > Use `deploy:local:reset` whenever restarting a fresh `hardhat node` so Ignition clears the previous ephemeral `chain-31337` journal.
4. **Configure and start the frontend**

   Create/update `web/.env.local` (see [Environment Variables](#environment-variables)):
   ```bash
   NEXT_PUBLIC_CHAIN_ID=31337
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   NEXT_PUBLIC_SEPOLIA_RPC_URL=
   ```
   Then:
   ```bash
   cd web
   npm install
   npm run dev
   ```
   Open http://localhost:3000.
5. **Wallet setup for issuing (`/issue`)**
   - Point MetaMask (or another EIP-6963 browser wallet) to **Hardhat Local** (`http://127.0.0.1:8545`, Chain ID `31337`).
   - Connect the deployer account (**Hardhat Account `#0`**, `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`, printed at the top of `npm run node`).

## Environment Variables

All frontend configuration is public by design (`NEXT_PUBLIC_*`). Copy `web/.env.example` → `web/.env.local` and fill in values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | `31337` (Hardhat Local) or `11155111` (Sepolia) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed `CertiChain` contract address |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Full HTTPS Sepolia RPC URL, **or** a bare Alchemy key (`alch_…`) which is expanded automatically |

> **Never commit real secrets.** `web/.env.local`, `contracts/.env`, and any `.env.*` files are git-ignored (see `.gitignore`, `web/.gitignore`, `contracts/.gitignore`); only `web/.env.example` with placeholders is tracked. Sepolia credentials are stored via `npx hardhat keystore` — not in files — and stay outside the repo. If a secret is ever committed, rotate it immediately and purge it from history.

### Hardhat keystore (Sepolia credentials)

```bash
cd contracts
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

## Updating the Contract

Whenever `contracts/contracts/CertiChain.sol` changes:

```bash
cd contracts
npm test
npm run compile
npm run export-abi   # regenerates web/lib/certiChainAbi.ts
```

Then redeploy, update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `web/.env.local`, and restart `npm run dev`.

## Sepolia Testnet Workflow

```bash
cd contracts
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npm run deploy:sepolia
```

Update `web/.env.local` (`NEXT_PUBLIC_CHAIN_ID=11155111` and the deployed `NEXT_PUBLIC_CONTRACT_ADDRESS`), run `npm run build` in `web/`, and deploy `web/` with root directory `web` (e.g. Vercel).

## Scripts Reference

### `contracts/`

| Script | Description |
|---|---|
| `npm test` | Run the `node:test` + viem test suite |
| `npm run compile` | Build/compile contracts |
| `npm run node` | Start a local Hardhat node |
| `npm run deploy:local` / `:reset` | Deploy via Ignition to localhost (`:reset` clears the `chain-31337` journal first) |
| `npm run deploy:sepolia` | Deploy via Ignition to Sepolia |
| `npm run export-abi` | Export the ABI into `web/lib` |

### `web/`

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (`lib/hash.ts`) via `node --test` |

## Core User Workflows

1. **Issue (`/issue`)**: Authorized institution wallet connects on the target chain, enters student name, course, unique Certificate ID, and issue date, signs `issueCertificate(certIdHash, dataHash)`, and receives a shareable verification URL and downloadable PNG QR code.
2. **Verify (`/verify`)**: Public verifiers (no wallet required) enter a Certificate ID, paste a verification link, or scan/upload a QR code. Optional student details verify the full credential hash; status displays `VALID`, `INVALID`, or `REVOKED`.
3. **Revoke (`/issue`)**: Owner wallet expands **Revoke an existing certificate**, confirms permanence, and calls `revokeCertificate(certIdHash)`.

## Security Notes

- No PII is stored on-chain — only keccak256 hashes. Anyone can verify a hash, but cannot reverse it to recover student data.
- The issuer signer is the contract owner; only the owner can issue or revoke. Transfer of ownership is intentionally not exposed.
- Lost certificates cannot be "edited" — issuing is append-only; mistakes are fixed by revoking and reissuing with a new ID.
- Keep private keys in the Hardhat keystore or your wallet — never in this repository.

## License

ISC (contracts package). See `contracts/package.json`.
