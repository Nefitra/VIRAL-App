import fs from 'fs';
import path from 'path';
import { 
  User, Balance, Resource, Campaign, CampaignEscrow, 
  TaskCompletion, Referral, LedgerTransaction, FeeWallet, 
  Claim, FraudFlag, AppConfig, AuthProvider, ReferralAuditLog,
  AiLearningRecord, BlacklistRecord, UserAppeal, TrustEvent, SecurityReport
} from '../types';
import { syncDatabaseToFirestore } from './firestoreSync';

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
  referral_audit_logs?: ReferralAuditLog[];
  ai_learning_records?: AiLearningRecord[];
  blacklist_records?: BlacklistRecord[];
  user_appeals?: UserAppeal[];
  trust_events?: TrustEvent[];
  security_reports?: SecurityReport[];
}

const DB_PATH = path.join(process.cwd(), 'data-db.json');

export const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'admin-1',
      telegram_id: '8618331744',
      email: 'beskerboris@gmail.com',
      username: 'admin_system',
      wallet_address: 'EQA_VIRAL_Creator_wallet_address_xyz',
      role: 'admin',
      status: 'active',
      quality_score: 'Partner',
      viral_power: 1000,
      created_at: new Date('2026-06-01T00:00:00.000Z').toISOString(),
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
      ton_balance_cache: 0,
      gram_balance_cache: 0,
      updated_at: new Date().toISOString()
    }
  ],
  resources: [],
  campaigns: [],
  campaign_escrows: [],
  task_completions: [],
  referrals: [],
  ledger_transactions: [],
  fee_wallet: {
    id: 'VIRAL_Fee_wallet',
    wallet_name: 'VIRAL_Fee_wallet',
    total_collected: 0,
    currency: 'vVIRAL',
    updated_at: new Date().toISOString()
  },
  claims: [],
  fraud_flags: [],
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
      provider_user_id: '8618331744',
      provider_username: 'admin_system',
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
    }
  ],
  referral_audit_logs: [],
  ai_learning_records: [],
  blacklist_records: [],
  user_appeals: [],
  trust_events: [],
  security_reports: []
};

// Shared in-memory cache of the database to act as the performance layer
let inMemoryDb: DatabaseSchema | null = null;

/**
 * Directly set or update the in-memory database cache
 */
export function setInMemoryDb(db: DatabaseSchema): void {
  inMemoryDb = JSON.parse(JSON.stringify(db));
}

/**
 * Checks whether local JSON file database fallback is allowed.
 * Defaults to false in production (or when explicitly configured).
 */
export function isLocalDbFallbackEnabled(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const envVal = process.env.ENABLE_LOCAL_DB_FALLBACK;
  if (envVal !== undefined) {
    return envVal === 'true';
  }
  return !isProduction; // false in production, true in development
}

export function readDb(): DatabaseSchema {
  // If we have an active in-memory cache, serve directly from cache (fast, non-blocking)
  if (inMemoryDb) {
    return inMemoryDb;
  }

  const fallbackEnabled = isLocalDbFallbackEnabled();

  if (!fallbackEnabled) {
    // In production, we do not allow falling back to a local mock file if the database has not initialized
    throw new Error('Database is currently unavailable. Primary Cloud Firestore has not initialized and local database fallback is disabled in production.');
  }

  // Development / Local Fallback
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DB));
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.referral_audit_logs) {
      parsed.referral_audit_logs = [];
    }
    inMemoryDb = parsed;
    return parsed;
  } catch (err) {
    console.error('[Database Fallback] Error reading fallback db.json:', err);
    inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DB));
    return INITIAL_DB;
  }
}

export async function writeDb(db: DatabaseSchema): Promise<void> {
  const fallbackEnabled = isLocalDbFallbackEnabled();

  // Optimistically update in-memory cache so subsequent reads within the same request lifecycle see the change
  const previousCache = inMemoryDb ? JSON.parse(JSON.stringify(inMemoryDb)) : null;
  inMemoryDb = JSON.parse(JSON.stringify(db));

  if (fallbackEnabled) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database Fallback] Error writing fallback db.json:', err);
    }
  }

  try {
    // Write directly to cloud Firestore and wait for confirmation
    await syncDatabaseToFirestore(db);
  } catch (err) {
    console.error('[Database Write] Failed to write updates to Cloud Firestore:', err);
    
    // In production, if writing to Firestore fails, we MUST revert the in-memory cache and propagate the error!
    if (!fallbackEnabled) {
      inMemoryDb = previousCache; // Rollback cache
      throw new Error(`Database Write Failure: Failed to persist critical user data to Cloud Firestore. ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
