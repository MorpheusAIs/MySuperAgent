import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Re-enable when database module issues are resolved
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(503).json({
    error: 'Rules API temporarily disabled - using localStorage fallback',
  });
}

/* Disabled until database issues resolved
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    let DB;
    try {
      const dbModule = await import('@/services/database/db');
      DB = dbModule.default;
      
      // Check if the required DB classes are available
      if (!DB || !DB.UserRulesDB) {
        throw new Error('UserRulesDB not available in database module');
      }
    } catch (importError) {
      console.error('Database module not available:', importError);
      return res.status(503).json({
        error:
          'Database service unavailable. Please install dependencies and initialize the database.',
      });
    }

    switch (req.method) {
      case 'GET':
        // Get user rules
        const rules = await DB.UserRulesDB.getUserRules(walletAddress);
        return res.status(200).json(rules);

      case 'POST':
        // Create new rule
        const { title, content } = req.body;

        if (!title || !content) {
          return res
            .status(400)
            .json({ error: 'Title and content are required' });
        }

        const newRule = await DB.UserRulesDB.createRule(
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

        const updatedRule = await DB.UserRulesDB.updateRule(
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

        await DB.UserRulesDB.deleteRule(ruleId, walletAddress);
        return res.status(204).end();

      case 'PATCH':
        // Toggle rule enabled/disabled
        const { ruleId: toggleRuleId } = req.body;

        if (!toggleRuleId) {
          return res.status(400).json({ error: 'Rule ID is required' });
        }

        const toggledRule = await DB.UserRulesDB.toggleRule(
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
} */
