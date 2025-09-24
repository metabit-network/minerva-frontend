'use client';

import { useState, useEffect } from 'react';
import { KycRegistration } from './KycRegistration';
import { KycLogin } from './KycLogin';
import { Button } from './ui/Button';
import { Building, LogOut, Loader2 } from 'lucide-react';
import { useKycAuth } from '@/contexts/KycAuthContext';

interface KycAuthProps {
  onKycAuthSuccess: (token: string, user: any) => Promise<void>;
  children: React.ReactNode;
}

export function KycAuth({ onKycAuthSuccess, children }: KycAuthProps) {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [kycUser, setKycUser] = useState<any>(null);
  const [kycToken, setKycToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get the proper logout function from context
  const { logout: contextLogout } = useKycAuth();

  // Check for existing KYC session on mount
  useEffect(() => {
    if (hasInitialized) return; // Prevent multiple initializations

    const initializeKycSession = async () => {
      try {
        const savedKycToken = localStorage.getItem('minerva_kyc_token');
        const savedKycUser = localStorage.getItem('minerva_kyc_user');

        if (savedKycToken && savedKycUser) {
          try {
            const parsedUser = JSON.parse(savedKycUser);
            setKycToken(savedKycToken);
            setKycUser(parsedUser);
            console.log('KYC session restored from localStorage in KycAuth component');

            // Don't call onKycAuthSuccess during restoration - main context handles it
            // This prevents duplicate session restoration and wallet disconnection
          } catch (error) {
            console.error('Error parsing saved KYC user:', error);
            localStorage.removeItem('minerva_kyc_token');
            localStorage.removeItem('minerva_kyc_user');
          }
        }
      } finally {
        setIsInitializing(false);
        setHasInitialized(true);
      }
    };

    initializeKycSession();
  }, []); // Remove onKycAuthSuccess from dependencies to prevent infinite loop

  const handleKycAuthSuccess = async (token: string, user: any) => {
    setKycToken(token);
    setKycUser(user);

    // Save to localStorage
    localStorage.setItem('minerva_kyc_token', token);
    localStorage.setItem('minerva_kyc_user', JSON.stringify(user));

    // Notify parent component (this will disconnect any existing wallet)
    await onKycAuthSuccess(token, user);
  };

  const handleKycLogout = async () => {
    try {
      // Use the enhanced logout function from context with full disconnect
      await contextLogout('full');

      // Update local state to reflect logout
      setKycToken(null);
      setKycUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear local state anyway
      setKycToken(null);
      setKycUser(null);
      localStorage.removeItem('minerva_kyc_token');
      localStorage.removeItem('minerva_kyc_user');
      localStorage.removeItem('minerva_token');
      localStorage.removeItem('minerva_user');
    }
  };

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Initializing...</p>
          <p className="text-sm text-muted-foreground mt-1">Checking authentication state</p>
        </div>
      </div>
    );
  }

  // If user has completed KYC registration/login, show the main app
  if (kycUser && kycToken) {
    return (
      <div className="min-h-screen bg-background">
        {/* KYC Header */}
        <header className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Minerva Estate</h1>
                  <p className="text-xs text-muted-foreground">Welcome, {kycUser.username}</p>
                </div>
              </div>
              <Button
                onClick={handleKycLogout}
                variant="neon"
                className="flex items-center md:gap-2 md:px-4 md:min-w-[80px] max-md:w-10 max-md:h-10 max-md:p-2 max-md:justify-center"
              >
                <LogOut className="w-4 h-4 relative z-10" />
                <span className="relative z-10 hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        {children}
      </div>
    );
  }

  // Show KYC authentication forms
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Minerva Estate</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Forms */}
      <main className="relative flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4">
        {currentView === 'login' ? (
          <KycLogin
            onLoginSuccess={handleKycAuthSuccess}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        ) : (
          <KycRegistration
            onRegisterSuccess={handleKycAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
      </main>
    </div>
  );
}