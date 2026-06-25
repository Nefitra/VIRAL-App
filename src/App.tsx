import React, { useState, useEffect } from 'react';
import { 
  Rocket, Compass, PlusCircle, Coins, Users, 
  Settings, Award, Sparkles, LogIn, UserCircle, 
  MessageSquare, ShieldCheck, Database, Info, Wallet as WalletIcon
} from 'lucide-react';

import { User, Balance } from './types';
import Home from './components/Home';
import Discover from './components/Discover';
import Promote from './components/Promote';
import Earn from './components/Earn';
import Wallet from './components/Wallet';
import Referrals from './components/Referrals';
import More from './components/More';
import Admin from './components/Admin';
import AdminCheck from './components/AdminCheck';
import TonConnectCheck from './components/TonConnectCheck';
import { useTonAddress, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { ToastProvider, useToast } from './components/Toast';

function MainApp() {
  const { showToast } = useToast();
  const tonFriendlyAddress = useTonAddress();
  const tonWallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  
  // Pre-loaded switchable users for preview and simulation
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentBalance, setCurrentBalance] = useState<Balance | null>(null);
  
  const getInitialTab = () => {
    const path = window.location.pathname;
    if (path === '/admin-check') return 'admin-check';
    if (path === '/admin') return 'admin';
    if (path === '/tonconnect-check') return 'tonconnect-check';
    return 'home';
  };
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [selectedCampaignFromDiscover, setSelectedCampaignFromDiscover] = useState<any | null>(null);
  
  // Multi-Login Authentication States
  const [loginMethod, setLoginMethod] = useState<'telegram' | 'google'>('telegram');
  const [mockTgId, setMockTgId] = useState('11223344');
  const [mockUsername, setMockUsername] = useState('TON_Sniper');
  const [googleEmail, setGoogleEmail] = useState('crypto_grinder@example.com');
  const [googleSubId, setGoogleSubId] = useState('google_sub_12345');
  const [authError, setAuthError] = useState('');

  // Sync tab with URL path for direct route support
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/admin-check') {
        setActiveTab('admin-check');
      } else if (path === '/admin') {
        setActiveTab('admin');
      } else if (path === '/tonconnect-check') {
        setActiveTab('tonconnect-check');
      } else if (path === '/home') {
        setActiveTab('home');
      } else if (path === '/more') {
        setActiveTab('more');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Update URL pathname when activeTab changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    const targetPath = activeTab === 'home' ? '/' : `/${activeTab}`;
    if (currentPath !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [activeTab]);

  // Automated backend wallet sync when TonConnect changes
  useEffect(() => {
    if (!currentUser) return;

    // Connect wallet to backend if it is connected in UI but not synced
    if (tonFriendlyAddress && currentUser.wallet_address !== tonFriendlyAddress) {
      console.log(`[TonConnect Sync] Syncing wallet ${tonFriendlyAddress} with user ${currentUser.username}`);
      
      fetch('/api/wallet/verify-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          walletAddress: tonFriendlyAddress,
          walletProofSignature: tonWallet?.connectItems?.tonProof?.name || `tonconnect_proof_${Date.now()}`
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error('[TonConnect Sync Error]:', data.error);
            showToast(data.error, 'error', 'Wallet Sync Failed');
          } else {
            setCurrentUser(data.user);
            if (data.balance) {
              setCurrentBalance(data.balance);
            }
            showToast(`Decentralized TON Wallet linked successfully!`, 'success', 'Wallet Connected');
          }
        })
        .catch(err => {
          console.error('[TonConnect Sync Network Error]:', err);
        });
    }
    // Disconnect wallet from backend if disconnected in UI but remains in user profile
    else if (!tonFriendlyAddress && currentUser.wallet_address) {
      console.log(`[TonConnect Sync] Disconnecting wallet from backend`);
      fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setCurrentUser(data.user);
            showToast('TON Wallet disconnected successfully.', 'success', 'Wallet Unlinked');
          }
        })
        .catch(err => {
          console.error('[TonConnect Disconnect Network Error]:', err);
        });
    }
  }, [tonFriendlyAddress, currentUser?.id]);

  // Capture referrer ID and load default session
  useEffect(() => {
    const tgWebApp = (window as any).Telegram?.WebApp;
    const tgUser = tgWebApp?.initDataUnsafe?.user;
    const initData = tgWebApp?.initData;

    // 1. Capture Referrer ID from Telegram start_param or URL
    let refId: string | null = null;
    const startParam = tgWebApp?.initDataUnsafe?.start_param;
    if (startParam) {
      refId = startParam.startsWith('ref_') ? startParam.substring(4) : startParam;
    }
    if (!refId) {
      const urlParams = new URLSearchParams(window.location.search);
      const start = urlParams.get('start') || urlParams.get('ref') || urlParams.get('tgWebAppStartParam') || urlParams.get('startapp') || urlParams.get('tgWebAppStartapp');
      if (start) {
        refId = start.startsWith('ref_') ? start.substring(4) : start;
      }
    }
    if (refId) {
      sessionStorage.setItem('viral_referrer_id', refId);
      console.log('[Referral System] Stored referrer_id in sessionStorage:', refId);
    }

    // 2. Auth Flow
    if (tgUser && tgUser.id) {
      // Real Telegram WebApp Environment - log in using real credentials!
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData || ''
        },
        body: JSON.stringify({
          telegram_id: tgUser.id.toString(),
          username: tgUser.username || `tg_${tgUser.id}`,
          initData: initData || '',
          referrer_id: refId || sessionStorage.getItem('viral_referrer_id') || undefined
        })
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setCurrentUser(data.user);
            setCurrentBalance(data.balance);
            localStorage.setItem('viral_login_payload', JSON.stringify({
              provider: 'telegram',
              telegram_id: data.user.telegram_id,
              username: data.user.username
            }));
            showToast(`Synced Telegram Session: @${data.user.username}`, 'success', 'Ecosystem Authenticated');
          } else {
            setAuthError(data.error);
          }
        })
        .catch(err => {
          console.error('Telegram auto-auth error:', err);
        });
    } else {
      // Fallback/Simulation mode check: Retrieve saved session if exists
      const savedPayload = localStorage.getItem('viral_login_payload');
      if (savedPayload) {
        try {
          const payload = JSON.parse(savedPayload);
          handleLoginSimulation(payload.telegram_id, payload.username, payload.email, true);
        } catch (e) {
          localStorage.removeItem('viral_login_payload');
        }
      } else {
        // DO NOT automatically sign in as TON_Sniper. Let user log in or select account!
        console.log('[Auth System] No active session found. Showing login portal.');
      }
    }
  }, []);

  const handleLoginSimulation = (tgId: string, username: string, email?: string, isSilent = false) => {
    setAuthError('');
    const referrerId = sessionStorage.getItem('viral_referrer_id') || undefined;
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: tgId,
        username,
        email,
        referrer_id: referrerId
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          if (!isSilent) {
            setAuthError(data.error);
            showToast(data.error, 'error', 'Error');
          }
        } else {
          setCurrentUser(data.user);
          setCurrentBalance(data.balance);
          localStorage.setItem('viral_login_payload', JSON.stringify({
            provider: email ? 'google' : 'telegram',
            telegram_id: tgId,
            username,
            email
          }));
          setActiveTab('home');
          if (!isSilent) {
            showToast(`Switched session to @${username}`, 'success', 'Session Synced');
          }
        }
      })
      .catch(err => {
        console.error('Login error:', err);
        if (!isSilent) {
          setAuthError('Ecosystem server offline. Please compile and try again.');
          showToast('Ecosystem server offline.', 'error', 'Network Failure');
        }
      });
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const referrerId = sessionStorage.getItem('viral_referrer_id') || undefined;
    const payload = loginMethod === 'telegram' ? {
      provider: 'telegram',
      telegram_id: mockTgId,
      username: mockUsername,
      referrer_id: referrerId
    } : {
      provider: 'google',
      google_id: googleSubId,
      email: googleEmail,
      username: googleEmail.split('@')[0],
      referrer_id: referrerId
    };

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setAuthError(data.error);
          showToast(data.error, 'error', 'Authentication Error');
        } else {
          setCurrentUser(data.user);
          setCurrentBalance(data.balance);
          localStorage.setItem('viral_login_payload', JSON.stringify({
            provider: loginMethod,
            telegram_id: loginMethod === 'telegram' ? mockTgId : googleSubId,
            username: loginMethod === 'telegram' ? mockUsername : googleEmail.split('@')[0],
            email: loginMethod === 'google' ? googleEmail : undefined
          }));
          setActiveTab('home');
          showToast(`Logged in successfully as @${data.user.username}`, 'success', 'Ecosystem Authenticated');
        }
      })
      .catch(err => {
        console.error('Login error:', err);
        setAuthError('Ecosystem server offline. Please compile and try again.');
        showToast('Ecosystem server offline.', 'error', 'Network Failure');
      });
  };

  const reloadUserAndBalance = () => {
    if (!currentUser) return;
    fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: currentUser.telegram_id,
        username: currentUser.username,
        email: currentUser.email
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCurrentUser(data.user);
          setCurrentBalance(data.balance);
        }
      })
      .catch(err => console.error(err));
  };

  const handleSelectCampaignFromDiscover = (campaign: any) => {
    setSelectedCampaignFromDiscover(campaign);
    setActiveTab('earn');
    showToast(`Selected campaign: ${campaign.title}. Headed to Earn tab!`, 'info', 'Campaign Selected');
  };

  const handleSignOut = () => {
    localStorage.removeItem('viral_login_payload');
    setCurrentUser(null);
    setCurrentBalance(null);
    setActiveTab('home');
    showToast('Signed out successfully. Switchable profile active.', 'success', 'Session Terminated');
  };

  return (
    <div className="min-h-screen bg-[#05020D] text-white flex flex-col font-sans select-none antialiased">
      
      {/* 1. Simulator Profile Switcher & Header Bar */}
      <header className="border-b border-[#A9A3B8]/10 bg-[#0B0618]/90 backdrop-blur px-4 py-2 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          
          {/* Main Logo */}
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#8A2BFF] to-[#B066FF] flex items-center justify-center shadow-lg shadow-[#8A2BFF]/20">
              <Sparkles className="h-4 w-4 text-[#FFD36A]" />
            </div>
            <div>
              <div className="font-sans text-xs font-black tracking-tight flex items-center gap-1 uppercase">
                $VIRAL <span className="text-[#B066FF] text-[8px] font-bold bg-[#8A2BFF]/15 px-1.5 py-0.2 rounded border border-[#8A2BFF]/30 lowercase">Ecosystem</span>
              </div>
              <p className="text-[9px] text-[#A9A3B8] font-mono">Web3 Mutual Promotion Platform</p>
            </div>
          </div>

          {/* Live Protocol Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold bg-[#38F8B0]/10 border border-[#38F8B0]/20 text-[#38F8B0] px-2 py-0.5 rounded uppercase tracking-wider">
              ● Live Protocol Active
            </span>
          </div>
        </div>
      </header>

      {/* Account Info Bar (if logged in) */}
      {currentUser && currentBalance && (
        <div className="bg-[#05020D] border-b border-[#A9A3B8]/5 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs text-[#A9A3B8] gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserCircle className="h-4 w-4 text-[#B066FF]" />
                <span className="text-white font-bold truncate">@{currentUser.username}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8A2BFF]/10 text-[#B066FF] font-mono border border-[#8A2BFF]/20">
                  {currentUser.quality_score}
                </span>
              </div>

              {/* Wallet Status Badge or Connect Button */}
              {tonFriendlyAddress || currentUser.wallet_address ? (
                <div className="flex items-center gap-1 bg-[#38F8B0]/10 text-[#38F8B0] border border-[#38F8B0]/20 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold">
                  <span className="h-1 w-1 rounded-full bg-[#38F8B0] animate-pulse"></span>
                  <span>{(tonFriendlyAddress || currentUser.wallet_address).substring(0, 4)}...{(tonFriendlyAddress || currentUser.wallet_address).substring((tonFriendlyAddress || currentUser.wallet_address).length - 4)}</span>
                </div>
              ) : (
                <button
                  id="header-btn-connect-wallet"
                  onClick={() => {
                    if (tonConnectUI) {
                      tonConnectUI.openModal();
                    }
                  }}
                  className="bg-[#38F8B0] hover:bg-[#38F8B0]/95 text-[#05020D] text-[9px] font-extrabold px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 uppercase tracking-wide"
                >
                  <Sparkles className="h-2.5 w-2.5" /> Connect Wallet
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-[#FFD36A]" />
                <span className="text-[#FFD36A] font-bold">{currentBalance.vviral_balance.toLocaleString()} vVIRAL</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-[#B066FF]" />
                <span>{currentBalance.viral_power} VP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content View Router */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-24">
        {currentUser && currentBalance ? (
          <div>
            {activeTab === 'home' && (
              <Home 
                user={currentUser} 
                balance={currentBalance} 
                setActiveTab={setActiveTab} 
                onCheckInCompleted={reloadUserAndBalance}
              />
            )}
            
            {activeTab === 'discover' && (
              <Discover 
                user={currentUser}
                balance={currentBalance}
                onSelectCampaign={handleSelectCampaignFromDiscover} 
                onCampaignCreated={reloadUserAndBalance}
              />
            )}

            {activeTab === 'promote' && (
              <Promote 
                user={currentUser} 
                balance={currentBalance} 
                onCampaignCreated={reloadUserAndBalance} 
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'earn' && (
              <Earn 
                user={currentUser} 
                balance={currentBalance} 
                selectedCampaignFromDiscover={selectedCampaignFromDiscover}
                onTaskCompleted={() => {
                  reloadUserAndBalance();
                  setSelectedCampaignFromDiscover(null);
                }} 
              />
            )}

            {activeTab === 'wallet' && (
              <Wallet 
                user={currentUser} 
                balance={currentBalance} 
                onBalanceUpdated={reloadUserAndBalance} 
              />
            )}

            {activeTab === 'referrals' && (
              <Referrals 
                user={currentUser} 
              />
            )}

            {activeTab === 'more' && (
              <More 
                user={currentUser} 
                balance={currentBalance} 
                onProfileUpdated={reloadUserAndBalance} 
                onOpenAdminCheck={() => setActiveTab('admin-check')}
                onOpenAdminSection={() => setActiveTab('admin')}
                onSignOut={handleSignOut}
              />
            )}

            {activeTab === 'admin' && (
              <Admin 
                user={currentUser}
                onBondingToggled={reloadUserAndBalance} 
              />
            )}

            {activeTab === 'admin-check' && (
              <AdminCheck 
                user={currentUser}
                onBack={() => setActiveTab('more')}
              />
            )}

            {activeTab === 'tonconnect-check' && (
              <TonConnectCheck 
                user={currentUser}
                onBack={() => setActiveTab('more')}
              />
            )}
          </div>
        ) : (
          /* Setup profile fallback screen */
          <div className="max-w-md mx-auto my-12 rounded-2xl border border-[#A9A3B8]/10 bg-[#0B0618] p-6 space-y-5 text-center">
            <div className="h-12 w-12 rounded-full bg-[#8A2BFF]/10 flex items-center justify-center text-[#B066FF] mx-auto">
              <LogIn className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-sans text-base font-bold text-white">Join the Promotion Ecosystem</h3>
              <p className="text-xs text-[#A9A3B8] leading-relaxed">
                Connect your account to access our decentralized platform. New users receive a 100 vVIRAL starter reward!
              </p>
            </div>

            {/* Tab Selection */}
            <div className="flex rounded-lg bg-[#05020D] p-1 border border-[#A9A3B8]/10">
              <button
                type="button"
                onClick={() => { setLoginMethod('telegram'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  loginMethod === 'telegram' 
                    ? 'bg-[#8A2BFF] text-white' 
                    : 'text-[#A9A3B8] hover:text-white'
                }`}
              >
                Telegram Mini App
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('google'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  loginMethod === 'google' 
                    ? 'bg-[#8A2BFF] text-white' 
                    : 'text-[#A9A3B8] hover:text-white'
                }`}
              >
                Google Portal
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-left">
              {loginMethod === 'telegram' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-[#A9A3B8] uppercase mb-1">Telegram username</label>
                    <input
                      id="app-login-username"
                      type="text"
                      placeholder="e.g. TON_Sniper"
                      value={mockUsername}
                      onChange={(e) => setMockUsername(e.target.value)}
                      required
                      className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-3 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#A9A3B8] uppercase mb-1">Telegram Numeric ID</label>
                    <input
                      id="app-login-tgid"
                      type="text"
                      placeholder="e.g. 11223344"
                      value={mockTgId}
                      onChange={(e) => setMockTgId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-3 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-[#A9A3B8] uppercase mb-1">Google Email Address</label>
                    <input
                      id="app-login-email"
                      type="email"
                      placeholder="e.g. user@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-3 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#A9A3B8] uppercase mb-1">Google Account ID (sub)</label>
                    <input
                      id="app-login-googlesub"
                      type="text"
                      placeholder="e.g. google_sub_12345"
                      value={googleSubId}
                      onChange={(e) => setGoogleSubId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-3 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {authError && <div className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2.5 rounded-lg">{authError}</div>}

              <button
                id="app-btn-login"
                type="submit"
                className="w-full rounded-xl bg-[#8A2BFF] hover:bg-[#B066FF] text-xs font-semibold py-3.5 text-white cursor-pointer"
              >
                Authenticate Ecosystem Account
              </button>
            </form>
          </div>
        )}
      </main>

      {/* 3. Navigation Bar (Responsive, Fixed bottom for perfect Telegram layout) */}
      {currentUser && currentBalance && (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-[#A9A3B8]/10 bg-[#0B0618]/95 backdrop-blur-lg px-2 py-1.5 z-40">
          <div className="max-w-xl mx-auto flex justify-between items-center w-full">
            
            <button
              id="app-tab-home"
              onClick={() => { setActiveTab('home'); setSelectedCampaignFromDiscover(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                activeTab === 'home' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Award className="h-4 w-4" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider scale-90">Home</span>
            </button>

            <button
              id="app-tab-discover"
              onClick={() => { setActiveTab('discover'); setSelectedCampaignFromDiscover(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                activeTab === 'discover' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider scale-90">Discover</span>
            </button>

            <button
              id="app-tab-earn"
              onClick={() => { setActiveTab('earn'); setSelectedCampaignFromDiscover(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                activeTab === 'earn' ? 'text-[#FFD36A]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Coins className="h-4 w-4 animate-pulse text-[#FFD36A]" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider scale-90 text-[#FFD36A]">Earn</span>
            </button>

            <button
              id="app-tab-wallet"
              onClick={() => { setActiveTab('wallet'); setSelectedCampaignFromDiscover(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                activeTab === 'wallet' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <WalletIcon className="h-4 w-4" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider scale-90">Wallet</span>
            </button>

            <button
              id="app-tab-referrals"
              onClick={() => { setActiveTab('referrals'); setSelectedCampaignFromDiscover(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                activeTab === 'referrals' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider scale-90">Network</span>
            </button>

            <button
              id="app-tab-more"
              onClick={() => { setActiveTab('more'); setSelectedCampaignFromDiscover(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                activeTab === 'more' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Info className="h-4 w-4" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider scale-90">More</span>
            </button>

            {(currentUser.role === 'admin' || currentUser.is_admin === true || (currentUser.telegram_id && ['8618331744', '6228196481', '5314622858'].includes(currentUser.telegram_id.toString()))) && (
              <button
                id="app-tab-admin"
                onClick={() => { setActiveTab('admin'); setSelectedCampaignFromDiscover(null); }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
                  activeTab === 'admin' ? 'text-[#FFD36A]' : 'text-[#A9A3B8] hover:text-[#FFD36A]'
                }`}
              >
                <Settings className="h-4 w-4 text-[#FFD36A]" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider scale-90">Admin</span>
              </button>
            )}

          </div>
        </nav>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
