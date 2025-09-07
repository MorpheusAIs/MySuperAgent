import { useAccount } from 'wagmi';
import { useCallback } from 'react';
import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';

export const useWalletAddress = () => {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, userWallet, userEmail, userId } = usePrivyAuth();
  
  // Memoize getAddress to prevent useEffect re-triggers
  const getAddress = useCallback(() => {
    // Priority: wallet connection > Privy wallet > fallback to user ID string
    if (address) return address;
    if (userWallet) return userWallet;
    // For users without wallets (Google/Twitter), use their user ID as identifier
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
    getAddress
  };
};

export const getWalletAddressFromAccount = (account: any): string | null => {
  return account?.address || null;
};

export default {
  useWalletAddress,
  getWalletAddressFromAccount
};