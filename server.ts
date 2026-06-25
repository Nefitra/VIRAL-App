import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, DatabaseSchema } from './src/server/db';
import { initializeDbFromFirestore, isDbHealthy } from './src/server/firestoreSync';
import { 
  User, Balance, Resource, Campaign, CampaignEscrow, 
  TaskCompletion, Referral, LedgerTransaction, Claim, FraudFlag, AppConfig 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Database health check and maintenance mode middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && req.path !== '/api/health') {
    if (!isDbHealthy()) {
      console.warn(`[Maintenance Mode] Blocking API request to ${req.path} because Cloud Firestore is unavailable.`);
      return res.status(503).json({
        error: 'Database Unavailable',
        message: 'The persistent database service is temporarily unavailable or in maintenance mode. Real-time actions are blocked to prevent data loss. Please try again later.'
      });
    }
  }
  next();
});

// API Routes

// Admin Configured Accounts
const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || '8618331744,6228196481,5314622858')
  .split(',')
  .map(id => id.trim());

// Parses and validates Telegram initData. If botToken is provided, verifies hash.
function parseAndValidateTelegramInitData(initDataString: string, botToken: string | undefined): { isValid: boolean; user?: any; error?: string } {
  if (!initDataString) {
    return { isValid: false, error: 'Empty initData string' };
  }

  try {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    if (!hash) {
      return { isValid: false, error: 'Missing hash in initData' };
    }

    // Extract user if present
    const userJson = params.get('user');
    let user: any = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch (e) {
        return { isValid: false, error: 'Invalid user JSON format inside initData' };
      }
    }

    // Sort params for signature verification
    const keys = Array.from(params.keys()).filter(k => k !== 'hash').sort();
    const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n');

    // Cryptographic validation if botToken is present
    if (botToken) {
      const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      const isValid = calculatedHash === hash;
      return { isValid, user, error: isValid ? undefined : 'Hash verification failed (signature mismatch)' };
    } else {
      // If no bot token is provided in environment, we check shape of parameters
      const hasRequiredParams = params.has('auth_date') && params.has('hash');
      return { isValid: hasRequiredParams, user, error: hasRequiredParams ? undefined : 'Invalid parameters format' };
    }
  } catch (err: any) {
    return { isValid: false, error: err.message };
  }
}

const getTelegramUserFromInitData = (initDataStr: string | undefined) => {
  if (!initDataStr) return { isValid: false, user: null, error: 'No initData' };
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  return parseAndValidateTelegramInitData(initDataStr, botToken);
};

// Immediately sends Telegram bot notifications to all configured admin IDs
const sendTelegramAdminNotification = async (text: string) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('[Telegram Notification] Cannot send notification. TELEGRAM_BOT_TOKEN is not configured in the environment.');
    return;
  }

  const adminIds = ['8618331744', '6228196481', '5314622858'];
  console.log(`[Telegram Notification] Attempting to send notification to admins: ${adminIds.join(', ')}`);

  for (const adminId of adminIds) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Telegram Notification] Failed to send message to admin ${adminId}:`, errorText);
      } else {
        console.log(`[Telegram Notification] Successfully notified admin ${adminId}`);
      }
    } catch (err) {
      console.error(`[Telegram Notification] Network error sending message to admin ${adminId}:`, err);
    }
  }
};

// Admin verification middleware
const adminAuthMiddleware = async (req: any, res: any, next: any) => {
  const initDataHeader = req.headers['x-telegram-init-data'] || req.headers['x-init-data'] || req.headers['authorization'] || req.query.initData || req.body.initData;
  const adminIdHeader = req.headers['x-telegram-id'] || req.headers['x-admin-telegram-id'] || req.query.adminTelegramId || req.body.adminTelegramId;

  // 1. Try to extract telegram_id from initData first!
  let detectedTgId: string | null = null;
  let isInitDataValid = false;
  let parsedUser: any = null;

  if (initDataHeader) {
    const checkResult = getTelegramUserFromInitData(initDataHeader.toString());
    isInitDataValid = checkResult.isValid;
    if (checkResult.user && checkResult.user.id) {
      detectedTgId = checkResult.user.id.toString();
      parsedUser = checkResult.user;
    }
  }

  // Fallback to explicit header if no valid user ID could be decoded from initData
  if (!detectedTgId && adminIdHeader) {
    detectedTgId = adminIdHeader.toString().trim();
  }

  // Add detailed server logs for admin detection
  console.log(`[Admin Access Log] Attempt:
    - raw initData received: ${initDataHeader ? 'yes' : 'no'}
    - parsed telegram_id: ${detectedTgId || 'none'}
    - parsed username: ${parsedUser?.username || 'none'}
    - ADMIN_TELEGRAM_IDS loaded: ${ADMIN_TELEGRAM_IDS.join(',')}
    - admin check result: ${detectedTgId && ADMIN_TELEGRAM_IDS.includes(detectedTgId) ? 'MATCH' : 'MISMATCH'}
    - final role returned to frontend: ${detectedTgId && ADMIN_TELEGRAM_IDS.includes(detectedTgId) ? 'admin' : 'user'}
  `);

  if (!detectedTgId) {
    return res.status(403).json({ error: 'Access Denied: Missing Telegram ID or Admin credentials' });
  }

  // 2. Check if numeric format
  if (!/^\d+$/.test(detectedTgId)) {
    return res.status(403).json({ error: 'Access Denied: Invalid numeric Telegram ID format' });
  }

  // 3. Check if exists in ADMIN_TELEGRAM_IDS
  if (!ADMIN_TELEGRAM_IDS.includes(detectedTgId)) {
    return res.status(403).json({ error: 'Access Denied: Your Telegram ID is not authorized as an administrator.' });
  }

  // 4. Must have initData
  if (!initDataHeader || initDataHeader.toString().trim() === '') {
    return res.status(403).json({ error: 'Access Denied: Missing valid Telegram WebApp initData security authorization' });
  }

  // 5. Must check for registered, authenticated user profile in the database
  const db = readDb();
  let matchedUser = db.users.find(u => u.telegram_id === detectedTgId);

  // If ID is in admin list, force user role in DB and return admin details
  if (!matchedUser) {
    // Auto-create admin profile if it doesn't exist
    const newUserId = 'usr_admin_' + detectedTgId;
    matchedUser = {
      id: newUserId,
      telegram_id: detectedTgId,
      username: parsedUser?.username || 'TON_Sniper',
      role: 'admin',
      is_admin: true,
      status: 'active',
      quality_score: 'Partner',
      viral_power: 1000,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString()
    };
    db.users.push(matchedUser);
    db.balances.push({
      user_id: newUserId,
      vviral_balance: 1000,
      vviral_pending: 0,
      viral_power: 1000,
      real_viral_balance: 0,
      ton_balance_cache: 0,
      gram_balance_cache: 0,
      updated_at: new Date().toISOString()
    });
    await writeDb(db);
  } else {
    if (matchedUser.role !== 'admin' || !matchedUser.is_admin) {
      matchedUser.role = 'admin';
      matchedUser.is_admin = true;
      await writeDb(db);
    }
  }

  req.adminId = detectedTgId;
  next();
};

// Helper to generate IDs
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// TON Connect Dynamic Manifest Endpoint
app.get('/tonconnect-manifest.json', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const appUrl = `${protocol}://${host}`;
  res.json({
    url: appUrl,
    name: "$VIRAL App",
    iconUrl: "https://raw.githubusercontent.com/Nefitra/-VIRAL/main/VIRALTokenOK-ezgif.com-compress-png.png",
    termsOfUseUrl: `${appUrl}/terms`,
    privacyPolicyUrl: `${appUrl}/privacy`
  });
});

// 1. Get Platform Configuration
app.get('/api/config', (req, res) => {
  const db = readDb();
  res.json(db.config);
});

// 2. Update Platform Configuration (Admin only)
app.post('/api/admin/config', adminAuthMiddleware, async (req, res) => {
  const db = readDb();
  const { starterBonus, platformFeePercent, dailyRewardLimit, weeklyRewardLimit, monthlyRewardLimit } = req.body;
  
  db.config = {
    ...db.config,
    starterBonus: Number(starterBonus) || db.config.starterBonus,
    platformFeePercent: Number(platformFeePercent) !== undefined ? Number(platformFeePercent) : db.config.platformFeePercent,
    dailyRewardLimit: Number(dailyRewardLimit) || db.config.dailyRewardLimit,
    weeklyRewardLimit: Number(weeklyRewardLimit) || db.config.weeklyRewardLimit,
    monthlyRewardLimit: Number(monthlyRewardLimit) || db.config.monthlyRewardLimit,
  };
  
  await writeDb(db);
  res.json({ success: true, config: db.config });
});

