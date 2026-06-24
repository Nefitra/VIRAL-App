import React, { useState, useEffect } from 'react';
import { Coins, ShieldAlert, CheckCircle, ExternalLink, RefreshCw, AlertTriangle, Timer, Clock } from 'lucide-react';
import { User, Balance } from '../types';

interface EarnProps {
  user: User;
  balance: Balance;
  selectedCampaignFromDiscover: any;
  onTaskCompleted: () => void;
}

export default function Earn({ user, balance, selectedCampaignFromDiscover, onTaskCompleted }: EarnProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState<any | null>(null);

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [dwellTime, setDwellTime] = useState<number | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCampaigns = () => {
    setLoading(true);
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        setCampaigns(data);
        setLoading(false);
        
        // If a campaign was clicked from the discover dashboard, find it and select it
        if (selectedCampaignFromDiscover) {
          const matched = data.find((c: any) => c.id === selectedCampaignFromDiscover.id);
          if (matched) {
            setSelectedCamp(matched);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching campaigns:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCampaignFromDiscover]);

  const handleStartTask = (camp: any) => {
    setSelectedCamp(camp);
    setVerificationResult(null);
    setErrorMsg('');
    setDwellTime(null);

    // If website, simulate minimum dwell time countdown (10s)
    if (camp.campaign_type === 'website') {
      setDwellTime(10);
      // Open in a new tab if allowed, or simulate dwell time
      const timer = setInterval(() => {
        setDwellTime((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleVerifyTask = () => {
    if (!selectedCamp) return;
    
    // Website check: must complete dwell timer
    if (selectedCamp.campaign_type === 'website' && dwellTime !== null && dwellTime > 0) {
      setErrorMsg(`Anti-bot dwell time check active: Please wait ${dwellTime}s more on website.`);
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    const verificationPayload = selectedCamp.campaign_type === 'website' 
      ? 'Stayed 10 seconds on website, checked scrolling interactions.'
      : selectedCamp.campaign_type === 'channel'
        ? `Requested Telegram join channel @${selectedCamp.resource?.url.split('/').pop()}`
        : `Launched Telegram bot via Startapp token: promo_${user.id}`;

    fetch(`/api/campaigns/${selectedCamp.id}/verify-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        verification_data: verificationPayload
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsVerifying(false);
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setVerificationResult(data);
          onTaskCompleted();
          // Update local campaign list to show status changes
          fetchCampaigns();
        }
      })
      .catch(() => {
        setIsVerifying(false);
        setErrorMsg('Network verification failed. Please try again.');
      });
  };

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-3.5 space-y-1">
        <div className="text-[9px] font-mono tracking-wider text-[#B066FF] uppercase font-bold">Anti-Fraud Protection System</div>
        <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
          <strong>Complete verified tasks from active campaigns and receive vVIRAL rewards. Rewards may be delayed for anti-fraud checks.</strong> Fake clicks, VPN proxy abuse or multi-accounts will trigger risk flags and result in account bans.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Active Tasks Directory (Left pane on wider screen, otherwise responsive) */}
        <div className="md:col-span-1 space-y-2.5">
          <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">Campaign Tasks Available</h3>
          
          {loading ? (
            <div className="text-xs text-[#A9A3B8] font-mono">Loading campaign tasks...</div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#A9A3B8]/15 bg-[#0B0618]/30 p-5 text-center text-xs text-[#A9A3B8]">
              All campaign escrows are currently cleared. Launch a campaign to reward users!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  id={`earn-task-item-${camp.id}`}
                  onClick={() => handleStartTask(camp)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                    selectedCamp?.id === camp.id
                      ? 'bg-[#8A2BFF]/15 border-[#8A2BFF] shadow-md shadow-[#8A2BFF]/10'
                      : 'bg-[#0B0618]/40 border-[#A9A3B8]/10 hover:border-[#8A2BFF]/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="text-xs font-extrabold text-white truncate max-w-[110px] uppercase tracking-tight">
                      {camp.resource?.title}
                    </h4>
                    <span className="text-[10px] font-black text-[#FFD36A] font-mono shrink-0">
                      +{camp.reward_per_action}
                    </span>
                  </div>
                  
                  <div className="mt-1.5 flex items-center justify-between text-[8px] font-mono text-[#A9A3B8]">
                    <span className="uppercase">{camp.campaign_type}</span>
                    <span>{camp.approved_actions}/{camp.max_actions} actions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Details & Action Terminal (Right/Center pane) */}
        <div className="md:col-span-2 space-y-2.5">
          <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">Verification Terminal</h3>

          {selectedCamp ? (
            <div className="rounded-xl border border-[#8A2BFF]/25 glass p-4 space-y-4">
              {/* Asset Intro */}
              <div className="flex gap-3 items-start pb-3 border-b border-[#A9A3B8]/5">
                <img
                  referrerPolicy="no-referrer"
                  src={selectedCamp.resource?.image_url}
                  alt={selectedCamp.resource?.title}
                  className="h-10 w-10 rounded-lg object-cover bg-neutral-800 border border-[#A9A3B8]/10"
                />
                <div className="space-y-0.5 min-w-0">
                  <span className="bg-[#8A2BFF]/10 border border-[#8A2BFF]/20 text-[#B066FF] px-1.5 py-0.5 rounded text-[8px] font-mono font-medium uppercase inline-block">
                    {selectedCamp.campaign_type}
                  </span>
                  <h4 className="font-sans text-xs font-black text-white truncate uppercase tracking-tight">{selectedCamp.resource?.title}</h4>
                  <p className="text-[11px] text-[#A9A3B8] leading-relaxed line-clamp-1">
                    {selectedCamp.resource?.description}
                  </p>
                </div>
              </div>

              {/* Reward & Requirements details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#05020D]/60 p-2.5 border border-[#A9A3B8]/5">
                  <div className="stat-label">YOUR COMPLETED REWARD</div>
                  <div className="mt-1 flex items-baseline gap-0.5 text-xs font-black text-[#FFD36A]">
                    <span>+{selectedCamp.reward_per_action}</span>
                    <span className="text-[8px] font-normal text-[#A9A3B8]">vVIRAL</span>
                  </div>
                </div>

                <div className="rounded-lg bg-[#05020D]/60 p-2.5 border border-[#A9A3B8]/5">
                  <div className="stat-label">ESCROW PROTECTION</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#38F8B0]">
                    <CheckCircle className="h-3.5 w-3.5" /> Locked & Active
                  </div>
                </div>
              </div>

              {/* Interactive task execution container */}
              {!verificationResult ? (
                <div className="space-y-3.5">
                  {/* Action Steps */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-white font-semibold">
                      <span className="h-4.5 w-4.5 rounded-full bg-[#8A2BFF]/20 border border-[#8A2BFF]/30 flex items-center justify-center font-mono text-[9px] text-[#B066FF] font-bold">1</span>
                      <span>Click below to open/interact with the digital resource:</span>
                    </div>

                    <a
                      id="earn-open-resource-link"
                      href={selectedCamp.resource?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFD36A] hover:underline bg-[#FFD36A]/5 px-3.5 py-2 rounded-md border border-[#FFD36A]/20 cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" /> Open {selectedCamp.resource?.title}
                    </a>

                    {dwellTime !== null && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#FFD36A] bg-[#FFD36A]/5 border border-[#FFD36A]/10 p-2 rounded-md mt-1">
                        <Timer className="h-3.5 w-3.5 animate-spin" />
                        <span>Dwell Time Check: Keep website open for <strong>{dwellTime}s</strong> to verify traffic quality.</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#A9A3B8]/5 pt-3.5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-white font-semibold">
                      <span className="h-4.5 w-4.5 rounded-full bg-[#8A2BFF]/20 border border-[#8A2BFF]/30 flex items-center justify-center font-mono text-[9px] text-[#B066FF] font-bold">2</span>
                      <span>Run anti-fraud ledger verification routine:</span>
                    </div>

                    {errorMsg && (
                      <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2 rounded-md">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      id="earn-btn-verify"
                      onClick={handleVerifyTask}
                      disabled={isVerifying || (selectedCamp.campaign_type === 'website' && dwellTime !== null && dwellTime > 0)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8A2BFF] hover:bg-[#B066FF] disabled:opacity-50 text-xs font-bold py-2.5 text-white shadow-lg cursor-pointer transition-all"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Performing Fraud Database Audit...
                        </>
                      ) : (
                        'Run Verification & Claim'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Verification Success/Pending State card */
                <div className="rounded-lg bg-[#05020D]/60 p-3.5 border border-[#A9A3B8]/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[#38F8B0]">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">Ledger Verification Complete</h5>
                  </div>
                  
                  {verificationResult.status === 'approved' ? (
                    <div className="space-y-1">
                      <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                        Congratulations! Your action was verified by the platform and the advertising escrow released <strong>+{verificationResult.reward} vVIRAL</strong> directly to your balance.
                      </p>
                      {verificationResult.referrerReward > 0 && (
                        <p className="text-[9px] text-[#38F8B0] font-mono">
                          • Referred network match found! Referrer rewarded +{verificationResult.referrerReward} vVIRAL (10%) from campaign.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5 bg-[#FFD36A]/5 border border-[#FFD36A]/20 p-2.5 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-[#FFD36A] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
                          Your quality score is marked as <strong>New User</strong>. To protect the advertiser's escrow from bots, your reward of <strong>{verificationResult.reward} vVIRAL</strong> is currently <strong className="text-[#FFD36A]">Pending Review</strong>.
                        </p>
                      </div>
                      <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
                        An admin or advertiser will review your verification payload shortly. Once approved, the funds will be credited to your wallet. You can increase your trust score by connecting your TON wallet!
                      </p>
                    </div>
                  )}

                  <button
                    id="earn-btn-another"
                    onClick={() => {
                      setSelectedCamp(null);
                      setVerificationResult(null);
                      setErrorMsg('');
                    }}
                    className="mt-1 text-xs font-bold text-[#8A2BFF] hover:underline cursor-pointer"
                  >
                    Select Another Campaign
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#A9A3B8]/10 bg-[#0B0618]/40 py-12 text-center space-y-1.5 text-[#A9A3B8]">
              <Coins className="mx-auto h-7 w-7 text-[#A9A3B8]/20" />
              <p className="text-[11px]">Select a campaign task on the left to review instructions and start earning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
