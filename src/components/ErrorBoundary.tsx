'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log error to your error reporting service
    this.logErrorToService(error, errorInfo);

    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
    console.error('Error logged:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-card border border-destructive/20 rounded-xl p-6 text-center space-y-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold text-destructive">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">
                  We encountered an unexpected error. Our team has been notified and is working on a fix.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted/50 rounded-lg p-3 text-left">
                  <h3 className="text-xs font-semibold text-destructive mb-2">Error Details (Development)</h3>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleRetry}
                  variant="neon"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Try Again</span>
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="hologram"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Go Home</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by hook:', error, errorInfo);

    // You could trigger a state update or dispatch an action here
    // to show an error message in your app's UI
    throw error; // Re-throw to be caught by ErrorBoundary
  };
};