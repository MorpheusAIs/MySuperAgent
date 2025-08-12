import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccess, version, type ApiData } from 'flags';
import { FLAG_DEFINITIONS } from '@/services/featureFlags';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiData | null>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json(null);
    return;
  }
  
  // Verify the request is from Vercel Toolbar
  const access = await verifyAccess(req.headers.authorization);
  
  if (!access) {
    res.status(401).json(null);
    return;
  }
  
  // Transform our FLAG_DEFINITIONS into the format expected by Vercel
  const definitions: ApiData['definitions'] = {};
  
  Object.entries(FLAG_DEFINITIONS).forEach(([key, value]) => {
    if (value) {
      definitions[key] = {
        description: value.description,
        origin: value.origin,
        options: value.options,
      };
    }
  });
  
  const response: ApiData = {
    definitions,
    overrideEncryptionMode: 'encrypted',
    hints: [
      {
        key: 'feature-flags',
        text: 'Feature flags are configured in services/featureFlags.ts',
      },
    ],
  };
  
  // Set the required response header for v4
  res.setHeader('x-flags-sdk-version', version);
  
  res.status(200).json(response);
}