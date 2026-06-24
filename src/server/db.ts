import fs from 'fs';
import path from 'path';
import { 
  User, Balance, Resource, Campaign, CampaignEscrow, 
  TaskCompletion, Referral, LedgerTransaction, FeeWallet, 
  Claim, FraudFlag, AppConfig, AuthProvider
} from '../types';

export interface DatabaseSchema {
  users: User[];
  balances: Balance[];
  resources: Resource[];
  campaigns: Campaign[];
  campaign_escrows: CampaignEscrow[];
  task_completions: TaskCompletion[];
  referrals: Referral[];
  ledger_transactions: LedgerTransaction[];
  fee_wallet: FeeWallet;
  claims: Claim[];
  fraud_flags: FraudFlag[];
  config: AppConfig;
  auth_providers: AuthProvider[];
}

const DB_PATH = path.join(process.cwd(), 'data-db.json');

const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'admin-1',
      telegram_id: '12345678',
      email: 'beskerboris@gmail.com',
      username: 'viral_creator',
      wallet_address: 'EQA_VIRAL_Creator_wallet_address_xyz',
      role: 'admin',
      status: 'active',
      quality_score: 'Partner',
      viral_power: 1000,
      created_at: new Date('2026-06-01T00:00:00.000Z').toISOString(),
      last_active_at: new Date().toISOString()
    },
    {
      id: 'promoter-1',
      telegram_id: '87654321',
      email: 'promoter@example.com',
      username: 'Web3Builder',
      wallet_address: 'EQB_Web3Builder_Wallet',
      role: 'user',
      status: 'active',
      quality_score: 'Trusted User',
      viral_power: 250,
      created_at: new Date('2026-06-10T00:00:00.000Z').toISOString(),
      last_active_at: new Date().toISOString()
    },
    {
      id: 'earner-1',
      telegram_id: '11223344',
      email: 'crypto_grinder@example.com',
      username: 'TON_Sniper',
      wallet_address: 'EQC_Sniper_Wallet',
      role: 'user',
      status: 'active',
      quality_score: 'Active User',
      viral_power: 80,
      created_at: new Date('2026-06-15T00:00:00.000Z').toISOString(),
      last_active_at: new Date().toISOString()
    }
  ],
  balances: [
    {
      user_id: 'admin-1',
      vviral_balance: 5000000,
      vviral_pending: 0,
      viral_power: 1000,
      real_viral_balance: 200000000, // Project reserve of 200M $VIRAL
      ton_balance_cache: 1540.5,
      gram_balance_cache: 45000,
      updated_at: new Date().toISOString()
    },
    {
      user_id: 'promoter-1',
      vviral_balance: 150000, // Has vVIRAL to spend on campaigns
      vviral_pending: 0,
      viral_power: 250,
      real_viral_balance: 0,
      ton_balance_cache: 250.0,
      gram_balance_cache: 1200,
      updated_at: new Date().toISOString()
    },
    {
      user_id: 'earner-1',
      vviral_balance: 450,
      vviral_pending: 120,
      viral_power: 80,
      real_viral_balance: 0,
      ton_balance_cache: 12.5,
      gram_balance_cache: 0,
      updated_at: new Date().toISOString()
    }
  ],
  resources: [
    {
      id: 'res-1',
      owner_user_id: 'promoter-1',
      type: 'miniapp',
      title: 'TON Hamster Tap',
      url: 'https://t.me/hamster_tap_bot/app',
      description: 'The ultimate tapping game on TON. Join to earn daily rewards and claim keys!',
      image_url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=300&auto=format&fit=crop',
      category: 'Games',
      language: 'English',
      status: 'approved',
      created_at: new Date('2026-06-11T12:00:00.000Z').toISOString()
    },
    {
      id: 'res-2',
      owner_user_id: 'promoter-1',
      type: 'channel',
      title: 'Web3 Builder News',
      url: 'https://t.me/web3_builder_news',
      description: 'The fastest news and alpha channels in the TON and Blum ecosystems.',
      image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=300&auto=format&fit=crop',
      category: 'News & Media',
      language: 'English',
      status: 'approved',
      created_at: new Date('2026-06-12T14:30:00.000Z').toISOString()
    },
    {
      id: 'res-3',
      owner_user_id: 'earner-1',
      type: 'website',
      title: 'TON Sniper Analytics',
      url: 'https://ton-sniper-analytics.com',
      description: 'Track token bonding curves and listing alerts in real-time on TON.',
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=300&auto=format&fit=crop',
      category: 'DeFi & Analytics',
      language: 'English',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ],
  campaigns: [
    {
      id: 'camp-1',
      owner_user_id: 'promoter-1',
      resource_id: 'res-1',
      campaign_type: 'miniapp',
      total_budget: 100000,
      platform_fee: 10000,
      escrow_budget: 90000,
      reward_per_action: 45,
      max_actions: 2000,
      approved_actions: 120,
      pending_actions: 15,
      rejected_actions: 4,
      status: 'active',
      start_date: new Date('2026-06-12T00:00:00.000Z').toISOString(),
      end_date: new Date('2026-07-12T00:00:00.000Z').toISOString(),
      created_at: new Date('2026-06-12T00:00:00.000Z').toISOString()
    },
    {
      id: 'camp-2',
      owner_user_id: 'promoter-1',
      resource_id: 'res-2',
      campaign_type: 'channel',
      total_budget: 50000,
      platform_fee: 5000,
      escrow_budget: 45000,
      reward_per_action: 50,
      max_actions: 900,
      approved_actions: 45,
      pending_actions: 8,
      rejected_actions: 1,
      status: 'active',
      start_date: new Date('2026-06-14T00:00:00.000Z').toISOString(),
      end_date: new Date('2026-07-14T00:00:00.000Z').toISOString(),
      created_at: new Date('2026-06-14T00:00:00.000Z').toISOString()
    }
  ],
  campaign_escrows: [
    {
      campaign_id: 'camp-1',
      locked_amount: 90000,
      available_amount: 83925, // 90000 - (120 approved * 45) - (15 pending * 45)
      pending_amount: 675, // 15 * 45
      paid_amount: 5400, // 120 * 45
      refunded_amount: 0,
      status: 'partially_released'
    },
    {
      campaign_id: 'camp-2',
      locked_amount: 45000,
      available_amount: 42350, // 45000 - (45 * 50) - (8 * 50)
      pending_amount: 400, // 8 * 50
      paid_amount: 2250, // 45 * 50
      refunded_amount: 0,
      status: 'partially_released'
    }
  ],
  task_completions: [
    {
      id: 'task-c1',
      campaign_id: 'camp-1',
      user_id: 'earner-1',
      action_type: 'miniapp',
      reward_amount: 45,
      referral_reward_amount: 4.5,
      status: 'paid',
      risk_score: 12,
      verification_data: 'Opened TON Hamster Tap App, Startapp token: promo_viral',
      created_at: new Date('2026-06-16T10:00:00.000Z').toISOString(),
      approved_at: new Date('2026-06-16T10:15:00.000Z').toISOString()
    },
    {
      id: 'task-c2',
      campaign_id: 'camp-2',
      user_id: 'earner-1',
      action_type: 'channel',
      reward_amount: 50,
      referral_reward_amount: 5,
      status: 'pending',
      risk_score: 8,
      verification_data: 'Requested Telegram join channel @web3_builder_news',
      created_at: new Date().toISOString()
    },
    {
      id: 'task-c-rejected-1',
      campaign_id: 'camp-1',
      user_id: 'earner-1',
      action_type: 'website',
      reward_amount: 45,
      referral_reward_amount: 4.5,
      status: 'rejected',
      risk_score: 85,
      verification_data: 'Skipped interactive dwell-time stay check. Tab inactive.',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      rejected_at: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      rejection_reason: 'Automated speed-run detection: tab stay duration less than 2 seconds (minimum 15 required)'
    }
  ],
  referrals: [
    {
      id: 'ref-1',
      referrer_user_id: 'promoter-1',
      invited_user_id: 'earner-1',
      status: 'active',
      total_invited_earnings: 1000,
      total_referrer_rewards: 100, // 10%
      created_at: new Date('2026-06-15T00:00:00.000Z').toISOString()
    }
  ],
  ledger_transactions: [
    {
      id: 'tx-1',
      user_id: 'promoter-1',
      amount: 100,
      currency: 'vVIRAL',
      type: 'starter_bonus',
      status: 'completed',
      direction: 'credit',
      created_at: new Date('2026-06-10T00:00:00.000Z').toISOString(),
      metadata: 'Starter onboarding bonus'
    },
    {
      id: 'tx-2',
      user_id: 'earner-1',
      amount: 100,
      currency: 'vVIRAL',
      type: 'starter_bonus',
      status: 'completed',
      direction: 'credit',
      created_at: new Date('2026-06-15T00:00:00.000Z').toISOString(),
      metadata: 'Starter onboarding bonus'
    },
    {
      id: 'tx-3',
      user_id: 'promoter-1',
      amount: 100000,
      currency: 'vVIRAL',
      type: 'campaign_deposit',
      status: 'completed',
      related_campaign_id: 'camp-1',
      direction: 'debit',
      created_at: new Date('2026-06-12T00:00:00.000Z').toISOString(),
      metadata: 'Deposit for TON Hamster Tap campaign'
    },
    {
      id: 'tx-4',
      user_id: 'admin-1', // Fee goes here
      amount: 10000,
      currency: 'vVIRAL',
      type: 'fee_wallet_credit',
      status: 'completed',
      related_campaign_id: 'camp-1',
      direction: 'credit',
      created_at: new Date('2026-06-12T00:00:00.000Z').toISOString(),
      metadata: '10% platform fee from camp-1'
    }
  ],
  fee_wallet: {
    id: 'VIRAL_Fee_wallet',
    wallet_name: 'VIRAL_Fee_wallet',
    total_collected: 15000, // 10k from camp-1, 5k from camp-2
    currency: 'vVIRAL',
    updated_at: new Date().toISOString()
  },
  claims: [],
  fraud_flags: [
    {
      id: 'fraud-1',
      user_id: 'earner-1',
      campaign_id: 'camp-1',
      reason: 'Low session duration of 2 seconds',
      risk_score: 65,
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: 'fraud-2',
      user_id: 'earner-1',
      campaign_id: 'camp-2',
      reason: 'Rapid-succession task completions (possible scripting behavior)',
      risk_score: 90,
      status: 'resolved',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString()
    }
  ],
  config: {
    starterBonus: 100,
    platformFeePercent: 10,
    dailyRewardLimit: 1000,
    weeklyRewardLimit: 5000,
    monthlyRewardLimit: 20000,
    claimPoolSize: 200000000, // Fixed claim pool of 200,000,000 Real $VIRAL
    isBonded: false
  },
  auth_providers: [
    {
      id: 'prov-admin-tg',
      user_id: 'admin-1',
      provider_name: 'telegram',
      provider_user_id: '12345678',
      provider_username: 'viral_creator',
      connected_at: new Date('2026-06-01T00:00:00.000Z').toISOString(),
      last_used_at: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'prov-admin-gg',
      user_id: 'admin-1',
      provider_name: 'google',
      provider_user_id: 'google-admin-sub-999',
      provider_email: 'beskerboris@gmail.com',
      connected_at: new Date('2026-06-01T01:00:00.000Z').toISOString(),
      last_used_at: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'prov-promoter-tg',
      user_id: 'promoter-1',
      provider_name: 'telegram',
      provider_user_id: '87654321',
      provider_username: 'Web3Builder',
      connected_at: new Date('2026-06-10T00:00:00.000Z').toISOString(),
      last_used_at: new Date().toISOString(),
      status: 'active'
    }
  ]
};

export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Ensure the directory exists
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return INITIAL_DB;
  }
}

export function writeDb(db: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}
