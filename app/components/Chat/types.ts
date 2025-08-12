import { ChatMessage } from "@/services/types";

export type ChatProps = {
  onSubmitMessage: (message: string, file: File | null) => Promise<boolean>;
  onCancelSwap: (fromAction: number) => void;
  messages: ChatMessage[];
  onBackendError: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
};

export type SwapTransaction = {
  tx: {
    data: string;
    to: string;
    value: string;
  };
};
