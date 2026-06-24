import React, { useState, useEffect } from 'react';
import { Users, Copy, CheckCircle, Gift, Award, HelpCircle } from 'lucide-react';
import { User } from '../types';

interface ReferralsProps {
  user: User;
}

export default function Referrals({ user }: ReferralsProps) {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/referrals/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching referrals:', err);
        setLoading(false);
      });
  }, [user.id]);

  const referralLink = `https://t.me/viral_promotion_bot?start=ref_${user.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Overview Intro */}
      <div className="relative overflow-hidden rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-2">
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#FFD36A]/5 blur-2xl"></div>
        <h2 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
          <Gift className="h-4 w-4" /> Mutual Referral Network
        </h2>
        <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
          <strong>Invite active users and receive 10% of their valid approved earnings. Fake or duplicate accounts do not generate rewards.</strong> Self-referral abuse is guarded by system audits and will lead to total claim invalidation.
        </p>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3">
          <div className="stat-label">Total Invited Network</div>
          <div className="mt-1 flex items-baseline gap-1 text-base font-extrabold text-white">
            <span className="font-mono text-white">{stats?.count || 0}</span>
            <span className="text-[9px] text-[#A9A3B8]">users</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3">
          <div className="stat-label">Total Referrer Rewards</div>
          <div className="mt-1 flex items-baseline gap-1 text-base font-extrabold text-[#38F8B0]">
            <span className="font-mono">+{stats?.totalReferralRewards?.toLocaleString() || 0}</span>
            <span className="text-[9px] text-[#A9A3B8] font-normal">vVIRAL</span>
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3 sm:col-span-1">
          <div className="stat-label">Multiplier Rate</div>
          <div className="mt-1 text-xs font-extrabold text-[#B066FF] uppercase tracking-wider font-mono">
            10% Fee Rebate
          </div>
        </div>
      </div>

      {/* Copy link Box */}
      <div className="rounded-xl border border-[#8A2BFF]/25 bg-[#05020D]/60 glass p-4 space-y-2.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-tight">Your Personal Promotional Telegram Link</h3>
        
        <div className="flex gap-2">
          <input
            id="referrals-link-input"
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded bg-[#0B0618] border border-[#A9A3B8]/10 px-3 py-2 text-[11px] text-[#A9A3B8] font-mono focus:outline-none"
          />
          <button
            id="referrals-btn-copy"
            onClick={handleCopy}
            className="rounded bg-[#8A2BFF] hover:bg-[#B066FF] px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invited Users List */}
      <div className="space-y-2">
        <h3 className="font-sans text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-4 w-4 text-[#B066FF]" /> Invited Network Users ({stats?.referrals?.length || 0})
        </h3>

        {loading ? (
          <div className="text-[11px] text-[#A9A3B8] font-mono">Loading invited network list...</div>
        ) : !stats || stats.referrals.length === 0 ? (
          <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618] p-5 text-center text-xs text-[#A9A3B8]">
            No invited users registered on your network link yet. Share your promo link above!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {stats.referrals.map((ref: any) => (
              <div key={ref.id} className="flex gap-2 items-center justify-between p-2.5 rounded-lg border border-[#A9A3B8]/10 bg-[#0B0618]/40 glass hover:border-[#8A2BFF]/20 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-white truncate">@{ref.invited_username}</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#8A2BFF]/10 text-[#B066FF] px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase">
                      {ref.invited_quality}
                    </span>
                    <span className="text-[9px] text-[#A9A3B8] font-mono">
                      Joined {new Date(ref.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[8px] font-mono text-[#A9A3B8] uppercase tracking-wider">Invited earnings</div>
                  <div className="text-xs font-extrabold text-white font-mono">
                    {ref.total_invited_earnings} vVIRAL
                  </div>
                  <div className="text-[9px] text-[#38F8B0] font-bold font-mono">
                    +{ref.total_referrer_rewards} (10%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
