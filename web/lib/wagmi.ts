import { createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Accept a full HTTPS RPC URL, or a bare Alchemy API key (alch_… / hex).
 * An incomplete key-only value was previously breaking production reads.
 */
function resolveSepoliaRpcUrl() {
  const raw = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(alch_[A-Za-z0-9_-]+|[A-Za-z0-9_-]{20,})$/.test(raw)) {
    return `https://eth-sepolia.g.alchemy.com/v2/${raw}`;
  }
  return raw;
}

export const config = createConfig({
  chains: [sepolia, hardhat],
  connectors: [injected()],
  ssr: true,
  transports: {
    [sepolia.id]: http(resolveSepoliaRpcUrl()),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
