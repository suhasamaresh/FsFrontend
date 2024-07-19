"use client";
import { KitProvider } from '@0xsequence/kit'
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { mainnet, polygon, Chain } from 'wagmi/chains'

const queryClient = new QueryClient()

const Providers = (props: { children: ReactNode }) => {
  const { children } = props;
  const chains = [mainnet, polygon] as [Chain, ...Chain[]]

  // Get your own keys on sequence.build
  const projectAccessKey = process.env.NEXT_PUBLIC_PROJECT_ACCESS_KEY
  const waasConfigKey = process.env.NEXT_PUBLIC_WAAS_CONFIG_KEY
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID
  /* This is disabled for now */
  /* const appleRedirectURI = window.location.origin + window.location.pathname */
  const walletConnectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID

  if (!projectAccessKey) {
    throw new Error('projectAccessKey is not defined');
  }
  
  if (!waasConfigKey) {
    throw new Error('waasConfigKey is not defined');
  }
  
  if (!googleClientId) {
    throw new Error('googleClientId is not defined');
  }
  
  if (!appleClientId) {
    throw new Error('appleClientId is not defined');
  }
  
  /* if (!appleRedirectURI) {
    throw new Error('appleRedirectURI is not defined');
  } */
  
  if (!walletConnectId) {
    throw new Error('walletConnectId is not defined');
  }

  const connectors = getDefaultWaasConnectors({
    walletConnectProjectId: walletConnectId,
    waasConfigKey,
    googleClientId,
    // Notice: uncomment to use Apple if deployed on https to support Apple redirects
    // appleClientId,
    // appleRedirectURI,
    defaultChainId: 137,
    appName: 'Kit Starter',
    projectAccessKey
  })

  const transports: { [key: number]: any } = {}

  chains.forEach(chain => {
    transports[chain.id] = http()
  })

  const config = createConfig({
    transports,
    connectors,
    chains
  })

  const kitConfig = {
    projectAccessKey
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <KitProvider config={kitConfig}>
          {children}
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default Providers;