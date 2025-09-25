'use client';

import React, { useMemo } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from '@wagmi/connectors';

const queryClient = new QueryClient();

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  // Configure wagmi for Ethereum Sepolia network with Phantom
  const config = useMemo(() => {
    return createConfig({
      chains: [sepolia],
      connectors: [
        injected({
          target: () => ({
            id: 'phantom',
            name: 'Phantom',
            icon: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjM0IiB3aWR0aD0iMzQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iLjUiIHgyPSIuNSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM1MzRiYjEiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1NTFiZjkiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9Ii41IiB4Mj0iLjUiIHkxPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii44MiIvPjwvbGluZWFyR3JhZGllbnQ+PGNpcmNsZSBjeD0iMTciIGN5PSIxNyIgZmlsbD0idXJsKCNhKSIgcj0iMTciLz48cGF0aCBkPSJtMjQuMTU2MiAxMi40MTA2Yy4wNzU5LS4yNDMxLS4yNDAyLS40NDE3LS40NjEyLS4yODk2LS44NzE2LjU5OTUtMS45Mzk1Ljk1NzctMy4xNDA0Ljk1NzctMS4zNzI1IDAtMi4zNzY2LS40MTE2LTMuMTA4Ni0xLjA2MjEtLjg0MzctLjc1MDQtMS4yMzQxLTEuODEtMS4yMzQxLTIuNzc5OCAwLS41NTUzLjE0NjQtMS4yMjIzLjMzOTgtMS41NzQzcy4yODQ3LS40NTEyLS4xMjY4LS4zOTk1Yy0uNjM5My4wOC0xLjI5MjMuMjE5Ny0xLjg5ODcuNDE4OS0uNDE5NS4xMzc4LS4zNzg5LjM2NTMtLjI1OTIuNjYwNy4xNjM1LjQwMy4xNTMzLjkzNzItLjA1NTQgMS4zMjU3LS4xNzUuMzI2Mi0uMzU1Ny40OTI3LS4zNTU3LjkyNjkgMCAuODY5Ny41NTcxIDEuNTY2OSAxLjI2MDEgMi4wMDY1LjM0NzEuMjE3MS43NzEzLjM0NzEgMS4xOTYyLjM0NzEuODEwMSAwIDEuNTcxOC0uNTE2NiAyLjA1ODktMS4yOTc5LjE5ODctLjMxODguMzkzNy0uNjUxMS41NzA5LS45ODkzLjg4ODctMS42OTU1IDEuMjY2MS0yLjUxNjggMS40ODEyLTMuMjk2M3ptLTcuMDYxIDUuNzE5NGMwIDEuMTM4Ny0uOTMyNCAxLjg5MzQtMi4xMTIzIDEuODkzNC0uNjg0NCAwLTEuMzA5OC0uMjcwNi0xLjY1NzQtLjcxMDItLjM0NzUtLjQzOTctLjIxNTEtMS4wNDA1LjI2OTQtMS4zNjM0LjY1OTEtLjQ0MjMgMS4zMTEzLS4xNTcgMS45Mjk1LjEzNzguNDI0OS4yMDI1Ljc2MzEuMjg1MS45MTM2LS4xMDUxcy0uMDU4MS0uNzc0Ni0uMzQyMy0xLjA4ODd6IiBmaWxsPSJ1cmwoI2IpIi8+PC9zdmc+',
            provider: typeof window !== 'undefined' ? (window as any).phantom?.ethereum : undefined,
          })
        }),
      ],
      transports: {
        [sepolia.id]: http(),
      },
    });
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}