import React, { useState } from "react";
import {
  VStack,
  Box,
  Text,
  Select,
  Input,
  Button,
  FormControl,
  FormLabel,
  Checkbox,
  Divider,
  HStack,
  useToast,
  Collapse,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { Settings2 } from "lucide-react";
import {
  BASE_AVAILABLE_TOKENS,
  DCA_AVAILABLE_FREQUENCIES,
} from "@/services/config/constants";

interface DCAConfig {
  originToken: string;
  destinationToken: string;
  stepSize: string;
  totalInvestmentAmount?: string;
  frequency: string;
  maxPurchaseAmount?: string;
  priceThreshold?: string;
  pauseOnVolatility: boolean;
}

const DCAMessage = ({ content, metadata }: { content: any; metadata: any }) => {
  const toast = useToast();
  const { isOpen, onToggle } = useDisclosure();
  const [showForm, setShowForm] = useState(false);

  const [config, setConfig] = useState<DCAConfig>({
    originToken: "usdc",
    destinationToken: "weth",
    stepSize: "100",
    frequency: "weekly",
    pauseOnVolatility: false,
  });

  const handleSave = async () => {
    // Validation checks
    if (config.originToken === config.destinationToken) {
      toast({
        title: "Invalid Configuration",
        description: "Origin and destination tokens must be different",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const stepSizeNum = parseFloat(config.stepSize);
    if (isNaN(stepSizeNum) || stepSizeNum <= 0) {
      toast({
        title: "Invalid Step Size",
        description: "Step size must be a valid number greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8888/dca/create_strategy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...config,
            stepSize: stepSizeNum,
            totalInvestmentAmount: config.totalInvestmentAmount
              ? parseFloat(config.totalInvestmentAmount)
              : undefined,
            maxPurchaseAmount: config.maxPurchaseAmount
              ? parseFloat(config.maxPurchaseAmount)
              : undefined,
            priceThreshold: config.priceThreshold
              ? parseFloat(config.priceThreshold)
              : undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        toast({
          title: "Strategy Created",
          description: "Your DCA strategy has been created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setShowForm(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Strategy Creation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create DCA strategy",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const calculateTimeToCompletion = () => {
    const stepSizeNum = parseFloat(config.stepSize);
    const totalInvestmentNum = config.totalInvestmentAmount
      ? parseFloat(config.totalInvestmentAmount)
      : undefined;

    if (
      !totalInvestmentNum ||
      isNaN(totalInvestmentNum) ||
      !stepSizeNum ||
      isNaN(stepSizeNum) ||
      stepSizeNum === 0
    ) {
      return "Ongoing strategy";
    }

    const totalPurchases = Math.ceil(totalInvestmentNum / stepSizeNum);
    const frequencyInDays =
      {
        hourly: 1 / 24,
        daily: 1,
        weekly: 7,
        biweekly: 14,
      }[config.frequency] || 0;

    const daysToComplete = totalPurchases * frequencyInDays;

    if (daysToComplete < 1) return "Less than a day";
    if (daysToComplete < 30) return `${Math.ceil(daysToComplete)} days`;
    if (daysToComplete < 365) return `${Math.ceil(daysToComplete / 30)} months`;
    return `${Math.round((daysToComplete / 365) * 10) / 10} years`;
  };

  return (
    <Box width="100%" mb={4}>
      <Box display="inline-flex" alignItems="center" gap={2}>
        <Text color="white">{content}</Text>
        <IconButton
          onClick={() => setShowForm(!showForm)}
          variant="ghost"
          size="sm"
          color="gray.400"
          _hover={{ color: "blue.400" }}
          aria-label="Configure DCA"
          icon={<Settings2 size={16} />}
        />
      </Box>

      <Collapse in={showForm} animateOpacity>
        <Box
          mt={4}
          p={4}
          bg="gray.900"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.700"
        >
          <VStack align="stretch" spacing={4}>
            {/* From / To selection */}
            <HStack spacing={4}>
              <FormControl>
                <FormLabel color="white">From (Origin)</FormLabel>
                <Select
                  value={config.originToken}
                  onChange={(e) =>
                    setConfig({ ...config, originToken: e.target.value })
                  }
                  color="white"
                  sx={{
                    "& > option": {
                      color: "black",
                    },
                  }}
                >
                  {BASE_AVAILABLE_TOKENS.filter(
                    (t) => t.symbol !== config.destinationToken
                  ).map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="white">To (Destination)</FormLabel>
                <Select
                  value={config.destinationToken}
                  onChange={(e) =>
                    setConfig({ ...config, destinationToken: e.target.value })
                  }
                  color="white"
                  sx={{
                    "& > option": {
                      color: "black",
                    },
                  }}
                >
                  {BASE_AVAILABLE_TOKENS.filter(
                    (t) => t.symbol !== config.originToken
                  ).map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            {/* Basic settings */}
            <FormControl>
              <FormLabel color="white">Investment Step Size</FormLabel>
              <Input
                type="number"
                step="any"
                min="0"
                color="white"
                value={config.stepSize}
                onChange={(e) =>
                  setConfig({ ...config, stepSize: e.target.value })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel color="white">
                Total Investment Amount (Optional)
              </FormLabel>
              <Input
                type="number"
                step="any"
                min="0"
                color="white"
                value={config.totalInvestmentAmount ?? ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    totalInvestmentAmount: e.target.value,
                  })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel color="white">Frequency</FormLabel>
              <Select
                value={config.frequency}
                onChange={(e) =>
                  setConfig({ ...config, frequency: e.target.value })
                }
                color="white"
                sx={{
                  "& > option": {
                    color: "black",
                  },
                }}
              >
                {DCA_AVAILABLE_FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Advanced Settings Toggle */}
            <Button
              onClick={onToggle}
              variant="ghost"
              color="white"
              _hover={{ bg: "gray.800" }}
            >
              {isOpen ? "Hide Advanced Settings" : "Show Advanced Settings"}
            </Button>

            <Collapse in={isOpen}>
              <VStack align="stretch" spacing={4} mt={4}>
                <Divider borderColor="gray.700" />

                <FormControl>
                  <FormLabel color="white">
                    Maximum Purchase Amount (Optional)
                  </FormLabel>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    color="white"
                    value={config.maxPurchaseAmount ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxPurchaseAmount: e.target.value,
                      })
                    }
                    placeholder="No maximum"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white">
                    Price Threshold (Optional)
                  </FormLabel>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    color="white"
                    value={config.priceThreshold ?? ""}
                    onChange={(e) =>
                      setConfig({ ...config, priceThreshold: e.target.value })
                    }
                    placeholder="Only buy below this price"
                  />
                </FormControl>

                <Checkbox
                  isChecked={config.pauseOnVolatility}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      pauseOnVolatility: e.target.checked,
                    })
                  }
                  color="white"
                  sx={{
                    "[data-checked]": {
                      backgroundColor: "white !important",
                      borderColor: "white !important",
                    },
                    "& .chakra-checkbox__control": {
                      borderColor: "white",
                    },
                  }}
                >
                  Pause strategy during high volatility
                </Checkbox>
              </VStack>
            </Collapse>

            <Text color="white" fontSize="sm" textAlign="center">
              Estimated time to completion: {calculateTimeToCompletion()}
            </Text>

            <Button
              colorScheme="green"
              onClick={handleSave}
              size="md"
              width="100%"
            >
              Execute Strategy
            </Button>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default DCAMessage;
