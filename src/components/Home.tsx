import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rocket, Coins, Users, ShieldAlert, Award, ArrowUpRight, Calendar, Check, AlertCircle } from 'lucide-react';
import { User, Balance } from '../types';

interface HomeProps {
  user: User;
  balance: Balance;
  setActiveTab: (tab: string) => void;
  onCheckInCompleted: () => void;
}

export default function Home({ user, balance, setActiveTab, onCheckInCompleted }: HomeProps) {
  const [checkinStatus, setCheckinStatus] = useState<{
    canCheckIn: boolean;
    streak: number;
    nextReward: number;
    lastCheckIn: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCheckinStatus = () => {
    setLoading(true);
    fetch(`/api/checkin/status/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setCheckinStatus(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching checkin status:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCheckinStatus();
  }, [user.id]);

  const handleCheckIn = () => {
    if (!checkinStatus?.canCheckIn) return;
    setClaiming(true);
    setMessage(null);

    fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
      .then((res) => res.json())
      .then((data) => {
        setClaiming(false);
        if (data.error) {
          setMessage({ type: 'error', text: data.error });
        } else {
          setMessage({
            type: 'success',
            text: `Claimed +${data.reward} vVIRAL Daily Check-in bonus! Streak: ${data.streak} ${data.streak === 1 ? 'day' : 'days'}.`
          });
          onCheckInCompleted(); // reload App state
          setCheckinStatus({
            canCheckIn: false,
            streak: data.streak,
            nextReward: data.reward,
            lastCheckIn: new Date().toISOString()
          });
          setTimeout(fetchCheckinStatus, 2000);
        }
      })
      .catch((err) => {
        console.error('Check-in error:', err);
        setClaiming(false);
        setMessage({ type: 'error', text: 'Ecosystem server offline. Please try again.' });
      });
  };

  const daysArray = [1, 2, 3, 4, 5, 6, 7];

  const getRewardForDay = (d: number) => {
    if (d === 1) return 10;
    if (d === 2) return 15;
    if (d === 3) return 20;
    if (d === 4) return 25;
    if (d === 5) return 30;
    if (d === 6) return 40;
    return 50;
  };

  // Determine visual active day
  const activeDay = checkinStatus 
    ? (checkinStatus.canCheckIn ? checkinStatus.streak + 1 : checkinStatus.streak) 
    : 1;

  const getDayStatus = (dayNum: number) => {
    if (!checkinStatus) return 'locked';
    if (checkinStatus.canCheckIn) {
      if (dayNum < activeDay) return 'completed';
      if (dayNum === activeDay) return 'active';
      return 'locked';
    } else {
      if (dayNum <= activeDay) return 'completed';
      if (dayNum === activeDay + 1) return 'next';
      return 'locked';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border border-[#8A2BFF]/40 glass p-5 md:p-6 shadow-2xl shadow-[#8A2BFF]/5">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#8A2BFF]/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#FFD36A]/10 blur-3xl"></div>
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8A2BFF]/15 px-2.5 py-0.5 text-[10px] font-medium text-[#B066FF] border border-[#8A2BFF]/30 uppercase tracking-wider">
            <Award className="h-3 w-3 text-[#FFD36A]" />
            $VIRAL Ecosystem Active
          </div>
          <h1 className="font-sans text-2xl font-black tracking-tight text-white md:text-3xl leading-tight">
            Upgrade Your Reach with <span className="text-[#B066FF]">$VIRAL</span> Fuel
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-[#A9A3B8]">
            $VIRAL is a mutual promotion ecosystem where every user can promote their project, earn activity rewards and use $VIRAL as fuel for viral growth.
          </p>
          
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              id="home-btn-promote"
              onClick={() => setActiveTab('promote')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8A2BFF] to-[#B066FF] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#8A2BFF]/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Rocket className="h-3.5 w-3.5" />
              Promote My Project
            </button>
            <button
              id="home-btn-earn"
              onClick={() => setActiveTab('earn')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#05020D]/60 border border-[#A9A3B8]/20 px-4 py-2 text-xs font-bold text-[#A9A3B8] hover:text-white hover:border-[#8A2BFF]/50 transition-all cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5 text-[#FFD36A]" />
              Earn vVIRAL
            </button>
          </div>
        </div>
      </div>

      {/* Daily Check-in Feature Block */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#B066FF]/5 blur-2xl"></div>
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-0.5">
            <h2 className="font-sans text-xs font-bold text-[#B066FF] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Daily Check-in Streak
            </h2>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              Log in daily to claim free <strong>vVIRAL</strong>. Keeping your streak active boosts your rewards!
            </p>
          </div>
          {checkinStatus && (
            <div className="shrink-0 text-right">
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#A9A3B8]">Streak</div>
              <div className="text-sm font-extrabold text-white font-mono flex items-center gap-1">
                <span className="text-[#FFD36A]">★</span> {checkinStatus.streak} {checkinStatus.streak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Streak Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {daysArray.map((day) => {
            const status = getDayStatus(day);
            const reward = getRewardForDay(day);
            
            let bgStyle = "bg-[#0B0618]/40 border-[#A9A3B8]/10 text-[#A9A3B8]/50";
            let labelStyle = "text-[#A9A3B8]/60";
            let valueStyle = "text-[#A9A3B8]/40";
            let pulseBorder = false;

            if (status === 'completed') {
              bgStyle = "bg-[#38F8B0]/10 border-[#38F8B0]/30 text-[#38F8B0]";
              labelStyle = "text-[#38F8B0]/80 font-bold";
              valueStyle = "text-[#38F8B0] font-bold font-mono";
            } else if (status === 'active') {
              bgStyle = "bg-[#8A2BFF]/20 border-[#8A2BFF] text-white shadow-md shadow-[#8A2BFF]/10";
              labelStyle = "text-[#B066FF] font-bold";
              valueStyle = "text-[#FFD36A] font-extrabold font-mono";
              pulseBorder = true;
            } else if (status === 'next') {
              bgStyle = "bg-[#0B0618]/60 border-dashed border-[#8A2BFF]/35 text-white/80";
              labelStyle = "text-[#A9A3B8] font-bold";
              valueStyle = "text-[#B066FF] font-bold font-mono";
            }

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: day * 0.04 }}
                className={`relative rounded p-2 border flex flex-col justify-between items-center min-h-[64px] transition-all duration-300 ${bgStyle} ${pulseBorder ? 'ring-1 ring-[#8A2BFF]/50 ring-offset-1 ring-offset-[#05020D]' : ''}`}
              >
                <div className="text-[9px] uppercase tracking-tight">
                  {status === 'completed' ? (
                    <Check className="h-3 w-3 mx-auto" />
                  ) : (
                    `D${day}`
                  )}
                </div>
                
                <div className="text-[10px] flex flex-col items-center">
                  <span className={`text-[9px] ${labelStyle}`}>Day {day}</span>
                  <span className={`text-[10px] ${valueStyle}`}>+{reward}</span>
                </div>
                
                {status === 'active' && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD36A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD36A]"></span>
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`p-2 rounded text-xs flex gap-1.5 items-center font-sans ${message.type === 'success' ? 'bg-[#38F8B0]/10 border border-[#38F8B0]/20 text-[#38F8B0]' : 'bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D]'}`}>
            {message.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Action Button */}
        {loading ? (
          <div className="text-center py-2 text-xs text-[#A9A3B8] font-mono">Synchronizing ledger records...</div>
        ) : (
          <button
            id="home-btn-checkin"
            onClick={handleCheckIn}
            disabled={claiming || !checkinStatus?.canCheckIn}
            className={`w-full py-2 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              checkinStatus?.canCheckIn 
                ? "bg-[#8A2BFF] hover:bg-[#B066FF] text-white active:scale-[0.99] shadow-lg shadow-[#8A2BFF]/20" 
                : "bg-[#0B0618]/60 border border-[#A9A3B8]/10 text-[#A9A3B8]/40 cursor-not-allowed"
            }`}
          >
            {claiming ? (
              <span>Verifying and claiming reward...</span>
            ) : checkinStatus?.canCheckIn ? (
              <>
                <Calendar className="h-3.5 w-3.5" />
                <span>Claim Day {activeDay} Check-in reward (+{checkinStatus.nextReward} vVIRAL)</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-[#38F8B0]" />
                <span>Checked In Today! Return tomorrow for Day {activeDay < 7 ? activeDay + 1 : 1}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="glass rounded-xl p-3.5 border border-[#8A2BFF]/20 hover:border-[#8A2BFF]/40 transition-all relative overflow-hidden group">
          <div className="stat-label">vVIRAL Balance</div>
          <div className="mt-1 flex items-baseline gap-1 text-lg font-extrabold text-white">
            <span className="gold-text font-mono">{balance?.vviral_balance?.toLocaleString() || 0}</span>
            <span className="text-[9px] text-[#A9A3B8]">vVIRAL</span>
          </div>
        </div>
        <div className="glass rounded-xl p-3.5 border border-[#8A2BFF]/20 hover:border-[#8A2BFF]/40 transition-all relative overflow-hidden group">
          <div className="stat-label">Viral Power</div>
          <div className="mt-1 flex items-baseline gap-1 text-lg font-extrabold text-white">
            <span className="text-[#B066FF] font-mono">{balance?.viral_power || 0}</span>
            <span className="text-[9px] text-[#A9A3B8]">VP</span>
          </div>
        </div>
        <div className="col-span-2 glass rounded-xl p-3.5 border border-[#8A2BFF]/20 hover:border-[#8A2BFF]/40 transition-all sm:col-span-1 relative overflow-hidden group">
          <div className="stat-label">Trust Level</div>
          <div className="mt-1 flex items-baseline gap-1.5 text-lg font-extrabold text-[#38F8B0]">
            <span>{user?.quality_score || 'New User'}</span>
          </div>
        </div>
      </div>

      {/* Main Pillars Description */}
      <div className="space-y-3 pt-1">
        <h2 className="font-sans text-sm font-bold text-white uppercase tracking-wider">How Ecosystem Mutual Loop Works</h2>
        
        <div className="grid gap-3 md:grid-cols-3">
          <div className="glass rounded-xl p-4 border border-[#A9A3B8]/10 hover:border-[#8A2BFF]/30 transition-all space-y-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#8A2BFF]/15 flex items-center justify-center text-[#B066FF]">
              <Rocket className="h-4 w-4" />
            </div>
            <h3 className="font-sans text-xs font-bold text-white">1. Fund Campaign</h3>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              Deposit vVIRAL tokens to lock advertising budget in secure escrow. 10% platform fee supports liquidity and rewards pool.
            </p>
          </div>

          <div className="glass rounded-xl p-4 border border-[#A9A3B8]/10 hover:border-[#8A2BFF]/30 transition-all space-y-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#FFD36A]/15 flex items-center justify-center text-[#FFD36A]">
              <Coins className="h-4 w-4" />
            </div>
            <h3 className="font-sans text-xs font-bold text-white">2. Complete Actions</h3>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              Real community users complete verified actions on your bot, channel, app or website. Bots and fraud attempts are strictly filtered out.
            </p>
          </div>

          <div className="glass rounded-xl p-4 border border-[#A9A3B8]/10 hover:border-[#8A2BFF]/30 transition-all space-y-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#38F8B0]/15 flex items-center justify-center text-[#38F8B0]">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="font-sans text-xs font-bold text-white">3. Grow Together</h3>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              Users earn rewards, and referrers receive 10% of earnings. Re-invest earned tokens to promote your own projects!
            </p>
          </div>
        </div>
      </div>

      {/* Bonding Alert Section */}
      <div className="rounded-xl border border-[#FFD36A]/20 bg-[#FFD36A]/5 p-4 flex gap-3 items-start">
        <ShieldAlert className="h-4.5 w-4.5 text-[#FFD36A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white">BLUM Listing & Token Bonding Curve Status</h4>
          <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
            Until bonding is completed on BLUM, the platform operates on virtual <strong>vVIRAL</strong> balance. After bonding, you can connect your TON wallet and claim real <strong>$VIRAL</strong> on-chain tokens from the 200,000,000 $VIRAL Launch Reserve!
          </p>
          <button 
            id="home-btn-wallet"
            onClick={() => setActiveTab('wallet')}
            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#FFD36A] hover:underline cursor-pointer"
          >
            Check Wallet Claims <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
