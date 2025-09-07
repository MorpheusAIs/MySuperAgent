import { ethers } from "ethers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";

// Initialization state
let isInitialized = false;
let LIT_RELAYER_API_KEY: string;
let LIT_PAYER_SECRET_KEY: string;

// Choose network based on environment
export const getLitNetwork = () => {
  return process.env.NODE_ENV === "production"
    ? LIT_NETWORK.Datil
    : LIT_NETWORK.DatilDev;
};

// Initialize the Lit client
export const litClient = new LitNodeClient({
  litNetwork: getLitNetwork(),
});

// Gateway address
export const gatewayAddress = "https://gateway.irys.xyz/";

// Get the appropriate relayer URL based on network
export const getRelayerUrl = (endpoint: string) => {
  const network =
    process.env.NODE_ENV === "production" ? "datil" : "datil-test";
  return `https://${network}-relayer.getlit.dev/${endpoint}`;
};

// Get secrets directly from environment variables
export const getSecrets = async () => {
  console.log("[LIT] Getting secrets from environment variables");
  return {
    LIT_RELAYER_API_KEY: process.env.NEXT_PUBLIC_LIT_RELAYER_API_KEY || "",
    LIT_PAYER_SECRET_KEY: process.env.NEXT_PUBLIC_LIT_PAYER_SECRET_KEY || "",
  };
};

// Initialize Lit Protocol
export const initializeLitProtocol = async (): Promise<void> => {
  // Return immediately if already initialized
  if (isInitialized) return;

  try {
    // Connect to Lit network
    console.log("[LIT] Connecting to Lit Network");
    await litClient.connect();
    console.log("[LIT] Lit client connected successfully");

    // Load secrets
    console.log("[LIT] Loading secrets");
    const secrets = await getSecrets();
    LIT_RELAYER_API_KEY = secrets.LIT_RELAYER_API_KEY;
    LIT_PAYER_SECRET_KEY = secrets.LIT_PAYER_SECRET_KEY;

    // Verify we have the API key
    if (!LIT_RELAYER_API_KEY) {
      throw new Error("LIT_RELAYER_API_KEY not found in environment variables");
    }

    isInitialized = true;
    console.log("[LIT] Initialization complete");
  } catch (error) {
    console.error("[LIT] Initialization failed:", error);
    throw error;
  }
};

/**
 * Add users as payees for the payer wallet - must be called before encryption/decryption
 */
export const addUsers = async (users: string[]): Promise<boolean> => {
  await initializeLitProtocol();

  // Verify we have the required credentials
  if (!LIT_RELAYER_API_KEY || !LIT_PAYER_SECRET_KEY) {
    console.error("[LIT] Missing API key or payer secret key");
    throw new Error("API key or payer secret key is missing");
  }

  const headers = {
    "api-key": LIT_RELAYER_API_KEY,
    "payer-secret-key": LIT_PAYER_SECRET_KEY,
    "Content-Type": "application/json",
  };

  console.log(`[LIT] Adding ${users.length} users as delegatees`);

  try {
    const url = getRelayerUrl("add-users");
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(users),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[LIT] Add users failed: ${response.status} - ${errorText}`
      );
      throw new Error(`Error: ${errorText}`);
    }

    const data = await response.json();
    if (data.success !== true) {
      throw new Error(`Error: ${data.error}`);
    }
    console.log("[LIT] Added users as delegatees successfully");

    return true;
  } catch (error) {
    console.error("[LIT] Error adding users:", error);
    throw error;
  }
};

/**
 * Adds the current user to the Payment Delegation Database
 * Should be called before any encryption/decryption operation
 */
export const addCurrentUserAsDelegatee = async (): Promise<boolean> => {
  try {
    // Get the user's address from browser ethereum provider
    if (!window.ethereum) {
      throw new Error('No ethereum provider found');
    }
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    const userWalletAddress = await signer.getAddress();

    console.log(
      `[LIT] Adding current user (${userWalletAddress}) to payment delegation database`
    );
    return await addUsers([userWalletAddress]);
  } catch (error) {
    console.error("[LIT] Error adding current user as delegatee:", error);
    throw error;
  }
};

/**
 * Standard access control conditions for all encryption/decryption
 */
export const getAccessControlConditions = () => {
  return [
    {
      conditionType: "evmBasic" as const,
      contractAddress: "" as const,
      standardContractType: "" as const,
      chain: "ethereum" as const,
      method: "eth_getBalance" as const,
      parameters: [":userAddress", "latest"],
      returnValueTest: {
        comparator: ">=" as const,
        value: "0", // Any balance >= 0 (should always be true for valid addresses)
      },
    },
  ];
};
