import { AgentType } from "@/services/types";

export const getHumanReadableAgentName = (agentName?: string): string => {
  const agentNameMap: Record<AgentType | string, string> = {
    [AgentType.DEFAULT]: "MySuperAgent",
    [AgentType.IMAGEN]: "Image Generator Agent",
    [AgentType.CRYPTO_DATA]: "Crypto Data Agent",
    [AgentType.BASIC_CREW]: "MySuperAgent Research",
    [AgentType.TOKEN_SWAP]: "Metamask Swaps Agent",
    [AgentType.TWEET_SIZZLER]: "X Posts Generator Agent",
    [AgentType.DCA_AGENT]: "DCA Strategy Planning Agent",
    [AgentType.BASE_AGENT]: "Base Transactions Agent",
    [AgentType.DEXSCREENER]: "DEX Screening Agent",
    [AgentType.ELFA]: "Elfa Social Search Agent",
    [AgentType.RAG]: "Document Analysis Agent",
    [AgentType.MOR_CLAIMS]: "MOR Claims Agent",
    [AgentType.MOR_REWARDS]: "MOR Rewards Tracking Agent",
    [AgentType.REALTIME_SEARCH]: "Real-Time Search Agent",
    [AgentType.CRYPTO_NEWS]: "Crypto News Analysis Agent",
    [AgentType.RUGCHECK]: "Rugcheck Agent",
    [AgentType.NEWS_AGENT]: "Current News Agent",
    [AgentType.CODEX]: "Codex Agent",
  };

  if (!agentName) {
    return "MySuperAgent";
  }

  return agentNameMap[agentName] || agentName;
};
