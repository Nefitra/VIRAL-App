import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ExternalLink, ShieldCheck, Tag, Globe, 
  Sparkles, Award, BarChart3, Compass, Heart, Settings, 
  CheckCircle, RefreshCw, Star, Users, Coins, MapPin, 
  Languages, User, ArrowUpRight, TrendingUp, AlertCircle
} from 'lucide-react';
import { Resource, Campaign, User as AppUser, Balance } from '../types';
import Promote from './Promote';
import PublicProfileModal from './PublicProfileModal';
import { useToast } from './Toast';

interface DiscoverProps {
  user: AppUser;
  balance: Balance;
  onSelectCampaign: (campaign: any) => void;
  onCampaignCreated: () => void;
}

export default function Discover({ user, balance, onSelectCampaign, onCampaignCreated }: DiscoverProps) {
  const { showToast } = useToast();
  const [innerTab, setInnerTab] = useState<'explore' | 'recommend' | 'leaderboard' | 'analytics' | 'promote'>('explore');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extended Phase 4 States
  const [selectedCampaignProfile, setSelectedCampaignProfile] = useState<any | null>(null);
  
  // Smart Recommendation States
  const [recommendedCampaigns, setRecommendedCampaigns] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>(['miniapp', 'bot', 'defi']);
  const [userCountry, setUserCountry] = useState<string>('Germany');
  const [userLanguage, setUserLanguage] = useState<string>('English');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Leaderboard States
  const [leaderboards, setLeaderboards] = useState<any | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'members' | 'miniapps' | 'bots' | 'channels' | 'advertisers' | 'security' | 'earners'>('members');

  // Growth Analytics States
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch standard campaigns list
  const fetchCampaigns = () => {
    setLoading(true);
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        setCampaigns(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching campaigns:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Fetch recommended campaigns
  const fetchRecommendations = () => {
    setLoadingRecommended(true);
    fetch(`/api/campaigns/recommend?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setRecommendedCampaigns(data);
        setLoadingRecommended(false);
      })
      .catch(err => {
        console.error('Error fetching recommendations:', err);
        setLoadingRecommended(false);
      });
  };

  useEffect(() => {
    if (innerTab === 'recommend') {
      fetchRecommendations();
    }
  }, [innerTab]);

  // Save profile and trigger recommendations recalculation
  const handleSaveProfileExtended = () => {
    setUpdatingProfile(true);
    fetch('/api/users/update-profile-extended', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        interests: userInterests,
        country: userCountry,
        language: userLanguage
      })
    })
      .then(res => res.json())
      .then(data => {
        setUpdatingProfile(false);
        if (data.success) {
          showToast('Ecosystem profile preferences saved successfully!', 'success', 'Profile Saved');
          fetchRecommendations();
        } else {
          showToast(data.error || 'Failed to update preferences.', 'error');
        }
      })
      .catch(err => {
        setUpdatingProfile(false);
        console.error('Error updating profile:', err);
        showToast('Server connection failed.', 'error');
      });
  };

  // Toggle interest tags
  const handleToggleInterest = (tag: string) => {
    if (userInterests.includes(tag)) {
      setUserInterests(prev => prev.filter(t => t !== tag));
    } else {
      setUserInterests(prev => [...prev, tag]);
    }
  };

  // Fetch Leaderboard data
  useEffect(() => {
    if (innerTab === 'leaderboard') {
      setLoadingLeaderboard(true);
      fetch('/api/leaderboards')
        .then(res => res.json())
        .then(data => {
          setLeaderboards(data);
          setLoadingLeaderboard(false);
        })
        .catch(err => {
          console.error('Error fetching leaderboards:', err);
          setLoadingLeaderboard(false);
        });
    }
  }, [innerTab]);

  // Fetch Analytics data
  useEffect(() => {
    if (innerTab === 'analytics') {
      setLoadingAnalytics(true);
      fetch('/api/growth-analytics')
        .then(res => res.json())
        .then(data => {
          setAnalytics(data);
          setLoadingAnalytics(false);
        })
        .catch(err => {
          console.error('Error fetching analytics:', err);
          setLoadingAnalytics(false);
        });
    }
  }, [innerTab]);

  const categories = [
    { id: 'all', label: 'All Resources' },
    { id: 'miniapp', label: 'Mini Apps' },
    { id: 'bot', label: 'Telegram Bots' },
    { id: 'channel', label: 'Channels' },
    { id: 'website', label: 'Websites' }
  ];

  const filteredCampaigns = campaigns.filter(c => {
    if (!c.resource) return false;
    if (filterType !== 'all' && c.campaign_type !== filterType) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = c.resource.title.toLowerCase().includes(query);
      const descMatch = c.resource.description.toLowerCase().includes(query);
      const categoryMatch = c.resource.category.toLowerCase().includes(query);
      return titleMatch || descMatch || categoryMatch;
    }
    
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Internal Navigation Tabs (Extended Phase 4) */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-[#05020D]/60 border border-[#A9A3B8]/10 rounded-xl overflow-x-auto">
        <button
          onClick={() => setInnerTab('explore')}
          className={`flex-1 min-w-[100px] py-2 text-xs font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
            innerTab === 'explore'
              ? 'bg-[#8A2BFF] text-white shadow-md shadow-[#8A2BFF]/20'
              : 'text-[#A9A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setInnerTab('recommend')}
          className={`flex-1 min-w-[100px] py-2 text-xs font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 ${
            innerTab === 'recommend'
              ? 'bg-[#8A2BFF] text-white shadow-md shadow-[#8A2BFF]/20'
              : 'text-[#A9A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          Smart Match
        </button>
        <button
          onClick={() => setInnerTab('leaderboard')}
          className={`flex-1 min-w-[100px] py-2 text-xs font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 ${
            innerTab === 'leaderboard'
              ? 'bg-[#8A2BFF] text-white shadow-md shadow-[#8A2BFF]/20'
              : 'text-[#A9A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          Ranks
        </button>
        <button
          onClick={() => setInnerTab('analytics')}
          className={`flex-1 min-w-[100px] py-2 text-xs font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 ${
            innerTab === 'analytics'
              ? 'bg-[#8A2BFF] text-white shadow-md shadow-[#8A2BFF]/20'
              : 'text-[#A9A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Growth Stats
        </button>
        <button
          onClick={() => setInnerTab('promote')}
          className={`flex-1 min-w-[100px] py-2 text-xs font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
            innerTab === 'promote'
              ? 'bg-[#8A2BFF] text-white shadow-md shadow-[#8A2BFF]/20'
              : 'text-[#A9A3B8] hover:text-white hover:bg-white/5'
          }`}
        >
          Promote
        </button>
      </div>

      {/* RENDER CHOSEN TAB */}
      
      {/* 1. PROMOTE TAB */}
      {innerTab === 'promote' && (
        <Promote 
          user={user} 
          balance={balance} 
          onCampaignCreated={() => {
            onCampaignCreated();
            fetchCampaigns();
          }} 
        />
      )}

      {/* 2. EXPLORE CAMPAIGNS TAB */}
      {innerTab === 'explore' && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute top-3 left-3 h-3.5 w-3.5 text-[#A9A3B8]" />
              <input
                id="discover-search"
                type="text"
                placeholder="Search Web3 projects, channels, tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#0B0618] py-2.5 pr-3 text-xs text-white placeholder-[#A9A3B8]/50 focus:border-[#8A2BFF] focus:outline-none focus:ring-1 focus:ring-[#8A2BFF] pl-9 font-sans"
              />
            </div>
            
            <div className="flex flex-wrap gap-1 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterType(cat.id)}
                  className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                    filterType === cat.id
                      ? 'bg-[#8A2BFF] text-white border border-[#8A2BFF]'
                      : 'bg-[#05020D]/60 text-[#A9A3B8] border border-[#A9A3B8]/10 hover:text-white hover:border-[#8A2BFF]/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Listings */}
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#FFD36A]" />
              Active Advertisers Campaigns
            </h2>
            <span className="text-[10px] text-[#A9A3B8] font-mono uppercase tracking-wider">
              {filteredCampaigns.length} active
            </span>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-[#A9A3B8] font-mono">
              Fetching Sentinel Campaign Records...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#A9A3B8]/15 bg-[#0B0618]/30 py-10 text-center space-y-1.5">
              <Globe className="mx-auto h-7 w-7 text-[#A9A3B8]/30" />
              <p className="text-xs text-[#A9A3B8]">No campaigns active matching preferences.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredCampaigns.map((camp) => (
                <div 
                  key={camp.id}
                  onClick={() => setSelectedCampaignProfile(camp)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#8A2BFF]/20 glass p-4 hover:border-[#8A2BFF]/50 hover:shadow-lg hover:shadow-[#8A2BFF]/10 transition-all cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <img
                        referrerPolicy="no-referrer"
                        src={camp.resource?.image_url}
                        alt={camp.resource?.title}
                        className="h-10 w-10 rounded-lg object-cover bg-neutral-800 border border-[#A9A3B8]/10"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-sans text-xs font-black text-white truncate group-hover:text-[#B066FF] transition-colors uppercase tracking-tight">
                          {camp.resource?.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-[#8A2BFF]/10 border border-[#8A2BFF]/20 px-1 py-0.5 text-[8px] font-mono font-medium text-[#B066FF] uppercase">
                            {camp.campaign_type}
                          </span>
                          <span className="text-[9px] text-[#A9A3B8] truncate uppercase font-mono">
                            • {camp.resource?.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#A9A3B8] leading-relaxed line-clamp-2">
                      {camp.resource?.description}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-[#A9A3B8]/5 pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-[8px] font-mono text-[#A9A3B8] tracking-wider">REWARD / TASK</div>
                      <div className="flex items-baseline gap-0.5 text-xs font-black text-[#FFD36A]">
                        <span>+{camp.reward_per_action}</span>
                        <span className="text-[8px] font-normal text-[#A9A3B8]">vVIRAL</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-mono text-[#A9A3B8] tracking-wider">CAPACITY</div>
                      <div className="text-xs font-bold text-white font-mono">
                        {camp.approved_actions} <span className="text-[#A9A3B8]">/ {camp.max_actions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-0.5 text-[8px] font-medium text-[#38F8B0] bg-[#38F8B0]/5 border border-[#38F8B0]/15 rounded-full px-1.5 py-0.5 uppercase font-mono">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Escrow
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 3. SMART USER MATCHING TAB (Phase 4 - Item 2) */}
      {innerTab === 'recommend' && (
        <div className="space-y-4">
          
          {/* Custom Interest Selection Header Form */}
          <div className="rounded-xl border border-[#8A2BFF]/25 bg-[#0B0618]/90 p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-[#FF9F43]" /> Configure Your Web3 Profile Interests
              </h3>
              <p className="text-[10px] text-[#A9A3B8] mt-1 leading-relaxed">
                Save your categories, local region, and primary language below. 
                Our AI Recommendation Engine dynamically scans resources matching your profile for optimal reward efficiency.
              </p>
            </div>

            {/* Interest Tags */}
            <div className="space-y-1.5">
              <label className="block text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase">Web3 Categories</label>
              <div className="flex flex-wrap gap-1.5">
                {['miniapp', 'bot', 'defi', 'games', 'nft', 'crypto', 'channel', 'website', 'trading'].map((tag) => {
                  const selected = userInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleInterest(tag)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold font-mono uppercase transition-all cursor-pointer border ${
                        selected 
                          ? 'bg-[#8A2BFF]/20 text-[#B066FF] border-[#8A2BFF]/40' 
                          : 'bg-[#05020D] text-[#A9A3B8] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Geography / Language */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Geographical Node
                </label>
                <select
                  value={userCountry}
                  onChange={(e) => setUserCountry(e.target.value)}
                  className="w-full rounded bg-[#05020D]/80 border border-white/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                >
                  <option value="Germany">Germany / EU</option>
                  <option value="Ukraine">Ukraine / CIS</option>
                  <option value="United States">United States</option>
                  <option value="Singapore">Singapore / Asia</option>
                  <option value="Nigeria">Nigeria / Africa</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1 flex items-center gap-1">
                  <Languages className="h-3 w-3" /> Primary Language
                </label>
                <select
                  value={userLanguage}
                  onChange={(e) => setUserLanguage(e.target.value)}
                  className="w-full rounded bg-[#05020D]/80 border border-white/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="German">German</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Russian">Russian</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveProfileExtended}
                disabled={updatingProfile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8A2BFF] hover:bg-[#9E4DFF] px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {updatingProfile ? 'Optimizing Profile...' : 'Save & Refresh Matches'}
              </button>
            </div>
          </div>

          {/* Matches Output List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#FFD36A]" /> Personalized AI Matched Projects
            </h3>

            {loadingRecommended ? (
              <div className="text-xs text-[#A9A3B8] font-mono py-10 text-center">AI algorithms matching resources...</div>
            ) : recommendedCampaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#A9A3B8]/15 bg-[#0B0618]/30 py-10 text-center text-xs text-[#A9A3B8]">
                No perfect interest matches found today. Try broadening your categories profile preferences!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recommendedCampaigns.map((camp) => (
                  <div 
                    key={camp.id}
                    onClick={() => setSelectedCampaignProfile(camp)}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#FF9F43]/30 bg-gradient-to-br from-[#FF9F43]/5 to-[#070312] p-4 hover:border-[#FF9F43]/60 transition-all cursor-pointer shadow-lg hover:shadow-[#FF9F43]/5"
                  >
                    <div className="space-y-3">
                      <div className="flex gap-3 items-start">
                        <img
                          referrerPolicy="no-referrer"
                          src={camp.resource?.image_url}
                          alt={camp.resource?.title}
                          className="h-10 w-10 rounded-lg object-cover bg-neutral-800 border border-[#A9A3B8]/10"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-sans text-xs font-black text-white truncate group-hover:text-[#FF9F43] transition-colors uppercase tracking-tight">
                            {camp.resource?.title}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded bg-[#FF9F43]/10 border border-[#FF9F43]/20 px-1 py-0.5 text-[8px] font-mono font-medium text-[#FF9F43] uppercase">
                              {camp.campaign_type}
                            </span>
                            <span className="text-[9px] text-[#A9A3B8] truncate uppercase font-mono">
                              • {camp.resource?.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#A9A3B8] leading-relaxed line-clamp-2">
                        {camp.resource?.description}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between">
                      <div>
                        <div className="text-[8px] font-mono text-[#A9A3B8] tracking-wider">AI RECOMMENDATION</div>
                        <div className="text-xs font-black text-[#38F8B0]">
                          {camp.match_score || 95}% MATCH
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-mono text-[#A9A3B8] tracking-wider">REWARD AMOUNT</div>
                        <div className="text-xs font-bold text-[#FFD36A] font-mono">
                          +{camp.reward_per_action} <span className="text-[#A9A3B8] text-[8px]">vVIRAL</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-0.5 text-[8px] font-bold text-[#FF9F43] bg-[#FF9F43]/10 border border-[#FF9F43]/30 rounded-full px-1.5 py-0.5 uppercase font-mono">
                      High Interest Compatibility
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ECOSYSTEM RANKINGS TAB (Phase 4 - Item 7) */}
      {innerTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/70 p-4 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#FFD36A]" /> Ecosystem Rankings & Leaderboards
            </h3>
            <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
              Real-time directory compiling project traction and active contributor records across categories. 
              Top users build reputational weight directly impacting daily verification payout parameters.
            </p>
          </div>

          {/* Sub-tabs for specific leaderboard types */}
          <div className="flex flex-wrap gap-1 bg-[#05020D]/60 border border-white/5 p-1 rounded-lg">
            {[
              { id: 'members', label: '👥 Contributors' },
              { id: 'earners', label: '💰 Earners' },
              { id: 'miniapps', label: '🚀 Mini Apps' },
              { id: 'bots', label: '🤖 Bots' },
              { id: 'channels', label: '📢 Channels' },
              { id: 'advertisers', label: '💼 Advertisers' },
              { id: 'security', label: '🛡️ Safety Guard' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLeaderboardTab(tab.id as any)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold font-mono uppercase transition-all cursor-pointer ${
                  activeLeaderboardTab === tab.id
                    ? 'bg-[#8A2BFF] text-white'
                    : 'text-[#A9A3B8] hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Leaderboard output */}
          {loadingLeaderboard ? (
            <div className="text-xs text-[#A9A3B8] font-mono py-10 text-center">Compiling dynamic rankings...</div>
          ) : leaderboards ? (
            <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#070312]/80 divide-y divide-[#A9A3B8]/5 overflow-hidden">
              {(() => {
                let currentList: any[] = [];
                if (activeLeaderboardTab === 'members') currentList = leaderboards.top_members || [];
                else if (activeLeaderboardTab === 'earners') currentList = leaderboards.top_earners || [];
                else if (activeLeaderboardTab === 'miniapps') currentList = leaderboards.top_miniapps || [];
                else if (activeLeaderboardTab === 'bots') currentList = leaderboards.top_bots || [];
                else if (activeLeaderboardTab === 'channels') currentList = leaderboards.top_channels || [];
                else if (activeLeaderboardTab === 'advertisers') currentList = leaderboards.top_advertisers || [];
                else if (activeLeaderboardTab === 'security') currentList = leaderboards.top_security || [];

                if (currentList.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-[#A9A3B8] font-mono">
                      Ranking table currently building. Participate to log!
                    </div>
                  );
                }

                return currentList.map((item: any, idx: number) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const rankColorClass = rank === 1 
                    ? 'text-[#FFD36A] border-[#FFD36A]/20 bg-[#FFD36A]/5' 
                    : rank === 2 
                      ? 'text-[#A9A3B8] border-neutral-700 bg-neutral-800/10' 
                      : rank === 3 
                        ? 'text-[#CD7F32] border-[#CD7F32]/20 bg-[#CD7F32]/5' 
                        : 'text-[#A9A3B8]';

                  return (
                    <div key={item.id || idx} className="flex items-center justify-between p-3 px-4 hover:bg-white/5 transition-all text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <div className={`h-6 w-6 rounded-md border flex items-center justify-center font-bold font-mono ${rankColorClass}`}>
                          {rank}
                        </div>
                        <span className="font-bold text-white uppercase text-xs truncate max-w-[180px]">
                          {item.username ? `@${item.username}` : (item.title || 'Unknown Entity')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <span className="text-[10px] text-[#A9A3B8] font-semibold">{item.metric}</span>
                        <span className="rounded bg-[#8A2BFF]/10 text-[#B066FF] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                          Rating {item.score}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-xs text-[#FF4D6D] font-mono">Failed to fetch leaderboard matrix.</div>
          )}
        </div>
      )}

      {/* 5. GROWTH ANALYTICS DASHBOARD (Phase 4 - Item 6) */}
      {innerTab === 'analytics' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/70 p-4 space-y-1.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-[#38F8B0]" /> Growth Analytics Dashboard
            </h3>
            <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
              Centralized network dashboard tracking global user acquisition velocity, locked advertising reserves, and success conversion rates.
            </p>
          </div>

          {loadingAnalytics ? (
            <div className="text-xs text-[#A9A3B8] font-mono py-10 text-center animate-pulse">Computing dynamic network indicators...</div>
          ) : analytics ? (
            <div className="space-y-4">
              
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                
                <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/60 p-3 space-y-1">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">NETWORK LOCKED VOL</span>
                  <div className="text-base font-black text-[#FFD36A] font-mono">
                    {analytics.escrow_volume.toLocaleString()} <span className="text-[9px] font-normal text-[#A9A3B8]">vVIRAL</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/60 p-3 space-y-1">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">CAMPAIGN SUCCESS RATE</span>
                  <div className="text-base font-black text-[#38F8B0] font-mono">
                    {analytics.campaign_success_rate}%
                  </div>
                </div>

                <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/60 p-3 space-y-1">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">NEW USER INDEX</span>
                  <div className="text-base font-black text-white font-mono">
                    {analytics.new_users} <span className="text-[9px] font-normal text-[#A9A3B8]">/ 30d</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/60 p-3 space-y-1">
                  <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">AVG EMISSION COST</span>
                  <div className="text-base font-black text-white font-mono">
                    {analytics.avg_cost_per_user} <span className="text-[9px] font-normal text-[#A9A3B8]">vVIRAL</span>
                  </div>
                </div>

              </div>

              {/* Geographic & Categories Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Hot Geographies & Languages */}
                <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/80 p-4 space-y-3.5">
                  <h4 className="text-[10px] font-mono text-white uppercase tracking-wider font-black flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-[#38F8B0]" /> High Conversion Territories
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#A9A3B8] uppercase font-mono">Top Countries today:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {analytics.top_countries.map((c: string, i: number) => (
                        <span key={i} className="rounded bg-white/5 px-2.5 py-1 text-[9px] text-[#E1DFE6] font-mono border border-white/5">
                          {i+1}. {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="text-[10px] text-[#A9A3B8] uppercase font-mono">Primary Interaction Languages:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {analytics.top_languages.map((l: string, i: number) => (
                        <span key={i} className="rounded bg-[#8A2BFF]/5 border border-[#8A2BFF]/15 px-2.5 py-1 text-[9px] text-[#B066FF] font-mono">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Categories Breakdown */}
                <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/80 p-4 space-y-3.5">
                  <h4 className="text-[10px] font-mono text-white uppercase tracking-wider font-black flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-[#FFD36A]" /> Active Ecosystem Verticals
                  </h4>

                  <div className="space-y-2">
                    <div className="text-[10px] text-[#A9A3B8] uppercase font-mono">Hottest Advertising Verticals:</div>
                    <div className="space-y-1.5">
                      {analytics.top_categories.map((c: string, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] font-mono">
                          <span className="text-white">{idx+1}. {c}</span>
                          <span className="text-[#38F8B0] font-bold">Stable Demand</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-xs text-[#FF4D6D] font-mono">Failed to fetch growth statistics database.</div>
          )}
        </div>
      )}

      {/* PUBLIC PROFILE MODAL (Phase 4 - Item 9) */}
      {selectedCampaignProfile && (
        <PublicProfileModal
          campaign={selectedCampaignProfile}
          user={user}
          onClose={() => {
            setSelectedCampaignProfile(null);
            fetchCampaigns(); // refresh list in case reputation scores updated
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
