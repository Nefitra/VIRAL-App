import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, ShieldAlert, Star, MessageSquare, 
  ArrowUpRight, AlertTriangle, RefreshCw, Play, Award, 
  Clock, Heart, ThumbsUp, Send, User, Coins, ChevronRight
} from 'lucide-react';
import { Campaign, User as AppUser } from '../types';

interface PublicProfileModalProps {
  campaign: any;
  user: AppUser;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info', title?: string) => void;
}

export default function PublicProfileModal({ campaign, user, onClose, showToast }: PublicProfileModalProps) {
  const resource = campaign.resource;
  const [reviews, setReviews] = useState<any[]>([]);
  const [health, setHealth] = useState<any | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fraud scanning state
  const [scanningFraud, setScanningFraud] = useState(false);
  const [fraudResult, setFraudResult] = useState<any | null>(null);

  useEffect(() => {
    // Fetch reviews
    fetch(`/api/resources/${resource.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoadingReviews(false);
      })
      .catch(err => {
        console.error('Error fetching reviews:', err);
        setLoadingReviews(false);
      });

    // Fetch campaign health
    fetch(`/api/campaigns/${campaign.id}/health`)
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoadingHealth(false);
      })
      .catch(err => {
        console.error('Error fetching health score:', err);
        setLoadingHealth(false);
      });
  }, [resource.id, campaign.id]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setSubmittingReview(true);
    fetch(`/api/resources/${resource.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username || 'Anonymous',
        rating,
        text: reviewText
      })
    })
      .then(res => res.json())
      .then(data => {
        setSubmittingReview(false);
        if (data.success) {
          showToast('Review posted successfully! Thank you for supporting Web3 safety.', 'success', 'Review Added');
          setReviews(prev => [data.review, ...prev]);
          setReviewText('');
          // Update campaign resource reputation score locally
          resource.community_reputation_score = data.community_reputation;
        } else {
          showToast(data.error || 'Failed to submit review.', 'error');
        }
      })
      .catch(err => {
        setSubmittingReview(false);
        console.error('Error submitting review:', err);
        showToast('Server connection failed.', 'error');
      });
  };

  const handleRunFraudScan = () => {
    setScanningFraud(true);
    setFraudResult(null);

    fetch(`/api/campaigns/${campaign.id}/fraud-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        setScanningFraud(false);
        setFraudResult(data);
        if (data.fraud) {
          showToast('Sybil Farming / Speed anomalities flagged! Rewards paused automatically.', 'error', 'Fraud Detected');
        } else {
          showToast('Campaign verified clean! Dynamic security metrics updated.', 'success', 'Scan Completed');
        }
      })
      .catch(err => {
        setScanningFraud(false);
        console.error('Error running fraud scan:', err);
        showToast('Failed to trigger AI fraud scan.', 'error');
      });
  };

  // Set colors based on trust score
  const trustScore = resource?.trust_score !== undefined ? resource.trust_score : 80;
  let trustColorClass = 'text-[#38F8B0] border-[#38F8B0]/20 bg-[#38F8B0]/10';
  let trustLevelText = 'Exceptional Trust';
  if (trustScore > 60) {
    trustColorClass = 'text-[#FF4D6D] border-[#FF4D6D]/20 bg-[#FF4D6D]/10';
    trustLevelText = 'High Safety Risk';
  } else if (trustScore > 40) {
    trustColorClass = 'text-[#FF9F43] border-[#FF9F43]/20 bg-[#FF9F43]/10';
    trustLevelText = 'Medium Risk';
  } else if (trustScore > 20) {
    trustColorClass = 'text-[#FFD36A] border-[#FFD36A]/20 bg-[#FFD36A]/10';
    trustLevelText = 'Light Warning';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#8A2BFF]/30 bg-[#070312] p-5 md:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg border border-[#A9A3B8]/10 bg-white/5 text-[#A9A3B8] hover:text-white transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex gap-4 items-start pt-2">
          <img
            referrerPolicy="no-referrer"
            src={resource.image_url}
            alt={resource.title}
            className="h-14 w-14 rounded-xl object-cover bg-neutral-900 border border-[#8A2BFF]/20"
          />
          <div className="space-y-1 min-w-0">
            <span className="inline-block rounded bg-[#8A2BFF]/10 border border-[#8A2BFF]/20 px-2 py-0.5 text-[9px] font-mono text-[#B066FF] uppercase">
              {resource.type}
            </span>
            <h2 className="text-lg font-black text-white uppercase tracking-tight truncate">{resource.title}</h2>
            <p className="text-xs text-[#A9A3B8] uppercase tracking-wider font-mono">{resource.category || 'Web3 Ecosystem'}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Security & Badges Section */}
          <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/60 p-4 space-y-3.5">
            <h3 className="text-[10px] font-mono tracking-wider text-[#A9A3B8] uppercase flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#8A2BFF]" />
              Ecosystem Trust Badging
            </h3>
            
            <div className="flex items-center gap-3">
              <div className={`rounded-lg border px-2.5 py-1.5 text-center ${trustColorClass} flex-1`}>
                <div className="text-lg font-black font-mono leading-none">{100 - trustScore}</div>
                <div className="text-[8px] font-mono mt-0.5 uppercase">Trust Score</div>
              </div>
              
              <div className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-center flex-1 text-[#38F8B0]">
                <div className="text-lg font-black font-mono leading-none">
                  {resource.community_reputation_score || 80}%
                </div>
                <div className="text-[8px] font-mono mt-0.5 uppercase text-[#A9A3B8]">Community Rep</div>
              </div>
            </div>

            <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
              Verified by $VIRAL Sentinel AI Engine. Badging status: <span className="font-bold text-white">{trustLevelText}</span>. 
              The project holds standard locked campaign deposits inside secure multisig escape escrows.
            </p>

            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#8A2BFF]/10 hover:bg-[#8A2BFF]/20 border border-[#8A2BFF]/30 text-xs font-bold py-2 text-white transition-all cursor-pointer"
            >
              Launch Platform Resource
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Campaign Health Monitor */}
          <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#05020D]/60 p-4 space-y-3">
            <h3 className="text-[10px] font-mono tracking-wider text-[#A9A3B8] uppercase flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-[#FFD36A]" />
              Campaign Performance & Health
            </h3>

            {loadingHealth ? (
              <div className="text-xs text-[#A9A3B8] font-mono py-4 animate-pulse">Computing health grade matrix...</div>
            ) : health ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#A9A3B8]">Performance Grade:</span>
                  <span className="rounded-md bg-[#38F8B0]/10 border border-[#38F8B0]/20 px-2 py-0.5 text-xs font-black text-[#38F8B0]">
                    Grade {health.performance_grade}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#A9A3B8]">Completion Rate</span>
                    <span className="font-mono text-white font-bold">{health.completion_rate}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#8A2BFF] to-[#38F8B0]"
                      style={{ width: `${health.completion_rate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-[#A9A3B8]/5 pt-2">
                  <div>
                    <span className="text-[#A9A3B8] block uppercase text-[8px] font-mono">Satisfaction</span>
                    <span className="font-bold text-white font-mono">{health.user_satisfaction}% Match</span>
                  </div>
                  <div>
                    <span className="text-[#A9A3B8] block uppercase text-[8px] font-mono">Finish Est.</span>
                    <span className="font-bold text-white font-mono">{health.estimated_finish_time}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#FF4D6D] font-mono">Failed to calculate health scores.</div>
            )}
          </div>
        </div>

        {/* Project Description */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-mono tracking-wider text-[#A9A3B8] uppercase">Ecosystem Profile</h4>
          <p className="text-xs text-white leading-relaxed bg-[#05020D]/40 rounded-xl p-3 border border-white/5">
            {resource.description || 'No portfolio description entered.'}
          </p>
        </div>

        {/* AI Fraud Scanning Suite */}
        <div className="rounded-xl border border-[#FF4D6D]/15 bg-[#FF4D6D]/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono tracking-wider text-[#FF4D6D] uppercase flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              AI FRAUD DEFENSE SUITE
            </h4>
            <span className="text-[8px] font-mono text-[#A9A3B8] uppercase">Continuous Scanner Active</span>
          </div>

          <p className="text-[10px] text-[#A9A3B8] leading-relaxed">
            Scan active participants and emission patterns using standard Antigravity farming checks. 
            Analyzes speed intervals, connected multi-account wallets, and Sybil fingerprints instantly.
          </p>

          <button
            onClick={handleRunFraudScan}
            disabled={scanningFraud}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border border-[#FF4D6D]/20 px-3.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {scanningFraud ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Scanning Completions...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                Run AI Security Scan
              </>
            )}
          </button>

          {fraudResult && (
            <div className={`mt-2 rounded-lg border p-3 text-[10px] font-mono space-y-1.5 ${
              fraudResult.fraud 
                ? 'bg-[#FF4D6D]/10 border-[#FF4D6D]/20 text-[#FF4D6D]' 
                : 'bg-[#38F8B0]/10 border-[#38F8B0]/20 text-[#38F8B0]'
            }`}>
              <div className="font-bold flex items-center gap-1">
                {fraudResult.fraud ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Scan Result: {fraudResult.fraud ? 'ANOMALIES TRIGGERED PAUSE' : 'STABLE EMISSION APPROVED'}
              </div>
              <p className="text-[#A9A3B8]">{fraudResult.message}</p>
              {fraudResult.detections && fraudResult.detections.length > 0 && (
                <ul className="list-disc pl-4 space-y-1 mt-1 text-[9px] text-[#FF4D6D]">
                  {fraudResult.detections.map((det: string, i: number) => (
                    <li key={i}>{det}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Write & Read Reviews */}
        <div className="border-t border-[#A9A3B8]/10 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-[#B066FF]" />
              Community Reviews ({reviews.length})
            </h4>
          </div>

          {/* Form to post a review */}
          <form onSubmit={handleSubmitReview} className="space-y-3 bg-[#05020D]/60 border border-[#A9A3B8]/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#A9A3B8] uppercase">Write Community Review</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 cursor-pointer text-[#FFD36A]"
                  >
                    <Star className={`h-4 w-4 ${star <= rating ? 'fill-[#FFD36A]' : 'opacity-30'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this resource (reputation, payouts, safety...)"
                rows={2}
                maxLength={400}
                className="w-full rounded bg-[#05020D]/80 border border-[#A9A3B8]/10 p-2.5 text-xs text-white placeholder-[#A9A3B8]/40 focus:border-[#8A2BFF] focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingReview || !reviewText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8A2BFF] hover:bg-[#9E4DFF] px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                Post Review
              </button>
            </div>
          </form>

          {/* Reviews list */}
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {loadingReviews ? (
              <div className="text-xs text-[#A9A3B8] font-mono py-2 animate-pulse">Loading community log...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 text-[11px] text-[#A9A3B8]/50 font-mono">
                No community ratings logged yet. Be the first to audit!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="rounded-lg border border-[#A9A3B8]/5 bg-[#05020D]/40 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#A9A3B8] font-mono">
                      <User className="h-3 w-3" />
                      <span>@{rev.username}</span>
                    </div>
                    
                    <div className="flex items-center gap-0.5 text-[#FFD36A]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-3 w-3 ${star <= rev.rating ? 'fill-[#FFD36A]' : 'opacity-20'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#E1DFE6] leading-relaxed font-sans">{rev.text}</p>
                  <span className="block text-[8px] text-[#A9A3B8]/40 font-mono text-right">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