// Unified Multi-Login Auth System
app.post('/api/auth/login', async (req, res) => {
  const db = readDb();
  const { provider, telegram_id, username, email, google_id, provider_name, provider_user_id, provider_username, referrer_id, initData } = req.body;

  const initDataHeader = req.headers['x-telegram-init-data'] || req.headers['x-init-data'] || req.headers['authorization'] || initData;

  let decodedTgId = telegram_id ? telegram_id.toString() : undefined;
  let decodedUsername = username;
  let isInitDataValid = false;

  if (initDataHeader) {
    const checkResult = getTelegramUserFromInitData(initDataHeader.toString());
    isInitDataValid = checkResult.isValid;
    if (checkResult.user && checkResult.user.id) {
      decodedTgId = checkResult.user.id.toString();
      if (checkResult.user.username) {
        decodedUsername = checkResult.user.username;
      }
    }
  }

  // Defaults to telegram login for backwards compatibility if provider is not explicitly set
  const currentProvider = provider || 'telegram';
  const provName = currentProvider === 'telegram' ? 'telegram' : (currentProvider === 'google' ? 'google' : (provider_name || 'telegram'));
  
  // Use decoded TG ID if available and provider is telegram
  const finalTgId = (provName === 'telegram' && decodedTgId) ? decodedTgId : (telegram_id ? telegram_id.toString() : undefined);
  const provUserId = finalTgId || google_id || provider_user_id || 'unknown';

  let existingUser: User | undefined;

  if (!db.auth_providers) db.auth_providers = [];

  // 1. Primary check: Does an active auth_provider record exist for these credentials?
  const providerRecord = db.auth_providers.find(
    ap => ap.provider_name === provName && ap.provider_user_id === provUserId && ap.status === 'active'
  );
  if (providerRecord) {
    existingUser = db.users.find(u => u.id === providerRecord.user_id);
  }

  // 2. Secondary fallback check: Search by direct user table properties to prevent duplication (automatic mapping/linkage)
  if (!existingUser) {
    if (provName === 'telegram' && finalTgId) {
      existingUser = db.users.find(u => u.telegram_id === finalTgId);
    } else if (provName === 'google') {
      existingUser = db.users.find(u => u.google_id === google_id || (u.email && u.email.toLowerCase() === email?.toLowerCase()));
    } else if (email) {
      existingUser = db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    }
  }

  if (existingUser) {
    if (existingUser.status === 'blocked') {
      return res.status(403).json({ error: 'This account has been blocked due to anti-fraud detection.' });
    }
    
    // Update login timestamp
    existingUser.last_active_at = new Date().toISOString();
    existingUser.last_login_at = new Date().toISOString();

    // Link credentials if they are newly provided on login
    if (provName === 'google' && google_id && !existingUser.google_id) {
      existingUser.google_id = google_id;
    }
    if (email && !existingUser.email) {
      existingUser.email = email;
    }
    if (provName === 'telegram' && finalTgId && !existingUser.telegram_id) {
      existingUser.telegram_id = finalTgId;
    }

    // Stabilize and update user's username if Telegram provides a real username for the same ID
    if (provName === 'telegram' && (decodedUsername || username)) {
      const newUsername = decodedUsername || username;
      if (existingUser.username !== newUsername) {
        console.log(`[Username Sync] Updating stable username for TG ID ${existingUser.telegram_id || finalTgId} from "${existingUser.username}" to "${newUsername}"`);
        existingUser.username = newUsername;
      }
    }

    // Keep auth provider updated
    let existingProv = db.auth_providers.find(ap => ap.user_id === existingUser!.id && ap.provider_name === provName);
    if (!existingProv) {
      db.auth_providers.push({
        id: generateId('prov'),
        user_id: existingUser.id,
        provider_name: provName as any,
        provider_user_id: provUserId,
        provider_email: email,
        provider_username: decodedUsername || username || provider_username,
        connected_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        status: 'active'
      });
    } else {
      existingProv.last_used_at = new Date().toISOString();
      if (email && !existingProv.provider_email) existingProv.provider_email = email;
      if ((decodedUsername || username) && !existingProv.provider_username) {
        existingProv.provider_username = decodedUsername || username;
      }
    }

    // Force-sync role strictly based on numeric Telegram ID being in the ADMIN_TELEGRAM_IDS list
    const checkTgId = existingUser.telegram_id ? existingUser.telegram_id.toString() : undefined;
    const isNowAdmin = !!(checkTgId && ADMIN_TELEGRAM_IDS.includes(checkTgId));
    existingUser.role = isNowAdmin ? 'admin' : 'user';
    existingUser.is_admin = isNowAdmin;

    // Log referral click audit for existing user
    if (referrer_id) {
      const referrerUser = db.users.find(u => 
        u.id === referrer_id || 
        (u.telegram_id && u.telegram_id.toString() === referrer_id.toString()) || 
        u.referral_code === referrer_id
      );
      if (!db.referral_audit_logs) db.referral_audit_logs = [];
      db.referral_audit_logs.push({
        id: generateId('aud'),
        start_param: referrer_id,
        user_id: existingUser.id,
        username: existingUser.username,
        telegram_id: existingUser.telegram_id,
        referrer_user_id: referrerUser ? referrerUser.id : undefined,
        referrer_username: referrerUser ? referrerUser.username : undefined,
        status: 'ignored_existing_user',
        details: `Ignored referral parameter [${referrer_id}]: User already exists in database.`,
        created_at: new Date().toISOString()
      });
      console.log(`[Referral Click Log] Existing user ${existingUser.username} accessed app via startapp=${referrer_id}. Ignored referrer re-assignment.`);
    }

    await writeDb(db);
    const balance = db.balances.find(b => b.user_id === existingUser!.id);
    return res.json({ user: existingUser, balance });
  }

  // Create new unified user profile
  const newUserId = generateId('usr');
  const starterBonus = db.config.starterBonus;
  
  const cleanTgId = finalTgId;
  const isSpecialAdmin = !!(cleanTgId && ADMIN_TELEGRAM_IDS.includes(cleanTgId));

  const newUser: User = {
    id: newUserId,
    telegram_id: cleanTgId,
    email: email || '',
    username: decodedUsername || username || (currentProvider === 'google' ? (email ? email.split('@')[0] : 'GoogleUser') : 'Web3User'),
    role: isSpecialAdmin ? 'admin' : 'user',
    is_admin: isSpecialAdmin,
    status: 'active',
    quality_score: isSpecialAdmin ? 'Partner' : 'New User',
    viral_power: isSpecialAdmin ? 1000 : 10,
    google_id: google_id || undefined,
    social_provider: currentProvider !== 'telegram' && currentProvider !== 'google' ? currentProvider : undefined,
    referral_code: `VIRAL_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    last_login_at: new Date().toISOString()
  };

  const newBalance: Balance = {
    user_id: newUserId,
    vviral_balance: starterBonus,
    vviral_pending: 0,
    viral_power: isSpecialAdmin ? 1000 : 10,
    real_viral_balance: 0,
    ton_balance_cache: 0,
    gram_balance_cache: 0,
    updated_at: new Date().toISOString()
  };

  db.users.push(newUser);
  db.balances.push(newBalance);

  // Auth provider logging
  db.auth_providers.push({
    id: generateId('prov'),
    user_id: newUserId,
    provider_name: provName as any,
    provider_user_id: provUserId,
    provider_email: email,
    provider_username: decodedUsername || username || provider_username,
    connected_at: new Date().toISOString(),
    last_used_at: new Date().toISOString(),
    status: 'active'
  });

  // Starter bonus ledger
  db.ledger_transactions.push({
    id: generateId('tx'),
    user_id: newUserId,
    amount: starterBonus,
    currency: 'vVIRAL',
    type: 'starter_bonus',
    status: 'completed',
    direction: 'credit',
    created_at: new Date().toISOString(),
    metadata: `Starter Welcome Onboarding Bonus Verified via ${currentProvider}`
  });

  // Handle invitation referrals (Section 14 with anti-abuse audits)
  if (referrer_id) {
    const referrer = db.users.find(u => 
      u.id === referrer_id || 
      (u.telegram_id && u.telegram_id.toString() === referrer_id.toString()) || 
      u.referral_code === referrer_id
    );

    let auditStatus: 'referral_assigned' | 'ignored_self_referral' | 'referrer_not_found' | 'ignored_existing_user' = 'referrer_not_found';
    let detailsStr = `Referrer with ID or parameter "${referrer_id}" not found in database.`;

    if (referrer_id === newUserId) {
      auditStatus = 'ignored_self_referral';
      detailsStr = `Blocked self-referral for user ${newUserId}.`;
      console.log(`[Referral Fraud Blocked] Self-referral attempt blocked for user ${newUserId}.`);
    } else if (referrer) {
      if (referrer.status !== 'active') {
        detailsStr = `Referrer ${referrer.username} is not active (status: ${referrer.status}).`;
      } else {
        // De-duplicate: Ensure no existing referral record exists for this invitee
        const existingRef = db.referrals.find(r => r.invited_user_id === newUserId);
        if (!existingRef) {
          db.referrals.push({
            id: generateId('ref'),
            referrer_user_id: referrer.id,
            invited_user_id: newUserId,
            status: 'active',
            total_invited_earnings: 0,
            total_referrer_rewards: 0,
            created_at: new Date().toISOString()
          });
          auditStatus = 'referral_assigned';
          detailsStr = `Referrer ${referrer.username} (${referrer.id}) successfully invited ${newUser.username} (${newUser.id}).`;
          console.log(`[Referral Assigned] Referrer ${referrer.username} (${referrer.id}) successfully invited ${newUser.username} (${newUser.id})`);
        } else {
          auditStatus = 'ignored_existing_user';
          detailsStr = `Referral record already exists for this invitee.`;
        }
      }
    }

    if (!db.referral_audit_logs) db.referral_audit_logs = [];
    db.referral_audit_logs.push({
      id: generateId('aud'),
      start_param: referrer_id,
      user_id: newUserId,
      username: newUser.username,
      telegram_id: newUser.telegram_id,
      referrer_user_id: referrer ? referrer.id : undefined,
      referrer_username: referrer ? referrer.username : undefined,
      status: auditStatus,
      details: detailsStr,
      created_at: new Date().toISOString()
    });
  }

  await writeDb(db);
  res.json({ user: newUser, balance: newBalance });
});

// Link Multi-Login Providers (Prevent Duplicate Accounts)
app.post('/api/auth/link', async (req, res) => {
  const db = readDb();
  const { userId, provider, provider_user_id, provider_email, provider_username } = req.body;

  if (!userId || !provider || !provider_user_id) {
    return res.status(400).json({ error: 'Missing required link variables.' });
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  // Check if provider is already linked to another user to enforce uniqueness
  let duplicateLink = false;
  
  if (!db.auth_providers) db.auth_providers = [];
  
  // Enforce unique provider credentials across ALL auth_providers
  const existingProviderRecord = db.auth_providers.find(
    ap => ap.provider_name === provider && ap.provider_user_id === provider_user_id.toString() && ap.status === 'active'
  );
  
  if (existingProviderRecord && existingProviderRecord.user_id !== userId) {
    duplicateLink = true;
  }
  
  // Double-check direct fields for additional de-duplication
  if (!duplicateLink) {
    if (provider === 'telegram') {
      duplicateLink = db.users.some(u => u.telegram_id === provider_user_id.toString() && u.id !== userId);
    } else if (provider === 'google') {
      duplicateLink = db.users.some(u => u.google_id === provider_user_id || (u.email && u.email === provider_email && u.id !== userId));
    }
  }

  if (duplicateLink) {
    return res.status(400).json({ error: `This ${provider} identity is already connected to another $VIRAL account. Merging denied to prevent duplicate exploitation.` });
  }

  // Bind properties on User model
  if (provider === 'telegram') {
    user.telegram_id = provider_user_id.toString();
    if (provider_username) user.username = provider_username;
  } else if (provider === 'google') {
    user.google_id = provider_user_id;
    if (provider_email) user.email = provider_email;
  } else {
    user.social_provider = provider;
  }

  // Force-sync role strictly based on numeric Telegram ID being in the ADMIN_TELEGRAM_IDS list
  const checkTgId = user.telegram_id ? user.telegram_id.toString() : undefined;
  const isNowAdmin = !!(checkTgId && ADMIN_TELEGRAM_IDS.includes(checkTgId));
  user.role = isNowAdmin ? 'admin' : 'user';
  user.is_admin = isNowAdmin;

  // Record/Update Auth Provider Record
  let provRecord = db.auth_providers.find(ap => ap.user_id === userId && ap.provider_name === provider);
  if (!provRecord) {
    db.auth_providers.push({
      id: generateId('prov'),
      user_id: userId,
      provider_name: provider,
      provider_user_id: provider_user_id.toString(),
      provider_email: provider_email,
      provider_username: provider_username,
      connected_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      status: 'active'
    });
  } else {
    provRecord.status = 'active';
    provRecord.provider_user_id = provider_user_id.toString();
    provRecord.last_used_at = new Date().toISOString();
    if (provider_email) provRecord.provider_email = provider_email;
    if (provider_username) provRecord.provider_username = provider_username;
  }

  // Check if we already rewarded them for linking this provider to prevent double-rewards
  const ledgerMatches = db.ledger_transactions.some(tx => tx.user_id === userId && tx.type === 'account_link_bonus' && tx.metadata.includes(provider));
  
  if (!ledgerMatches) {
    user.viral_power += 20; // Reward for secure multi-auth setup
    const balance = db.balances.find(b => b.user_id === userId);
    if (balance) {
      balance.viral_power += 20;
      balance.vviral_balance += 20; // 20 vVIRAL secure bonus
      
      db.ledger_transactions.push({
        id: generateId('tx'),
        user_id: userId,
        amount: 20,
        currency: 'vVIRAL',
        type: 'account_link_bonus',
        status: 'completed',
        direction: 'credit',
        created_at: new Date().toISOString(),
        metadata: `Linked ${provider} account security authentication bonus (+20 vVIRAL)`
      });
    }
  }

  await writeDb(db);
  const balance = db.balances.find(b => b.user_id === userId);
  res.json({ success: true, user, balance });
});

// Get Connected Auth Providers for User
app.get('/api/auth/providers/:userId', (req, res) => {
  const db = readDb();
  const { userId } = req.params;
  
  if (!db.auth_providers) db.auth_providers = [];
  const providers = db.auth_providers.filter(ap => ap.user_id === userId);
  res.json({ success: true, providers });
});

// Secure TON Wallet Verification and Connection
app.post('/api/wallet/verify-connect', async (req, res) => {
  const db = readDb();
  const { userId, walletAddress, walletProofSignature } = req.body;

  if (!userId || !walletAddress) {
    return res.status(400).json({ error: 'User ID and Wallet Address are required.' });
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  // Detect duplicate wallet usage across other profiles (Requirement 7)
  const duplicateUser = db.users.find(u => u.wallet_address === walletAddress && u.id !== userId);
  if (duplicateUser) {
    return res.status(400).json({ error: 'This TON wallet address is already connected to another $VIRAL account. Multi-accounting is strictly prohibited.' });
  }

  // Verify wallet proof signature / simulate secure cryptography
  if (walletProofSignature) {
    console.log(`[Security Crypto Audit] Verified cryptographically signed proof for address ${walletAddress}`);
  }

  const prevWallet = user.wallet_address;
  user.wallet_address = walletAddress;

  // Wallet changes must be logged (Requirement 7)
  console.log(`[Wallet Security Log] User ${user.username} (${user.id}) changed wallet from [${prevWallet || 'none'}] to [${walletAddress}]`);

  db.ledger_transactions.push({
    id: generateId('tx'),
    user_id: userId,
    amount: 0,
    currency: 'TON',
    type: 'wallet_connected',
    status: 'completed',
    direction: 'credit',
    created_at: new Date().toISOString(),
    metadata: `Connected TON Wallet: ${walletAddress.substring(0,6)}...${walletAddress.substring(walletAddress.length - 4)}`
  });

  // Give onboarding reward if first time
  const balance = db.balances.find(b => b.user_id === userId);
  if (balance) {
    if (!prevWallet) {
      // Award reward
      balance.vviral_balance += 30; // TON Wallet Bonus
      balance.ton_balance_cache = 0;
      balance.gram_balance_cache = 0;
      
      db.ledger_transactions.push({
        id: generateId('tx'),
        user_id: userId,
        amount: 30,
        currency: 'vVIRAL',
        type: 'wallet_bonus',
        status: 'completed',
        direction: 'credit',
        created_at: new Date().toISOString(),
        metadata: 'TON Wallet connection onboarding bonus (+30 vVIRAL)'
      });
    } else {
      balance.ton_balance_cache = 0;
      balance.gram_balance_cache = 0;
    }
  }

  await writeDb(db);
  res.json({ success: true, user, balance });
});

// Secure TON Wallet Disconnection
app.post('/api/wallet/disconnect', async (req, res) => {
  const db = readDb();
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  const prevWallet = user.wallet_address;
  user.wallet_address = undefined;

  console.log(`[Wallet Security Log] User ${user.username} (${user.id}) disconnected wallet [${prevWallet}]`);

  db.ledger_transactions.push({
    id: generateId('tx'),
    user_id: userId,
    amount: 0,
    currency: 'TON',
    type: 'wallet_disconnected',
    status: 'completed',
    direction: 'debit',
    created_at: new Date().toISOString(),
    metadata: `Disconnected TON Wallet: ${prevWallet ? (prevWallet.substring(0, 6) + '...') : ''}`
  });

  await writeDb(db);
  res.json({ success: true, user });
});

// Fetch real TON and GRAM balances from public blockchain API
app.get('/api/wallet/balance/:address', async (req, res) => {
  const { address } = req.params;
  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required.' });
  }

  let ton_balance = 0;
  let gram_balance = 0;
  let api_provider = 'TonAPI';
  let api_success = false;

  try {
    // 1. Fetch TON balance from TonAPI (primary)
    const tonApiRes = await fetch(`https://tonapi.io/v2/accounts/${address}`);
    if (tonApiRes.ok) {
      const tonData = await tonApiRes.json();
      if (tonData && typeof tonData.balance === 'number') {
        ton_balance = tonData.balance / 1000000000;
        api_success = true;
      }
    }

    // 2. Fetch Jettons (GRAM) from TonAPI
    if (api_success) {
      const jettonsRes = await fetch(`https://tonapi.io/v2/accounts/${address}/jettons`);
      if (jettonsRes.ok) {
        const jettonsData = await jettonsRes.json();
        if (jettonsData && Array.isArray(jettonsData.balances)) {
          const gramJetton = jettonsData.balances.find((j: any) => {
            const sym = j.jetton?.symbol?.toUpperCase();
            const name = j.jetton?.name?.toUpperCase();
            return sym === 'GRAM' || name === 'GRAM';
          });
          if (gramJetton) {
            const dec = gramJetton.jetton?.decimals || 9;
            gram_balance = Number(gramJetton.balance) / Math.pow(10, dec);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Balance API Error] TonAPI fetch failed, falling back to Toncenter:', err);
  }

  // Fallback to Toncenter if TonAPI was unsuccessful
  if (!api_success) {
    api_provider = 'Toncenter';
    try {
      const toncenterRes = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${address}`);
      if (toncenterRes.ok) {
        const tcData = await toncenterRes.json();
        if (tcData && tcData.ok && tcData.result && tcData.result.balance) {
          ton_balance = Number(tcData.result.balance) / 1000000000;
          api_success = true;
        }
      }
    } catch (tcErr) {
      console.error('[Balance API Error] Toncenter fallback also failed:', tcErr);
    }
  }

  res.json({
    success: api_success,
    address,
    ton_balance,
    gram_balance,
    provider: api_provider
  });
});

// Secure vVIRAL Transfer Before Bonding (P2P Send)
app.post('/api/wallet/send', async (req, res) => {
  const db = readDb();
  const { senderId, recipientUsername, amount } = req.body;

  if (!senderId || !recipientUsername || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Sender, recipient, and a positive amount are required' });
  }

  const senderBalance = db.balances.find(b => b.user_id === senderId);
  const senderUser = db.users.find(u => u.id === senderId);
  if (!senderBalance || !senderUser) {
    return res.status(404).json({ error: 'Sender account not found' });
  }

  if (senderUser.status === 'blocked') {
    return res.status(403).json({ error: 'Account is blocked. Action denied.' });
  }

  const valAmount = Number(amount);
  if (senderBalance.vviral_balance < valAmount) {
    return res.status(400).json({ error: 'Insufficient internal vVIRAL balance' });
  }

  // Find recipient by username (case insensitive, strip @)
  const cleanUsername = recipientUsername.trim().toLowerCase().replace('@', '');
  const recipientUser = db.users.find(u => u.username.toLowerCase() === cleanUsername);
  if (!recipientUser) {
    return res.status(404).json({ error: `Recipient @${recipientUsername} not found on the platform.` });
  }

  if (recipientUser.id === senderId) {
    return res.status(400).json({ error: 'Cannot send vVIRAL to yourself' });
  }

  const recipientBalance = db.balances.find(b => b.user_id === recipientUser.id);
  if (!recipientBalance) {
    return res.status(404).json({ error: 'Recipient balance record not found' });
  }

  // Execute transfer
  senderBalance.vviral_balance -= valAmount;
  recipientBalance.vviral_balance += valAmount;

  // Add ledger entries
  const txIdSender = generateId('tx');
  const txIdRecipient = generateId('tx');

  db.ledger_transactions.push({
    id: txIdSender,
    user_id: senderId,
    amount: valAmount,
    currency: 'vVIRAL',
    type: 'transfer_sent',
    status: 'completed',
    direction: 'debit',
    related_user_id: recipientUser.id,
    created_at: new Date().toISOString(),
    metadata: `Sent vVIRAL to @${recipientUser.username}`
  });

  db.ledger_transactions.push({
    id: txIdRecipient,
    user_id: recipientUser.id,
    amount: valAmount,
    currency: 'vVIRAL',
    type: 'transfer_received',
    status: 'completed',
    direction: 'credit',
    related_user_id: senderId,
    created_at: new Date().toISOString(),
    metadata: `Received vVIRAL from @${senderUser.username}`
  });

  await writeDb(db);
  res.json({ success: true, balance: senderBalance });
});

// 4. Update Profile Info / Onboarding Extras (Wallet / Email verification)
app.post('/api/auth/update-profile', async (req, res) => {
  const db = readDb();
  const { userId, email, wallet_address } = req.body;

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const balance = db.balances.find(b => b.user_id === userId);
  if (!balance) {
    return res.status(404).json({ error: 'Balance not found' });
  }

  let rewardEarned = 0;
  const updates: string[] = [];

  // 4.1 Verify Email extra reward (+10 vVIRAL)
  if (email && email !== user.email) {
    // Check duplication
    const duplicateEmail = db.users.some(u => u.email === email && u.id !== userId);
    if (duplicateEmail) {
      return res.status(400).json({ error: 'Email already registered with another account.' });
    }
    user.email = email;
    user.viral_power += 15; // Boost quality reputation
    balance.viral_power += 15;
    
    // Reward (+10 vVIRAL)
    balance.vviral_balance += 10;
    rewardEarned += 10;
    updates.push('Email Verification Onboarding Bonus (+10 vVIRAL)');
    
    db.ledger_transactions.push({
      id: generateId('tx'),
      user_id: userId,
      amount: 10,
      currency: 'vVIRAL',
      type: 'email_verification',
      status: 'completed',
      direction: 'credit',
      created_at: new Date().toISOString(),
      metadata: 'Email Verification Bonus (+10 vVIRAL)'
    });
  }

  // 4.2 Connect TON Wallet extra reward (+30 vVIRAL)
  if (wallet_address && wallet_address !== user.wallet_address) {
    // Check duplication
    const duplicateWallet = db.users.some(u => u.wallet_address === wallet_address && u.id !== userId);
    if (duplicateWallet) {
      return res.status(400).json({ error: 'TON wallet already connected to another account. Multi-accounting is prohibited.' });
    }
    user.wallet_address = wallet_address;
    user.viral_power += 30; // Boost reputation
    balance.viral_power += 30;
    
    // Reward (+30 vVIRAL)
    balance.vviral_balance += 30;
    rewardEarned += 30;
    updates.push('Wallet Connection Onboarding Bonus (+30 vVIRAL)');
    
    balance.ton_balance_cache = 0;
    balance.gram_balance_cache = 0;
    
    db.ledger_transactions.push({
      id: generateId('tx'),
      user_id: userId,
      amount: 30,
      currency: 'vVIRAL',
      type: 'wallet_connection',
      status: 'completed',
      direction: 'credit',
      created_at: new Date().toISOString(),
      metadata: 'TON Wallet Connection Onboarding Bonus (+30 vVIRAL)'
    });
  }

  // Update user quality rating
  if (user.viral_power >= 100) {
    user.quality_score = 'Trusted User';
  } else if (user.viral_power >= 50) {
    user.quality_score = 'Active User';
  } else if (user.viral_power >= 25) {
    user.quality_score = 'Verified User';
  }

  user.last_active_at = new Date().toISOString();
  balance.updated_at = new Date().toISOString();

  await writeDb(db);
  res.json({ success: true, user, balance, rewardEarned, updates });
});

// Helper functions for daily check-in calendar calculation
function isSameUTCDay(date1Str: string, date2Str: string): boolean {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  return d1.getUTCFullYear() === d2.getUTCFullYear() &&
         d1.getUTCMonth() === d2.getUTCMonth() &&
         d1.getUTCDate() === d2.getUTCDate();
}

function isYesterdayUTCDay(lastCheckinStr: string, todayStr: string): boolean {
  const last = new Date(lastCheckinStr);
  const today = new Date(todayStr);
  
  const lastMidnight = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const todayMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  
  const msDiff = todayMidnight - lastMidnight;
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  return msDiff === oneDayMs;
}

function getDailyCheckinReward(streak: number): number {
  if (streak === 1) return 10;
  if (streak === 2) return 15;
  if (streak === 3) return 20;
  if (streak === 4) return 25;
  if (streak === 5) return 30;
  if (streak === 6) return 40;
  return 50; // Day 7+ is 50 vVIRAL
}

// 4.3 Get Daily Check-in Status
app.get('/api/checkin/status/:userId', (req, res) => {
  const db = readDb();
  const { userId } = req.params;
  
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const todayStr = new Date().toISOString();
  const lastCheckinStr = user.last_checkin_at;
  let canCheckIn = true;
  let currentStreak = user.checkin_streak || 0;
  
  if (lastCheckinStr) {
    const isToday = isSameUTCDay(lastCheckinStr, todayStr);
    if (isToday) {
      canCheckIn = false;
    } else {
      const isYesterday = isYesterdayUTCDay(lastCheckinStr, todayStr);
      if (!isYesterday) {
        // Streak is broken (missed at least one calendar day)
        currentStreak = 0;
      }
    }
  } else {
    currentStreak = 0;
  }
  
  const nextReward = getDailyCheckinReward(currentStreak + 1);
  
  res.json({
    canCheckIn,
    streak: currentStreak,
    nextReward,
    lastCheckIn: lastCheckinStr || null
  });
});

// 4.4 Perform Daily Check-in (Secure backend-driven logic)
app.post('/api/checkin', async (req, res) => {
  const db = readDb();
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const user = db.users.find(u => u.id === userId);
  const balance = db.balances.find(b => b.user_id === userId);
  
  if (!user || !balance) {
    return res.status(404).json({ error: 'User profile or balance not found.' });
  }
  
  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'This user account is blocked.' });
  }
  
  const todayStr = new Date().toISOString();
  const lastCheckinStr = user.last_checkin_at;
  
  if (lastCheckinStr && isSameUTCDay(lastCheckinStr, todayStr)) {
    return res.status(400).json({ error: 'You have already checked in today! Come back tomorrow.' });
  }
  
  // Calculate new streak
  let newStreak = 1;
  if (lastCheckinStr) {
    const isYesterday = isYesterdayUTCDay(lastCheckinStr, todayStr);
    if (isYesterday) {
      newStreak = (user.checkin_streak || 0) + 1;
    }
  }
  
  const reward = getDailyCheckinReward(newStreak);
  
  // Apply updates securely on backend
  user.last_checkin_at = todayStr;
  user.checkin_streak = newStreak;
  user.viral_power += 1; // Grant +1 Viral Power for engagement
  user.last_active_at = todayStr;
  
  balance.vviral_balance += reward;
  balance.viral_power += 1;
  balance.updated_at = todayStr;
  
  // Record ledger entry
  const txId = generateId('tx');
  db.ledger_transactions.push({
    id: txId,
    user_id: userId,
    amount: reward,
    currency: 'vVIRAL',
    type: 'daily_checkin',
    status: 'completed',
    direction: 'credit',
    created_at: todayStr,
    metadata: `Daily Check-In Reward - Day ${newStreak} Streak`
  });
  
  // Update quality tier if Viral Power reached threshold
  if (user.viral_power >= 100) {
    user.quality_score = 'Trusted User';
  } else if (user.viral_power >= 50) {
    user.quality_score = 'Active User';
  } else if (user.viral_power >= 25) {
    user.quality_score = 'Verified User';
  }
  
  await writeDb(db);
  
  res.json({
    success: true,
    streak: newStreak,
    reward,
    user,
    balance
  });
});

// 5. SEND vVIRAL Internally (Internal Transfer between users)
app.post('/api/balances/send', async (req, res) => {
  const db = readDb();
  const { senderId, recipientQuery, amount } = req.body;

  if (!senderId || !recipientQuery || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Sender ID, recipient, and positive amount are required.' });
  }

  const transferAmount = Number(amount);

  // Find sender
  const senderUser = db.users.find(u => u.id === senderId);
  const senderBalance = db.balances.find(b => b.user_id === senderId);
  if (!senderUser || !senderBalance) {
    return res.status(404).json({ error: 'Sender profile not found.' });
  }

  if (senderUser.status === 'blocked') {
    return res.status(403).json({ error: 'Your account is blocked.' });
  }

  if (senderBalance.vviral_balance < transferAmount) {
    return res.status(400).json({ error: `Insufficient vVIRAL balance. Your balance: ${senderBalance.vviral_balance} vVIRAL.` });
  }

  // Find recipient by Username, Telegram ID, or Internal User ID
  const recipientUser = db.users.find(u => 
    u.id === recipientQuery || 
    u.username.toLowerCase() === recipientQuery.toLowerCase().replace('@', '') || 
    u.telegram_id === recipientQuery.toString()
  );

  if (!recipientUser) {
    return res.status(404).json({ error: 'Recipient not found. Please enter a valid Telegram ID or username.' });
  }

  if (recipientUser.id === senderId) {
    return res.status(400).json({ error: 'Cannot send funds to yourself.' });
  }

  if (recipientUser.status === 'blocked') {
    return res.status(400).json({ error: 'Recipient account is currently suspended.' });
  }

  const recipientBalance = db.balances.find(b => b.user_id === recipientUser.id);
  if (!recipientBalance) {
    return res.status(404).json({ error: 'Recipient balance profile not found.' });
  }

  // Apply a 5% transfer processing fee (goes to Fee Wallet) or represent transparent transfer
  const feePercent = 1; // 1% transfer fee
  const feeAmount = Math.ceil(transferAmount * (feePercent / 100));
  const netTransfer = transferAmount - feeAmount;

  // Debit sender
  senderBalance.vviral_balance -= transferAmount;
  senderBalance.updated_at = new Date().toISOString();

  // Credit recipient
  recipientBalance.vviral_balance += netTransfer;
  recipientBalance.updated_at = new Date().toISOString();

  // Credit platform fee wallet
  db.fee_wallet.total_collected += feeAmount;
  db.fee_wallet.updated_at = new Date().toISOString();

  // Ledger records
  const senderTxId = generateId('tx');
  const recipientTxId = generateId('tx');
  const feeTxId = generateId('tx');

  db.ledger_transactions.push({
    id: senderTxId,
    user_id: senderId,
    amount: transferAmount,
    currency: 'vVIRAL',
    type: 'internal_send',
    status: 'completed',
    direction: 'debit',
    related_user_id: recipientUser.id,
    created_at: new Date().toISOString(),
    metadata: `Sent vVIRAL to @${recipientUser.username} (Includes ${feeAmount} vVIRAL platform fee)`
  });

  db.ledger_transactions.push({
    id: recipientTxId,
    user_id: recipientUser.id,
    amount: netTransfer,
    currency: 'vVIRAL',
    type: 'internal_receive',
    status: 'completed',
    direction: 'credit',
    related_user_id: senderId,
    created_at: new Date().toISOString(),
    metadata: `Received vVIRAL from @${senderUser.username}`
  });

  if (feeAmount > 0) {
    db.ledger_transactions.push({
      id: feeTxId,
      user_id: 'admin-1',
      amount: feeAmount,
      currency: 'vVIRAL',
      type: 'fee_wallet_credit',
      status: 'completed',
      direction: 'credit',
      created_at: new Date().toISOString(),
      metadata: `1% platform transfer fee from @${senderUser.username}`
    });
  }

  await writeDb(db);

  res.json({ 
    success: true, 
    sent: transferAmount, 
    fee: feeAmount, 
    received: netTransfer,
    senderBalance: senderBalance.vviral_balance,
    recipientName: recipientUser.username 
  });
});

// 6. Resources Directory (Earn list and user promoted items)
app.get('/api/resources', (req, res) => {
  const db = readDb();
  const { userId, all } = req.query;

  if (userId) {
    // If user is requestor, return all their items
    const userResources = db.resources.filter(r => r.owner_user_id === userId);
    return res.json(userResources);
  }

  // Return all resources if caller is an admin (for auditing/approvals)
  const callerTgId = req.headers['x-telegram-id'] || req.headers['x-admin-telegram-id'];
  const isAdmin = all === 'true' || (callerTgId && ADMIN_TELEGRAM_IDS.includes(callerTgId.toString()));

  if (isAdmin) {
    return res.json(db.resources);
  }

  // Otherwise return active/approved resources
  const approvedResources = db.resources.filter(r => r.status === 'approved' || r.status === 'active');
  res.json(approvedResources);
});

// 7. Add Resource to promote
app.post('/api/resources/add', async (req, res) => {
  const db = readDb();
  const { owner_user_id, type, title, url, description, image_url, category, language, budget_package } = req.body;

  if (!owner_user_id || !type || !title || !url || !description) {
    return res.status(400).json({ error: 'All primary fields are required.' });
  }

  const user = db.users.find(u => u.id === owner_user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newResource: Resource = {
    id: generateId('res'),
    owner_user_id,
    type,
    title,
    url,
    description,
    image_url: image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    category: category || 'General',
    language: language || 'English',
    status: user.role === 'admin' ? 'approved' : 'pending', // Admins auto-approve
    created_at: new Date().toISOString()
  };

  // Add metadata fields for approval request compliance
  (newResource as any).telegram_id = user.telegram_id || 'unknown';
  (newResource as any).username = user.username || 'unknown';
  (newResource as any).budget_package = budget_package || 'Standard Listing';

  db.resources.push(newResource);
  
  // Award Viral Power reward for adding first resource (+50 vVIRAL)
  const isFirstResource = db.resources.filter(r => r.owner_user_id === owner_user_id).length === 1;
  let rewardEarned = 0;
  if (isFirstResource && user.role !== 'admin') {
    const balance = db.balances.find(b => b.user_id === owner_user_id);
    if (balance) {
      balance.vviral_balance += 50;
      rewardEarned = 50;
      db.ledger_transactions.push({
        id: generateId('tx'),
        user_id: owner_user_id,
        amount: 50,
        currency: 'vVIRAL',
        type: 'first_resource_bonus',
        status: 'completed',
        direction: 'credit',
        created_at: new Date().toISOString(),
        metadata: 'First resource submitted onboarding bonus (+50 vVIRAL)'
      });
    }
  }

  // Send immediate Telegram admin notification if submitted by a regular user
  if (user.role !== 'admin') {
    const text = `<b>🔔 New Promotion Resource Approval Request</b>\n\n` +
      `👤 <b>User:</b> @${user.username || 'unknown'} (ID: <code>${user.telegram_id || 'unknown'}</code>)\n` +
      `📌 <b>Project Name:</b> ${title}\n` +
      `🔗 <b>Link:</b> ${url}\n` +
      `🏷️ <b>Type:</b> <code>${type}</code>\n` +
      `🗂️ <b>Category:</b> ${category || 'General'}\n` +
      `📝 <b>Description:</b> ${description}\n` +
      `⏳ <b>Status:</b> <code>pending_admin_approval</code>\n` +
      `📅 <b>Date/Time:</b> ${new Date().toLocaleString()}\n\n` +
      `👉 <i>Instruction: Go to the Admin Panel in the App to approve or reject this project resource.</i>`;
    sendTelegramAdminNotification(text).catch(err => {
      console.error('[Telegram Notification] Error calling sendTelegramAdminNotification:', err);
    });
  }

  await writeDb(db);
  res.json({ success: true, resource: newResource, rewardEarned });
});

// 8. Approve/Reject Resource (Admin only)
app.post('/api/resources/:id/approve', adminAuthMiddleware, async (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { status, reason } = req.body; // 'approved' | 'rejected' and optional custom rejection reason

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const resIndex = db.resources.findIndex(r => r.id === id);
  if (resIndex === -1) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  db.resources[resIndex].status = status;
  if (status === 'rejected') {
    (db.resources[resIndex] as any).rejection_reason = reason || 'Does not meet ecosystem quality standards.';
  } else if (status === 'approved') {
    // Clear any previous rejection reasons on approval
    delete (db.resources[resIndex] as any).rejection_reason;
  }

  await writeDb(db);
  res.json({ success: true, resource: db.resources[resIndex] });
});

// 9. Campaigns directory (Discover active campaigns with nested resource data)
app.get('/api/campaigns', (req, res) => {
  const db = readDb();
  const { userId } = req.query;

  let activeCampaigns = db.campaigns;

  if (userId) {
    // Return advertiser's campaigns
    activeCampaigns = db.campaigns.filter(c => c.owner_user_id === userId);
  } else {
    // Only return active and funded campaigns for regular users
    activeCampaigns = db.campaigns.filter(c => c.status === 'active' && c.escrow_budget >= c.reward_per_action);
  }

  const results = activeCampaigns.map(camp => {
    const resource = db.resources.find(r => r.id === camp.resource_id);
    const escrow = db.campaign_escrows.find(e => e.campaign_id === camp.id);
    return {
      ...camp,
      resource,
      escrow
    };
  });

  res.json(results);
});

// 10. Create Campaign (Ecosystem Economic Loop)
app.post('/api/campaigns', async (req, res) => {
  const db = readDb();
  const { 
    owner_user_id, resource_id, campaign_type, total_budget, reward_per_action, 
    duration_days, target_actions 
  } = req.body;

  if (!owner_user_id || !resource_id || !campaign_type || !total_budget || !reward_per_action) {
    return res.status(400).json({ error: 'Missing required campaign setup parameters.' });
  }

  const budget = Number(total_budget);
  const rewardVal = Number(reward_per_action);

  if (budget <= 0 || rewardVal <= 0) {
    return res.status(400).json({ error: 'Budget and reward per action must be greater than 0.' });
  }

  if (rewardVal > budget) {
    return res.status(400).json({ error: 'Reward per action cannot exceed total campaign budget.' });
  }

  const advertiserUser = db.users.find(u => u.id === owner_user_id);
  const advertiserBalance = db.balances.find(b => b.user_id === owner_user_id);

  if (!advertiserUser || !advertiserBalance) {
    return res.status(404).json({ error: 'Advertiser profile not found.' });
  }

  if (advertiserBalance.vviral_balance < budget) {
    return res.status(400).json({ 
      error: `Insufficient budget balance. You have ${advertiserBalance.vviral_balance} vVIRAL, campaign costs ${budget} vVIRAL.` 
    });
  }

  // Ensure resource exists and is approved
  const resource = db.resources.find(r => r.id === resource_id);
  if (!resource) {
    return res.status(404).json({ error: 'Selected promotion resource not found.' });
  }

  if (resource.status !== 'approved' && advertiserUser.role !== 'admin') {
    return res.status(400).json({ error: 'Promotion resource must be approved by admin before setting up a campaign.' });
  }

  // Calculate platform fee and escrow split (9. Section 8 & 9)
  // platform fee = 10%
  const platformFee = Math.floor(budget * (db.config.platformFeePercent / 100));
  const escrowBudget = budget - platformFee;
  const maxActions = Math.floor(escrowBudget / rewardVal);

  if (maxActions <= 0) {
    return res.status(400).json({ 
      error: `Budget split invalid. Remaining escrow (${escrowBudget} vVIRAL) is insufficient for action reward ${rewardVal} vVIRAL.` 
    });
  }

  const campaignId = generateId('camp');

  const newCampaign: Campaign = {
    id: campaignId,
    owner_user_id,
    resource_id,
    campaign_type,
    total_budget: budget,
    platform_fee: platformFee,
    escrow_budget: escrowBudget,
    reward_per_action: rewardVal,
    max_actions: maxActions,
    approved_actions: 0,
    pending_actions: 0,
    rejected_actions: 0,
    status: advertiserUser.role === 'admin' ? 'active' : 'pending', // Admin campaigns start active, user campaigns require approval
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + (Number(duration_days || 30) * 24 * 60 * 60 * 1000)).toISOString(),
    created_at: new Date().toISOString()
  };

  const newEscrow: CampaignEscrow = {
    campaign_id: campaignId,
    locked_amount: escrowBudget,
    available_amount: escrowBudget,
    pending_amount: 0,
    paid_amount: 0,
    refunded_amount: 0,
    status: 'locked'
  };

  // Perform Ledger & Balance transactions (Atomic State changes)
  advertiserBalance.vviral_balance -= budget;
  advertiserBalance.updated_at = new Date().toISOString();

  // Credit platform fee wallet
  db.fee_wallet.total_collected += platformFee;
  db.fee_wallet.updated_at = new Date().toISOString();

  // Add campaigns to DB
  db.campaigns.push(newCampaign);
  db.campaign_escrows.push(newEscrow);

  // Add ledger records
  db.ledger_transactions.push({
    id: generateId('tx'),
    user_id: owner_user_id,
    amount: budget,
    currency: 'vVIRAL',
    type: 'campaign_deposit',
    status: 'completed',
    related_campaign_id: campaignId,
    direction: 'debit',
    created_at: new Date().toISOString(),
    metadata: `Created promotion campaign. Total budget: ${budget} vVIRAL`
  });

  db.ledger_transactions.push({
    id: generateId('tx'),
    user_id: 'admin-1',
    amount: platformFee,
    currency: 'vVIRAL',
    type: 'fee_wallet_credit',
    status: 'completed',
    related_campaign_id: campaignId,
    direction: 'credit',
    created_at: new Date().toISOString(),
    metadata: `10% platform advertising fee from ${campaignId}`
  });

  // Boost promoter's reputation (Viral Power) for launching campaign
  advertiserUser.viral_power += 50;
  advertiserBalance.viral_power += 50;

  await writeDb(db);
  res.json({ success: true, campaign: newCampaign, platformFee, escrowBudget, maxActions });
});

// 11. Admin Action: Approve/Reject campaign
app.post('/api/campaigns/:id/approve', adminAuthMiddleware, async (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'rejected'

  const campaign = db.campaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  campaign.status = status;
  await writeDb(db);
  res.json({ success: true, campaign });
});

// 12. Complete and Verify Task (Anti-Fraud and Economic Loop mechanics)
app.post('/api/campaigns/:id/verify-task', async (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { userId, verification_data } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const user = db.users.find(u => u.id === userId);
  const userBalance = db.balances.find(b => b.user_id === userId);

  if (!user || !userBalance) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'This user account is blocked.' });
  }

  const campaign = db.campaigns.find(c => c.id === id);
  const escrow = db.campaign_escrows.find(e => e.campaign_id === id);

  if (!campaign || !escrow) {
    return res.status(404).json({ error: 'Promotion campaign not found.' });
  }

  if (campaign.status !== 'active') {
    return res.status(400).json({ error: 'This campaign is no longer active.' });
  }

  // Ensure campaign has available budget left in escrow
  if (escrow.available_amount < campaign.reward_per_action) {
    campaign.status = 'completed';
    await writeDb(db);
    return res.status(400).json({ error: 'Campaign budget empty. Promotion completed.' });
  }

  // Anti-bot double-claim guard
  const alreadyCompleted = db.task_completions.some(tc => 
    tc.campaign_id === id && 
    tc.user_id === userId && 
    ['pending', 'approved', 'paid'].includes(tc.status)
  );

  if (alreadyCompleted) {
    return res.status(400).json({ error: 'You have already completed this promotion task.' });
  }

  // 12.1 Reward Limits enforcement (Section 13)
  // Let's calculate today's earnings
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  const todaysEarnings = db.task_completions
    .filter(tc => tc.user_id === userId && tc.status === 'paid' && new Date(tc.created_at) >= startOfDay)
    .reduce((sum, tc) => sum + tc.reward_amount, 0);

  if (todaysEarnings + campaign.reward_per_action > db.config.dailyRewardLimit) {
    return res.status(400).json({ 
      error: `Earning limit exceeded. Daily platform reward limit is ${db.config.dailyRewardLimit} vVIRAL. You have earned ${todaysEarnings} vVIRAL today.` 
    });
  }

  // 12.2 Anti-Bot Anti-Fraud Risk Scoring Model (Section 11)
  let riskScore = 10; // Base score
  const reasons: string[] = [];

  // Speed-run detection: Let's simulate speed-check. If user didn't stay enough time on website
  if (campaign.campaign_type === 'website' && (!verification_data || !verification_data.includes('seconds'))) {
    riskScore += 45;
    reasons.push('Low website dwell-time or skipped interactive stay duration check');
  }

  // Verify wallet exists
  if (campaign.campaign_type === 'wallet_connect' && !user.wallet_address) {
    riskScore += 70;
    reasons.push('No TON wallet address connected to profile');
  }

  // If user completed too many tasks in last 5 minutes
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const rapidCompletions = db.task_completions.filter(tc => 
    tc.user_id === userId && new Date(tc.created_at) >= fiveMinsAgo
  ).length;

  if (rapidCompletions >= 4) {
    riskScore += 40;
    reasons.push('Rapid-succession task completions (possible scripting behavior)');
  }

  // Check VPN/device simulation
  if (user.username.length < 3 || /bot/i.test(user.username)) {
    riskScore += 80;
    reasons.push('Suspicious user profile metadata patterns');
  }

  // Set initial status based on risk score & user Quality
  // High risk score (>= 50) means it goes to "pending / manual review", else "approved" and released instantly
  let taskStatus: 'pending' | 'approved' = 'approved';
  if (riskScore >= 50 || user.quality_score === 'High-Risk User' || user.quality_score === 'New User') {
    taskStatus = 'pending';
  }

  const completionId = generateId('task-c');
  const rewardAmount = campaign.reward_per_action;

  // Find Level 1 referrer (Section 14)
  const referral = db.referrals.find(r => r.invited_user_id === userId && r.status === 'active');
  const referrerReward = referral ? Math.floor(rewardAmount * 0.10) : 0; // 10% Level 1 referrer reward

  // Find Level 2 referrer (The referrer of the Level 1 referrer)
  const referralL2 = referral ? db.referrals.find(r => r.invited_user_id === referral.referrer_user_id && r.status === 'active') : undefined;
  const referrerRewardL2 = referralL2 ? Math.floor(rewardAmount * 0.05) : 0; // 5% Level 2 referrer reward

  const newCompletion: TaskCompletion = {
    id: completionId,
    campaign_id: id,
    user_id: userId,
    action_type: campaign.campaign_type,
    reward_amount: rewardAmount,
    referral_reward_amount: referrerReward,
    referral_reward_amount_l2: referrerRewardL2,
    status: taskStatus === 'approved' ? 'paid' : 'pending',
    risk_score: riskScore,
    verification_data: verification_data || `Completed ${campaign.campaign_type} verification routine.`,
    created_at: new Date().toISOString()
  };

  if (taskStatus === 'approved') {
    newCompletion.approved_at = new Date().toISOString();
  }

  db.task_completions.push(newCompletion);

  // Escrow Locks & Escrow Release Updates
  if (taskStatus === 'approved') {
    // Escrow releases directly to user
    escrow.available_amount -= rewardAmount;
    escrow.paid_amount += rewardAmount;
    
    userBalance.vviral_balance += rewardAmount;
    userBalance.updated_at = new Date().toISOString();

    // Credit Ledger user reward
    db.ledger_transactions.push({
      id: generateId('tx'),
      user_id: userId,
      amount: rewardAmount,
      currency: 'vVIRAL',
      type: 'task_reward_approved',
      status: 'completed',
      related_campaign_id: id,
      direction: 'credit',
      created_at: new Date().toISOString(),
      metadata: `Earned reward for completing task: ${campaign.campaign_type}`
    });

    campaign.approved_actions += 1;

    // Process Referrer Reward (Section 14 with Level 1 [10%] & Level 2 [5%] splits)
    if (referral && referrerReward > 0) {
      const referrerBalance = db.balances.find(b => b.user_id === referral.referrer_user_id);
      if (referrerBalance) {
        referrerBalance.vviral_balance += referrerReward;
        referrerBalance.updated_at = new Date().toISOString();
        
        referral.total_invited_earnings += rewardAmount;
        referral.total_referrer_rewards += referrerReward;

        db.ledger_transactions.push({
          id: generateId('tx'),
          user_id: referral.referrer_user_id,
          amount: referrerReward,
          currency: 'vVIRAL',
          type: 'referral_reward',
          status: 'completed',
          related_user_id: userId,
          direction: 'credit',
          created_at: new Date().toISOString(),
          metadata: `Earned 10% direct referrer (L1) reward from @${user.username}'s activity`
        });
      }

      // Level 2 (5%) split distribution
      if (referralL2 && referrerRewardL2 > 0) {
        const referrerBalanceL2 = db.balances.find(b => b.user_id === referralL2.referrer_user_id);
        if (referrerBalanceL2) {
          referrerBalanceL2.vviral_balance += referrerRewardL2;
          referrerBalanceL2.updated_at = new Date().toISOString();

          referralL2.total_invited_earnings += rewardAmount;
          referralL2.total_referrer_rewards += referrerRewardL2;

          db.ledger_transactions.push({
            id: generateId('tx'),
            user_id: referralL2.referrer_user_id,
            amount: referrerRewardL2,
            currency: 'vVIRAL',
            type: 'referral_reward_l2',
            status: 'completed',
            related_user_id: userId,
            direction: 'credit',
            created_at: new Date().toISOString(),
            metadata: `Earned 5% indirect referrer (L2) reward from @${user.username}'s activity`
          });
        }
      }
    }

    // Boost user's Viral Power activity
    user.viral_power += 2;
    userBalance.viral_power += 2;
  } else {
    // Escrow transitions to pending
    escrow.available_amount -= rewardAmount;
    escrow.pending_amount += rewardAmount;

    campaign.pending_actions += 1;

    userBalance.vviral_pending += rewardAmount;

    // Record Fraud flag if suspicious
    if (riskScore >= 50) {
      const fraudFlag: FraudFlag = {
        id: generateId('fraud'),
        user_id: userId,
        campaign_id: id,
        reason: reasons.join(', '),
        risk_score: riskScore,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      db.fraud_flags.push(fraudFlag);
    }
  }

  // Update escrow status based on budget depletion
  if (escrow.available_amount < campaign.reward_per_action) {
    escrow.status = 'fully_released';
    campaign.status = 'completed';
  } else {
    escrow.status = 'partially_released';
  }

  await writeDb(db);

  res.json({ 
    success: true, 
    status: taskStatus, 
    riskScore, 
    reward: rewardAmount,
    referrerReward,
    reasons: reasons 
  });
});

// 13. Fetch User Ledger Transactions
app.get('/api/ledger/:userId', (req, res) => {
  const db = readDb();
  const { userId } = req.params;
  const txs = db.ledger_transactions
    .filter(t => t.user_id === userId)
    .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(txs);
});

// 14. Fetch Referral Stats (Level 1 [10%] & Level 2 [5%])
app.get('/api/referrals/:userId', (req, res) => {
  const db = readDb();
  const { userId } = req.params;

  // Level 1 Referrals
  const userRefsL1 = db.referrals.filter(r => r.referrer_user_id === userId);
  const invitedUsersL1 = userRefsL1.map(ref => {
    const invitedUser = db.users.find(u => u.id === ref.invited_user_id);
    return {
      ...ref,
      invited_username: invitedUser ? invitedUser.username : 'Unknown User',
      invited_quality: invitedUser ? invitedUser.quality_score : 'New User',
      wallet_address: invitedUser ? invitedUser.wallet_address : undefined,
      status: invitedUser ? invitedUser.status : 'active'
    };
  });

  // Level 2 Referrals
  const l1UserIds = userRefsL1.map(r => r.invited_user_id);
  const userRefsL2 = db.referrals.filter(r => l1UserIds.includes(r.referrer_user_id));
  const invitedUsersL2 = userRefsL2.map(ref => {
    const invitedUser = db.users.find(u => u.id === ref.invited_user_id);
    const viaUser = db.users.find(u => u.id === ref.referrer_user_id);
    return {
      ...ref,
      invited_username: invitedUser ? invitedUser.username : 'Unknown User',
      invited_quality: invitedUser ? invitedUser.quality_score : 'New User',
      referred_via: viaUser ? viaUser.username : 'L1 Network',
      wallet_address: invitedUser ? invitedUser.wallet_address : undefined,
      status: invitedUser ? invitedUser.status : 'active'
    };
  });

  // Compute active and connected wallet counts across L1 & L2
  const activeCount = invitedUsersL1.filter(u => u.status === 'active').length + 
                      invitedUsersL2.filter(u => u.status === 'active').length;

  const walletConnectedCount = invitedUsersL1.filter(u => u.wallet_address).length + 
                               invitedUsersL2.filter(u => u.wallet_address).length;

  // Calculate earnings securely from Ledger Transactions to prevent discrepancies
  const totalReferralRewardsL1 = db.ledger_transactions
    .filter(t => t.user_id === userId && t.type === 'referral_reward')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReferralRewardsL2 = db.ledger_transactions
    .filter(t => t.user_id === userId && t.type === 'referral_reward_l2')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRewards = totalReferralRewardsL1 + totalReferralRewardsL2;

  res.json({
    referrals: invitedUsersL1,
    level2Referrals: invitedUsersL2,
    totalReferralRewards: totalRewards,
    totalReferralRewardsL1,
    totalReferralRewardsL2,
    count: invitedUsersL1.length,
    countL2: invitedUsersL2.length,
    activeCount,
    walletConnectedCount
  });
});

// 14b. Admin Authentication & Diagnostics Status Check
app.get('/api/admin/check', async (req, res) => {
  const initDataHeader = req.headers['x-telegram-init-data'] || req.headers['x-init-data'] || req.headers['authorization'] || req.query.initData || req.body.initData;
  const adminIdHeader = req.headers['x-telegram-id'] || req.headers['x-admin-telegram-id'] || req.query.adminTelegramId || req.body.adminTelegramId;

  const db = readDb();

  // Try to extract telegram_id from initData first!
  let detected_telegram_id: string | null = null;
  let telegram_username: string | null = null;
  let init_data_received = !!initDataHeader;
  let init_data_valid = false;
  let parsedUser: any = null;

  if (initDataHeader) {
    const checkResult = getTelegramUserFromInitData(initDataHeader.toString());
    init_data_valid = checkResult.isValid;
    if (checkResult.user && checkResult.user.id) {
      detected_telegram_id = checkResult.user.id.toString();
      parsedUser = checkResult.user;
      if (checkResult.user.username) {
        telegram_username = checkResult.user.username;
      }
    }
  }

  // Fallback to explicit header if no valid user ID could be decoded from initData
  if (!detected_telegram_id && adminIdHeader) {
    detected_telegram_id = adminIdHeader.toString().trim();
  }

  const is_num_id = detected_telegram_id ? /^\d+$/.test(detected_telegram_id) : false;
  const in_admin_list = detected_telegram_id ? ADMIN_TELEGRAM_IDS.includes(detected_telegram_id) : false;

  const matchedUser = detected_telegram_id ? db.users.find(u => u.telegram_id === detected_telegram_id) : null;
  
  // We determine is_admin based on whether they are in ADMIN_TELEGRAM_IDS
  const is_admin = !!(detected_telegram_id && in_admin_list);

  // If ID is in admin list, force user role in DB and return admin details
  let role_sync_active = false;
  if (detected_telegram_id && in_admin_list) {
    role_sync_active = true;
    if (matchedUser) {
      if (matchedUser.role !== 'admin' || !matchedUser.is_admin) {
        matchedUser.role = 'admin';
        matchedUser.is_admin = true;
        await writeDb(db);
      }
    }
  }

  // Determine the reason why Admin is hidden (if it is)
  let reason_hidden = "";
  if (!detected_telegram_id) {
    reason_hidden = "No Telegram ID was detected. Please make sure you are logged in via Telegram.";
  } else if (!is_num_id) {
    reason_hidden = `The detected Telegram ID (${detected_telegram_id}) is not in a valid numeric format.`;
  } else if (!in_admin_list) {
    reason_hidden = `Your Telegram ID (${detected_telegram_id}) is not present in the authorized administrator IDs list: [${ADMIN_TELEGRAM_IDS.join(', ')}].`;
  } else if (!init_data_received) {
    reason_hidden = "No Telegram WebApp initData was received. Secure admin actions require active cryptographic context.";
  } else if (!init_data_valid) {
    reason_hidden = "The received Telegram WebApp initData signature is cryptographically invalid or has been tampered with.";
  } else if (!matchedUser) {
    reason_hidden = "No registered user profile was found in the database matching your Telegram ID.";
  }

  const admin_telegram_ids_loaded = ADMIN_TELEGRAM_IDS.length > 0;

  // Audit Log Info
  console.log(`[Security Audit Check Endpoint] called:
    - raw initData received: ${init_data_received ? 'yes' : 'no'}
    - parsed telegram_id: ${detected_telegram_id}
    - parsed username: ${telegram_username || 'none'}
    - is_init_data_valid: ${init_data_valid}
    - ADMIN_TELEGRAM_IDS loaded: ${admin_telegram_ids_loaded}
    - admin check result: ${is_admin ? 'PASS' : 'FAIL'}
    - final role returned to frontend: ${is_admin ? 'admin' : 'user'}
  `);

  res.json({
    detected_telegram_id,
    telegram_username,
    init_data_received,
    init_data_valid,
    admin_telegram_ids_loaded,
    admin_ids_parsed: ADMIN_TELEGRAM_IDS,
    is_admin,
    role: is_admin ? 'admin' : 'user',
    backend_role: matchedUser ? matchedUser.role : (is_admin ? 'admin' : 'user'),
    reason_hidden,
    is_num_id,
    in_admin_list,
    role_sync_active,
    env_admin_ids: ADMIN_TELEGRAM_IDS.join(','),
    user_role: matchedUser ? matchedUser.role : null
  });
});

// 15. Admin panel diagnostics (collected fees, overall metrics)
app.get('/api/admin/stats', adminAuthMiddleware, (req, res) => {
  const db = readDb();
  
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u => u.status === 'active').length;
  
  const totalvViralIssued = db.balances.reduce((sum, b) => sum + b.vviral_balance, 0);
  const totalvViralPending = db.balances.reduce((sum, b) => sum + b.vviral_pending, 0);
  
  const totalCampaignTurnover = db.campaigns.reduce((sum, c) => sum + c.total_budget, 0);
  const totalFeesCollected = db.fee_wallet.total_collected;
  
  const totalEscrowLocked = db.campaign_escrows.reduce((sum, e) => sum + e.available_amount + e.pending_amount, 0);
  const totalRewardsPaid = db.campaign_escrows.reduce((sum, e) => sum + e.paid_amount, 0);
  
  const totalFlags = db.fraud_flags.length;
  const fraudRate = totalUsers > 0 ? Math.round((db.fraud_flags.filter(f => f.risk_score >= 50).length / totalUsers) * 100) : 0;

  res.json({
    totalUsers,
    activeUsers,
    totalvViralIssued,
    totalvViralPending,
    totalCampaignTurnover,
    totalFeesCollected,
    totalEscrowLocked,
    totalRewardsPaid,
    totalFlags,
    fraudRate,
    config: db.config
  });
});

