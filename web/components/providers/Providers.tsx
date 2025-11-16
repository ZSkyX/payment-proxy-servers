'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useUserSync } from '@/hooks/useUserSync';

function UserSyncWrapper({children}: {children: React.ReactNode}) {
  // Sync user to Supabase on login
  useUserSync();

  return <>{children}</>;
}

export default function Providers({children}: {children: React.ReactNode}) {
  useEffect(() => {
    // Suppress hydration warnings from Privy's internal components
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string') {
        const message = args[0];
        // Suppress Privy-related hydration errors, HTML nesting warnings, and React DOM warnings
        if (
          message.includes('Hydration') ||
          message.includes('cannot be a descendant') ||
          message.includes('cannot contain') ||
          message.includes('nested') ||
          message.includes('Invalid DOM property') ||
          message.includes('fill-rule')
        ) {
          return;
        }
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      
      config={{
        // Create embedded wallets for users who don't have a wallet
        loginMethods: ['google', 'email', 'sms', 'github', 'apple'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          }
        },
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          landingHeader: 'Log In with FluxA Wallet',
        },
      }}
    >
      <UserSyncWrapper>
        {children}
      </UserSyncWrapper>
    </PrivyProvider>
  );
}
