import { UserPreferencesDB } from '@/services/database/db';
import { defaultChatSimilarityService } from '@/services/similarity/chat-similarity-service';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const walletAddress = req.query.walletAddress as string;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (req.method === 'GET') {
      // Get current configuration
      const config = defaultChatSimilarityService.getConfig();

      // Try to get user-specific preferences
      try {
        const preferences = await UserPreferencesDB.getPreferences(
          walletAddress
        );
        const userConfig = {
          ...config,
          enabled: preferences.similarity_enabled ?? config.enabled,
          similarityThreshold:
            preferences.similarity_threshold ?? config.similarityThreshold,
          maxSimilarPrompts:
            preferences.max_similar_prompts ?? config.maxSimilarPrompts,
          contextInjectionEnabled:
            preferences.similarity_context_enabled ??
            config.contextInjectionEnabled,
        };

        return res.status(200).json({ config: userConfig });
      } catch (error) {
        // If user preferences don't exist, return default config
        return res.status(200).json({ config });
      }
    }

    if (req.method === 'POST') {
      // Update configuration
      const { config: newConfig } = req.body;

      if (!newConfig || typeof newConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid configuration object' });
      }

      // Update the service configuration
      defaultChatSimilarityService.updateConfig(newConfig);

      // Save user-specific preferences to database
      try {
        const updateData: any = {};

        if (newConfig.enabled !== undefined) {
          updateData.similarity_enabled = newConfig.enabled;
        }
        if (newConfig.similarityThreshold !== undefined) {
          updateData.similarity_threshold = newConfig.similarityThreshold;
        }
        if (newConfig.maxSimilarPrompts !== undefined) {
          updateData.max_similar_prompts = newConfig.maxSimilarPrompts;
        }
        if (newConfig.contextInjectionEnabled !== undefined) {
          updateData.similarity_context_enabled =
            newConfig.contextInjectionEnabled;
        }

        await UserPreferencesDB.updatePreferences(walletAddress, updateData);

        const updatedConfig = defaultChatSimilarityService.getConfig();
        return res.status(200).json({
          message: 'Configuration updated successfully',
          config: updatedConfig,
        });
      } catch (error) {
        console.error('Error updating user preferences:', error);
        return res.status(500).json({
          error: 'Failed to save user preferences',
          config: defaultChatSimilarityService.getConfig(),
        });
      }
    }
  } catch (error) {
    console.error('Error handling similarity config:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
