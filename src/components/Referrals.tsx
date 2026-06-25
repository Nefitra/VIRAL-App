import React, { useState, useEffect } from 'react';
import { Users, Copy, CheckCircle, Gift, Award, HelpCircle, Share2, Layers } from 'lucide-react';
import { User } from '../types';

interface ReferralsProps {
  user: User;
}

export default function Referrals({ user }: ReferralsProps) {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeLevelTab, setActiveLevelTab] = useState<'l1' | 'l2'>('l1');

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

  // Generate unique referral link using their Telegram ID if available, otherwise internal ID
  const referralLink = `https://t.me/Viral_App_Bot/app?startapp=ref_${user.telegram_id || user.id}`;
  const shareText = "🚀 Earn free tokens on the $VIRAL Promotion Ecosystem by completing simple social campaigns! Join now via my network:";
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Overview Intro */}
      <div className="relative overflow-hidden rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-2">
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#FFD36A]/5 blur-2xl"></div>
        <h2 className="text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
          <Gift className="h-4 w-4" /> Multilevel Web3 Referral Network
        </h2>
        <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
          <strong>Invite active advocates and earn from their valid completed tasks! Receive a direct 10% Level 1 (L1) reward, and an indirect 5% Level 2 (L2) reward when your invitees invite others.</strong> Self-referral fraud detection rules apply.
        </p>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3">
          <div className="stat-label">Total Network Size</div>
          <div className="mt-1 flex items-baseline gap-1 text-base font-extrabold text-white">
            <span className="font-mono text-white">
              {(stats?.count || 0) + (stats?.countL2 || 0)}
            </span>
            <span className="text-[9px] text-[#A9A3B8] font-normal">users</span>
          </div>
          <div className="text-[8px] font-mono text-[#A9A3B8] mt-0.5">
            {stats?.count || 0} L1 • {stats?.countL2 || 0} L2
          </div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3">
          <div className="stat-label">Total Referrer Rewards</div>
          <div className="mt-1 flex items-baseline gap-1 text-base font-extrabold text-[#38F8B0]">
            <span className="font-mono">+{stats?.totalReferralRewards?.toLocaleString() || 0}</span>
            <span className="text-[9px] text-[#A9A3B8] font-normal">vVIRAL</span>
          </div>
          <div className="text-[8px] font-mono text-[#38F8B0] mt-0.5">
            +{stats?.totalReferralRewardsL1 || 0} L1 • +{stats?.totalReferralRewardsL2 || 0} L2
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3 sm:col-span-1">
          <div className="stat-label">Network Rates</div>
          <div className="mt-1 flex flex-col gap-0.5 text-xs font-mono font-bold text-[#B066FF] uppercase">
            <div>L1: 10% Direct</div>
            <div>L2: 5% Indirect</div>
          </div>
        </div>
      </div>

      {/* Copy link Box */}
      <div className="rounded-xl border border-[#8A2BFF]/25 bg-[#05020D]/60 glass p-4 space-y-2.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-tight">Your Unique Network Invite Link</h3>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="referrals-link-input"
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded bg-[#0B0618] border border-[#A9A3B8]/10 px-3 py-2 text-[11px] text-[#A9A3B8] font-mono focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              id="referrals-btn-copy"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial rounded bg-[#8A2BFF] hover:bg-[#B066FF] px-3.5 py-2 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
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
            <a
              id="referrals-btn-share"
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial rounded bg-gradient-to-r from-[#FFD36A] to-[#FF9F1C] hover:from-[#FF9F1C] hover:to-[#FFD36A] px-3.5 py-2 text-xs font-bold text-black flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <Share2 className="h-3.5 w-3.5 text-black" /> Share Link
            </a>
          </div>
        </div>
      </div>

      {/* Invited Users List */}
      <div className="space-y-3">
        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-[#A9A3B8]/10 pb-1">
          <h3 className="font-sans text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#B066FF]" /> Referral Network Tree
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveLevelTab('l1')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLevelTab === 'l1'
                  ? 'bg-[#8A2BFF]/20 text-[#B066FF] border border-[#8A2BFF]/30'
                  : 'text-[#A9A3B8] hover:text-white hover:bg-[#A9A3B8]/5'
              }`}
            >
              Level 1 Direct ({stats?.referrals?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveLevelTab('l2')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLevelTab === 'l2'
                  ? 'bg-[#B066FF]/20 text-[#B066FF] border border-[#B066FF]/30'
                  : 'text-[#A9A3B8] hover:text-white hover:bg-[#A9A3B8]/5'
              }`}
            >
              Level 2 Network ({stats?.level2Referrals?.length || 0})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-[11px] text-[#A9A3B8] font-mono py-4">Loading your multi-level network...</div>
        ) : activeLevelTab === 'l1' ? (
          /* LEVEL 1 LISTING */
          !stats || stats.referrals.length === 0 ? (
            <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618] p-6 text-center text-xs text-[#A9A3B8]">
              No direct Level 1 referrals registered on your network link yet. Share your link above to get started!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
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
                    <div className="text-[8px] font-mono text-[#A9A3B8] uppercase tracking-wider">L1 Earnings</div>
                    <div className="text-xs font-extrabold text-white font-mono">
                      {ref.total_invited_earnings} vVIRAL
                    </div>
                    <div className="text-[9px] text-[#38F8B0] font-bold font-mono">
                      +{ref.total_referrer_rewards} (10% L1)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* LEVEL 2 LISTING */
          !stats || stats.level2Referrals.length === 0 ? (
            <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618] p-6 text-center text-xs text-[#A9A3B8]">
              No Level 2 network users discovered. When your Level 1 referrals invite users of their own, they will appear here!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {stats.level2Referrals.map((ref: any) => (
                <div key={ref.id} className="flex gap-2 items-center justify-between p-2.5 rounded-lg border border-[#A9A3B8]/10 bg-[#0B0618]/40 glass hover:border-[#B066FF]/20 transition-all">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-white truncate">@{ref.invited_username}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-[#B066FF]/10 text-[#B066FF] px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase">
                        Via @{ref.referred_via}
                      </span>
                      <span className="text-[9px] text-[#A9A3B8] font-mono">
                        Joined {new Date(ref.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[8px] font-mono text-[#A9A3B8] uppercase tracking-wider">L2 Earnings</div>
                    <div className="text-xs font-extrabold text-white font-mono">
                      {ref.total_invited_earnings} vVIRAL
                    </div>
                    <div className="text-[9px] text-[#FFD36A] font-bold font-mono">
                      +{Math.floor(ref.total_invited_earnings * 0.05)} (5% L2)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
