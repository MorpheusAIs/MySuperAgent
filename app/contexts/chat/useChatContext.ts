import { useContext } from "react";
import ChatContext from "./ChatContext";

/**
 * Custom hook to use the chat context
 */
export const useChatContext = () => {
  const context = useContext(ChatContext);

  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }

  return context;
};
