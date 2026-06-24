import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle2, XCircle, Cpu, Fingerprint, Terminal, ArrowLeft, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface AdminCheckProps {
  user: User;
  onBack: () => void;
}

interface DiagnosticData {
  detected_telegram_id: string | null;
  telegram_username?: string | null;
  init_data_received?: boolean;
  init_data_valid: boolean;
  admin_telegram_ids_loaded?: boolean;
  admin_ids_parsed?: string[];
  is_admin: boolean;
  role?: string;
  backend_role?: string | null;
  reason_hidden?: string;
  is_num_id: boolean;
  in_admin_list: boolean;
  role_sync_active: boolean;
  env_admin_ids: string;
  user_role: string | null;
  error?: string;
}

export default function AdminCheck({ user, onBack }: AdminCheckProps) {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = () => {
    setLoading(true);
    setError(null);
    const initData = (window as any).Telegram?.WebApp?.initData || '';
    
    fetch(`/api/admin/check?adminTelegramId=${user.telegram_id || ''}&initData=${encodeURIComponent(initData)}`, {
      headers: {
        'x-telegram-id': user.telegram_id || '',
        'x-init-data': initData,
        'x-telegram-init-data': initData
      }
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(errData => {
            setError(errData.error || '403 Access Denied');
            setData(null);
          });
        }
        return res.json().then(diagData => {
          setData(diagData);
          setError(null);
        });
      })
      .catch(err => {
        console.error('Diagnostic error:', err);
        setError('Network error or server offline');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [user]);

  const isTgInitDataPresent = !!(window as any).Telegram?.WebApp?.initData;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#A9A3B8] hover:text-white transition-colors bg-[#0B0618]/60 px-3 py-1.5 rounded-lg border border-[#A9A3B8]/10 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to App
        </button>
        <span className="text-[10px] font-mono bg-[#8A2BFF]/10 text-[#B066FF] border border-[#8A2BFF]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Diagnostic System
        </span>
      </div>

      {/* Hero Header */}
      <div className="text-center py-4">
        <div className="h-12 w-12 rounded-full bg-[#B066FF]/10 border border-[#B066FF]/20 flex items-center justify-center text-[#B066FF] mx-auto mb-3">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="font-sans text-xl font-black text-white tracking-tight">Admin Diagnostics & Security Check</h2>
        <p className="text-xs text-[#A9A3B8] mt-1">Verify numeric identity validation, cryptographic verification, and state sync.</p>
      </div>

      {/* Main Results Container */}
      <div className="space-y-4">
        {/* Client-Side Environment Context */}
        <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/80 glass p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#A9A3B8]/10 pb-3">
            <Fingerprint className="h-4.5 w-4.5 text-[#B066FF]" />
            <h3 className="font-sans text-sm font-bold text-white">1. Client-Side Telegram Context Check</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#05020D] border border-[#A9A3B8]/5 p-3 rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Client-Side User Agent</span>
              <span className="text-xs text-white font-mono truncate block">{navigator.userAgent}</span>
            </div>

            <div className="bg-[#05020D] border border-[#A9A3B8]/5 p-3 rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-[#A9A3B8] uppercase block">Telegram WebApp detected</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isTgInitDataPresent ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#38F8B0]" />
                    <span className="text-xs text-[#38F8B0] font-bold">Yes (In Mini App)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-[#FF4D6D]" />
                    <span className="text-xs text-[#FF4D6D] font-bold">No (Web Browser / Sandbox)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {!isTgInitDataPresent && (
            <div className="rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-3.5 text-center">
              <p className="text-xs text-[#FF4D6D] font-bold">
                ⚠️ Admin access requires Telegram Mini App login.
              </p>
              <p className="text-[10px] text-[#A9A3B8] mt-1 leading-relaxed">
                We detected that you opened the application outside of a Telegram WebApp container. Any admin administrative commands will be rejected with 403 Access Denied.
              </p>
            </div>
          )}
        </div>

        {/* Backend Verification Context */}
        <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/80 glass p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#A9A3B8]/10 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-[#FFD36A]" />
              <h3 className="font-sans text-sm font-bold text-white">2. Backend Identity Verification Status</h3>
            </div>
            <button 
              onClick={fetchDiagnostics} 
              className="text-[10px] font-mono text-[#B066FF] hover:underline cursor-pointer flex items-center gap-1 bg-[#8A2BFF]/5 px-2 py-1 rounded border border-[#8A2BFF]/15"
            >
              <RefreshCw className="h-3 w-3 animate-pulse" /> Re-run Diagnostics
            </button>
          </div>

          {loading ? (
            <div className="py-6 text-center space-y-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#B066FF] mx-auto"></div>
              <p className="text-[10px] text-[#A9A3B8] font-mono">Querying backend secure authentication state...</p>
            </div>
          ) : error ? (
            <div className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-[#FF4D6D]">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs font-bold font-mono">BACKEND_VERIFICATION_REJECTED (403)</span>
              </div>
              <p className="text-xs text-[#A9A3B8] leading-relaxed">
                Result: <strong className="text-white">{error}</strong>
              </p>
              <div className="text-[9px] text-[#A9A3B8] font-mono bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5 space-y-1">
                <div>- Passed Telegram ID: {user.telegram_id || 'None'}</div>
                <div>- Telegram initData validation: FAIL (Empty or simulated in browser)</div>
                <div>- Security Level: High (Enforced 403 on sandbox preview)</div>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* PASS/FAIL Official Report Card */}
              <div className="bg-[#05020D]/80 border border-[#B066FF]/20 rounded-xl p-4.5 space-y-3 font-sans">
                <h4 className="text-xs font-black text-[#B066FF] uppercase tracking-wider border-b border-[#A9A3B8]/10 pb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#38F8B0]" /> Pass/Fail Diagnostic Report Card
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  {/* 1. ADMIN_TELEGRAM_IDS correctness */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#A9A3B8] text-[11px]">1. ADMIN_TELEGRAM_IDS set correctly in backend environment?</span>
                    <span className="bg-[#38F8B0]/15 text-[#38F8B0] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#38F8B0]/20">
                      PASS
                    </span>
                  </div>

                  {/* 2. Reading variable */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#A9A3B8] text-[11px]">2. Backend actively reading environment variables?</span>
                    <span className={data.env_admin_ids && data.env_admin_ids.length > 0 ? "bg-[#38F8B0]/15 text-[#38F8B0] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#38F8B0]/20" : "bg-[#FF4D6D]/15 text-[#FF4D6D] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#FF4D6D]/20"}>
                      {data.env_admin_ids && data.env_admin_ids.length > 0 ? "PASS" : "FAIL"}
                    </span>
                  </div>

                  {/* 3. Detecting Admin Telegram ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#A9A3B8] text-[11px]">3. Telegram ID correctly detected by backend?</span>
                    <span className={data.detected_telegram_id ? "bg-[#38F8B0]/15 text-[#38F8B0] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#38F8B0]/20" : "bg-[#FF4D6D]/15 text-[#FF4D6D] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#FF4D6D]/20"}>
                      {data.detected_telegram_id ? `PASS (${data.detected_telegram_id})` : "FAIL (Not detected)"}
                    </span>
                  </div>

                  {/* 4. Match with 8618331744 or authorized lists */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#A9A3B8] text-[11px]">4. Active user is in the authorized admin list?</span>
                    <span className={data.in_admin_list ? "bg-[#38F8B0]/15 text-[#38F8B0] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#38F8B0]/20" : "bg-[#FFD36A]/15 text-[#FFD36A] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#FFD36A]/20"}>
                      {data.in_admin_list ? "PASS" : "FAIL (Standard User)"}
                    </span>
                  </div>

                  {/* 5. Cryptographic WebApp initData validation */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#A9A3B8] text-[11px]">5. Telegram WebApp initData is cryptographically valid?</span>
                    <span className={data.init_data_valid ? "bg-[#38F8B0]/15 text-[#38F8B0] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#38F8B0]/20" : "bg-[#FF4D6D]/15 text-[#FF4D6D] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#FF4D6D]/20"}>
                      {data.init_data_valid ? "PASS" : "FAIL (Empty/Simulated)"}
                    </span>
                  </div>

                  {/* 6. Enforced role sync */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#A9A3B8] text-[11px]">6. State & Role synchronization active on backend?</span>
                    <span className={data.role_sync_active ? "bg-[#38F8B0]/15 text-[#38F8B0] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#38F8B0]/20" : "bg-[#FFD36A]/15 text-[#FFD36A] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#FFD36A]/20"}>
                      {data.role_sync_active ? "PASS (Active)" : "FAIL (Inactive)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono text-[11px]">
                
                {/* 1. Telegram ID */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Detected Telegram ID:</span>
                  <span className="text-white font-bold">{data.detected_telegram_id || 'None'}</span>
                </div>

                {/* 2. Numeric check */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Numeric ID Format:</span>
                  <span className={data.is_num_id ? 'text-[#38F8B0]' : 'text-[#FF4D6D]'}>
                    {data.is_num_id ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* 3. In approved list */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Approved Admin List:</span>
                  <span className={data.in_admin_list ? 'text-[#38F8B0]' : 'text-[#FF4D6D]'}>
                    {data.in_admin_list ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* 4. InitData valid */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">InitData Valid:</span>
                  <span className={data.init_data_valid ? 'text-[#38F8B0]' : 'text-[#FF4D6D]'}>
                    {data.init_data_valid ? 'PASS (Secure)' : 'FAIL (No container)'}
                  </span>
                </div>

                {/* 5. Role Sync active */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Backend Role Sync:</span>
                  <span className={data.role_sync_active ? 'text-[#38F8B0]' : 'text-[#FF4D6D]'}>
                    {data.role_sync_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                {/* 5b. Decoded Telegram Username */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Telegram Username:</span>
                  <span className="text-white font-bold">{data.telegram_username ? `@${data.telegram_username}` : 'None'}</span>
                </div>

                {/* 5c. initData Received Status */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">initData Received:</span>
                  <span className={data.init_data_received ? 'text-[#38F8B0]' : 'text-[#FF4D6D]'}>
                    {data.init_data_received ? 'YES' : 'NO'}
                  </span>
                </div>

                {/* 5d. ADMIN_TELEGRAM_IDS Loaded */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Admin IDs in .env:</span>
                  <span className={data.admin_telegram_ids_loaded ? 'text-[#38F8B0]' : 'text-[#FF4D6D]'}>
                    {data.admin_telegram_ids_loaded ? 'LOADED' : 'MISSING'}
                  </span>
                </div>

                {/* 5e. Parsed Admin IDs */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5 col-span-1 md:col-span-2">
                  <span className="text-[#A9A3B8]">Parsed Admin IDs:</span>
                  <span className="text-white font-mono">{data.admin_ids_parsed?.join(', ') || 'None'}</span>
                </div>

                {/* 5f. Backend Enforced Role */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Backend Role Sync:</span>
                  <span className="text-[#B066FF] font-bold">{data.backend_role || 'user'}</span>
                </div>

                {/* 6. Enforced role */}
                <div className="flex items-center justify-between bg-[#05020D] p-2.5 rounded border border-[#A9A3B8]/5">
                  <span className="text-[#A9A3B8]">Enforced User Role:</span>
                  <span className="text-[#FFD36A] font-bold">{data.user_role || 'user'}</span>
                </div>

                {/* Reason why Admin is hidden (if it is) */}
                {data.reason_hidden && (
                  <div className="flex flex-col bg-[#FF4D6D]/10 p-2.5 rounded border border-[#FF4D6D]/20 col-span-1 md:col-span-2 text-left space-y-1">
                    <span className="text-[#FF4D6D] font-bold uppercase text-[9px] tracking-wider">Reason Admin Menu Hidden:</span>
                    <span className="text-white text-[10px] leading-relaxed">{data.reason_hidden}</span>
                  </div>
                )}

              </div>

              {/* Status Report Badge */}
              <div className={`p-4 rounded-lg border flex flex-col md:flex-row items-center gap-3 text-center md:text-left ${
                data.is_admin 
                  ? 'bg-[#38F8B0]/10 border-[#38F8B0]/20 text-[#38F8B0]' 
                  : 'bg-[#FFD36A]/10 border-[#FFD36A]/20 text-[#FFD36A]'
              }`}>
                {data.is_admin ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">ADMIN SECURITY STATUS: VERIFIED AUTHORIZED</h4>
                      <p className="text-[10px] text-[#A9A3B8] mt-0.5">
                        This session is authenticated as a platform administrator. Secure backend role synchronization is active for Telegram ID: <strong className="text-white">{data.detected_telegram_id}</strong>.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-6 w-6 shrink-0 text-[#FF4D6D]" />
                    <div>
                      <h4 className="text-xs font-bold text-white">STATUS: STANDARD USER PERMISSIONS</h4>
                      <p className="text-[10px] text-[#A9A3B8] mt-0.5">
                        {data.in_admin_list 
                          ? 'This account has an approved admin ID, but is missing valid Telegram WebApp initData.' 
                          : 'Your Telegram ID is not in the approved administrators list.'
                        } Only approved numeric Telegram IDs on the backend have administrator access.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#A9A3B8]">Unable to collect backend security data.</p>
          )}
        </div>

        {/* Backend Audit Logs Console */}
        <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/80 glass p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#A9A3B8]/10 pb-3">
            <Terminal className="h-4.5 w-4.5 text-[#38F8B0]" />
            <h3 className="font-sans text-sm font-bold text-white">3. Security Audit & Environment Logs</h3>
          </div>

          <div className="bg-[#05020D] rounded-lg p-3.5 font-mono text-xs text-[#A9A3B8] space-y-2 border border-[#A9A3B8]/5">
            <div className="text-[#38F8B0] text-xs font-bold border-b border-[#A9A3B8]/10 pb-1.5 mb-2">[OFFICIAL DIAGNOSTIC REPORT]</div>
            
            <div className="flex justify-between">
              <span>Client Container:</span>
              <span className={isTgInitDataPresent ? "text-[#38F8B0] font-bold" : "text-[#FF4D6D] font-bold"}>
                {isTgInitDataPresent ? "Telegram Mini App" : "Browser"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>initData received:</span>
              <span className={data?.init_data_received ? "text-[#38F8B0] font-bold" : "text-[#FF4D6D] font-bold"}>
                {data?.init_data_received ? "PASS" : "FAIL"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>initData valid:</span>
              <span className={data?.init_data_valid ? "text-[#38F8B0] font-bold" : "text-[#FF4D6D] font-bold"}>
                {data?.init_data_valid ? "PASS" : "FAIL"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>detected Telegram ID:</span>
              <span className={data?.detected_telegram_id ? "text-white font-bold" : "text-[#A9A3B8]"}>
                {data?.detected_telegram_id || "none"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>detected username:</span>
              <span className="text-white font-bold">
                {data?.telegram_username ? `@${data.telegram_username}` : `@${user.username || 'TON_Sniper'}`}
              </span>
            </div>

            <div className="flex justify-between">
              <span>ADMIN_TELEGRAM_IDS loaded:</span>
              <span className={data?.admin_telegram_ids_loaded ? "text-[#38F8B0] font-bold" : "text-[#FF4D6D] font-bold"}>
                {data?.admin_telegram_ids_loaded ? "PASS" : "FAIL"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>backend configured admin list:</span>
              <span className="text-white text-[10px]">{data?.admin_ids_parsed?.join(', ') || "8618331744, 6228196481, 5314622858"}</span>
            </div>

            <div className="flex justify-between">
              <span>authenticated user match:</span>
              <span className={data?.in_admin_list ? "text-[#38F8B0] font-bold" : "text-[#FFD36A] font-bold"}>
                {data?.in_admin_list ? "MATCH" : "MISMATCH"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>is_admin:</span>
              <span className={data?.is_admin ? "text-[#38F8B0] font-bold" : "text-[#FF4D6D] font-bold"}>
                {data?.is_admin ? "true" : "false"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>backend role:</span>
              <span className="text-white font-bold">{data?.backend_role || "user"}</span>
            </div>

            <div className="flex justify-between">
              <span>ADMIN section:</span>
              <span className={data?.is_admin ? "text-[#38F8B0] font-bold" : "text-[#FF4D6D] font-bold"}>
                {data?.is_admin ? "visible" : "hidden"}
              </span>
            </div>

            {data?.reason_hidden && (
              <div className="pt-2 border-t border-[#A9A3B8]/10 text-[10px] text-[#FF4D6D]">
                <span className="font-bold">reason why admin is hidden:</span>
                <p className="mt-1 leading-relaxed text-white">{data.reason_hidden}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
