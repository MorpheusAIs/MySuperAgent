import React from "react";
import { Text } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import {
  ChatMessage,
  ImageMessageContent,
  CryptoDataMessageContent,
  AssistantMessage,
} from "@/services/types";
import {
  AgentType,
  BaseAgentActionType,
  isValidAgentType,
} from "@/services/types";

// Agent Message Components
import { Tweet } from "@/components/Agents/Tweet/CustomMessages/TweetMessage";
import CryptoChartMessage from "@/components/Agents/CryptoData/CryptoChartMessage";
import DCAMessage from "@/components/Agents/DCA/DCAMessage";

// Base Agent Components
import BaseTransferMessage from "@/components/Agents/Base/TransferMessage";
import BaseSwapMessage from "@/components/Agents/Base/SwapMessage";

// Swap Components
import OneInchSwapMessage from "@/components/Agents/Swaps/Swap/SwapMessage";

// Token Components
import { CodexTopTokensMessage } from "@/components/Agents/Codex/TopTokens/CodexTopTokensMessage";
import { TopTokensMessage } from "@/components/Agents/Dexscreener/TopTokens/TopTokensMessage";
import { TopTokensMetadata } from "@/components/Agents/Codex/TopTokens/CodexTopTokensMessage.types";
import { CodexTopHoldersMessage } from "@/components/Agents/Codex/TopHolders/CodexTopHoldersMessage";

// Rugcheck Components
import { RugcheckReportMessage } from "@/components/Agents/Rugcheck/Report/RugcheckReportMessage";
import { RugcheckMetadata } from "@/components/Agents/Rugcheck/Report/RugcheckReportMessage.types";
import { VotedTokensMessage } from "@/components/Agents/Rugcheck/MostVoted/MostVotedTokensMessage";
import { ViewedTokensMessage } from "@/components/Agents/Rugcheck/MostViewed/MostViewedTokensMessage";
import { VotedTokensMetadata } from "@/components/Agents/Rugcheck/MostVoted/MostVotedTokensMessage.types";
import { ViewedTokensMetadata } from "@/components/Agents/Rugcheck/MostViewed/MostViewedTokensMessage.types";

// Elfa Components
import { ElfaTopMentionsMessage } from "@/components/Agents/Elfa/TopMentions/TopMentionsMessage";
import { ElfaTrendingTokensMessage } from "@/components/Agents/Elfa/TrendingTokens/TrendingTokensMessage";
import { ElfaAccountSmartStatsMessage } from "@/components/Agents/Elfa/AccountSmartStats/AccountSmartStatsMessage";
import { TopMentionsMetadata } from "@/components/Agents/Elfa/TopMentions/TopMentionsMessage.types";
import { TrendingTokensMetadata } from "@/components/Agents/Elfa/TrendingTokens/TrendingTokensMessage.types";
import { AccountSmartStatsMetadata } from "@/components/Agents/Elfa/AccountSmartStats/AccountSmartStatsMessage.types";
import { TopHoldersMetadata } from "../Agents/Codex/TopHolders/CodexTopHoldersMessage.types";
import { ElfaMentionsMessage } from "../Agents/Elfa/Mentions/MentionsMessage";
import { MentionsMetadata } from "../Agents/Elfa/Mentions/MentionsMessage.types";

// Crew Components
import { CrewResponseMessage } from "@/components/Agents/Crew";

type MessageRenderer = {
  check: (message: ChatMessage) => boolean;
  render: (message: ChatMessage) => React.ReactNode;
};

