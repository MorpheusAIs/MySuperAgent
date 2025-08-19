import axios from "axios";
import { getAvailableAgents } from "@/services/apiHooks";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default BASE_URL;

export const getHttpClient = () => {
  return axios.create({
    baseURL: BASE_URL,
  });
};

export const initializeBackendClient = () => {
  const backendClient = axios.create({
    baseURL: BASE_URL,
  });

  getAvailableAgents(backendClient).catch((error) => {
    console.error("Failed to initialize available agents:", error);
  });

  return backendClient;
};

export const SWAP_STATUS = {
  CANCELLED: "cancelled",
  SUCCESS: "success",
  FAIL: "failed",
  INIT: "initiated",
};

export const CLAIM_STATUS = {
  SUCCESS: "success",
  FAIL: "failed",
  INIT: "initiated",
};

export const BASE_AVAILABLE_TOKENS = [
  { symbol: "usdc", name: "USD Coin" },
  { symbol: "weth", name: "Wrapped Ethereum" },
  { symbol: "wbtc", name: "Wrapped Bitcoin" },
  { symbol: "cbeth", name: "Coinbase Wrapped Staked ETH" },
  { symbol: "dai", name: "Dai Stablecoin" },
];

export const DCA_AVAILABLE_FREQUENCIES = [
  { value: "minute", label: "Every Minute" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
];