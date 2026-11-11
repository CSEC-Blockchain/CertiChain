import {
  BaseError,
  ChainDisconnectedError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  HttpRequestError,
  ProviderDisconnectedError,
  ResourceUnavailableRpcError,
  UserRejectedRequestError,
} from "viem";

export type ErrorStage = "connect" | "chain" | "tx";

function findNestedCode(error: unknown, seen = new Set<unknown>()): number | undefined {
  if (!error || typeof error !== "object" || seen.has(error)) return undefined;
  seen.add(error);
  const record = error as {
    code?: unknown;
    cause?: unknown;
    data?: { originalError?: unknown };
  };
  if (typeof record.code === "number") return record.code;
  return (
    findNestedCode(record.cause, seen) ??
    findNestedCode(record.data?.originalError, seen)
  );
}

function collectErrorText(error: unknown, seen = new Set<unknown>()): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error !== "object" || seen.has(error)) return "";
  seen.add(error);
  const record = error as {
    shortMessage?: unknown;
    details?: unknown;
    message?: unknown;
    cause?: unknown;
    data?: { originalError?: unknown; message?: unknown };
  };
  return [
    typeof record.shortMessage === "string" ? record.shortMessage : "",
    typeof record.details === "string" ? record.details : "",
    typeof record.message === "string" ? record.message : "",
    typeof record.data?.message === "string" ? record.data.message : "",
    collectErrorText(record.cause, seen),
    collectErrorText(record.data?.originalError, seen),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Translates viem/wagmi and raw EIP-1193 wallet/RPC errors into concise,
 * user-facing guidance.
 */
export function explainError(error: unknown, stage: ErrorStage = "tx"): string {
  const code = findNestedCode(error);
  const fullText = collectErrorText(error);

  if (
    code === 4001 ||
    (error instanceof BaseError && error.walk((e) => e instanceof UserRejectedRequestError))
  ) {
    return "You rejected the request in your wallet.";
  }

  const isUnavailable =
    code === -32002 ||
    (error instanceof BaseError &&
      Boolean(error.walk((e) => e instanceof ResourceUnavailableRpcError))) ||
    /requested resource not available|resource unavailable|already processing|permissions? request/i.test(
      fullText,
    );

  if (isUnavailable) {
    if (/already processing|already pending|pending|permissions?/i.test(fullText)) {
      return "A wallet prompt is already open. Click your wallet extension icon (e.g., MetaMask) to unlock or approve it.";
    }
    if (stage === "connect") {
      return "Your wallet is locked or already has a prompt open. Click your wallet extension icon (e.g., MetaMask) to unlock or approve it.";
    }
    return "Wallet or blockchain network unavailable. Unlock your wallet, check for an open wallet popup, and verify your Hardhat node or RPC is running.";
  }

  if (
    code === 4900 ||
    code === 4901 ||
    (error instanceof BaseError &&
      Boolean(
        error.walk(
          (e) => e instanceof ChainDisconnectedError || e instanceof ProviderDisconnectedError,
        ),
      ))
  ) {
    return "Wallet is disconnected from the network. Reconnect or switch networks in your wallet.";
  }

  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof ContractFunctionZeroDataError)) {
      return "The CertiChain contract was not found on this network. Verify NEXT_PUBLIC_CONTRACT_ADDRESS and redeploy if needed.";
    }

    if (error.walk((e) => e instanceof HttpRequestError)) {
      return "Cannot reach the blockchain RPC network. Verify your Hardhat node or RPC URL is running.";
    }

    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const messages: Record<string, string> = {
        NotOwner: "Only the authorized institution wallet can do that.",
        EmptyHash: "Certificate ID and details are required.",
        CertificateAlreadyExists: "That certificate ID was already issued.",
        CertificateNotFound: "No certificate found for that ID.",
        CertificateAlreadyRevoked: "That certificate is already revoked.",
      };
      const name = revert.data?.errorName;
      return (name && messages[name]) ?? `The contract reverted: ${name ?? revert.reason ?? revert.shortMessage}`;
    }

    if (/insufficient funds/i.test(error.message)) {
      return "Not enough ETH to pay for gas. Get Sepolia ETH from a faucet.";
    }
    return error.shortMessage;
  }

  if (/http request failed|failed to fetch|econnrefused|network error/i.test(fullText)) {
    return "Cannot reach the blockchain RPC network. Verify your Hardhat node or RPC URL is running.";
  }

  return "Something went wrong. Check the console.";
}
