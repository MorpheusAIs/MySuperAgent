import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  FormControl,
  Input,
  Textarea,
  FormHelperText,
  Text,
  useToast,
  Switch,
  FormErrorMessage,
  Flex,
  Box,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Collapse,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@chakra-ui/icons";
import styles from "./index.module.css";
import { MCPConfigForm } from "./MCPConfigForm";
import { FormErrors } from "./types";

interface ToolInfo {
  name: string;
  description: string;
  properties?: Record<string, any>;
  required?: string[];
}

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: () => void;
  apiBaseUrl: string;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onAgentCreated,
  apiBaseUrl,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [verifiedTools, setVerifiedTools] = useState<ToolInfo[]>([]);
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>(
    {}
  );
  const [formData, setFormData] = useState({
    human_readable_name: "",
    description: "",
    mcp_server_url: "",
    is_enabled: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Reset verification state when URL changes
    if (name === "mcp_server_url") {
      setIsVerified(false);
      setVerificationError(null);
      setVerifiedTools([]);
    }
  };

  const handleSwitchChange = () => {
    setFormData((prev) => ({
      ...prev,
      is_enabled: !prev.is_enabled,
    }));
  };

  const handleConfigToggle = () => {
    setShowUrlInput(!showUrlInput);
    if (showUrlInput) {
      // Reset the URL field when switching to config mode
      setFormData((prev) => ({ ...prev, mcp_server_url: "" }));
      setIsVerified(false);
      setVerificationError(null);
      setVerifiedTools([]);
    }
  };

  const handleUrlUpdate = (url: string) => {
    setFormData((prev) => ({ ...prev, mcp_server_url: url }));
    setIsVerified(false);
    setVerificationError(null);
    setVerifiedTools([]);
  };

  const handleShowUrlInput = () => {
    setShowUrlInput(true);
  };

  const toggleToolExpand = (index: number) => {
    setExpandedTools((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleVerifyUrl = async () => {
    if (
      !formData.mcp_server_url.trim() ||
      !formData.mcp_server_url.startsWith("http")
    ) {
      setErrors((prev) => ({
        ...prev,
        mcp_server_url: "URL must start with http:// or https://",
      }));
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/agents/verify-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.mcp_server_url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerificationError(data.detail || "Failed to verify MCP URL");
        setIsVerified(false);
        setVerifiedTools([]);
      } else {
        setVerifiedTools(data.tools || []);
        setIsVerified(true);
        setVerificationError(null);

        toast({
          title: "URL verified successfully",
          description: `Found ${data.tools.length} tools on the MCP server`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error verifying URL:", error);
      setVerificationError(
        error instanceof Error
          ? error.message
          : "There was an error verifying the URL. Please try again."
      );
      setIsVerified(false);
      setVerifiedTools([]);
    } finally {
      setIsVerifying(false);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate agent name
    if (!formData.human_readable_name.trim()) {
      newErrors.human_readable_name = "Agent name is required";
      isValid = false;
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    // Validate MCP server URL
    if (!formData.mcp_server_url.trim()) {
      newErrors.mcp_server_url = "MCP Server URL is required";
      isValid = false;
    } else if (!formData.mcp_server_url.startsWith("http")) {
      newErrors.mcp_server_url = "URL must start with http:// or https://";
      isValid = false;
    }

    // Validate that URL has been verified
    if (!isVerified) {
      newErrors.mcp_server_url =
        newErrors.mcp_server_url ||
        "URL must be verified before creating the agent";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Call the backend API to create the agent
      const response = await fetch(`${apiBaseUrl}/api/agents/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create agent");
      }

      toast({
        title: "Agent created successfully",
        description: `"${formData.human_readable_name}" has been added to your agents.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });

      onAgentCreated();

      // Reset form
      setFormData({
        human_readable_name: "",
        description: "",
        mcp_server_url: "",
        is_enabled: true,
      });
      setIsVerified(false);
      setVerifiedTools([]);

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Error creating agent",
        description:
          error instanceof Error
            ? error.message
            : "There was an error creating the agent. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.human_readable_name.trim() &&
    formData.description.trim() &&
    formData.mcp_server_url.trim() &&
    isVerified;

  const canVerify =
    formData.mcp_server_url.trim() &&
    formData.mcp_server_url.startsWith("http") &&
    !isVerifying;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay className={styles.overlay} />
      <ModalContent className={styles.modalContent}>
        <ModalHeader className={styles.modalHeader}>
          <Button
            leftIcon={<ChevronLeftIcon boxSize={5} />}
            onClick={onClose}
            className={styles.backButton}
            variant="ghost"
            size="sm"
          >
            Back
          </Button>
          <Text className={styles.headerTitle}>Create New Agent</Text>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Creating..."
            className={styles.createButton}
            size="md"
            isDisabled={!isFormValid}
          >
            Create
          </Button>
        </ModalHeader>

        <ModalBody className={styles.modalBody}>
          <Text className={styles.createAgentDescription}>
            Create a new agent by connecting to an MCP server. The agent&apos;s
            tools must be verified before creation.
          </Text>

          <div className={styles.formContainer}>
            <div className={styles.formRow}>
              <div className={styles.labelColumn}>
                <label className={styles.formLabel}>Agent Name</label>
              </div>
              <div className={styles.inputColumn}>
                <FormControl
                  isRequired
                  isInvalid={!!errors.human_readable_name}
                >
                  <Input
                    name="human_readable_name"
                    value={formData.human_readable_name}
                    onChange={handleChange}
                    placeholder="e.g., WebSearch Agent"
                    className={styles.input}
                    size="md"
                  />
                  {errors.human_readable_name && (
                    <FormErrorMessage>
                      {errors.human_readable_name}
                    </FormErrorMessage>
                  )}
                </FormControl>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.labelColumn}>
                <label className={styles.formLabel}>Description</label>
              </div>
              <div className={styles.inputColumn}>
                <FormControl isRequired isInvalid={!!errors.description}>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what this agent does..."
                    className={styles.textarea}
                    rows={2}
                    size="md"
                  />
                  {errors.description && (
                    <FormErrorMessage>{errors.description}</FormErrorMessage>
                  )}
                </FormControl>
              </div>
            </div>

            <Flex
              className={styles.toggleRow}
              justifyContent="space-between"
              alignItems="center"
            >
              <Flex alignItems="center">
                <Switch
                  id="connection-mode"
                  colorScheme="green"
                  isChecked={showUrlInput}
                  onChange={handleConfigToggle}
                />
                <Text className={styles.formLabel} ml={2}>
                  I already have a remote MCP URL
                </Text>
              </Flex>
            </Flex>

            {showUrlInput ? (
              <>
                <div className={styles.formRow}>
                  <div className={styles.labelColumn}>
                    <label className={styles.formLabel}>MCP Server URL</label>
                  </div>
                  <div className={styles.inputColumn}>
                    <Flex>
                      <FormControl
                        isRequired
                        isInvalid={!!errors.mcp_server_url}
                        flex="1"
                      >
                        <Input
                          name="mcp_server_url"
                          value={formData.mcp_server_url}
                          onChange={handleChange}
                          placeholder="e.g., https://ngrok.com/sse"
                          className={styles.input}
                          size="md"
                        />
                        {errors.mcp_server_url ? (
                          <FormErrorMessage>
                            {errors.mcp_server_url}
                          </FormErrorMessage>
                        ) : (
                          <FormHelperText className={styles.helperText}>
                            Remote URL to connect to (Server-Sent Events
                            endpoint)
                          </FormHelperText>
                        )}
                      </FormControl>
                      <Button
                        ml={3}
                        colorScheme={isVerified ? "green" : "blue"}
                        isDisabled={!canVerify}
                        isLoading={isVerifying}
                        loadingText="Verifying..."
                        onClick={handleVerifyUrl}
                        minWidth="100px"
                      >
                        {isVerified ? "Verified" : "Verify"}
                      </Button>
                    </Flex>
                  </div>
                </div>

                {isVerified && verifiedTools.length > 0 && (
                  <div className={styles.formRow}>
                    <div className={styles.labelColumn}>
                      <label className={styles.formLabel}>
                        Available Tools
                      </label>
                    </div>
                    <div className={styles.inputColumn}>
                      <Box
                        borderWidth="1px"
                        borderRadius="md"
                        p={2}
                        maxHeight="200px"
                        overflowY="auto"
                        className={styles.toolsContainer}
                      >
                        <List spacing={1}>
                          {verifiedTools.map((tool, index) => (
                            <ListItem
                              key={index}
                              display="flex"
                              alignItems="flex-start"
                              className={styles.toolItem}
                            >
                              <ListIcon
                                as={CheckCircleIcon}
                                color="green.500"
                                mt={1}
                              />
                              <Box flex="1">
                                <Text fontWeight="bold">{tool.name}</Text>
                                <Flex
                                  alignItems="center"
                                  className={styles.toolDescription}
                                  cursor="pointer"
                                  onClick={() => toggleToolExpand(index)}
                                >
                                  <Text
                                    fontSize="sm"
                                    color="gray.600"
                                    noOfLines={
                                      expandedTools[index] ? undefined : 1
                                    }
                                    className={
                                      expandedTools[index]
                                        ? styles.expandedDescription
                                        : styles.truncatedDescription
                                    }
                                  >
                                    {tool.description}
                                  </Text>
                                  {tool.description.length > 80 && (
                                    <Box as="span" ml={1} color="gray.500">
                                      {expandedTools[index] ? (
                                        <ChevronUpIcon />
                                      ) : (
                                        <ChevronDownIcon />
                                      )}
                                    </Box>
                                  )}
                                </Flex>

                                {tool.properties &&
                                  Object.keys(tool.properties).length > 0 && (
                                    <Collapse
                                      in={expandedTools[index]}
                                      animateOpacity
                                    >
                                      <Box
                                        mt={1}
                                        fontSize="xs"
                                        color="gray.500"
                                      >
                                        <Text fontWeight="medium">
                                          Parameters:
                                        </Text>
                                        {Object.entries(tool.properties).map(
                                          ([key, prop]) => (
                                            <Text key={key} ml={2}>
                                              {key}
                                              {tool.required?.includes(key) &&
                                                "*"}
                                            </Text>
                                          )
                                        )}
                                      </Box>
                                    </Collapse>
                                  )}
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </div>
                  </div>
                )}

                {verificationError && (
                  <div className={styles.formRow}>
                    <div className={styles.labelColumn}></div>
                    <div className={styles.inputColumn}>
                      <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Connection Error</AlertTitle>
                          <AlertDescription>
                            {verificationError}
                          </AlertDescription>
                        </Box>
                      </Alert>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <MCPConfigForm
                onUrlUpdate={handleUrlUpdate}
                onShowUrlInput={handleShowUrlInput}
              />
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
