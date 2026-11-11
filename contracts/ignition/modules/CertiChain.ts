import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CertiChainModule", (m) => {
  const certiChain = m.contract("CertiChain");
  return { certiChain };
});
