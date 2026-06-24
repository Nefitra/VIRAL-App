import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle, XCircle, Settings, RefreshCw, 
  Trash2, AlertTriangle, ToggleLeft, ToggleRight, Database, Users, TrendingUp,
  History, ShieldCheck, FileText, X
} from 'lucide-react';

interface AdminProps {
  onBondingToggled: () => void;
}

export default function Admin({ onBondingToggled }: AdminProps) {
  const [stats, setStats] = useState<any | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [fraudFlags, setFraudFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const fetchAuditLogs = () => {
    setLoadingAudit(true);
    fetch('/api/admin/audit-logs')
      .then(res => res.json())
      .then(data => {
        setAuditLogs(data);
        setLoadingAudit(false);
      })
      .catch(err => {
        console.error('Error fetching audit logs:', err);
        setLoadingAudit(false);
      });
  };

  const fetchAdminData = () => {
    setLoading(true);
    
    // Fetch stats
    Promise.all([
      fetch('/api/admin/stats').then(res => res.json()),
      fetch('/api/resources').then(res => res.json()),
      fetch('/api/admin/completions').then(res => res.json()),
      fetch('/api/admin/fraud').then(res => res.json())
    ])
      .then(([statsData, resourcesData, completionsData, fraudData]) => {
        setStats(statsData);
        setResources(resourcesData.filter((r: any) => r.status === 'pending'));
        setCompletions(completionsData);
        setFraudFlags(fraudData.filter((f: any) => f.status === 'pending'));
        
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
  }, []);

  const handleUpdateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess(false);

    fetch('/api/admin/config', {
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
    fetch('/api/admin/bond', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          onBondingToggled();
          fetchAdminData();
        }
      })
      .catch(err => console.error(err));
  };

  const handleApproveResource = (id: string, status: 'approved' | 'rejected') => {
    fetch(`/api/resources/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const handleResolveCompletion = (completionId: string, approve: boolean, reason?: string) => {
    fetch(`/api/completions/${completionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve, reason })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  const handleResolveFraud = (flagId: string, action: 'block_user' | 'dismiss') => {
    fetch(`/api/admin/fraud/${flagId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
      .then(res => res.json())
      .then(() => fetchAdminData())
      .catch(err => console.error(err));
  };

  if (loading) {
    return <div className="text-xs text-[#A9A3B8] font-mono">Loading core administrator dashboard...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Overview Analytics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3 space-y-1">
          <div className="stat-label">Total Users Active</div>
          <div className="text-base font-extrabold text-white font-mono">{stats?.totalUsers} users</div>
          <div className="text-[9px] text-[#38F8B0] font-mono">● {stats?.activeUsers} Online</div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3 space-y-1">
          <div className="stat-label">Platform Fee Stats</div>
          <div className="text-base font-extrabold text-[#FFD36A] font-mono">{stats?.totalFeesCollected?.toLocaleString()} vVIRAL</div>
          <div className="text-[9px] text-[#A9A3B8] font-mono">Collected Turnover</div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3 space-y-1">
          <div className="stat-label">Total Escrow Locked</div>
          <div className="text-base font-extrabold text-[#B066FF] font-mono">{stats?.totalEscrowLocked?.toLocaleString()} vVIRAL</div>
          <div className="text-[9px] text-[#A9A3B8] font-mono">Advertiser Funds</div>
        </div>

        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/60 glass p-3 space-y-1">
          <div className="stat-label">Anti-Fraud Risk Rate</div>
          <div className="text-base font-extrabold text-[#FF4D6D] font-mono">{stats?.fraudRate}%</div>
          <div className="text-[9px] text-[#A9A3B8] font-mono">Suspicious User Ratio</div>
        </div>
      </div>

      {/* Control Board */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Toggle Bonding Curve */}
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
          <h3 className="font-sans text-xs font-bold text-[#38F8B0] uppercase tracking-wider flex items-center gap-1.5">
            <Database className="h-4 w-4" /> BLUM Launch & Bonding
          </h3>

          <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
            Transition the ecosystem from <strong>pre-bonding</strong> (internal vVIRAL fuel) to <strong>post-bonding</strong>. This launches real $VIRAL TON tokens, unlocking user claim forms.
          </p>

          <div className="flex items-center justify-between bg-[#05020D]/60 p-3 rounded-lg border border-[#A9A3B8]/5">
            <span className="text-[11px] text-white font-bold uppercase tracking-tight">Bonding Status:</span>
            <button
              id="admin-btn-bond"
              onClick={handleToggleBonding}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-3.5 py-1.5 rounded bg-[#8A2BFF] text-white hover:bg-[#B066FF] cursor-pointer transition-all uppercase tracking-wide font-mono"
            >
              {stats?.config?.isBonded ? 'Bonded (Active)' : 'Bonding (Inactive)'}
            </button>
          </div>
        </div>

        {/* Configurations panel */}
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
          <h3 className="font-sans text-xs font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="h-4 w-4" /> Economic Parameters
          </h3>

          <form onSubmit={handleUpdateConfig} className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-mono text-[#A9A3B8] mb-1 uppercase tracking-wider">Starter Bonus (vVIRAL)</label>
                <input
                  id="admin-cfg-starter"
                  type="number"
                  value={starterBonusInput}
                  onChange={(e) => setStarterBonusInput(e.target.value)}
                  className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white font-mono focus:border-[#8A2BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-[#A9A3B8] mb-1 uppercase tracking-wider">Platform Fee (%)</label>
                <input
                  id="admin-cfg-fee"
                  type="number"
                  value={feePercentInput}
                  onChange={(e) => setFeePercentInput(e.target.value)}
                  className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white font-mono focus:border-[#8A2BFF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-[#A9A3B8] mb-1 uppercase tracking-wider">Daily User Reward Limit</label>
              <input
                id="admin-cfg-daily"
                type="number"
                value={dailyLimitInput}
                onChange={(e) => setDailyLimitInput(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white font-mono focus:border-[#8A2BFF] focus:outline-none"
              />
            </div>

            {configSuccess && <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/15 p-2 rounded">Parameters synchronized successfully!</div>}

            <button
              id="admin-submit-config"
              type="submit"
              className="w-full bg-[#8A2BFF] hover:bg-[#B066FF] text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-all"
            >
              Synchronize System Parameters
            </button>
          </form>
        </div>
      </div>

      {/* Task Approvals ledger */}
      <div className="space-y-2">
        <h3 className="font-sans text-[10px] font-bold text-[#B066FF] uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" /> Suspicious Actions Awaiting Manual Audit ({completions.length})
        </h3>

        {completions.length === 0 ? (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 text-center text-xs text-[#A9A3B8]">
            No task completion audits currently requested. Anti-bot checks fully synchronized.
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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
                      id={`input-reject-reason-${tc.id}`}
                      type="text"
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      placeholder="e.g. Skipped dwell duration check"
                      className="w-full rounded bg-[#0B0618] border border-[#FF4D6D]/20 p-1.5 text-[11px] text-white font-mono focus:border-[#FF4D6D] focus:outline-none placeholder:text-gray-600"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        id={`btn-cancel-reject-${tc.id}`}
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
                        id={`btn-confirm-reject-${tc.id}`}
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
                      id={`admin-btn-approve-task-${tc.id}`}
                      onClick={() => handleResolveCompletion(tc.id, true)}
                      className="inline-flex items-center gap-1 bg-[#38F8B0]/10 text-[#38F8B0] border border-[#38F8B0]/20 rounded px-2.5 py-1.5 text-xs font-bold hover:bg-[#38F8B0]/20 cursor-pointer transition-all"
                    >
                      <CheckCircle className="h-3 w-3" /> Approve
                    </button>
                    <button
                      id={`admin-btn-reject-task-${tc.id}`}
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

      {/* Resource Profile Approvals */}
      <div className="space-y-2">
        <h3 className="font-sans text-[10px] font-bold text-[#FFD36A] uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-4 w-4" /> Promotion Resources Awaiting Approvals ({resources.length})
        </h3>

        {resources.length === 0 ? (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 text-center text-xs text-[#A9A3B8]">
            No promotion resources awaiting administrative review.
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {resources.map((res) => (
              <div key={res.id} className="p-3 rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/40 glass flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{res.title}</span>
                    <span className="bg-[#8A2BFF]/15 text-[#B066FF] rounded px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase">
                      {res.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A9A3B8] leading-relaxed line-clamp-2">
                    {res.description}
                  </div>
                  <div className="text-[9px] font-mono text-[#A9A3B8] truncate">
                    URL: {res.url}
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    id={`admin-btn-approve-res-${res.id}`}
                    onClick={() => handleApproveResource(res.id, 'approved')}
                    className="bg-[#38F8B0]/10 text-[#38F8B0] border border-[#38F8B0]/20 rounded px-2.5 py-1.5 text-xs font-bold hover:bg-[#38F8B0]/20 cursor-pointer transition-all"
                  >
                    Approve
                  </button>
                  <button
                    id={`admin-btn-reject-res-${res.id}`}
                    onClick={() => handleApproveResource(res.id, 'rejected')}
                    className="bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/20 rounded px-2.5 py-1.5 text-xs font-bold hover:bg-[#FF4D6D]/20 cursor-pointer transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fraud Alert center */}
      <div className="space-y-2">
        <h3 className="font-sans text-[10px] font-bold text-[#FF4D6D] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4" /> High-Risk User Fraud Alerts ({fraudFlags.length})
        </h3>

        {fraudFlags.length === 0 ? (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-5 text-center text-xs text-[#A9A3B8]">
            Anti-bot monitors healthy. No suspicious activities reported.
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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
                    id={`admin-btn-block-${flag.id}`}
                    onClick={() => handleResolveFraud(flag.id, 'block_user')}
                    className="bg-[#FF4D6D] text-white rounded px-2.5 py-1.5 text-xs font-bold hover:bg-[#FF4D6D]/90 cursor-pointer transition-all"
                  >
                    Suspend User
                  </button>
                  <button
                    id={`admin-btn-dismiss-${flag.id}`}
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

      {/* Security Audit Logs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <History className="h-4 w-4 text-[#B066FF]" /> Security & Rejection Audit Log
          </h3>
          <button
            type="button"
            id="btn-refresh-audit-logs"
            onClick={fetchAuditLogs}
            className="text-[10px] text-[#A9A3B8] hover:text-white flex items-center gap-1 font-mono transition-colors focus:outline-none cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loadingAudit ? 'animate-spin' : ''}`} /> Refresh Logs
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
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
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
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
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
      </div>
    </div>
  );
}
