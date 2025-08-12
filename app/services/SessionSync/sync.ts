import { encryptSecret, uploadToIrys } from "@/services/LitProtocol/encryption";
import {
  decryptData,
  downloadFromIrys,
} from "@/services/LitProtocol/decryption";
import { getStorageData, saveStorageData } from "@/services/LocalStorage/core";

export const encryptAndUploadChats = async (): Promise<string> => {
  try {
    // Get all chat data from local storage
    const chatData = getStorageData();

    // Convert to string for encryption
    const dataString = JSON.stringify(chatData);

    // Encrypt the data using Lit Protocol
    const { ciphertext, dataToEncryptHash } = await encryptSecret(dataString);

    // Upload encrypted data to Irys
    const uploadedUrl = await uploadToIrys(ciphertext, dataToEncryptHash);

    return uploadedUrl;
  } catch (error) {
    console.error("Failed to encrypt and upload chats:", error);
    throw error;
  }
};

export const downloadAndDecryptChats = async (
  irysUrl: string
): Promise<void> => {
  try {
    const irysId = irysUrl.split("/").pop() || "";

    // Download encrypted data from Irys
    const [ciphertext, dataToEncryptHash, accessControlConditions] =
      await downloadFromIrys(irysId);

    if (!ciphertext || !dataToEncryptHash || !accessControlConditions) {
      throw new Error("Missing required data from Irys");
    }

    // Decrypt the data using Lit Protocol
    const decrypted = await decryptData(
      ciphertext,
      dataToEncryptHash,
      accessControlConditions
    );

    // Parse the decrypted data
    const chatData = JSON.parse(decrypted);

    // Save to local storage
    saveStorageData(chatData);
  } catch (error) {
    console.error("Failed to download and decrypt chats:", error);
    throw error;
  }
};
