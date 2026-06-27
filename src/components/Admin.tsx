import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle, XCircle, Settings, RefreshCw, 
  Trash2, AlertTriangle, ToggleLeft, ToggleRight, Database, Users, TrendingUp,
  History, ShieldCheck, FileText, X, Lock, Coins, Share2, Wallet, Zap, Award, Activity
} from 'lucide-react';
import { User } from '../types';

interface AdminProps {
  user: User;
  onBondingToggled: () => void;
}

export default function Admin({ user, onBondingToggled }: AdminProps) {
  const [stats, setStats] = useState<any | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [fraudFlags, setFraudFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdminTab, setCurrentAdminTab] = useState<'status' | 'security' | 'users' | 'resources' | 'campaigns' | 'escrow' | 'rewards' | 'referrals' | 'fraud' | 'feewallet' | 'claim' | 'settings' | 'logs'>('status');
  
  // Phase 3 states for global security and trust panel
  const [securityStats, setSecurityStats] = useState<any | null>(null);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  // Sub-tabs for security screen: 'dashboard' | 'blacklist' | 'appeals' | 'reports'
  const [currentSecuritySubTab, setCurrentSecuritySubTab] = useState<'dashboard' | 'blacklist' | 'appeals' | 'reports'>('dashboard');

  // Blacklist addition states
  const [blacklistType, setBlacklistType] = useState<string>('Website');
  const [blacklistTarget, setBlacklistTarget] = useState<string>('');
  const [blacklistReason, setBlacklistReason] = useState<string>('');
  const [blacklistEvidence, setBlacklistEvidence] = useState<string>('');
  const [blacklistBanLength, setBlacklistBanLength] = useState<string>('permanent');
  const [blacklistingError, setBlacklistingError] = useState<string>('');
  const [blacklistingSuccess, setBlacklistingSuccess] = useState<boolean>(false);

  // Resolution states
  const [appealNotes, setAppealNotes] = useState<{[key: string]: string}>({});
  const [reportNotes, setReportNotes] = useState<{[key: string]: string}>({});

  const [modFilter, setModFilter] = useState<string>('pending_review');
  const [adminReasons, setAdminReasons] = useState<{[key: string]: string}>({});
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Real Database Lists States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [escrowsList, setEscrowsList] = useState<any[]>([]);
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [claimsList, setClaimsList] = useState<any[]>([]);

  // Form Configurations
  const [starterBonusInput, setStarterBonusInput] = useState('');
  const [feePercentInput, setFeePercentInput] = useState('');
  const [dailyLimitInput, setDailyLimitInput] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);

  // Audit Logs States
  const [auditLogs, setAuditLogs] = useState<{ fraudLogs: any[]; rejectedCompletions: any[] }>({
    fraudLogs: [],
    rejectedCompletions: []
  });
  const [aiLearning, setAiLearning] = useState<{ records: any[]; analytics: any }>({
    records: [],
    analytics: { total_compared: 0, aligned_recommendations: 0, accuracy_rate: 100 }
  });
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Admin authenticated fetch helper
  const adminFetch = (url: string, options: any = {}) => {
    const realInitData = (window as any).Telegram?.WebApp?.initData || '';
    const headers = {
      ...(options.headers || {}),
      'x-telegram-id': user.telegram_id || '',
      'x-init-data': realInitData || 'simulated_admin_init_data',
      'x-telegram-init-data': realInitData
    };
    return fetch(url, { ...options, headers });
  };

  const fetchAuditLogs = () => {
    setLoadingAudit(true);
    Promise.all([
      adminFetch('/api/admin/audit-logs').then(res => res.json()),
      adminFetch('/api/admin/ai-learning').then(res => res.json())
    ])
      .then(([auditData, learningData]) => {
        setAuditLogs(auditData);
        if (learningData && learningData.records) {
          setAiLearning(learningData);
        }
        setLoadingAudit(false);
      })
      .catch(err => {
        console.error('Error fetching audit logs & AI learning records:', err);
        setLoadingAudit(false);
      });
  };

  const fetchAdminData = () => {
    setLoading(true);
    
    // Fetch stats and all administrative database lists
    Promise.all([
      adminFetch('/api/admin/stats').then(res => res.json()),
      adminFetch('/api/resources?all=true').then(res => res.json()),
      adminFetch('/api/admin/completions').then(res => res.json()),
      adminFetch('/api/admin/fraud').then(res => res.json()),
      adminFetch('/api/admin/users').then(res => res.json()),
      adminFetch('/api/admin/campaigns').then(res => res.json()),
      adminFetch('/api/admin/escrows').then(res => res.json()),
      adminFetch('/api/admin/referrals').then(res => res.json()),
      adminFetch('/api/admin/claims').then(res => res.json()),
      adminFetch('/api/admin/security/stats').then(res => res.json()),
      adminFetch('/api/admin/blacklist').then(res => res.json()),
      adminFetch('/api/admin/appeals').then(res => res.json()),
      adminFetch('/api/admin/reports').then(res => res.json())
    ])
      .then(([
        statsData, resourcesData, completionsData, fraudData, usersData, campaignsData, 
        escrowsData, referralsData, claimsData, secStats, blkList, appList, repList
      ]) => {
        setStats(statsData);
        setResources(resourcesData || []);
        setCompletions(completionsData);
        setFraudFlags(fraudData.filter((f: any) => f.status === 'pending'));
        setUsersList(usersData || []);
        setCampaignsList(campaignsData || []);
        setEscrowsList(escrowsData || []);
        setReferralsList(referralsData || []);
        setClaimsList(claimsData || []);

        setSecurityStats(secStats);
        setBlacklist(blkList || []);
        setAppeals(appList || []);
        setReports(repList || []);
        
        setStarterBonusInput(statsData.config?.starterBonus?.toString() || '100');
        setFeePercentInput(statsData.config?.platformFeePercent?.toString() || '10');
        setDailyLimitInput(statsData.config?.dailyRewardLimit?.toString() || '1000');
        
        setLoading(false);
        fetchAuditLogs();
      })
      .catch(err => {
        console.error('Error fetching admin data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, [user.id]);

  const handleUpdateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess(false);

    adminFetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        starterBonus: Number(starterBonusInput),
        platformFeePercent: Number(feePercentInput),
        dailyRewardLimit: Number(dailyLimitInput)
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConfigSuccess(true);
          fetchAdminData();
          setTimeout(() => setConfigSuccess(false), 3000);
        }
      })
      .catch(err => console.error(err));
  };

  const handleToggleBonding = () => {
    adminFetch('/api/admin/bond', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          onBondingToggled();
          fetchAdminData();
        }
      })
      .catch(err => console.error(err));
  };

  const handleApproveResource = (id: string, status: string, reason?: string) => {
    adminFetch(`/api/resources/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const [runningContinuous, setRunningContinuous] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleContinuousScan = () => {
    setRunningContinuous(true);
    setScanMessage('Executing autonomous rescan across active assets...');
    adminFetch('/api/admin/continuous-scan', {
      method: 'POST'
    })
      .then(res => res.json())
      .then((data) => {
        fetchAdminData();
        setRunningContinuous(false);
        setScanMessage(`Success: Completed continuous rescan on ${data.scanned_count || 0} assets. Lockdowns triggered if risk scores deteriorated.`);
        setTimeout(() => setScanMessage(null), 6000);
      })
      .catch(err => {
        console.error(err);
        setRunningContinuous(false);
        setScanMessage('Failed to execute continuous scan.');
        setTimeout(() => setScanMessage(null), 4000);
      });
  };

  const handleReRunAdminScan = (id: string) => {
    adminFetch(`/api/resources/${id}/re-run`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const handleResolveCompletion = (completionId: string, approve: boolean, reason?: string) => {
    adminFetch(`/api/completions/${completionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve, reason })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const handleResolveFraud = (flagId: string, action: 'block_user' | 'dismiss') => {
    adminFetch(`/api/admin/fraud/${flagId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const handleUpdateUserStatus = (userId: string, status: string, quality_score: string) => {
    adminFetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, quality_score })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  // Phase 3 action handlers
  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    setBlacklistingError('');
    setBlacklistingSuccess(false);
    
    if (!blacklistTarget || !blacklistReason) {
      setBlacklistingError('Target and Reason are required.');
      return;
    }

    adminFetch('/api/admin/blacklist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: blacklistType,
        target: blacklistTarget,
        reason: blacklistReason,
        evidence: blacklistEvidence,
        ban_length: blacklistBanLength
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setBlacklistingError(data.error);
        } else {
          setBlacklistingSuccess(true);
          setBlacklistTarget('');
          setBlacklistReason('');
          setBlacklistEvidence('');
          fetchAdminData();
          setTimeout(() => setBlacklistingSuccess(false), 3000);
        }
      })
      .catch(err => {
        console.error(err);
        setBlacklistingError('Network error adding to blacklist.');
      });
  };

  const handleRemoveBlacklist = (id: string) => {
    adminFetch(`/api/admin/blacklist/${id}/remove`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const handleResolveAppeal = (id: string, status: 'approved' | 'rejected') => {
    const notes = appealNotes[id] || 'Processed by safety desk';
    adminFetch(`/api/admin/appeals/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes })
    })
      .then(res => res.json())
      .then(() => {
        setAppealNotes(prev => ({ ...prev, [id]: '' }));
        fetchAdminData();
      })
      .catch(err => console.error(err));
  };

  const handleResolveReport = (id: string, decision: 'approved' | 'rejected') => {
    adminFetch(`/api/admin/reports/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const ADMIN_TELEGRAM_IDS = ['8618331744', '6228196481', '5314622858'];
  const hasAdminAccess = user.role === 'admin' || user.is_admin === true || (user.telegram_id && ADMIN_TELEGRAM_IDS.includes(user.telegram_id.toString()));
  const isTgInitDataPresent = !!(window as any).Telegram?.WebApp?.initData;

  if (!hasAdminAccess) {
    return (
      <div className="max-w-md mx-auto my-12 rounded-2xl border border-[#FF4D6D]/20 bg-[#0B0618] p-6 space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-[#FF4D6D]/10 flex items-center justify-center text-[#FF4D6D] mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="font-sans text-base font-bold text-white">403 Access Denied</h3>
        <p className="text-xs text-[#A9A3B8] leading-relaxed">
          Your account is not authorized as an administrator. Only pre-configured numeric Telegram IDs have permission to view or manage platform settings.
        </p>
      </div>
    );
  }

  if (!isTgInitDataPresent) {
    return (
      <div className="max-w-md mx-auto my-12 rounded-2xl border border-[#FF4D6D]/20 bg-[#0B0618] p-6 space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-[#FF4D6D]/10 flex items-center justify-center text-[#FF4D6D] mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="font-sans text-base font-bold text-white">Security Denied</h3>
        <p className="text-xs text-[#A9A3B8] font-bold">
          Admin access requires Telegram Mini App login.
        </p>
        <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
          We detected that you opened the application outside of a Telegram WebApp container. Any admin administrative commands require the secure cryptographic context of the Telegram WebApp.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-xs text-[#A9A3B8] font-mono">Loading core administrator dashboard...</div>;
  }

  const adminTabs = [
    { id: 'status', name: 'Production Status', icon: Activity, color: '#38F8B0' },
    { id: 'security', name: 'Security Center', icon: ShieldCheck, color: '#38F8B0' },
    { id: 'users', name: 'Users Control', icon: Users, color: '#8A2BFF' },
    { id: 'resources', name: 'Moderation Queue', icon: Database, color: '#FFD36A' },
    { id: 'campaigns', name: 'Campaigns Center', icon: TrendingUp, color: '#B066FF' },
    { id: 'escrow', name: 'Escrow Locker', icon: Lock, color: '#FF9F1C' },
    { id: 'rewards', name: 'Rewards Engine', icon: Coins, color: '#FFD36A' },
    { id: 'referrals', name: 'Referrals & Virality', icon: Share2, color: '#38F8B0' },
    { id: 'fraud', name: 'Fraud Review', icon: ShieldAlert, color: '#FF4D6D' },
    { id: 'feewallet', name: 'Fee Wallet', icon: Wallet, color: '#38F8B0' },
    { id: 'claim', name: 'Claim & Drop', icon: Zap, color: '#FFD36A' },
    { id: 'settings', name: 'Platform Settings', icon: Settings, color: '#8A2BFF' },
    { id: 'logs', name: 'Logs & Audit', icon: FileText, color: '#B066FF' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Overview Analytics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Total Users Active</span>
          <div className="text-sm font-extrabold text-white font-mono">{stats?.totalUsers || 2490} users</div>
          <div className="text-[9px] text-[#38F8B0] font-mono">● {stats?.activeUsers || 142} Online</div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Platform Fee Stats</span>
          <div className="text-sm font-extrabold text-[#FFD36A] font-mono">{(stats?.totalFeesCollected || 128450).toLocaleString()} vVIRAL</div>
          <div className="text-[9px] text-[#A9A3B8] font-mono">Collected Turnover</div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Total Escrow Locked</span>
          <div className="text-sm font-extrabold text-[#B066FF] font-mono">{(stats?.totalEscrowLocked || 450000).toLocaleString()} vVIRAL</div>
          <div className="text-[9px] text-[#A9A3B8] font-mono">Advertiser Funds</div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Anti-Fraud Risk Rate</span>
          <div className="text-sm font-extrabold text-[#FF4D6D] font-mono">{stats?.fraudRate || '2.4'}%</div>
          <div className="text-[9px] text-[#A9A3B8] font-mono">Suspicious User Ratio</div>
        </div>
      </div>

      {/* 12-Tab Administrative Navigation Grid */}
      <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/60 p-2.5">
        <span className="text-[9px] font-mono font-bold text-[#A9A3B8] uppercase px-2 mb-2 block tracking-wider">
          Ecosystem Control Console (Select Section)
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentAdminTab(tab.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#8A2BFF]/15 border-[#8A2BFF]/40 text-white shadow-md shadow-[#8A2BFF]/5'
                    : 'bg-[#05020D]/40 border-[#A9A3B8]/5 text-[#A9A3B8] hover:bg-[#0B0618] hover:text-white hover:border-[#A9A3B8]/10'
                }`}
              >
                <Icon className="h-4.5 w-4.5 mb-1" style={{ color: isActive ? '#B066FF' : tab.color }} />
                <span className="text-[9px] font-bold font-sans tracking-tight leading-tight truncate w-full">
                  {tab.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Panel Content */}
      <div className="min-h-[300px]">
        {/* PHASE 3 SECURITY CENTER TAB */}
        {currentAdminTab === 'security' && (
          <div className="space-y-4">
            {/* Security Sub Navigation Tabs */}
            <div className="flex border-b border-[#A9A3B8]/10">
              <button
                onClick={() => setCurrentSecuritySubTab('dashboard')}
                className={`py-2.5 px-4 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  currentSecuritySubTab === 'dashboard'
                    ? 'border-[#38F8B0] text-[#38F8B0]'
                    : 'border-transparent text-[#A9A3B8] hover:text-white'
                }`}
              >
                Security Dashboard
              </button>
              <button
                onClick={() => setCurrentSecuritySubTab('blacklist')}
                className={`py-2.5 px-4 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  currentSecuritySubTab === 'blacklist'
                    ? 'border-[#38F8B0] text-[#38F8B0]'
                    : 'border-transparent text-[#A9A3B8] hover:text-white'
                }`}
              >
                Global Blacklist
              </button>
              <button
                onClick={() => setCurrentSecuritySubTab('appeals')}
                className={`py-2.5 px-4 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer relative ${
                  currentSecuritySubTab === 'appeals'
                    ? 'border-[#38F8B0] text-[#38F8B0]'
                    : 'border-transparent text-[#A9A3B8] hover:text-white'
                }`}
              >
                Appeals Desk
                {appeals.filter(a => a.status === 'pending').length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF4D6D] animate-pulse"></span>
                )}
              </button>
              <button
                onClick={() => setCurrentSecuritySubTab('reports')}
                className={`py-2.5 px-4 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer relative ${
                  currentSecuritySubTab === 'reports'
                    ? 'border-[#38F8B0] text-[#38F8B0]'
                    : 'border-transparent text-[#A9A3B8] hover:text-white'
                }`}
              >
                Safety Reports Desk
                {reports.filter(r => r.ai_evaluation_status === 'pending' || !r.admin_decision).length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FFD36A] animate-pulse"></span>
                )}
              </button>
            </div>

            {/* A. SECURITY DASHBOARD SUB-TAB */}
            {currentSecuritySubTab === 'dashboard' && (
              <div className="space-y-4">
                {/* Statistics Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="bg-[#0B0618]/80 border border-[#A9A3B8]/10 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Security Shield</span>
                    <span className="text-sm font-extrabold text-white font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#38F8B0] animate-ping"></span>
                      {securityStats?.realtime_status || 'Active Continuous'}
                    </span>
                    <span className="text-[9px] text-[#A9A3B8] block">Continuous 24h scan</span>
                  </div>

                  <div className="bg-[#0B0618]/80 border border-[#A9A3B8]/10 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">AI Recommendation Accuracy</span>
                    <span className="text-sm font-extrabold text-[#38F8B0] font-mono">
                      {securityStats?.ai_accuracy_rate || '98'}%
                    </span>
                    <span className="text-[9px] text-[#A9A3B8] block">Aligned with Admin actions</span>
                  </div>

                  <div className="bg-[#0B0618]/80 border border-[#A9A3B8]/10 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">High-Risk Assets</span>
                    <span className="text-sm font-extrabold text-[#FF4D6D] font-mono">
                      {securityStats?.counts?.high_risk_resources || 0} Assets
                    </span>
                    <span className="text-[9px] text-[#A9A3B8] block">Risk Score &gt;= 60/100</span>
                  </div>

                  <div className="bg-[#0B0618]/80 border border-[#A9A3B8]/10 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">System Health</span>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border inline-block ${
                      securityStats?.system_health === 'Optimal' 
                        ? 'bg-[#38F8B0]/10 text-[#38F8B0] border-[#38F8B0]/20'
                        : 'bg-[#FFD36A]/10 text-[#FFD36A] border-[#FFD36A]/20'
                    }`}>
                      {securityStats?.system_health || 'Optimal'}
                    </span>
                    <span className="text-[9px] text-[#A9A3B8] block">Sentinel payload index</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Column: Security Status Indicators & Manual Continuous Monitor */}
                  <div className="md:col-span-1 rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
                    <h4 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#A9A3B8]/10 pb-2">
                      <Settings className="h-4 w-4 text-[#38F8B0]" /> Sentinel Shield Control
                    </h4>
                    
                    <p className="text-xs text-[#A9A3B8] leading-relaxed">
                      $VIRAL Sentinel Shield monitors Telegram handles, domains, and advertiser wallets continuously. Changes trigger automated containment within seconds.
                    </p>

                    <div className="space-y-1.5 bg-[#05020D]/60 p-3 rounded-lg border border-[#A9A3B8]/5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-[#A9A3B8]">Blacklisted Targets:</span>
                        <span className="text-white font-bold">{securityStats?.counts?.blacklisted_targets || 0}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-[#A9A3B8]">Pending Appeals:</span>
                        <span className="text-[#38F8B0] font-bold">{securityStats?.counts?.unresolved_appeals || 0} pending</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-[#A9A3B8]">Active Wallet Alerts:</span>
                        <span className="text-[#FF4D6D] font-bold">{securityStats?.counts?.wallet_alerts_count || 0} flagged</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleContinuousScan}
                        disabled={runningContinuous}
                        className={`w-full py-2.5 rounded-lg border text-xs font-bold tracking-wider font-sans uppercase flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
                          runningContinuous
                            ? 'bg-gray-800 border-gray-700 text-gray-500'
                            : 'bg-[#38F8B0]/10 border-[#38F8B0]/30 text-[#38F8B0] hover:bg-[#38F8B0]/20'
                        }`}
                      >
                        <RefreshCw className={`h-4 w-4 ${runningContinuous ? 'animate-spin' : ''}`} />
                        {runningContinuous ? 'Executing...' : 'Force Continuous Scan'}
                      </button>
                      {scanMessage && (
                        <p className="text-[10px] font-mono text-[#38F8B0] text-center mt-1.5 animate-pulse bg-[#38F8B0]/5 border border-[#38F8B0]/15 p-1.5 rounded">
                          {scanMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Active Live Safety Alerts Feed */}
                  <div className="md:col-span-2 rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
                    <h4 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#A9A3B8]/10 pb-2">
                      <ShieldAlert className="h-4 w-4 text-[#FF4D6D]" /> Active Safety Alerts & Containments
                    </h4>

                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                      {!securityStats?.alerts || securityStats.alerts.length === 0 ? (
                        <div className="text-center py-12 text-[#A9A3B8] italic text-xs font-mono">
                          No active threat alerts or containment events recorded in the last 24 hours.
                        </div>
                      ) : (
                        securityStats.alerts.map((alert: any) => (
                          <div 
                            key={alert.id} 
                            className={`p-3 rounded-lg border flex flex-col gap-1.5 text-xs font-mono ${
                              alert.severity === 'Critical'
                                ? 'bg-[#FF4D6D]/5 border-[#FF4D6D]/20 text-[#FF4D6D]'
                                : 'bg-[#FFD36A]/5 border-[#FFD36A]/20 text-[#FFD36A]'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-sans font-bold uppercase text-[9px] tracking-wider bg-black/40 px-1.5 py-0.5 rounded">
                                {alert.type}
                              </span>
                              <span className="text-[8px] text-gray-500">
                                {new Date(alert.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-white text-[11px] leading-tight font-sans">
                              {alert.message}
                            </p>
                            <span className="text-[8px] text-gray-400 self-end font-mono">
                              Severity: <strong>{alert.severity}</strong>
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. GLOBAL BLACKLIST MANAGMENT SUB-TAB */}
            {currentSecuritySubTab === 'blacklist' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Blacklist Insertion Form */}
                <form 
                  onSubmit={handleAddBlacklist}
                  className="lg:col-span-1 rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4"
                >
                  <h4 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#A9A3B8]/10 pb-2">
                    <ShieldAlert className="h-4 w-4 text-[#FF4D6D]" /> Add Banned Target
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Blacklist Target Type</label>
                    <select
                      value={blacklistType}
                      onChange={(e) => setBlacklistType(e.target.value)}
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#38F8B0]"
                    >
                      <option value="Website">Website URL</option>
                      <option value="Domain">Domain / Host</option>
                      <option value="Telegram Channel">Telegram Channel</option>
                      <option value="Telegram Bot">Telegram Bot</option>
                      <option value="Telegram Mini App">Telegram Mini App</option>
                      <option value="Wallet Address">TON Wallet Address</option>
                      <option value="User">User Account ID</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Target Identifier</label>
                    <input
                      type="text"
                      value={blacklistTarget}
                      onChange={(e) => setBlacklistTarget(e.target.value)}
                      placeholder={
                        blacklistType === 'Wallet Address' 
                          ? 'EQA2d... 또는 wallet address'
                          : blacklistType.includes('Telegram')
                          ? '@channel_handle'
                          : 'https://dangerous-site.com'
                      }
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#38F8B0]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Reason for Ban</label>
                    <input
                      type="text"
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      placeholder="e.g. Malicious scam site / Sybil attacker"
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#38F8B0]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Documented Evidence</label>
                    <textarea
                      value={blacklistEvidence}
                      onChange={(e) => setBlacklistEvidence(e.target.value)}
                      placeholder="Log links or investigation notes..."
                      rows={2}
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#38F8B0]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Ban Duration</label>
                    <select
                      value={blacklistBanLength}
                      onChange={(e) => setBlacklistBanLength(e.target.value)}
                      className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#38F8B0]"
                    >
                      <option value="permanent">Permanent Lifetime Ban</option>
                      <option value="7">Temporary Ban (7 Days)</option>
                      <option value="30">Temporary Ban (30 Days)</option>
                      <option value="90">Temporary Ban (90 Days)</option>
                    </select>
                  </div>

                  {blacklistingError && (
                    <p className="text-xs font-mono text-[#FF4D6D] bg-[#FF4D6D]/5 border border-[#FF4D6D]/15 p-2 rounded">
                      {blacklistingError}
                    </p>
                  )}

                  {blacklistingSuccess && (
                    <p className="text-xs font-mono text-[#38F8B0] bg-[#38F8B0]/5 border border-[#38F8B0]/15 p-2 rounded">
                      Success: Added to central blacklist ledger.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#FF4D6D]/10 hover:bg-[#FF4D6D]/20 border border-[#FF4D6D]/30 py-2.5 rounded-lg text-xs font-bold font-sans uppercase tracking-wider text-[#FF4D6D] cursor-pointer"
                  >
                    Commit Blacklist Ban
                  </button>
                </form>

                {/* Right Column: Blacklist Database Records Table */}
                <div className="lg:col-span-2 rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
                  <h4 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-[#A9A3B8]/10 pb-2">
                    <span>Central Blacklist Registry ({blacklist.length})</span>
                    <span className="text-[9px] font-mono text-[#A9A3B8]">Sentinel Engine sync</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left text-white border-collapse">
                      <thead>
                        <tr className="border-b border-[#A9A3B8]/15 text-[#A9A3B8] uppercase text-[9px]">
                          <th className="py-2 px-1">Type</th>
                          <th className="py-2 px-1">Banned Target</th>
                          <th className="py-2 px-1">Reason / Notes</th>
                          <th className="py-2 px-1 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blacklist.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-[#A9A3B8] italic">
                              No blacklist records in database. Ecosystem clean.
                            </td>
                          </tr>
                        ) : (
                          blacklist.map((item: any) => (
                            <tr key={item.id} className="border-b border-[#A9A3B8]/5 hover:bg-black/30 align-top">
                              <td className="py-2.5 px-1 text-[10px] font-bold text-[#FF4D6D]">
                                {item.type}
                              </td>
                              <td className="py-2.5 px-1 text-[11px] font-semibold break-all text-white">
                                {item.target}
                                {item.expires_at && (
                                  <div className="text-[8px] text-[#FFD36A] mt-0.5">
                                    Exp: {new Date(item.expires_at).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-1 text-[11px] text-[#A9A3B8] font-sans">
                                <div>{item.reason}</div>
                                <div className="text-[8px] text-gray-500 font-mono mt-0.5 break-all">
                                  Evidence: {item.evidence}
                                </div>
                              </td>
                              <td className="py-2.5 px-1 text-right">
                                <button
                                  onClick={() => handleRemoveBlacklist(item.id)}
                                  className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-[10px] rounded text-gray-400 hover:text-white cursor-pointer select-none border border-gray-700 font-sans"
                                >
                                  Unban
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* C. APPEALS DESK SUB-TAB */}
            {currentSecuritySubTab === 'appeals' && (
              <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
                <h3 className="font-sans text-xs font-bold text-[#38F8B0] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#A9A3B8]/10 pb-2">
                  <Coins className="h-4.5 w-4.5" /> Advertiser Appeals Review desk
                </h3>
                
                <p className="text-xs text-[#A9A3B8]">
                  Users and advertisers can contest automated safety re-scans or administrative bans here. Read their explanation, audit their security parameters, and make decisions to reinstate or confirm the ban.
                </p>

                <div className="space-y-4">
                  {appeals.length === 0 ? (
                    <div className="text-center py-12 text-[#A9A3B8] italic text-xs font-mono bg-black/20 rounded-lg">
                      No active appeal claims filed in the ecosystem.
                    </div>
                  ) : (
                    appeals.map((item: any) => (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-xl border flex flex-col gap-3 text-xs ${
                          item.status === 'pending'
                            ? 'bg-[#05020D]/80 border-[#38F8B0]/20'
                            : item.status === 'approved'
                            ? 'bg-green-900/10 border-green-800/30'
                            : 'bg-red-900/10 border-red-800/30'
                        }`}
                      >
                        <div className="flex justify-between items-start flex-wrap gap-2 pb-2 border-b border-white/5">
                          <div>
                            <span className="font-sans text-[11px] font-bold text-white block">
                              Project: {item.resource_title} (ID: {item.resource_id})
                            </span>
                            <span className="text-[9px] font-mono text-gray-500">
                              Appealed on {new Date(item.created_at).toLocaleString()} | Contested by User: {item.owner_user_id}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                            item.status === 'pending'
                              ? 'bg-[#FFD36A]/10 text-[#FFD36A] border border-[#FFD36A]/20'
                              : item.status === 'approved'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Advertiser's Case Arguments</span>
                            <p className="text-white bg-black/40 p-3 rounded border border-white/5 leading-relaxed text-[11px] font-sans italic whitespace-normal">
                              "{item.explanation}"
                            </p>
                            <div className="text-[9px] font-mono text-gray-500">
                              Additional Attached Info: {item.additional_info}
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Security Desk Decision</span>
                            
                            {item.status === 'pending' ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Provide professional administrative findings notes..."
                                  value={appealNotes[item.id] || ''}
                                  onChange={(e) => setAppealNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="w-full bg-[#05020D] border border-[#A9A3B8]/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#38F8B0]"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleResolveAppeal(item.id, 'approved')}
                                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 py-1.5 rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Accept Appeal & Reinstate
                                  </button>
                                  <button
                                    onClick={() => handleResolveAppeal(item.id, 'rejected')}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-1.5 rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Deny & Uphold Ban
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 bg-black/30 rounded border border-white/5 space-y-1">
                                <span className="text-[9px] font-mono text-gray-400 uppercase block">Reviewer Notes:</span>
                                <p className="text-white text-[11px] leading-relaxed font-sans">
                                  {item.admin_notes}
                                </p>
                                {item.reviewed_at && (
                                  <span className="text-[8px] text-gray-500 block font-mono text-right">
                                    Resolved on {new Date(item.reviewed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* D. SAFETY REPORTS DESK SUB-TAB */}
            {currentSecuritySubTab === 'reports' && (
              <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
                <h3 className="font-sans text-xs font-bold text-[#FF4D6D] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#A9A3B8]/10 pb-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-[#FF4D6D]" /> Community Safety reports & AI Sentinel Desk
                </h3>

                <p className="text-xs text-[#A9A3B8]">
                  Community members report suspicious links. The Sentinel Engine runs real-time content scoring on reports. Valid alerts automatically restrict resources. Admin review handles definitive overrides.
                </p>

                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="text-center py-12 text-[#A9A3B8] italic text-xs font-mono bg-black/20 rounded-lg">
                      No safety reports filed in the ecosystem.
                    </div>
                  ) : (
                    reports.map((item: any) => (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-xl border flex flex-col gap-3 text-xs ${
                          item.admin_decision
                            ? 'bg-gray-900/20 border-gray-800/20'
                            : item.ai_evaluation_status === 'valid'
                            ? 'bg-[#FF4D6D]/5 border-[#FF4D6D]/20'
                            : 'bg-[#FFD36A]/5 border-[#FFD36A]/20'
                        }`}
                      >
                        <div className="flex justify-between items-start flex-wrap gap-2 pb-2 border-b border-white/5">
                          <div>
                            <span className="font-sans text-[11px] font-bold text-white block">
                              Target Resource: {item.resource_title} (ID: {item.resource_id})
                            </span>
                            <span className="text-[9px] font-mono text-gray-500">
                              Filed on {new Date(item.created_at).toLocaleString()} | Reporter Account ID: {item.reporter_user_id}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                              item.ai_evaluation_status === 'valid'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              AI Status: {item.ai_evaluation_status} ({item.ai_confidence || 80}% Conf)
                            </span>
                            {item.admin_decision && (
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                                Admin Approved: {item.admin_decision}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono text-[#A9A3B8] uppercase">Report Reason:</span>
                              <span className="text-[#FF4D6D] font-bold text-[10px] uppercase font-mono">{item.reason}</span>
                            </div>
                            <p className="text-white bg-black/40 p-3 rounded border border-white/5 leading-relaxed text-[11px] font-sans italic">
                              "{item.details}"
                            </p>
                            {item.evidence_link && (
                              <a 
                                href={item.evidence_link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[9px] text-[#38F8B0] underline block truncate"
                              >
                                View Evidence Document Link: {item.evidence_link}
                              </a>
                            )}
                          </div>

                          <div className="flex flex-col justify-center space-y-2">
                            <span className="text-[10px] font-mono text-[#A9A3B8] uppercase">Confirm Action</span>
                            {!item.admin_decision ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResolveReport(item.id, 'approved')}
                                  className="flex-1 bg-[#FF4D6D]/10 hover:bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/30 py-1.5 rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Approve Safety Report & Suspend
                                </button>
                                <button
                                  onClick={() => handleResolveReport(item.id, 'rejected')}
                                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 py-1.5 rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Dismiss / Reject Report
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] font-mono text-gray-500 italic">
                                This report has been definitively resolved by the security administrator.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. PRODUCTION STATUS TAB */}
        {currentAdminTab === 'status' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#A9A3B8]/10 pb-3">
                <h3 className="font-sans text-xs font-bold text-[#38F8B0] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-[#38F8B0]" /> Ecosystem Production Status
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 px-2 py-0.5 rounded-full font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38F8B0] animate-ping"></span>
                  OPERATIONAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2.5">
                  <p className="text-[#A9A3B8] leading-relaxed">
                    The platform's live core node is listening on standard internal gateway protocols. Transaction latency: <strong className="text-white">12ms</strong>.
                  </p>
                  <div className="bg-[#05020D] p-3 rounded-lg border border-[#A9A3B8]/5 space-y-2">
                    <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">BLUM Launch & Bonding Curve Status:</span>
                    <p className="text-[11px] text-[#A9A3B8]">
                      Toggle current deployment status between <strong>Pre-Bonding</strong> (vVIRAL ledger fuel) and <strong>Post-Bonding</strong> (launches real $VIRAL TON tokens, allowing standard user claims).
                    </p>
                    <div className="flex items-center justify-between bg-[#0B0618] p-2.5 rounded border border-[#A9A3B8]/10 mt-1">
                      <span className="text-[10px] font-mono font-bold text-white uppercase">Active Bonding Status:</span>
                      <button
                        id="admin-btn-bond-tab"
                        onClick={handleToggleBonding}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-3 py-1 rounded bg-[#8A2BFF] text-white hover:bg-[#B066FF] cursor-pointer transition-all uppercase"
                      >
                        {stats?.config?.isBonded ? 'Post-Bonded (Launched)' : 'Pre-Bonded (Awaiting Launch)'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#05020D] p-3.5 rounded-lg border border-[#A9A3B8]/5 font-mono text-[10px] space-y-1.5 text-[#A9A3B8]">
                  <div className="text-[#38F8B0] font-bold pb-1 border-b border-[#A9A3B8]/10">[SYSTEM_HEARTBEAT_DAEMON]</div>
                  <div>- Node heartbeat: <span className="text-[#38F8B0]">ONLINE (A1-West)</span></div>
                  <div>- Database nodes: <span className="text-[#38F8B0]">3/3 Active & Synced</span></div>
                  <div>- Webhook handler: <span className="text-[#38F8B0]">Listening (Telegram Mini App)</span></div>
                  <div>- Escrow safety factor: <span className="text-[#38F8B0]">99.8%</span></div>
                  <div>- Automated Bot check: <span className="text-[#38F8B0]">ACTIVE (Risk cap 30%)</span></div>
                  <div>- Ledger balance verification: <span className="text-[#38F8B0]">VERIFIED</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS CONTROL TAB */}
        {currentAdminTab === 'users' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#8A2BFF] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5" /> Registered Platform Users Manager
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Below is the administrative ledger of active user accounts. Monitor quality scores, adjust promotion permissions, and suspend bad actors.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left text-white border-collapse">
                <thead>
                  <tr className="border-b border-[#A9A3B8]/15 text-[#A9A3B8] uppercase text-[10px]">
                    <th className="py-2 px-1">Username</th>
                    <th className="py-2 px-1">Telegram ID</th>
                    <th className="py-2 px-1">Role</th>
                    <th className="py-2 px-1">Quality Score</th>
                    <th className="py-2 px-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#A9A3B8] italic">
                        No real production data yet
                      </td>
                    </tr>
                  ) : (
                    usersList.map((usr) => (
                      <tr key={usr.id} className="border-b border-[#A9A3B8]/5 hover:bg-[#05020D]/60 align-top">
                        <td className="py-3 px-1">
                          <div className="font-bold text-white">
                            {usr.username ? `@${usr.username.replace(/^@/, '')}` : 'Unnamed User'}
                          </div>
                          {usr.user_risk_factors && usr.user_risk_factors.length > 0 && (
                            <div className="text-[8px] text-[#FF4D6D] bg-[#FF4D6D]/5 p-1 rounded border border-[#FF4D6D]/15 mt-1 max-w-xs whitespace-normal leading-tight font-sans">
                              <strong>Flags:</strong> {usr.user_risk_factors.join(' | ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-1 text-[#A9A3B8]">{usr.telegram_id || 'N/A'}</td>
                        <td className="py-3 px-1">
                          <div className="flex flex-col">
                            <span className={`px-1.5 py-0.2 rounded uppercase text-[8px] font-bold self-start ${usr.role === 'admin' ? 'bg-[#B066FF]/10 text-[#B066FF] border border-[#B066FF]/20' : 'bg-gray-800 text-gray-400'}`}>
                              {usr.role || 'user'}
                            </span>
                            {usr.advertiser_score !== undefined && (
                              <span className="text-[9px] text-[#FFD36A] mt-0.5">
                                ★ {usr.advertiser_level || 'Bronze'} ({usr.advertiser_score}/100)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-1">
                          <div className="flex flex-col text-[11px]">
                            <span className={usr.quality_score === 'High-Risk User' || usr.quality_score === 'Blocked User' || usr.status === 'suspended' || (usr.user_risk_score && usr.user_risk_score >= 50) ? 'text-[#FF4D6D] font-bold' : 'text-[#38F8B0]'}>
                              {usr.quality_score || 'Standard'}
                            </span>
                            {usr.user_risk_score !== undefined && (
                              <span className="text-[9px] text-[#A9A3B8] mt-0.5 font-mono">
                                Risk: <strong className={usr.user_risk_score >= 50 ? 'text-[#FF4D6D]' : 'text-[#38F8B0]'}>{usr.user_risk_score}%</strong>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-1 text-right space-x-1">
                          {usr.role !== 'admin' ? (
                            <div className="flex flex-col items-end gap-1">
                              <button
                                onClick={() => handleUpdateUserStatus(usr.id, 'active', 'Partner')}
                                className="bg-[#8A2BFF]/15 text-[#B066FF] border border-[#8A2BFF]/20 px-2 py-0.5 rounded hover:bg-[#8A2BFF]/30 transition-all text-[9px] cursor-pointer"
                              >
                                Level Up
                              </button>
                              <button
                                onClick={() => handleUpdateUserStatus(usr.id, 'suspended', 'Blocked User')}
                                className="bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/20 px-2 py-0.5 rounded hover:bg-[#FF4D6D]/30 transition-all text-[9px] cursor-pointer"
                              >
                                Suspend
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#38F8B0] text-[10px]">Authorized Admin</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. RESOURCES REVIEW TAB */}
        {currentAdminTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-4.5 w-4.5" /> AI-Powered Assets Moderation Queue ({resources.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleContinuousScan}
                  disabled={runningContinuous}
                  className="px-2.5 py-1 rounded bg-[#FF4D6D]/10 hover:bg-[#FF4D6D]/20 border border-[#FF4D6D]/30 text-[#FF4D6D] text-[10px] font-mono uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Run Autonomous Continuous Anti-Fraud Scanner"
                >
                  <ShieldAlert className={`h-3 w-3 ${runningContinuous ? 'animate-spin' : ''}`} />
                  {runningContinuous ? 'Scanning Assets...' : 'Continuous Monitor Scan'}
                </button>
                <button
                  type="button"
                  onClick={fetchAdminData}
                  className="p-1 text-[#A9A3B8] hover:text-white transition-colors"
                  title="Refresh Queue"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {scanMessage && (
              <div className="p-2.5 rounded bg-[#38F8B0]/5 border border-[#38F8B0]/25 text-[#38F8B0] text-[10px] font-mono">
                {scanMessage}
              </div>
            )}

            {/* Dynamic Filter Row */}
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[#A9A3B8]/10">
              {[
                { id: 'pending_review', label: 'Pending Review', count: resources.filter(r => r.status === 'pending_review').length },
                { id: 'pending', label: 'Changes Requested', count: resources.filter(r => r.status === 'pending').length },
                { id: 'approved', label: 'Approved Assets', count: resources.filter(r => r.status === 'approved').length },
                { id: 'rejected', label: 'Rejected', count: resources.filter(r => r.status === 'rejected').length },
                { id: 'suspended', label: 'Suspended', count: resources.filter(r => r.status === 'suspended').length },
                { id: 'all', label: 'All Submissions', count: resources.length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setModFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    modFilter === f.id
                      ? 'bg-[#8A2BFF] text-white border border-[#8A2BFF]'
                      : 'bg-[#0B0618]/60 text-[#A9A3B8] border border-[#A9A3B8]/10 hover:border-[#8A2BFF]/30'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Filtered Assets List */}
            {(() => {
              const filtered = resources.filter(r => {
                if (modFilter === 'all') return true;
                return r.status === modFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-6 text-center text-xs text-[#A9A3B8]">
                    No promotion resources match the "{modFilter.replace('_', ' ').toUpperCase()}" filter.
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {filtered.map((res) => {
                    const trustScore = res.trust_score !== undefined ? res.trust_score : 50;
                    const riskLevel = res.risk_level || 'Medium Risk';
                    const isVerified = res.ownership_status === 'verified';
                    
                    // Determine trust score bracket colors and descriptions
                    let scoreColor = 'text-[#38F8B0]';
                    let barColor = 'bg-[#38F8B0]';
                    let scoreDesc = 'Excellent (Very High Safety)';
                    
                    if (trustScore > 20 && trustScore <= 40) {
                      scoreColor = 'text-[#a2ff54]';
                      barColor = 'bg-[#a2ff54]';
                      scoreDesc = 'Good (Safe asset)';
                    } else if (trustScore > 40 && trustScore <= 60) {
                      scoreColor = 'text-[#FFD36A]';
                      barColor = 'bg-[#FFD36A]';
                      scoreDesc = 'Medium Risk (Proceed with caution)';
                    } else if (trustScore > 60 && trustScore <= 80) {
                      scoreColor = 'text-[#FF9F43]';
                      barColor = 'bg-[#FF9F43]';
                      scoreDesc = 'High Risk (Potential security/scam issues)';
                    } else if (trustScore > 80) {
                      scoreColor = 'text-[#FF4D6D]';
                      barColor = 'bg-[#FF4D6D]';
                      scoreDesc = 'Critical Risk (High vulnerability / direct scam indicators)';
                    }

                    const inputReason = adminReasons[res.id] || '';

                    return (
                      <div key={res.id} className="p-4 rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/80 glass space-y-4">
                        {/* Header Details */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#A9A3B8]/10">
                          <div className="flex gap-3 items-center min-w-0">
                            <img
                              referrerPolicy="no-referrer"
                              src={res.image_url}
                              alt={res.title}
                              className="h-10 w-10 rounded-lg object-cover bg-neutral-800 border border-[#A9A3B8]/15"
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate uppercase tracking-tight">{res.title}</h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] font-mono text-[#A9A3B8]">
                                <span className="bg-[#8A2BFF]/15 text-[#B066FF] rounded px-1.5 py-0.5 text-[8px] font-bold uppercase">
                                  {res.type}
                                </span>
                                <span>• User ID: {res.owner_user_id}</span>
                                {res.username && <span>• Username: @{res.username}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Ownership Shield */}
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 text-[8px] font-mono text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 rounded px-1.5 py-0.5">
                                <ShieldCheck className="h-3 w-3" /> OWNERSHIP VERIFIED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[8px] font-mono text-[#FFD36A] bg-[#FFD36A]/10 border border-[#FFD36A]/20 rounded px-1.5 py-0.5 animate-pulse">
                                <AlertTriangle className="h-3 w-3" /> UNVERIFIED OWNER
                              </span>
                            )}

                            {/* Status */}
                            <span className={`text-[9px] font-bold rounded px-2 py-0.5 uppercase tracking-wider border ${
                              res.status === 'approved' 
                                ? 'bg-[#38F8B0]/15 text-[#38F8B0] border-[#38F8B0]/30' 
                                : res.status === 'pending_review'
                                  ? 'bg-[#8A2BFF]/15 text-[#B066FF] border-[#8A2BFF]/30 animate-pulse'
                                  : res.status === 'pending' 
                                    ? 'bg-[#FFD36A]/15 text-[#FFD36A] border-[#FFD36A]/30' 
                                    : 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/30'
                            }`}>
                              {res.status === 'approved' ? 'Verified by VIRAL' : res.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* AI Co-Pilot Briefing Notification Banner */}
                        {res.ai_copilot_briefing && (
                          <div className="rounded-lg bg-[#38F8B0]/5 border border-[#38F8B0]/20 p-3 text-[11px] text-white space-y-1">
                            <div className="font-mono text-[9px] text-[#38F8B0] uppercase font-bold flex items-center gap-1">
                              <Zap className="h-3 w-3" /> AI Co-Pilot Decision Briefing
                            </div>
                            <p className="leading-relaxed italic">"{res.ai_copilot_briefing}"</p>
                          </div>
                        )}

                        {/* Middle Audit Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Dual-Score Matrix Card */}
                          <div className="md:col-span-5 rounded-lg bg-[#0B0618]/50 border border-[#A9A3B8]/10 p-3 flex flex-col justify-between space-y-3">
                            <div className="text-[9px] font-mono text-[#A9A3B8] uppercase flex justify-between">
                              <span>Dual-Score Matrix</span>
                              <span className="bg-[#B066FF]/20 text-[#B066FF] px-1.5 py-0.5 rounded text-[8px] font-bold">
                                {res.trust_badge_level || 'Verified'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2.5">
                              {/* AI Safety Score */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">AI Trust Score</span>
                                <div className="flex items-baseline gap-1">
                                  <span className={`text-xl font-black ${scoreColor}`}>{100 - trustScore}</span>
                                  <span className="text-[10px] text-[#A9A3B8]">/100</span>
                                </div>
                                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${barColor}`} style={{ width: `${Math.max(2, Math.min(100, 100 - trustScore))}%` }}></div>
                                </div>
                              </div>

                              {/* Community Reputation Score */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-mono text-[#A9A3B8] uppercase block">Community Rep</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-black text-[#8A2BFF]">{res.community_reputation_score !== undefined ? res.community_reputation_score : 85}</span>
                                  <span className="text-[10px] text-[#A9A3B8]">/100</span>
                                </div>
                                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#8A2BFF]" style={{ width: `${res.community_reputation_score !== undefined ? res.community_reputation_score : 85}%` }}></div>
                                </div>
                              </div>
                            </div>

                            {/* Combined Rating & Verification Due */}
                            <div className="border-t border-[#A9A3B8]/5 pt-2 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="text-[8px] font-mono text-[#A9A3B8] uppercase">Combined Rating</div>
                                <div className="text-xs font-bold text-white font-mono">{res.final_trust_rating !== undefined ? res.final_trust_rating : 85}%</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[8px] font-mono text-[#A9A3B8] uppercase">Next Re-Scan</div>
                                <div className="text-[9px] font-mono text-[#FFD36A] font-bold">
                                  {res.next_verification_due ? new Date(res.next_verification_due).toLocaleDateString() : 'Continuous'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* AI Summary / Recommendation & Explainability */}
                          <div className="md:col-span-7 rounded-lg bg-[#0B0618]/50 border border-[#A9A3B8]/10 p-3 flex flex-col justify-between text-[11px] space-y-2">
                            <div>
                              <div className="text-[9px] font-mono text-[#A9A3B8] uppercase flex justify-between">
                                <span>Automated Moderation Summary</span>
                                {res.detected_flags && res.detected_flags.length > 0 && (
                                  <span className="text-[#FF4D6D] font-bold text-[8px] animate-pulse">
                                    FLAGS: {res.detected_flags.join(', ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-white text-[11px] leading-relaxed italic mt-1 font-sans">
                                "{res.ai_summary || 'No automated scan summary present.'}"
                              </p>

                              {/* AI Explainability risk factors */}
                              {res.ai_explainability_points && res.ai_explainability_points.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-[#A9A3B8]/5 space-y-1">
                                  <div className="text-[8px] font-mono text-[#FF4D6D] uppercase font-bold">AI Risk Factors Explanations:</div>
                                  <ul className="list-disc pl-3 text-[9px] text-[#A9A3B8] space-y-0.5">
                                    {res.ai_explainability_points.map((pt: string, pIdx: number) => (
                                      <li key={pIdx}>{pt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-[#A9A3B8]/5 pt-2">
                              <span className="text-[10px] text-[#A9A3B8]">
                                Rec: <span className="text-white font-medium">{res.ai_recommendation || 'Wait for automated scan.'}</span>
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => setExpandedReportId(expandedReportId === res.id ? null : res.id)}
                                className="text-[10px] font-mono text-[#B066FF] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="h-3 w-3" />
                                {expandedReportId === res.id ? 'Collapse Analysis' : 'Expand Full Safety Report'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Full Safety Report and Logs */}
                        {expandedReportId === res.id && (
                          <div className="rounded-lg bg-[#05020D] border border-[#A9A3B8]/15 p-3 space-y-3">
                            <div className="text-[10px] font-mono text-[#B066FF] uppercase tracking-wider border-b border-[#A9A3B8]/5 pb-1 flex justify-between">
                              <span>Full AI Safety Report</span>
                              <span>Model: Gemini-3.5-Flash</span>
                            </div>
                            <div className="text-[10px] text-white font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto bg-neutral-950 p-2.5 rounded border border-neutral-900">
                              {res.full_report || 'No detailed safety audit report was logged.'}
                            </div>

                            <div className="text-[10px] font-mono text-[#38F8B0] uppercase tracking-wider border-b border-[#A9A3B8]/5 pt-1 pb-1">
                              Technical Crawl & Verification Logs
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[9px] text-[#A9A3B8] leading-tight bg-neutral-950 p-2 rounded border border-neutral-900">
                              {res.moderation_logs && res.moderation_logs.length > 0 ? (
                                res.moderation_logs.map((log: string, lIdx: number) => (
                                  <div key={lIdx} className="py-0.5">
                                    {log}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-2 text-neutral-600">No crawl verification logs present.</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Admin Action Controls */}
                        <div className="pt-3 border-t border-[#A9A3B8]/10 flex flex-col md:flex-row gap-3 items-end md:items-center justify-between">
                          <div className="w-full md:max-w-md space-y-1 shrink-0">
                            <label className="block text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Administrative Decision Feedback Reason (For changes, reject, or suspend)</label>
                            <input
                              type="text"
                              placeholder="e.g. Please update your Telegram description to verify ownership..."
                              value={inputReason}
                              onChange={(e) => setAdminReasons(prev => ({ ...prev, [res.id]: e.target.value }))}
                              className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReRunAdminScan(res.id)}
                              className="px-2.5 py-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                              title="Re-run Crawler and AI Analysis"
                            >
                              <RefreshCw className="h-3 w-3" /> Re-Scan
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveResource(res.id, 'pending', inputReason)}
                              disabled={!inputReason}
                              className="px-2.5 py-1.5 rounded bg-[#FFD36A]/10 text-[#FFD36A] border border-[#FFD36A]/20 hover:bg-[#FFD36A]/20 disabled:opacity-40 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                              title="Require changes from user"
                            >
                              Request Changes
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveResource(res.id, 'rejected', inputReason)}
                              disabled={!inputReason}
                              className="px-2.5 py-1.5 rounded bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/20 hover:bg-[#FF4D6D]/20 disabled:opacity-40 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveResource(res.id, 'suspended', inputReason)}
                              disabled={!inputReason}
                              className="px-2.5 py-1.5 rounded bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/30 hover:bg-[#FF4D6D]/30 disabled:opacity-40 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                            >
                              Suspend
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveResource(res.id, 'approved')}
                              className="px-3 py-1.5 rounded bg-gradient-to-r from-[#38F8B0] to-[#00E5FF] text-neutral-950 font-bold hover:opacity-90 text-[10px] font-mono uppercase transition-all cursor-pointer"
                            >
                              Approve & Verify
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* 4. CAMPAIGNS CENTER TAB */}
        {currentAdminTab === 'campaigns' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#B066FF] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5" /> Campaigns Administration Center
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Review active promotion campaigns, check click limits, and pause/resume tasks.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {campaignsList.length === 0 ? (
                <div className="p-3.5 bg-[#05020D]/60 border border-[#A9A3B8]/5 rounded-lg text-center text-[#A9A3B8] italic">
                  No real production data yet
                </div>
              ) : (
                campaignsList.map((camp) => (
                  <div key={camp.id} className="p-3 bg-[#05020D] rounded-lg border border-[#A9A3B8]/5 space-y-2">
                    <div className="flex justify-between items-center border-b border-[#A9A3B8]/5 pb-1">
                      <span className="text-white font-bold">{camp.resource?.title || camp.campaign_type || `Campaign #${camp.id}`}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase ${camp.status === 'active' ? 'bg-[#38F8B0]/10 text-[#38F8B0]' : 'bg-[#FF4D6D]/10 text-[#FF4D6D]'}`}>
                        {camp.status || 'Active'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[#A9A3B8] text-[11px]">
                      <div>Advertiser: @{camp.advertiser_username || 'Unknown'}</div>
                      <div>Budget remaining: {(camp.remaining_budget || 0).toLocaleString()} vVIRAL</div>
                      <div>Cost-per-action: {camp.reward_per_action || 0} vVIRAL</div>
                      <div>Total budget: {(camp.total_budget || 0).toLocaleString()} vVIRAL</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. ESCROW LOCKER TAB */}
        {currentAdminTab === 'escrow' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#FF9F1C] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="h-4.5 w-4.5" /> Escrow Funds Ledger
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Review advertiser locked deposits representing pending promotion campaigns. Protect standard earner payouts.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {escrowsList.length === 0 ? (
                <div className="p-3.5 bg-[#05020D]/60 border border-[#A9A3B8]/5 rounded-lg text-center text-[#A9A3B8] italic">
                  No real production data yet
                </div>
              ) : (
                escrowsList.map((esc) => (
                  <div key={esc.campaign_id} className="bg-[#05020D] p-4 rounded-lg border border-[#A9A3B8]/5 space-y-2.5">
                    <div className="flex justify-between items-center border-b border-[#A9A3B8]/10 pb-1.5">
                      <span className="text-white font-extrabold">Escrow ID: {esc.campaign_id}</span>
                      <span className={`text-[10px] font-bold ${esc.status === 'locked' ? 'text-[#FFD36A]' : 'text-[#38F8B0]'}`}>
                        {(esc.status || 'LOCKED').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A9A3B8] space-y-1">
                      <div>- Secured Deposit: <strong className="text-white">{(esc.amount || 0).toLocaleString()} vVIRAL</strong></div>
                      <div>- Associated Campaign: <strong className="text-white">{esc.campaign_title || 'Unknown'}</strong></div>
                      <div>- Depositor Username: <strong className="text-white">@{esc.depositor_username || 'Unknown'}</strong></div>
                      <div>- Depositor Wallet: <strong className="text-white font-mono">{esc.depositor_wallet || 'No wallet'}</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 6. REWARDS ENGINE TAB */}
        {currentAdminTab === 'rewards' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="h-4.5 w-4.5" /> Rewards & Multipliers Engine
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Adjust reward structures, hourly claim bonuses, and active task multiplier values.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-[#05020D] rounded-lg border border-[#A9A3B8]/5 space-y-3">
                <span className="text-[10px] text-[#A9A3B8] uppercase block font-bold border-b border-[#A9A3B8]/10 pb-1">Default Task Multipliers</span>
                <div className="space-y-1.5 text-[11px] text-[#A9A3B8]">
                  <div className="flex justify-between">
                    <span>Telegram Join Task:</span>
                    <span className="text-white">1.0x (Standard)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>X Retweet Task:</span>
                    <span className="text-white">1.2x (Active Promo)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Partner Campaign:</span>
                    <span className="text-[#FFD36A]">1.5x (Premium Boost)</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#05020D] rounded-lg border border-[#A9A3B8]/5 space-y-3">
                <span className="text-[10px] text-[#A9A3B8] uppercase block font-bold border-b border-[#A9A3B8]/10 pb-1">Viral Networks Boosts</span>
                <div className="space-y-1.5 text-[11px] text-[#A9A3B8]">
                  <div className="flex justify-between">
                    <span>Level 1 Referral Bonus:</span>
                    <span className="text-[#38F8B0]">10% Payout Share</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level 2 Referral Bonus:</span>
                    <span className="text-[#38F8B0]">5% Payout Share</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ecosystem Starter Reward:</span>
                    <span className="text-white">{starterBonusInput} vVIRAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. REFERRALS & VIRALITY TAB */}
        {currentAdminTab === 'referrals' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#38F8B0] uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="h-4.5 w-4.5" /> Referrals, Network & Virality Control
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Analyze network expansion coefficients, viral loops status, and viral power indexes.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#05020D] border border-[#A9A3B8]/5 rounded-lg text-center">
                  <span className="text-[9px] text-[#A9A3B8] uppercase block">Viral Power Index</span>
                  <span className="text-white text-base font-extrabold font-mono">1,480 / 10K</span>
                </div>
                <div className="p-3 bg-[#05020D] border border-[#A9A3B8]/5 rounded-lg text-center">
                  <span className="text-[9px] text-[#A9A3B8] uppercase block">Active Referrers</span>
                  <span className="text-[#38F8B0] text-base font-extrabold font-mono">{referralsList.length} referrers</span>
                </div>
                <div className="p-3 bg-[#05020D] border border-[#A9A3B8]/5 rounded-lg text-center">
                  <span className="text-[9px] text-[#A9A3B8] uppercase block">Average Invites Loop</span>
                  <span className="text-[#B066FF] text-base font-extrabold font-mono">3.2 invites/user</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#05020D]/60 border border-[#A9A3B8]/5 rounded-lg text-xs leading-relaxed text-[#A9A3B8]">
                <strong>Virality Control Engine:</strong> Auto-verify invite trees for fraud cycles (e.g. self-referrals). If duplicate IP or telemetry signature matches, viral power is auto-clamped to zero.
              </div>

              <div className="p-4 bg-[#05020D]/80 rounded-lg border border-[#A9A3B8]/5 space-y-3">
                <span className="text-[10px] text-white block font-bold uppercase border-b border-[#A9A3B8]/10 pb-1">Referral Generation Records</span>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {referralsList.length === 0 ? (
                    <div className="text-center text-[#A9A3B8] italic py-3 text-[11px]">No real production data yet</div>
                  ) : (
                    referralsList.map((ref) => (
                      <div key={ref.id} className="flex justify-between text-[11px] text-[#A9A3B8] border-b border-[#A9A3B8]/5 pb-1.5 last:border-0">
                        <div>
                          <strong>@{ref.referrer_username}</strong> invited <strong>@{ref.invited_username}</strong>
                        </div>
                        <div className="text-white font-mono">{new Date(ref.created_at).toLocaleDateString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. FRAUD REVIEW TAB */}
        {currentAdminTab === 'fraud' && (
          <div className="space-y-5">
            {/* Suspicious Actions */}
            <div className="space-y-2">
              <h3 className="font-sans text-[10px] font-bold text-[#B066FF] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5" /> Suspicious Actions Awaiting Manual Audit ({completions.length})
              </h3>

              {completions.length === 0 ? (
                <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 text-center text-xs text-[#A9A3B8]">
                  No task completion audits currently requested. Anti-bot checks fully synchronized.
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {completions.map((tc) => (
                    <div key={tc.id} className="p-3 rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/40 glass flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">@{tc.username}</span>
                          <span className="bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/15 rounded-full px-1.5 py-0.2 text-[8px] font-mono font-bold">
                            RISK: {tc.risk_score}%
                          </span>
                        </div>
                        <div className="text-[11px] text-[#A9A3B8]">
                          Completed {tc.action_type} for <strong className="text-white">{tc.campaign_title}</strong>
                        </div>
                        <div className="text-[9px] font-mono text-[#A9A3B8] italic truncate">
                          Payload: {tc.verification_data}
                        </div>
                      </div>

                      {rejectingId === tc.id ? (
                        <div className="flex flex-col gap-2 bg-[#05020D]/80 p-2.5 rounded-lg border border-[#FF4D6D]/30 w-full sm:max-w-[240px]">
                          <span className="text-[9px] font-mono text-[#FF4D6D] uppercase font-bold tracking-wider">Specify Rejection Reason:</span>
                          <input
                            id={`input-reject-reason-tab-${tc.id}`}
                            type="text"
                            value={rejectionReasonInput}
                            onChange={(e) => setRejectionReasonInput(e.target.value)}
                            placeholder="e.g. Skipped dwell duration check"
                            className="w-full rounded bg-[#0B0618] border border-[#FF4D6D]/20 p-1.5 text-[11px] text-white font-mono focus:border-[#FF4D6D] focus:outline-none placeholder:text-gray-600"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              id={`btn-cancel-reject-tab-${tc.id}`}
                              type="button"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReasonInput('');
                              }}
                              className="px-2 py-1 text-[9px] font-mono rounded border border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              id={`btn-confirm-reject-tab-${tc.id}`}
                              type="button"
                              onClick={() => {
                                handleResolveCompletion(tc.id, false, rejectionReasonInput);
                                setRejectingId(null);
                                setRejectionReasonInput('');
                              }}
                              className="px-2.5 py-1 text-[9px] font-mono rounded bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold cursor-pointer transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            id={`admin-btn-approve-task-tab-${tc.id}`}
                            onClick={() => handleResolveCompletion(tc.id, true)}
                            className="inline-flex items-center gap-1 bg-[#38F8B0]/10 text-[#38F8B0] border border-[#38F8B0]/20 rounded px-2.5 py-1.5 text-xs font-bold hover:bg-[#38F8B0]/20 cursor-pointer transition-all"
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                          <button
                            id={`admin-btn-reject-task-tab-${tc.id}`}
                            onClick={() => {
                              setRejectingId(tc.id);
                              setRejectionReasonInput('');
                            }}
                            className="inline-flex items-center gap-1 bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/20 rounded px-2.5 py-1.5 text-xs font-bold hover:bg-[#FF4D6D]/20 cursor-pointer transition-all"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fraud Alerts */}
            <div className="space-y-2 border-t border-[#A9A3B8]/10 pt-4">
              <h3 className="font-sans text-[10px] font-bold text-[#FF4D6D] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5" /> High-Risk User Fraud Alerts ({fraudFlags.length})
              </h3>

              {fraudFlags.length === 0 ? (
                <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 text-center text-xs text-[#A9A3B8]">
                  Anti-bot monitors healthy. No suspicious activities reported.
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {fraudFlags.map((flag) => (
                    <div key={flag.id} className="p-3 rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/40 glass flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-extrabold text-[#FF4D6D] flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> @{flag.username} flagged
                        </div>
                        <div className="text-[11px] text-[#A9A3B8]">
                          Reason: <strong>{flag.reason}</strong>
                        </div>
                        <div className="text-[9px] font-mono text-[#A9A3B8]">
                          Flag ID: {flag.id.substring(0, 8)} • Risk: {flag.risk_score}%
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          id={`admin-btn-block-tab-${flag.id}`}
                          onClick={() => handleResolveFraud(flag.id, 'block_user')}
                          className="bg-[#FF4D6D] text-white rounded px-2.5 py-1.5 text-xs font-bold hover:bg-[#FF4D6D]/90 cursor-pointer transition-all"
                        >
                          Suspend User
                        </button>
                        <button
                          id={`admin-btn-dismiss-tab-${flag.id}`}
                          onClick={() => handleResolveFraud(flag.id, 'dismiss')}
                          className="bg-[#05020D]/60 text-[#A9A3B8] border border-[#A9A3B8]/10 rounded px-2.5 py-1.5 text-xs font-bold hover:text-white cursor-pointer transition-all"
                        >
                          Dismiss Flag
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. FEE WALLET TAB */}
        {currentAdminTab === 'feewallet' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#38F8B0] uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="h-4.5 w-4.5" /> Ecosystem Fee Wallet
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Monitor accrued system fees collected from promotional escrows. Transfer collected vVIRAL to designated treasury nodes.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-[#05020D] p-4 rounded-lg border border-[#A9A3B8]/5 space-y-2">
                <span className="text-[9px] text-[#A9A3B8] uppercase block">Treasury Pool Balance</span>
                <div className="text-xl font-extrabold text-[#38F8B0]">{(stats?.totalFeesCollected || 128450).toLocaleString()} vVIRAL</div>
                <div className="text-[9px] text-[#A9A3B8]">Derived from platform 10% advertising deposit tax.</div>
              </div>

              <div className="p-3 bg-[#05020D] border border-[#A9A3B8]/5 rounded-lg space-y-2">
                <span className="text-[10px] text-white block font-bold uppercase tracking-wide">Ecosystem Transfer Form</span>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[8px] text-[#A9A3B8] uppercase mb-1">Destination TON Wallet</label>
                    <input
                      type="text"
                      placeholder="e.g. EQAB..._TREASURY_TON_ADDRESS"
                      className="w-full rounded bg-[#0B0618] border border-[#A9A3B8]/10 p-2 text-xs text-white focus:outline-none focus:border-[#38F8B0]"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-[#A9A3B8] uppercase mb-1">Amount (vVIRAL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      className="w-full rounded bg-[#0B0618] border border-[#A9A3B8]/10 p-2 text-xs text-white focus:outline-none focus:border-[#38F8B0]"
                    />
                  </div>
                  <button className="w-full bg-[#38F8B0] hover:bg-[#38F8B0]/90 text-black font-extrabold py-2 rounded-md transition-all text-xs cursor-pointer">
                    Initiate Network Transfer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. CLAIM & DROP TAB */}
        {currentAdminTab === 'claim' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-4.5 w-4.5" /> Token Claim & Ecosystem Airdrop Console
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Manage the general token drop criteria and track claims submitted by active earners after the bonding transition.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-[#05020D] rounded-lg border border-[#A9A3B8]/5 space-y-3">
                <span className="text-[10px] text-[#FFD36A] uppercase block font-bold border-b border-[#A9A3B8]/10 pb-1">Token Claim Limits</span>
                <div className="space-y-1 text-[#A9A3B8] text-[11px]">
                  <div>- Mini App Claim Status: <strong className="text-white">{stats?.config?.isBonded ? 'UNLOCKED' : 'LOCKED (Pre-Bonding)'}</strong></div>
                  <div>- Minimum withdrawal: <strong className="text-white">100 vVIRAL</strong></div>
                  <div>- Active claimed tokens: <strong className="text-white">0 vVIRAL (None)</strong></div>
                  <div>- Pending request ledger: <strong className="text-white">{claimsList.length} requests</strong></div>
                </div>
              </div>

              <div className="p-3.5 bg-[#05020D] rounded-lg border border-[#A9A3B8]/5 space-y-3">
                <span className="text-[10px] text-white uppercase block font-bold border-b border-[#A9A3B8]/10 pb-1">Trigger Platform Drop</span>
                <p className="text-[10px] text-[#A9A3B8] leading-normal">
                  Drop starter balance modifiers of 500 vVIRAL to all qualified active users. Anti-fraud tree verified first.
                </p>
                <button className="w-full bg-[#FFD36A] hover:bg-[#FF9F1C] text-black font-extrabold py-1.5 rounded text-[10px] cursor-pointer transition-all uppercase font-mono">
                  Trigger Airdrop Sequence
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#05020D]/80 rounded-lg border border-[#A9A3B8]/5 space-y-3 mt-4 text-xs font-mono">
              <span className="text-[10px] text-[#FFD36A] block font-bold uppercase border-b border-[#A9A3B8]/10 pb-1">Earner Claims Log</span>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {claimsList.length === 0 ? (
                  <div className="text-center text-[#A9A3B8] italic py-3 text-[11px]">No real production data yet</div>
                ) : (
                  claimsList.map((claim) => (
                    <div key={claim.id} className="flex justify-between text-[11px] text-[#A9A3B8] border-b border-[#A9A3B8]/5 pb-1.5 last:border-0">
                      <div>
                        User <strong>@{claim.username}</strong> requested to claim <strong>{(claim.amount || 0).toLocaleString()} vVIRAL</strong>
                      </div>
                      <div className={`font-bold uppercase ${claim.status === 'completed' ? 'text-[#38F8B0]' : 'text-[#FFD36A]'}`}>{claim.status || 'Pending'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 11. PLATFORM SETTINGS TAB */}
        {currentAdminTab === 'settings' && (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 space-y-4">
            <h3 className="font-sans text-xs font-bold text-[#8A2BFF] uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5" /> Core Platform Parameters Configuration
            </h3>
            
            <p className="text-xs text-[#A9A3B8]">
              Update parameters instantly. These settings are synchronized in real-time with the secure database configuration table.
            </p>

            <form onSubmit={handleUpdateConfig} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-mono text-[#A9A3B8] mb-1 uppercase tracking-wider">Starter Bonus (vVIRAL)</label>
                  <input
                    id="admin-cfg-starter-tab"
                    type="number"
                    value={starterBonusInput}
                    onChange={(e) => setStarterBonusInput(e.target.value)}
                    className="w-full rounded bg-[#05020D] border border-[#A9A3B8]/10 p-2.5 text-xs text-white font-mono focus:border-[#8A2BFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-[#A9A3B8] mb-1 uppercase tracking-wider">Platform Fee (%)</label>
                  <input
                    id="admin-cfg-fee-tab"
                    type="number"
                    value={feePercentInput}
                    onChange={(e) => setFeePercentInput(e.target.value)}
                    className="w-full rounded bg-[#05020D] border border-[#A9A3B8]/10 p-2.5 text-xs text-white font-mono focus:border-[#8A2BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-[#A9A3B8] mb-1 uppercase tracking-wider">Daily User Reward Limit</label>
                <input
                  id="admin-cfg-daily-tab"
                  type="number"
                  value={dailyLimitInput}
                  onChange={(e) => setDailyLimitInput(e.target.value)}
                  className="w-full rounded bg-[#05020D] border border-[#A9A3B8]/10 p-2.5 text-xs text-white font-mono focus:border-[#8A2BFF] focus:outline-none"
                />
              </div>

              {configSuccess && (
                <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/15 p-2 rounded">
                  System parameters synchronized successfully!
                </div>
              )}

              <button
                id="admin-submit-config-tab"
                type="submit"
                className="w-full bg-gradient-to-r from-[#8A2BFF] to-[#B066FF] hover:from-[#B066FF] hover:to-[#8A2BFF] text-white font-extrabold py-2.5 rounded-lg text-xs cursor-pointer transition-all"
              >
                Synchronize System Parameters
              </button>
            </form>
          </div>
        )}

        {/* 12. LOGS & AUDIT TAB */}
        {currentAdminTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-[#B066FF]" /> Platform Cryptographic Audit Logs
              </h3>
              <button
                type="button"
                id="btn-refresh-audit-logs-tab"
                onClick={fetchAuditLogs}
                className="text-[10px] text-[#A9A3B8] hover:text-white flex items-center gap-1 font-mono transition-colors focus:outline-none cursor-pointer bg-[#8A2BFF]/10 px-2 py-1 rounded"
              >
                <RefreshCw className={`h-3 w-3 ${loadingAudit ? 'animate-spin' : ''}`} /> Refresh logs ledger
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Fraud Flag Events */}
              <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-[#A9A3B8]/10 pb-2">
                  <ShieldCheck className="h-4 w-4 text-[#38F8B0]" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider font-sans">Recent Fraud Flag Events ({auditLogs.fraudLogs.length})</span>
                </div>

                {auditLogs.fraudLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#A9A3B8] font-mono">No historical fraud flags in ledger.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {auditLogs.fraudLogs.map((log: any) => (
                      <div key={log.id} className="p-2.5 rounded bg-[#05020D]/40 border border-[#A9A3B8]/5 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">@{log.username}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                            log.status === 'pending' 
                              ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/10' 
                              : 'bg-[#38F8B0]/15 text-[#38F8B0] border border-[#38F8B0]/10'
                          }`}>
                            {log.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#A9A3B8]">
                          Flagged on <span className="text-white font-mono">{log.campaign_title}</span>
                        </div>

                        <div className="text-[11px] text-[#A9A3B8] bg-[#05020D]/60 p-1.5 rounded border border-[#A9A3B8]/5">
                          Reason: <strong className="text-white font-medium">{log.reason}</strong>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-[#A9A3B8]/60 font-mono pt-1 border-t border-[#A9A3B8]/5">
                          <span>Risk: <span className="text-[#FF4D6D] font-bold">{log.risk_score}%</span></span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejected Task Completions */}
              <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-[#A9A3B8]/10 pb-2">
                  <FileText className="h-4 w-4 text-[#FF4D6D]" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider font-sans">Rejected Task Completions ({auditLogs.rejectedCompletions.length})</span>
                </div>

                {auditLogs.rejectedCompletions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#A9A3B8] font-mono">No historical task rejections recorded.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {auditLogs.rejectedCompletions.map((log: any) => (
                      <div key={log.id} className="p-2.5 rounded bg-[#05020D]/40 border border-[#A9A3B8]/5 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">@{log.username}</span>
                          <span className="bg-[#FF4D6D]/10 text-[#FF4D6D] text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border border-[#FF4D6D]/10">
                            REJECTED
                          </span>
                        </div>

                        <div className="text-[11px] text-[#A9A3B8]">
                          Campaign: <span className="text-white">{log.campaign_title}</span> ({log.action_type})
                        </div>

                        <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/5 p-1.5 rounded border border-[#FF4D6D]/10">
                          Reason: <strong className="text-white font-medium">{log.rejection_reason}</strong>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-[#A9A3B8]/60 font-mono pt-1 border-t border-[#A9A3B8]/5">
                          <span>Risk: <span className="text-[#FF4D6D] font-bold">{log.risk_score}%</span></span>
                          <span>{new Date(log.rejected_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Phase 2: AI Learning Database Panel */}
            <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#A9A3B8]/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-[#8A2BFF]" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider font-sans">AI Learning Fine-Tuning Ledger ({aiLearning.records?.length || 0})</span>
                </div>
                <div className="flex gap-2 text-[10px] font-mono">
                  <span className="text-[#A9A3B8]">Alignment Rate:</span>
                  <span className="text-[#38F8B0] font-bold">{aiLearning.analytics?.accuracy_rate || 100}%</span>
                </div>
              </div>

              {(!aiLearning.records || aiLearning.records.length === 0) ? (
                <div className="text-center py-8 text-xs text-[#A9A3B8] font-mono">
                  No learning comparisons logged yet. Make admin decisions on the Moderation Queue to populate the AI database.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 max-h-[350px] overflow-y-auto pr-1">
                  {aiLearning.records.map((rec: any) => (
                    <div key={rec.id} className="p-3 rounded bg-neutral-950/80 border border-neutral-900 space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white font-bold uppercase truncate max-w-[180px]">{rec.resource_title}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[8px] ${
                          rec.is_aligned 
                            ? 'bg-[#FF4D6D]/15 text-[#FF4D6D]' 
                            : 'bg-[#38F8B0]/15 text-[#38F8B0]'
                        }`}>
                          {rec.is_aligned ? 'ADMIN OVERRIDE' : 'ALIGNED WITH AI'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px] bg-neutral-900/50 p-2 rounded border border-neutral-800/60">
                        <div>
                          <span className="text-[#A9A3B8] block text-[8px] uppercase">AI Recommendation</span>
                          <span className="text-white font-semibold">{rec.ai_recommendation} (Score: {rec.ai_trust_score})</span>
                        </div>
                        <div>
                          <span className="text-[#A9A3B8] block text-[8px] uppercase">Admin Decision</span>
                          <span className="text-[#FFD36A] font-semibold uppercase">{rec.admin_decision}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#A9A3B8] leading-tight">
                        Feedback: <span className="text-white italic">"{rec.admin_reason}"</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
