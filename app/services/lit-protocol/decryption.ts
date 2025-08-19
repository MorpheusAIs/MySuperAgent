import { ethers } from "ethers";
import { decryptToString } from "@lit-protocol/encryption";
import { LIT_ABILITY } from "@lit-protocol/constants";
import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import {
  litClient,
  initializeLitProtocol,
  gatewayAddress,
  addCurrentUserAsDelegatee,
} from "./utils";

/**
 * Download encrypted data from Irys network
 */
export const downloadFromIrys = async (
  id: string
): Promise<[string, string, any[]]> => {
  const url = `${gatewayAddress}${id}`;
  console.log("[IRYS] Downloading from URL:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to retrieve data for ID: ${id}`);

    const data = await response.json();

    // Ensure consistent property names
    const ciphertext = data.ciphertext || data.cipherText;
    const dataToEncryptHash = data.dataToEncryptHash;
    const accessControlConditions = data.accessControlConditions;

    if (!ciphertext || !dataToEncryptHash || !accessControlConditions) {
      console.error("[IRYS] Missing required data:", {
        ciphertext: !!ciphertext,
        dataToEncryptHash: !!dataToEncryptHash,
        accessControlConditions: !!accessControlConditions,
      });
      throw new Error("Missing required data from Irys");
    }

    return [ciphertext, dataToEncryptHash, accessControlConditions];
  } catch (error) {
    console.error("[IRYS] Error retrieving data:", error);
    throw error;
  }
};

/**
 * Decrypt data using Lit Protocol
 */
export const decryptData = async (
  encryptedText: string,
  dataToEncryptHash: string,
  accessControlConditions: any[]
): Promise<string> => {
  await initializeLitProtocol();

  // First ensure the current user is registered as a delegatee
  await addCurrentUserAsDelegatee();

  console.log("[LIT] Starting decryption process");

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();

    const latestBlockhash = await litClient.getLatestBlockhash();

    // Get session signatures without capacity delegation
    console.log("[LIT] Getting session signatures");
    const sessionSigs = await litClient.getSessionSigs({
      chain: "ethereum",
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      resourceAbilityRequests: [
        {
          resource: new LitAccessControlConditionResource("*"),
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback: async (params) => {
        const toSign = await createSiweMessage({
          uri: params.uri || "",
          expiration: params.expiration,
          resources: params.resourceAbilityRequests,
          walletAddress: walletAddress,
          nonce: latestBlockhash,
          litNodeClient: litClient,
          domain: window.location.hostname,
        });

        return await generateAuthSig({
          signer: signer,
          toSign,
        });
      },
    });

    // Decrypt using sessionSigs
    console.log("[LIT] Decrypting data");
    const decryptedString = await decryptToString(
      {
        accessControlConditions,
        chain: "ethereum",
        ciphertext: encryptedText,
        dataToEncryptHash,
        sessionSigs,
      },
      litClient
    );

    return decryptedString;
  } catch (error) {
    console.error("[LIT] Decryption error:", error);
    throw error;
  }
};

/**
 * Combined function to download and decrypt content from Irys in one operation
 */
export const downloadAndDecrypt = async (id: string): Promise<string> => {
  try {
    // Step 1: Download the encrypted data from Irys
    const [ciphertext, dataToEncryptHash, accessControlConditions] =
      await downloadFromIrys(id);

    // Step 2: Decrypt the data
    const decryptedData = await decryptData(
      ciphertext,
      dataToEncryptHash,
      accessControlConditions
    );

    return decryptedData;
  } catch (error) {
    console.error("[LIT] Error in downloadAndDecrypt flow:", error);
    throw error;
  }
};
