"use client";

import { useOpenWalletModal } from "@0xsequence/wallet-widget";
import { SequenceBoilerplate } from "@0xsequence-demos/boilerplate-design-system";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";

import { Connected } from "./views/Connected";
import { NotConnected } from "./views/NotConnected";

const Home = () => {
  const { isConnected } = useAccount();

  const { setOpenWalletModal } = useOpenWalletModal();

  return (
    <SequenceBoilerplate
      githubUrl="https://github.com/0xsequence-demos/kit-embedded-wallet-nextjs-boilerplate"
      name="Sequence Kit Starter - Nextjs"
      description="Embedded Wallet"
      docsUrl="https://docs.sequence.xyz/solutions/wallets/sequence-kit/overview/"
      wagmi={{ useAccount, useDisconnect, useSwitchChain }}
      walletCallback={() => setOpenWalletModal(true)}
    >
      {isConnected ? <Connected /> : <NotConnected />}
    </SequenceBoilerplate>
  );
};

export default Home;
