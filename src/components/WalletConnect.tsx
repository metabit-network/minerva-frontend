'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useChains } from 'wagmi';
import { useKycAuth } from '@/contexts/KycAuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, AlertCircle, ChevronDown, User, LogOut, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const [phantomInstalled, setPhantomInstalled] = useState(false);
  const [walletStates, setWalletStates] = useState<{[key: string]: boolean}>({});
  const [currentConnector, setCurrentConnector] = useState<any>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasUserSignedOut, setHasUserSignedOut] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [explicitLogout, setExplicitLogout] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Always call hooks in the same order
  const { user, isLoading, isAuthenticated, connectWallet, logout, checkKycStatus } = useKycAuth();

  // Use wagmi hooks for Ethereum wallet connection
  const { isConnected, address, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const chains = useChains();

  // Map wagmi state to legacy variables for compatibility
  const connected = isConnected;
  const connecting = isConnecting;

  // Ensure component is mounted before rendering wallet UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check wallet installations
  useEffect(() => {
    if (!mounted) return;

    const checkWallets = () => {
      if (typeof window !== 'undefined') {
        const detectedWallets: {[key: string]: boolean} = {};

        // Check Phantom
        const phantomInstalled = !!(window as any).phantom?.ethereum;
        setPhantomInstalled(phantomInstalled);
        detectedWallets.Phantom = phantomInstalled;

        // Check MetaMask
        const metaMaskInstalled = !!(window as any).ethereum?.isMetaMask;
        detectedWallets.MetaMask = metaMaskInstalled;

        // Check Coinbase Wallet
        const coinbaseInstalled = !!(window as any).ethereum?.isCoinbaseWallet;
        detectedWallets['Coinbase Wallet'] = coinbaseInstalled;

        // Check WalletConnect (if injected)
        const walletConnectInstalled = !!(window as any).ethereum?.isWalletConnect;
        detectedWallets.WalletConnect = walletConnectInstalled;

        // Check Trust Wallet
        const trustInstalled = !!(window as any).ethereum?.isTrust;
        detectedWallets['Trust Wallet'] = trustInstalled;

        // Generic ethereum provider check for unknown wallets
        const hasEthereum = !!(window as any).ethereum;
        detectedWallets.Injected = hasEthereum;

        setWalletStates(detectedWallets);

        console.log('Detected wallets:', detectedWallets);
      }
    };

    checkWallets();

    // Check again after a short delay in case wallets load asynchronously
    const timer = setTimeout(checkWallets, 1000);
    return () => clearTimeout(timer);
  }, [mounted]);

  // Auto-show modal when wallet connects (if not already authenticated and user hasn't signed out)
  useEffect(() => {
    // Check if user previously cancelled wallet connection
    const wasCancelled = localStorage.getItem('minerva_wallet_cancelled') === 'true';

    // Check if user explicitly logged out
    const userLoggedOut = localStorage.getItem('minerva_user_logged_out') === 'true';
    const logoutTimestamp = localStorage.getItem('minerva_logout_timestamp');

    // If logged out recently (within last 5 minutes), don't auto-authenticate
    const recentLogout = logoutTimestamp && (Date.now() - parseInt(logoutTimestamp)) < 5 * 60 * 1000;

    // Check if there's already a valid token (user is already authenticated)
    const existingToken = localStorage.getItem('minerva_token');
    const existingUser = localStorage.getItem('minerva_user');

    // Don't show modal if:
    // - User already has valid authentication tokens
    // - User previously cancelled
    // - User explicitly logged out
    // - User logged out recently
    // - Modal is already showing
    // - Currently in loading states
    if (existingToken && existingUser) {
      console.log('User already authenticated, skipping auth modal');
      return;
    }

    if (userLoggedOut || recentLogout) {
      console.log('User recently logged out, skipping auto-authentication');
      return;
    }

    if (connected && !isAuthenticated && !showSignModal && !hasUserSignedOut && !isCancelling && !explicitLogout && !wasCancelled && !isLoading) {
      // Add a small delay to prevent race conditions with state loading
      const timer = setTimeout(() => {
        // Double-check authentication state after delay
        const stillNeedsAuth = !localStorage.getItem('minerva_token');
        if (stillNeedsAuth && connected && !isAuthenticated) {
          console.log('Showing authentication modal for connected wallet');
          setShowSignModal(true);
        }
      }, 500); // 500ms delay to allow states to settle

      return () => clearTimeout(timer);
    }
  }, [connected, isAuthenticated, showSignModal, hasUserSignedOut, isCancelling, explicitLogout, isLoading]);

  // Reset sign out flag when wallet disconnects (but preserve explicit logout state)
  useEffect(() => {
    if (!connected) {
      setHasUserSignedOut(false);
      setIsCancelling(false);
      // Don't reset explicitLogout here - let it persist until user manually connects again
    }
  }, [connected]);

  // Clear explicit logout flag when user manually connects (not just wallet adapter connecting)
  useEffect(() => {
    if (connected && explicitLogout) {
      // Add a small delay to ensure this is a deliberate connection, not just page reload
      const timer = setTimeout(() => {
        setExplicitLogout(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connected, explicitLogout]);

  // Auto-hide modal when user becomes authenticated
  useEffect(() => {
    // Check both state and localStorage to ensure user is truly authenticated
    const hasTokens = localStorage.getItem('minerva_token') && localStorage.getItem('minerva_user');

    if ((isAuthenticated || hasTokens) && showSignModal) {
      console.log('User authenticated, hiding auth modal');
      setShowSignModal(false);
      setAuthError(null); // Clear any auth errors when successful

      // Clear the cancelled flag since user successfully authenticated
      localStorage.removeItem('minerva_wallet_cancelled');
    }
  }, [isAuthenticated, showSignModal]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileDropdown && !target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
      if (showWalletModal && !target.closest('.wallet-modal-container')) {
        setShowWalletModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown, showWalletModal]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      setHasUserSignedOut(true); // Mark that user has signed out
      setExplicitLogout(true); // Mark as explicit logout to prevent auth modal
      setShowSignModal(false); // Close modal immediately when signing out

      try {
        // Call logout (which now handles wallet disconnection internally)
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback: try to disconnect manually if logout fails
        try {
          await disconnect();
        } catch (disconnectError) {
          console.error('Manual disconnect error:', disconnectError);
        }
      }
    } else {
      try {
        setAuthError(null); // Clear any previous errors
        await connectWallet();
        // Modal will auto-close via useEffect when isAuthenticated becomes true
      } catch (error: any) {
        // Check if this is a user rejection (don't log as error)
        const isUserRejection = error.isUserRejection ||
          error.message?.includes('User rejected the message signing request') ||
          error.message?.includes('User rejected') ||
          error.message?.includes('rejected') ||
          error.message?.includes('cancelled') ||
          error.message?.includes('denied');

        if (isUserRejection) {
          console.log('User cancelled message signing');
          setAuthError('Authentication cancelled. Please approve the signature request in your wallet to proceed with secure login.');
        } else {
          console.error('Authentication failed:', error);
          if (error.message?.includes('not connected')) {
            setAuthError('Wallet connection required. Please connect your wallet before proceeding.');
          } else if (error.message?.includes('KYC registration required')) {
            setAuthError('KYC registration is required before wallet connection.');
          } else {
            setAuthError('Authentication failed. Please verify your wallet connection and try again.');
          }
        }
        // If authentication fails, modal stays open for retry
      }
    }
  };

  const handleModalCancel = async (e?: React.MouseEvent) => {
    // Prevent event bubbling and double execution
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent multiple clicks
    if (isLoading || isCancelling) return;

    console.log('User cancelled wallet authentication modal');

    // Set flags to prevent modal from reopening
    setIsCancelling(true);
    setHasUserSignedOut(true);
    setExplicitLogout(true); // Mark as explicit logout to prevent auth modal
    setShowSignModal(false);
    setAuthError(null);

    try {
      // Disconnect wallet completely to clear the connection state
      if (typeof disconnect === 'function') {
        disconnect();
        console.log('Wallet disconnected after user cancelled authentication');
      }

      // Clear wallet-related localStorage to prevent reconnection on reload
      localStorage.removeItem('walletName');
      localStorage.removeItem('minerva_token');
      localStorage.removeItem('minerva_user');
      localStorage.removeItem('minerva_selected_wallet'); // Clear stored wallet selection

      // Also clear any wagmi-related persistence
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.wallet');
      localStorage.removeItem('wagmi.store');

      // Clear axios authorization header for wallet auth only
      delete axios.defaults.headers.common['Authorization'];

      // Set a flag to prevent auto-reconnection on page reload
      localStorage.setItem('minerva_wallet_cancelled', 'true');

    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleWalletSelect = async (connectorId: string) => {
    try {
      setIsTransitioning(true);

      // Clear all logout and cancellation flags when user manually connects
      localStorage.removeItem('minerva_wallet_cancelled');
      localStorage.removeItem('minerva_user_logged_out');
      localStorage.removeItem('minerva_logout_timestamp');
      setHasUserSignedOut(false);
      setExplicitLogout(false);

      // Start fade out animation
      await new Promise(resolve => setTimeout(resolve, 150));

      const connector = connectors.find(c => c.id === connectorId);

      console.log('User selected wallet connector:', connector);
      if (connector) {
        setCurrentConnector(connector); // Track the selected connector

        // Store connector info in localStorage for persistence across reloads
        localStorage.setItem('minerva_selected_wallet', JSON.stringify({
          id: connector.id,
          name: connector.name,
          icon: connector.icon
        }));

        connect({ connector });
      }
      setShowWalletModal(false);

      // Small delay before showing auth modal
      await new Promise(resolve => setTimeout(resolve, 100));

      setIsTransitioning(false);
    } catch (error) {
      console.error('Error selecting wallet:', error);
      setIsTransitioning(false);
    }
  };

  const isKycVerified = checkKycStatus();

  // Get current network information
  const getCurrentNetwork = () => {
    const currentChain = chains.find(chain => chain.id === chainId);
    if (currentChain) {
      return currentChain.name;
    }
    return 'Unknown Network';
  };

  const currentNetworkName = getCurrentNetwork();

  // Get wallet display information based on current connector
  const getWalletInfo = () => {
    // First, check localStorage for persisted wallet selection
    const storedWallet = localStorage.getItem('minerva_selected_wallet');
    if (storedWallet) {
      try {
        const parsed = JSON.parse(storedWallet);
        return {
          name: parsed.name,
          icon: parsed.icon
        };
      } catch (error) {
        console.error('Error parsing stored wallet info:', error);
      }
    }

    // Second, check current connector state
    if (currentConnector) {
      return {
        name: currentConnector.name,
        icon: currentConnector.icon
      };
    }

    // Third, fallback to detecting from connected state
    if (connected) {
      // Try to detect wallet type from window object
      if ((window as any).ethereum?.isMetaMask) {
        return { name: 'MetaMask', icon: null };
      }
      if ((window as any).ethereum?.isCoinbaseWallet) {
        return { name: 'Coinbase Wallet', icon: null };
      }
      if ((window as any).phantom?.ethereum) {
        return { name: 'Phantom', icon: 'https://phantom.app/img/phantom-logo.svg' };
      }
    }

    // Default fallback
    return { name: 'Ethereum Wallet', icon: null };
  };

  const walletInfo = getWalletInfo();

  // Debug logging
  useEffect(() => {
    console.log('WalletConnect debug:', {
      connected,
      isAuthenticated,
      isLoading,
      userExists: !!user,
      mounted
    });
  }, [connected, isAuthenticated, isLoading, user, mounted]);

  // Don't render wallet UI until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center">
        {/* Skeleton for wallet connect button */}
        <div className="min-w-[160px] h-10 bg-muted/50 rounded-lg animate-pulse flex items-center justify-center">
          {/* Skeleton icon */}
          <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
          {/* Skeleton text */}
          <div className="ml-2 w-20 h-4 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {/* Wallet Installation Notice */}
      {!phantomInstalled && (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Install Phantom Wallet
          </a>
        </div>
      )}

      {/* Custom Futuristic Wallet Connect Button */}
      {!connected && (
        <Button
          onClick={() => setShowWalletModal(true)}
          variant="cyber"
          className="font-mono text-sm min-w-[160px] cursor-pointer"
          disabled={connecting}
          glow
        >
          {connecting ? (
            <>
              <Loader2 className="relative z-10 mr-2 w-4 h-4 animate-spin" />
              <span className="relative z-10">CONNECTING...</span>
            </>
          ) : (
            <>
              <Wallet className="relative z-10 mr-2 w-4 h-4" />
              <span className="relative z-10">CONNECT WALLET</span>
            </>
          )}
        </Button>
      )}

      {/* Connected but not authenticated - show wallet address */}
      {connected && !isAuthenticated && (
        <Button
          onClick={() => setShowSignModal(true)}
          variant="cyber"
          className="font-mono text-sm min-w-[160px] cursor-pointer"
          glow
        >
          <Wallet className="relative z-10 mr-2 w-4 h-4" />
          <span className="relative z-10">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </Button>
      )}

      {/* Profile Button - Show when connected and authenticated */}
      {connected && isAuthenticated && (
        <div className="relative profile-dropdown-container">
          <Button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            variant="cyber"
            className="flex items-center gap-2 min-w-0 !text-xs !font-mono cursor-pointer"
          >
            {/* Profile Avatar */}
            <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-white" />
            </div>

            {/* Wallet Address */}
            <span className="text-sm font-mono truncate max-w-24">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>

            {/* KYC Status Badge */}
            <div className="flex items-center flex-shrink-0">
              {isKycVerified ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
            </div>

            {/* Dropdown Arrow */}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 flex-shrink-0 ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </Button>

          {/* Dropdown Menu */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-[9998] glass">
              {/* Account Information */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-mono font-medium text-foreground">
                      {address?.slice(0, 8)}...{address?.slice(-6)}
                    </div>
                    <div className="text-xs text-muted-foreground">{currentNetworkName}</div>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {isKycVerified ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${isKycVerified ? 'text-success' : 'text-destructive'}`}>
                      {isKycVerified ? 'Investor Verified' : 'Verification Required'}
                    </span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {isKycVerified
                        ? 'Full platform access enabled'
                        : 'Complete investor verification for full access'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Status */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse-subtle"></div>
                  <div className="flex-1">
                    <div className="text-sm text-success font-medium">Network Active</div>
                    <div className="text-xs text-muted-foreground">Secure blockchain connection established</div>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="p-3 space-y-2">
                <Button
                  onClick={async () => {
                    setShowProfileDropdown(false);
                    setHasUserSignedOut(true);
                    setExplicitLogout(true);

                    try {
                      await logout('wallet');
                    } catch (error) {
                      console.error('Wallet logout error:', error);
                      try {
                        await disconnect();
                      } catch (disconnectError) {
                        console.error('Manual disconnect error:', disconnectError);
                      }
                    }
                  }}
                  variant="neon"
                  className="w-full justify-start cursor-pointer"
                >
                  <Wallet className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">DISCONNECT WALLET</span>
                </Button>

                <Button
                  onClick={async () => {
                    setShowProfileDropdown(false);
                    setHasUserSignedOut(true);
                    setExplicitLogout(true);

                    try {
                      await logout('full');

                      // Additional cleanup to prevent auth modal from appearing
                      setShowSignModal(false);
                      setAuthError(null);
                      setCurrentConnector(null);

                      // Clear any axios auth headers
                      delete axios.defaults.headers.common['Authorization'];

                    } catch (error) {
                      console.error('Full logout error:', error);
                      try {
                        disconnect();
                      } catch (disconnectError) {
                        console.error('Manual disconnect error:', disconnectError);
                      }
                    }
                  }}
                  variant="hologram"
                  className="w-full justify-start cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">FULL LOGOUT</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sign-in Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-background/80 backdrop-blur-xl animate-fade-in">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-xl glass animate-slide-in">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Secure Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  Authenticate your identity using cryptographic wallet signature for secure platform access
                </p>
              </div>

              {/* Wallet Information */}
              <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                      {walletInfo.icon ? (
                        <img
                          src={walletInfo.icon}
                          alt={walletInfo.name}
                          className="w-5 h-5"
                        />
                      ) : (
                        <Wallet className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{walletInfo.name}</div>
                      <div className="text-xs text-muted-foreground">{currentNetworkName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse-subtle"></div>
                    <span className="text-sm font-medium text-success">Connected</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{authError}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleModalCancel}
                  variant="neon"
                  className="flex-1 cursor-pointer"
                  disabled={isCancelling || isLoading}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="relative z-10">CANCELLING...</span>
                    </>
                  ) : (
                    <span className="relative z-10">CANCEL</span>
                  )}
                </Button>
                <Button
                  onClick={handleAuth}
                  variant="cyber"
                  className="flex-1 cursor-pointer"
                  disabled={isLoading || isCancelling}
                  glow
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                      <span className="relative z-10">AUTHENTICATING...</span>
                    </>
                  ) : (
                    <span className="relative z-10">CONTINUE</span>
                  )}
                </Button>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-center text-xs text-muted-foreground">
                  Authentication signature required. No blockchain transaction or network fees will be charged.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Futuristic Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-background/80 backdrop-blur-xl animate-fade-in">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-xl glass wallet-modal-container transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'} animate-fade-in`}>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Select Wallet</h2>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred wallet to connect to Minerva Estate
                </p>
              </div>

              {/* Wallet Options */}
              <div className="space-y-3 mb-6">
                {connectors.filter((connector) => {
                  // Filter out connector with specific base64 SVG icon
                  if (connector.icon === 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjM0IiB3aWR0aD0iMzQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iLjUiIHgyPSIuNSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM1MzRiYjEiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1NTFiZjkiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9Ii41IiB4Mj0iLjUiIHkxPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii44MiIvPjwvbGluZWFyR3JhZGllbnQ+PGNpcmNsZSBjeD0iMTciIGN5PSIxNyIgZmlsbD0idXJsKCNhKSIgcj0iMTciLz48cGF0aCBkPSJtMjQuMTU2MiAxMi40MTA2Yy4wNzU5LS4yNDMxLS4yNDAyLS40NDE3LS40NjEyLS4yODk2LS44NzE2LjU5OTUtMS45Mzk1Ljk1NzctMy4xNDA0Ljk1NzctMS4zNzI1IDAtMi4zNzY2LS40MTE2LTMuMTA4Ni0xLjA2MjEtLjg0MzctLjc1MDQtMS4yMzQxLTEuODEtMS4yMzQxLTIuNzc5OCAwLS41NTUzLjE0NjQtMS4yMjIzLjMzOTgtMS41NzQzcy4yODQ3LS40NTEyLS4xMjY4LS4zOTk1Yy0uNjM5My4wOC0xLjI5MjMuMjE5Ny0xLjg5ODcuNDE4OS0uNDE5NS4xMzc4LS4zNzg5LjM2NTMtLjI1OTIuNjYwNy4xNjM1LjQwMy4xNTMzLjkzNzItLjA1NTQgMS4zMjU3LS4xNzUuMzI2Mi0uMzU1Ny40OTI3LS4zNTU3LjkyNjkgMCAuODY5Ny41NTcxIDEuNTY2OSAxLjI2MDEgMi4wMDY1LjM0NzEuMjE3MS43NzEzLjM0NzEgMS4xOTYyLjM0NzEuODEwMSAwIDEuNTcxOC0uNTE2NiAyLjA1ODktMS4yOTc5LjE5ODctLjMxODguMzkzNy0uNjUxMS41NzA5LS45ODkzLjg4ODctMS42OTU1IDEuMjY2MS0yLjUxNjggMS40ODEyLTMuMjk2M3ptLTcuMDYxIDUuNzE5NGMwIDEuMTM4Ny0uOTMyNCAxLjg5MzQtMi4xMTIzIDEuODkzNC0uNjg0NCAwLTEuMzA5OC0uMjcwNi0xLjY1NzQtLjcxMDItLjM0NzUtLjQzOTctLjIxNTEtMS4wNDA1LjI2OTQtMS4zNjM0LjY1OTEtLjQ0MjMgMS4zMTEzLS4xNTcgMS45Mjk1LjEzNzguNDI0OS4yMDI1Ljc2MzEuMjg1MS45MTM2LS4xMDUxcy0uMDU4MS0uNzc0Ni0uMzQyMy0xLjA4ODd6IiBmaWxsPSJ1cmwoI2IpIi8+PC9zdmc+') {
                    return false;
                  }

                  // Check if wallet is actually available and enabled
                  if (connector.name === 'Phantom') {
                    return !!(window as any).phantom?.ethereum?.isPhantom;
                  }
                  if (connector.name === 'MetaMask') {
                    return !!(window as any).ethereum?.isMetaMask;
                  }
                  // For other injected wallets, check if they have a valid provider
                  if (connector.name === 'Injected') {
                    return false; // Hide generic injected connector
                  }
                  return true;
                }).map((connector) => (
                  <Button
                    key={connector.id}
                    onClick={() => handleWalletSelect(connector.id)}
                    variant="neon"
                    className="w-full justify-start h-12 cursor-pointer"
                    disabled={connecting}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      {connector.icon && (
                        <img
                          src={connector.icon}
                          alt={connector.name}
                          className="w-6 h-6"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{connector.name}</div>
                        <div className="text-xs opacity-75">
                          {walletStates[connector.name] !== undefined
                            ? (walletStates[connector.name] ? 'Detected' : 'Not Installed')
                            : (connector.readyState === 'Installed' ? 'Detected' : 'Not Installed')
                          }
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowWalletModal(false)}
                variant="hologram"
                className="w-full cursor-pointer"
              >
                <span className="relative z-10">CANCEL</span>
              </Button>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-center text-xs text-muted-foreground">
                  Secure wallet connection powered by Ethereum blockchain technology
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}