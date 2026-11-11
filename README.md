# CertiChain

Tamper-resistant blockchain certificate issuing and public verification dApp built with Hardhat 3 (Solidity `0.8.28` + `node:test` + `viem` + Ignition) and Next.js 16 (`wagmi` v3 + `viem` v2).

## Repository Layout

- `contracts/` — [`CertiChain.sol`](contracts/contracts/CertiChain.sol) smart contract, `node:test` suite, Ignition deploy module, and ABI export script.
- `web/` — Next.js App Router frontend (`/`, `/issue`, `/verify`) with EIP-6963 multi-wallet discovery, QR generation/scanning, and public verification.

## Local Development Workflow

1. **Test contracts**
   ```bash
   cd contracts
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
   Ensure `web/.env.local` has:
   ```bash
   NEXT_PUBLIC_CHAIN_ID=31337
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   NEXT_PUBLIC_SEPOLIA_RPC_URL=
   ```
   Then run:
   ```bash
   cd web
   npm run dev
   ```
5. **Wallet setup for issuing (`/issue`)**
   - Point MetaMask (or another EIP-6963 browser wallet) to **Hardhat Local** (`http://127.0.0.1:8545`, Chain ID `31337`).
   - Connect the deployer account (**Hardhat Account `#0`**, `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`, printed at the top of `npm run node`).

## Updating the Contract

Whenever `contracts/contracts/CertiChain.sol` changes:
```bash
cd contracts
npm test
npm run compile
npm run export-abi
```
Then redeploy, update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `web/.env.local`, and restart `npm run dev`.

## Sepolia Testnet Workflow

```bash
cd contracts
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npm run deploy:sepolia
```
Update `web/.env.local` (`NEXT_PUBLIC_CHAIN_ID=11155111` and the deployed `NEXT_PUBLIC_CONTRACT_ADDRESS`), run `npm run build` in `web/`, and deploy `web/` with root directory `web`.

## Core User Workflows

1. **Issue (`/issue`)**: Authorized institution wallet connects on target chain, enters student name, course, unique Certificate ID, and issue date, signs `issueCertificate(certIdHash, dataHash)`, and receives a shareable verification URL and downloadable PNG QR code.
2. **Verify (`/verify`)**: Public verifiers (no wallet required) enter a Certificate ID, paste a verification link, or scan/upload a QR code. Optional student details verify the full credential hash; status displays `VALID`, `INVALID`, or `REVOKED`.
3. **Revoke (`/issue`)**: Owner wallet expands **Revoke an existing certificate**, confirms permanence, and calls `revokeCertificate(certIdHash)`.
