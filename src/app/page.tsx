'use client';

import { KycAuth } from '@/components/KycAuth';
import { WalletConnect } from '@/components/WalletConnect';
import { SessionTimeoutWarning } from '@/components/SessionTimeoutWarning';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useKycAuth } from '@/contexts/KycAuthContext';
import { Button } from '@/components/ui/Button';
import {
  Home,
  Building,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  BarChart3,
  Wallet,
  Users,
  DollarSign,
  ArrowRight,
  Star
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { kycUser, user, isAuthenticated, checkKycStatus, setKycAuth } = useKycAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;

      // Show scroll-to-top button when user scrolls down more than 300px
      // and the page is actually scrollable
      const isPageScrollable = document.documentElement.scrollHeight > window.innerHeight;
      setShowScrollTop(scrollPosition > 300 && isPageScrollable);
    };

    window.addEventListener('scroll', handleScroll);

    // Initial check for page scrollability
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleKycAuthSuccess = async (token: string, user: any) => {
    await setKycAuth(token, user);
  };

  return (
    <ErrorBoundary>
      <KycAuth onKycAuthSuccess={handleKycAuthSuccess}>
        <SessionTimeoutWarning />
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Wallet Connection Section for KYC authenticated users */}
        {!isAuthenticated ? (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-cyan-400 to-accent bg-clip-text animate-gradient-flow relative inline-block">
                  <span className="relative z-10 animate-text-glow">
                    Connect Your Wallet
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-cyan-400/20 to-accent/20 blur-lg animate-pulse-subtle -z-10"></span>
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Welcome, {kycUser?.username}! Complete your setup by connecting your Solana wallet
                to access the Minerva Estate platform and start investing in tokenized real estate.
              </p>
            </div>

            <div className="flex justify-center">
              <WalletConnect />
            </div>

            {/* KYC Status */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-xl p-6 glass">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">KYC Registration Complete</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your account has been verified and is ready for wallet connection.
                      Connect your Solana wallet to complete the setup and start accessing real estate investments.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <strong>Account:</strong> {kycUser?.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Welcome Section */}
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold">
                Portfolio Dashboard
              </h2>
              <p className="text-lg text-muted-foreground">
                Welcome back, <span className="text-foreground font-medium">{user?.username || 'Investor'}</span>.
                Your investment account is active and ready for transactions.
              </p>
            </div>

            {/* Account Overview */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-xl p-6 glass">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Account Overview</h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</div>
                    <div className="text-sm font-mono text-foreground break-all">
                      {user?.walletPubkey?.slice(0, 8)}...{user?.walletPubkey?.slice(-6)}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Verification Status</div>
                    <div className="flex items-center gap-2">
                      {checkKycStatus() ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-sm font-medium text-success">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">Pending Verification</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Network</div>
                    <div className="text-sm font-medium text-accent">Solana Testnet</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Account Created</div>
                    <div className="text-sm text-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Tools */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 glass hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Property Investments</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover Minerva Estate opportunities with detailed analytics,
                  financial projections, and verified property documentation.
                </p>
                <Button variant="neon" className="w-full font-mono text-xs">
                  <span className="relative z-10">EXPLORE PROPERTIES</span>
                  <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
                </Button>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 glass hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Portfolio Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor your real estate investments with comprehensive analytics,
                  performance tracking, and automated dividend distributions.
                </p>
                <Button variant="neon" className="w-full font-mono text-xs">
                  <span className="relative z-10">MANAGE PORTFOLIO</span>
                  <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
                </Button>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 glass hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Trading Platform</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Access our secure secondary market for property token trading with
                  transparent pricing, liquidity pools, and institutional settlement.
                </p>
                <Button variant="neon" className="w-full font-mono text-xs">
                  <span className="relative z-10">ACCESS TRADING</span>
                  <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Platform Capabilities */}
        <div className="mt-24 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Enterprise-Grade Infrastructure
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our platform combines institutional-quality real estate investments with cutting-edge blockchain technology,
              providing unprecedented access to commercial property markets through secure tokenization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Building,
                title: 'Institutional Assets',
                description: 'Access premium commercial real estate through fractional NFT ownership, backed by verified property documentation, legal structures, and professional asset management.'
              },
              {
                icon: TrendingUp,
                title: 'Liquidity Solutions',
                description: 'Trade property tokens with Minerva Estate settlement infrastructure, transparent pricing mechanisms, and deep liquidity pools for immediate execution.'
              },
              {
                icon: Shield,
                title: 'Regulatory Compliance',
                description: 'Full regulatory compliance with securities laws, comprehensive KYC/AML procedures, and Minerva Estate custody solutions for investor protection.'
              },
              {
                icon: Wallet,
                title: 'Secure Infrastructure',
                description: 'Enterprise-grade wallet integration with multi-signature security, hardware wallet support, and institutional custody partnerships for maximum security.'
              },
              {
                icon: Users,
                title: 'Investor Network',
                description: 'Connect with qualified institutional and accredited investors through our verified network with comprehensive due diligence and investor relations.'
              },
              {
                icon: Star,
                title: 'Curated Opportunities',
                description: 'Exclusive access to institutional-quality real estate investments across prime markets, vetted by our investment committee and third-party experts.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 glass hover:border-primary/50 transition-all duration-300 group">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:border-cyan-400 transition-all duration-300 glass cyber-glow group"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
          </button>
        )}
        </main>
        </div>
      </KycAuth>
    </ErrorBoundary>
  );
}