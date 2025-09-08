import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useCallback } from 'react';
import { useAccount } from 'wagmi';

export const useWalletAddress = () => {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, userWallet, userEmail, userId } = usePrivyAuth();

  // Memoize getAddress to prevent useEffect re-triggers
  const getAddress = useCallback(() => {
    // Priority: wallet connection > Privy wallet > fallback to user ID string
    if (address) return address;
    if (userWallet) return userWallet;
    // For users without wallets (Google/X), use their user ID as identifier
    if (isAuthenticated && userId) return `user_${userId}`;
    return null;
  }, [address, userWallet, isAuthenticated, userId]);

  // Check if user has any form of authentication
  const hasAuthentication = isConnected || isAuthenticated;

  return {
    address: getAddress(),
    isConnected: hasAuthentication,
    isWalletConnected: isConnected,
    isPrivyAuthenticated: isAuthenticated,
    userEmail,
    userWallet,
    getAddress,
  };
};

export const getWalletAddressFromAccount = (account: any): string | null => {
  return account?.address || null;
};

export default {
  useWalletAddress,
  getWalletAddressFromAccount,
};
