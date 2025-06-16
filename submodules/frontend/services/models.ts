import { AxiosInstance } from "axios";

export interface ModelInfo {
  value: string;
  label: string;
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  context_window?: number;
  supports_function_calling?: boolean;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

const SELECTED_MODEL_KEY = "mysuperagent_selected_model";

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
    localStorage.setItem(SELECTED_MODEL_KEY, modelId);
  } catch (error) {
    console.error("Error saving selected model:", error);
  }
};

export const getSelectedModel = (): string => {
  try {
    return localStorage.getItem(SELECTED_MODEL_KEY) || "default";
  } catch (error) {
    console.error("Error retrieving selected model:", error);
    return "default";
  }
};

export const clearSelectedModel = (): void => {
  try {
    localStorage.removeItem(SELECTED_MODEL_KEY);
  } catch (error) {
    console.error("Error clearing selected model:", error);
  }
};