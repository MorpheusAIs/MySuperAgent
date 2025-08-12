import React, { useState } from "react";
import {
  VStack,
  Box,
  Text,
  Select,
  Button,
  FormControl,
  FormLabel,
  useToast,
  Input,
  IconButton,
  Collapse,
} from "@chakra-ui/react";
import { SendHorizontal } from "lucide-react";
import { BASE_AVAILABLE_TOKENS } from "@/services/constants";

interface TransferConfig {
  token: string;
  amount: string;
  destinationAddress: string;
}

const BaseTransferMessage = ({
  content,
  metadata,
}: {
  content: any;
  metadata: any;
}) => {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);

  const [config, setConfig] = useState<TransferConfig>({
    token: "usdc",
    amount: "",
    destinationAddress: "",
  });

  const handleTransfer = async () => {
    // Validate destination address
    if (!config.destinationAddress) {
      toast({
        title: "Invalid Configuration",
        description: "Destination address is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const parsedAmount = parseFloat(config.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8888/base/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: config.token,
          amount: parsedAmount,
          destinationAddress: config.destinationAddress,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast({
          title: "Transfer Successful",
          description: data.message,
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
        title: "Transfer Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
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
          aria-label="Configure transfer"
          icon={<SendHorizontal size={16} />}
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
            <FormControl>
              <FormLabel color="white">Token</FormLabel>
              <Select
                value={config.token}
                onChange={(e) =>
                  setConfig({ ...config, token: e.target.value })
                }
                color="white"
                sx={{
                  "& > option": {
                    color: "black",
                  },
                }}
              >
                {BASE_AVAILABLE_TOKENS.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color="white">Amount</FormLabel>
              <Input
                type="number"
                step="any"
                min="0"
                color="white"
                value={config.amount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    amount: e.target.value,
                  })
                }
              />
              <Text fontSize="sm" color="gray.400" mt={1}>
                Amount of {config.token} to transfer
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel color="white">Destination Address</FormLabel>
              <Input
                value={config.destinationAddress}
                onChange={(e) =>
                  setConfig({ ...config, destinationAddress: e.target.value })
                }
                placeholder="Enter destination address"
                color="white"
              />
            </FormControl>

            <Button
              colorScheme="green"
              onClick={handleTransfer}
              size="md"
              width="100%"
            >
              Transfer Tokens
            </Button>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default BaseTransferMessage;
