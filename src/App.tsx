import React, { useState, useEffect } from 'react';
import { 
  Rocket, Compass, PlusCircle, Coins, Users, 
  Settings, Award, Sparkles, LogIn, UserCircle, 
  MessageSquare, ShieldCheck, Database, Info
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
import { ToastProvider, useToast } from './components/Toast';

function MainApp() {
  const { showToast } = useToast();
  // Pre-loaded switchable users for preview and simulation
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentBalance, setCurrentBalance] = useState<Balance | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedCampaignFromDiscover, setSelectedCampaignFromDiscover] = useState<any | null>(null);
  
  // Custom Telegram login simulation form
  const [mockTgId, setMockTgId] = useState('11223344');
  const [mockUsername, setMockUsername] = useState('TON_Sniper');
  const [mockEmail, setMockEmail] = useState('');
  const [authError, setAuthError] = useState('');

  // Initial fetch for the default earner user session to make it work out of the box
  useEffect(() => {
    handleLoginSimulation('11223344', 'TON_Sniper', undefined, true);
  }, []);

  const handleLoginSimulation = (tgId: string, username: string, email?: string, isSilent = false) => {
    setAuthError('');
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: tgId,
        username,
        email
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setAuthError(data.error);
          showToast(data.error, 'error', 'Simulation Error');
        } else {
          setCurrentUser(data.user);
          setCurrentBalance(data.balance);
          setActiveTab('home');
          if (!isSilent) {
            showToast(`Switched simulation session to @${username}`, 'success', 'Session Synced');
          }
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

          {/* Simulated Account Selector (Allows full mutual-testing flow!) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-mono text-[#A9A3B8] uppercase tracking-wider">Switch Persona:</span>
            
            <button
              id="app-switch-earner"
              onClick={() => handleLoginSimulation('11223344', 'TON_Sniper')}
              className={`rounded px-2 py-1 text-[9px] font-bold border transition-all cursor-pointer ${
                currentUser?.username === 'TON_Sniper' 
                  ? 'bg-[#8A2BFF]/20 border-[#8A2BFF] text-[#B066FF]' 
                  : 'bg-[#05020D]/60 border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white'
              }`}
            >
              TON Sniper (Earner)
            </button>

            <button
              id="app-switch-promoter"
              onClick={() => handleLoginSimulation('87654321', 'Web3Builder')}
              className={`rounded px-2 py-1 text-[9px] font-bold border transition-all cursor-pointer ${
                currentUser?.username === 'Web3Builder' 
                  ? 'bg-[#8A2BFF]/20 border-[#8A2BFF] text-[#B066FF]' 
                  : 'bg-[#05020D]/60 border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white'
              }`}
            >
              Web3 Builder (Promoter)
            </button>

            <button
              id="app-switch-admin"
              onClick={() => handleLoginSimulation('12345678', 'viral_creator', 'beskerboris@gmail.com')}
              className={`rounded px-2 py-1 text-[9px] font-bold border transition-all cursor-pointer ${
                currentUser?.role === 'admin' 
                  ? 'bg-[#FFD36A]/20 border-[#FFD36A] text-[#FFD36A]' 
                  : 'bg-[#05020D]/60 border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white'
              }`}
            >
              Creator Admin (Owner)
            </button>
          </div>
        </div>
      </header>

      {/* Account Info Bar (if logged in) */}
      {currentUser && currentBalance && (
        <div className="bg-[#05020D] border-b border-[#A9A3B8]/5 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs text-[#A9A3B8] gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <UserCircle className="h-4 w-4 text-[#B066FF]" />
              <span className="text-white font-bold truncate">@{currentUser.username}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8A2BFF]/10 text-[#B066FF] font-mono border border-[#8A2BFF]/20">
                {currentUser.quality_score}
              </span>
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
                onSelectCampaign={handleSelectCampaignFromDiscover} 
              />
            )}

            {activeTab === 'promote' && (
              <Promote 
                user={currentUser} 
                balance={currentBalance} 
                onCampaignCreated={reloadUserAndBalance} 
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
              />
            )}

            {activeTab === 'admin' && currentUser.role === 'admin' && (
              <Admin 
                onBondingToggled={reloadUserAndBalance} 
              />
            )}
          </div>
        ) : (
          /* Setup profile fallback screen */
          <div className="max-w-md mx-auto my-12 rounded-2xl border border-[#A9A3B8]/10 bg-[#0B0618] p-6 space-y-5 text-center">
            <div className="h-12 w-12 rounded-full bg-[#FF4D6D]/10 flex items-center justify-center text-[#FF4D6D] mx-auto">
              <LogIn className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-sans text-base font-bold text-white">Join the Promotion Ecosystem</h3>
              <p className="text-xs text-[#A9A3B8] leading-relaxed">
                Connect your simulated Telegram profile below to receive your 100 vVIRAL starter reward!
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLoginSimulation(mockTgId, mockUsername, mockEmail); }} className="space-y-3.5 text-left">
              <div>
                <label className="block text-[10px] font-mono text-[#A9A3B8] uppercase mb-1">Telegram username</label>
                <input
                  id="app-login-username"
                  type="text"
                  placeholder="e.g. TON_Sniper"
                  value={mockUsername}
                  onChange={(e) => setMockUsername(e.target.value)}
                  className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-3 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#A9A3B8] uppercase mb-1">Telegram ID</label>
                <input
                  id="app-login-tgid"
                  type="text"
                  placeholder="e.g. 11223344"
                  value={mockTgId}
                  onChange={(e) => setMockTgId(e.target.value)}
                  className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] p-3 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                />
              </div>

              {authError && <div className="text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2.5 rounded-lg">{authError}</div>}

              <button
                id="app-btn-login"
                type="submit"
                className="w-full rounded-xl bg-[#8A2BFF] hover:bg-[#B066FF] text-xs font-semibold py-3.5 text-white cursor-pointer"
              >
                Launch Ecosystem App
              </button>
            </form>
          </div>
        )}
      </main>

      {/* 3. Navigation Bar (Responsive, Fixed bottom for perfect Telegram layout) */}
      {currentUser && currentBalance && (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-[#A9A3B8]/10 bg-[#0B0618]/90 backdrop-blur-md px-3 py-1.5 z-40">
          <div className="max-w-xl mx-auto flex justify-between items-center gap-1">
            
            <button
              id="app-tab-home"
              onClick={() => { setActiveTab('home'); setSelectedCampaignFromDiscover(null); }}
              className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                activeTab === 'home' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Award className="h-4 w-4" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90">Home</span>
            </button>

            <button
              id="app-tab-discover"
              onClick={() => { setActiveTab('discover'); setSelectedCampaignFromDiscover(null); }}
              className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                activeTab === 'discover' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90">Discover</span>
            </button>

            <button
              id="app-tab-promote"
              onClick={() => { setActiveTab('promote'); setSelectedCampaignFromDiscover(null); }}
              className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                activeTab === 'promote' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90">Promote</span>
            </button>

            <button
              id="app-tab-earn"
              onClick={() => { setActiveTab('earn'); setSelectedCampaignFromDiscover(null); }}
              className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                activeTab === 'earn' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Coins className="h-4 w-4 animate-pulse text-[#FFD36A]" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90 text-[#FFD36A]">Earn</span>
            </button>

            <button
              id="app-tab-wallet"
              onClick={() => { setActiveTab('wallet'); setSelectedCampaignFromDiscover(null); }}
              className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                activeTab === 'wallet' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Coins className="h-4 w-4" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90">Wallet</span>
            </button>

            <button
              id="app-tab-referrals"
              onClick={() => { setActiveTab('referrals'); setSelectedCampaignFromDiscover(null); }}
              className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                activeTab === 'referrals' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90">Network</span>
            </button>

            <button
              id="app-tab-more"
              onClick={() => { setActiveTab('more'); setSelectedCampaignFromDiscover(null); }}
              className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                activeTab === 'more' ? 'text-[#B066FF]' : 'text-[#A9A3B8] hover:text-white'
              }`}
            >
              <Info className="h-4 w-4" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90">More</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                id="app-tab-admin"
                onClick={() => { setActiveTab('admin'); setSelectedCampaignFromDiscover(null); }}
                className={`flex flex-col items-center gap-1 p-0.5 transition-colors cursor-pointer ${
                  activeTab === 'admin' ? 'text-[#FFD36A]' : 'text-[#A9A3B8] hover:text-[#FFD36A]'
                }`}
              >
                <Settings className="h-4 w-4 text-[#FFD36A]" />
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider scale-90">Admin</span>
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
