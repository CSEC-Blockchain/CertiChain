# CertiChain Web

Next.js 16 (App Router) frontend for the CertiChain dApp — issue, verify, and revoke blockchain-anchored certificates.

## Stack

- **Next.js 16** + React 19, App Router, Server Components, Turbopack
- **Tailwind CSS 4**
- **wagmi v3** + **viem v2** + `@tanstack/react-query` — chain reads/writes and multi-wallet (EIP-6963) connection via `injected()`
- **qrcode.react** (generation) and **jsqr** (camera/upload scanning)

## Pages

| Route | Description |
|---|---|
| `/` | Landing page and product overview |
| `/issue` | Issue a certificate (owner wallet only); also hosts revoke and QR/download output |
| `/verify` | Public verification — ID input, link paste, or QR scan; no wallet required |

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values — never commit .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | `31337` (Hardhat Local) or `11155111` (Sepolia) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed CertiChain contract address |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Full HTTPS RPC URL **or** a bare Alchemy key (`alch_…`), auto-expanded in `lib/wagmi.ts` |

`.env*` files are git-ignored except `.env.example`. Keep real values in `.env.local` only.

## How verification works

`lib/hash.ts` recomputes `certIdHash` and `dataHash` client-side:

```text
certIdHash = keccak256(utf8(certId))
dataHash   = keccak256(utf8(`${studentName}|${course}|${certId}|${issueDate}`))
```

`lib/contract.ts` exposes the wagmi config, target chain, and contract reference. `lib/hash.ts` also parses plain IDs and full verification URLs (`parseVerificationInput`), used by `/verify`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests for `lib/hash.ts` |

## Notes

- `next.config.ts` and `next-env.d.ts` are managed by Next.js — don't hand-edit.
- See `../README.md` for the full local-chain ↔ frontend workflow and Sepolia deployment.
- Sepolia RPC handling accepts a full URL or a bare Alchemy key; passing a partial URL was a previous production bug and now falls back safely.
