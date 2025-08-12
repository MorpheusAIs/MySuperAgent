import { useAccount } from 'wagmi';
import { useCallback } from 'react';

export const useWalletAddress = () => {
  const { address, isConnected } = useAccount();
  
  // Memoize getAddress to prevent useEffect re-triggers
  const getAddress = useCallback(() => {
    return address || null;
  }, [address]);
  
  return {
    address: address || null,
    isConnected,
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