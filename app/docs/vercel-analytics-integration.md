# Vercel Analytics Integration

This document describes the implementation of Vercel Analytics custom events and feature flags in the frontend application.

## Overview

We've integrated comprehensive analytics tracking and feature flag management to provide insights into user behavior and enable controlled feature rollouts.

## Custom Events

### Analytics Service

Created `/services/analytics.ts` that provides:
- Event tracking with `trackEvent()` function
- Error tracking with `trackError()` function
- Timing tracking with `trackTiming()` function
- Session management with automatic session ID generation

### Event Categories

#### Authentication Events
- `auth.wallet_connected` - When wallet connects
- `auth.signature_requested` - When auth signature is requested
- `auth.authenticated` - Successful authentication
- `auth.logout` - User logout

#### Agent Interaction Events
- `agent.selected` - When user selects/deselects agents
- `agent.message_sent` - When user sends message to agent
- `agent.response_received` - When agent responds
- `agent.tool_used` - When agent uses specific tools
- `agent.error` - When agent encounters error

#### Wallet Operation Events
- `wallet.created` - CDP wallet creation
- `wallet.restored` - Wallet restoration
- `wallet.deleted` - Wallet deletion
- `wallet.copied_address` - Address copied
- `wallet.set_active` - Active wallet changed

#### Transaction Events
- `swap.initiated` - Swap transaction started
- `swap.approved` - Token approval transaction
- `swap.completed` - Successful swap
- `swap.failed` - Failed transaction
- `swap.cancelled` - User cancelled

#### UI Interaction Events
- `sidebar.toggled` - Sidebar open/close
- `settings.opened` - Settings modal opened
- `tools.configuration_opened` - Tools config opened
- `workflow.selected` - Workflow selected

#### Research Mode Events
- `research.initiated` - Research mode started
- `research.streaming_started` - Streaming begins
- `research.agent_progress` - Agent progress updates
- `research.completed` - Research finished

### Implementation Locations

- Authentication: `/contexts/auth/AuthProvider.tsx`
- Chat/Messages: `/services/ChatManagement/api.ts`
- Wallet Operations: `/components/CDPWallets/useWallets.tsx`
- Swap Transactions: `/components/Agents/Swaps/hooks.ts`
- UI Interactions: `/components/Chat/index.tsx`

## Feature Flags

### Feature Flag Service

Created `/services/featureFlags.ts` that provides:
- Flag management with `getFeatureFlag()` function
- Boolean checks with `isFeatureEnabled()` function
- Numeric flag support with `getNumericFlag()` function
- Override support from Vercel Toolbar

### Upgraded to Flags SDK v4

- Migrated from `@vercel/flags` to `flags` package v4
- Added `x-flags-sdk-version` header to API endpoint
- Created server-side utilities for encryption/decryption
- Added React components for secure flag value emission
- Created custom hook for client-side flag management

### Flag Categories

#### Agent Availability Flags
- `feature.agent.{agent_name}` - Enable/disable specific agents
- `feature.agent.max_selection` - Control max agent selection limit

#### UI Feature Flags
- `feature.research_mode` - Enable/disable research mode
- `feature.prefilled_options` - Show/hide prefilled chat options
- `feature.workflows` - Enable/disable workflows
- `feature.cdp_wallets` - Enable/disable CDP wallet functionality
- `feature.tools_configuration` - Enable/disable tools config

#### Transaction Feature Flags
- `feature.swap.enabled` - Enable/disable swap functionality
- `feature.swap.slippage_control` - Advanced slippage controls
- `feature.swap.gas_optimization` - Gas optimization features

#### Security/Auth Flags
- `feature.auth.wallet_signature` - Enable wallet auth
- `feature.auth.session_persistence` - Session persistence
- `feature.auth.multi_wallet` - Multiple wallet support

#### Integration Flags
- `feature.integration.{service_name}` - Enable specific integrations
- `feature.mcp_agents` - Enable MCP agent creation

### Implementation Locations

- Agent Selection: `/components/Settings/AgentSelection.tsx`
- Chat Input: `/components/ChatInput/index.tsx`
- CDP Wallets: `/components/HeaderBar/CDPWallets.tsx`

## Configuration

### Environment Variables

Created `.env.example` with:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `FLAGS_SECRET` - Secret key for feature flags (32 bytes, base64url encoded)

### API Endpoint

Created `/pages/api/.well-known/vercel/flags/index.ts` that:
- Serves feature flag definitions to Vercel Toolbar
- Verifies requests using FLAGS_SECRET
- Supports encrypted overrides

## Usage

### Tracking Events

```typescript
import { trackEvent } from '@/services/analytics';

// Track simple event
trackEvent('user.action');

// Track event with properties
trackEvent('agent.selected', {
  agentName: 'token_swap',
  action: 'selected',
  totalSelected: 3,
});
```

### Using Feature Flags

```typescript
import { isFeatureEnabled } from '@/services/featureFlags';

// Check if feature is enabled
if (isFeatureEnabled('feature.research_mode')) {
  // Show research mode UI
}

// Get numeric flag value
const maxAgents = getNumericFlag('feature.agent.max_selection', 6);

// Use React hook for client-side flags
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { flags, isFeatureEnabled } = useFeatureFlags();
  
  if (isFeatureEnabled('feature.experimental')) {
    // Show experimental feature
  }
}

// Emit encrypted flag values (v4)
import { EmitFlagValues } from '@/components/FeatureFlags/FlagValues';

function Page() {
  const values = { showBanner: true };
  return (
    <div>
      <EmitFlagValues values={values} />
      {/* Other content */}
    </div>
  );
}
```

## Monitoring

The integrated analytics will show up in your Vercel Analytics dashboard, providing insights into:
- User engagement patterns
- Feature adoption rates
- Error rates and patterns
- Performance metrics
- User flow analysis

## Benefits

1. **Data-Driven Decisions**: Understand how users interact with the application
2. **Controlled Rollouts**: Gradually enable features using feature flags
3. **Error Monitoring**: Track and respond to errors quickly
4. **Performance Insights**: Understand operation timing and bottlenecks
5. **A/B Testing**: Test different features with different user groups