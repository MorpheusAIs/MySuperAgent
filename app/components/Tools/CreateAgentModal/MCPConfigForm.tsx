import React, { useState } from "react";
import {
  FormControl,
  Input,
  IconButton,
  Button,
  FormHelperText,
  FormErrorMessage,
  useToast,
  useClipboard,
  HStack,
  Box,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, CopyIcon, CheckIcon } from "@chakra-ui/icons";
import styles from "./MCPConfigForm.module.css";
import { generateShellScript } from "./scriptGenerator";
import { downloadFile } from "@/services/fileUtils";
import { MCPConfig, FormErrors } from "./types";

interface MCPConfigFormProps {
  onUrlUpdate: (url: string) => void;
  onShowUrlInput: () => void;
}

export const MCPConfigForm: React.FC<MCPConfigFormProps> = ({
  onUrlUpdate,
  onShowUrlInput,
}) => {
  const toast = useToast();
  const [mcpConfig, setMcpConfig] = useState<MCPConfig>({
    command: "npx",
    args: [""],
    env: [{ key: "", value: "" }],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { hasCopied, onCopy, setValue } = useClipboard("");

  const handleCommandChange = (value: string) => {
    setMcpConfig((prev) => ({ ...prev, command: value }));
    if (errors.command) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.command;
        return newErrors;
      });
    }
  };

  const handleArgChange = (index: number, value: string) => {
    const newArgs = [...mcpConfig.args];
    newArgs[index] = value;
    setMcpConfig((prev) => ({ ...prev, args: newArgs }));
  };

  const handleEnvChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newEnv = [...mcpConfig.env];
    newEnv[index] = { ...newEnv[index], [field]: value };
    setMcpConfig((prev) => ({ ...prev, env: newEnv }));
  };

  const addArgField = () => {
    setMcpConfig((prev) => ({
      ...prev,
      args: [...prev.args, ""],
    }));
  };

  const removeArgField = (index: number) => {
    if (mcpConfig.args.length > 1) {
      const newArgs = [...mcpConfig.args];
      newArgs.splice(index, 1);
      setMcpConfig((prev) => ({ ...prev, args: newArgs }));
    }
  };

  const addEnvField = () => {
    setMcpConfig((prev) => ({
      ...prev,
      env: [...prev.env, { key: "", value: "" }],
    }));
  };

  const removeEnvField = (index: number) => {
    if (mcpConfig.env.length > 1) {
      const newEnv = [...mcpConfig.env];
      newEnv.splice(index, 1);
      setMcpConfig((prev) => ({ ...prev, env: newEnv }));
    }
  };

  const handleGenerateScript = () => {
    const script = generateShellScript(mcpConfig);
    setValue(script);
    onCopy();

    toast({
      title: "Script copied to clipboard",
      description: "Now run this script to start your MCP server",
      status: "success",
      duration: 3000,
    });

    // Switch to URL input view by toggling showUrlInput in parent component
    onShowUrlInput();
  };

  const handleDownloadScript = () => {
    const script = generateShellScript(mcpConfig);
    downloadFile(script, "start-mcp-server.sh", "text/plain");

    toast({
      title: "Script downloaded",
      description: "Now run this script to start your MCP server",
      status: "success",
      duration: 3000,
    });

    // Switch to URL input view by toggling showUrlInput in parent component
    onShowUrlInput();
  };

  // Check if the necessary fields are filled to enable buttons
  const isConfigValid =
    mcpConfig.command.trim() && mcpConfig.args.some((arg) => arg.trim() !== "");

  return (
    <div className={styles.configContainer}>
      <div className={styles.formRow}>
        <div className={styles.labelColumn}>
          <label className={styles.formLabel}>Command</label>
        </div>
        <div className={styles.inputColumn}>
          <FormControl isRequired isInvalid={!!errors.command}>
            <Input
              value={mcpConfig.command}
              onChange={(e) => handleCommandChange(e.target.value)}
              placeholder="e.g., npx"
              className={styles.input}
            />
            {errors.command && (
              <FormErrorMessage>{errors.command}</FormErrorMessage>
            )}
          </FormControl>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.labelColumn}>
          <label className={styles.formLabel}>Arguments</label>
        </div>
        <div className={styles.inputColumn}>
          {mcpConfig.args.map((arg, idx) => (
            <div key={`arg-${idx}`} className={styles.argRow}>
              <div className={styles.fieldGroup}>
                <FormControl>
                  <Input
                    value={arg}
                    onChange={(e) => handleArgChange(idx, e.target.value)}
                    placeholder="e.g., -y @chaindead/telegram-mcp"
                    className={styles.input}
                  />
                </FormControl>
              </div>
              <div className={styles.buttonGroup}>
                <IconButton
                  icon={<AddIcon />}
                  onClick={addArgField}
                  aria-label="Add argument"
                  size="sm"
                  colorScheme="green"
                />
                {mcpConfig.args.length > 1 && (
                  <IconButton
                    icon={<DeleteIcon />}
                    onClick={() => removeArgField(idx)}
                    aria-label="Remove argument"
                    size="sm"
                    colorScheme="red"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.labelColumn}>
          <label className={styles.formLabel}>Environment</label>
        </div>
        <div className={styles.inputColumn}>
          {mcpConfig.env.map((env, idx) => (
            <div key={`env-${idx}`} className={styles.envRow}>
              <div className={styles.fieldGroup}>
                <FormControl>
                  <Input
                    value={env.key}
                    onChange={(e) =>
                      handleEnvChange(idx, "key", e.target.value)
                    }
                    placeholder="Name"
                    className={styles.input}
                  />
                </FormControl>
              </div>
              <div className={styles.fieldGroup}>
                <FormControl>
                  <Input
                    value={env.value}
                    onChange={(e) =>
                      handleEnvChange(idx, "value", e.target.value)
                    }
                    placeholder="Value"
                    className={styles.input}
                  />
                </FormControl>
              </div>
              <div className={styles.buttonGroup}>
                <IconButton
                  icon={<AddIcon />}
                  onClick={addEnvField}
                  aria-label="Add environment variable"
                  size="sm"
                  colorScheme="green"
                />
                {mcpConfig.env.length > 1 && (
                  <IconButton
                    icon={<DeleteIcon />}
                    onClick={() => removeEnvField(idx)}
                    aria-label="Remove environment variable"
                    size="sm"
                    colorScheme="red"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.labelColumn} />
        <div className={styles.inputColumn}>
          <HStack spacing={3} className={styles.actionButtons}>
            <Button
              onClick={handleGenerateScript}
              leftIcon={hasCopied ? <CheckIcon /> : <CopyIcon />}
              colorScheme="green"
              isDisabled={!isConfigValid}
              className={styles.actionButton}
            >
              Copy Script
            </Button>
            <Button
              onClick={handleDownloadScript}
              colorScheme="blue"
              isDisabled={!isConfigValid}
              className={styles.actionButton}
            >
              Download Script
            </Button>
          </HStack>
          <FormControl>
            <FormHelperText>
              Note: you will need to make this script executable with chmod +x
              start-mcp-server.sh
            </FormHelperText>
          </FormControl>
        </div>
      </div>
    </div>
  );
};
