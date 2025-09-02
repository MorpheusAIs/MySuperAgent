# Google Authentication Setup

This document explains how to set up Google authentication for MySuperAgent.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API or Google People API
4. Go to "Credentials" and create a new OAuth 2.0 Client ID
5. Add your domain to authorized origins:
   - For development: `http://localhost:3001`
   - For production: `https://yourdomain.com`
6. Add authorized redirect URIs:
   - For development: `http://localhost:3001/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`

## Authentication Flow

The application now supports two authentication methods:

### Free Plan - Google Authentication
- Users can sign in with their Google account
- Limited to 10 messages per day
- Temporary access mode

### Pro Plan - Crypto Wallet Authentication  
- Users connect their crypto wallet (MetaMask, etc.)
- Unlimited messages and premium features
- Full functionality access

## Implementation Details

- The `CombinedAuth` component handles both authentication methods
- Google auth uses NextAuth.js with Google OAuth provider
- Wallet auth uses the existing RainbowKit + custom authentication flow
- Plan detection is based on wallet connection status

## Components

- `CombinedAuth`: Main authentication component with two variants
- `AccountSettings`: Updated to properly detect Pro vs Free plans
- Updated sidebar and header with dual authentication options