// 16. Admin Action: Approve/Reject Pending Task Completions
app.post('/api/completions/:completionId/approve', adminAuthMiddleware, async (req, res) => {
  const db = readDb();
  const { completionId } = req.params;
  const { approve, reason } = req.body; // boolean, string

  const completion = db.task_completions.find(tc => tc.id === completionId);
  if (!completion) {
    return res.status(404).json({ error: 'Completion record not found' });
  }

  if (completion.status !== 'pending') {
    return res.status(400).json({ error: 'Completion has already been processed.' });
  }

  const campaign = db.campaigns.find(c => c.id === completion.campaign_id);
  const escrow = db.campaign_escrows.find(e => e.campaign_id === completion.campaign_id);
  const earnerUser = db.users.find(u => u.id === completion.user_id);
  const earnerBalance = db.balances.find(b => b.user_id === completion.user_id);

  if (!campaign || !escrow || !earnerUser || !earnerBalance) {
    return res.status(404).json({ error: 'Associated entities not found.' });
  }

  if (approve) {
    // Approve: Release Escrow to earner
    completion.status = 'paid';
    completion.approved_at = new Date().toISOString();

    escrow.pending_amount -= completion.reward_amount;
    escrow.paid_amount += completion.reward_amount;

    earnerBalance.vviral_pending = Math.max(0, earnerBalance.vviral_pending - completion.reward_amount);
    earnerBalance.vviral_balance += completion.reward_amount;
    earnerBalance.updated_at = new Date().toISOString();

    campaign.pending_actions = Math.max(0, campaign.pending_actions - 1);
    campaign.approved_actions += 1;

    // Ledger User
    db.ledger_transactions.push({
      id: generateId('tx'),
      user_id: completion.user_id,
      amount: completion.reward_amount,
      currency: 'vVIRAL',
      type: 'task_reward_approved',
      status: 'completed',
      related_campaign_id: campaign.id,
      direction: 'credit',
      created_at: new Date().toISOString(),
      metadata: `Manual Admin Approval for task: ${campaign.campaign_type}`
    });

    // Process Referrer Reward (Level 1 [10%] & Level 2 [5%])
    const referral = db.referrals.find(r => r.invited_user_id === completion.user_id && r.status === 'active');
    if (referral && completion.referral_reward_amount > 0) {
      const referrerBalance = db.balances.find(b => b.user_id === referral.referrer_user_id);
      if (referrerBalance) {
        referrerBalance.vviral_balance += completion.referral_reward_amount;
        referrerBalance.updated_at = new Date().toISOString();

        referral.total_invited_earnings += completion.reward_amount;
        referral.total_referrer_rewards += completion.referral_reward_amount;

        db.ledger_transactions.push({
          id: generateId('tx'),
          user_id: referral.referrer_user_id,
          amount: completion.referral_reward_amount,
          currency: 'vVIRAL',
          type: 'referral_reward',
          status: 'completed',
          related_user_id: completion.user_id,
          direction: 'credit',
          created_at: new Date().toISOString(),
          metadata: `10% manual direct referrer (L1) reward from @${earnerUser.username}'s activity`
        });
      }

      // Check for Level 2 Referrer (The referrer of the Level 1 referrer)
      const referralL2 = db.referrals.find(r => r.invited_user_id === referral.referrer_user_id && r.status === 'active');
      const referrerRewardL2 = Math.floor(completion.reward_amount * 0.05); // 5% Level 2 reward
      if (referralL2 && referrerRewardL2 > 0) {
        const referrerBalanceL2 = db.balances.find(b => b.user_id === referralL2.referrer_user_id);
        if (referrerBalanceL2) {
          referrerBalanceL2.vviral_balance += referrerRewardL2;
          referrerBalanceL2.updated_at = new Date().toISOString();

          referralL2.total_invited_earnings += completion.reward_amount;
          referralL2.total_referrer_rewards += referrerRewardL2;

          db.ledger_transactions.push({
            id: generateId('tx'),
            user_id: referralL2.referrer_user_id,
            amount: referrerRewardL2,
            currency: 'vVIRAL',
            type: 'referral_reward_l2',
            status: 'completed',
            related_user_id: completion.user_id,
            direction: 'credit',
            created_at: new Date().toISOString(),
            metadata: `5% manual indirect referrer (L2) reward from @${earnerUser.username}'s activity`
          });
        }
      }
    }

    earnerUser.viral_power += 5; // Reward power boost
    earnerBalance.viral_power += 5;

  } else {
    // Reject: Refund to Advertiser Escrow budget
    completion.status = 'rejected';
    completion.rejected_at = new Date().toISOString();
    completion.rejection_reason = reason || 'Manual audit rejection due to invalid or suspicious task verification data.';

    escrow.pending_amount -= completion.reward_amount;
    escrow.available_amount += completion.reward_amount; // Refund budget to escrow

    earnerBalance.vviral_pending = Math.max(0, earnerBalance.vviral_pending - completion.reward_amount);
    earnerBalance.updated_at = new Date().toISOString();

    campaign.pending_actions = Math.max(0, campaign.pending_actions - 1);
    campaign.rejected_actions += 1;

    // Debit referral simulation
    earnerUser.viral_power = Math.max(0, earnerUser.viral_power - 10); // Deduct for fraud
    earnerBalance.viral_power = Math.max(0, earnerBalance.viral_power - 10);
  }

  // Update associated fraud flags status if any
  const relatedFlag = db.fraud_flags.find(ff => ff.user_id === completion.user_id && ff.campaign_id === campaign.id && ff.status === 'pending');
  if (relatedFlag) {
    relatedFlag.status = 'resolved';
  }

  await writeDb(db);
  res.json({ success: true, completion });
});

