import React, { useState, useEffect } from 'react';
import { Rocket, Plus, ShieldAlert, Coins, Sparkles, PlusCircle, LayoutGrid, CheckCircle, ArrowLeft, Shield, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
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
  const [verifyingResId, setVerifyingResId] = useState<string | null>(null);
  const [activeLogResId, setActiveLogResId] = useState<string | null>(null);

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
  const [campGoal, setCampGoal] = useState('Community Growth');
  const [campAudience, setCampAudience] = useState('Global');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationData, setOptimizationData] = useState<any | null>(null);

  // AI Growth Assistant States
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [askingAssistant, setAskingAssistant] = useState(false);
  const [assistantTips, setAssistantTips] = useState<string[]>([]);

  const handleRunOptimization = () => {
    if (!selectedResId) {
      showToast('Please select a resource to optimize.', 'error', 'Resource Required');
      return;
    }
    const selectedResource = resources.find(r => r.id === selectedResId);
    setOptimizing(true);
    setOptimizationData(null);

    fetch('/api/campaigns/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: campGoal,
        category: selectedResource?.category || 'General',
        reward_per_action: Number(campReward) || 50,
        total_budget: Number(campBudget) || 1000,
        target_audience: campAudience
      })
    })
      .then(res => res.json())
      .then(data => {
        setOptimizing(false);
        setOptimizationData(data);
        showToast('AI analysis complete! Applied dynamic benchmarks.', 'success', 'Optimizer Done');
      })
      .catch(err => {
        setOptimizing(false);
        console.error('Error optimizing campaign:', err);
        showToast('Failed to connect to AI Campaign Optimizer.', 'error');
      });
  };

  const handleApplyRecommendations = () => {
    if (!optimizationData) return;
    setCampReward(String(optimizationData.optimal_reward_per_task));
    setCampBudget(String(optimizationData.recommended_budget));
    showToast('Applied AI optimal reward and budget values to campaign form!', 'success', 'Applied');
  };

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

  const handleVerifyCode = (resId: string) => {
    setVerifyingResId(resId);
    fetch(`/api/resources/${resId}/verify-code`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        setVerifyingResId(null);
        if (data.error) {
          showToast(data.error, 'error', 'Verification Failed');
        } else if (data.verified) {
          showToast('Ownership verified successfully! Security shield activated.', 'success', 'Verified');
          fetchResources();
        } else {
          showToast(data.message || 'Verification code not found. Please double check bio description.', 'error', 'Check Failed');
          fetchResources();
        }
      })
      .catch(() => {
        setVerifyingResId(null);
        showToast('Network error during verification.', 'error', 'Connection Error');
      });
  };

  const handleReRunScan = (resId: string) => {
    setVerifyingResId(resId);
    fetch(`/api/resources/${resId}/re-run`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        setVerifyingResId(null);
        if (data.error) {
          showToast(data.error, 'error', 'AI Scan Failed');
        } else {
          showToast('AI automated moderation and technical checks completed!', 'success', 'Scan Finished');
          fetchResources();
        }
      })
      .catch(() => {
        setVerifyingResId(null);
        showToast('Network error during scanning.', 'error', 'Connection Error');
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

    const selectedResource = resources.find(r => r.id === selectedResId);
    if (!selectedResource) {
      const err = 'Selected resource not found.';
      setCampError(err);
      showToast(err, 'error', 'Campaign Error');
      return;
    }

    if (selectedResource.status !== 'approved') {
      const err = `This asset is currently [${selectedResource.status.toUpperCase()}]. Campaigns can only be launched for fully approved assets (status: 'approved').`;
      setCampError(err);
      showToast(err, 'error', 'Resource Not Approved');
      return;
    }

    if (selectedResource.ownership_status !== 'verified') {
      const err = 'Asset ownership is not verified yet. Please complete ownership verification before launching campaigns.';
      setCampError(err);
      showToast(err, 'error', 'Verification Required');
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

      {/* Dynamic Explanation Panel - Clarifying Add Resource vs. Launch Campaign */}
      <div className="rounded-xl border border-[#8A2BFF]/30 bg-[#0B0618]/90 glass p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#8A2BFF]/5 blur-3xl"></div>
        
        <div className="flex items-center gap-2 border-b border-[#A9A3B8]/10 pb-2.5">
          <Sparkles className="h-4 w-4 text-[#FFD36A]" />
          <h2 className="font-sans text-xs font-extrabold text-white uppercase tracking-wider">
            Ecosystem Guide: Listing & Campaigns
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Resource Column */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFD36A]">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>1. Add Resource Profile</span>
            </div>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              Use this option to add your project, bot, Telegram Mini App, website, channel, or digital asset to the $VIRAL ecosystem. This creates a public resource profile inside the <strong className="text-white">DISCOVER</strong> tab and prepares it for future promotion.
            </p>
            <div className="p-2.5 bg-[#05020D] border border-[#A9A3B8]/5 rounded-lg text-[10px] text-[#A9A3B8] space-y-1 font-mono">
              <div className="text-white font-bold text-[9px] uppercase tracking-wider mb-1">Deduction & Listing Rules:</div>
              <div>• <span className="text-[#38F8B0] font-semibold">100% FREE</span> to list/register.</div>
              <div>• NO tokens are deducted for profile registration.</div>
              <div>• Earns <span className="text-[#FFD36A] font-semibold">+50 vVIRAL</span> on your first added asset!</div>
              <div>• Listing only; does not auto-launch paid advertising.</div>
            </div>
          </div>

          {/* Launch Campaign Column */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#B066FF]">
              <Rocket className="h-3.5 w-3.5" />
              <span>2. Launch Ad Campaign</span>
            </div>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              Use this option when you want to actively promote your registered resource. Use a token budget to target specific actions, generating reach, clicks, visibility, traffic, or engagement from verified users.
            </p>
            <div className="p-2.5 bg-[#05020D] border border-[#A9A3B8]/5 rounded-lg text-[10px] text-[#A9A3B8] space-y-1 font-mono">
              <div className="text-white font-bold text-[9px] uppercase tracking-wider mb-1">Ecosystem Economic Loop:</div>
              <div>• Deducted immediately upon campaign creation.</div>
              <div>• Held in secure Smart Escrow, released on proof of work.</div>
              <div>• <span className="text-[#FFD36A] font-semibold font-bold">At the Alpha stage, campaign costs are calculated in vVIRAL test balance.</span></div>
              <div>• <span className="text-white font-semibold font-bold">Real $VIRAL campaign payments are not active yet.</span></div>
              <div>• Minimum budget: Total budget must match target goals.</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#A9A3B8]/10 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-[#38F8B0]">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Tokens are deducted only when a paid campaign is launched or confirmed, not simply when a resource profile is added.</span>
          </div>
          <span className="text-[8px] font-mono bg-[#8A2BFF]/10 text-[#B066FF] border border-[#8A2BFF]/25 px-2 py-0.5 rounded uppercase font-semibold">Alpha Test Network</span>
        </div>
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
                <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Campaign Goal</label>
                <select
                  value={campGoal}
                  onChange={(e) => setCampGoal(e.target.value)}
                  className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                >
                  <option value="Community Growth">Community Growth</option>
                  <option value="User Onboarding">User Onboarding</option>
                  <option value="Token Launch">Token Launch</option>
                  <option value="Volume Boosting">Volume Boosting</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Target Audience</label>
                <select
                  value={campAudience}
                  onChange={(e) => setCampAudience(e.target.value)}
                  className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2 text-xs text-white focus:border-[#8A2BFF] focus:outline-none"
                >
                  <option value="Global">Global Web3</option>
                  <option value="Germany">Germany / EU</option>
                  <option value="Ukraine">Ukraine / CIS</option>
                  <option value="Singapore">Singapore / Asia</option>
                  <option value="Nigeria">Nigeria / Africa</option>
                </select>
              </div>
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

            {/* AI Optimizer Section */}
            <div className="rounded-lg bg-[#8A2BFF]/5 p-3.5 border border-[#8A2BFF]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono text-[#B066FF] uppercase font-bold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI Campaign Optimizer
                </div>
                <button
                  type="button"
                  onClick={handleRunOptimization}
                  disabled={optimizing}
                  className="text-[10px] bg-[#8A2BFF]/20 hover:bg-[#8A2BFF]/40 text-white rounded px-2.5 py-1 font-bold border border-[#8A2BFF]/30 cursor-pointer disabled:opacity-50 animate-pulse"
                >
                  {optimizing ? 'Analyzing...' : '⚡ Optimize Parameters'}
                </button>
              </div>

              {optimizationData && (
                <div className="text-[10px] font-mono space-y-2 pt-1 border-t border-[#A9A3B8]/10">
                  <div className="grid grid-cols-2 gap-2 text-[#A9A3B8]">
                    <div>Optimal Reward: <span className="text-[#FFD36A] font-bold">{optimizationData.optimal_reward_per_task} vVIRAL</span></div>
                    <div>Recommended Budget: <span className="text-[#FFD36A] font-bold">{optimizationData.recommended_budget} vVIRAL</span></div>
                    <div>Est. Finish Time: <span className="text-white font-bold">{optimizationData.estimated_completion_time}</span></div>
                    <div>Conversion Rate: <span className="text-[#38F8B0] font-bold">{optimizationData.expected_conversion_rate}%</span></div>
                  </div>

                  {optimizationData.suggestions && (
                    <div className="space-y-1 bg-[#05020D]/50 rounded p-2 text-[9px] text-[#A9A3B8] leading-relaxed">
                      <div className="font-bold text-white uppercase text-[8px] tracking-wider">AI Optimizer Recommendations:</div>
                      {optimizationData.suggestions.map((s: string, idx: number) => (
                        <div key={idx}>• {s}</div>
                      ))}
                    </div>
                  )}

                  {optimizationData.budget_warnings && optimizationData.budget_warnings.length > 0 && (
                    <div className="space-y-1 bg-[#FF4D6D]/10 rounded p-2 text-[9px] text-[#FF4D6D]">
                      <div className="font-bold uppercase text-[8px] tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> AI Budget Warnings:
                      </div>
                      {optimizationData.budget_warnings.map((w: string, idx: number) => (
                        <div key={idx}>• {w}</div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyRecommendations}
                    className="w-full text-center py-1.5 rounded bg-gradient-to-r from-[#8A2BFF] to-[#B066FF] hover:opacity-95 text-white font-bold text-[9px] cursor-pointer"
                  >
                    Apply Recommended Parameters
                  </button>
                </div>
              )}
            </div>
          </div>

          {campError && <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2.5 rounded-lg">{campError}</div>}
          {campSuccess && <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 p-2.5 rounded-lg">{campSuccess}</div>}

          {(() => {
            const selectedRes = resources.find(r => r.id === selectedResId);
            if (!selectedRes) return null;
            const isApproved = selectedRes.status === 'approved';
            const isVerified = selectedRes.ownership_status === 'verified';
            
            if (!isApproved || !isVerified) {
              return (
                <div className="rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/25 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF4D6D]">
                    <ShieldAlert className="h-4 w-4" />
                    Campaign Creation Locked
                  </div>
                  <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
                    {!isApproved && `• Status of selected asset is [${selectedRes.status.toUpperCase()}]. Assets must be fully APPROVED (Verified by VIRAL) before launching campaigns.`}
                    {!isApproved && <br />}
                    {!isVerified && `• Ownership of selected asset is [UNVERIFIED]. Please go to Your Assets Portfolio below and verify ownership first.`}
                  </p>
                </div>
              );
            }
            return null;
          })()}

          {(() => {
            const selectedRes = resources.find(r => r.id === selectedResId);
            const isApproved = selectedRes?.status === 'approved';
            const isVerified = selectedRes?.ownership_status === 'verified';
            const isBlocked = !isApproved || !isVerified;

            return (
              <button
                id="promote-submit-campaign"
                type="submit"
                disabled={isBlocked}
                className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold py-2.5 text-white shadow-lg transition-all ${
                  isBlocked
                    ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#8A2BFF] to-[#B066FF] hover:opacity-95 shadow-[#8A2BFF]/20 cursor-pointer'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                {isBlocked ? 'Campaign Locked (Review Required)' : 'Lock Escrow and Launch'}
              </button>
            );
          })()}
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
          <div className="grid gap-3 grid-cols-1">
            {resources.map((res) => {
              const isApproved = res.status === 'approved';
              const isVerified = res.ownership_status === 'verified';
              const isVerifying = verifyingResId === res.id;
              
              // Trust Score Details
              const trustScore = res.trust_score !== undefined ? res.trust_score : 50;
              const riskLevel = res.risk_level || 'Medium Risk';
              
              // Set colors based on risk
              let scoreColor = 'text-[#38F8B0]';
              let scoreBg = 'bg-[#38F8B0]/10';
              let barColor = 'bg-[#38F8B0]';
              if (trustScore > 20 && trustScore <= 40) {
                scoreColor = 'text-[#a2ff54]';
                scoreBg = 'bg-[#a2ff54]/10';
                barColor = 'bg-[#a2ff54]';
              } else if (trustScore > 40 && trustScore <= 60) {
                scoreColor = 'text-[#FFD36A]';
                scoreBg = 'bg-[#FFD36A]/10';
                barColor = 'bg-[#FFD36A]';
              } else if (trustScore > 60 && trustScore <= 80) {
                scoreColor = 'text-[#FF9F43]';
                scoreBg = 'bg-[#FF9F43]/10';
                barColor = 'bg-[#FF9F43]';
              } else if (trustScore > 80) {
                scoreColor = 'text-[#FF4D6D]';
                scoreBg = 'bg-[#FF4D6D]/10';
                barColor = 'bg-[#FF4D6D]';
              }

              return (
                <div key={res.id} className="p-4 rounded-xl border border-[#8A2BFF]/15 bg-[#0B0618]/90 glass space-y-4 transition-all hover:border-[#8A2BFF]/40">
                  {/* Title & Top Badges */}
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
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="rounded bg-[#8A2BFF]/10 border border-[#8A2BFF]/20 text-[#B066FF] px-1.5 py-0.5 text-[8px] font-mono uppercase">
                            {res.type}
                          </span>
                          <span className="rounded bg-[#A9A3B8]/5 border border-[#A9A3B8]/10 text-[#A9A3B8] px-1.5 py-0.5 text-[8px] font-mono">
                            {res.category || 'General'}
                          </span>
                          <a 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[8px] font-mono text-[#8A2BFF] hover:underline truncate max-w-[120px]"
                          >
                            {res.url}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Ownership Shield */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 rounded-md px-2 py-1">
                          <Shield className="h-3 w-3 fill-[#38F8B0]/20" />
                          OWNERSHIP OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#FFD36A] bg-[#FFD36A]/10 border border-[#FFD36A]/20 rounded-md px-2 py-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          UNVERIFIED
                        </span>
                      )}

                      {/* Moderation Status */}
                      <span className={`text-[9px] font-bold rounded px-2 py-1 uppercase tracking-wider border ${
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

                  {/* Sub-panels depending on verification status */}
                  {!isVerified && (
                    <div className="rounded-lg bg-[#FFD36A]/5 border border-[#FFD36A]/15 p-3 space-y-2 text-[11px]">
                      <div className="font-bold text-[#FFD36A] flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Action Required: Verify Asset Ownership
                      </div>
                      
                      {res.type === 'bot' ? (
                        <p className="text-[#A9A3B8] leading-relaxed text-[10px]">
                          Please add the following verification code to your bot's **public bio / description** on Telegram, then click the verification button below so our automated crawler can verify your ownership:
                        </p>
                      ) : res.type === 'channel' ? (
                        <p className="text-[#A9A3B8] leading-relaxed text-[10px]">
                          Please add the official bot <code className="text-white">@Viral_App_Bot</code> as an administrator in your channel with minimal (read-only) permissions, then click verify below:
                        </p>
                      ) : (
                        <p className="text-[#A9A3B8] leading-relaxed text-[10px]">
                          Confirm web asset availability and secure HTTPS reachability. Click verify to test:
                        </p>
                      )}

                      {res.type === 'bot' && res.verification_code && (
                        <div className="flex items-center justify-between rounded bg-[#05020D] border border-[#FFD36A]/10 p-2 font-mono text-xs text-white">
                          <span>{res.verification_code}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              navigator.clipboard.writeText(res.verification_code || '');
                              showToast('Code copied to clipboard!', 'success', 'Copied');
                            }}
                            className="text-[10px] text-[#8A2BFF] hover:underline cursor-pointer"
                          >
                            Copy Code
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isVerifying}
                          onClick={() => handleVerifyCode(res.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-[#FFD36A] to-[#FFA800] hover:opacity-90 text-neutral-900 font-bold text-[10px] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isVerifying ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Checking asset...
                            </>
                          ) : (
                            <>
                              <Shield className="h-3 w-3" /> Verify Asset Ownership
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Trust Score Metric & AI Report */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    {/* Left: Score Gauge */}
                    <div className="md:col-span-4 rounded-lg bg-[#05020D]/60 border border-[#A9A3B8]/10 p-3 flex flex-col justify-between space-y-2">
                      <div className="text-[9px] font-mono text-[#A9A3B8] uppercase tracking-wider">AI Automated Trust Score</div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${scoreColor}`}>{trustScore}</span>
                        <span className="text-[10px] text-[#A9A3B8]">/ 100</span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${Math.max(2, Math.min(100, 100 - trustScore))}%` }}></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold ${scoreColor} uppercase`}>{riskLevel}</span>
                        <span className="text-[9px] text-[#A9A3B8] font-mono">Safety Index</span>
                      </div>
                    </div>

                    {/* Right: AI Summary */}
                    <div className="md:col-span-8 rounded-lg bg-[#05020D]/60 border border-[#A9A3B8]/10 p-3 flex flex-col justify-between text-[11px] space-y-1.5">
                      <div className="text-[9px] font-mono text-[#A9A3B8] uppercase tracking-wider flex items-center justify-between">
                        <span>Gemini Moderation Analysis</span>
                        {res.detected_flags && res.detected_flags.length > 0 && (
                          <span className="text-[#FF4D6D] font-bold animate-pulse text-[8px] border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 px-1 rounded">
                            FLAGS: {res.detected_flags.join(', ')}
                          </span>
                        )}
                      </div>

                      <p className="text-white text-[11px] leading-relaxed line-clamp-2 italic">
                        "{res.ai_summary || 'Analysis pending background scan. Click Refresh below to query model.'}"
                      </p>

                      <div className="flex items-center justify-between border-t border-[#A9A3B8]/5 pt-2 mt-1">
                        <span className="text-[10px] text-[#A9A3B8] truncate max-w-[70%]">
                          Recommendation: <span className="text-white font-medium">{res.ai_recommendation || 'Wait for automated scan.'}</span>
                        </span>

                        <div className="flex gap-2">
                          {/* Log Button */}
                          <button
                            type="button"
                            onClick={() => setActiveLogResId(activeLogResId === res.id ? null : res.id)}
                            className="text-[9px] font-mono text-[#B066FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            {activeLogResId === res.id ? 'Hide Logs' : 'View Logs'}
                          </button>

                          {/* Re-run Button */}
                          <button
                            type="button"
                            disabled={isVerifying}
                            onClick={() => handleReRunScan(res.id)}
                            className="text-[9px] font-mono text-[#38F8B0] hover:underline inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`h-3 w-3 ${isVerifying ? 'animate-spin' : ''}`} />
                            Refresh Scan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logs Dropdown */}
                  {activeLogResId === res.id && (
                    <div className="rounded-lg bg-[#05020D] border border-[#A9A3B8]/15 p-3 space-y-2">
                      <div className="text-[10px] font-mono text-[#B066FF] uppercase tracking-wider pb-1.5 border-b border-[#A9A3B8]/5">
                        Moderation Log & Verification History
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[9px] text-[#A9A3B8] leading-normal divide-y divide-[#A9A3B8]/5">
                        {res.moderation_logs && res.moderation_logs.length > 0 ? (
                          res.moderation_logs.map((log, lIdx) => (
                            <div key={lIdx} className="py-1">
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-2 text-neutral-600">No moderation event logs found yet.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection / Request Changes Feedback */}
                  {res.status === 'pending' && (res as any).rejection_reason && (
                    <div className="rounded-lg bg-[#FFD36A]/5 border border-[#FFD36A]/20 p-2.5 text-[10px] text-[#FFD36A] leading-relaxed">
                      <strong>⚠️ Changes Requested:</strong> {(res as any).rejection_reason}
                    </div>
                  )}
                  {res.status === 'rejected' && (res as any).rejection_reason && (
                    <div className="rounded-lg bg-[#FF4D6D]/5 border border-[#FF4D6D]/20 p-2.5 text-[10px] text-[#FF4D6D] leading-relaxed">
                      <strong>🚨 Rejection Reason:</strong> {(res as any).rejection_reason}
                    </div>
                  )}
                  {res.status === 'suspended' && (res as any).rejection_reason && (
                    <div className="rounded-lg bg-[#FF4D6D]/5 border border-[#FF4D6D]/20 p-2.5 text-[10px] text-[#FF4D6D] leading-relaxed">
                      <strong>🛑 Suspended:</strong> {(res as any).rejection_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI Growth Assistant Widget (Phase 4 - Item 10) */}
        <div className="rounded-xl border border-[#8A2BFF]/30 bg-gradient-to-br from-[#8A2BFF]/10 to-[#070312] p-4 space-y-3 mt-4">
          <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-[#B066FF] animate-pulse" />
            AI Growth Consultant Assistant
          </div>
          <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
            Ask our personal AI Marketing Advisor for hyper-targeted Web3 community-building, conversion, and reward optimization tips tailored to your active campaigns and resources.
          </p>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={assistantPrompt}
                onChange={(e) => setAssistantPrompt(e.target.value)}
                placeholder="e.g., How can I increase conversions for my Telegram Mini App in Germany?"
                className="w-full rounded-lg bg-[#05020D]/80 border border-white/10 py-2 px-3 pr-10 text-xs text-white placeholder-neutral-600 focus:border-[#8A2BFF] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!assistantPrompt.trim()) return;
                  setAskingAssistant(true);
                  setAssistantTips([]);
                  fetch('/api/ai/growth-assistant', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: assistantPrompt, userId: user.id })
                  })
                    .then(res => res.json())
                    .then(data => {
                      setAskingAssistant(false);
                      setAssistantTips(data.advice || []);
                      showToast('AI consultant analyzed parameters successfully!', 'success', 'Consultant Ready');
                    })
                    .catch(err => {
                      setAskingAssistant(false);
                      console.error('Error contacting consultant:', err);
                      showToast('Connection to AI consultant failed.', 'error');
                    });
                }}
                disabled={askingAssistant || !assistantPrompt.trim()}
                className="absolute right-1 top-1 text-xs bg-[#8A2BFF] hover:bg-[#9E4DFF] text-white px-2.5 py-1 rounded font-bold cursor-pointer disabled:opacity-50"
              >
                {askingAssistant ? '...' : 'Ask'}
              </button>
            </div>

            {assistantTips.length > 0 && (
              <div className="space-y-1.5 rounded-lg bg-[#05020D]/60 p-3 border border-[#8A2BFF]/20 text-[10px] font-mono leading-relaxed text-[#A9A3B8]">
                <div className="font-bold text-white uppercase text-[8px] tracking-wider flex items-center gap-1 mb-1">
                  <Sparkles className="h-3 w-3 text-[#B066FF]" /> Custom AI Consultant Report:
                </div>
                {assistantTips.map((tip, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start">
                    <span className="text-[#38F8B0]">✓</span>
                    <span>{tip}</span>
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
