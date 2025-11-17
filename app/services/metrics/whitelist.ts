import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

interface MetricsWhitelistConfig {
  whitelist: {
    emails?: string[];
    walletIDs?: string[];
  };
}

let cachedConfig: MetricsWhitelistConfig | null = null;
let lastModified: number = 0;

/**
 * Load and cache the metrics whitelist configuration
 */
function loadWhitelistConfig(): MetricsWhitelistConfig {
  // Try multiple possible paths for Next.js
  // process.cwd() might be the project root or the app directory
  const cwd = process.cwd();
  const possiblePaths = [
    path.join(cwd, 'config', 'metrics-whitelist.yaml'), // If cwd is app/
    path.join(cwd, 'app', 'config', 'metrics-whitelist.yaml'), // If cwd is project root
    path.join(cwd, 'metrics-whitelist.yaml'), // Fallback
    path.join(__dirname, '..', '..', 'config', 'metrics-whitelist.yaml'), // Relative to this file
  ];

  let configPath: string | null = null;
  let fileContents: string | null = null;

  // Find the file
  for (const possiblePath of possiblePaths) {
    try {
      if (fs.existsSync(possiblePath)) {
        configPath = possiblePath;
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  if (!configPath) {
    console.error(
      '[Whitelist] Config file not found. Tried paths:',
      possiblePaths
    );
    console.error('[Whitelist] process.cwd():', process.cwd());
    console.error('[Whitelist] __dirname:', __dirname);
    return { whitelist: {} };
  }

  try {
    console.log('[Whitelist] Loading config from:', configPath);
    const stats = fs.statSync(configPath);
    const currentModified = stats.mtimeMs;

    // Reload if file has been modified
    if (!cachedConfig || currentModified > lastModified) {
      fileContents = fs.readFileSync(configPath, 'utf8');
      console.log('[Whitelist] File contents:', fileContents);
      cachedConfig = yaml.load(fileContents) as MetricsWhitelistConfig;
      console.log(
        '[Whitelist] Parsed config:',
        JSON.stringify(cachedConfig, null, 2)
      );
      lastModified = currentModified;
    }

    return cachedConfig || { whitelist: {} };
  } catch (error) {
    console.error('[Whitelist] Error loading metrics whitelist config:', error);
    console.error('[Whitelist] Config path was:', configPath);
    console.error('[Whitelist] process.cwd():', process.cwd());
    if (fileContents) {
      console.error(
        '[Whitelist] File contents that failed to parse:',
        fileContents
      );
    }
    return { whitelist: {} };
  }
}

/**
 * Check if a user is whitelisted for metrics access
 */
export function isUserWhitelisted(
  email?: string | null,
  walletID?: string | null
): boolean {
  const config = loadWhitelistConfig();
  // Ensure we have arrays even if YAML parsing returns null/undefined
  const emails = Array.isArray(config.whitelist?.emails)
    ? config.whitelist.emails
    : [];
  const walletIDs = Array.isArray(config.whitelist?.walletIDs)
    ? config.whitelist.walletIDs
    : [];

  console.log('[Whitelist] Config loaded:', {
    emails,
    walletIDs,
    checkingEmail: email,
    checkingWalletID: walletID,
    rawConfig: config,
  });

  // Check email whitelist
  if (email && emails.length > 0) {
    const normalizedEmail = email.toLowerCase().trim();
    if (emails.some((e) => e?.toLowerCase().trim() === normalizedEmail)) {
      console.log('[Whitelist] Email match found');
      return true;
    }
  }

  // Check walletID whitelist (case-insensitive)
  if (walletID && walletIDs.length > 0) {
    const normalizedWalletID = walletID.toLowerCase().trim();

    // Convert all walletIDs to strings (in case YAML parsed them as numbers)
    const normalizedConfig = walletIDs.map((w: any) => {
      if (typeof w === 'number') {
        // If it was parsed as a number, convert back to hex string
        return '0x' + w.toString(16);
      }
      return String(w).toLowerCase().trim();
    });

    console.log('[Whitelist] Comparing:', {
      normalizedWalletID,
      walletIDsFromConfig: walletIDs,
      normalizedConfig,
    });

    const match = normalizedConfig.some(
      (normalized) => normalized === normalizedWalletID
    );

    if (match) {
      console.log('[Whitelist] WalletID match found!');
      return true;
    } else {
      console.log('[Whitelist] WalletID comparison failed:', {
        input: normalizedWalletID,
        configValues: normalizedConfig,
      });
    }
  }

  console.log('[Whitelist] No match found');
  return false;
}

/**
 * Get the whitelist configuration (for admin purposes)
 */
export function getWhitelistConfig(): MetricsWhitelistConfig {
  return loadWhitelistConfig();
}
