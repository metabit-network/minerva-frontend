# Minerva Estate Frontend

Next.js React application for Minerva Estate - Real estate tokenization platform with Phantom wallet integration.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Application runs on **http://localhost:3000**

## 📁 Project Structure

```
minerva-frontend/
├── src/
│   ├── app/             # Next.js 13+ App Router
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── components/      # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── WalletConnect.tsx    # Phantom wallet integration
│   │   ├── KycAuth.tsx          # KYC authentication
│   │   └── ...
│   ├── contexts/        # React contexts
│   │   ├── WalletContext.tsx    # Ethereum wallet provider
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── KycAuthContext.tsx   # KYC authentication
│   ├── lib/             # Utilities and helpers
│   └── types/           # TypeScript definitions
│       ├── index.ts             # Main type exports
│       └── backend-types.ts     # Backend API types
├── public/              # Static assets
└── package.json
```

## 🔧 Environment Setup

Create `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Development Settings
NEXT_PUBLIC_SKIP_KYC=true        # Development only - MUST be false in production
```

## 🛠️ Available Commands

```bash
npm run dev        # Development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Check code style with ESLint
npm run typecheck  # TypeScript validation
npm test           # Run tests (when configured)
```

## 🔗 Wallet Integration

### Phantom Wallet Setup
The app integrates with Phantom wallet for Solana transactions:

1. **Install Phantom** - Browser extension required
2. **Connect Wallet** - Click "Connect Wallet" button
3. **Sign Messages** - Authenticate with wallet signature

### Supported Wallets
- Phantom (primary)
- Solflare
- Other Ethereum Wallet Standard wallets

## 🎨 UI Components

### Key Components
- **WalletConnect** - Phantom wallet connection
- **KycAuth** - KYC authentication forms
- **KycLogin** - Email/password login
- **KycRegistration** - User registration
- **SessionTimeoutWarning** - Session management

### Styling
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **clsx** - Conditional className utility

## 🔐 Authentication System

### Wallet Authentication
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  const handleWalletLogin = async () => {
    // Wallet authentication handled automatically
  };
}
```

### KYC Authentication
```tsx
import { useKycAuth } from '@/contexts/KycAuthContext';

function MyComponent() {
  const { kycUser, login, register, isKycAuthenticated } = useKycAuth();

  const handleKycLogin = async (email: string, password: string) => {
    await login(email, password);
  };
}
```

## 📊 State Management

### Context Providers
- **AuthContext** - Wallet authentication state
- **KycAuthContext** - KYC authentication state
- **WalletContext** - Ethereum wallet connection

### Usage
```tsx
// Wrap your app with providers
<SafeAuthProvider>
  <WalletProvider>
    <AuthProvider>
      <KycAuthProvider>
        <App />
      </KycAuthProvider>
    </AuthProvider>
  </WalletProvider>
</SafeAuthProvider>
```

## 🌐 API Integration

### API Client
```tsx
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Authenticated requests
const response = await api.post('/auth/verify', data, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Type Safety
All API responses are typed using interfaces from `backend-types.ts`:

```tsx
import type { User, ApiResponse } from '@/types';

const user: User = response.data.user;
const apiResponse: ApiResponse<User> = response.data;
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SKIP_KYC=false        # CRITICAL: Must be false in production
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Deploy to Netlify
```bash
# Build command: npm run build
# Publish directory: .next
```

## 🎯 Key Features

### 🔐 Multi-Auth System
- **Phantom Wallet** - Ethereum wallet signatures
- **KYC System** - Email/password with verification
- **Session Management** - Automatic token refresh

### 🎨 Modern UI/UX
- **Responsive Design** - Mobile-first approach
- **Dark/Light Theme** - User preference support
- **Loading States** - Smooth user experience
- **Error Handling** - Graceful error messages

### ⚡ Performance
- **Next.js 13+** - App Router with RSC
- **TypeScript** - Full type safety
- **Tree Shaking** - Optimized bundle size
- **Image Optimization** - Next.js Image component

## 🔧 Development Workflow

### Adding New Pages
```tsx
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

### Creating Components
```tsx
// src/components/MyComponent.tsx
import type { User } from '@/types';

interface Props {
  user: User;
}

export function MyComponent({ user }: Props) {
  return <div>Hello {user.username}</div>;
}
```

### Using Hooks
```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';

function WalletButton() {
  const { connected, connect, disconnect } = useWallet();
  const { isAuthenticated } = useAuth();

  return (
    <button onClick={connected ? disconnect : connect}>
      {connected ? 'Disconnect' : 'Connect'} Wallet
    </button>
  );
}
```

## 🔗 Related Repositories

- **Backend**: [minerva-estate-backend](https://github.com/metabit-network/minerva-backend)
- **Contracts**: [minerva-estate-contracts](link-when-created)

## 🐛 Troubleshooting

### Common Issues

**Wallet Connection Failed**
- Ensure Phantom wallet is installed
- Check if wallet is connected to correct network (devnet/mainnet)
- Try refreshing the page

**API Connection Error**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check if backend server is running
- Inspect network requests in browser dev tools

**Build Errors**
- Run `npm run typecheck` to identify TypeScript issues
- Check if all environment variables are set
- Clear `.next` folder and rebuild

### Development Tools
```bash
# Type checking
npm run typecheck

# Linting
npm run lint -- --fix

# Bundle analysis
npm run build && npx @next/bundle-analyzer .next/static/chunks/pages/
```

## 📞 Support

For development support, check the main project documentation or create an issue in the repository.
