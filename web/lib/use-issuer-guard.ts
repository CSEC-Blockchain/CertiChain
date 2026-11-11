"use client";

import { useEffect } from "react";
import { useConnection, useReadContract, useSwitchChain } from "wagmi";
import { certiChain, contractAddress, targetChain } from "@/lib/contract";
import { useMounted } from "@/lib/use-mounted";

/**
 * Shared issuer authorization, target-chain check, and contract owner lookup
 * used by write forms.
 */
export function useIssuerGuard() {
  const mounted = useMounted();
  const { address, isConnected, chainId } = useConnection();
  const switchChain = useSwitchChain();

  const ownerRead = useReadContract({
    ...certiChain,
    functionName: "owner",
    query: { enabled: Boolean(contractAddress), retry: 1 },
  });

  const wrongChain = mounted && isConnected && chainId !== targetChain.id;
  const switchError = switchChain.error;
  const { reset: resetSwitchChain } = switchChain;

  useEffect(() => {
    if (!wrongChain && switchError) {
      resetSwitchChain();
    }
  }, [wrongChain, switchError, resetSwitchChain]);

  const ownerAddress = ownerRead.data;
  const isOwner = Boolean(
    mounted &&
      isConnected &&
      address &&
      ownerAddress &&
      address.toLowerCase() === ownerAddress.toLowerCase(),
  );
  const notOwner = Boolean(
    mounted && isConnected && address && ownerAddress && !isOwner,
  );

  return {
    mounted,
    address,
    chainId,
    isConnected,
    wrongChain,
    ownerRead,
    ownerAddress,
    isOwner,
    notOwner,
    switchChain,
  };
}