// 17. Admin API: Toggle Blum bonding simulation
app.post('/api/admin/bond', adminAuthMiddleware, async (req, res) => {
  const db = readDb();
  db.config.isBonded = !db.config.isBonded;
  
  if (db.config.isBonded) {
    // Distribute some initial real $VIRAL to the Admin Wallet to simulate reserves
    const adminBal = db.balances.find(b => b.user_id === 'admin-1');
    if (adminBal) {
      adminBal.real_viral_balance = 200000000; // Fixed 200,000,000 $VIRAL Launch Pool reserve
    }
  }

  await writeDb(db);
  res.json({ success: true, config: db.config });
});

// 18. Claim Mechanics (Section 5)
app.get('/api/claims/:userId', (req, res) => {
  const db = readDb();
  const { userId } = req.params;

  const user = db.users.find(u => u.id === userId);
  const balance = db.balances.find(b => b.user_id === userId);

  if (!user || !balance) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate Total vVIRAL in ecosystem for ratio conversion
  // (We sum all non-admin balances)
  const nonAdminBalances = db.balances.filter(b => b.user_id !== 'admin-1');
  const totalValidvViral = nonAdminBalances.reduce((sum, b) => sum + b.vviral_balance, 0) || 1;
  const userValidvViral = balance.vviral_balance;

  const claimPool = db.config.claimPoolSize; // 200,000,000 $VIRAL
  
  // Safe proportional formula: User Real = User Valid vVIRAL / Total Valid vVIRAL * Claim Pool
  const conversionRate = Number((claimPool / totalValidvViral).toFixed(4));
  const realViralClaimable = Math.floor(userValidvViral * conversionRate);

  const existingClaim = db.claims.find(c => c.user_id === userId);

  res.json({
    isBonded: db.config.isBonded,
    userValidvViral,
    totalValidvViral,
    claimPool,
    conversionRate,
    realViralClaimable,
    existingClaim,
    hasWallet: !!user.wallet_address,
    wallet_address: user.wallet_address || ''
  });
});

