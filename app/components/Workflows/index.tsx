import React, { useState, useCallback, useEffect } from "react";
import {
  Flex,
  Text,
  Box,
  VStack,
  HStack,
  IconButton,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
} from "@chakra-ui/react";
import { Trash2 } from "lucide-react";
import { Bot } from "lucide-react";
import styles from "./index.module.css";

interface Workflow {
  id: string;
  name: string;
  description: string;
  action: string;
  params: {
    origin_token: string;
    destination_token: string;
    step_size: string;
    frequency: string;
    price_threshold: number | null;
    pause_on_volatility: boolean;
  };
  interval: number;
  status: string;
  last_run?: string;
  next_run?: string;
}

const tokens = [
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "WETH", name: "Wrapped Ethereum" },
  { symbol: "WBTC", name: "Wrapped Bitcoin" },
  { symbol: "CBETH", name: "Coinbase Wrapped Staked ETH" },
  { symbol: "DAI", name: "Dai Stablecoin" },
];

const frequencies = [
  { value: "minute", label: "Every Minute" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
];

const FREQUENCIES = {
  minute: 60,
  hourly: 3600,
  daily: 86400,
  weekly: 604800,
  biweekly: 1209600,
};

export const Workflows: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const toast = useToast();

  const [config, setConfig] = useState({
    originToken: "USDC",
    destinationToken: "WETH",
    stepSize: "100",
    frequency: "weekly",
    priceThreshold: "",
    pauseOnVolatility: false,
  });

  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch("/api/workflows/list");
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      toast({
        title: "Error fetching workflows",
        status: "error",
        duration: 3000,
      });
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchWorkflows();
    }
  }, [fetchWorkflows, isOpen]);

  const handleCreateWorkflow = async () => {
    if (config.originToken === config.destinationToken) {
      toast({
        title: "Invalid Configuration",
        description: "Origin and destination tokens must be different",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const workflowData = {
        name: `DCA ${config.originToken} to ${config.destinationToken}`,
        description: `Dollar cost average from ${config.originToken} to ${config.destinationToken}`,
        action: "dca_trade",
        params: {
          origin_token: config.originToken.toLowerCase(),
          destination_token: config.destinationToken.toLowerCase(),
          step_size: config.stepSize,
          frequency: config.frequency,
          price_threshold: config.priceThreshold
            ? Number(config.priceThreshold)
            : null,
          pause_on_volatility: config.pauseOnVolatility,
        },
        interval: FREQUENCIES[config.frequency as keyof typeof FREQUENCIES],
      };

      const response = await fetch("/api/workflows/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        toast({
          title: "Workflow created successfully",
          status: "success",
          duration: 3000,
        });
        fetchWorkflows();
        setIsOpen(false);
      } else {
        throw new Error("Failed to create workflow");
      }
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast({
        title: "Failed to create workflow",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Workflow deleted successfully",
          status: "success",
          duration: 3000,
        });
        fetchWorkflows();
      } else {
        throw new Error("Failed to delete workflow");
      }
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast({
        title: "Failed to delete workflow",
        status: "error",
        duration: 3000,
      });
    }
  };

  const WorkflowsList = () => (
    <VStack spacing={4} align="stretch">
      {workflows.length > 0 ? (
        workflows.map((workflow) => (
          <Box
            key={workflow.id}
            p={4}
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="8px"
            bg="rgba(255, 255, 255, 0.02)"
            _hover={{
              bg: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text color="white" fontWeight="500" fontSize="14px">
                  {workflow.name}
                </Text>
                <Text color="rgba(255, 255, 255, 0.6)" fontSize="12px">
                  Status: {workflow.status}
                </Text>
                {workflow.next_run && (
                  <Text color="rgba(255, 255, 255, 0.4)" fontSize="12px">
                    Next run: {new Date(workflow.next_run).toLocaleString()} UTC
                  </Text>
                )}
              </VStack>
              <IconButton
                aria-label="Delete workflow"
                icon={<Trash2 size={16} />}
                onClick={() => handleDeleteWorkflow(workflow.id)}
                variant="ghost"
                size="sm"
                color="white"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.1)",
                }}
              />
            </HStack>
          </Box>
        ))
      ) : (
        <Text
          color="rgba(255, 255, 255, 0.6)"
          textAlign="center"
          fontSize="14px"
        >
          No workflows created yet
        </Text>
      )}
    </VStack>
  );

  const CreateWorkflowForm = () => (
    <VStack spacing={4}>
      <HStack spacing={4} width="100%">
        <FormControl>
          <FormLabel color="white" fontSize="14px" fontWeight="500">
            From (Origin)
          </FormLabel>
          <Select
            value={config.originToken}
            onChange={(e) =>
              setConfig({ ...config, originToken: e.target.value })
            }
            className={styles.select}
          >
            {tokens
              .filter((t) => t.symbol !== config.destinationToken)
              .map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel color="white" fontSize="14px" fontWeight="500">
            To (Destination)
          </FormLabel>
          <Select
            value={config.destinationToken}
            onChange={(e) =>
              setConfig({ ...config, destinationToken: e.target.value })
            }
            className={styles.select}
          >
            {tokens
              .filter((t) => t.symbol !== config.originToken)
              .map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
          </Select>
        </FormControl>
      </HStack>

      <FormControl>
        <FormLabel color="white" fontSize="14px" fontWeight="500">
          Investment Step Size
        </FormLabel>
        <Input
          type="number"
          step="any"
          min="0"
          value={config.stepSize}
          onChange={(e) =>
            setConfig({
              ...config,
              stepSize: e.target.value,
            })
          }
          className={styles.input}
        />
        <Text fontSize="12px" color="rgba(255, 255, 255, 0.6)" mt={1}>
          Amount to invest at each interval
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel color="white" fontSize="14px" fontWeight="500">
          Frequency
        </FormLabel>
        <Select
          value={config.frequency}
          onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
          className={styles.select}
        >
          {frequencies.map((freq) => (
            <option key={freq.value} value={freq.value}>
              {freq.label}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel color="white" fontSize="14px" fontWeight="500">
          Price Threshold (Optional)
        </FormLabel>
        <NumberInput
          value={config.priceThreshold}
          onChange={(_, valueAsNumber) =>
            setConfig({ ...config, priceThreshold: valueAsNumber.toString() })
          }
          className={styles.numberInput}
        >
          <NumberInputField
            placeholder="Only buy below this price"
            className={styles.input}
          />
          <NumberInputStepper>
            <NumberIncrementStepper className={styles.stepperButton} />
            <NumberDecrementStepper className={styles.stepperButton} />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <Checkbox
        isChecked={config.pauseOnVolatility}
        onChange={(e) =>
          setConfig({
            ...config,
            pauseOnVolatility: e.target.checked,
          })
        }
        className={styles.checkbox}
      >
        <Text color="white" fontSize="14px">
          Pause strategy during high volatility
        </Text>
      </Checkbox>

      <Button
        onClick={handleCreateWorkflow}
        width="100%"
        mt={6}
        className={styles.button}
      >
        Create Workflow
      </Button>
    </VStack>
  );

  return (
    <>
      <Flex
        disabled
        as="button"
        align="center"
        gap={3}
        width="100%"
        onClick={() => setIsOpen(true)}
        className={styles.menuButton}
        opacity={0.5}
        pointerEvents="none"
      >
        <Bot size={20} className={styles.icon} />
        <Text fontSize="14px" color="white">
          Workflows
        </Text>
      </Flex>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        motionPreset="none"
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent
          position="fixed"
          left="16px"
          top="70px"
          margin={0}
          width="344px"
          maxHeight="calc(100vh - 86px)"
          bg="#080808"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
        >
          <ModalHeader
            color="white"
            borderBottom="1px solid rgba(255, 255, 255, 0.1)"
            padding="16px"
            fontSize="16px"
            fontWeight="500"
          >
            Workflows
          </ModalHeader>
          <ModalCloseButton
            color="white"
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          />

          <ModalBody padding="16px">
            <Tabs>
              <TabList mb={4} gap={2} borderBottom="none">
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  Active Workflows
                </Tab>
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  Create New
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  <WorkflowsList />
                </TabPanel>
                <TabPanel p={0}>
                  <CreateWorkflowForm />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
