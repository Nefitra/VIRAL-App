import React, { useState } from 'react';
import { User, Balance } from '../types';
import { HelpCircle, ShieldAlert, BadgeCheck, Mail, Wallet, UserCheck, MessageSquare, BookOpen, Trophy, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MoreProps {
  user: User;
  balance: Balance;
  onProfileUpdated: () => void;
}

export default function More({ user, balance, onProfileUpdated }: MoreProps) {
  // Profile update form states
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [walletInput, setWalletInput] = useState(user.wallet_address || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

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
  
  // Calculate current tier and next tier progress based on user's quality score and viral power
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
    // New User
    nextTier = 'Verified User';
    progressMin = 0;
    progressMax = 25;
    tierColor = 'text-gray-400 border-gray-400/20 bg-gray-400/5';
  }

  const percent = progressMax === progressMin ? 100 : Math.min(100, Math.max(0, ((vp - progressMin) / (progressMax - progressMin)) * 100));

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

      {/* 1. Profile and Onboarding Incentives Form */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
        <h3 className="font-sans text-xs font-bold text-[#B066FF] uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="h-4 w-4" /> Profile & Achievements
        </h3>
        <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
          Complete onboarding tasks below to increase your <strong>Viral Power</strong> reputation and unlock instant <strong>vVIRAL</strong> rewards.
        </p>

        <form onSubmit={handleUpdateProfile} className="space-y-3 pt-1">
          {/* Email verification input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase">Verify Email Address</label>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${user.email ? 'bg-[#38F8B0]/10 text-[#38F8B0]' : 'bg-[#FFD36A]/10 text-[#FFD36A]'}`}>
                {user.email ? 'Verified (+10 vVIRAL)' : '+10 vVIRAL Bonus'}
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#A9A3B8]" />
              <input
                id="more-profile-email"
                type="email"
                placeholder="enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 py-2 pr-3 pl-8 text-xs text-white focus:border-[#8A2BFF] focus:outline-none placeholder-[#A9A3B8]/30"
              />
            </div>
          </div>

          {/* TON Wallet Connection input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase">Connect TON Wallet</label>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${user.wallet_address ? 'bg-[#38F8B0]/10 text-[#38F8B0]' : 'bg-[#FFD36A]/10 text-[#FFD36A]'}`}>
                {user.wallet_address ? 'Connected (+30 vVIRAL)' : '+30 vVIRAL Bonus'}
              </span>
            </div>
            <div className="relative">
              <Wallet className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#A9A3B8]" />
              <input
                id="more-profile-wallet"
                type="text"
                placeholder="EQA... enter your TON address"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 py-2 pr-3 pl-8 text-xs text-white focus:border-[#8A2BFF] focus:outline-none placeholder-[#A9A3B8]/30"
              />
            </div>
          </div>

          {errorMsg && <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2 rounded">{errorMsg}</div>}
          {successMsg && <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 p-2 rounded">{successMsg}</div>}

          <button
            id="more-submit-profile"
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8A2BFF] hover:bg-[#B066FF] text-xs font-bold py-2.5 text-white cursor-pointer transition-all"
          >
            {loading ? 'Verifying...' : 'Save Profile & Claim Bonuses'}
          </button>
        </form>
      </div>

      {/* 2. Frequently Asked Questions (FAQ) */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
        <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" /> Frequently Asked Questions
        </h3>

        <div className="space-y-3 divide-y divide-[#A9A3B8]/5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">What is vVIRAL?</h4>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              vVIRAL is an internal platform token representing valid utility points before the official token bonding event. It acts as fuel to configure advertising campaigns and rewards community actions inside our ecosystem.
            </p>
          </div>

          <div className="space-y-1 pt-2.5">
            <h4 className="text-xs font-bold text-white">How does Escrow Protection work?</h4>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              When an advertiser starts a campaign, the reward budget (90% after platform fees) is locked in a secure escrow database. This ensures promoters cannot retrieve funds while users are actively completing tasks, and users are guaranteed payouts for verified actions.
            </p>
          </div>

          <div className="space-y-1 pt-2.5">
            <h4 className="text-xs font-bold text-white">What are the earning limit caps?</h4>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              To protect the token economy from malicious bots and farming, the system enforces a strict reward limit cap of <strong>1,000 vVIRAL daily</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Community Support */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-3.5 flex items-center justify-between">
        <div className="space-y-0.5 min-w-0">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-[#8A2BFF]" /> Developer Support
          </h4>
          <p className="text-[11px] text-[#A9A3B8] truncate">Join our official support channel to suggest features and get help.</p>
        </div>
        <a
          id="more-support-link"
          href="https://t.me/viral_support_official"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-[#8A2BFF] hover:underline whitespace-nowrap ml-3"
        >
          Open Support
        </a>
      </div>

      {/* 4. Platform Disclaimer Section (Section 24) */}
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
