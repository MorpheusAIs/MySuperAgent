import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import axios from "axios";
import { trackEvent } from "@/services/analytics";

// Types
interface PrivyAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: number | null;
  authToken: string | null;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  apiClient: () => any;
  loginWithGoogle: () => Promise<void>;
  loginWithWallet: () => Promise<void>;
  loginWithTwitter: () => Promise<void>;
  userEmail: string | null;
  userWallet: string | null;
}

// Create context
const PrivyAuthContext = createContext<PrivyAuthContextType | undefined>(undefined);

// Provider component
export const PrivyAuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    ready,
    authenticated: privyAuthenticated,
    user,
    login,
    logout: privyLogout,
    getAccessToken,
  } = usePrivy();
  
  const { wallets } = useWallets();
  const { address } = useAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userWallet, setUserWallet] = useState<string | null>(null);

  // Update user info when Privy user changes
  useEffect(() => {
    if (user) {
      // Get email from user object
      const email = user.email?.address || null;
      setUserEmail(email);

      // Get wallet address from user or connected wallets
      const wallet = user.wallet?.address || 
                    wallets[0]?.address || 
                    address || 
                    null;
      setUserWallet(wallet);
    } else {
      setUserEmail(null);
      setUserWallet(null);
    }
  }, [user, wallets, address]);

  // Sync authentication state with Privy
  useEffect(() => {
    const syncAuth = async () => {
      if (privyAuthenticated && user) {
        try {
          setIsLoading(true);
          
          // Get Privy access token
          const privyToken = await getAccessToken();
          
          if (privyToken) {
            // Register/login with our backend using Privy token
            const response = await axios.post("/api/auth/privy-verify", {
              privy_token: privyToken,
              privy_user_id: user.id,
              email: user.email?.address,
              wallet_address: userWallet,
            });

            const { access_token, user_id } = response.data;
            
            // Store authentication data
            localStorage.setItem("authToken", access_token);
            localStorage.setItem("userId", user_id.toString());
            localStorage.setItem("privyUserId", user.id);

            setAuthToken(access_token);
            setUserId(user_id);
            setIsAuthenticated(true);

            // Track successful authentication
            trackEvent('auth.privy_authenticated', {
              privyUserId: user.id,
              userId: user_id.toString(),
              authMethod: user.email ? 'google' : 'wallet',
              email: user.email?.address,
              wallet: userWallet,
            });
          }
        } catch (error) {
          console.error("Privy authentication sync error:", error);
          trackEvent('auth.privy_error', {
            error: error instanceof Error ? error.message : 'Authentication failed',
          });
        } finally {
          setIsLoading(false);
        }
      } else if (!privyAuthenticated) {
        // User logged out from Privy
        setIsAuthenticated(false);
        setAuthToken(null);
        setUserId(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("privyUserId");
      }
    };

    if (ready) {
      syncAuth();
    }
  }, [privyAuthenticated, user, ready, userWallet]);

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      trackEvent('auth.google_login_started');
      
      await login({
        loginMethods: ['google'],
      });
      
      trackEvent('auth.google_login_success');
    } catch (error) {
      console.error("Google login error:", error);
      trackEvent('auth.google_login_error', {
        error: error instanceof Error ? error.message : 'Google login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Wallet
  const loginWithWallet = async () => {
    try {
      setIsLoading(true);
      trackEvent('auth.wallet_login_started');
      
      await login({
        loginMethods: ['wallet'],
      });
      
      trackEvent('auth.wallet_login_success');
    } catch (error) {
      console.error("Wallet login error:", error);
      trackEvent('auth.wallet_login_error', {
        error: error instanceof Error ? error.message : 'Wallet login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Twitter
  const loginWithTwitter = async () => {
    try {
      setIsLoading(true);
      trackEvent('auth.twitter_login_started');
      
      await login({
        loginMethods: ['twitter'],
      });
      
      trackEvent('auth.twitter_login_success');
    } catch (error) {
      console.error("Twitter login error:", error);
      trackEvent('auth.twitter_login_error', {
        error: error instanceof Error ? error.message : 'Twitter login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Unified authenticate function (for backward compatibility)
  const authenticate = async () => {
    // If user has a wallet, use wallet login, otherwise use Google
    if (address) {
      await loginWithWallet();
    } else {
      await loginWithGoogle();
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (authToken) {
        // Call logout endpoint to invalidate token on server
        await axios.post(
          "/api/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("privyUserId");
      
      // Track logout event
      trackEvent('auth.privy_logout', {
        userId: userId?.toString(),
        privyUserId: user?.id,
      });
      
      setAuthToken(null);
      setUserId(null);
      setIsAuthenticated(false);
      
      // Logout from Privy
      await privyLogout();
    }
  };

  // Create authenticated API client
  const apiClient = () => {
    return axios.create({
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    });
  };

  return (
    <PrivyAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading: isLoading || !ready,
        userId,
        authToken,
        authenticate,
        logout,
        apiClient,
        loginWithGoogle,
        loginWithWallet,
        loginWithTwitter,
        userEmail,
        userWallet,
      }}
    >
      {children}
    </PrivyAuthContext.Provider>
  );
};

// Hook to use the Privy auth context
export const usePrivyAuth = () => {
  const context = useContext(PrivyAuthContext);
  if (context === undefined) {
    throw new Error("usePrivyAuth must be used within a PrivyAuthProvider");
  }
  return context;
};