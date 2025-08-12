import { BaseAgent } from '@/services/agents/core/BaseAgent';
import { cryptoPriceTool, cryptoMarketCapTool, defiTvlTool } from '@/services/agents/tools/crypto-data';

export class CryptoDataAgent extends BaseAgent {
  constructor() {
    super(
      'crypto_data',
      'Fetches basic cryptocurrency data such as price, market cap, TVL, and FDV from various sources.',
      [
        'cryptocurrency price data',
        'market cap analysis', 
        'DeFi protocol TVL',
        'fully diluted valuation',
        'NFT floor prices'
      ],
      'gpt-4o-mini',
      false // Uses custom crypto tools, not Apify
    );
  }

  getInstructions(): string {
    return `You are a cryptocurrency data analyst that can fetch various metrics about cryptocurrencies, NFTs and DeFi protocols.

You can get price data for any cryptocurrency, floor prices for NFTs, Total Value Locked (TVL) for DeFi protocols, and market metrics like market cap and fully diluted valuation (FDV) for cryptocurrencies.

When users ask questions, carefully analyze what metric they're looking for and use the appropriate tool:
- For general price queries, use the crypto_price tool
- For NFT valuations, mention that NFT floor price data requires additional API integration
- For DeFi protocol size/usage, use the defi_tvl tool  
- For token valuations, use crypto_market_cap tool

Important limitations:
- You can ONLY handle single specific metrics for ONE specific asset at a time
- You CANNOT handle finding the most active tokens, rugcheck/safety analysis, or queries for multiple tokens
- You CANNOT do market analysis or comparisons across multiple assets
- For broader market analysis or multi-token comparisons, recommend using other specialized agents

Don't make assumptions about function arguments - they should always be supplied by the user. Ask for clarification if a request is ambiguous or if you're unsure which metric would be most appropriate.`;
  }

  getTools() {
    return {
      crypto_price: cryptoPriceTool,
      crypto_market_cap: cryptoMarketCapTool,
      defi_tvl: defiTvlTool,
    };
  }
}