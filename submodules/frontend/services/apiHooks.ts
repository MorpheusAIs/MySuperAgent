import { Axios } from "axios";
import {
  ChatMessage,
  SwapTxPayloadType,
  XCredentials,
  CoinbaseCredentials,
  OneInchCredentials,
} from "./types";

export const getChats = async () => {
  const chats = localStorage.getItem("chats");
  if (chats) {
    return JSON.parse(chats);
  }
  return [];
};

export const getAllowance = async (
  backendClient: Axios,
  chainId: number,
  tokenAddress: string,
  walletAddress: string
) => {
  return await backendClient.post("/swap/allowance", {
    chain_id: chainId,
    tokenAddress: tokenAddress,
    walletAddress: walletAddress,
  });
};

export const getApprovalTxPayload = async (
  backendClient: Axios,
  chainId: number,
  tokenAddress: string,
  amount: number,
  decimals: number
) => {
  return await backendClient.post("/swap/approve", {
    chain_id: chainId,
    tokenAddress: tokenAddress,
    amount: BigInt(amount * 10 ** decimals).toString(),
  });
};

export const uploadFile = async (backendClient: Axios, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  console.log("Uploading file:", file);
  return await backendClient.post("/rag/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getSwapTxPayload = async (
  backendClient: Axios,
  token0: string,
  token1: string,
  walletAddress: string,
  amount: number,
  slippage: number,
  chainId: number,
  decimals: number
): Promise<SwapTxPayloadType> => {
  return (
    await backendClient.post("/swap/swap", {
      src: token0,
      dst: token1,
      walletAddress: walletAddress,
      amount: BigInt(amount * 10 ** decimals).toString(),
      slippage: slippage,
      chain_id: chainId,
    })
  ).data;
};

export const sendSwapStatus = async (
  backendClient: Axios,
  chainId: number,
  walletAddress: string,
  swapStatus: string,
  txHash?: string,
  swapType?: number
): Promise<ChatMessage> => {
  try {
    const responseBody = await backendClient.post("/swap/tx_status", {
      status: swapStatus,
      tx_hash: txHash || "",
      tx_type: swapType === 0 ? "swap" : "approve",
      chain_id: chainId,
      wallet_address: walletAddress,
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
  } catch (error: unknown) {
    console.error("Failed to send swap status:", error);
    return {
      role: "assistant",
      content: "Failed to process transaction status update",
      error_message: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    } as ChatMessage;
  }
};

export const getAvailableAgents = async (backendClient: Axios) => {
  try {
    const response = await backendClient.get("/agents/available");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch available agents:", error);
    throw error;
  }
};

export const setSelectedAgents = async (
  backendClient: Axios,
  agents: string[]
) => {
  try {
    const response = await backendClient.post("/agents/selected", {
      agents,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to set selected agents:", error);
    throw error;
  }
};

export const setXCredentials = async (
  backendClient: Axios,
  keys: XCredentials
): Promise<{ status: string; message: string }> => {
  try {
    const response = await backendClient.post("/keys/x", keys);
    return response.data;
  } catch (error) {
    console.error("Failed to set X API keys:", error);
    throw error;
  }
};

export const setCoinbaseCredentials = async (
  backendClient: Axios,
  keys: CoinbaseCredentials
): Promise<{ status: string; message: string }> => {
  try {
    const response = await backendClient.post("/keys/coinbase", keys);
    return response.data;
  } catch (error) {
    console.error("Failed to set Coinbase API keys:", error);
    throw error;
  }
};

export const setOneInchCredentials = async (
  backendClient: Axios,
  keys: OneInchCredentials
): Promise<{ status: string; message: string }> => {
  try {
    const response = await backendClient.post("/keys/1inch", {
      api_key: keys.api_key,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to set 1inch API keys:", error);
    throw error;
  }
};

interface ElfaCredentials {
  api_key: string;
}

interface CodexCredentials {
  api_key: string;
}

interface SantimentCredentials {
  api_key: string;
}

export const setElfaCredentials = async (
  backendClient: Axios,
  keys: ElfaCredentials
): Promise<{ status: string; message: string }> => {
  try {
    const response = await backendClient.post("/keys/elfa", {
      api_key: keys.api_key,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to set Elfa API keys:", error);
    throw error;
  }
};

export const setCodexCredentials = async (
  backendClient: Axios,
  keys: CodexCredentials
): Promise<{ status: string; message: string }> => {
  try {
    const response = await backendClient.post("/keys/codex", {
      api_key: keys.api_key,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to set Codex API keys:", error);
    throw error;
  }
};

export const setSantimentCredentials = async (
  backendClient: Axios,
  keys: SantimentCredentials
): Promise<{ status: string; message: string }> => {
  try {
    const response = await backendClient.post("/keys/santiment", {
      api_key: keys.api_key,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to set Santiment API keys:", error);
    throw error;
  }
};

// Re-export model-related functions from models service
export { 
  getAvailableModels, 
  getDefaultModel, 
  getModelInfo,
  setSelectedModel 
} from "./models";
