import { Axios } from "axios";
import { ChatMessage, ClaimTransactionPayload } from "@/services/types";

export const getClaimTxPayload = async (
  backendClient: Axios,
  transactions: ClaimTransactionPayload[]
): Promise<ClaimTransactionPayload[]> => {
  const response = await backendClient.post("/claim/claim", { transactions });
  return response.data.transactions;
};

export const sendClaimStatus = async (
  backendClient: Axios,
  chainId: number,
  walletAddress: string,
  claimStatus: string,
  txHash?: string
): Promise<ChatMessage> => {
  const responseBody = await backendClient.post("/claim/tx_status", {
    chain_id: chainId,
    wallet_address: walletAddress,
    status: claimStatus,
    tx_hash: txHash || "",
    tx_type: "claim",
  });

  return {
    role: responseBody.data.role,
    content: responseBody.data.content,
    agentName: responseBody.data.agentName,
    error_message: responseBody.data.error_message,
    metadata: responseBody.data.metadata,
    requires_action: responseBody.data.requires_action,
    action_type: responseBody.data.action_type,
    timestamp: responseBody.data.timestamp,
  } as ChatMessage;
};
