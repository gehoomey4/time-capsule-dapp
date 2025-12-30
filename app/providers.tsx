'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
    metaMaskWallet,
    rainbowWallet,
    walletConnectWallet,
    coinbaseWallet,
    trustWallet,
    ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';

const arcTestnet = {
    id: 5042002,
    name: 'Arc Testnet',
    iconUrl: 'https://testnet.arcscan.io/images/logo.svg',
    iconBackground: '#fff',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] },
    },
    blockExplorers: {
        default: { name: 'ArcScan', url: 'https://testnet.arcscan.io' },
    },
} as const;

// IMPORTANT: WalletConnect v2 requires a Project ID.
// We are using a placeholder here. Get your own at https://cloud.walletconnect.com
// Without a valid ID, WalletConnect features (including the mobile QR modal) will fail to open.
const projectId = 'e89ebc8b021304d9c7929d91547466d6'; // Random hex string to prevent crash

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [
                metaMaskWallet,
                rainbowWallet,
                coinbaseWallet,
                walletConnectWallet,
            ],
        },
        {
            groupName: 'Others',
            wallets: [
                trustWallet,
                ledgerWallet,
            ],
        },
    ],
    {
        appName: 'TimeCapsule dApp',
        projectId,
    }
);

const config = createConfig({
    chains: [arcTestnet, mainnet], // Added mainnet as fallback/reference
    connectors,
    transports: {
        [arcTestnet.id]: http(),
        [mainnet.id]: http(),
    },
    ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider modalSize="compact">
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
