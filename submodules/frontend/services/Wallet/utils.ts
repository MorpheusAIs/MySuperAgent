import { useAccount } from 'wagmi';

export const useWalletAddress = () => {
  const { address, isConnected } = useAccount();
  return {
    address: address || null,
    isConnected,
    // Default address for development/testing when no wallet is connected
    getAddress: () => address || '0x0000000000000000000000000000000000000000'
  };
};

export const getWalletAddressFromAccount = (account: any): string => {
  return account?.address || '0x0000000000000000000000000000000000000000';
};

// Utility to ensure we always have a valid wallet address
export const ensureWalletAddress = (address?: string | null): string => {
  if (!address) {
    // Use a default address for development/testing
    return '0x0000000000000000000000000000000000000000';
  }
  return address;
};

export default {
  useWalletAddress,
  getWalletAddressFromAccount,
  ensureWalletAddress
};