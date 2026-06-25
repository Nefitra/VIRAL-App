import React, { useState, useEffect } from 'react';
import { User, Balance } from '../types';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { 
  HelpCircle, ShieldAlert, BadgeCheck, Mail, Wallet, UserCheck, MessageSquare, BookOpen, Trophy, Info, Sparkles,
  Palette, Coins, Lock, ShieldCheck as ShieldCheckIcon, Share2, Percent, Settings, Zap, FileText, Database,
  CheckSquare, Square, CheckCircle2, AlertCircle, Plus, Minus, Search, ChevronDown, ChevronUp, ArrowRight, RefreshCw,
  Terminal, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FAQ from './FAQ';

interface MoreProps {
  user: User;
  balance: Balance;
  onProfileUpdated: () => void;
  onOpenAdminCheck?: () => void;
  onOpenAdminSection?: () => void;
  onSignOut?: () => void;
}

export default function More({ user, balance, onProfileUpdated, onOpenAdminCheck, onOpenAdminSection, onSignOut }: MoreProps) {
  const tonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const [realTonBalance, setRealTonBalance] = useState<number | null>(null);
  const [realGramBalance, setRealGramBalance] = useState<number | null>(null);
  const [loadingRealBalances, setLoadingRealBalances] = useState(false);

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

  useEffect(() => {
    const activeAddress = tonAddress || user.wallet_address;
    if (activeAddress) {
      fetchRealBalances(activeAddress);
    } else {
      setRealTonBalance(null);
      setRealGramBalance(null);
    }
  }, [tonAddress, user.wallet_address]);

  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'faq'>('profile');

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

  React.useEffect(() => {
    fetchProviders();
  }, [user.id]);

  // New FAQ component handles its own search, category, and accordion state internally.

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

  const vp = user.viral_power || 0;
  
  // Calculate current tier and next tier progress
  const currentTier = user.quality_score || 'New User';
  let nextTier = 'Verified User';
  let progressMin = 0;
  let progressMax = 25;
  let tierColor = 'text-gray-400 border-gray-400/20 bg-gray-400/5';
  
  if (currentTier === 'Partner') {
    nextTier = 'Max Level';
    progressMin = 250;
    progressMax = 250;
    tierColor = 'text-[#38F8B0] border-[#38F8B0]/20 bg-[#38F8B0]/5';
  } else if (currentTier === 'Trusted User') {
    nextTier = 'Partner';
    progressMin = 100;
    progressMax = 250;
    tierColor = 'text-[#38F8B0] border-[#38F8B0]/20 bg-[#38F8B0]/5';
  } else if (currentTier === 'Active User') {
    nextTier = 'Trusted User';
    progressMin = 50;
    progressMax = 100;
    tierColor = 'text-[#FFD36A] border-[#FFD36A]/20 bg-[#FFD36A]/5';
  } else if (currentTier === 'Verified User') {
    nextTier = 'Active User';
    progressMin = 25;
    progressMax = 50;
    tierColor = 'text-[#B066FF] border-[#B066FF]/20 bg-[#B066FF]/5';
  } else if (currentTier === 'High-Risk User') {
    nextTier = 'New User (Unflag)';
    progressMin = 0;
    progressMax = 25;
    tierColor = 'text-[#FF4D6D] border-[#FF4D6D]/20 bg-[#FF4D6D]/5';
  } else if (currentTier === 'Blocked User') {
    nextTier = 'None';
    progressMin = 0;
    progressMax = 1;
    tierColor = 'text-[#FF4D6D] border-[#FF4D6D]/20 bg-[#FF4D6D]/5';
  } else {
    nextTier = 'Verified User';
    progressMin = 0;
    progressMax = 25;
    tierColor = 'text-gray-400 border-gray-400/20 bg-gray-400/5';
  }

  const percent = progressMax === progressMin ? 100 : Math.min(100, Math.max(0, ((vp - progressMin) / (progressMax - progressMin)) * 100));

  // Render Section Icons dynamically
  const renderRoadmapIcon = (name: string) => {
    switch (name) {
      case 'Info': return <Info className="h-4 w-4 text-[#B066FF]" />;
      case 'Palette': return <Palette className="h-4 w-4 text-[#8A2BFF]" />;
      case 'Coins': return <Coins className="h-4 w-4 text-[#FFD36A]" />;
      case 'Wallet': return <Wallet className="h-4 w-4 text-[#38F8B0]" />;
      case 'UserCheck': return <UserCheck className="h-4 w-4 text-[#FF4D6D]" />;
      case 'Lock': return <Lock className="h-4 w-4 text-amber-400" />;
      case 'ShieldCheck': return <ShieldCheckIcon className="h-4 w-4 text-[#38F8B0]" />;
      case 'Share2': return <Share2 className="h-4 w-4 text-[#B066FF]" />;
      case 'Percent': return <Percent className="h-4 w-4 text-rose-400" />;
      case 'Settings': return <Settings className="h-4 w-4 text-[#A9A3B8]" />;
      case 'Zap': return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'FileText': return <FileText className="h-4 w-4 text-blue-400" />;
      case 'Database': return <Database className="h-4 w-4 text-indigo-400" />;
      case 'CheckSquare': return <CheckSquare className="h-4 w-4 text-[#38F8B0]" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };



  return (
    <div className="space-y-4">
      {/* 0. Quality Score Progression Bento Card */}
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
            {currentTier}
          </span>
        </div>

        {/* ProgressBar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-[#A9A3B8]">
            <span>Reputation: {vp} VP</span>
            {progressMax > progressMin && (
              <span>Next level: {progressMax} VP</span>
            )}
          </div>
          
          <div className="w-full h-2 rounded bg-[#05020D]/80 border border-[#A9A3B8]/10 overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded bg-gradient-to-r from-[#8A2BFF] to-[#B066FF] shadow-[0_0_8px_rgba(138,43,255,0.5)]"
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
                <span>How Quality Score impacts your profile:</span>
              </div>
              
              <div className="grid gap-2.5 sm:grid-cols-3 pt-1">
                <div className="bg-[#05020D]/40 border border-[#A9A3B8]/5 p-2 rounded space-y-1">
                  <div className="font-bold text-white text-[10px] uppercase font-mono">1. New User (0-24 VP)</div>
                  <p className="text-[10px] leading-relaxed text-[#A9A3B8]/80">
                    Basic campaign eligibility. Daily vVIRAL reward limit cap is 500. Standard audit verification delay.
                  </p>
                </div>
                <div className="bg-[#8A2BFF]/5 border border-[#8A2BFF]/10 p-2 rounded space-y-1">
                  <div className="font-bold text-[#B066FF] text-[10px] uppercase font-mono">2. Verified User (25-49 VP)</div>
                  <p className="text-[10px] leading-relaxed text-[#A9A3B8]/80">
                    Daily reward limit increased to 1,000 vVIRAL. Unlocks premium websites and Telegram verification channels.
                  </p>
                </div>
                <div className="bg-[#FFD36A]/5 border border-[#FFD36A]/10 p-2 rounded space-y-1">
                  <div className="font-bold text-[#FFD36A] text-[10px] uppercase font-mono">3. Active & Trusted (50+ VP)</div>
                  <p className="text-[10px] leading-relaxed text-[#A9A3B8]/80">
                    Up to 2,500 daily vVIRAL. Fast-track withdrawals, exclusive high-tier promoter tasks, and manual audit immunity.
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-[#A9A3B8]/60 italic">
                💡 Tip: Earn +1 VP for every daily check-in streak milestone, and completing verified advertiser actions!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Elegant Sub-navigation Tab Bar */}
      <div className="flex border border-[#A9A3B8]/10 bg-[#0B0618]/60 p-1 rounded-xl gap-1">
        <button
          id="subtab-profile"
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF] shadow-[0_0_12px_rgba(138,43,255,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-white'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>Profile & Security</span>
        </button>
        <button
          id="subtab-faq"
          onClick={() => setActiveSubTab('faq')}
          className={`flex-1 py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'faq'
              ? 'bg-[#8A2BFF]/20 border border-[#8A2BFF]/40 text-[#B066FF] shadow-[0_0_12px_rgba(138,43,255,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Ecosystem FAQ</span>
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
            {/* 1. Account Credentials & System Fields Bento Grid */}
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

            {/* 2. TonConnect connectivity Hub */}
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

              {/* Mandatory Security Warning Card */}
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
                    id="btn-connect-tonconnect"
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
                        id="btn-disconnect-wallet"
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
                            'N/A'
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
                            'N/A'
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

            {/* 3. Multi-Login Security, Linking & Verification */}
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

                {/* Other Social linking platforms */}
                <div className="flex flex-col gap-1.5 pt-1.5 border-b border-[#A9A3B8]/5 pb-2">
                  <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase block">Future Social Integrations</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Twitter (X)', 'Apple ID', 'Discord', 'Facebook'].map((soc) => (
                      <button
                        key={soc}
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm(`Authorize linking with ${soc}? This will securely merge provider metadata on backend.`);
                          if (!confirmed) return;
                          setLoading(true);
                          const mockProvName = soc.toLowerCase().split(' ')[0];
                          const mockProvId = `soc_prov_id_${Math.random().toString(36).substring(2, 8)}`;
                          fetch('/api/auth/link', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: user.id,
                              provider: mockProvName,
                              provider_user_id: mockProvId
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
                                alert(`Success! Simulated link with ${soc} connected to secure DB profiles. +20 vVIRAL secure bonus granted.`);
                              }
                            })
                            .catch(() => setLoading(false));
                        }}
                        className="rounded border border-[#A9A3B8]/10 bg-[#05020D]/60 px-2 py-1 text-[9px] text-[#A9A3B8] hover:text-white hover:border-[#8A2BFF]/40 cursor-pointer transition-all"
                      >
                        + Link {soc}
                      </button>
                    ))}
                  </div>
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

            {/* 3.5 Security Verification & Admin Diagnostic Check */}
            <div className="rounded-xl border border-[#B066FF]/20 bg-[#0B0618]/90 glass p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-4 w-4 text-[#FFD36A]" /> Diagnostics & Security
                </h3>
                <span className="text-[8px] font-mono bg-[#8A2BFF]/10 text-[#B066FF] border border-[#8A2BFF]/20 px-2 py-0.5 rounded uppercase">Protected</span>
              </div>
              <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                Unify your verification checks: inspect your decentralized TonConnect manifest, run decentralized node queries, and verify if your Telegram ID is pre-authorized for admin role access.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onOpenAdminCheck}
                  className="bg-gradient-to-r from-[#8A2BFF] to-[#B066FF] hover:from-[#B066FF] hover:to-[#8A2BFF] text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-[#8A2BFF]/10 transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#8A2BFF]/30"
                >
                  <Terminal className="h-4 w-4 text-[#FFD36A]" /> Security & Admin Diagnostics
                </button>
                <button
                  type="button"
                  id="btn-goto-tonconnect-check"
                  onClick={() => {
                    window.history.pushState(null, '', '/tonconnect-check');
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="bg-[#0B0618] hover:bg-[#A9A3B8]/10 text-[#38F8B0] text-xs font-bold py-2.5 px-4 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#38F8B0]/20"
                >
                  <ShieldCheckIcon className="h-4 w-4 text-[#38F8B0]" /> TonConnect Diagnostic Page
                </button>
              </div>
            </div>

            {/* 3.6 Administrator Console (For authorized admins only) */}
            {(user.role === 'admin' || user.is_admin === true || (user.telegram_id && ['8618331744', '6228196481', '5314622858'].includes(user.telegram_id.toString()))) && (
              <div className="rounded-xl border border-[#FFD36A]/30 bg-[#120B04]/90 glass p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-[#FFD36A]" /> Administrator Console
                  </h3>
                  <span className="text-[8px] font-mono bg-[#FFD36A]/10 text-[#FFD36A] border border-[#FFD36A]/20 px-2 py-0.5 rounded uppercase font-bold">Authorized</span>
                </div>
                <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                  You are recognized as an official platform administrator. Open the full administration panel to manage users, campaigns, resources, escrow, and platform variables.
                </p>
                <button
                  type="button"
                  onClick={onOpenAdminSection}
                  className="w-full bg-gradient-to-r from-[#FFD36A] to-[#FF9F1C] hover:from-[#FF9F1C] hover:to-[#FFD36A] text-black text-xs font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-[#FFD36A]/10 transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#FFD36A]/30 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Settings className="h-4 w-4 text-black" /> Enter Admin Console
                </button>
              </div>
            )}

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

        {activeSubTab === 'faq' && (
          <motion.div
            key="faq-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Dedicated High-Density FAQ Component */}
            <FAQ />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Platform Disclaimer Section */}
      <div className="rounded-xl border border-[#FF4D6D]/20 bg-[#FF4D6D]/5 p-4 space-y-1.5">
        <h4 className="text-xs font-bold text-[#FF4D6D] uppercase tracking-wide flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> Ecosystem Disclaimer
        </h4>
        <p className="text-[11px] text-[#A9A3B8] leading-relaxed font-mono">
          $VIRAL is a utility token for ecosystem activity, promotion and platform interaction. It is not financial advice, not an investment offer and does not guarantee profit, income or token price growth.
        </p>
      </div>

      {/* 6. Version & Deployment Label */}
      <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/50 p-4 text-center space-y-1">
        <p className="text-xs font-mono text-[#38F8B0] font-bold">Build: admin-secure-v1</p>
        <p className="text-[10px] font-mono text-[#A9A3B8]">Deployed at: 2026-06-24 14:24:00 (Ecosystem Live Node)</p>
      </div>
    </div>
  );
}
