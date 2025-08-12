import { encryptString } from "@lit-protocol/encryption";
import { WebUploader } from "@irys/web-upload";
import { ethers } from "ethers";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";
import {
  litClient,
  initializeLitProtocol,
  gatewayAddress,
  getAccessControlConditions,
  addCurrentUserAsDelegatee,
} from "./utils";

/**
 * Get the Irys uploader
 */
export const getIrysUploader = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const irysUploader = await WebUploader(WebEthereum).withAdapter(
    EthersV6Adapter(provider)
  );
  return irysUploader;
};

/**
 * Encrypts a string using Lit Protocol access control conditions
 */
export const encryptSecret = async (
  text: string
): Promise<{ ciphertext: string; dataToEncryptHash: string }> => {
  await initializeLitProtocol();

  // First ensure the current user is registered as a delegatee
  await addCurrentUserAsDelegatee();

  try {
    console.log("[LIT] Encrypting secret");
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        accessControlConditions: getAccessControlConditions(),
        dataToEncrypt: text,
      },
      litClient
    );

    return { ciphertext, dataToEncryptHash };
  } catch (error) {
    console.error("[LIT] Error encrypting secret:", error);
    throw error;
  }
};

/**
 * Uploads encrypted content to Irys network
 */
export const uploadToIrys = async (
  cipherText: string,
  dataToEncryptHash: string
): Promise<string> => {
  const irysUploader = await getIrysUploader();

  const dataToUpload = {
    ciphertext: cipherText,
    dataToEncryptHash: dataToEncryptHash,
    accessControlConditions: getAccessControlConditions(),
  };

  try {
    console.log("[IRYS] Uploading encrypted data");
    const tags = [{ name: "Content-Type", value: "application/json" }];
    const receipt = await irysUploader.upload(JSON.stringify(dataToUpload), {
      tags,
    });
    console.log("[IRYS] Upload successful, ID:", receipt?.id);
    return receipt?.id ? `${gatewayAddress}${receipt.id}` : "";
  } catch (error) {
    console.error("[IRYS] Error uploading data:", error);
    throw error;
  }
};

/**
 * Combined function to encrypt a string and upload it to Irys in one operation
 */
export const encryptAndUpload = async (plaintext: string): Promise<string> => {
  try {
    // Step 1: Encrypt the secret
    const { ciphertext, dataToEncryptHash } = await encryptSecret(plaintext);

    // Step 2: Upload to Irys
    const irysUrl = await uploadToIrys(ciphertext, dataToEncryptHash);

    return irysUrl;
  } catch (error) {
    console.error("[LIT] Error in encryptAndUpload flow:", error);
    throw error;
  }
};
