import React, { FC, useState } from "react";
import { Button, VStack, Text } from "@chakra-ui/react";
import { ClaimMessagePayload, ClaimTransactionPayload } from "@/services/types";
import { useAccount, useChainId, useSendTransaction } from "wagmi";
import { parseEther } from "viem";

type ClaimFormProps = {
  isActive: boolean;
  fromMessage: ClaimMessagePayload;
  onSubmitClaim: (claimTx: any) => void;
};

export const ClaimForm: FC<ClaimFormProps> = ({
  isActive,
  fromMessage,
  onSubmitClaim,
}) => {
  console.log("ClaimForm received fromMessage:", fromMessage);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const chainId = useChainId();

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      if (
        !fromMessage?.content?.transactions ||
        !Array.isArray(fromMessage.content.transactions)
      ) {
        throw new Error("Invalid transaction data");
      }
      const transactions: ClaimTransactionPayload[] =
        fromMessage.content.transactions.map((item) => item.transaction);

      console.log("Transactions to be submitted:", transactions);

      // Pass the first transaction to onSubmitClaim
      if (transactions.length > 0) {
        onSubmitClaim(transactions[0]);
      } else {
        throw new Error("No transactions to process");
      }
    } catch (error) {
      console.error("Failed to process claim:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text>
        You have rewards available to claim. Would you like to proceed?
      </Text>
      <Button onClick={handleClaim} isLoading={isLoading} colorScheme="green">
        Claim Rewards
      </Button>
    </VStack>
  );
};
