'use client';

import { useState, useEffect } from 'react';
import { useKycAuth } from '@/contexts/KycAuthContext';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface SessionTimeoutWarningProps {
  warningMinutes?: number; // Show warning when this many minutes are left
}

export function SessionTimeoutWarning({ warningMinutes = 5 }: SessionTimeoutWarningProps) {
  const { sessionExpiresAt, refreshToken, logout, isAuthenticated } = useKycAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!sessionExpiresAt || !isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const checkSessionTime = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(sessionExpiresAt).getTime();
      const timeUntilExpiry = expiresAt - now;
      const minutesLeft = Math.floor(timeUntilExpiry / (1000 * 60));

      setTimeLeft(minutesLeft);

      if (timeUntilExpiry <= 0) {
        // Session expired
        setShowWarning(false);
        logout('full');
        return;
      }

      if (minutesLeft <= warningMinutes && timeUntilExpiry > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkSessionTime();

    // Check every 30 seconds
    const interval = setInterval(checkSessionTime, 30000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, isAuthenticated, warningMinutes, logout]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshToken();
      if (success) {
        setShowWarning(false);
      } else {
        // Refresh failed, user will be logged out automatically
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setShowWarning(false);
    await logout('full');
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[10000] max-w-sm">
      <div className="bg-card border border-destructive/50 rounded-xl p-4 shadow-xl glass animate-slide-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-destructive text-sm">Session Expiring Soon</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''}.
                Extend your session or you'll be logged out automatically.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRefreshSession}
                disabled={isRefreshing}
                variant="neon"
                className="flex-1 text-xs h-8"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    <span className="relative z-10">Extending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    <span className="relative z-10">Extend Session</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleLogout}
                variant="hologram"
                className="text-xs h-8 px-3"
              >
                <LogOut className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}