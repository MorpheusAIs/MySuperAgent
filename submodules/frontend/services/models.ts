import { AxiosInstance } from "axios";

export interface ModelInfo {
  value: string;
  label: string;
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  blockchain_id?: string;
  tags?: string[];
  context_window?: number;
  supports_function_calling?: boolean;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

const SELECTED_MODEL_KEY = "mysuperagent_selected_model";
const MODEL_CONFIG_KEY = "mysuperagent_model_config";

export interface ModelConfig {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export const getAvailableModels = async (
  backendClient: AxiosInstance
): Promise<ModelsResponse> => {
  try {
    const response = await backendClient.get("/models/available");
    return response.data;
  } catch (error) {
    console.error("Error fetching available models:", error);
    throw error;
  }
};

export const getDefaultModel = async (
  backendClient: AxiosInstance
): Promise<ModelInfo> => {
  try {
    const response = await backendClient.get("/models/default");
    return response.data;
  } catch (error) {
    console.error("Error fetching default model:", error);
    throw error;
  }
};

export const getModelInfo = async (
  backendClient: AxiosInstance,
  modelId: string
): Promise<ModelInfo> => {
  try {
    const response = await backendClient.get(`/models/${modelId}/info`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching model info for ${modelId}:`, error);
    throw error;
  }
};

export const setSelectedModel = (modelId: string): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(SELECTED_MODEL_KEY, modelId);
    }
  } catch (error) {
    console.error("Error saving selected model:", error);
  }
};

export const getSelectedModel = (): string => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(SELECTED_MODEL_KEY) || "default";
    }
    return "default";
  } catch (error) {
    console.error("Error retrieving selected model:", error);
    return "default";
  }
};

export const clearSelectedModel = (): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(SELECTED_MODEL_KEY);
    }
  } catch (error) {
    console.error("Error clearing selected model:", error);
  }
};

export const getDefaultModelConfig = (): ModelConfig => ({
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
});

export const setModelConfig = (config: ModelConfig): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (error) {
    console.error("Error saving model config:", error);
  }
};

export const getModelConfig = (): ModelConfig => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(MODEL_CONFIG_KEY);
      if (saved) {
        return { ...getDefaultModelConfig(), ...JSON.parse(saved) };
      }
    }
  } catch (error) {
    console.error("Error retrieving model config:", error);
  }
  return getDefaultModelConfig();
};

export const clearModelConfig = (): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(MODEL_CONFIG_KEY);
    }
  } catch (error) {
    console.error("Error clearing model config:", error);
  }
};