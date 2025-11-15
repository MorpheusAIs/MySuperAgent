import { trackEvent } from '@/services/analytics';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import axios from 'axios';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAccount } from 'wagmi';

const AUTH_METHOD_STORAGE_KEY = 'authMethod';
const AUTH_METHOD_PRIORITIES = [
  'google_oauth',
  'twitter_oauth',
  'email',
  'phone',
  'wallet',
  'smart_wallet',
] as const;

const mapLinkedAccountType = (type?: string): AuthMethodType | null => {
  switch (type) {
    case 'google_oauth':
      return 'google';
    case 'twitter_oauth':
      return 'x';
    case 'email':
      return 'email';
    case 'phone':
      return 'sms';
    case 'wallet':
    case 'smart_wallet':
      return 'wallet';
    default:
      return null;
  }
};

// Types
export type AuthMethodType =
  | 'wallet'
  | 'google'
  | 'x'
  | 'email'
  | 'sms'
  | 'unknown';

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
  loginWithX: () => Promise<void>;
  userEmail: string | null;
  userWallet: string | null;
  authMethod: AuthMethodType | null;
}

// Create context
const PrivyAuthContext = createContext<PrivyAuthContextType | undefined>(
  undefined
);

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
  const [authMethod, setAuthMethod] = useState<AuthMethodType | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(
      AUTH_METHOD_STORAGE_KEY
    ) as AuthMethodType | null;
    return stored || null;
  });

  const persistAuthMethod = (method: AuthMethodType | null) => {
    setAuthMethod(method);
    if (typeof window === 'undefined') return;
    if (method) {
      localStorage.setItem(AUTH_METHOD_STORAGE_KEY, method);
    } else {
      localStorage.removeItem(AUTH_METHOD_STORAGE_KEY);
    }
  };

  const determineAuthMethod = useCallback((): AuthMethodType | null => {
    if (!user) return null;

    for (const type of AUTH_METHOD_PRIORITIES) {
      const match = user.linkedAccounts?.find(
        (account) => account.type === type
      );
      if (match) {
        const mapped = mapLinkedAccountType(match.type);
        if (mapped) return mapped;
      }
    }

    if (user.google) return 'google';
    if (user.twitter) return 'x';
    if (user.email) return 'email';
    if (user.wallet) return 'wallet';

    return null;
  }, [user]);

  // Update user info when Privy user changes
  useEffect(() => {
    if (user) {
      // Get email from user object
      const email = user.email?.address || null;
      setUserEmail(email);

      // Get wallet address from user or connected wallets
      const wallet =
        user.wallet?.address || wallets[0]?.address || address || null;
      setUserWallet(wallet);
    } else {
      setUserEmail(null);
      setUserWallet(null);
    }
  }, [user, wallets, address]);

  // Sync authentication state with Privy - Simplified version
  useEffect(() => {
    const syncAuth = async () => {
      if (privyAuthenticated && user) {
        try {
          setIsLoading(true);

          // Get Privy access token
          const privyToken = await getAccessToken();

          if (privyToken) {
            // Store Privy token as our auth token for now
            localStorage.setItem('authToken', privyToken);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('privyUserId', user.id);

            setAuthToken(privyToken);
            setUserId(1); // Use a default user ID for now
            setIsAuthenticated(true);

            const method = determineAuthMethod();
            persistAuthMethod(method);

            // Track successful authentication
            trackEvent('auth.privy_authenticated', {
              privyUserId: user.id,
              userId: '1',
              authMethod: method || 'unknown',
              email: user.email?.address,
              wallet: userWallet || undefined,
            });
          }
        } catch (error) {
          console.error('Privy authentication sync error:', error);
          trackEvent('auth.privy_error', {
            error:
              error instanceof Error ? error.message : 'Authentication failed',
          });
        } finally {
          setIsLoading(false);
        }
      } else if (!privyAuthenticated) {
        // User logged out from Privy
        setIsAuthenticated(false);
        setAuthToken(null);
        setUserId(null);
        persistAuthMethod(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('privyUserId');
      }
    };

    if (ready) {
      syncAuth();
    }
  }, [privyAuthenticated, ready, userWallet, determineAuthMethod]);

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      trackEvent('auth.google_login_started');

      await login({
        loginMethods: ['google'],
      });

      persistAuthMethod('google');
      trackEvent('auth.google_login_success');
    } catch (error) {
      console.error('Google login error:', error);
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

      persistAuthMethod('wallet');
      trackEvent('auth.wallet_login_success');
    } catch (error) {
      console.error('Wallet login error:', error);
      trackEvent('auth.wallet_login_error', {
        error: error instanceof Error ? error.message : 'Wallet login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login with X
  const loginWithX = async () => {
    try {
      setIsLoading(true);
      trackEvent('auth.x_login_started');

      await login({
        loginMethods: ['twitter'],
      });

      persistAuthMethod('x');
      trackEvent('auth.x_login_success');
    } catch (error) {
      console.error('X login error:', error);
      trackEvent('auth.x_login_error', {
        error: error instanceof Error ? error.message : 'X login failed',
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
      // Clear local storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('privyUserId');
      persistAuthMethod(null);

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
    } catch (error) {
      console.error('Logout error:', error);
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
        loginWithX,
        userEmail,
        userWallet,
        authMethod,
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
    throw new Error('usePrivyAuth must be used within a PrivyAuthProvider');
  }
  return context;
};
