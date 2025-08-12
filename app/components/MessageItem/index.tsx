import React, { FC } from "react";
import { Box, Text } from "@chakra-ui/react";
import { ChatMessage } from "@/services/types";
import { getHumanReadableAgentName } from "@/services/utils";
import { renderMessage } from "./CustomMessageRenderers";
import styles from "./index.module.css";

type MessageItemProps = {
  message: ChatMessage;
};

export const MessageItem: FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <Box
      className={`${styles.messageContainer} ${
        isUser ? styles.userMessage : ""
      }`}
    >
      <div className={styles.messageWrapper}>
        {isUser ? (
          <div className={styles.userBubble}>{renderMessage(message)}</div>
        ) : (
          <div className={styles.assistantContent}>
            <Text className={styles.agentName}>
              {getHumanReadableAgentName(message.agentName)}
            </Text>
            {renderMessage(message)}
          </div>
        )}
      </div>
    </Box>
  );
};
