import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { trackEvent } from "@/services/analytics";

interface Wallet {
  wallet_id: string;
  network_id: string;
  address: string;
}

interface UseWalletsReturn {
  wallets: Wallet[];
  activeWallet: string | null;
  fetchWallets: () => Promise<void>;
  handleCopyAddress: (address: string) => void;
  handleSetActiveWallet: (walletId: string) => Promise<void>;
  handleCreateWallet: (walletName: string, network: string) => Promise<void>;
  handleRestoreWallet: (walletFile: File) => Promise<void>;
  handleDownloadWallet: (walletId: string) => Promise<void>;
  handleDeleteWallet: (
    walletId: string,
    confirmWalletId: string
  ) => Promise<boolean>;
}

export const useWallets = (): UseWalletsReturn => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const toast = useToast();

  const fetchWallets = useCallback(async () => {
    try {
      const [walletsResponse, activeWalletResponse] = await Promise.all([
        fetch("http://localhost:8888/wallets/list"),
        fetch("http://localhost:8888/wallets/active"),
      ]);

      const walletsData = await walletsResponse.json();
      const activeData = await activeWalletResponse.json();

      setWallets(walletsData.wallets || []);
      setActiveWallet(activeData.active_wallet_id);
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
      toast({
        title: "Error fetching wallets",
        status: "error",
        duration: 3000,
      });
    }
  }, [toast]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied to clipboard",
      status: "success",
      duration: 2000,
    });
    
    // Track address copy event
    trackEvent('wallet.copied_address', {
      wallet: address.substring(0, 6) + '...' + address.slice(-4),
    });
  };

  const handleSetActiveWallet = async (walletId: string) => {
    try {
      const response = await fetch("http://localhost:8888/wallets/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: walletId,
        }),
      });

      if (response.ok) {
        setActiveWallet(walletId);
        toast({
          title: "Active wallet set successfully",
          status: "success",
          duration: 3000,
        });
        
        // Track wallet set as active
        trackEvent('wallet.set_active', {
          walletId,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to set active wallet");
      }
    } catch (error) {
      console.error("Error setting active wallet:", error);
      toast({
        title:
          error instanceof Error
            ? error.message
            : "Failed to set active wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleCreateWallet = async (walletName: string, network: string) => {
    if (!walletName.trim()) {
      toast({
        title: "Please enter a wallet name",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8888/wallets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: walletName,
          network_id: network,
          set_active: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Wallet created successfully",
          status: "success",
          duration: 3000,
        });
        
        // Track wallet created event
        trackEvent('wallet.created', {
          network,
          walletName,
        });
        
        await fetchWallets();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create wallet");
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to create wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleRestoreWallet = async (walletFile: File) => {
    try {
      const fileContent = await walletFile.text();
      const walletData = JSON.parse(fileContent);

      const response = await fetch("http://localhost:8888/wallets/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: walletData.wallet_id,
          wallet_data: walletData,
          set_active: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Wallet restored successfully",
          status: "success",
          duration: 3000,
        });
        
        // Track wallet restored event
        trackEvent('wallet.restored', {
          walletId: walletData.wallet_id,
        });
        
        await fetchWallets();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to restore wallet");
      }
    } catch (error) {
      console.error("Error restoring wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to restore wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDownloadWallet = async (walletId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8888/wallets/export/${walletId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], {
            type: "application/json",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${walletId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          toast({
            title: "Wallet exported successfully",
            status: "success",
            duration: 3000,
          });
          
          // Track wallet download event
          trackEvent('wallet.downloaded', {
            walletId,
          });
        } else {
          throw new Error(data.message || "Failed to export wallet");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to export wallet");
      }
    } catch (error) {
      console.error("Error exporting wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to export wallet",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDeleteWallet = async (
    walletId: string,
    confirmWalletId: string
  ) => {
    if (confirmWalletId !== walletId) {
      toast({
        title: "Wallet ID does not match",
        status: "error",
        duration: 3000,
      });
      return false;
    }

    try {
      const response = await fetch(
        `http://localhost:8888/wallets/${walletId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Wallet deleted successfully",
          status: "success",
          duration: 3000,
        });
        
        // Track wallet deleted event
        trackEvent('wallet.deleted', {
          walletId,
        });
        
        await fetchWallets();
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete wallet");
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
      toast({
        title:
          error instanceof Error ? error.message : "Failed to delete wallet",
        status: "error",
        duration: 3000,
      });
      return false;
    }
  };

  return {
    wallets,
    activeWallet,
    fetchWallets,
    handleCopyAddress,
    handleSetActiveWallet,
    handleCreateWallet,
    handleRestoreWallet,
    handleDownloadWallet,
    handleDeleteWallet,
  };
};

export const NETWORKS = [
  "base-mainnet",
  "base-sepolia",
  "base-goerli",
  "ethereum-mainnet",
  "ethereum-goerli",
  "ethereum-sepolia",
] as string[];
