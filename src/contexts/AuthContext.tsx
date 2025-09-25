'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import axios from 'axios';
import { User, AuthResponse, WalletAuthRequest } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  checkKycStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Use wagmi hooks for Ethereum wallet
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  // Map to legacy variable names for compatibility
  const connected = isConnected;
  const publicKey = address ? { toString: () => address } : null;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for existing token on mount and restore session immediately
  useEffect(() => {
    const savedToken = localStorage.getItem('minerva_token');
    const savedUser = localStorage.getItem('minerva_user');

    console.log('saved token/user on mount:', savedUser ? JSON.parse(savedUser) : null);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        console.log('Session restored from localStorage on mount');
      } catch (error) {
        console.error('Error parsing saved user on mount:', error);
        localStorage.removeItem('minerva_token');
        localStorage.removeItem('minerva_user');
      }
    }

    // Always set initialization as complete after checking localStorage
    setIsInitializing(false);
  }, []);

  const login = async () => {
    if (!publicKey || !signMessageAsync) {
      throw new Error('Wallet not connected or wallet context not available');
    }

    setIsLoading(true);
    try {
      // Get nonce from backend
      const nonceResponse = await axios.get(`${backendUrl}/auth/nonce`, {
        params: { wallet: publicKey.toString() }
      });

      const { nonce, timestamp } = nonceResponse.data.data;

      // Create a user-friendly message with context
      const authMessage = `Welcome to Minerva Estate!

Please sign this message to authenticate your wallet.

This is a secure authentication process that proves you own this wallet address.

Wallet: ${publicKey.toString()}
Nonce: ${nonce}
Time: ${timestamp}

By signing this message, you agree to authenticate with Minerva Estate platform.`;

      console.log('Requesting message signature from wallet...');
      console.log('Message to sign:', authMessage);

      let signature;
      try {
        signature = await signMessageAsync({ message: authMessage });
      } catch (signError: any) {
        console.log('Message signing was cancelled or failed:', signError.message);

        // Handle user rejection specifically - create a custom error with a flag
        if (signError.message?.includes('User rejected') ||
            signError.message?.includes('rejected') ||
            signError.message?.includes('cancelled') ||
            signError.message?.includes('denied')) {
          const rejectionError = new Error('User rejected the message signing request');
          (rejectionError as any).isUserRejection = true;
          throw rejectionError;
        }

        // Re-throw other signing errors
        throw signError;
      }

      // Convert signature to base64 for backend
      const signatureBase64 = Buffer.from(signature).toString('base64');

      // Verify signature with backend
      const authRequest: WalletAuthRequest = {
        walletPubkey: publicKey.toString(),
        signature: signatureBase64,
        nonce
      };

      const authResponse = await axios.post(`${backendUrl}/auth/verify`, authRequest);

      console.log('Authentication successful:', authResponse.data);

      if (authResponse.data.success && authResponse.data.data.token && authResponse.data.data.user) {
        setToken(authResponse.data.data.token);
        setUser(authResponse.data.data.user);
        // Save to localStorage
        localStorage.setItem('minerva_token', authResponse.data.data.token);
        localStorage.setItem('minerva_user', JSON.stringify(authResponse.data.data.user));     
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('minerva_token');
    localStorage.removeItem('minerva_user');
    disconnect();
  };

  const checkKycStatus = (): boolean => {
    const skipKyc = process.env.NEXT_PUBLIC_SKIP_KYC === 'true';

    if (skipKyc) {
      return true;
    }

    return user?.kyc?.isVerified === true;
  };

  // Auto logout when wallet disconnects (but not during initial load or reconnection)
  useEffect(() => {
    // Only logout if we have a user, wallet is explicitly disconnected (not just loading),
    // and there's no publicKey. Also add a delay to handle temporary disconnections.
    if (!connected && user && publicKey === null) {
      // Wait a bit to see if this is just a temporary disconnection during page load
      const timeoutId = setTimeout(() => {
        // Double check the conditions after the delay
        if (!connected && user && publicKey === null) {
          console.log('Wallet permanently disconnected, logging out user');
          logout();
        }
      }, 2000); // 2 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [connected, user, publicKey]);

  // Auto-login when wallet connects and we have saved token (for returning users)
  useEffect(() => {
    const savedToken = localStorage.getItem('minerva_token');
    const savedUser = localStorage.getItem('minerva_user');

    // If we already have a user loaded from localStorage, check wallet compatibility when it connects
    if (connected && publicKey && user && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.walletPubkey !== publicKey.toString()) {
          // Different wallet connected than the saved user, clear auth
          console.log('Different wallet connected, clearing authentication');
          localStorage.removeItem('minerva_token');
          localStorage.removeItem('minerva_user');
          setToken(null);
          setUser(null);
        } else {
          console.log('Wallet matches saved user, maintaining session');
        }
      } catch (error) {
        console.error('Error validating saved user against wallet:', error);
        localStorage.removeItem('minerva_token');
        localStorage.removeItem('minerva_user');
        setToken(null);
        setUser(null);
      }
    }

    // If wallet connects and we have saved auth but no current user, restore session
    else if (connected && publicKey && savedToken && savedUser && !user) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.walletPubkey === publicKey.toString()) {
          // Saved user matches connected wallet - restore session
          console.log('Restoring user session for returning user with wallet connection');
          setToken(savedToken);
          setUser(parsedUser);
        } else {
          // Different wallet connected, clear old auth
          console.log('Different wallet connected, clearing old auth');
          localStorage.removeItem('minerva_token');
          localStorage.removeItem('minerva_user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('minerva_token');
        localStorage.removeItem('minerva_user');
      }
    }
  }, [connected, publicKey, user]);

  // User is authenticated if they have a valid user and token, regardless of current wallet connection status
  // This allows showing authenticated state while wallet is reconnecting on page reload
  const isAuthenticated = !!(user && token);

  // Debug logging
  useEffect(() => {
    console.log('AuthContext debug:', {
      user: !!user,
      userWallet: user?.walletPubkey,
      token: !!token,
      connected,
      publicKey: publicKey?.toString(),
      isAuthenticated
    });
  }, [user, token, connected, publicKey, isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isInitializing,
      isAuthenticated,
      login,
      logout,
      checkKycStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}