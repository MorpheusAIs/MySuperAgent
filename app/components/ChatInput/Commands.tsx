import React, { FC, useRef, useEffect } from "react";
import { Box, VStack, Text, useMediaQuery } from "@chakra-ui/react";
import styles from "./Commands.module.css";

export type Command = {
  command: string;
  description: string;
  name: string;
};

type CommandsProps = {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  isSidebarOpen: boolean;
};

export const Commands: FC<CommandsProps> = ({
  commands,
  selectedIndex,
  onSelect,
  isSidebarOpen,
}) => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const commandsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (commandsRef.current) {
      const selectedElement = commandsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  return (
    <Box ref={commandsRef} className={styles.commandsContainer}>
      <VStack spacing={2} align="stretch">
        {commands.map((cmd, index) => (
          <Box
            key={cmd.command}
            data-index={index}
            className={`${styles.commandItem} ${
              index === selectedIndex ? styles.selected : ""
            }`}
            onClick={() => onSelect(cmd)}
            role="button"
            tabIndex={0}
          >
            <Text className={styles.commandText} fontWeight="500">
              /{cmd.command}
            </Text>
            <Text className={styles.description}>
              {cmd.name} - {cmd.description}
            </Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};
