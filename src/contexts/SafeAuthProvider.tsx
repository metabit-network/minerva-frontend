'use client';

import React from 'react';
import { AuthProvider } from './AuthContext';

interface SafeAuthProviderProps {
  children: React.ReactNode;
}

export function SafeAuthProvider({ children }: SafeAuthProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}