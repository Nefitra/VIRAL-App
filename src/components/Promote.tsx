import React, { useState, useEffect } from 'react';
import { Rocket, Plus, ShieldAlert, Coins, Sparkles, PlusCircle, LayoutGrid, CheckCircle, ArrowLeft } from 'lucide-react';
import { User, Balance, Resource } from '../types';
import { useToast } from './Toast';

interface PromoteProps {
  user: User;
  balance: Balance;
  onCampaignCreated: () => void;
  setActiveTab?: (tab: string) => void;
}

export default function Promote({ user, balance, onCampaignCreated, setActiveTab }: PromoteProps) {
  const { showToast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  // Resource Form States
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState('miniapp');
  const [resUrl, setResUrl] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resCategory, setResCategory] = useState('Games');
  const [resLanguage, setResLanguage] = useState('English');
  const [resError, setResError] = useState('');
  const [resSuccess, setResSuccess] = useState('');

  // Campaign Form States
  const [selectedResId, setSelectedResId] = useState('');
  const [campBudget, setCampBudget] = useState('');
  const [campReward, setCampReward] = useState('50');
  const [campDuration, setCampDuration] = useState('30');
  const [campError, setCampError] = useState('');
  const [campSuccess, setCampSuccess] = useState('');

  const fetchResources = () => {
    setLoading(true);
    fetch(`/api/resources?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setResources(data);
        if (data.length > 0) {
          setSelectedResId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching resources:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchResources();
  }, [user.id]);

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    setResError('');
    setResSuccess('');

    if (!resTitle || !resUrl || !resDescription) {
      const err = 'Please fill in all primary resource fields.';
      setResError(err);
      showToast(err, 'error', 'Resource Error');
      return;
    }

    fetch('/api/resources/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_user_id: user.id,
        type: resType,
        title: resTitle,
        url: resUrl,
        description: resDescription,
        category: resCategory,
        language: resLanguage
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setResError(data.error);
          showToast(data.error, 'error', 'Submission Rejected');
        } else {
          const successMsg = data.rewardEarned 
            ? `Resource submitted successfully! Earned +${data.rewardEarned} vVIRAL first resource bonus!` 
            : 'Resource submitted successfully! Awaiting quick admin approval.';
          setResSuccess(successMsg);
          showToast(successMsg, data.rewardEarned ? 'reward' : 'success', 'Resource Submitted');
          setResTitle('');
          setResUrl('');
          setResDescription('');
          fetchResources();
          setTimeout(() => {
            setShowAddResource(false);
            setResSuccess('');
          }, 3000);
        }
      })
      .catch(() => {
        setResError('Network error submitting resource.');
        showToast('Network error submitting resource.', 'error', 'Network Failure');
      });
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setCampError('');
    setCampSuccess('');

    const budget = Number(campBudget);
    const reward = Number(campReward);

    if (!selectedResId) {
      const err = 'Please select or add a promotion resource first.';
      setCampError(err);
      showToast(err, 'error', 'Campaign Error');
      return;
    }
    if (budget <= 0 || isNaN(budget)) {
      const err = 'Please enter a valid positive budget amount.';
      setCampError(err);
      showToast(err, 'error', 'Budget Required');
      return;
    }
    if (reward <= 0 || isNaN(reward)) {
      const err = 'Please enter a valid reward per verified action.';
      setCampError(err);
      showToast(err, 'error', 'Reward Required');
      return;
    }
    if (budget > (balance?.vviral_balance || 0)) {
      const err = `Insufficient balance. You need ${budget} vVIRAL, but have only ${balance?.vviral_balance || 0} vVIRAL.`;
      setCampError(err);
      showToast(err, 'error', 'Funds Depleted');
      return;
    }

    // platform fee is 10%
    const platformFee = Math.floor(budget * 0.1);
    const escrowAmount = budget - platformFee;
    if (reward > escrowAmount) {
      const err = `Reward per action (${reward} vVIRAL) cannot exceed the escrow reward budget (${escrowAmount} vVIRAL).`;
      setCampError(err);
      showToast(err, 'error', 'Budget Too High');
      return;
    }

    fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_user_id: user.id,
        resource_id: selectedResId,
        campaign_type: resources.find(r => r.id === selectedResId)?.type || 'miniapp',
        total_budget: budget,
        reward_per_action: reward,
        duration_days: Number(campDuration)
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setCampError(data.error);
          showToast(data.error, 'error', 'Campaign Failed');
        } else {
          setCampSuccess('Promotion Campaign launched successfully! Funds are locked in secure Escrow.');
          showToast('Ecosystem campaign active! Budget locked in secure smart-escrow contracts.', 'success', 'Campaign Active');
          setCampBudget('');
          onCampaignCreated();
          setTimeout(() => {
            setShowCreateCampaign(false);
            setCampSuccess('');
          }, 3000);
        }
      })
      .catch(() => {
        setCampError('Network error creating campaign.');
        showToast('Ecosystem connection failed.', 'error', 'Network Failure');
      });
  };

  // Preview Calculations
  const budgetNum = Number(campBudget) || 0;
  const platformFeeCalc = Math.floor(budgetNum * 0.10);
  const escrowBudgetCalc = Math.max(0, budgetNum - platformFeeCalc);
  const rewardNum = Number(campReward) || 1;
  const maxActionsCalc = Math.floor(escrowBudgetCalc / rewardNum);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#A9A3B8]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#8A2BFF]/10 rounded-lg border border-[#8A2BFF]/35 text-[#B066FF]">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-sans text-base font-extrabold text-white leading-none">Promote My Project</h1>
            <span className="text-[10px] font-mono text-[#A9A3B8] tracking-wider uppercase mt-1 block">Ecosystem Campaigns</span>
          </div>
        </div>
        
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#A9A3B8]/10 bg-[#0B0618]/60 text-[11px] font-bold text-[#A9A3B8] hover:text-white hover:border-[#8A2BFF]/40 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Disclaimer / Explainer */}
      <div className="rounded-xl border border-[#8A2BFF]/30 glass p-4 space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[#8A2BFF]/5 blur-2xl"></div>
        <h2 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[#B066FF]">
          <Rocket className="h-4 w-4" /> Promotion Escrow Protection
        </h2>
        <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
          <strong>Add your resource, set a campaign budget and use $VIRAL to reach real users. Campaign funds are protected by escrow and released only for verified actions.</strong>
        </p>
      </div>

      {/* Options Header */}
      <div className="flex flex-wrap gap-2">
        <button
          id="promote-toggle-add-resource"
          onClick={() => {
            setShowAddResource(!showAddResource);
            setShowCreateCampaign(false);
          }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold border transition-all cursor-pointer ${
            showAddResource 
              ? 'bg-[#8A2BFF] text-white border-[#8A2BFF]' 
              : 'bg-[#0B0618] text-[#A9A3B8] border-[#A9A3B8]/10 hover:border-[#8A2BFF]/30 hover:text-white'
          }`}
        >
          <PlusCircle className="h-3.5 w-3.5 text-[#FFD36A]" />
          Add Resource Profile
        </button>

        <button
          id="promote-toggle-create-campaign"
          disabled={resources.length === 0}
          onClick={() => {
            setShowCreateCampaign(!showCreateCampaign);
            setShowAddResource(false);
          }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold border transition-all ${
            resources.length === 0 
              ? 'opacity-40 cursor-not-allowed bg-[#0B0618] text-[#A9A3B8]/40 border-none' 
              : showCreateCampaign 
                ? 'bg-[#8A2BFF] text-white border-[#8A2BFF] cursor-pointer' 
                : 'bg-[#0B0618] text-[#A9A3B8] border-[#A9A3B8]/10 hover:border-[#8A2BFF]/30 hover:text-white cursor-pointer'
          }`}
        >
          <Rocket className="h-3.5 w-3.5 text-[#B066FF]" />
          Launch Ad Campaign
        </button>
      </div>

      {/* Add Resource Panel */}
      {showAddResource && (
        <form onSubmit={handleAddResource} className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
          <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">Add New Digital Asset or Resource</h3>
          
          <div className="space-y-2.5">
            <div>
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Resource Name / Title</label>
              <input
                id="promote-res-title"
                type="text"
                placeholder="e.g. TON Hamster Tap App, Blum Alpha Alert"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2.5 text-xs text-white placeholder-[#A9A3B8]/30 focus:border-[#8A2BFF] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Asset/Resource Type</label>
                <select
                  id="promote-res-type"
                  value={resType}
                  onChange={(e) => setResType(e.target.value)}
                  className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                >
                  <option value="miniapp">Telegram Mini App</option>
                  <option value="bot">Telegram Bot</option>
                  <option value="channel">Telegram Channel</option>
                  <option value="website">Website URL</option>
                  <option value="other">Token / Web3 Page</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Category</label>
                <select
                  id="promote-res-category"
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value)}
                  className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                >
                  <option value="Games">Games & Play-to-Earn</option>
                  <option value="DeFi & Analytics">DeFi & DEX Analytics</option>
                  <option value="News & Media">News & Alpha Media</option>
                  <option value="NFTs">Digital Art & NFTs</option>
                  <option value="Communities">Ecosystem Communities</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Direct Telegram or Web URL</label>
              <input
                id="promote-res-url"
                type="text"
                placeholder="https://t.me/your_bot_or_app or website.com"
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2.5 text-xs text-white placeholder-[#A9A3B8]/30 focus:border-[#8A2BFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Promotional Pitch / Description</label>
              <textarea
                id="promote-res-desc"
                placeholder="Write an engaging pitch detailing what your resource does."
                value={resDescription}
                onChange={(e) => setResDescription(e.target.value)}
                rows={2}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2.5 text-xs text-white placeholder-[#A9A3B8]/30 focus:border-[#8A2BFF] focus:outline-none"
              />
            </div>
          </div>

          {resError && <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2 rounded">{resError}</div>}
          {resSuccess && <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 p-2 rounded">{resSuccess}</div>}

          <button
            id="promote-submit-resource"
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8A2BFF] hover:bg-[#B066FF] text-xs font-bold py-2.5 text-white cursor-pointer transition-all"
          >
            Submit for Admin Audit
          </button>
        </form>
      )}

      {/* Create Campaign Panel */}
      {showCreateCampaign && (
        <form onSubmit={handleCreateCampaign} className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-4">
          <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">Configure Promotion Ad Campaign</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Select Approved Resource</label>
              <select
                id="promote-camp-res"
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2.5 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
              >
                {resources.map(r => (
                  <option key={r.id} value={r.id}>
                    [{r.status.toUpperCase()}] {r.title} ({r.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Total vVIRAL Budget</label>
                <div className="relative">
                  <Coins className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#FFD36A]" />
                  <input
                    id="promote-camp-budget"
                    type="number"
                    placeholder="e.g. 10000"
                    value={campBudget}
                    onChange={(e) => setCampBudget(e.target.value)}
                    className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 py-2 pr-3 pl-8 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Reward Per Action</label>
                <input
                  id="promote-camp-reward"
                  type="number"
                  placeholder="50"
                  value={campReward}
                  onChange={(e) => setCampReward(e.target.value)}
                  className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Platform Audit & Fee Summary */}
            <div className="rounded-lg bg-[#05020D]/80 p-3 border border-[#A9A3B8]/5 space-y-1.5">
              <div className="text-[9px] font-mono text-[#A9A3B8] uppercase">Platform Escrow Audit Preview</div>
              
              <div className="flex justify-between text-[11px]">
                <span className="text-[#A9A3B8]">Advertising Fee (10%):</span>
                <span className="font-bold text-white">{platformFeeCalc.toLocaleString()} vVIRAL</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#A9A3B8]">Escrow Reward Pool:</span>
                <span className="font-bold text-[#FFD36A]">{escrowBudgetCalc.toLocaleString()} vVIRAL</span>
              </div>
              <div className="flex justify-between text-[11px] border-t border-[#A9A3B8]/5 pt-1.5 mt-1">
                <span className="text-[#A9A3B8]">Max User Actions Yield:</span>
                <span className="font-black text-[#38F8B0]">
                  {isNaN(maxActionsCalc) || maxActionsCalc === Infinity ? 0 : maxActionsCalc} users
                </span>
              </div>
            </div>
          </div>

          {campError && <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2.5 rounded-lg">{campError}</div>}
          {campSuccess && <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 p-2.5 rounded-lg">{campSuccess}</div>}

          <button
            id="promote-submit-campaign"
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8A2BFF] to-[#B066FF] hover:opacity-95 text-xs font-bold py-2.5 text-white shadow-lg shadow-[#8A2BFF]/20 cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4" />
            Lock Escrow and Launch
          </button>
        </form>
      )}

      {/* Your Resources List */}
      <div className="space-y-3">
        <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <LayoutGrid className="h-4 w-4 text-[#B066FF]" /> Your Assets Portfolio ({resources.length})
        </h3>

        {loading ? (
          <div className="text-xs text-[#A9A3B8] font-mono">Loading assets portfolio...</div>
        ) : resources.length === 0 ? (
          <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618] p-5 text-center text-xs text-[#A9A3B8]">
            You have not submitted any promotion resources yet. Click 'Add Resource' to start!
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {resources.map((res) => (
              <div key={res.id} className="flex gap-3 items-center justify-between p-3 rounded-lg border border-[#8A2BFF]/15 glass hover:border-[#8A2BFF]/35 transition-all">
                <div className="flex gap-2.5 items-center min-w-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={res.image_url}
                    alt={res.title}
                    className="h-8 w-8 rounded-md object-cover bg-neutral-800 border border-[#A9A3B8]/10"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate uppercase tracking-tight">{res.title}</h4>
                    <span className="rounded bg-[#8A2BFF]/10 border border-[#8A2BFF]/20 text-[#B066FF] px-1.5 py-0.5 text-[8px] font-mono font-medium uppercase mt-0.5 inline-block">
                      {res.type}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wider ${
                    res.status === 'approved' 
                      ? 'bg-[#38F8B0]/10 text-[#38F8B0] border border-[#38F8B0]/15' 
                      : res.status === 'pending' 
                        ? 'bg-[#FFD36A]/10 text-[#FFD36A] border border-[#FFD36A]/15' 
                        : 'bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/15'
                  }`}>
                    {res.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