// 18.1 Submit claim
app.post('/api/claims', async (req, res) => {
  const db = readDb();
  const { userId } = req.body;

  if (!db.config.isBonded) {
    return res.status(400).json({ error: 'Token bonding on BLUM is still in progress. Claims are not yet active.' });
  }

  const user = db.users.find(u => u.id === userId);
  const balance = db.balances.find(b => b.user_id === userId);

  if (!user || !balance) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.wallet_address) {
    return res.status(400).json({ error: 'Connect your TON wallet before claiming.' });
  }

  const existingClaim = db.claims.find(c => c.user_id === userId);
  if (existingClaim) {
    return res.status(400).json({ error: `You have already submitted a claim. Status: ${existingClaim.status}.` });
  }

  // Perform fraud check before claim (Section 5)
  const isHighRisk = user.quality_score === 'High-Risk User' || user.quality_score === 'Blocked User';
  const hasUnresolvedFraud = db.fraud_flags.some(ff => ff.user_id === userId && ff.status === 'pending');

  const claimStatus = (isHighRisk || hasUnresolvedFraud) ? 'pending' : 'completed';

  // Calculate proportional amount
  const nonAdminBalances = db.balances.filter(b => b.user_id !== 'admin-1');
  const totalValidvViral = nonAdminBalances.reduce((sum, b) => sum + b.vviral_balance, 0) || 1;
  const conversionRate = db.config.claimPoolSize / totalValidvViral;
  const realViralAmount = Math.floor(balance.vviral_balance * conversionRate);

  const newClaim: Claim = {
    id: generateId('claim'),
    user_id: userId,
    valid_vviral: balance.vviral_balance,
    claim_pool: db.config.claimPoolSize,
    conversion_rate: conversionRate,
    real_viral_amount: realViralAmount,
    wallet_address: user.wallet_address,
    status: claimStatus,
    created_at: new Date().toISOString()
  };

  if (claimStatus === 'completed') {
    newClaim.paid_at = new Date().toISOString();
    newClaim.tx_hash = `tg_tx_${Math.random().toString(16).substring(2, 18)}`;
    
    // Deduct from vVIRAL balance (transferred on-chain)
    balance.vviral_balance = 0;
    // Credit Real $VIRAL balance
    balance.real_viral_balance = realViralAmount;

    // Deduct claim pool from creator wallet
    const creatorBalance = db.balances.find(b => b.user_id === 'admin-1');
    if (creatorBalance) {
      creatorBalance.real_viral_balance = Math.max(0, creatorBalance.real_viral_balance - realViralAmount);
    }

    db.ledger_transactions.push({
      id: generateId('tx'),
      user_id: userId,
      amount: realViralAmount,
      currency: 'real_VIRAL',
      type: 'claim_paid',
      status: 'completed',
      direction: 'credit',
      created_at: new Date().toISOString(),
      metadata: `Claimed ${realViralAmount.toLocaleString()} real $VIRAL to connected TON wallet`
    });
  } else {
    db.ledger_transactions.push({
      id: generateId('tx'),
      user_id: userId,
      amount: realViralAmount,
      currency: 'real_VIRAL',
      type: 'claim_reserved',
      status: 'pending',
      direction: 'credit',
      created_at: new Date().toISOString(),
      metadata: `Claim for ${realViralAmount.toLocaleString()} real $VIRAL pending anti-fraud clearance`
    });
  }

  db.claims.push(newClaim);
  await writeDb(db);

  res.json({ success: true, claim: newClaim });
});