const messageRenderers: MessageRenderer[] = [
  // Error message renderer
  {
    check: (message) => !!message.error_message,
    render: (message) => <Text color="red.500">{message.error_message}</Text>,
  },

  // Imagen agent renderer
  {
    check: (message) => message.agentName === AgentType.IMAGEN,
    render: (message) => {
      const imageContent = (message as AssistantMessage)
        .content as ImageMessageContent;
      if (!imageContent.success) {
        return (
          <Text color="red.500">
            {imageContent.error || "Failed to generate image"}
          </Text>
        );
      }
      return (
        <ReactMarkdown>{`Successfully generated image with ${imageContent.service}`}</ReactMarkdown>
      );
    },
  },

  // Crypto data agent renderer
  {
    check: (message) => message.agentName === AgentType.CRYPTO_DATA,
    render: (message) => {
      const assistantMessage = message as AssistantMessage;
      return (
        <CryptoChartMessage
          content={assistantMessage.content as CryptoDataMessageContent}
          metadata={assistantMessage.metadata}
        />
      );
    },
  },

  // Base agent renderers
  {
    check: (message) =>
      message.agentName === AgentType.BASE_AGENT &&
      message.action_type === BaseAgentActionType.TRANSFER,
    render: (message) => (
      <BaseTransferMessage
        content={message.content}
        metadata={message.metadata}
      />
    ),
  },
  {
    check: (message) =>
      message.agentName === AgentType.BASE_AGENT &&
      message.action_type === BaseAgentActionType.SWAP,
    render: (message) => (
      <BaseSwapMessage content={message.content} metadata={message.metadata} />
    ),
  },

  // Token swap agent renderer
  {
    check: (message) => message.agentName === AgentType.TOKEN_SWAP,
    render: (message) => (
      <OneInchSwapMessage
        content={message.content}
        metadata={message.metadata || {}}
      />
    ),
  },

  // Dexscreener agent renderer
  {
    check: (message) => message.agentName === AgentType.DEXSCREENER,
    render: (message) => <TopTokensMessage metadata={message.metadata} />,
  },
  // {
  //   check: (message) =>
  //     message.agentName === AgentType.DEXSCREENER &&
  //     message.action_type === "get_latest_boosted_tokens",
  //   render: (message) => <TopTokensMessage metadata={message.metadata} />,
  // },
  // {
  //   check: (message) =>
  //     message.agentName === AgentType.DEXSCREENER &&
  //     message.action_type === "get_top_boosted_tokens",
  //   render: (message) => <TopTokensMessage metadata={message.metadata} />,
  // },

  // Elfa agent renderers
  {
    check: (message) =>
      message.agentName === AgentType.ELFA &&
      message.action_type == "get_top_mentions",
    render: (message) => (
      <ElfaTopMentionsMessage
        metadata={message.metadata as TopMentionsMetadata}
      />
    ),
  },
  {
    check: (message) =>
      message.agentName === AgentType.ELFA &&
      message.action_type == "search_mentions",
    render: (message) => (
      <ElfaMentionsMessage metadata={message.metadata as MentionsMetadata} />
    ),
  },
  {
    check: (message) =>
      message.agentName === AgentType.ELFA &&
      message.action_type == "get_trending_tokens",
    render: (message) => (
      <ElfaTrendingTokensMessage
        metadata={message.metadata as TrendingTokensMetadata}
      />
    ),
  },
  {
    check: (message) =>
      message.agentName === AgentType.ELFA &&
      message.action_type == "get_account_smart_stats",
    render: (message) => (
      <ElfaAccountSmartStatsMessage
        metadata={message.metadata as AccountSmartStatsMetadata}
      />
    ),
  },

  // DCA agent renderer
  {
    check: (message) => message.agentName === AgentType.DCA_AGENT,
    render: (message) => (
      <DCAMessage
        content={message.content}
        metadata={(message as AssistantMessage).metadata}
      />
    ),
  },

  // Rugcheck agent renderer
  {
    check: (message) =>
      message.agentName === AgentType.RUGCHECK &&
      message.action_type === "get_token_report",
    render: (message) => (
      <RugcheckReportMessage
        metadata={(message as AssistantMessage).metadata as RugcheckMetadata}
      />
    ),
  },
  {
    check: (message) =>
      message.agentName === AgentType.RUGCHECK &&
      message.action_type === "get_most_voted",
    render: (message) => (
      <VotedTokensMessage
        metadata={(message as AssistantMessage).metadata as VotedTokensMetadata}
      />
    ),
  },
  {
    check: (message) =>
      message.agentName === AgentType.RUGCHECK &&
      message.action_type === "get_most_viewed",
    render: (message) => (
      <ViewedTokensMessage
        metadata={
          (message as AssistantMessage).metadata as ViewedTokensMetadata
        }
      />
    ),
  },

  // Codex agent renderer
  {
    check: (message) =>
      message.agentName === AgentType.CODEX &&
      message.action_type === "list_top_tokens",
    render: (message) => (
      <CodexTopTokensMessage
        metadata={(message as AssistantMessage).metadata as TopTokensMetadata}
      />
    ),
  },
  {
    check: (message) =>
      message.agentName === AgentType.CODEX &&
      message.action_type === "get_top_holders_percent",
    render: (message) => (
      <CodexTopHoldersMessage
        metadata={(message as AssistantMessage).metadata as TopHoldersMetadata}
      />
    ),
  },

  // Tweet sizzler agent renderer
  {
    check: (message) =>
      typeof message.content === "string" &&
      message.agentName === AgentType.TWEET_SIZZLER,
    render: (message) => <Tweet initialContent={message.content as string} />,
  },

  // Crew renderer
  {
    check: (message) =>
      typeof message.content === "string" &&
      message.agentName === AgentType.BASIC_CREW,
    render: (message) => (
      <CrewResponseMessage
        content={message.content as string}
        metadata={(message as AssistantMessage).metadata}
      />
    ),
  },

  // Search results renderer with clickable links
  {
    check: (message) =>
      typeof message.content === "string" &&
      message.content.includes("Title:") &&
      message.content.includes("URL:"),
    render: (message) => {
      const content = message.content as string;
      return (
        <div className="search-results">
          {content.split("\n").map((line, i) => {
            // Check if this is a URL line
            if (line.startsWith("URL:")) {
              const url = line.substring(5).trim();
              return (
                <div key={i}>
                  URL:{" "}
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </a>
                </div>
              );
            }
            // For other lines, preserve HTML formatting
            return <div key={i} dangerouslySetInnerHTML={{ __html: line }} />;
          })}
        </div>
      );
    },
  },
  // Default string content renderer
  {
    check: (message) => typeof message.content === "string",
    render: (message) => (
      <ReactMarkdown>{message.content as string}</ReactMarkdown>
    ),
  },

  // Fallback renderer for non-string content
  {
    check: () => true,
    render: (message) => {
      // Convert non-string content to string for ReactMarkdown
      const contentString =
        typeof message.content === "object"
          ? JSON.stringify(message.content, null, 2)
          : String(message.content);

      return <ReactMarkdown>{contentString}</ReactMarkdown>;
    },
  },
];

/**
 * Renders a chat message using the appropriate renderer based on the message type and agent.
 *
 * @param message The chat message to render
 * @returns The rendered React node, or null if no renderer is found
 */
export const renderMessage = (message: ChatMessage): React.ReactNode => {
  // Validate agent type if present
  if (message.agentName && !isValidAgentType(message.agentName)) {
    console.warn(`Invalid agent type: ${message.agentName}`);
  }

  const renderer = messageRenderers.find((r) => r.check(message));
  return renderer ? renderer.render(message) : null;
};
