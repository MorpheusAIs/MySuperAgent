import { createContext } from "react";
import { ChatContextType } from "@/contexts/chat/types";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export default ChatContext;
