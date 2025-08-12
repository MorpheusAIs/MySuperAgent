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
  useToast,
  HStack,
  IconButton,
  Collapse,
} from "@chakra-ui/react";
import { ArrowLeftRight } from "lucide-react";
import { BASE_AVAILABLE_TOKENS } from "@/services/constants";

interface SwapConfig {
  fromToken: string;
  toToken: string;
  amount: number;
}

const BaseSwapMessage = ({
  content,
  metadata,
}: {
  content: any;
  metadata: any;
}) => {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [inputValue, setInputValue] = useState("0");

  const [config, setConfig] = useState<SwapConfig>({
    fromToken: "usdc",
    toToken: "weth",
    amount: 0,
  });

  const handleAmountChange = (value: string) => {
    // Allow empty string, "0", decimal point, and valid numbers
    if (value === "" || value === "0" || value === ".") {
      setInputValue(value);
      setConfig({ ...config, amount: 0 });
      return;
    }

    // Validate the input matches a valid number pattern
    if (/^\d*\.?\d*$/.test(value) && value !== ".") {
      setInputValue(value);
      setConfig({ ...config, amount: parseFloat(value) });
    }
  };

  const handleSwap = async () => {
    if (config.fromToken === config.toToken) {
      toast({
        title: "Invalid Configuration",
        description: "Source and destination tokens must be different",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (config.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8888/base/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAsset: config.fromToken,
          toAsset: config.toToken,
          amount: config.amount,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast({
          title: "Swap Initiated",
          description: "Your swap request has been submitted",
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
        title: "Swap Failed",
        description:
          error instanceof Error ? error.message : "Failed to execute swap",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
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
          aria-label="Configure swap"
          icon={<ArrowLeftRight size={16} />}
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
            <HStack spacing={4}>
              <FormControl>
                <FormLabel color="white">From Token</FormLabel>
                <Select
                  value={config.fromToken}
                  onChange={(e) =>
                    setConfig({ ...config, fromToken: e.target.value })
                  }
                  color="white"
                  sx={{
                    "& > option": {
                      color: "black",
                    },
                  }}
                >
                  {BASE_AVAILABLE_TOKENS.filter(
                    (t) => t.symbol !== config.toToken
                  ).map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="white">To Token</FormLabel>
                <Select
                  value={config.toToken}
                  onChange={(e) =>
                    setConfig({ ...config, toToken: e.target.value })
                  }
                  color="white"
                  sx={{
                    "& > option": {
                      color: "black",
                    },
                  }}
                >
                  {BASE_AVAILABLE_TOKENS.filter(
                    (t) => t.symbol !== config.fromToken
                  ).map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel color="white">Amount</FormLabel>
              <Input
                value={inputValue}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                color="white"
                type="text"
              />
              <Text fontSize="sm" color="gray.400" mt={1}>
                Amount of {config.fromToken} to swap
              </Text>
            </FormControl>

            <Button
              colorScheme="green"
              onClick={handleSwap}
              size="md"
              width="100%"
            >
              Swap Tokens
            </Button>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default BaseSwapMessage;
