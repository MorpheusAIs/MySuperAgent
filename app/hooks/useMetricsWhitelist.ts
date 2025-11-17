import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useMetricsWhitelist() {
  const { userEmail, userWallet, isAuthenticated } = usePrivyAuth();
  const { address } = useAccount();
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkWhitelist = async () => {
      if (!isAuthenticated && !address) {
        setIsWhitelisted(false);
        setIsLoading(false);
        return;
      }

      try {
        const email = userEmail || null;
        const walletID = userWallet || address || null;

        console.log('[useMetricsWhitelist] Checking whitelist:', { email, walletID, userWallet, address });

        const response = await axios.get('/api/metrics/whitelist-check', {
          params: { email, walletID },
          headers: {
            'x-user-email': email || '',
            'x-wallet-address': walletID || '',
          },
        });

        console.log('[useMetricsWhitelist] Response:', response.data);
        setIsWhitelisted(response.data.isWhitelisted || false);
      } catch (error) {
        console.error('Error checking metrics whitelist:', error);
        setIsWhitelisted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkWhitelist();
  }, [isAuthenticated, userEmail, userWallet, address]);

  return { isWhitelisted, isLoading };
}

