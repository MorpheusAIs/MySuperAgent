import type { NextApiRequest, NextApiResponse } from 'next';
import { UserRulesDB } from '@/services/database/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get user rules
        const rules = await UserRulesDB.getUserRules(walletAddress);
        return res.status(200).json(rules);

      case 'POST':
        // Create new rule
        const { title, content } = req.body;

        if (!title || !content) {
          return res
            .status(400)
            .json({ error: 'Title and content are required' });
        }

        const newRule = await UserRulesDB.createRule(
          walletAddress,
          title,
          content
        );
        return res.status(201).json(newRule);

      case 'PUT':
        // Update rule
        const { id, updates } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Rule ID is required' });
        }

        const updatedRule = await UserRulesDB.updateRule(
          id,
          walletAddress,
          updates
        );
        if (!updatedRule) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        return res.status(200).json(updatedRule);

      case 'DELETE':
        // Delete rule
        const { ruleId } = req.query;

        if (!ruleId || typeof ruleId !== 'string') {
          return res.status(400).json({ error: 'Rule ID is required' });
        }

        await UserRulesDB.deleteRule(ruleId, walletAddress);
        return res.status(204).end();

      case 'PATCH':
        // Toggle rule enabled/disabled
        const { ruleId: toggleRuleId } = req.body;

        if (!toggleRuleId) {
          return res.status(400).json({ error: 'Rule ID is required' });
        }

        const toggledRule = await UserRulesDB.toggleRule(
          toggleRuleId,
          walletAddress
        );
        if (!toggledRule) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        return res.status(200).json(toggledRule);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
        return res
          .status(405)
          .json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('User rules API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
