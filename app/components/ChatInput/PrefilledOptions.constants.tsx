import {
  Sparkles,
  FileText,
  DollarSign,
  Send,
  Search,
  Newspaper,
  Trophy,
  LineChart,
  Flame,
  Globe2,
  ArrowLeftRight,
  BarChart2,
  Shield,
  Gift,
  Database,
} from "lucide-react";
import { AgentType } from "@/services/types";
import { IconSocial } from "@tabler/icons-react";

// Icon color mapping
const ICON_COLORS = {
  [AgentType.IMAGEN]: "#8B5CF6", // Purple
  [AgentType.RAG]: "#8B5CF6", // Purple
  [AgentType.CRYPTO_DATA]: "#3B82F6", // Blue
  [AgentType.TOKEN_SWAP]: "#10B981", // Green
  [AgentType.TWEET_SIZZLER]: "#F59E0B", // Amber
  [AgentType.REALTIME_SEARCH]: "#EC4899", // Pink
  [AgentType.DEXSCREENER]: "#6366F1", // Indigo
  [AgentType.MOR_CLAIMS]: "#14B8A6", // Teal
  [AgentType.MOR_REWARDS]: "#F472B6", // Pink
  [AgentType.CRYPTO_NEWS]: "#2DD4BF", // Teal
  [AgentType.BASE_AGENT]: "#818CF8", // Indigo
  [AgentType.DCA_AGENT]: "#4ADE80", // Green
  [AgentType.RUGCHECK]: "#EF4444", // Red
  [AgentType.DEFAULT]: "#6B7280", // Gray
  [AgentType.ELFA]: "#6366F1", // Indigo
  [AgentType.CODEX]: "#3B82F6", // Blue
};

