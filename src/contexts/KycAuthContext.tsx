'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { User, AuthResponse, WalletAuthRequest } from '../types';

interface KycAuthContextType {
  // KYC state
  kycUser: any | null;
  isKycAuthenticated: boolean;
  kycToken: string | null;

  // Wallet auth state
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;

  // Enhanced authentication state
  isEmailVerified: boolean;
  accessLevel: 'guest' | 'email_verified' | 'kyc_verified' | 'fully_authenticated';
  sessionExpiresAt: string | null;

  // Functions
  setKycAuth: (token: string, user: any) => Promise<void>;
  connectWallet: () => Promise<void>;
  logout: (type?: 'wallet' | 'full') => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkKycStatus: () => boolean;
  getSessionInfo: () => any;
}

const KycAuthContext = createContext<KycAuthContextType | undefined>(undefined);

export function useKycAuth() {
  const context = useContext(KycAuthContext);
  if (context === undefined) {
    throw new Error('useKycAuth must be used within a KycAuthProvider');
  }
  return context;
}

interface KycAuthProviderProps {
  children: ReactNode;
}

export function KycAuthProvider({ children }: KycAuthProviderProps) {
  // KYC state
  const [kycUser, setKycUser] = useState<any | null>(null);
  const [kycToken, setKycToken] = useState<string | null>(null);

  // Wallet auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Enhanced auth state
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  // Safely access wallet context with fallback
  let walletState;
  try {
    walletState = useWallet();
  } catch (error) {
    // Wallet context not available yet, use defaults
    walletState = {
      publicKey: null,
      signMessage: null,
      connected: false,
      disconnect: () => {},
      select: () => {}
    };
  }

  const { publicKey, signMessage, connected, disconnect, select } = walletState;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for existing sessions on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedKycToken = localStorage.getItem('minerva_kyc_token');
        const savedKycUser = localStorage.getItem('minerva_kyc_user');
        const savedToken = localStorage.getItem('minerva_token');
        const savedUser = localStorage.getItem('minerva_user');

        // Restore KYC session
        if (savedKycToken && savedKycUser) {
          try {
            const parsedKycUser = JSON.parse(savedKycUser);
            setKycToken(savedKycToken);
            setKycUser(parsedKycUser);
            console.log('KYC session restored from localStorage in KycAuthContext');
          } catch (error) {
            console.error('Error parsing saved KYC user:', error);
            localStorage.removeItem('minerva_kyc_token');
            localStorage.removeItem('minerva_kyc_user');
          }
        }

        // Restore wallet session
        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setToken(savedToken);
            setUser(parsedUser);
            console.log('Wallet session restored from localStorage in KycAuthContext');
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('minerva_token');
            localStorage.removeItem('minerva_user');
          }
        }

        // Add a small delay to ensure wallet adapters have time to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const setKycAuth = async (newToken: string, newUser: any) => {
    // Set KYC authentication
    setKycToken(newToken);
    setKycUser(newUser);
    localStorage.setItem('minerva_kyc_token', newToken);
    localStorage.setItem('minerva_kyc_user', JSON.stringify(newUser));

    console.log('KYC authentication set:', { username: newUser.username, email: newUser.email });

    // Note: We don't clear wallet authentication here to allow wallet persistence
    // across page reloads. Wallet clearing only happens on explicit logout.
  };

  const connectWallet = async () => {
    console.log('connectWallet called with state:', {
      publicKey: publicKey?.toString(),
      hasSignMessage: !!signMessage,
      kycUser: kycUser ? { username: kycUser.username, email: kycUser.email } : null,
      hasKycToken: !!kycToken
    });

    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or wallet context not available');
    }

    if (!kycUser || !kycToken) {
      console.error('KYC authentication missing:', { kycUser: !!kycUser, kycToken: !!kycToken });
      throw new Error('KYC registration required before wallet connection');
    }

    setIsLoading(true);
    try {
      // Get nonce from backend
      const nonceResponse = await axios.get(`${backendUrl}/auth/nonce`, {
        params: { wallet: publicKey.toString() }
      });

      const { nonce, timestamp } = nonceResponse.data.data;

      // Create message to sign
      const authMessage = `Welcome to Minerva Estate!

Please sign this message to authenticate your wallet.

This is a secure authentication process that proves you own this wallet address.

Wallet: ${publicKey.toString()}
Nonce: ${nonce}
Time: ${timestamp}

By signing this message, you agree to authenticate with Minerva Estate platform.`;

      console.log('Requesting message signature from wallet...');

      // Convert the formatted message to bytes
      const messageBytes = new TextEncoder().encode(authMessage);

      let signature;
      try {
        signature = await signMessage(messageBytes);
      } catch (signError: any) {
        console.log('Message signing was cancelled or failed:', signError.message);

        // Handle user rejection specifically
        if (signError.message?.includes('User rejected') ||
            signError.message?.includes('rejected') ||
            signError.message?.includes('cancelled') ||
            signError.message?.includes('denied')) {
          const rejectionError = new Error('User rejected the message signing request');
          (rejectionError as any).isUserRejection = true;
          throw rejectionError;
        }

        throw signError;
      }

      // Convert signature to base64 for backend
      const signatureBase64 = Buffer.from(signature).toString('base64');

      // Verify signature with backend and link to KYC user
      const authRequest: WalletAuthRequest & { kycEmail: string } = {
        walletPubkey: publicKey.toString(),
        signature: signatureBase64,
        nonce,
        kycEmail: kycUser.email
      };

      const authResponse = await axios.post(`${backendUrl}/auth/verify`, authRequest);

      console.log('Wallet authentication successful:', authResponse.data);

      if (authResponse.data.success && authResponse.data.data.token && authResponse.data.data.user) {
        setToken(authResponse.data.data.token);
        setUser(authResponse.data.data.user);

        // Save wallet auth to localStorage
        localStorage.setItem('minerva_token', authResponse.data.data.token);
        localStorage.setItem('minerva_user', JSON.stringify(authResponse.data.data.user));

        // Update KYC user with wallet connection status
        const updatedKycUser = {
          ...kycUser,
          isWalletConnected: true,
          walletPubkey: publicKey.toString()
        };
        setKycUser(updatedKycUser);
        localStorage.setItem('minerva_kyc_user', JSON.stringify(updatedKycUser));
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (type: 'wallet' | 'full' = 'full') => {
    try {
      console.log(`Starting ${type} logout process...`);

      // Call backend logout endpoint if we have a refresh token
      if (refreshTokenValue) {
        try {
          await axios.post(`${backendUrl}/kyc/logout`, {
            type,
            refreshToken: refreshTokenValue
          });
        } catch (error) {
          console.log('Backend logout completed with minor issues');
        }
      }

      if (type === 'wallet') {
        // Wallet-only logout: Keep KYC authentication
        setUser(null);
        setToken(null);
        localStorage.removeItem('minerva_token');
        localStorage.removeItem('minerva_user');

        // Disconnect wallet
        if (typeof disconnect === 'function') {
          try {
            await disconnect();
            console.log('Wallet adapter disconnected');
          } catch (error) {
            console.log('Wallet adapter disconnect completed');
          }
        }

        // Clear wallet selection
        if (typeof select === 'function') {
          try {
            select(null);
            console.log('Wallet selection cleared');
          } catch (error) {
            console.log('Wallet selection clear completed');
          }
        }

        console.log('Wallet logout completed - KYC session preserved');
      } else {
        // Full logout: Clear everything

        // First disconnect the wallet
        if (typeof disconnect === 'function') {
          try {
            await disconnect();
            console.log('Wallet adapter disconnected');
          } catch (error) {
            console.log('Wallet adapter disconnect completed');
          }
        }

        // Clear wallet selection
        if (typeof select === 'function') {
          try {
            select(null);
            console.log('Wallet selection cleared');
          } catch (error) {
            console.log('Wallet selection clear completed');
          }
        }

        // Force clear any wallet connection state in the browser
        if (typeof window !== 'undefined') {
          // Clear Phantom wallet connection
          if ((window as any).phantom?.solana) {
            try {
              await (window as any).phantom.solana.disconnect();
              console.log('Phantom wallet disconnected');
            } catch (error) {
              console.log('Phantom wallet disconnect completed');
            }
          }

          // Clear Solflare wallet connection
          if ((window as any).solflare) {
            try {
              await (window as any).solflare.disconnect();
              console.log('Solflare wallet disconnected');
            } catch (error) {
              console.log('Solflare wallet disconnect completed');
            }
          }
        }

        // Clear all auth state
        setUser(null);
        setToken(null);
        setKycUser(null);
        setKycToken(null);
        setRefreshTokenValue(null);
        setSessionExpiresAt(null);

        // Clear localStorage
        localStorage.removeItem('minerva_token');
        localStorage.removeItem('minerva_user');
        localStorage.removeItem('minerva_kyc_token');
        localStorage.removeItem('minerva_kyc_user');
        localStorage.removeItem('minerva_refresh_token');
        localStorage.removeItem('minerva_session_expires');

        // Clear wallet adapter localStorage entries
        localStorage.removeItem('walletName');
        localStorage.removeItem('walletAdapter');

        // Clear all potential wallet-related localStorage entries
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('wallet') || key.includes('solana') || key.includes('phantom'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        console.log('Complete logout successful');
      }

      // Clear axios authorization header
      delete axios.defaults.headers.common['Authorization'];

    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, ensure local state is cleared appropriately
      if (type === 'full') {
        setUser(null);
        setToken(null);
        setKycUser(null);
        setKycToken(null);
        setRefreshTokenValue(null);
        setSessionExpiresAt(null);
      } else {
        setUser(null);
        setToken(null);
      }
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!refreshTokenValue) {
      return false;
    }

    try {
      const response = await axios.post(`${backendUrl}/kyc/refresh-token`, {
        refreshToken: refreshTokenValue
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;

        setToken(accessToken);
        setRefreshTokenValue(newRefreshToken);

        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
        setSessionExpiresAt(expiresAt);

        // Update localStorage
        localStorage.setItem('minerva_token', accessToken);
        localStorage.setItem('minerva_refresh_token', newRefreshToken);
        localStorage.setItem('minerva_session_expires', expiresAt);

        // Update axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        console.log('Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, do a full logout
      await logout('full');
    }

    return false;
  };

  const getSessionInfo = () => {
    const isKycAuthenticated = !!(kycUser && kycToken);
    const isWalletConnected = !!(user && token);
    const isEmailVerified = kycUser?.emailVerified || false;

    let accessLevel: 'guest' | 'email_verified' | 'kyc_verified' | 'fully_authenticated' = 'guest';

    if (isWalletConnected && isKycAuthenticated) {
      accessLevel = 'fully_authenticated';
    } else if (isKycAuthenticated) {
      accessLevel = 'kyc_verified';
    } else if (isEmailVerified) {
      accessLevel = 'email_verified';
    }

    return {
      isKycAuthenticated,
      isWalletConnected,
      isEmailVerified,
      accessLevel,
      sessionExpiresAt
    };
  };

  const checkKycStatus = (): boolean => {
    const skipKyc = process.env.NEXT_PUBLIC_SKIP_KYC === 'true';

    if (skipKyc) {
      return true;
    }

    return user?.kyc?.isVerified === true;
  };

  // Auto logout when wallet disconnects (but not during initial loading or page refresh)
  useEffect(() => {
    // Don't trigger auto-logout during initial loading or if there's no user
    if (isInitializing || !user) return;

    // Only logout if wallet was explicitly disconnected after being connected
    // and we're not in the middle of a page reload (wallet adapters restore automatically)
    if (!connected && publicKey === null) {
      const timeoutId = setTimeout(() => {
        // Triple-check conditions haven't changed, we're not initializing, and wallet didn't reconnect
        if (!isInitializing && !connected && user && publicKey === null) {
          console.log('Wallet permanently disconnected after timeout, logging out user');
          setUser(null);
          setToken(null);
          localStorage.removeItem('minerva_token');
          localStorage.removeItem('minerva_user');
        }
      }, 10000); // Increased timeout to 10 seconds to allow for wallet adapter restoration

      return () => clearTimeout(timeoutId);
    }
  }, [connected, user, publicKey, isInitializing]);

  // Check wallet compatibility when wallet connects
  useEffect(() => {
    if (connected && publicKey && user) {
      if (user.walletPubkey !== publicKey.toString()) {
        console.log('Different wallet connected, clearing wallet authentication');
        setToken(null);
        setUser(null);
        localStorage.removeItem('minerva_token');
        localStorage.removeItem('minerva_user');
      }
    }
  }, [connected, publicKey, user]);

  const isKycAuthenticated = !!(kycUser && kycToken);
  const isAuthenticated = !!(user && token);
  const sessionInfo = getSessionInfo();

  return (
    <KycAuthContext.Provider value={{
      kycUser,
      isKycAuthenticated,
      kycToken,
      user,
      isLoading,
      isInitializing,
      isAuthenticated,
      isEmailVerified: sessionInfo.isEmailVerified,
      accessLevel: sessionInfo.accessLevel,
      sessionExpiresAt,
      setKycAuth,
      connectWallet,
      logout,
      refreshToken,
      checkKycStatus,
      getSessionInfo
    }}>
      {children}
    </KycAuthContext.Provider>
  );
}