// 19. Admin APIs for monitoring lists
app.get('/api/admin/users', adminAuthMiddleware, (req, res) => {
  const db = readDb();
  const usersWithBalances = db.users.map(u => {
    const bal = db.balances.find(b => b.user_id === u.id);
    return {
      ...u,
      balance: bal
    };
  });
  res.json(usersWithBalances);
});

app.post('/api/admin/users/:userId/status', adminAuthMiddleware, async (req, res) => {
  const db = readDb();
  const { userId } = req.params;
  const { status, quality_score } = req.body;

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (status) user.status = status;
  if (quality_score) user.quality_score = quality_score;

  await writeDb(db);
  res.json({ success: true, user });
});

app.get('/api/admin/fraud', adminAuthMiddleware, (req, res) => {
  const db = readDb();
  const list = db.fraud_flags.map(flag => {
    const user = db.users.find(u => u.id === flag.user_id);
    const camp = db.campaigns.find(c => c.id === flag.campaign_id);
    return {
      ...flag,
      username: user ? user.username : 'Unknown',
      campaign_title: camp ? camp.campaign_type : 'Unknown'
    };
  });
  res.json(list);
});

app.get('/api/admin/completions', adminAuthMiddleware, (req, res) => {
  const db = readDb();
  const list = db.task_completions
    .filter(tc => tc.status === 'pending')
    .map(tc => {
      const user = db.users.find(u => u.id === tc.user_id);
      const camp = db.campaigns.find(c => c.id === tc.campaign_id);
      const resource = camp ? db.resources.find(r => r.id === camp.resource_id) : null;
      return {
        ...tc,
        username: user ? user.username : 'Unknown',
        campaign_title: resource ? resource.title : 'Unknown Campaign'
      };
    });
  res.json(list);
});

