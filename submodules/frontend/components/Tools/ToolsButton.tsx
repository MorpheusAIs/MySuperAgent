import React from "react";
import { Button, useDisclosure } from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import { ToolsConfigurationModal } from "./ToolsConfiguration";
import styles from "./ToolsButton.module.css";

interface ToolsButtonProps {
  apiBaseUrl: string;
}

export const ToolsButton: React.FC<ToolsButtonProps> = ({ apiBaseUrl }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button
        leftIcon={<SettingsIcon />}
        size="sm"
        className={styles.actionButton}
        aria-label="Agents"
        onClick={onOpen}
      >
        Agents
      </Button>

      <ToolsConfigurationModal
        isOpen={isOpen}
        onClose={onClose}
        apiBaseUrl={apiBaseUrl}
      />
    </>
  );
};
