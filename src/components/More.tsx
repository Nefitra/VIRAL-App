import React, { useState, useEffect } from 'react';
import { User, Balance } from '../types';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { 
  HelpCircle, ShieldAlert, BadgeCheck, Mail, Wallet, UserCheck, MessageSquare, BookOpen, Trophy, Info, Sparkles,
  Palette, Coins, Lock, ShieldCheck as ShieldCheckIcon, Share2, Percent, Settings, Zap, FileText, Database,
  CheckSquare, Square, CheckCircle2, AlertCircle, Plus, Minus, Search, ChevronDown, ChevronUp, ArrowRight, RefreshCw,
  Terminal, LogOut, Flame, TrendingUp, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FAQ from './FAQ';

interface MoreProps {
  user: User;
  balance: Balance;
  onProfileUpdated: () => void;
  onOpenAdminSection?: () => void;
  onSignOut?: () => void;
}

export default function More({ user, balance, onProfileUpdated, onOpenAdminSection, onSignOut }: MoreProps) {
  const tonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const [realTonBalance, setRealTonBalance] = useState<number | null>(null);
  const [realGramBalance, setRealGramBalance] = useState<number | null>(null);
  const [loadingRealBalances, setLoadingRealBalances] = useState(false);

  // Economy dashboard statistics state
  const [economyStats, setEconomyStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Marketplace listings state
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [marketSearch, setMarketSearch] = useState<string>('');

  // Staking input states
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [stakingLoading, setStakingLoading] = useState(false);
  const [stakingError, setStakingError] = useState('');
  const [stakingSuccess, setStakingSuccess] = useState('');

  // AI Financial Advisor state
  const [aiAdvice, setAiAdvice] = useState<string[]>([]);
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);

  // Own resource listing states
  const [ownResources, setOwnResources] = useState<any[]>([]);
  const [listingPriceRange, setListingPriceRange] = useState<string>('500 - 2000 vVIRAL');
  const [submittingListing, setSubmittingListing] = useState(false);

  const fetchRealBalances = (address: string) => {
    if (!address) return;
    setLoadingRealBalances(true);
    fetch(`/api/wallet/balance/${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRealTonBalance(data.ton_balance);
          setRealGramBalance(data.gram_balance);
        } else {
          setRealTonBalance(null);
          setRealGramBalance(null);
        }
      })
      .catch(err => {
        console.error('Error fetching real balances:', err);
        setRealTonBalance(null);
        setRealGramBalance(null);
      })
      .finally(() => setLoadingRealBalances(false));
  };

  const fetchEconomyStats = () => {
    setLoadingStats(true);
    fetch('/api/economy/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        setEconomyStats(data);
      })
      .catch(err => console.error('Error fetching economy stats:', err))
      .finally(() => setLoadingStats(false));
  };

  const fetchMarketplace = () => {
    setLoadingMarketplace(true);
    fetch('/api/economy/marketplace')
      .then(res => res.json())
      .then(data => {
        setMarketplaceListings(data);
        // Extract own resources
        const own = data.filter((r: any) => r.owner_user_id === user.id);
        setOwnResources(own);
      })
      .catch(err => console.error('Error fetching marketplace:', err))
      .finally(() => setLoadingMarketplace(false));
  };

  const fetchAiAdvice = () => {
    setLoadingAdvisor(true);
    fetch('/api/economy/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.advice) {
          setAiAdvice(data.advice);
        }
      })
      .catch(err => console.error('Error calling financial advisor:', err))
      .finally(() => setLoadingAdvisor(false));
  };

  useEffect(() => {
    const activeAddress = tonAddress || user.wallet_address;
    if (activeAddress) {
      fetchRealBalances(activeAddress);
    } else {
      setRealTonBalance(null);
      setRealGramBalance(null);
    }
  }, [tonAddress, user.wallet_address]);

  // Handle auto loading when tabs change
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'staking' | 'marketplace' | 'economy' | 'faq'>('profile');

  useEffect(() => {
    if (activeSubTab === 'economy') {
      fetchEconomyStats();
    } else if (activeSubTab === 'marketplace') {
      fetchMarketplace();
    } else if (activeSubTab === 'staking') {
      fetchAiAdvice();
    }
  }, [activeSubTab]);

  // Profile update form states
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [walletInput, setWalletInput] = useState(user.wallet_address || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const [connectedProviders, setConnectedProviders] = useState<any[]>([]);

  const fetchProviders = () => {
    if (!user.id) return;
    fetch(`/api/auth/providers/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConnectedProviders(data.providers || []);
        }
      })
      .catch(err => console.error('Error fetching auth providers:', err));
  };

  useEffect(() => {
    fetchProviders();
  }, [user.id]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: emailInput,
        wallet_address: walletInput
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          let msg = 'Profile updated successfully!';
          if (data.rewardEarned > 0) {
            msg += ` Earned +${data.rewardEarned} vVIRAL onboarding bonus!`;
          }
          setSuccessMsg(msg);
          onProfileUpdated();
        }
      })
      .catch(() => {
        setLoading(false);
        setErrorMsg('Network error updating profile.');
      });
  };

  // Staking handler
  const handleStakingAction = (action: 'stake' | 'unstake') => {
    setStakingError('');
    setStakingSuccess('');
    const amt = parseFloat(stakeAmount);
    if (isNaN(amt) || amt <= 0) {
      setStakingError('Please enter a valid amount to stake/unstake.');
      return;
    }

    setStakingLoading(true);
    fetch('/api/economy/stake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        action,
        amount: amt
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStakingError(data.error);
        } else {
          setStakingSuccess(`Success! Successfully completed ${action} transaction for ${amt} vVIRAL.`);
          setStakeAmount('');
          onProfileUpdated();
          fetchAiAdvice();
        }
      })
      .catch(() => setStakingError('Network error connecting to staking engine.'))
      .finally(() => setStakingLoading(false));
  };

  // Own Resource listing management
  const handleMarketplaceListToggle = (resourceId: string, currentListed: boolean) => {
    setSubmittingListing(true);
    fetch('/api/economy/marketplace/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId,
        priceRange: listingPriceRange,
        listed: !currentListed
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchMarketplace();
        }
      })
      .catch(err => console.error('Error toggling marketplace list:', err))
      .finally(() => setSubmittingListing(false));
  };

  // Helper variables
  const vp = user.viral_power || 0;
  const currentTier = user.quality_score || 'New User';
  const stakedAmount = (balance as any).staked_amount || 0;
  const stakeUnlockAt = (balance as any).stake_unlock_at;

  let tierColor = 'text-gray-400 border-gray-400/20 bg-gray-400/5';
  let tierDiscount = '0%';
  let nextTierDetails = '';

  if (stakedAmount >= 25000) {
    tierColor = 'text-[#38F8B0] border-[#38F8B0]/20 bg-[#38F8B0]/5';
    tierDiscount = '75%';
    nextTierDetails = 'Max Level Achieved';
  } else if (stakedAmount >= 5000) {
    tierColor = 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    tierDiscount = '50%';
    nextTierDetails = 'Diamond Partner: Stake 25,000 vVIRAL';
  } else if (stakedAmount >= 1000) {
    tierColor = 'text-purple-400 border-purple-400/20 bg-purple-400/5';
    tierDiscount = '20%';
    nextTierDetails = 'Gold: Stake 5,000 vVIRAL';
  } else {
    tierColor = 'text-gray-400 border-gray-400/20 bg-gray-400/5';
    tierDiscount = '0%';
    nextTierDetails = 'Silver: Stake 1,000 vVIRAL';
  }

  // Filter and search marketplace
  const filteredListings = marketplaceListings.filter(listing => {
    const matchesCategory = marketFilter === 'all' || listing.category === marketFilter;
    const matchesSearch = listing.title.toLowerCase().includes(marketSearch.toLowerCase()) || 
                          listing.description.toLowerCase().includes(marketSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Quality Score Progression Bento Card */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#8A2BFF]/5 blur-2xl"></div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-[#FFD36A]" />
            <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">
              Ecosystem Quality Score
            </h3>
            <button
              type="button"
              id="btn-quality-score-info"
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-[#A9A3B8] hover:text-white transition-colors cursor-pointer p-0.5 focus:outline-none"
              aria-label="Quality Score Info"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${tierColor}`}>
            {currentTier} (Staked: {stakedAmount.toLocaleString()} vVIRAL)
          </span>
        </div>

        {/* Dynamic Tier indicator */}
        <div className="text-[10px] font-mono text-[#A9A3B8] flex justify-between items-center">
          <span>Fee Discount: <b className="text-[#38F8B0]">{tierDiscount}</b></span>
          <span>Next level: <b className="text-[#B066FF]">{nextTierDetails}</b></span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded bg-[#05020D]/80 border border-[#A9A3B8]/10 overflow-hidden p-0.5">
            <div
              className="h-full rounded bg-gradient-to-r from-[#8A2BFF] to-[#38F8B0] shadow-[0_0_8px_rgba(138,43,255,0.5)] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, stakedAmount > 0 ? (stakedAmount / 25000) * 100 : (vp / 100) * 100))}%` }}
            />
          </div>
        </div>

        {/* Tooltip Card Explanation */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[#A9A3B8]/10 pt-3 mt-1.5 space-y-2 text-[11px] text-[#A9A3B8] leading-relaxed"
            >
              <div className="flex items-start gap-1.5 text-xs text-white font-bold">
                <Info className="h-4 w-4 text-[#B066FF] shrink-0 mt-0.5" />
                <span>Ecosystem Staking Levels & Benefits:</span>
              </div>
              
              <div className="grid gap-2.5 sm:grid-cols-4 pt-1">
                <div className="bg-[#05020D]/40 border border-[#A9A3B8]/5 p-2 rounded space-y-1">
                  <div className="font-bold text-white text-[9px] uppercase font-mono">Bronze (Default)</div>
                  <p className="text-[9px] leading-relaxed text-[#A9A3B8]/80">
                    10% Creation Fee. Base 1.0x reward multiplier.
                  </p>
                </div>
                <div className="bg-[#8A2BFF]/5 border border-[#8A2BFF]/10 p-2 rounded space-y-1">
                  <div className="font-bold text-[#B066FF] text-[9px] uppercase font-mono">Silver (1K+ Stake)</div>
                  <p className="text-[9px] leading-relaxed text-[#A9A3B8]/80">
                    8% Creation Fee. +20% extra reputation & higher referral yield.
                  </p>
                </div>
                <div className="bg-[#FFD36A]/5 border border-[#FFD36A]/10 p-2 rounded space-y-1">
                  <div className="font-bold text-[#FFD36A] text-[9px] uppercase font-mono">Gold (5K+ Stake)</div>
                  <p className="text-[9px] leading-relaxed text-[#A9A3B8]/80">
                    5% Creation Fee. Instant auto-audit immunities for resources.
                  </p>
                </div>
                <div className="bg-[#38F8B0]/5 border border-[#38F8B0]/10 p-2 rounded space-y-1">
                  <div className="font-bold text-[#38F8B0] text-[9px] uppercase font-mono">Diamond (25K+ Stake)</div>
                  <p className="text-[9px] leading-relaxed text-[#A9A3B8]/80">
                    2% Creation Fee. Verified Partner badge, 1.5x Task payouts.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Elegant Sub-navigation Tab Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-[#A9A3B8]/10 bg-[#0B0618]/60 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF] shadow-[0_0_12px_rgba(138,43,255,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-white'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveSubTab('staking')}
          className={`py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'staking'
              ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF] shadow-[0_0_12px_rgba(138,43,255,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-white'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Staking</span>
        </button>
        <button
          onClick={() => setActiveSubTab('marketplace')}
          className={`py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'marketplace'
              ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF] shadow-[0_0_12px_rgba(138,43,255,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Market</span>
        </button>
        <button
          onClick={() => setActiveSubTab('economy')}
          className={`py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'economy'
              ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF] shadow-[0_0_12px_rgba(138,43,255,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-white'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Economy</span>
        </button>
        <button
          onClick={() => setActiveSubTab('faq')}
          className={`py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer col-span-2 md:col-span-1 ${
            activeSubTab === 'faq'
              ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF] shadow-[0_0_12px_rgba(138,43,255,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>FAQ</span>
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'profile' && (
          <motion.div
            key="profile-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Account Credentials & System Fields Bento Grid */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4">
              <h3 className="font-sans text-xs font-bold text-[#B066FF] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" /> Account Credentials Profile
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 font-sans">
                {/* User ID */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Internal ID</span>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <span className="text-[10px] font-mono text-white truncate font-bold">{user.id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(user.id);
                        alert('Internal User ID copied to clipboard!');
                      }}
                      className="text-[#A9A3B8] hover:text-[#B066FF] p-0.5"
                      title="Copy ID"
                    >
                      <Sparkles className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Platform Role</span>
                  <span className="text-xs text-white font-bold mt-1 uppercase text-[#FFD36A]">{user.role}</span>
                </div>

                {/* Status */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Account Status</span>
                  <span className="text-xs text-[#38F8B0] font-bold mt-1 uppercase flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#38F8B0]"></span> {user.status}
                  </span>
                </div>

                {/* Referral Code */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Referral Code</span>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <span className="text-xs text-white font-mono font-bold truncate text-[#B066FF]">{user.referral_code || 'None'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(user.referral_code || '');
                        alert('Referral Code copied to clipboard!');
                      }}
                      className="text-[#A9A3B8] hover:text-[#B066FF]"
                    >
                      <Sparkles className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Social login provider */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Social Provider</span>
                  <span className="text-xs text-white font-bold mt-1 capitalize">{user.social_provider || (user.google_id ? 'Google' : 'Telegram')}</span>
                </div>

                {/* Wallet Address Status */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">TON Wallet Linked</span>
                  <span className={`text-[10px] font-bold mt-1 truncate ${user.wallet_address ? 'text-[#38F8B0]' : 'text-gray-500'}`}>
                    {user.wallet_address ? 'YES' : 'NO'}
                  </span>
                </div>

                {/* Created Date */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Created Date</span>
                  <span className="text-[10px] text-white mt-1 font-mono">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>

                {/* Last Login Date */}
                <div className="bg-[#05020D]/60 border border-[#A9A3B8]/5 p-2.5 rounded-lg col-span-2 flex flex-col justify-between">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Last Session Login</span>
                  <span className="text-[10px] text-white mt-1 font-mono">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* TonConnect connectivity Hub */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-sans text-xs font-bold text-[#38F8B0] uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" /> TonConnect Wallet Center
                </h3>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                  (tonAddress || user.wallet_address) ? 'text-[#38F8B0] border-[#38F8B0]/20 bg-[#38F8B0]/5' : 'text-gray-500 border-gray-500/20'
                }`}>
                  {(tonAddress || user.wallet_address) ? 'SECURE_CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>

              {/* Security Protocol Warning Card */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2.5 items-start">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-amber-300 uppercase font-mono tracking-wide">TonConnect Security protocol</h4>
                  <p className="text-[10px] text-amber-200/80 leading-relaxed font-sans">
                    Never share your seed phrase or private keys. $VIRAL App will never ask for them. Only sign transactions from within approved wallet clients.
                  </p>
                </div>
              </div>

              {!(tonAddress || user.wallet_address) ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                    Connect a TON-compatible decentralized wallet (Tonkeeper, MyTonWallet) to sync your Gram / TON balances, claim accumulated $VIRAL tokens, or perform secure transfers.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (tonConnectUI) {
                        tonConnectUI.openModal();
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#38F8B0] hover:bg-[#38F8B0]/90 text-[#05020D] text-xs font-black py-3 transition-colors cursor-pointer shadow-lg shadow-[#38F8B0]/10"
                  >
                    <Wallet className="h-4 w-4" /> Connect TON Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[#05020D]/60 border border-[#A9A3B8]/10 p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#A9A3B8]/5 pb-2.5">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase block">Connected Wallet (Decentralized)</span>
                        <span className="text-xs text-[#38F8B0] font-mono break-all font-bold select-all truncate max-w-[200px] block">{tonAddress || user.wallet_address}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (tonConnectUI) {
                            tonConnectUI.disconnect();
                          } else {
                            fetch('/api/wallet/disconnect', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id })
                            }).then(() => onProfileUpdated());
                          }
                        }}
                        className="rounded px-2.5 py-1 text-[10px] font-bold bg-[#FF4D6D]/15 border border-[#FF4D6D]/20 text-[#FF4D6D] hover:bg-[#FF4D6D]/25 transition-all cursor-pointer shrink-0"
                      >
                        Disconnect
                      </button>
                    </div>

                    {/* Live Balances Displays */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-[#05020D]/80 rounded p-1.5 border border-[#A9A3B8]/5 flex flex-col justify-center min-h-[50px]">
                        <span className="text-[7px] font-mono tracking-wider text-[#A9A3B8] block uppercase font-bold">TON BALANCE</span>
                        <span className="text-[10px] text-white font-bold font-mono">
                          {loadingRealBalances ? (
                            <span className="text-[#FFD36A] animate-pulse">Syncing...</span>
                          ) : realTonBalance !== null ? (
                            `${realTonBalance.toFixed(4)} TON`
                          ) : (
                            '0.00'
                          )}
                        </span>
                      </div>
                      <div className="bg-[#05020D]/80 rounded p-1.5 border border-[#A9A3B8]/5 flex flex-col justify-center min-h-[50px]">
                        <span className="text-[7px] font-mono tracking-wider text-[#A9A3B8] block uppercase font-bold">GRAM BALANCE</span>
                        <span className="text-[10px] text-white font-bold font-mono">
                          {loadingRealBalances ? (
                            <span className="text-[#FFD36A] animate-pulse">Syncing...</span>
                          ) : realGramBalance !== null ? (
                            `${realGramBalance.toFixed(4)} GRAM`
                          ) : (
                            '0.00'
                          )}
                        </span>
                      </div>
                      <div className="bg-[#05020D]/80 rounded p-1.5 border border-[#A9A3B8]/5 flex flex-col justify-center min-h-[50px]">
                        <span className="text-[7px] font-mono tracking-wider text-[#A9A3B8] block uppercase font-bold">vVIRAL BALANCE</span>
                        <span className="text-xs text-[#FFD36A] font-bold font-mono">{balance.vviral_balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* SEND vVIRAL Peer-to-Peer Transfer Module */}
                  <div className="border border-[#A9A3B8]/10 bg-[#05020D]/40 rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-white uppercase font-mono tracking-wide">P2P transfer vVIRAL before bonding</h4>
                      <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">Instant on-network ledger</span>
                    </div>
                    <p className="text-[9px] text-[#A9A3B8] leading-relaxed">
                      Send internal vVIRAL balances to another user directly. P2P transfers are authorized and secured on our centralized ledger.
                    </p>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const recipient = (target.elements.namedItem('recipient') as HTMLInputElement).value;
                        const amount = (target.elements.namedItem('amount') as HTMLInputElement).value;

                        if (!recipient || !amount || Number(amount) <= 0) {
                          alert('Please enter a valid recipient username and positive vVIRAL amount.');
                          return;
                        }

                        const confirmed = window.confirm(`CONFIRMATION REQUIRED:\nAre you sure you want to transfer ${amount} vVIRAL to @${recipient}?\nThis action will immediately deduct from your platform wallet.`);
                        if (!confirmed) return;

                        setLoading(true);
                        fetch('/api/wallet/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            senderId: user.id,
                            recipientUsername: recipient,
                            amount: Number(amount)
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setLoading(false);
                            if (data.error) {
                              alert(data.error);
                            } else {
                              onProfileUpdated();
                              alert(`Success! Successfully transferred ${amount} vVIRAL to @${recipient}.`);
                              target.reset();
                            }
                          })
                          .catch(() => {
                            setLoading(false);
                            alert('Network failure processing transfer.');
                          });
                      }}
                      className="grid grid-cols-3 gap-2 items-end"
                    >
                      <div className="col-span-1 space-y-1">
                        <label className="text-[7px] font-mono uppercase tracking-wider text-[#A9A3B8]">Recipient @</label>
                        <input
                          name="recipient"
                          type="text"
                          placeholder="username"
                          required
                          className="w-full rounded bg-[#05020D]/80 border border-[#A9A3B8]/10 py-1.5 px-2 text-[10px] text-white focus:border-[#8A2BFF] focus:outline-none placeholder-[#A9A3B8]/30"
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[7px] font-mono uppercase tracking-wider text-[#A9A3B8]">vVIRAL Amount</label>
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          placeholder="amount"
                          required
                          className="w-full rounded bg-[#05020D]/80 border border-[#A9A3B8]/10 py-1.5 px-2 text-[10px] text-white focus:border-[#8A2BFF] focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded bg-[#8A2BFF] hover:bg-[#B066FF] text-[10px] font-bold py-1.5 px-3 text-white transition-all cursor-pointer"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Social logins */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
              <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4" /> Multi-Login & Account Security
              </h3>
              <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                Unify your login identities. Linking multiple channels secures your access across browsers, prevents account duplication, and rewards you with +20 vVIRAL reputation bonuses.
              </p>

              <div className="space-y-2.5 pt-1 font-sans">
                {/* Telegram link status */}
                <div className="flex items-center justify-between border-b border-[#A9A3B8]/5 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-white block">Telegram Connection</span>
                    <span className="text-[9px] text-[#A9A3B8]">
                      {user.telegram_id ? `Linked ID: ${user.telegram_id} (@${user.username})` : 'Not linked to a Telegram ID'}
                    </span>
                  </div>
                  {user.telegram_id ? (
                    <span className="text-[9px] font-mono text-[#38F8B0] font-bold bg-[#38F8B0]/10 px-2 py-0.5 rounded border border-[#38F8B0]/20">Connected</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const tgId = window.prompt('Enter Simulated Telegram User ID to link:', '55667788');
                        const tgUser = window.prompt('Enter Simulated Telegram Username:', 'TON_Prophet');
                        if (!tgId || !tgUser) return;

                        setLoading(true);
                        fetch('/api/auth/link', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user.id,
                            provider: 'telegram',
                            provider_user_id: tgId,
                            provider_username: tgUser
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setLoading(false);
                            if (data.error) {
                              alert(data.error);
                            } else {
                              onProfileUpdated();
                              fetchProviders();
                              alert('Simulated Telegram Account linked successfully! +20 vVIRAL granted.');
                            }
                          })
                          .catch(() => setLoading(false));
                      }}
                      className="text-[9px] font-bold bg-[#8A2BFF] hover:bg-[#B066FF] px-2.5 py-1 rounded text-white cursor-pointer transition-all"
                    >
                      Link Telegram
                    </button>
                  )}
                </div>

                {/* Google link status */}
                <div className="flex items-center justify-between border-b border-[#A9A3B8]/5 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-white block">Google Account</span>
                    <span className="text-[9px] text-[#A9A3B8]">
                      {user.google_id ? `Linked: ${user.email} (ID: ${user.google_id})` : 'No Google account linked'}
                    </span>
                  </div>
                  {user.google_id ? (
                    <span className="text-[9px] font-mono text-[#38F8B0] font-bold bg-[#38F8B0]/10 px-2 py-0.5 rounded border border-[#38F8B0]/20">Connected</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const ggEmail = window.prompt('Enter Simulated Google Account Email:', 'tondeveloper@gmail.com');
                        if (!ggEmail || !ggEmail.includes('@')) {
                          alert('Invalid email provided.');
                          return;
                        }
                        const ggId = `google_sub_${Math.random().toString(36).substring(2, 9)}`;

                        setLoading(true);
                        fetch('/api/auth/link', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user.id,
                            provider: 'google',
                            provider_user_id: ggId,
                            provider_email: ggEmail
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setLoading(false);
                            if (data.error) {
                              alert(data.error);
                            } else {
                              onProfileUpdated();
                              fetchProviders();
                              alert('Simulated Google Account linked successfully! +20 vVIRAL granted.');
                            }
                          })
                          .catch(() => setLoading(false));
                      }}
                      className="text-[9px] font-bold bg-[#8A2BFF] hover:bg-[#B066FF] px-2.5 py-1 rounded text-white cursor-pointer transition-all"
                    >
                      Link Google Account
                    </button>
                  )}
                </div>

                {/* Active Connected Providers List */}
                {connectedProviders.length > 0 && (
                  <div className="bg-[#05020D]/60 rounded-lg p-2.5 border border-[#A9A3B8]/10 space-y-1.5 mt-2">
                    <span className="text-[8px] font-mono tracking-wider text-[#FFD36A] uppercase block">Linked Providers (auth_providers table)</span>
                    <div className="space-y-1">
                      {connectedProviders.map((prov) => (
                        <div key={prov.id} className="flex items-center justify-between text-[9px] bg-[#05020D]/80 rounded px-2 py-1 font-mono">
                          <div className="flex items-center gap-1.5 text-white">
                            <span className="capitalize text-[#B066FF] font-bold">{prov.provider_name}:</span>
                            <span>{prov.provider_username || prov.provider_email || prov.provider_user_id}</span>
                          </div>
                          <span className="text-[7px] text-[#A9A3B8]">ID: {prov.provider_user_id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onSignOut && (
                  <div className="pt-2.5 border-t border-[#A9A3B8]/5">
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="w-full rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2.5 text-xs font-bold text-red-400 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out / Switch Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile update details */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
              <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-[#8A2BFF]" /> Update Contact & Settings
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-mono text-[#A9A3B8] uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter active email address"
                      className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-2.5 text-xs text-white focus:border-[#8A2BFF] focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono text-[#A9A3B8] uppercase mb-1">Backup TON Wallet address</label>
                    <input
                      type="text"
                      value={walletInput}
                      onChange={(e) => setWalletInput(e.target.value)}
                      placeholder="EQA... address"
                      className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-2.5 text-xs text-white focus:border-[#8A2BFF] focus:outline-none placeholder-gray-600 font-mono"
                    />
                  </div>
                </div>

                {errorMsg && <div className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/15 p-2 rounded">{errorMsg}</div>}
                {successMsg && <div className="text-xs text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/15 p-2 rounded">{successMsg}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-xs font-bold text-white bg-[#8A2BFF] hover:bg-[#B066FF] py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  {loading ? 'Synchronizing contact records...' : 'Update Profile & Settings'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'staking' && (
          <motion.div
            key="staking-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Interactive Staking module */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#A9A3B8]/10 pb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#8A2BFF] to-[#B066FF] flex items-center justify-center text-white font-bold">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">VIRAL Sovereign Staking Vault</h3>
                  <p className="text-[10px] text-[#A9A3B8]">Lock vVIRAL to gain platform privileges & reduce campaign commissions</p>
                </div>
              </div>

              {/* Balances Display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#05020D]/60 border border-[#A9A3B8]/10">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">Your Available Liquid</span>
                  <span className="text-lg font-black text-[#FFD36A] font-mono">{balance.vviral_balance.toLocaleString()} vVIRAL</span>
                </div>
                <div className="p-3 rounded-lg bg-[#8A2BFF]/10 border border-[#8A2BFF]/20">
                  <span className="text-[8px] font-mono text-[#B066FF] uppercase block">Your Staked locked</span>
                  <span className="text-lg font-black text-[#38F8B0] font-mono">{stakedAmount.toLocaleString()} vVIRAL</span>
                </div>
              </div>

              {/* Staking constraints and information */}
              {stakeUnlockAt && (
                <div className="text-[10px] font-mono bg-[#05020D]/80 border border-[#A9A3B8]/5 p-2.5 rounded text-[#A9A3B8]">
                  🔒 Stake Unlock Scheduled At: <b className="text-white">{new Date(stakeUnlockAt).toLocaleString()}</b>
                </div>
              )}

              {/* Interactive Inputs */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-[#A9A3B8]">Amount to Stake / Unstake (vVIRAL)</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter vVIRAL token count"
                    className="w-full rounded-lg border border-[#A9A3B8]/15 bg-[#05020D] p-3 text-xs text-white focus:border-[#8A2BFF] focus:outline-none font-mono"
                  />
                </div>

                {stakingError && <div className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/15 p-2 rounded">{stakingError}</div>}
                {stakingSuccess && <div className="text-xs text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/15 p-2 rounded">{stakingSuccess}</div>}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStakingAction('stake')}
                    disabled={stakingLoading}
                    className="flex-1 rounded-lg bg-[#38F8B0] text-[#05020D] hover:bg-[#38F8B0]/95 font-black text-xs py-2.5 cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#38F8B0]/5"
                  >
                    <Lock className="h-3.5 w-3.5" /> Stake & Lock (30d)
                  </button>
                  <button
                    onClick={() => handleStakingAction('unstake')}
                    disabled={stakingLoading}
                    className="flex-1 rounded-lg border border-[#FF4D6D]/30 hover:bg-[#FF4D6D]/10 font-bold text-xs py-2.5 text-[#FF4D6D] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <UnlockIcon className="h-3.5 w-3.5" /> Unstake
                  </button>
                </div>
              </div>
            </div>

            {/* AI Financial Advisor Widget */}
            <div className="rounded-xl border border-[#38F8B0]/30 bg-[#050F0B]/95 glass p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#38F8B0]/10 border border-[#38F8B0]/20 flex items-center justify-center">
                    <Cpu className="h-4 w-4 text-[#38F8B0]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#38F8B0] uppercase tracking-wider font-mono">AI Sovereign Advisor</h3>
                    <p className="text-[9px] text-[#A9A3B8]">Generative spending optimization & campaign budget allocation tips</p>
                  </div>
                </div>
                <button
                  onClick={fetchAiAdvice}
                  disabled={loadingAdvisor}
                  className="rounded p-1.5 bg-[#38F8B0]/10 hover:bg-[#38F8B0]/20 border border-[#38F8B0]/20 text-[#38F8B0] cursor-pointer"
                  title="Reload Advice"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingAdvisor ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingAdvisor ? (
                <div className="space-y-2 py-4 text-center">
                  <div className="h-4 w-4 rounded-full border border-[#38F8B0] border-t-transparent animate-spin mx-auto"></div>
                  <p className="text-[10px] text-[#A9A3B8] font-mono animate-pulse">Generative Engine analyzing active campaigns & ledger logs...</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {aiAdvice.length > 0 ? aiAdvice.map((tip, idx) => (
                    <div key={idx} className="bg-[#05020D]/60 border border-[#38F8B0]/15 p-3 rounded-lg flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-[#38F8B0] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#A9A3B8] leading-relaxed">{tip}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-[#A9A3B8] italic text-center py-2">No custom economic tips generated. Tap reload to ask the Sovereign Advisor.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'marketplace' && (
          <motion.div
            key="marketplace-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Owner Listing manager section */}
            {ownResources.length > 0 && (
              <div className="rounded-xl border border-purple-500/30 bg-[#10091D]/85 p-4 space-y-3">
                <h3 className="font-sans text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4" /> Manage Your Marketplace Listings
                </h3>
                <p className="text-[10px] text-[#A9A3B8]">
                  Toggle the visibility of your verified channels inside the Autonomous Marketplace to let advertisers discover and sponsor you.
                </p>

                <div className="space-y-2">
                  {ownResources.map((res: any) => (
                    <div key={res.id} className="bg-[#05020D]/60 rounded-lg p-3 border border-purple-500/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{res.title}</span>
                          <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1.5 py-0.2 border border-purple-500/20 rounded font-mono uppercase">{res.category}</span>
                        </div>
                        <p className="text-[10px] text-[#A9A3B8] mt-0.5 truncate max-w-[280px]">{res.description}</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        <input
                          type="text"
                          value={listingPriceRange}
                          onChange={(e) => setListingPriceRange(e.target.value)}
                          placeholder="Price: e.g. 500-1500 vVIRAL"
                          className="rounded bg-[#05020D]/80 border border-purple-500/20 px-2 py-1 text-[10px] text-white focus:outline-none w-32"
                        />
                        <button
                          onClick={() => handleMarketplaceListToggle(res.id, res.marketplace_listed)}
                          disabled={submittingListing}
                          className={`rounded px-3 py-1 text-[10px] font-bold cursor-pointer transition-all ${
                            res.marketplace_listed 
                              ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30' 
                              : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {res.marketplace_listed ? 'Unlist' : 'List on Market'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Autonomous Marketplace Discovery Directory */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#A9A3B8]/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Autonomous Discovery Marketplace</h3>
                  <p className="text-[10px] text-[#A9A3B8]">Browse verified communities, channels, mini-apps & influencers</p>
                </div>
                
                {/* Search field */}
                <div className="relative w-full sm:w-48 shrink-0">
                  <Search className="h-3 w-3 text-[#A9A3B8] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    placeholder="Search resources..."
                    className="w-full rounded bg-[#05020D]/80 border border-[#A9A3B8]/15 py-1 px-2 pl-7.5 text-[10px] text-white focus:outline-none focus:border-[#8A2BFF]"
                  />
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap gap-1">
                {['all', 'channel', 'bot', 'miniapp', 'website'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMarketFilter(cat)}
                    className={`rounded px-2.5 py-1 text-[9px] font-bold font-mono uppercase tracking-wider cursor-pointer transition-all ${
                      marketFilter === cat 
                        ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF]' 
                        : 'border border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white bg-[#05020D]/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Resource Listings grid */}
              {loadingMarketplace ? (
                <div className="py-12 text-center text-[#A9A3B8] font-mono animate-pulse text-xs">
                  Reloading verified autonomous listings...
                </div>
              ) : filteredListings.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredListings.map((res: any) => (
                    <div key={res.id} className="rounded-lg border border-[#A9A3B8]/10 bg-[#05020D]/60 p-3.5 space-y-3 hover:border-[#8A2BFF]/35 transition-all flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{res.title}</h4>
                            <span className="text-[8px] text-[#A9A3B8] font-mono uppercase block">{res.category}</span>
                          </div>
                          
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[10px] font-bold text-[#FFD36A] font-mono">{res.marketplace_price_range}</span>
                            <span className="text-[8px] text-[#A9A3B8] font-mono">Suggested ad fee</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-[#A9A3B8] leading-relaxed line-clamp-2">{res.description}</p>
                      </div>

                      <div className="border-t border-[#A9A3B8]/5 pt-2.5 mt-1 grid grid-cols-3 gap-1 text-center font-mono">
                        <div>
                          <span className="text-[7px] text-[#A9A3B8] uppercase block">Followers</span>
                          <span className="text-[10px] font-bold text-white">{res.followers_count ? res.followers_count.toLocaleString() : '5k+'}</span>
                        </div>
                        <div>
                          <span className="text-[7px] text-[#A9A3B8] uppercase block">Trust Score</span>
                          <span className={`text-[10px] font-bold ${res.trust_score >= 80 ? 'text-[#38F8B0]' : 'text-[#FFD36A]'}`}>{res.trust_score || 95}/100</span>
                        </div>
                        <div>
                          <span className="text-[7px] text-[#A9A3B8] uppercase block">Completion Rate</span>
                          <span className="text-[10px] font-bold text-[#38F8B0]">{res.campaign_success_rate || 94}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-[#A9A3B8] italic text-xs">
                  No listings found matching this category filter.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'economy' && (
          <motion.div
            key="economy-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Financial Dashboard Bento metrics */}
            {economyStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="bg-[#05020D]/80 rounded-xl p-3 border border-[#A9A3B8]/10 relative overflow-hidden">
                  <span className="text-[7.5px] font-mono text-[#A9A3B8] uppercase block font-bold tracking-wider">Total $VIRAL Supply</span>
                  <span className="text-sm font-black text-white font-mono block mt-1">{(economyStats.total_supply || 10000000).toLocaleString()}</span>
                  <span className="text-[7px] text-gray-500 font-mono">Fixed Hardcap Supply</span>
                </div>
                <div className="bg-[#05020D]/80 rounded-xl p-3 border border-red-500/20 relative overflow-hidden">
                  <div className="absolute right-2 top-2 text-red-500/15"><Flame className="h-8 w-8" /></div>
                  <span className="text-[7.5px] font-mono text-red-400 uppercase block font-bold tracking-wider">Burned Tokens</span>
                  <span className="text-sm font-black text-red-400 font-mono block mt-1">{(economyStats.burned_tokens || 125000).toLocaleString()}</span>
                  <span className="text-[7px] text-gray-500 font-mono">Out of circulation forever</span>
                </div>
                <div className="bg-[#05020D]/80 rounded-xl p-3 border-[#38F8B0]/20 border relative overflow-hidden">
                  <span className="text-[7.5px] font-mono text-[#38F8B0] uppercase block font-bold tracking-wider">Locked Tokens</span>
                  <span className="text-sm font-black text-[#38F8B0] font-mono block mt-1">{(economyStats.locked_tokens || 450000).toLocaleString()}</span>
                  <span className="text-[7px] text-gray-500 font-mono">Staked + Escrow Balances</span>
                </div>
                <div className="bg-[#05020D]/80 rounded-xl p-3 border-[#B066FF]/20 border relative overflow-hidden">
                  <span className="text-[7.5px] font-mono text-[#B066FF] uppercase block font-bold tracking-wider">Circulating Supply</span>
                  <span className="text-sm font-black text-[#B066FF] font-mono block mt-1">{(economyStats.circulating_supply || 9425000).toLocaleString()}</span>
                  <span className="text-[7px] text-gray-500 font-mono">Active Liquid Supply</span>
                </div>
              </div>
            )}

            {/* Escrow Balance & Volume metrics */}
            {economyStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-sans">
                <div className="bg-[#0B0618]/60 p-3.5 border border-[#A9A3B8]/10 rounded-xl space-y-0.5">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">Active Escrow Balance</span>
                  <div className="text-lg font-black text-[#38F8B0] font-mono">{(economyStats.escrow_balance || 32500).toLocaleString()} vVIRAL</div>
                  <p className="text-[9px] text-gray-500">Locked in active promotional campaigns</p>
                </div>
                <div className="bg-[#0B0618]/60 p-3.5 border border-[#A9A3B8]/10 rounded-xl space-y-0.5">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">Daily Campaign Volume</span>
                  <div className="text-lg font-black text-white font-mono">{(economyStats.daily_campaign_volume || 52500).toLocaleString()} vVIRAL</div>
                  <p className="text-[9px] text-gray-500">Transacted in the last 24 hours</p>
                </div>
                <div className="bg-[#0B0618]/60 p-3.5 border border-[#A9A3B8]/10 rounded-xl space-y-0.5">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">Marketplace Volume</span>
                  <div className="text-lg font-black text-[#FFD36A] font-mono">{(economyStats.marketplace_volume || 110000).toLocaleString()} vVIRAL</div>
                  <p className="text-[9px] text-gray-500">Accumulated marketplace ad transactions</p>
                </div>
              </div>
            )}

            {/* Public Economy Transparency Ledger */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-[#A9A3B8]/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Ecosystem Ledger & Transparency Hub</h3>
                  <p className="text-[10px] text-[#A9A3B8]">Audit logs for on-chain staking, escrow locks & burn transactions</p>
                </div>
                <button
                  onClick={fetchEconomyStats}
                  className="rounded p-1 bg-[#A9A3B8]/5 border border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingStats ? (
                <div className="py-8 text-center text-xs font-mono animate-pulse text-[#A9A3B8]">
                  Reloading secure ledger synchronization stats...
                </div>
              ) : economyStats?.recent_transactions ? (
                <div className="space-y-1.5 font-mono max-h-64 overflow-y-auto">
                  {economyStats.recent_transactions.map((tx: any) => (
                    <div key={tx.id} className="text-[9px] bg-[#05020D]/60 rounded p-2 border border-[#A9A3B8]/5 flex justify-between items-center gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`font-bold px-1 rounded uppercase scale-90 ${
                            tx.type === 'stake_lock' ? 'bg-blue-500/10 text-blue-400' :
                            tx.type === 'stake_unlock' ? 'bg-[#38F8B0]/10 text-[#38F8B0]' :
                            tx.type.includes('burn') ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {tx.type}
                          </span>
                          <span className="text-white font-semibold truncate max-w-[120px]">{tx.metadata || 'Ecosystem Action'}</span>
                        </div>
                        <span className="text-gray-500 text-[8px] block">{new Date(tx.created_at).toLocaleString()}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-bold ${tx.direction === 'debit' ? 'text-red-400' : 'text-green-400'}`}>
                          {tx.direction === 'debit' ? '-' : '+'}{tx.amount.toLocaleString()} vVIRAL
                        </span>
                        <span className="text-gray-600 block text-[7px]">Tx ID: {tx.id.substring(0, 10)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#A9A3B8] italic text-center py-4">No recent economy transactions recorded in ledger.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'faq' && (
          <motion.div
            key="faq-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <FAQ />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Disclaimer Section */}
      <div className="rounded-xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/5 p-4 space-y-1.5">
        <h4 className="text-xs font-bold text-[#FF4D6D] uppercase tracking-wide flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> Ecosystem Disclaimer
        </h4>
        <p className="text-[11px] text-[#A9A3B8] leading-relaxed font-mono">
          $VIRAL is a utility token for ecosystem activity, promotion and platform interaction. It is not financial advice, not an investment offer and does not guarantee profit, income or token price growth.
        </p>
      </div>

      {/* Version & Deployment Label */}
      <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/50 p-4 text-center space-y-1">
        <p className="text-xs font-mono text-[#38F8B0] font-bold">Build: autonomous-economy-v5</p>
        <p className="text-[10px] font-mono text-[#A9A3B8]">Deployed at: 2026-06-27 12:00:00 (Sovereign Autonomous Node)</p>
      </div>
    </div>
  );
}

// Simple internal helper component
function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  );
}
