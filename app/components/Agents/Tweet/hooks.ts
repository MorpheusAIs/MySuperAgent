import { Axios } from "axios";
import {
  decryptData,
  downloadFromIrys,
} from "@/services/LitProtocol/decryption";

export const postTweet = async (
  backendClient: Axios,
  content: string
): Promise<void> => {
  const irysUrl = localStorage.getItem("twitter_irys_url");

  if (!irysUrl) {
    throw new Error(
      "X API credentials not found. Please set them in the settings."
    );
  }

  try {
    const irysId = irysUrl.split("/").pop() || "";
    const [ciphertext, dataToEncryptHash, accessControlConditions] =
      await downloadFromIrys(irysId);

    if (!ciphertext || !dataToEncryptHash || !accessControlConditions) {
      throw new Error("Missing required data from Irys");
    }

    const decrypted = await decryptData(
      ciphertext,
      dataToEncryptHash,
      accessControlConditions
    );

    const credentials = JSON.parse(decrypted);

    await backendClient.post("/tweet/post", {
      post_content: content,
      api_key: credentials.apiKey,
      api_secret: credentials.apiSecret,
      access_token: credentials.accessToken,
      access_token_secret: credentials.accessTokenSecret,
    });
  } catch (error) {
    console.error("Error posting tweet:", error);
    throw error;
  }
};

export const regenerateTweet = async (
  backendClient: Axios
): Promise<string> => {
  try {
    const response = await backendClient.post("/tweet/regenerate");
    return response.data;
  } catch (error) {
    console.error("Error regenerating tweet:", error);
    throw error;
  }
};
