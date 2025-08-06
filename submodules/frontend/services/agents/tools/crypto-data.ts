import { createTool } from '@mastra/core';
import { z } from 'zod';

export const cryptoPriceTool = createTool({
  id: 'crypto_price',
  description: 'Get the current price of a cryptocurrency',
  inputSchema: z.object({
    coin_name: z.string().describe('The name of the cryptocurrency (e.g., bitcoin, ethereum)'),
  }),
  execute: async ({ context: { coin_name } }) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin_name}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data[coin_name]) {
        return `Could not find price data for "${coin_name}". Please check the coin name and try again.`;
      }
      
      const coinData = data[coin_name];
      const price = coinData.usd;
      const marketCap = coinData.usd_market_cap;
      const change24h = coinData.usd_24h_change;
      
      return `${coin_name.toUpperCase()} Price: $${price.toLocaleString()}\nMarket Cap: $${marketCap?.toLocaleString() || 'N/A'}\n24h Change: ${change24h?.toFixed(2) || 'N/A'}%`;
    } catch (error) {
      return `Failed to fetch price for ${coin_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

export const cryptoMarketCapTool = createTool({
  id: 'crypto_market_cap',
  description: 'Get the market cap of a cryptocurrency',
  inputSchema: z.object({
    coin_name: z.string().describe('The name of the cryptocurrency'),
  }),
  execute: async ({ context: { coin_name } }) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin_name}&vs_currencies=usd&include_market_cap=true`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data[coin_name]) {
        return `Could not find market cap data for "${coin_name}". Please check the coin name and try again.`;
      }
      
      const marketCap = data[coin_name].usd_market_cap;
      
      if (!marketCap) {
        return `Market cap data not available for ${coin_name}`;
      }
      
      return `The market cap of ${coin_name.toUpperCase()} is $${marketCap.toLocaleString()}`;
    } catch (error) {
      return `Failed to fetch market cap for ${coin_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

export const defiTvlTool = createTool({
  id: 'defi_tvl',
  description: 'Get the Total Value Locked (TVL) of a DeFi protocol',
  inputSchema: z.object({
    protocol_name: z.string().describe('The name of the DeFi protocol'),
  }),
  execute: async ({ context: { protocol_name } }) => {
    try {
      const response = await fetch(`https://api.llama.fi/protocol/${protocol_name}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.tvl) {
        return `Could not find TVL data for protocol "${protocol_name}". Please check the protocol name and try again.`;
      }
      
      const tvl = data.tvl[data.tvl.length - 1]?.totalLiquidityUSD || data.currentChainTvls?.['Total'] || 0;
      
      return `The TVL of ${protocol_name} is $${tvl.toLocaleString()}`;
    } catch (error) {
      return `Failed to fetch TVL for ${protocol_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});