# MySuperAgent

A Next.js-based AI agent platform with built-in Web3 capabilities and client-side agent orchestration.

## Configuration

### Environment Variables

Copy the `.env.example` file to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `FLAGS_SECRET`: Secret key for feature flags encryption (32 bytes, base64url encoded)
- Various API keys for external services (see .env.example)

To generate a FLAGS_SECRET:
```bash
node -e "console.log(crypto.randomBytes(32).toString('base64url'))"
```

### Adding a new agent

Add agents to the `services/agents/agents/` directory following the existing patterns.

## Usage

`npm install`

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

This application uses client-side agent orchestration with:
- Built-in agent system in `services/agents/`
- Local SQLite database for persistence
- Web3 integration via RainbowKit and wagmi
- Various external API integrations

## Learn More

This is a [RainbowKit](https://rainbowkit.com) + [wagmi](https://wagmi.sh) + [Next.js](https://nextjs.org/) project bootstrapped with [`create-rainbowkit`](/packages/create-rainbowkit).

To learn more about this stack, take a look at the following resources:

- [RainbowKit Documentation](https://rainbowkit.com) - Learn how to customize your wallet connection flow.
- [wagmi Documentation](https://wagmi.sh) - Learn how to interact with Ethereum.
- [Next.js Documentation](https://nextjs.org/docs) - Learn how to build a Next.js application
