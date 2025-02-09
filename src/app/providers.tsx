'use client';

import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base, baseSepolia } from 'wagmi/chains'; // add baseSepolia for testing
import { GridProvider } from './context/gridContext'; // Import your GridProvider

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia} // Use baseSepolia for testing
    >
      <GridProvider>
        {props.children}
      </GridProvider>
    </OnchainKitProvider>
  );
}