export const prefilledOptionsMap = {
  [AgentType.DEFAULT]: {
    title: "Default Agent",
    icon: <Globe2 size={20} color={ICON_COLORS[AgentType.DEFAULT]} />,
    examples: [
      { text: "Who is Elon Musk?", agent: "default" },
      { text: "What Morpheus agents are currently active?", agent: "default" },
    ],
  },
  [AgentType.IMAGEN]: {
    title: "Generate Images",
    icon: <Sparkles size={20} color={ICON_COLORS[AgentType.IMAGEN]} />,
    examples: [
      { text: "Generate an image of Donald Trump", agent: "imagen" },
      {
        text: "Create a cyberpunk style portrait of Elon Musk",
        agent: "imagen",
      },
    ],
  },
  [AgentType.RAG]: {
    title: "Document Analysis",
    icon: <FileText size={20} color={ICON_COLORS[AgentType.RAG]} />,
    examples: [
      { text: "Summarize the uploaded document", agent: "rag" },
      {
        text: "What are the key points in this uploaded document?",
        agent: "rag",
      },
    ],
  },
  [AgentType.CRYPTO_DATA]: {
    title: "Crypto Market Data",
    icon: <LineChart size={20} color={ICON_COLORS[AgentType.CRYPTO_DATA]} />,
    examples: [
      { text: "What's the price of ETH?", agent: "crypto_data" },
      { text: "What's the FDV of USDC?", agent: "crypto_data" },
    ],
  },
  [AgentType.TOKEN_SWAP]: {
    title: "Token Swaps",
    icon: (
      <ArrowLeftRight size={20} color={ICON_COLORS[AgentType.TOKEN_SWAP]} />
    ),
    examples: [
      { text: "Swap 0.2 ETH for USDC", agent: "token_swap" },
      { text: "Exchange my BTC for ETH", agent: "token_swap" },
    ],
  },
  [AgentType.TWEET_SIZZLER]: {
    title: "Tweet Generator",
    icon: <Flame size={20} color={ICON_COLORS[AgentType.TWEET_SIZZLER]} />,
    examples: [
      { text: "Create a viral tweet about Web3", agent: "tweet_sizzler" },
      {
        text: "Create a spicy crypto market tweet about Gary Gensler",
        agent: "tweet_sizzler",
      },
    ],
  },
  // [AgentType.DCA_AGENT]: {
  //   title: "DCA Strategy Planning",
  //   icon: <DollarSign size={20} color={ICON_COLORS[AgentType.DCA_AGENT]} />,
  //   examples: [
  //     { text: "DCA into ETH weekly", agent: "dca_agent" },
  //     {
  //       text: "Help me create a weekly BTC buying strategy",
  //       agent: "dca_agent",
  //     },
  //   ],
  // },
  [AgentType.BASE_AGENT]: {
    title: "Base Transactions",
    icon: <Send size={20} color={ICON_COLORS[AgentType.BASE_AGENT]} />,
    examples: [
      { text: "Send USDC on Base", agent: "base_agent" },
      { text: "Swap USDC for ETH on Base", agent: "base_agent" },
    ],
  },
  [AgentType.MOR_CLAIMS]: {
    title: "MOR Claims Manager",
    icon: <Gift size={20} color={ICON_COLORS[AgentType.MOR_CLAIMS]} />,
    examples: [
      { text: "Claim my MOR rewards", agent: "mor_claims" },
      { text: "Help me claim my pending MOR tokens", agent: "mor_claims" },
    ],
  },
  [AgentType.MOR_REWARDS]: {
    title: "MOR Rewards Tracking",
    icon: <Trophy size={20} color={ICON_COLORS[AgentType.MOR_REWARDS]} />,
    examples: [
      { text: "Show my MOR rewards balance", agent: "mor_rewards" },
      { text: "Calculate my pending MOR rewards", agent: "mor_rewards" },
    ],
  },
  // [AgentType.REALTIME_SEARCH]: {
  //   title: "Real-Time Search",
  //   icon: <Search size={20} color={ICON_COLORS[AgentType.REALTIME_SEARCH]} />,
  //   examples: [
  //     {
  //       text: "Search the web for latest news about Ethereum",
  //       agent: "realtime_search",
  //     },
  //     {
  //       text: "What did Donald Trump say about Bitcoin?",
  //       agent: "realtime_search",
  //     },
  //   ],
  // },
  [AgentType.CRYPTO_NEWS]: {
    title: "Crypto News Analysis",
    icon: <Newspaper size={20} color={ICON_COLORS[AgentType.CRYPTO_NEWS]} />,
    examples: [
      {
        text: "Analyze recent crypto market news for ETH",
        agent: "crypto_news",
      },
      { text: "What's the latest news impact on BTC?", agent: "crypto_news" },
    ],
  },
  [AgentType.DEXSCREENER]: {
    title: "DexScreener",
    icon: <BarChart2 size={20} color={ICON_COLORS[AgentType.DEXSCREENER]} />,
    examples: [
      {
        text: "Scan Dexscreener for the most active tokens on solana",
        agent: "dexscreener",
      },
      {
        text: "Show me DEX activity for ETH as reported by Dexscreener",
        agent: "dexscreener",
      },
    ],
  },
  [AgentType.ELFA]: {
    title: "Elfa Social Search",
    icon: <IconSocial size={20} color={ICON_COLORS[AgentType.ELFA]} />,
    examples: [
      {
        text: "Search for mentions of MOR on social media",
        agent: "elfa",
      },
      {
        text: "What are the top trending tokens on social media?",
        agent: "elfa",
      },
    ],
  },
  [AgentType.RUGCHECK]: {
    title: "Solana Token Safety",
    icon: <Shield size={20} color={ICON_COLORS[AgentType.RUGCHECK]} />,
    examples: [
      { text: "Check token safety for SAMO", agent: "rugcheck" },
      { text: "Show me the most viewed tokens on rugcheck", agent: "rugcheck" },
    ],
  },
  [AgentType.CODEX]: {
    title: "Codex Agent",
    icon: <Database size={20} color={ICON_COLORS[AgentType.CODEX]} />,
    examples: [
      {
        text: "What are the top trending tokens on Ethereum?",
        agent: "codex",
      },
      {
        text: "Who are the top holders of $TRUMP on Solana?",
        agent: "codex",
      },
    ],
  },
};

export const OPTION_GROUPS = {
  "Market Data": [AgentType.CRYPTO_DATA, AgentType.DEXSCREENER],
  "Blockchain Data": [AgentType.CODEX, AgentType.RUGCHECK],
  "Content & Social": [AgentType.TWEET_SIZZLER, AgentType.ELFA],
  "Document Analysis": [AgentType.RAG, AgentType.CRYPTO_NEWS],
  "Trading & DeFi": [AgentType.TOKEN_SWAP, AgentType.BASE_AGENT], 
  "Morpheus Tools": [AgentType.MOR_REWARDS, AgentType.MOR_CLAIMS],
};
