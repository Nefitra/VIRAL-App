import React, { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, ShieldCheck, Tag, Globe, Sparkles } from 'lucide-react';
import { Resource, Campaign } from '../types';

interface DiscoverProps {
  onSelectCampaign: (campaign: any) => void;
}

export default function Discover({ onSelectCampaign }: DiscoverProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
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
  }, []);

  const categories = [
    { id: 'all', label: 'All Resources' },
    { id: 'miniapp', label: 'Mini Apps' },
    { id: 'bot', label: 'Telegram Bots' },
    { id: 'channel', label: 'Channels' },
    { id: 'website', label: 'Websites' }
  ];

  const filteredCampaigns = campaigns.filter(c => {
    if (!c.resource) return false;
    
    // Category Filter
    if (filterType !== 'all' && c.campaign_type !== filterType) return false;
    
    // Search Query Filter
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
            className="w-full rounded-lg border border-[#A9A3B8]/10 bg-[#0B0618] py-2.5 pr-3 text-xs text-white placeholder-[#A9A3B8]/50 focus:border-[#8A2BFF] focus:outline-none focus:ring-1 focus:ring-[#8A2BFF] pl-9"
          />
        </div>
        
        {/* Quick select categories */}
        <div className="flex flex-wrap gap-1 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`discover-filter-${cat.id}`}
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

      {/* Heading */}
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#FFD36A]" />
          Active Promoted Resources
        </h2>
        <span className="text-[10px] text-[#A9A3B8] font-mono uppercase tracking-wider">
          {filteredCampaigns.length} campaigns online
        </span>
      </div>

      {/* Directory Cards */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs text-[#A9A3B8] font-mono">
          Loading active Web3 ecosystems...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#A9A3B8]/15 bg-[#0B0618]/30 py-10 text-center space-y-1.5">
          <Globe className="mx-auto h-7 w-7 text-[#A9A3B8]/30" />
          <p className="text-xs text-[#A9A3B8]">No active campaigns found matching filters.</p>
          <p className="text-[10px] text-[#A9A3B8]/50 font-mono">Check back later or launch your own resource campaign!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredCampaigns.map((camp) => (
            <div 
              key={camp.id}
              id={`discover-card-${camp.id}`}
              onClick={() => onSelectCampaign(camp)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#8A2BFF]/20 glass p-4 hover:border-[#8A2BFF]/50 hover:shadow-lg hover:shadow-[#8A2BFF]/10 transition-all cursor-pointer"
            >
              <div className="space-y-3">
                {/* Card Header */}
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

                {/* Description */}
                <p className="text-[11px] text-[#A9A3B8] leading-relaxed line-clamp-2">
                  {camp.resource?.description}
                </p>
              </div>

              {/* Economic Footprint */}
              <div className="mt-4 border-t border-[#A9A3B8]/5 pt-3 flex items-center justify-between">
                <div>
                  <div className="stat-label">REWARD / TASK</div>
                  <div className="flex items-baseline gap-0.5 text-xs font-black text-[#FFD36A]">
                    <span>+{camp.reward_per_action}</span>
                    <span className="text-[8px] font-normal text-[#A9A3B8]">vVIRAL</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="stat-label">CAPACITY</div>
                  <div className="text-xs font-bold text-white font-mono">
                    {camp.approved_actions} <span className="text-[#A9A3B8]">/ {camp.max_actions}</span>
                  </div>
                </div>
              </div>

              {/* Security Guard Logo */}
              <div className="absolute top-3 right-3 flex items-center gap-0.5 text-[8px] font-medium text-[#38F8B0] bg-[#38F8B0]/5 border border-[#38F8B0]/15 rounded-full px-1.5 py-0.5 uppercase font-mono">
                <ShieldCheck className="h-2.5 w-2.5" />
                Escrow
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
