import { getAddress, isAddress } from "viem";
import { hardhat, sepolia } from "wagmi/chains";
import { certiChainAbi } from "./certiChainAbi";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? sepolia.id);
const rawAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

export const targetChain = chainId === hardhat.id ? hardhat : sepolia;
export const contractAddress = isAddress(rawAddress) ? getAddress(rawAddress) : undefined;

export const certiChain = {
  abi: certiChainAbi,
  address: contractAddress,
  chainId: targetChain.id,
} as const;

export const Status = {
  Invalid: 0,
  Valid: 1,
  Revoked: 2,
} as const;

export type CertificateStatus = (typeof Status)[keyof typeof Status];

export function statusLabel(status: CertificateStatus | undefined) {
  if (status === Status.Valid) return "VALID";
  if (status === Status.Revoked) return "REVOKED";
  return "INVALID";
}

export function formatAddress(address: string | undefined) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getExplorerTxUrl(hash: `0x${string}` | undefined) {
  const baseUrl = targetChain.blockExplorers?.default.url;
  if (!baseUrl || !hash) return undefined;
  return `${baseUrl}/tx/${hash}`;
}

export function getExplorerAddressUrl() {
  const baseUrl = targetChain.blockExplorers?.default.url;
  if (!baseUrl || !contractAddress) return undefined;
  return `${baseUrl}/address/${contractAddress}`;
}
