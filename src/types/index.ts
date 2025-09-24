// Import and re-export types from backend
import type {
  User as BackendUser,
  KycUser,
  KycStatus,
  KycAuditLog,
  AuthNonce,
  KycRegistrationRequest,
  KycLoginRequest,
  KycAuthResponse,
  AuthResponse,
  WalletAuthRequest,
  ApiResponse,
  EmailVerificationRequest,
  EmailVerificationConfirm,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SecurityAuditLog,
  LogoutRequest,
  SessionInfo,
  AuthenticationError
} from './backend-types';

// Re-export for use in frontend
export type User = BackendUser;
export type {
  KycUser,
  KycStatus,
  KycAuditLog,
  AuthNonce,
  KycRegistrationRequest,
  KycLoginRequest,
  KycAuthResponse,
  AuthResponse,
  WalletAuthRequest,
  ApiResponse,
  EmailVerificationRequest,
  EmailVerificationConfirm,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SecurityAuditLog,
  LogoutRequest,
  SessionInfo,
  AuthenticationError
};

// Frontend-specific types
export interface WalletContextType {
  wallet: unknown;
  publicKey: unknown;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletPubkey: string, signature: string, nonce: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}