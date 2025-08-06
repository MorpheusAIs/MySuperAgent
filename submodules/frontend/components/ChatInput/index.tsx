import React, { FC, useState, useEffect, useRef } from "react";
import { Textarea, IconButton, useMediaQuery, Button } from "@chakra-ui/react";
import { AddIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import { SendIcon } from "../CustomIcon/SendIcon";
import { Command } from "./Commands";
import { CommandsPortal } from "./CommandsPortal";
import { ToolsButton } from "@/components/Tools/ToolsButton";
import { ScheduleButton } from "@/components/ScheduleButton";
import { InlineSchedule } from "./InlineSchedule";
import { isFeatureEnabled } from "@/services/featureFlags";
import styles from "./index.module.css";
import BASE_URL from "@/services/constants";

type ChatInputProps = {
  onSubmit: (
    message: string,
    file: File | null,
    useResearch: boolean
  ) => Promise<void>;
  disabled: boolean;
  isSidebarOpen: boolean;
  onToggleHelp: () => void;
  showPrefilledOptions: boolean;
  placeholder?: string;
};

export const ChatInput: FC<ChatInputProps> = ({
  onSubmit,
  disabled,
  isSidebarOpen,
  onToggleHelp,
  showPrefilledOptions,
  placeholder = "Ask anything",
}) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

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
    fetch(`${BASE_URL}/api/agents/commands`)
      .then((res) => res.json())
      .then((data) => setCommands(data.commands || []))
      .catch((error) => {
        console.error("Error fetching commands:", error);
        setCommands([]); // Set empty array on error
      });
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
      setShowSchedule(false);

      // Submit the message with research always enabled
      await onSubmit(messageToSend, fileToSend, true);
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSchedule = () => {
    setShowSchedule(!showSchedule);
  };

  const handleScheduleJobCreated = (jobId: string) => {
    setShowSchedule(false);
    setMessage("");
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
                file ? "Click the arrow to process your file" : placeholder
              }
              minH="36px"
              maxH="240px"
              resize="none"
              overflow="hidden"
              autoComplete="off"
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
            <div className={styles.leftActions}>
              <IconButton
                aria-label="Add"
                icon={<AddIcon />}
                className={styles.actionIcon}
                size="sm"
                onClick={handleFileUpload}
              />
              {isFeatureEnabled('feature.prefilled_options') && (
                <Button
                  leftIcon={<QuestionOutlineIcon />}
                  size="sm"
                  className={`${styles.actionButton} ${
                    showPrefilledOptions ? styles.activeButton : ""
                  }`}
                  onClick={onToggleHelp}
                >
                  Help
                </Button>
              )}
              <ScheduleButton
                message={message}
                disabled={isSubmitting || disabled || !message.trim()}
                isExpanded={showSchedule}
                onToggle={handleToggleSchedule}
              />
            </div>

            {/* Right aligned tools button */}
            {isFeatureEnabled('feature.tools_configuration') && (
              <div className={styles.rightActions}>
                <ToolsButton apiBaseUrl={BASE_URL} />
              </div>
            )}
          </div>

          {/* Inline Schedule Component */}
          {showSchedule && (
            <InlineSchedule
              message={message}
              onJobCreated={handleScheduleJobCreated}
              onClose={() => setShowSchedule(false)}
            />
          )}
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
