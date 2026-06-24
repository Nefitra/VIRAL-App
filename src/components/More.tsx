import React, { useState } from 'react';
import { User, Balance } from '../types';
import { HelpCircle, ShieldAlert, BadgeCheck, Mail, Wallet, UserCheck, MessageSquare, BookOpen } from 'lucide-react';

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

  return (
    <div className="space-y-4">
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
