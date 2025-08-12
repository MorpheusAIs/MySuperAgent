/**
 * Shared utility functions for token display and interaction
 */

/**
 * Truncate an address for display
 */
export const truncateAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

/**
 * Copy text to clipboard with error handling
 */
export const handleCopy = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

/**
 * Format numbers with appropriate suffixes (K, M, B)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format currency values with proper decimal places
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format market cap values
 */
export const formatMarketCap = (value: number): string => {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

/**
 * Common interface for token data
 */
export interface TokenData {
  name: string;
  symbol: string;
  address?: string;
  price?: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
}

/**
 * Common interface for token display props
 */
export interface TokenDisplayProps {
  tokens: TokenData[];
  initialDisplayCount?: number;
  showPriceChange?: boolean;
  showMarketCap?: boolean;
  showVolume?: boolean;
}