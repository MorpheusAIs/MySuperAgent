import { SendIcon } from '@/components/CustomIcon/SendIcon';
import { ScheduleButton } from '@/components/ScheduleButton';
import BASE_URL from '@/services/config/constants';
import { isFeatureEnabled } from '@/services/featureFlags';
import {
  AttachmentIcon,
  CloseIcon,
  QuestionOutlineIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import { Button, IconButton, Textarea, useMediaQuery } from '@chakra-ui/react';
import React, { FC, useEffect, useRef, useState } from 'react';
import { Command } from './Commands';
import { CommandsPortal } from './CommandsPortal';
import styles from './index.module.css';
import { InlineSchedule, InlineScheduleRef } from './InlineSchedule';

type ChatInputProps = {
  onSubmit: (
    message: string,
    files: File[],
    useResearch: boolean,
    bypassScheduling?: boolean
  ) => Promise<void>;
  disabled: boolean;
  isSidebarOpen: boolean;
  onToggleHelp: () => void;
  showPrefilledOptions: boolean;
  placeholder?: string;
  onJobCreated?: () => void;
  initialMessage?: string | null;
  selectedAgent?: string | null;
  onClearSelectedAgent?: () => void;
};

export const ChatInput: FC<ChatInputProps> = ({
  onSubmit,
  disabled,
  isSidebarOpen,
  onToggleHelp,
  showPrefilledOptions,
  placeholder = 'Ask anything',
  onJobCreated,
  initialMessage = null,
  selectedAgent = null,
  onClearSelectedAgent,
}) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScheduleReady, setIsScheduleReady] = useState(false);
  const [runNonScheduled, setRunNonScheduled] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scheduleRef = useRef<InlineScheduleRef>(null);

  // Set initial message from URL parameter if provided
  useEffect(() => {
    if (initialMessage && !message) {
      setMessage(initialMessage);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      // Reset height to get the correct scrollHeight
      textarea.style.height = '48px';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 320);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Adjust height when message content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Add this useEffect to prevent focus zoom on mobile
  useEffect(() => {
    // Add meta viewport tag to prevent zoom
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content =
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

    // Check if there's already a viewport meta tag
    const existingMeta = document.querySelector('meta[name="viewport"]');

    if (existingMeta) {
      // Update existing meta tag
      existingMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
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
        console.error('Error fetching commands:', error);
        setCommands([]); // Set empty array on error
      });
  }, []);

  // Filter commands based on input
  const filteredCommands = message.startsWith('/')
    ? commands.filter((cmd) =>
        cmd.command.toLowerCase().includes(message.slice(1).toLowerCase())
      )
    : [];

  // Show/hide commands dropdown based on input
  useEffect(() => {
    setShowCommands(message.startsWith('/') && filteredCommands.length > 0);
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
        case 'ArrowDown':
          e.preventDefault();
          setSelectedCommandIndex((prev) =>
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedCommandIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          handleCommandSelect(filteredCommands[selectedCommandIndex]);
          break;
        case 'Escape':
          setShowCommands(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the entire drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async () => {
    if ((!message && attachedFiles.length === 0) || isSubmitting || disabled)
      return;

    try {
      setIsSubmitting(true);

      // If schedule is shown and ready, trigger scheduling instead of normal submission
      if (showSchedule && isScheduleReady && scheduleRef.current) {
        await scheduleRef.current.triggerSchedule();
        return;
      }

      const messageToSend = message;
      const filesToSend = [...attachedFiles];

      // Clear input immediately to improve UX
      setMessage('');
      setAttachedFiles([]);
      setShowSchedule(false);

      // Submit the message with research always enabled
      await onSubmit(messageToSend, filesToSend, true, runNonScheduled);
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSchedule = () => {
    setShowSchedule(!showSchedule);
  };

  const handleScheduleJobCreated = (jobId: string) => {
    setShowSchedule(false);
    setMessage('');
    // Trigger immediate refresh in parent component
    if (onJobCreated) {
      onJobCreated();
      // Also trigger a delayed refresh to catch any API synchronization issues
      setTimeout(() => {
        onJobCreated();
      }, 1000);
    }
  };

  const handleScheduleReadyChange = (ready: boolean) => {
    setIsScheduleReady(ready);
  };

  const handleRunNonScheduled = async () => {
    if ((!message && attachedFiles.length === 0) || isSubmitting || disabled)
      return;

    try {
      setIsSubmitting(true);
      setRunNonScheduled(true);

      const messageToSend = message;
      const filesToSend = [...attachedFiles];

      // Clear input immediately to improve UX
      setMessage('');
      setAttachedFiles([]);
      setShowSchedule(false);

      // Submit the message with research always enabled and bypass scheduling
      await onSubmit(messageToSend, filesToSend, true, true);
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
      setRunNonScheduled(false);
    }
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
        <div
          className={`${styles.inputWrapper} ${
            isDragOver ? styles.dragOver : ''
          }`}
          style={selectedAgent ? { paddingTop: '26px' } : undefined}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {selectedAgent && (
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: '16px',
                background: '#59F886',
                color: '#0f1411',
                fontWeight: 700,
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid #0f1411',
                cursor: 'pointer',
              }}
              onClick={onClearSelectedAgent}
              aria-label="Clear selected agent"
            >
              {selectedAgent}
            </div>
          )}
          {/* Drag overlay */}
          {isDragOver && (
            <div className={styles.dragOverlay}>
              <div className={styles.dragOverlayContent}>
                <AttachmentIcon className={styles.dragOverlayIcon} />
                <span>Drop files here</span>
              </div>
            </div>
          )}

          {/* Text input area */}
          <div className={styles.textareaContainer}>
            <Textarea
              ref={inputRef}
              className={styles.messageInput}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || disabled}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Trigger auto-resize on next tick to ensure textarea has updated
                setTimeout(adjustTextareaHeight, 0);
              }}
              placeholder={
                attachedFiles.length > 0
                  ? `${attachedFiles.length} file${
                      attachedFiles.length > 1 ? 's' : ''
                    } attached - ${placeholder}`
                  : placeholder
              }
              minH="48px"
              maxH="320px"
              resize="none"
              overflow="auto"
              autoComplete="off"
              sx={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            />

            <IconButton
              className={styles.sendButton}
              disabled={
                isSubmitting ||
                disabled ||
                (!message && attachedFiles.length === 0)
              }
              aria-label={showSchedule && isScheduleReady ? 'Schedule' : 'Send'}
              onClick={handleSubmit}
              icon={
                showSchedule && isScheduleReady ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <TimeIcon
                      width={isMobile ? '16px' : '18px'}
                      height={isMobile ? '16px' : '18px'}
                    />
                    <SendIcon
                      width={isMobile ? '16px' : '18px'}
                      height={isMobile ? '16px' : '18px'}
                    />
                  </div>
                ) : (
                  <SendIcon
                    width={isMobile ? '20px' : '24px'}
                    height={isMobile ? '20px' : '24px'}
                  />
                )
              }
            />
          </div>

          {/* Attachment previews */}
          {attachedFiles.length > 0 && (
            <div className={styles.attachmentPreviews}>
              {attachedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={styles.attachmentPreview}
                >
                  <div className={styles.attachmentImageContainer}>
                    {file.type?.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className={styles.attachmentImage}
                        onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                      />
                    ) : (
                      <div className={styles.attachmentPlaceholder}>📄</div>
                    )}
                    <div className={styles.attachmentOverlay}>
                      <span className={styles.attachmentName}>{file.name}</span>
                    </div>
                  </div>
                  <IconButton
                    aria-label="Remove attachment"
                    icon={<CloseIcon />}
                    className={styles.removeAttachment}
                    size="xs"
                    onClick={() => removeFile(index)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Action buttons container */}
          <div className={styles.actionsContainer}>
            <div className={styles.leftActions}>
              <IconButton
                aria-label="Attach"
                icon={<AttachmentIcon />}
                className={styles.actionIcon}
                size="sm"
                onClick={handleFileUpload}
              />
              {isFeatureEnabled('feature.prefilled_options') && (
                <Button
                  leftIcon={<QuestionOutlineIcon />}
                  size="sm"
                  className={`${styles.actionButton} ${
                    showPrefilledOptions ? styles.activeButton : ''
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
              <Button
                size="sm"
                className={`${styles.actionButton} ${
                  runNonScheduled ? styles.activeButton : ''
                }`}
                onClick={handleRunNonScheduled}
                disabled={isSubmitting || disabled || !message.trim()}
                leftIcon={<TimeIcon />}
              >
                Run Non-Scheduled
              </Button>
            </div>
          </div>

          {/* Inline Schedule Component */}
          {showSchedule && (
            <InlineSchedule
              ref={scheduleRef}
              message={message}
              onJobCreated={handleScheduleJobCreated}
              onClose={() => setShowSchedule(false)}
              onScheduleReadyChange={handleScheduleReadyChange}
            />
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className={styles.hiddenInput}
          onChange={(e) => handleFilesSelected(e.target.files)}
          disabled={isSubmitting || disabled}
        />
      </div>
    </>
  );
};
