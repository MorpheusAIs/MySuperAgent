import React, { FC, useEffect, useState, useRef } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  VStack,
  HStack,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverTrigger,
  Spinner,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Collapse,
  Button,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconTrash,
  IconPencil,
  IconSettings,
  IconChevronDown,
  IconChevronUp,
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
import { getAvailableModels, getSelectedModel, setSelectedModel, ModelInfo, ModelConfig, getModelConfig, setModelConfig, getDefaultModelConfig } from "@/services/models";
import { getHttpClient } from "@/services/constants";

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
  const [selectedModel, setSelectedModelState] = useState<string>("default");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [modelOptions, setModelOptions] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [modelConfig, setModelConfigState] = useState<ModelConfig>(getDefaultModelConfig());
  const editInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const ToggleIcon = isSidebarOpen ? IconChevronLeft : IconChevronRight;

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

  const fetchModels = async () => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const backendClient = getHttpClient();
      const response = await getAvailableModels(backendClient);
      
      if (response && response.data && response.data.length > 0) {
        setModelOptions(response.data);
        
        // Set initial selected model
        const savedModel = getSelectedModel();
        if (savedModel && response.data.find(m => m.value === savedModel)) {
          setSelectedModelState(savedModel);
        } else if (response.data.length > 0) {
          // Select the first available model if no saved selection
          const firstModel = response.data[0].value;
          setSelectedModelState(firstModel);
          setSelectedModel(firstModel);
        }
      } else {
        // Fallback to default options if API returns empty
        const fallbackOptions = [
          { value: "default", label: "Default MOR Model", id: "default" }
        ];
        setModelOptions(fallbackOptions);
        setSelectedModelState("default");
        setSelectedModel("default");
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setModelsError("Failed to load models");
      
      // Set fallback options on error
      const fallbackOptions = [
        { value: "default", label: "Default MOR Model", id: "default" }
      ];
      setModelOptions(fallbackOptions);
      
      // Use saved model or default
      const savedModel = getSelectedModel();
      setSelectedModelState(savedModel || "default");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelState(modelId);
    setSelectedModel(modelId);
  };

  const handleModelConfigChange = (key: string, value: number) => {
    const newConfig = {
      ...modelConfig,
      [key]: value
    };
    setModelConfigState(newConfig);
    setModelConfig(newConfig);
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshMessages();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [refreshMessages]);

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Load saved model selection and configuration after mount
  useEffect(() => {
    const savedModel = getSelectedModel();
    setSelectedModelState(savedModel);
    
    const savedConfig = getModelConfig();
    setModelConfigState(savedConfig);
  }, []);

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
                  <Text className={styles.modelLabel}>Morpheus Model</Text>
                  {isLoadingModels ? (
                    <Box display="flex" alignItems="center" justifyContent="center" height="32px">
                      <Spinner size="sm" />
                    </Box>
                  ) : (
                    <Select
                      value={selectedModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className={styles.modelSelect}
                      isDisabled={modelOptions.length === 0}
                    >
                      {modelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                  {modelsError && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {modelsError}
                    </Text>
                  )}
                </Box>
                
                {/* Model Configuration */}
                <Box mt={3}>
                  <div className={styles.modelSettingsToggle} onClick={() => setShowModelConfig(!showModelConfig)}>
                    <div className={styles.modelSettingsLeft}>
                      <IconSettings size={14} />
                      <Text className={styles.modelSettingsText}>Chat Request and Model Settings</Text>
                    </div>
                    {showModelConfig ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                  </div>
                  
                  <Collapse in={showModelConfig}>
                    <div className={styles.modelConfigContainer}>
                      <VStack spacing={4} align="stretch">
                        {/* Temperature */}
                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <Tooltip 
                              label="Controls randomness in responses. Lower values (0.1) make output more focused and deterministic, higher values (1.5+) make it more creative and random."
                              fontSize="xs"
                              bg="gray.700"
                              color="white"
                              placement="top"
                            >
                              <Text className={styles.configLabel}>Temperature</Text>
                            </Tooltip>
                            <Text className={styles.configValue}>{modelConfig.temperature}</Text>
                          </HStack>
                          <Slider
                            value={modelConfig.temperature}
                            onChange={(value) => handleModelConfigChange('temperature', value)}
                            min={0}
                            max={2}
                            step={0.1}
                            size="sm"
                            className={styles.darkSlider}
                          >
                            <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                              <SliderFilledTrack bg="#68d391" />
                            </SliderTrack>
                            <SliderThumb bg="#68d391" />
                          </Slider>
                        </Box>
                        
                        {/* Max Tokens */}
                        <Box>
                          <Tooltip 
                            label="Maximum number of tokens (words/parts of words) the model can generate in its response."
                            fontSize="xs"
                            bg="gray.700"
                            color="white"
                            placement="top"
                          >
                            <Text className={styles.configLabel} mb={2}>Max Tokens</Text>
                          </Tooltip>
                          <NumberInput
                            value={modelConfig.max_tokens}
                            onChange={(_, value) => handleModelConfigChange('max_tokens', value || 2048)}
                            min={1}
                            max={8192}
                            size="sm"
                            className={styles.darkNumberInput}
                          >
                            <NumberInputField 
                              bg="rgba(255, 255, 255, 0.05)"
                              border="1px solid rgba(255, 255, 255, 0.1)"
                              color="white"
                              _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                              _focus={{ borderColor: "#68d391", boxShadow: "0 0 0 1px #68d391" }}
                            />
                            <NumberInputStepper>
                              <NumberIncrementStepper color="rgba(255, 255, 255, 0.6)" />
                              <NumberDecrementStepper color="rgba(255, 255, 255, 0.6)" />
                            </NumberInputStepper>
                          </NumberInput>
                        </Box>
                        
                        {/* Top P */}
                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <Tooltip 
                              label="Nucleus sampling. Only considers tokens with cumulative probability up to this value. 1.0 means all tokens are considered."
                              fontSize="xs"
                              bg="gray.700"
                              color="white"
                              placement="top"
                            >
                              <Text className={styles.configLabel}>Top P</Text>
                            </Tooltip>
                            <Text className={styles.configValue}>{modelConfig.top_p}</Text>
                          </HStack>
                          <Slider
                            value={modelConfig.top_p}
                            onChange={(value) => handleModelConfigChange('top_p', value)}
                            min={0}
                            max={1}
                            step={0.1}
                            size="sm"
                          >
                            <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                              <SliderFilledTrack bg="#68d391" />
                            </SliderTrack>
                            <SliderThumb bg="#68d391" />
                          </Slider>
                        </Box>
                        
                        {/* Frequency Penalty */}
                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <Tooltip 
                              label="Reduces likelihood of repeating tokens that appear frequently. Positive values discourage repetition."
                              fontSize="xs"
                              bg="gray.700"
                              color="white"
                              placement="top"
                            >
                              <Text className={styles.configLabel}>Frequency Penalty</Text>
                            </Tooltip>
                            <Text className={styles.configValue}>{modelConfig.frequency_penalty}</Text>
                          </HStack>
                          <Slider
                            value={modelConfig.frequency_penalty}
                            onChange={(value) => handleModelConfigChange('frequency_penalty', value)}
                            min={-2}
                            max={2}
                            step={0.1}
                            size="sm"
                          >
                            <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                              <SliderFilledTrack bg="#68d391" />
                            </SliderTrack>
                            <SliderThumb bg="#68d391" />
                          </Slider>
                        </Box>
                        
                        {/* Presence Penalty */}
                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <Tooltip 
                              label="Encourages the model to talk about new topics. Positive values increase likelihood of introducing new concepts."
                              fontSize="xs"
                              bg="gray.700"
                              color="white"
                              placement="top"
                            >
                              <Text className={styles.configLabel}>Presence Penalty</Text>
                            </Tooltip>
                            <Text className={styles.configValue}>{modelConfig.presence_penalty}</Text>
                          </HStack>
                          <Slider
                            value={modelConfig.presence_penalty}
                            onChange={(value) => handleModelConfigChange('presence_penalty', value)}
                            min={-2}
                            max={2}
                            step={0.1}
                            size="sm"
                          >
                            <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                              <SliderFilledTrack bg="#68d391" />
                            </SliderTrack>
                            <SliderThumb bg="#68d391" />
                          </Slider>
                        </Box>
                      </VStack>
                    </div>
                  </Collapse>
                </Box>
                
                <div className={styles.morpheusInfo}>
                  <Text className={styles.morpheusDescription}>
                    Powered by Morpheus via the Morpheus API Gateway, connecting Web2 clients to the Morpheus-Lumerin AI Marketplace.
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
