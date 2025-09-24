// Standalone types for frontend (copied from backend)
// This ensures frontend works independently without importing from backend

export interface User {
  walletPubkey?: string;
  username: string;
  email: string;
  passwordHash?: string; // Only stored on backend
  kyc: KycStatus;
  profilePicUrl?: string;
  createdAt: string;
  isWalletConnected: boolean;
}

export interface KycUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  kyc: KycStatus;
  profilePicUrl?: string;
  createdAt: string;
  isWalletConnected: boolean;
  walletPubkey?: string;
  emailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: string | null;
  refreshToken?: string;
  refreshTokenExpires?: string;
  lastLoginAt?: string;
  loginAttempts?: number;
  lockedUntil?: string;
}

export interface KycStatus {
  status: 'pending' | 'verified' | 'rejected';
  providerId?: string;
  verifiedAt?: string;
  attestationSignature?: string;
  isVerified: boolean;
}

export interface KycAuditLog {
  id: string;
  walletPubkey: string;
  adminId: string;
  previousStatus: boolean;
  newStatus: boolean;
  reason: string;
  timestamp: string;
  adminWallet?: string;
}

export interface AuthNonce {
  nonce: string;
  walletPubkey: string;
  expiresAt: string;
  timestamp?: string;
}

export interface KycRegistrationRequest {
  username: string;
  email: string;
  password: string;
}

export interface KycLoginRequest {
  email: string;
  password: string;
}

export interface KycAuthResponse {
  token: string;
  user: User;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WalletAuthRequest {
  walletPubkey: string;
  signature: string;
  nonce: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Enhanced Authentication Types
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: 'login' | 'logout' | 'wallet_connect' | 'wallet_disconnect' | 'kyc_update' | 'email_verify' | 'password_reset';
  details: {
    ipAddress?: string;
    userAgent?: string;
    walletAddress?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
}

export interface LogoutRequest {
  type: 'wallet' | 'full';
  refreshToken?: string;
}

export interface SessionInfo {
  isKycAuthenticated: boolean;
  isWalletConnected: boolean;
  isEmailVerified: boolean;
  accessLevel: 'guest' | 'email_verified' | 'kyc_verified' | 'fully_authenticated';
  sessionExpiresAt: string;
  refreshTokenExpiresAt?: string;
}

export interface AuthenticationError {
  code: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_LOCKED' | 'SESSION_EXPIRED' | 'WALLET_SIGNATURE_INVALID' | 'KYC_REQUIRED' | 'RATE_LIMITED';
  message: string;
  details?: Record<string, any>;
  retryAfter?: number;
}