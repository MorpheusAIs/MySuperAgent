import React, { FC, useState, useEffect, useRef } from "react";
import { Textarea, IconButton, useMediaQuery, Button } from "@chakra-ui/react";
import { AddIcon, SearchIcon, LinkIcon } from "@chakra-ui/icons";
import { SendIcon } from "../CustomIcon/SendIcon";
import { Command } from "./Commands";
import { CommandsPortal } from "./CommandsPortal";
import { ToolsButton } from "@/components/Tools/ToolsButton";
import styles from "./index.module.css";
import API_BASE_URL from "../../config";

type ChatInputProps = {
  onSubmit: (
    message: string,
    file: File | null,
    useMultiagent: boolean,
    useRealtimeSearch: boolean
  ) => Promise<void>;
  disabled: boolean;
  isSidebarOpen: boolean;
};

export const ChatInput: FC<ChatInputProps> = ({
  onSubmit,
  disabled,
  isSidebarOpen,
}) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useMultiagent, setUseMultiagent] = useState(false);
  const [useRealtimeSearch, setUseRealtimeSearch] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add this useEffect to prevent focus zoom on mobile
  useEffect(() => {
    // Add meta viewport tag to prevent zoom
    const viewportMeta = document.createElement("meta");
    viewportMeta.name = "viewport";
    viewportMeta.content =
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

    // Check if there's already a viewport meta tag
    const existingMeta = document.querySelector('meta[name="viewport"]');

    if (existingMeta) {
      // Update existing meta tag
      existingMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      );
    } else {
      // Add new meta tag
      document.head.appendChild(viewportMeta);
    }

    // Optional cleanup
    return () => {
      if (!existingMeta && viewportMeta.parentNode) {
        document.head.removeChild(viewportMeta);
      }
    };
  }, []);

  // Fetch commands
  useEffect(() => {
    fetch(`${API_BASE_URL}/agents/commands`)
      .then((res) => res.json())
      .then((data) => setCommands(data.commands))
      .catch((error) => console.error("Error fetching commands:", error));
  }, []);

  // Filter commands based on input
  const filteredCommands = message.startsWith("/")
    ? commands.filter((cmd) =>
        cmd.command.toLowerCase().includes(message.slice(1).toLowerCase())
      )
    : [];

  // Show/hide commands dropdown based on input
  useEffect(() => {
    setShowCommands(message.startsWith("/") && filteredCommands.length > 0);
    setSelectedCommandIndex(0);
  }, [message, filteredCommands.length]);

  const handleCommandSelect = (command: Command) => {
    setMessage(`/${command.command} `);
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedCommandIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Tab":
        case "Enter":
          e.preventDefault();
          handleCommandSelect(filteredCommands[selectedCommandIndex]);
          break;
        case "Escape":
          setShowCommands(false);
          break;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if ((!message && !file) || isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      const messageToSend = message;
      const fileToSend = file;

      // Clear input immediately to improve UX
      setMessage("");
      setFile(null);

      // Submit the message with all flags
      await onSubmit(
        messageToSend,
        fileToSend,
        useMultiagent,
        useRealtimeSearch
      );
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMultiagent = () => {
    setUseMultiagent((prev) => !prev);
  };

  const toggleRealtimeSearch = () => {
    setUseRealtimeSearch((prev) => !prev);
  };

  return (
    <>
      {showCommands && (
        <CommandsPortal
          commands={filteredCommands}
          selectedIndex={selectedCommandIndex}
          onSelect={handleCommandSelect}
          isSidebarOpen={isSidebarOpen}
        />
      )}

      <div className={styles.flexContainer}>
        <div className={styles.inputWrapper}>
          {/* Text input area */}
          <div className={styles.textareaContainer}>
            <Textarea
              ref={inputRef}
              className={styles.messageInput}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || disabled || file !== null}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                file ? "Click the arrow to process your file" : "Ask anything"
              }
              rows={1}
              resize="none"
              overflow="hidden"
            />

            <IconButton
              className={styles.sendButton}
              disabled={isSubmitting || disabled || (!message && !file)}
              aria-label="Send"
              onClick={handleSubmit}
              icon={
                <SendIcon
                  width={isMobile ? "20px" : "24px"}
                  height={isMobile ? "20px" : "24px"}
                />
              }
            />
          </div>

          {/* Action buttons container */}
          <div className={styles.actionsContainer}>
            {/* Left aligned buttons */}
            <div className={styles.leftActions}>
              <IconButton
                aria-label="Add"
                icon={<AddIcon />}
                className={styles.actionIcon}
                size="xs"
                onClick={handleFileUpload}
              />
              <Button
                leftIcon={<SearchIcon />}
                size="xs"
                className={`${styles.actionButton} ${
                  useRealtimeSearch ? styles.activeButton : ""
                }`}
                onClick={toggleRealtimeSearch}
              >
                Search
              </Button>
              <Button
                leftIcon={<LinkIcon />}
                size="xs"
                className={`${styles.actionButton} ${
                  useMultiagent ? styles.activeButton : ""
                }`}
                onClick={toggleMultiagent}
              >
                Multi-Agent
              </Button>
            </div>

            {/* Right aligned tools button - replaced with new component */}
            <div className={styles.rightActions}>
              <ToolsButton apiBaseUrl={API_BASE_URL} />
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className={styles.hiddenInput}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isSubmitting || disabled}
        />
      </div>
    </>
  );
};