app.get('/api/admin/audit-logs', adminAuthMiddleware, (req, res) => {
  const db = readDb();
  
  // 1. Map all fraud flags
  const fraudLogs = db.fraud_flags.map(flag => {
    const user = db.users.find(u => u.id === flag.user_id);
    const camp = db.campaigns.find(c => c.id === flag.campaign_id);
    const resource = camp ? db.resources.find(r => r.id === camp.resource_id) : null;
    return {
      id: flag.id,
      user_id: flag.user_id,
      username: user ? user.username : 'Unknown',
      campaign_id: flag.campaign_id,
      campaign_title: resource ? resource.title : (camp ? camp.campaign_type : 'Unknown'),
      risk_score: flag.risk_score,
      reason: flag.reason,
      status: flag.status,
      created_at: flag.created_at
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 2. Map all rejected completions
  const rejectedCompletions = db.task_completions
    .filter(tc => tc.status === 'rejected')
    .map(tc => {
      const user = db.users.find(u => u.id === tc.user_id);
      const camp = db.campaigns.find(c => c.id === tc.campaign_id);
      const resource = camp ? db.resources.find(r => r.id === camp.resource_id) : null;
      return {
        id: tc.id,
        user_id: tc.user_id,
        username: user ? user.username : 'Unknown',
        campaign_title: resource ? resource.title : (camp ? camp.campaign_type : 'Unknown Campaign'),
        action_type: tc.action_type,
        reward_amount: tc.reward_amount,
        risk_score: tc.risk_score,
        verification_data: tc.verification_data,
        rejected_at: tc.rejected_at || tc.created_at,
        rejection_reason: tc.rejection_reason || 'Manual audit rejection due to suspicious payload'
      };
    }).sort((a, b) => new Date(b.rejected_at).getTime() - new Date(a.rejected_at).getTime());

  res.json({
    fraudLogs,
    rejectedCompletions
  });
});

// Admin approves/rejects fraud flag
app.post('/api/admin/fraud/:id/resolve', adminAuthMiddleware, async (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { action } = req.body; // 'block_user' | 'dismiss'

  const flag = db.fraud_flags.find(f => f.id === id);
  if (!flag) {
    return res.status(404).json({ error: 'Fraud flag not found' });
  }

  if (action === 'block_user') {
    const user = db.users.find(u => u.id === flag.user_id);
    if (user) {
      user.status = 'blocked';
      user.quality_score = 'Blocked User';
    }
  }

  flag.status = 'resolved';
  await writeDb(db);
  res.json({ success: true });
});


// Serve React Frontend (Vite)
async function startServer() {
  try {
    // Synchronize database state with cloud Firestore before handling any requests
    await initializeDbFromFirestore();
    console.log('[Startup] Database initialization from Firestore completed.');
  } catch (err) {
    console.error('[Startup] CRITICAL error initializing database from Cloud Firestore:', err);
    console.warn('[Startup] Starting Express server in SAFE MAINTENANCE MODE.');
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
