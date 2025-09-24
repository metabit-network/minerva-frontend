'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useKycAuth } from '@/contexts/KycAuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, AlertCircle, ChevronDown, User, LogOut, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const [phantomInstalled, setPhantomInstalled] = useState(false);
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

  // Use wallet hook directly (AuthContext handles the safety)
  const { connected, connecting, disconnect, select, wallets, wallet } = useWallet();

  // Ensure component is mounted before rendering wallet UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if Phantom is installed
  useEffect(() => {
    if (!mounted) return;

    const checkPhantom = () => {
      if (typeof window !== 'undefined') {
        const isInstalled = !!(window as any).phantom?.solana;
        setPhantomInstalled(isInstalled);

        if (!isInstalled) {
          console.warn('Phantom wallet not detected');
        }
      }
    };

    checkPhantom();

    // Check again after a short delay in case Phantom loads asynchronously
    const timer = setTimeout(checkPhantom, 1000);
    return () => clearTimeout(timer);
  }, [mounted]);

  // Auto-show modal when wallet connects (if not already authenticated and user hasn't signed out)
  useEffect(() => {
    if (connected && !isAuthenticated && !showSignModal && !hasUserSignedOut && !isCancelling && !explicitLogout) {
      // Show modal automatically when wallet connects (but not after user signs out or while cancelling)
      setShowSignModal(true);
    }
  }, [connected, isAuthenticated, showSignModal, hasUserSignedOut, isCancelling, explicitLogout]);

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
    if (isAuthenticated && showSignModal) {
      setShowSignModal(false);
      setAuthError(null); // Clear any auth errors when successful
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
      // For modal cancel, only disconnect wallet - DON'T clear KYC authentication
      if (typeof disconnect === 'function') {
        await disconnect();
        console.log('Wallet disconnected after user cancelled authentication');
      }

      // Clear wallet selection so user can choose different wallet next time
      if (typeof select === 'function') {
        try {
          select(null);
          console.log('Wallet selection cleared after cancel');
        } catch (error) {
          console.log('Wallet selection clear completed');
        }
      }

      // Clear only wallet-related localStorage, keep KYC data
      localStorage.removeItem('walletName');
      localStorage.removeItem('minerva_token');
      localStorage.removeItem('minerva_user');

      // Clear axios authorization header for wallet auth only
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleWalletSelect = async (walletName: string) => {
    try {
      setIsTransitioning(true);

      // Start fade out animation
      await new Promise(resolve => setTimeout(resolve, 150));

      select(walletName as unknown as import('@solana/wallet-adapter-base').WalletName);
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
      {(!connected || !isAuthenticated) && (
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
              {user?.walletPubkey?.slice(0, 6)}...{user?.walletPubkey?.slice(-4)}
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
                      {user?.walletPubkey?.slice(0, 8)}...{user?.walletPubkey?.slice(-6)}
                    </div>
                    <div className="text-xs text-muted-foreground">Solana Testnet Environment</div>
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
                    } catch (error) {
                      console.error('Full logout error:', error);
                      try {
                        await disconnect();
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
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Phantom Wallet</div>
                      <div className="text-xs text-muted-foreground">Solana Network</div>
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
                {wallets.map((wallet) => (
                  <Button
                    key={wallet.adapter.name}
                    onClick={() => handleWalletSelect(wallet.adapter.name)}
                    variant="neon"
                    className="w-full justify-start h-12 cursor-pointer"
                    disabled={connecting}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      {wallet.adapter.icon && (
                        <img
                          src={wallet.adapter.icon}
                          alt={wallet.adapter.name}
                          className="w-6 h-6"
                        />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{wallet.adapter.name}</div>
                        <div className="text-xs opacity-75">
                          {wallet.readyState === 'Installed' ? 'Detected' : 'Not Installed'}
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
                  Secure wallet connection powered by Solana blockchain technology
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}