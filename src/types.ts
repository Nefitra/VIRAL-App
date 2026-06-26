export interface User {
  id: string;
  telegram_id?: string; // Made optional to support pure email/Google logins!
  email?: string;
  username: string;
  wallet_address?: string;
  role: 'user' | 'admin';
  is_admin?: boolean;
  status: 'active' | 'blocked';
  quality_score: 'New User' | 'Verified User' | 'Active User' | 'Trusted User' | 'Partner' | 'High-Risk User' | 'Blocked User';
  viral_power: number;
  google_id?: string;
  social_provider?: string;
  referral_code?: string;
  created_at: string;
  last_active_at: string;
  last_login_at?: string;
  last_checkin_at?: string;
  checkin_streak?: number;
  
  // Phase 2 User Risk and Reputation
  user_risk_score?: number; // 0-100
  user_risk_factors?: string[];
  user_risk_level?: 'Low' | 'Medium' | 'High' | 'Critical';
  user_risk_status?: 'eligible' | 'suspended_rewards';

  // Phase 2 Advertiser Trust Score
  advertiser_score?: number; // 0-100
  advertiser_level?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  advertiser_metrics?: {
    campaigns_completed: number;
    campaigns_success_rate: number;
    escrow_history_count: number;
    dispute_count: number;
  };
}

export interface AuthProvider {
  id: string;
  user_id: string;
  provider_name: 'telegram' | 'google' | 'x' | 'facebook' | 'apple' | 'discord';
  provider_user_id: string;
  provider_email?: string;
  provider_username?: string;
  connected_at: string;
  last_used_at: string;
  status: 'active' | 'revoked';
}

export interface Balance {
  user_id: string;
  vviral_balance: number;
  vviral_pending: number;
  viral_power: number;
  real_viral_balance: number;
  ton_balance_cache: number;
  gram_balance_cache: number;
  updated_at: string;
}

export interface Resource {
  id: string;
  owner_user_id: string;
  type: string; // 'bot' | 'miniapp' | 'channel' | 'website' | 'other'
  title: string;
  url: string;
  description: string;
  image_url: string;
  category: string;
  language: string;
  status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'suspended';
  created_at: string;
  ownership_status?: 'verified' | 'unverified';
  verification_code?: string;
  trust_score?: number;
  risk_level?: 'Excellent' | 'Good' | 'Medium Risk' | 'High Risk' | 'Critical Risk';
  ai_summary?: string;
  ai_recommendation?: string;
  detected_flags?: string[];
  full_report?: string;
  moderation_logs?: any[];

  // Phase 2 continuous monitoring & scores
  community_reputation_score?: number; // 0-100
  final_trust_rating?: number; // 0-100
  last_scanned_at?: string;
  next_verification_due?: string;
  trust_badge_level?: 'None' | 'Verified' | 'Trusted' | 'Premium Trusted' | 'Enterprise Verified' | 'Elite Partner';
  ai_copilot_briefing?: string;
  ai_explainability_points?: string[];
  complaint_count?: number;
  campaigns_count?: number;
  success_rate?: number;
}

export interface AiLearningRecord {
  id: string;
  resource_id: string;
  resource_title: string;
  ai_recommendation: string;
  ai_trust_score: number;
  admin_decision: 'approved' | 'rejected' | 'suspended' | 'pending';
  admin_reason?: string;
  is_aligned: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  owner_user_id: string;
  resource_id: string;
  campaign_type: string;
  total_budget: number;
  platform_fee: number;
  escrow_budget: number;
  reward_per_action: number;
  max_actions: number;
  approved_actions: number;
  pending_actions: number;
  rejected_actions: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'paused';
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface CampaignEscrow {
  campaign_id: string;
  locked_amount: number;
  available_amount: number;
  pending_amount: number;
  paid_amount: number;
  refunded_amount: number;
  status: 'locked' | 'partially_released' | 'fully_released' | 'refunded';
}

export interface TaskCompletion {
  id: string;
  campaign_id: string;
  user_id: string;
  action_type: string;
  reward_amount: number;
  referral_reward_amount: number;
  referral_reward_amount_l2?: number;
  status: 'pending' | 'under_review' | 'approved' | 'paid' | 'rejected' | 'refunded';
  risk_score: number;
  verification_data: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  invited_user_id: string;
  status: 'active' | 'pending_verification' | 'blocked';
  total_invited_earnings: number;
  total_referrer_rewards: number;
  created_at: string;
}

export interface LedgerTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: 'vVIRAL' | 'real_VIRAL' | 'TON' | 'GRAM';
  type: string;
  status: 'completed' | 'pending' | 'rejected';
  related_campaign_id?: string;
  related_user_id?: string;
  direction: 'credit' | 'debit';
  created_at: string;
  metadata: string;
}

export interface FeeWallet {
  id: string;
  wallet_name: string;
  total_collected: number;
  currency: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  user_id: string;
  valid_vviral: number;
  claim_pool: number;
  conversion_rate: number;
  real_viral_amount: number;
  wallet_address: string;
  status: 'pending' | 'completed' | 'rejected';
  tx_hash?: string;
  created_at: string;
  paid_at?: string;
}

export interface FraudFlag {
  id: string;
  user_id: string;
  campaign_id?: string;
  reason: string;
  risk_score: number;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface AppConfig {
  starterBonus: number;
  platformFeePercent: number; // e.g. 10 for 10%
  dailyRewardLimit: number;
  weeklyRewardLimit: number;
  monthlyRewardLimit: number;
  claimPoolSize: number;
  isBonded: boolean; // default false, set to true after bonding is simulated
}

export interface ReferralAuditLog {
  id: string;
  start_param: string;
  user_id?: string;
  username?: string;
  telegram_id?: string;
  referrer_user_id?: string;
  referrer_username?: string;
  status: 'referral_assigned' | 'ignored_existing_user' | 'ignored_self_referral' | 'referrer_not_found' | 'error' | 'click_logged';
  details?: string;
  created_at: string;
}

