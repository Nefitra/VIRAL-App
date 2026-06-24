import React, { useState } from 'react';
import { User, Balance } from '../types';
import { 
  HelpCircle, ShieldAlert, BadgeCheck, Mail, Wallet, UserCheck, MessageSquare, BookOpen, Trophy, Info, Sparkles,
  Palette, Coins, Lock, ShieldCheck as ShieldCheckIcon, Share2, Percent, Settings, Zap, FileText, Database,
  CheckSquare, Square, CheckCircle2, AlertCircle, Plus, Minus, Search, ChevronDown, ChevronUp, ArrowRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { faqCategories } from '../data/faqData';
import { roadmapSections } from '../data/launchRoadmapData';

interface MoreProps {
  user: User;
  balance: Balance;
  onProfileUpdated: () => void;
}

export default function More({ user, balance, onProfileUpdated }: MoreProps) {
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'faq' | 'launch'>('profile');

  // Profile update form states
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [walletInput, setWalletInput] = useState(user.wallet_address || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // FAQ search and categories
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  // Interactive Checklist states for Launch Roadmap
  const [checklistStates, setChecklistStates] = useState<Record<string, 'required' | 'configured' | 'pending'>>(() => {
    const initial: Record<string, 'required' | 'configured' | 'pending'> = {};
    roadmapSections.forEach(sec => {
      sec.items.forEach(item => {
        initial[item.id] = item.status;
      });
    });
    return initial;
  });

  // Keep track of which roadmap sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    roadmapSections.forEach((sec, idx) => {
      initial[sec.title] = idx < 2; // Expand first 2 by default
    });
    return initial;
  });

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistStates(prev => {
      const current = prev[id];
      const next = current === 'configured' ? 'pending' : 'configured';
      return { ...prev, [id]: next };
    });
  };

  // Launch readiness stats
  const totalChecklistItems = Object.keys(checklistStates).length;
  const configuredChecklistItems = Object.values(checklistStates).filter(s => s === 'configured').length;
  const launchProgressPercent = Math.round((configuredChecklistItems / totalChecklistItems) * 100);

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

  const toggleFaq = (id: number) => {
    setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
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
        <button
          id="subtab-launch"
          onClick={() => setActiveSubTab('launch')}
          className={`flex-1 py-2 px-1 text-center rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'launch'
              ? 'bg-[#FFD36A]/15 border border-[#FFD36A]/40 text-[#FFD36A] shadow-[0_0_12px_rgba(255,211,106,0.15)]'
              : 'border border-transparent text-[#A9A3B8] hover:text-[#FFD36A]'
          }`}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          <span>Real Launch Requirements</span>
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
                  user.wallet_address ? 'text-[#38F8B0] border-[#38F8B0]/20 bg-[#38F8B0]/5' : 'text-gray-500 border-gray-500/20'
                }`}>
                  {user.wallet_address ? 'SECURE_CONNECTED' : 'DISCONNECTED'}
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

              {!user.wallet_address ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                    Connect a TON-compatible decentralized wallet (Tonkeeper, MyTonWallet) to sync your Gram / TON balances, claim accumulated $VIRAL tokens, or perform secure transfers.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-connect-tonkeeper"
                      disabled={loading}
                      onClick={() => {
                        const confirmed = window.confirm('Connect to Tonkeeper client? This will authorize public wallet sync.');
                        if (!confirmed) return;
                        setLoading(true);
                        const mockAddr = `EQA${Math.random().toString(36).substring(2, 10).toUpperCase()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}8Z`;
                        
                        fetch('/api/wallet/verify-connect', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user.id,
                            walletAddress: mockAddr,
                            walletProofSignature: `proof_sig_${Math.random().toString(16).substring(2,18)}`
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setLoading(false);
                            if (data.error) {
                              alert(data.error);
                            } else {
                              onProfileUpdated();
                              alert(`Successfully connected Tonkeeper wallet! Address: ${mockAddr}`);
                            }
                          })
                          .catch(() => setLoading(false));
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#38F8B0]/20 bg-[#38F8B0]/5 hover:bg-[#38F8B0]/15 text-xs text-white font-bold py-2.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#38F8B0]" /> Connect Tonkeeper
                    </button>

                    <button
                      type="button"
                      id="btn-connect-mytonwallet"
                      disabled={loading}
                      onClick={() => {
                        const confirmed = window.confirm('Connect to MyTonWallet client? This will authorize public wallet sync.');
                        if (!confirmed) return;
                        setLoading(true);
                        const mockAddr = `EQB${Math.random().toString(36).substring(2, 10).toUpperCase()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}3X`;
                        
                        fetch('/api/wallet/verify-connect', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user.id,
                            walletAddress: mockAddr,
                            walletProofSignature: `proof_sig_${Math.random().toString(16).substring(2,18)}`
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setLoading(false);
                            if (data.error) {
                              alert(data.error);
                            } else {
                              onProfileUpdated();
                              alert(`Successfully connected MyTonWallet! Address: ${mockAddr}`);
                            }
                          })
                          .catch(() => setLoading(false));
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#B066FF]/20 bg-[#B066FF]/5 hover:bg-[#B066FF]/15 text-xs text-white font-bold py-2.5 transition-all cursor-pointer"
                    >
                      <Wallet className="h-3.5 w-3.5 text-[#B066FF]" /> MyTonWallet Client
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[#05020D]/60 border border-[#A9A3B8]/10 p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#A9A3B8]/5 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase block">Connected Wallet (Decentralized)</span>
                        <span className="text-xs text-[#38F8B0] font-mono break-all font-bold select-text">{user.wallet_address}</span>
                      </div>
                      <button
                        type="button"
                        id="btn-disconnect-wallet"
                        onClick={() => {
                          const confirmed = window.confirm('Disconnect your connected TON wallet address? This action requires confirmation.');
                          if (!confirmed) return;
                          setLoading(true);
                          fetch('/api/wallet/disconnect', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id })
                          })
                            .then(res => res.json())
                            .then(() => {
                              setLoading(false);
                              onProfileUpdated();
                              alert('Wallet disconnected successfully.');
                            })
                            .catch(() => setLoading(false));
                        }}
                        className="rounded px-2.5 py-1 text-[10px] font-bold bg-[#FF4D6D]/15 border border-[#FF4D6D]/20 text-[#FF4D6D] hover:bg-[#FF4D6D]/25 transition-all cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>

                    {/* Live Balances Displays */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-[#05020D]/80 rounded p-1.5 border border-[#A9A3B8]/5">
                        <span className="text-[7px] font-mono tracking-wider text-[#A9A3B8] block uppercase">TON BALANCE</span>
                        <span className="text-xs text-white font-bold font-mono">{(balance.ton_balance_cache || 15.4).toFixed(2)} TON</span>
                      </div>
                      <div className="bg-[#05020D]/80 rounded p-1.5 border border-[#A9A3B8]/5">
                        <span className="text-[7px] font-mono tracking-wider text-[#A9A3B8] block uppercase">GRAM BALANCE</span>
                        <span className="text-xs text-[#38F8B0] font-bold font-mono">{balance.gram_balance_cache || 250} GRAM</span>
                      </div>
                      <div className="bg-[#05020D]/80 rounded p-1.5 border border-[#A9A3B8]/5">
                        <span className="text-[7px] font-mono tracking-wider text-[#A9A3B8] block uppercase">vVIRAL BALANCE</span>
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
                <div className="flex flex-col gap-1.5 pt-1.5">
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

        {activeSubTab === 'faq' && (
          <motion.div
            key="faq-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Visual Feedback Loop Flowchart */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#38F8B0]/5 blur-2xl"></div>
              
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-[#38F8B0]" />
                <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">
                  The $VIRAL Ecosystem Engine Loop
                </h3>
              </div>

              <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                $VIRAL connects advertisers directly with real community members through secure smart contract logic.
              </p>

              {/* Loop Flow Map (Anti AI-Slop, visually polished) */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-2 text-center items-center">
                <div className="bg-[#05020D]/60 border border-[#8A2BFF]/30 p-2.5 rounded-lg">
                  <span className="text-[9px] font-mono text-[#B066FF] block font-bold">1. SPEND</span>
                  <p className="text-[9px] text-[#A9A3B8] mt-1 leading-normal">
                    Promoters spend $VIRAL to fuel launch campaigns
                  </p>
                </div>
                
                <div className="hidden md:flex justify-center text-[#A9A3B8]/40">
                  <ArrowRight className="h-4 w-4 animate-pulse" />
                </div>

                <div className="bg-[#05020D]/60 border border-[#FFD36A]/30 p-2.5 rounded-lg">
                  <span className="text-[9px] font-mono text-[#FFD36A] block font-bold">2. ESCROW SECURED</span>
                  <p className="text-[9px] text-[#A9A3B8] mt-1 leading-normal">
                    Campaign budget locked in escrow to protect assets
                  </p>
                </div>

                <div className="hidden md:flex justify-center text-[#A9A3B8]/40">
                  <ArrowRight className="h-4 w-4 animate-pulse" />
                </div>

                <div className="bg-[#05020D]/60 border border-[#38F8B0]/30 p-2.5 rounded-lg">
                  <span className="text-[9px] font-mono text-[#38F8B0] block font-bold">3. COMPLETE & EARN</span>
                  <p className="text-[9px] text-[#A9A3B8] mt-1 leading-normal">
                    Users complete verified actions & split the reward
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#38F8B0]/5 border border-[#38F8B0]/20 flex items-start gap-2 text-[10px] text-emerald-200/90">
                <Sparkles className="h-3.5 w-3.5 text-[#38F8B0] shrink-0 mt-0.5" />
                <div>
                  <strong>Split breakdown:</strong> Earner gets <strong>80%</strong> of the task payout, Invited Referrer receives <strong>10%</strong>, and the platform Fee Wallet (<code>VIRAL_Fee_wallet</code>) receives a <strong>10%</strong> campaign turnover fee.
                </div>
              </div>
            </div>

            {/* Search and Category Filters */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-3 flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A9A3B8]/60" />
                <input
                  id="faq-search-input"
                  type="text"
                  placeholder="Search FAQ by keyword (e.g. escrow, referral, wallet)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#05020D] text-white rounded-lg border border-[#A9A3B8]/10 focus:border-[#8A2BFF] focus:outline-none"
                />
              </div>

              {/* Category selector */}
              <div className="flex flex-wrap gap-1 shrink-0">
                {['All', 'Platform Basics', 'Promotion & Campaigns', 'Tokens & Rewards', 'Wallets, Fees & Settings'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFaqCategory(cat)}
                    className={`px-2.5 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wide rounded-md border transition-all cursor-pointer ${
                      selectedFaqCategory === cat
                        ? 'bg-[#8A2BFF] border-[#8A2BFF] text-white shadow-[0_0_8px_rgba(138,43,255,0.3)]'
                        : 'bg-[#05020D] border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Accordion List */}
            <div className="space-y-2">
              {(() => {
                // Filter the categories and items based on search and selected category
                const filteredCategories = faqCategories
                  .map(catGroup => {
                    if (selectedFaqCategory !== 'All' && catGroup.category !== selectedFaqCategory) {
                      return null;
                    }
                    const filteredItems = catGroup.items.filter(item => 
                      item.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
                      item.answer.toLowerCase().includes(faqSearch.toLowerCase())
                    );
                    return filteredItems.length > 0 ? { ...catGroup, items: filteredItems } : null;
                  })
                  .filter((cat): cat is typeof faqCategories[0] => cat !== null);

                if (filteredCategories.length === 0) {
                  return (
                    <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-8 text-center text-xs text-[#A9A3B8]">
                      No frequently asked questions match your query. Try a different search keyword.
                    </div>
                  );
                }

                return filteredCategories.map((catGroup) => (
                  <div key={catGroup.category} className="space-y-2">
                    <h4 className="text-[9px] font-bold font-mono text-[#B066FF] uppercase tracking-wider px-1 pt-1.5 flex items-center gap-1">
                      <span className="h-1 w-1 bg-[#B066FF] rounded-full"></span> {catGroup.category}
                    </h4>

                    <div className="grid gap-2">
                      {catGroup.items.map((item) => {
                        const isExpanded = !!expandedFaqs[item.id];
                        return (
                          <div 
                            key={item.id}
                            className={`rounded-xl border transition-all ${
                              isExpanded 
                                ? 'bg-[#0B0618]/90 border-[#8A2BFF]/30 shadow-[0_4px_16px_rgba(138,43,255,0.05)]' 
                                : 'bg-[#0B0618]/50 border-[#A9A3B8]/10 hover:border-[#A9A3B8]/20'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleFaq(item.id)}
                              className="w-full text-left p-3.5 flex items-start justify-between gap-3 cursor-pointer focus:outline-none"
                            >
                              <span className="text-xs font-bold text-white leading-relaxed">
                                {item.id}. {item.question}
                              </span>
                              <span className="p-0.5 shrink-0 bg-[#05020D]/60 rounded-full border border-[#A9A3B8]/5 text-[#A9A3B8]">
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </span>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-1 text-[11px] text-[#A9A3B8] leading-relaxed border-t border-[#A9A3B8]/5">
                                    {item.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'launch' && (
          <motion.div
            key="launch-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Launch Readiness Dashboard Progress */}
            <div className="rounded-xl border border-[#FFD36A]/20 bg-[#FFD36A]/5 p-4 space-y-3 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#FFD36A]/5 blur-2xl"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-[#FFD36A]" />
                  <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">
                    Ecosystem Launch Status Dashboard
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#FFD36A] bg-[#FFD36A]/10 border border-[#FFD36A]/20 px-2 py-0.5 rounded">
                  {launchProgressPercent}% READY
                </span>
              </div>

              <p className="text-[11px] text-[#A9A3B8] leading-relaxed font-sans">
                Review verified checklists of parameters, branding assets, API credentials and infrastructure configs required before full production launching of the $VIRAL App.
              </p>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-2 rounded bg-[#05020D]/80 border border-[#A9A3B8]/10 overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${launchProgressPercent}%` }}
                    className="h-full rounded bg-[#FFD36A] shadow-[0_0_8px_rgba(255,211,106,0.4)]"
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-[#A9A3B8]">
                  <span>{configuredChecklistItems} OF {totalChecklistItems} INTEGRATED</span>
                  <span>{totalChecklistItems - configuredChecklistItems} REMAINING FOR MAINNET</span>
                </div>
              </div>

              <div className="text-[10px] text-[#A9A3B8] italic pt-1 border-t border-[#A9A3B8]/5">
                💡 Developers: Click checklist items below to visually toggle their state and calculate real-time readiness ratings dynamically!
              </div>
            </div>

            {/* Structured Roadmap Sections */}
            <div className="space-y-3">
              {roadmapSections.map((sec) => {
                const isSecExpanded = !!expandedSections[sec.title];
                
                // Calculate Section Specific Progress
                const secItems = sec.items;
                const secTotal = secItems.length;
                const secConfigured = secItems.filter(item => checklistStates[item.id] === 'configured').length;
                const secProgress = Math.round((secConfigured / secTotal) * 100);

                return (
                  <div 
                    key={sec.title}
                    className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/40 glass overflow-hidden"
                  >
                    {/* Section Header */}
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.title)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-3 cursor-pointer focus:outline-none hover:bg-[#05020D]/25 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-2 bg-[#05020D]/60 rounded-lg border border-[#A9A3B8]/5">
                          {renderRoadmapIcon(sec.iconName)}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate font-sans">
                            {sec.title}
                          </h4>
                          <span className="text-[10px] text-[#A9A3B8] block truncate font-sans font-normal">
                            {sec.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          secProgress === 100 
                            ? 'text-[#38F8B0] border-[#38F8B0]/20 bg-[#38F8B0]/5' 
                            : 'text-[#FFD36A] border-[#FFD36A]/20 bg-[#FFD36A]/5'
                        }`}>
                          {secConfigured}/{secTotal}
                        </span>
                        <span className="text-[#A9A3B8]">
                          {isSecExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </div>
                    </button>

                    {/* Section items list */}
                    <AnimatePresence>
                      {isSecExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-[#A9A3B8]/5"
                        >
                          <div className="bg-[#05020D]/10 p-3 divide-y divide-[#A9A3B8]/5 space-y-2">
                            {sec.items.map((item) => {
                              const itemStatus = checklistStates[item.id] || item.status;
                              const isConfigured = itemStatus === 'configured';

                              return (
                                <div 
                                  key={item.id}
                                  onClick={() => toggleChecklistItem(item.id)}
                                  className="flex items-start justify-between gap-3 py-2 cursor-pointer group hover:bg-[#05020D]/20 px-1 rounded transition-all"
                                >
                                  <div className="flex gap-2.5 min-w-0 items-start">
                                    <span className="mt-0.5 shrink-0 text-[#A9A3B8] group-hover:text-white">
                                      {isConfigured ? (
                                        <CheckSquare className="h-4 w-4 text-[#38F8B0]" />
                                      ) : (
                                        <Square className="h-4 w-4 text-[#A9A3B8]/40" />
                                      )}
                                    </span>
                                    <div className="min-w-0">
                                      <span className={`text-xs block font-sans leading-relaxed ${
                                        isConfigured ? 'text-white font-medium' : 'text-[#A9A3B8]'
                                      }`}>
                                        {item.label}
                                      </span>
                                      {item.notes && (
                                        <span className="text-[10px] font-mono text-gray-500 block mt-0.5 truncate">
                                          {item.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 mt-0.5 ${
                                    isConfigured 
                                      ? 'bg-[#38F8B0]/10 border-[#38F8B0]/20 text-[#38F8B0]' 
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  }`}>
                                    {isConfigured ? 'Ready' : 'Pending'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
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
    </div>
  );
}
