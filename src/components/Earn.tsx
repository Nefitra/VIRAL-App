import React, { useState, useEffect } from 'react';
import { Coins, ShieldAlert, ShieldCheck, CheckCircle, ExternalLink, RefreshCw, AlertTriangle, Timer, Clock } from 'lucide-react';
import { User, Balance } from '../types';
import { useToast } from './Toast';

interface EarnProps {
  user: User;
  balance: Balance;
  selectedCampaignFromDiscover: any;
  onTaskCompleted: () => void;
}

export default function Earn({ user, balance, selectedCampaignFromDiscover, onTaskCompleted }: EarnProps) {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState<any | null>(null);

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [dwellTime, setDwellTime] = useState<number | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Phase 3 States
  const [publicProfile, setPublicProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Reporting states
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('Phishing / Security Scam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportEvidence, setReportEvidence] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');

  // Appeal states
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [appealError, setAppealError] = useState('');

  // Active view inside verification detail card: 'task' | 'profile' | 'report' | 'appeal'
  const [activeDetailSection, setActiveDetailSection] = useState<'task' | 'profile' | 'report' | 'appeal'>('task');

  const fetchPublicProfile = () => {
    const resId = selectedCamp?.resource_id || selectedCamp?.resource?.id;
    if (!resId) return;
    setLoadingProfile(true);
    fetch(`/api/resources/${resId}/public-verification`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setPublicProfile(data);
        }
        setLoadingProfile(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingProfile(false);
      });
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');
    setReportSuccess(false);
    
    const resId = selectedCamp?.resource_id || selectedCamp?.resource?.id;
    if (!resId || !reportDetails) {
      setReportError('Please write down report details.');
      return;
    }

    setIsReporting(true);
    fetch(`/api/resources/${resId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        reason: reportReason,
        details: reportDetails,
        evidence_link: reportEvidence
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsReporting(false);
        if (data.error) {
          setReportError(data.error);
        } else {
          setReportSuccess(true);
          setReportDetails('');
          setReportEvidence('');
          showToast('Thank you for reporting. The Sentinel Shield is scanning this resource now.', 'info', 'Report Received');
          fetchPublicProfile();
        }
      })
      .catch(() => {
        setIsReporting(false);
        setReportError('Connection error submitting report.');
      });
  };

  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    setAppealError('');
    setAppealSuccess(false);

    const resId = selectedCamp?.resource_id || selectedCamp?.resource?.id;
    if (!resId || !appealReason) {
      setAppealError('Please explain your grounds for appeal.');
      return;
    }

    setIsAppealing(true);
    fetch(`/api/resources/${resId}/appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_user_id: user.id,
        explanation: appealReason,
        additional_info: 'Self-governance claim'
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsAppealing(false);
        if (data.error) {
          setAppealError(data.error);
        } else {
          setAppealSuccess(true);
          setAppealReason('');
          showToast('Appeal registered successfully. The safety desk is on the case.', 'info', 'Appeal Filed');
          fetchPublicProfile();
        }
      })
      .catch(() => {
        setIsAppealing(false);
        setAppealError('Connection error submitting appeal.');
      });
  };

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

  useEffect(() => {
    if (selectedCamp) {
      fetchPublicProfile();
      setActiveDetailSection('task');
      setReportSuccess(false);
      setAppealSuccess(false);
    } else {
      setPublicProfile(null);
    }
  }, [selectedCamp]);

  const handleStartTask = (camp: any) => {
    setSelectedCamp(camp);
    setVerificationResult(null);
    setErrorMsg('');
    setDwellTime(null);
    showToast(`Task started for ${camp.resource?.title}. Complete instructions to claim ${camp.reward_per_action} vVIRAL.`, 'info', 'Task Started');

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
      const remainingMsg = `Anti-bot dwell time active: Please wait ${dwellTime}s more on website.`;
      setErrorMsg(remainingMsg);
      showToast(remainingMsg, 'error', 'Anti-Bot Delay');
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
          showToast(data.error, 'error', 'Audit Rejected');
        } else {
          setVerificationResult(data);
          showToast(`Verified action! Received +${selectedCamp.reward_per_action} vVIRAL reward successfully.`, 'reward', 'Claim Verified');
          onTaskCompleted();
          // Update local campaign list to show status changes
          fetchCampaigns();
        }
      })
      .catch(() => {
        setIsVerifying(false);
        setErrorMsg('Network verification failed. Please try again.');
        showToast('Ecosystem connection failed. Please try again.', 'error', 'Network Failure');
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

              {/* Internal Tab selectors for detail card */}
              <div className="flex border-b border-[#A9A3B8]/10 text-[10px] font-bold uppercase tracking-wider pb-1">
                <button
                  onClick={() => setActiveDetailSection('task')}
                  className={`flex-1 py-1.5 border-b-2 transition-all cursor-pointer ${
                    activeDetailSection === 'task'
                      ? 'border-[#8A2BFF] text-white font-extrabold'
                      : 'border-transparent text-[#A9A3B8] hover:text-white'
                  }`}
                >
                  Task Claim
                </button>
                <button
                  onClick={() => setActiveDetailSection('profile')}
                  className={`flex-1 py-1.5 border-b-2 transition-all cursor-pointer ${
                    activeDetailSection === 'profile'
                      ? 'border-[#38F8B0] text-white font-extrabold'
                      : 'border-transparent text-[#A9A3B8] hover:text-white'
                  }`}
                >
                  Verification Profile
                </button>
                <button
                  onClick={() => setActiveDetailSection('report')}
                  className={`flex-1 py-1.5 border-b-2 transition-all cursor-pointer ${
                    activeDetailSection === 'report'
                      ? 'border-[#FF4D6D] text-white font-extrabold'
                      : 'border-transparent text-[#A9A3B8] hover:text-white'
                  }`}
                >
                  Report Link
                </button>
                {(publicProfile?.status === 'suspended' || selectedCamp.resource?.status === 'suspended') && (
                  <button
                    onClick={() => setActiveDetailSection('appeal')}
                    className={`flex-1 py-1.5 border-b-2 transition-all cursor-pointer ${
                      activeDetailSection === 'appeal'
                        ? 'border-[#FFD36A] text-white font-extrabold'
                        : 'border-transparent text-[#A9A3B8] hover:text-white'
                    }`}
                  >
                    Appeal Ban
                  </button>
                )}
              </div>

              {/* 1. TASK CLAIM SUB-TAB */}
              {activeDetailSection === 'task' && (
                <div className="space-y-4">
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
              )}

              {/* 2. PUBLIC VERIFICATION PROFILE SUB-TAB */}
              {activeDetailSection === 'profile' && (
                <div className="space-y-4">
                  {loadingProfile ? (
                    <div className="text-xs text-[#A9A3B8] font-mono py-12 text-center animate-pulse flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#38F8B0]" />
                      Loading live Sentinel security metrics...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Security Header badge & Rating */}
                      <div className="rounded-lg bg-black/40 border border-[#38F8B0]/20 p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-full ${
                            publicProfile?.risk_level === 'High Risk' ? 'bg-[#FF4D6D]/10 text-[#FF4D6D]' : 'bg-[#38F8B0]/10 text-[#38F8B0]'
                          }`}>
                            <ShieldCheck className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-[8px] font-mono uppercase tracking-wider block text-gray-400">Security Rating Badge</span>
                            <span className="text-sm font-sans font-extrabold text-white flex items-center gap-1 uppercase tracking-tight">
                              {publicProfile?.trust_badge_level || 'Sentinel Verified'}
                            </span>
                          </div>
                        </div>

                        {/* Trust score dynamic pill */}
                        <div className="bg-[#05020D]/80 border border-[#A9A3B8]/10 rounded-xl p-2.5 flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">Trust Score</span>
                            <span className={`text-base font-extrabold font-mono ${
                              (publicProfile?.trust_score || 50) >= 80 ? 'text-[#38F8B0]' : (publicProfile?.trust_score || 50) >= 50 ? 'text-[#FFD36A]' : 'text-[#FF4D6D]'
                            }`}>
                              {publicProfile?.trust_score || 50} / 100
                            </span>
                          </div>
                          <div className="h-10 w-10 rounded-full border-4 flex items-center justify-center text-[10px] font-bold font-mono" style={{
                            borderColor: (publicProfile?.trust_score || 50) >= 80 ? '#38F8B0' : (publicProfile?.trust_score || 50) >= 50 ? '#FFD36A' : '#FF4D6D'
                          }}>
                            {publicProfile?.trust_score || 50}%
                          </div>
                        </div>
                      </div>

                      {/* Security Parameters Bento */}
                      <div className="grid grid-cols-2 gap-3.5 text-xs">
                        <div className="bg-[#05020D]/60 p-3 rounded-lg border border-[#A9A3B8]/5">
                          <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">Community Reputation</span>
                          <span className="text-sm font-extrabold font-mono text-[#38F8B0] block">
                            {publicProfile?.community_reputation || 80}%
                          </span>
                          <span className="text-[8px] text-gray-500">Based on verified user feedback</span>
                        </div>

                        <div className="bg-[#05020D]/60 p-3 rounded-lg border border-[#A9A3B8]/5">
                          <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">Ownership Status</span>
                          <span className="text-sm font-extrabold text-white block uppercase tracking-tight">
                            {publicProfile?.ownership_status === 'verified' ? 'Verified Telegram Owner' : 'Self-declared ownership'}
                          </span>
                          <span className="text-[8px] text-gray-500">Cryptographically tested</span>
                        </div>

                        <div className="bg-[#05020D]/60 p-3 rounded-lg border border-[#A9A3B8]/5">
                          <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">Campaign Turnover</span>
                          <span className="text-sm font-extrabold font-mono text-[#FFD36A] block">
                            {publicProfile?.campaign_statistics?.total_created || 0} Campaigns
                          </span>
                          <span className="text-[8px] text-gray-500">Active protection: {publicProfile?.campaign_statistics?.active_now || 0}</span>
                        </div>

                        <div className="bg-[#05020D]/60 p-3 rounded-lg border border-[#A9A3B8]/5">
                          <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">Security Scan Date</span>
                          <span className="text-sm font-extrabold text-[#B066FF] block">
                            {publicProfile?.last_scanned_at ? new Date(publicProfile.last_scanned_at).toLocaleDateString() : 'Today'}
                          </span>
                          <span className="text-[8px] text-gray-500">Continuous rescan shield active</span>
                        </div>
                      </div>

                      {/* Owner wallet reputation */}
                      <div className="bg-[#05020D]/80 border border-[#A9A3B8]/10 p-3.5 rounded-lg space-y-1.5 text-xs">
                        <span className="text-[9px] font-mono text-[#A9A3B8] uppercase block">Advertiser Wallet Risk Intelligence</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#A9A3B8]">Risk Profile Status:</span>
                          <span className={`font-bold font-mono uppercase text-[10px] ${
                            publicProfile?.owner_wallet_risk === 'High Risk' ? 'text-[#FF4D6D]' : 'text-[#38F8B0]'
                          }`}>
                            {publicProfile?.owner_wallet_risk || 'Low Risk'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1">
                          <span className="text-[#A9A3B8]">Advertiser Wallet Score:</span>
                          <span className="font-bold text-white font-mono">{publicProfile?.owner_wallet_trust || 90} / 100</span>
                        </div>
                      </div>

                      {/* Trust History Timeline */}
                      <div className="space-y-3.5 border-t border-[#A9A3B8]/10 pt-4">
                        <h5 className="text-[10px] font-mono text-white uppercase tracking-wider flex items-center gap-1.5 font-bold">
                          <Clock className="h-3.5 w-3.5 text-[#38F8B0]" /> Complete Trust History Timeline
                        </h5>

                        <div className="relative pl-4 border-l border-[#A9A3B8]/15 space-y-3 max-h-[180px] overflow-y-auto">
                          {!publicProfile?.timeline || publicProfile.timeline.length === 0 ? (
                            <div className="text-xs text-gray-500 italic py-4 font-mono">
                              No significant security mutations recorded in history ledger.
                            </div>
                          ) : (
                            publicProfile.timeline.map((event: any, idx: number) => (
                              <div key={event.id || idx} className="relative text-xs">
                                <span className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full ${
                                  event.event_type.includes('fail') || event.event_type.includes('banned') || event.event_type.includes('drop') || event.event_type.includes('suspended')
                                    ? 'bg-[#FF4D6D] shadow shadow-[#FF4D6D]/30'
                                    : 'bg-[#38F8B0] shadow shadow-[#38F8B0]/30'
                                }`}></span>
                                <div className="flex justify-between text-[9px] text-[#A9A3B8] font-mono">
                                  <span>{event.event_type.toUpperCase().replace(/_/g, ' ')}</span>
                                  <span>{new Date(event.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white text-[11px] leading-relaxed font-sans mt-0.5">
                                  {event.details}
                                </p>
                                <span className="text-[8px] text-gray-500 block font-mono">By Sentinel: {event.trigger_by}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. COMMUNITY REPORT RESOURCE SUB-TAB */}
              {activeDetailSection === 'report' && (
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="bg-[#FF4D6D]/5 border border-[#FF4D6D]/15 rounded-lg p-3.5 text-xs text-[#FF4D6D] space-y-1">
                    <span className="font-sans font-bold uppercase tracking-wider block">Community Safety Desk Guidelines</span>
                    <p className="text-gray-400 text-[11px] leading-relaxed font-sans">
                      Help $VIRAL remain the safest platform in Web3. Report links engaging in phishing, spyware, off-topic, or Sybil rewards abuse. AI evaluations determine validity instantly. False reports decrease your reputation.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[#A9A3B8] uppercase block">Report Category Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D6D]"
                    >
                      <option value="Phishing / Security Scam">Phishing Link / Wallet Drainer</option>
                      <option value="Impersonation">Impersonation / Clone project</option>
                      <option value="Inactive / Broken Link">Broken link / Dead TG asset</option>
                      <option value="Sybil Reward / Farming Abuse">Reward drain / Sybil system exploit</option>
                      <option value="Malware / Spyware">Spyware bot / Dangerous app</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[#A9A3B8] uppercase block">Detailed safety violation description</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Please elaborate precisely on the suspicious activities detected..."
                      rows={3}
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D6D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[#A9A3B8] uppercase block">Supplementary Evidence URL link (Optional)</label>
                    <input
                      type="text"
                      value={reportEvidence}
                      onChange={(e) => setReportEvidence(e.target.value)}
                      placeholder="Paste link to TX logs / screenshots / audit reports..."
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF4D6D]"
                    />
                  </div>

                  {reportError && (
                    <p className="text-xs font-mono text-[#FF4D6D] bg-[#FF4D6D]/5 border border-[#FF4D6D]/15 p-2 rounded">
                      {reportError}
                    </p>
                  )}

                  {reportSuccess && (
                    <p className="text-xs font-mono text-[#38F8B0] bg-[#38F8B0]/5 border border-[#38F8B0]/15 p-2 rounded">
                      Thank you! Your security claim has been submitted. The Sentinel Shield is performing a high-priority rescan.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isReporting}
                    className="w-full bg-[#FF4D6D]/10 hover:bg-[#FF4D6D]/20 border border-[#FF4D6D]/30 py-2.5 rounded-lg text-xs font-bold font-sans uppercase tracking-wider text-[#FF4D6D] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isReporting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Submit Report & Invoke AI Scan
                  </button>
                </form>
              )}

              {/* 4. ADVERTISER APPEAL SUB-TAB */}
              {activeDetailSection === 'appeal' && (
                <form onSubmit={handleSubmitAppeal} className="space-y-4">
                  <div className="bg-[#FFD36A]/5 border border-[#FFD36A]/15 rounded-lg p-3.5 text-xs text-[#FFD36A] space-y-1">
                    <span className="font-sans font-bold uppercase block">Safety Appeal Desk</span>
                    <p className="text-gray-400 text-[11px] leading-relaxed font-sans">
                      If you own this asset and believe the automated suspension or containment was a false positive, please submit your case below. The administration security desk will review your appeal history.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[#A9A3B8] uppercase block">Reason for appeal / Grounds of Defense</label>
                    <textarea
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Explain in details why your resource is safe and compliant..."
                      rows={4}
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FFD36A]"
                    />
                  </div>

                  {appealError && (
                    <p className="text-xs font-mono text-[#FF4D6D] bg-[#FF4D6D]/5 border border-[#FF4D6D]/15 p-2 rounded">
                      {appealError}
                    </p>
                  )}

                  {appealSuccess && (
                    <p className="text-xs font-mono text-[#38F8B0] bg-[#38F8B0]/5 border border-[#38F8B0]/15 p-2 rounded">
                      Appeal submitted successfully. Review pending at administrative safety desk.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isAppealing}
                    className="w-full bg-[#FFD36A]/10 hover:bg-[#FFD36A]/20 border border-[#FFD36A]/30 py-2.5 rounded-lg text-xs font-bold font-sans uppercase tracking-wider text-[#FFD36A] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isAppealing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Submit Appeal
                  </button>
                </form>
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
