import React, { FC, useRef, useEffect, useState } from "react";
import { Box, VStack } from "@chakra-ui/react";
import { ChatMessage } from "@/services/types";
import { MessageItem } from "@/components/MessageItem";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import PrefilledOptions from "@/components/ChatInput/PrefilledOptions";

type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  isSidebarOpen: boolean;
  onSubmit: (message: string, file: File | null) => Promise<void>;
  disabled: boolean;
};

export const MessageList: FC<MessageListProps> = ({
  messages,
  isLoading,
  isSidebarOpen,
  onSubmit,
  disabled,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevMessagesLength = useRef(0);

  // Effect for scrolling to bottom when new messages arrive
  useEffect(() => {
    if (
      messages.length > prevMessagesLength.current &&
      messagesEndRef.current
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Fix for mobile viewport height
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  const handlePrefilledSelect = async (selectedMessage: string) => {
    if (isSubmitting || disabled) return;
    try {
      setIsSubmitting(true);
      await onSubmit(selectedMessage, null);
    } catch (error) {
      console.error("Error submitting prefilled message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      height="calc(var(--vh, 1vh) * 100 - 185px)"
      width="100%"
    >
      <Box
        ref={containerRef}
        flex="1 1 auto"
        overflowY="auto"
        overflowX="hidden"
        position="relative"
        width="100%"
        css={{
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "#000" },
          "&::-webkit-scrollbar-thumb": {
            background: "#333",
            borderRadius: "2px",
          },
        }}
      >
        <VStack spacing={0} width="100%" align="stretch">
          {messages.map((message, index) => (
            <div key={index} style={{ width: "100%" }}>
              <MessageItem message={message} />
            </div>
          ))}
          {isLoading && (
            <Box width="100%" py={2}>
              <LoadingIndicator />
            </Box>
          )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </VStack>
      </Box>
      <Box width="100%" bg="black" mt="auto" position="relative" zIndex={2}>
        <PrefilledOptions
          onSelect={handlePrefilledSelect}
          isSidebarOpen={isSidebarOpen}
        />
      </Box>
    </Box>
  );
};
