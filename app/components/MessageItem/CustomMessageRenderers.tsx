import React from "react";
import { Text, Box } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/services/types";

// Crew Components - For orchestration responses
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

  // ORCHESTRATION/ASSISTANT RENDERER
  // All assistant responses now go through the orchestration API
  // and should use CrewResponseMessage to show the rich metadata
  {
    check: (message) => 
      message.role === "assistant" &&
      typeof message.content === "string",
    render: (message) => {
      const content = message.content as string;
      const metadata = message.metadata || {};
      
      // Always use CrewResponseMessage for assistant responses
      // This will show agent selection, reasoning, available agents, etc.
      return (
        <CrewResponseMessage
          content={content}
          metadata={metadata}
        />
      );
    },
  },

  // User message renderer (just markdown)
  {
    check: (message) => 
      message.role === "user" && 
      typeof message.content === "string",
    render: (message) => (
      <ReactMarkdown>{message.content as string}</ReactMarkdown>
    ),
  },

  // Fallback renderer for any other content
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
 * Renders a chat message using the appropriate renderer based on the message type.
 *
 * @param message The chat message to render
 * @returns The rendered React node, or null if no renderer is found
 */
export const renderMessage = (message: ChatMessage): React.ReactNode => {
  for (const renderer of messageRenderers) {
    if (renderer.check(message)) {
      return renderer.render(message);
    }
  }
  return null;
};