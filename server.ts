import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, DatabaseSchema } from './src/server/db';
import { 
  User, Balance, Resource, Campaign, CampaignEscrow, 
  TaskCompletion, Referral, LedgerTransaction, Claim, FraudFlag, AppConfig 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes

// Helper to generate IDs
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// 1. Get Platform Configuration
app.get('/api/config', (req, res) => {
  const db = readDb();
  res.json(db.config);
});

// 2. Update Platform Configuration (Admin only)
app.post('/api/admin/config', (req, res) => {
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
  
  writeDb(db);
  res.json({ success: true, config: db.config });
});

// 3. User Auth (Telegram login simulation)
app.post('/api/auth/login', (req, res) => {
  const db = readDb();
  const { telegram_id, username, email } = req.body;

  if (!telegram_id || !username) {
    return res.status(400).json({ error: 'Telegram ID and username are required' });
  }

  // Check if user is blocked or high risk
  const existingUser = db.users.find(u => u.telegram_id === telegram_id.toString());
  
  if (existingUser) {
    if (existingUser.status === 'blocked') {
      return res.status(403).json({ error: 'This account has been blocked due to anti-fraud detection.' });
    }
    existingUser.last_active_at = new Date().toISOString();
    writeDb(db);
    
    const balance = db.balances.find(b => b.user_id === existingUser.id);
    return res.json({ user: existingUser, balance });
  }

  // Check if Telegram ID already exists or is spoofed
  const duplicateId = db.users.some(u => u.telegram_id === telegram_id.toString());
  if (duplicateId) {
    return res.status(400).json({ error: 'Telegram account already associated with another profile.' });
  }

  // Create new user (Simulating Starter Bonus + basic verification checks)
  const newUserId = generateId('usr');
  const starterBonus = db.config.starterBonus; // 100 vVIRAL default
  
  const isSpecialAdmin = email === 'beskerboris@gmail.com' || username.toLowerCase() === 'admin' || username.toLowerCase() === 'viral_creator';
  
  const newUser: User = {
    id: newUserId,
    telegram_id: telegram_id.toString(),
    email: email || '',
    username: username,
    role: isSpecialAdmin ? 'admin' : 'user',
    status: 'active',
    quality_score: isSpecialAdmin ? 'Partner' : 'New User',
    viral_power: isSpecialAdmin ? 1000 : 10, // New user starts with low viral power
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString()
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

  // Add starter bonus ledger transaction
  const starterTx: LedgerTransaction = {
    id: generateId('tx'),
    user_id: newUserId,
    amount: starterBonus,
    currency: 'vVIRAL',
    type: 'starter_bonus',
    status: 'completed',
    direction: 'credit',
    created_at: new Date().toISOString(),
    metadata: 'Onboarding Starter Bonus (Telegram Verified)'
  };
  db.ledger_transactions.push(starterTx);

  // Add a referral check if invited by someone
  const { referrer_id } = req.body;
  if (referrer_id && referrer_id !== newUserId) {
    const referrer = db.users.find(u => u.id === referrer_id);
    if (referrer && referrer.status === 'active') {
      const newReferral: Referral = {
        id: generateId('ref'),
        referrer_user_id: referrer_id,
        invited_user_id: newUserId,
        status: 'active',
        total_invited_earnings: 0,
        total_referrer_rewards: 0,
        created_at: new Date().toISOString()
      };
      db.referrals.push(newReferral);
    }
  }

  writeDb(db);
  res.json({ user: newUser, balance: newBalance });
});

// 4. Update Profile Info / Onboarding Extras (Wallet / Email verification)
app.post('/api/auth/update-profile', (req, res) => {
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
    
    balance.ton_balance_cache = 12.8; // Give them some simulated TON balance
    balance.gram_balance_cache = 150; // Give them some simulated GRAM balance
    
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

  writeDb(db);
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
app.post('/api/checkin', (req, res) => {
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
  
  writeDb(db);
  
  res.json({
    success: true,
    streak: newStreak,
    reward,
    user,
    balance
  });
});

// 5. SEND vVIRAL Internally (Internal Transfer between users)
app.post('/api/balances/send', (req, res) => {
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

  writeDb(db);

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
  const { userId } = req.query;

  if (userId) {
    // If user is requestor, return all their items
    const userResources = db.resources.filter(r => r.owner_user_id === userId);
    return res.json(userResources);
  }

  // Otherwise return active/approved resources
  const approvedResources = db.resources.filter(r => r.status === 'approved' || r.status === 'active');
  res.json(approvedResources);
});

// 7. Add Resource to promote
app.post('/api/resources/add', (req, res) => {
  const db = readDb();
  const { owner_user_id, type, title, url, description, image_url, category, language } = req.body;

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

  writeDb(db);
  res.json({ success: true, resource: newResource, rewardEarned });
});

// 8. Approve/Reject Resource (Admin only)
app.post('/api/resources/:id/approve', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const resIndex = db.resources.findIndex(r => r.id === id);
  if (resIndex === -1) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  db.resources[resIndex].status = status;
  writeDb(db);
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
app.post('/api/campaigns', (req, res) => {
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

  writeDb(db);
  res.json({ success: true, campaign: newCampaign, platformFee, escrowBudget, maxActions });
});

// 11. Admin Action: Approve/Reject campaign
app.post('/api/campaigns/:id/approve', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'rejected'

  const campaign = db.campaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  campaign.status = status;
  writeDb(db);
  res.json({ success: true, campaign });
});

// 12. Complete and Verify Task (Anti-Fraud and Economic Loop mechanics)
app.post('/api/campaigns/:id/verify-task', (req, res) => {
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
    writeDb(db);
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

  // Find referrer
  const referral = db.referrals.find(r => r.invited_user_id === userId && r.status === 'active');
  const referrerReward = referral ? Math.floor(rewardAmount * 0.10) : 0; // 10% Referrer reward (Section 14)

  const newCompletion: TaskCompletion = {
    id: completionId,
    campaign_id: id,
    user_id: userId,
    action_type: campaign.campaign_type,
    reward_amount: rewardAmount,
    referral_reward_amount: referrerReward,
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

    // Process Referrer Reward (Section 14) - Paid from Campaign Escrow or platform rules.
    // "Referrer receives 10% from valid earnings of invited users. Paid from campaign economics."
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
          metadata: `Earned 10% referrer reward from @${user.username}'s activity`
        });
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

  writeDb(db);

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

// 14. Fetch Referral Stats
app.get('/api/referrals/:userId', (req, res) => {
  const db = readDb();
  const { userId } = req.params;

  const userRefs = db.referrals.filter(r => r.referrer_user_id === userId);
  const invitedUsers = userRefs.map(ref => {
    const invitedUser = db.users.find(u => u.id === ref.invited_user_id);
    return {
      ...ref,
      invited_username: invitedUser ? invitedUser.username : 'Unknown User',
      invited_quality: invitedUser ? invitedUser.quality_score : 'New User',
    };
  });

  const totalRewards = userRefs.reduce((sum, r) => sum + r.total_referrer_rewards, 0);

  res.json({
    referrals: invitedUsers,
    totalReferralRewards: totalRewards,
    count: invitedUsers.length
  });
});

// 15. Admin panel diagnostics (collected fees, overall metrics)
app.get('/api/admin/stats', (req, res) => {
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
app.post('/api/completions/:completionId/approve', (req, res) => {
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

    // Process Referrer Reward
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
          metadata: `10% manual referral reward from @${earnerUser.username}`
        });
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

  writeDb(db);
  res.json({ success: true, completion });
});

// 17. Admin API: Toggle Blum bonding simulation
app.post('/api/admin/bond', (req, res) => {
  const db = readDb();
  db.config.isBonded = !db.config.isBonded;
  
  if (db.config.isBonded) {
    // Distribute some initial real $VIRAL to the Admin Wallet to simulate reserves
    const adminBal = db.balances.find(b => b.user_id === 'admin-1');
    if (adminBal) {
      adminBal.real_viral_balance = 200000000; // Fixed 200,000,000 $VIRAL Launch Pool reserve
    }
  }

  writeDb(db);
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
app.post('/api/claims', (req, res) => {
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
  writeDb(db);

  res.json({ success: true, claim: newClaim });
});

// 19. Admin APIs for monitoring lists
app.get('/api/admin/users', (req, res) => {
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

app.post('/api/admin/users/:userId/status', (req, res) => {
  const db = readDb();
  const { userId } = req.params;
  const { status, quality_score } = req.body;

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (status) user.status = status;
  if (quality_score) user.quality_score = quality_score;

  writeDb(db);
  res.json({ success: true, user });
});

app.get('/api/admin/fraud', (req, res) => {
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

app.get('/api/admin/completions', (req, res) => {
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

app.get('/api/admin/audit-logs', (req, res) => {
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
app.post('/api/admin/fraud/:id/resolve', (req, res) => {
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
  writeDb(db);
  res.json({ success: true });
});


// Serve React Frontend (Vite)
async function startServer() {
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
