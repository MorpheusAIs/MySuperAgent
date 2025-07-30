import React, { FC, useEffect, useState, useRef } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  VStack,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverTrigger,
} from "@chakra-ui/react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { ProfileMenu } from "./ProfileMenu";
import styles from "./index.module.css";

import { useChatContext } from "@/contexts/chat/useChatContext";
import {
  getAllConversations,
  createNewConversation,
  clearMessagesHistory,
  updateConversationTitle,
} from "@/contexts/chat";
import { Conversation } from "@/services/types";

export type LeftSidebarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: (open: boolean) => void;
};

export const LeftSidebar: FC<LeftSidebarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const {
    state,
    setCurrentConversation,
    deleteChat,
    refreshMessages,
    refreshAllTitles,
  } = useChatContext();
  const { currentConversationId, conversationTitles } = state;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3.2:3b");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const ToggleIcon = isSidebarOpen ? IconChevronLeft : IconChevronRight;

  const modelOptions = [{ value: "llama3.3:70b", label: "Llama 3.3 (70B)" }];

  const fetchConversations = () => {
    try {
      const conversationsData = getAllConversations();
      const updatedConversations = conversationsData.map((conv) => ({
        ...conv,
        name: conversationTitles[conv.id] || conv.name,
      }));
      setConversations(updatedConversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const handleCreateNewConversation = async () => {
    setIsLoading(true);
    try {
      const newConversationId = createNewConversation();
      fetchConversations();
      setCurrentConversation(newConversationId);
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteChat(conversationId);
      fetchConversations();
      if (conversationId === currentConversationId) {
        setCurrentConversation("default");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleClearChatHistory = async () => {
    try {
      clearMessagesHistory(currentConversationId);
      router.reload();
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }
  };

  const handleStartEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditValue(conversation.name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingId || !editValue.trim()) return;

    try {
      await updateConversationTitle(editingId, editValue.trim());
      await refreshAllTitles();
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
    setEditingId(null);
  };

  useEffect(() => {
    fetchConversations();
  }, [conversationTitles, currentConversationId]);

  // Disabled auto-refresh polling - was causing excessive API calls
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     refreshMessages();
  //   }, 2000);

  //   return () => clearInterval(intervalId);
  // }, [refreshMessages]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv?.name
        ?.toLowerCase?.()
        ?.includes(searchQuery?.toLowerCase?.() ?? "") ?? false
  );

  return (
    <div
      className={`${styles.sidebarContainer} ${
        !isSidebarOpen ? styles.collapsed : ""
      }`}
    >
      <div className={styles.sidebar}>
        <div className={styles.container}>
          <div className={styles.searchContainer}>
            <InputGroup>
              <InputLeftElement>
                <IconSearch className={styles.searchIcon} size={16} />
              </InputLeftElement>
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </InputGroup>
            <button
              className={styles.newChatIcon}
              onClick={handleCreateNewConversation}
              disabled={isLoading}
            >
              <IconPlus size={16} />
            </button>
          </div>

          <div className={styles.mainContent}>
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  currentConversationId === conversation.id
                    ? styles.conversationActive
                    : ""
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
              >
                {editingId === conversation.id ? (
                  <form
                    onSubmit={handleSaveEdit}
                    style={{ flex: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={editInputRef}
                      className={styles.titleInput}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                    />
                  </form>
                ) : (
                  <span className={styles.conversationName}>
                    {conversation.name}
                  </span>
                )}

                <div className={styles.buttonGroup}>
                  {conversation.id !== "default" && (
                    <button
                      className={styles.editButton}
                      onClick={(e) => handleStartEdit(conversation, e)}
                    >
                      <IconPencil size={16} />
                    </button>
                  )}
                  {conversation.id === "default" ? (
                    <button
                      className={styles.resetButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearChatHistory();
                      }}
                    >
                      <IconRefresh size={16} />
                    </button>
                  ) : (
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <VStack spacing={4} align="stretch" width="100%">
              <Box width="100%">
                <Box className={styles.modelSelection}>
                  <Text className={styles.modelLabel}>Model:</Text>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={styles.modelSelect}
                  >
                    {modelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>
                <div className={styles.comingSoonContainer}>
                  <Text className={styles.costInfo}>Coming soon</Text>
                  <Text className={styles.modelNote}>
                    Stake your Morpheus tokens to access even more powerful
                    models, create your own agents, and leverage builder keys to
                    automatically enable advanced agents.
                  </Text>
                </div>
              </Box>
            </VStack>

            <ProfileMenu />
          </div>
        </div>
      </div>

      <button
        className={styles.toggleButton}
        onClick={() => onToggleSidebar(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <ToggleIcon size={20} />
      </button>
    </div>
  );
};
