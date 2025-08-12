import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "@/contexts/auth/AuthProvider";

export const AutoAuth = () => {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, authenticate } = useAuth();

  // Automatically authenticate when wallet is connected but user isn't authenticated
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      authenticate();
    }
  }, [isConnected, address, isAuthenticated]);

  // No UI is rendered
  return null;
};
