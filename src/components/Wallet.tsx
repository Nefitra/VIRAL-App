import React, { useState, useEffect } from 'react';
import { Coins, Send, Award, Wallet2, ShieldCheck, ArrowDownToLine, RefreshCw, Clipboard } from 'lucide-react';
import { User, Balance } from '../types';
import { useToast } from './Toast';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

interface WalletProps {
  user: User;
  balance: Balance;
  onBalanceUpdated: () => void;
}

export default function Wallet({ user, balance, onBalanceUpdated }: WalletProps) {
  const { showToast } = useToast();
  const tonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const [realTonBalance, setRealTonBalance] = useState<number | null>(null);
  const [realGramBalance, setRealGramBalance] = useState<number | null>(null);
  const [loadingRealBalances, setLoadingRealBalances] = useState(false);

  const fetchRealBalances = (address: string) => {
    if (!address) return;
    setLoadingRealBalances(true);
    fetch(`/api/wallet/balance/${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRealTonBalance(data.ton_balance);
          setRealGramBalance(data.gram_balance);
        } else {
          setRealTonBalance(null);
          setRealGramBalance(null);
        }
      })
      .catch(err => {
        console.error('Error fetching real balances:', err);
        setRealTonBalance(null);
        setRealGramBalance(null);
      })
      .finally(() => setLoadingRealBalances(false));
  };

  useEffect(() => {
    const activeAddress = tonAddress || user.wallet_address;
    if (activeAddress) {
      fetchRealBalances(activeAddress);
    } else {
      setRealTonBalance(null);
      setRealGramBalance(null);
    }
  }, [tonAddress, user.wallet_address]);

  // Transfer Form States
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  // Claim States
  const [claimInfo, setClaimInfo] = useState<any | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  // Transaction history
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const fetchClaimAndTxs = () => {
    setLoadingTx(true);
    // 1. Fetch claims
    fetch(`/api/claims/${user.id}`)
      .then(res => res.json())
      .then(data => setClaimInfo(data))
      .catch(err => console.error('Error fetching claims:', err));

    // 2. Fetch ledger transactions
    fetch(`/api/ledger/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoadingTx(false);
      })
      .catch(err => {
        console.error('Error fetching transactions:', err);
        setLoadingTx(false);
      });
  };

  useEffect(() => {
    fetchClaimAndTxs();
  }, [user.id, balance.vviral_balance]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    setSendSuccess('');

    const amt = Number(sendAmount);
    if (!recipient) {
      const err = 'Please enter recipient Username or Telegram ID.';
      setSendError(err);
      showToast(err, 'error', 'Transfer Error');
      return;
    }
    if (amt <= 0 || isNaN(amt)) {
      const err = 'Please enter a valid positive transfer amount.';
      setSendError(err);
      showToast(err, 'error', 'Amount Required');
      return;
    }
    if (amt > balance.vviral_balance) {
      const err = `Insufficient balance. Your current balance: ${balance.vviral_balance} vVIRAL.`;
      setSendError(err);
      showToast(err, 'error', 'Insufficient Funds');
      return;
    }

    setIsSending(true);

    fetch('/api/balances/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user.id,
        recipientQuery: recipient,
        amount: amt
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsSending(false);
        if (data.error) {
          setSendError(data.error);
          showToast(data.error, 'error', 'Transfer Denied');
        } else {
          const successMsg = `Successfully transferred ${data.received} vVIRAL to @${data.recipientName}! Fee: ${data.fee} vVIRAL.`;
          setSendSuccess(successMsg);
          showToast(successMsg, 'success', 'Transfer Complete');
          setSendAmount('');
          setRecipient('');
          onBalanceUpdated();
          fetchClaimAndTxs();
        }
      })
      .catch(() => {
        setIsSending(false);
        setSendError('Network error executing transfer.');
        showToast('Ecosystem connection offline.', 'error', 'Network Failure');
      });
  };

  const handleClaim = () => {
    if (!claimInfo || !claimInfo.isBonded) return;
    if (!user.wallet_address) {
      const err = 'Please connect your TON wallet in the Profile first.';
      setClaimError(err);
      showToast(err, 'error', 'No Wallet Connected');
      return;
    }

    setClaiming(true);
    setClaimError('');
    setClaimSuccess('');

    fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
      .then(res => res.json())
      .then(data => {
        setClaiming(false);
        if (data.error) {
          setClaimError(data.error);
          showToast(data.error, 'error', 'Claim Rejected');
        } else {
          const successMsg = data.claim.status === 'completed'
            ? `Real $VIRAL Claim paid successfully! Transferred ${data.claim.real_viral_amount.toLocaleString()} Real $VIRAL to your TON wallet!`
            : 'Claim submitted successfully! Currently under manual security audit.';
          setClaimSuccess(successMsg);
          showToast(successMsg, 'reward', 'Claim Action Success');
          onBalanceUpdated();
          fetchClaimAndTxs();
        }
      })
      .catch(() => {
        setClaiming(false);
        setClaimError('Network error submitting claim.');
        showToast('Network error submitting claim.', 'error', 'Network Failure');
      });
  };

  // Transfer Fee Preview
  const amtNum = Number(sendAmount) || 0;
  const processFee = Math.ceil(amtNum * 0.01);
  const netSend = Math.max(0, amtNum - processFee);

  return (
    <div className="space-y-4">
      {/* Disclaimer on balance types */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-3 text-[11px] text-[#A9A3B8] leading-relaxed">
        <strong>vVIRAL is your internal platform balance before real $VIRAL distribution becomes available after bonding/migration.</strong> No fake USD valuations or simulated prices are shown.
      </div>

      {/* Real TON Connect Connection Hub (Requirement 1, 6, 9) */}
      {!(tonAddress || user.wallet_address) ? (
        <div className="rounded-xl border border-[#38F8B0]/30 bg-gradient-to-br from-[#0B0618] to-[#38F8B0]/5 p-5 space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-24 w-24 bg-[#38F8B0]/10 blur-xl"></div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#38F8B0]/10 flex items-center justify-center text-[#38F8B0] shrink-0">
              <Wallet2 className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-sm font-extrabold text-white flex items-center gap-1.5">
                Connect TON Wallet
              </h3>
              <p className="text-xs text-[#A9A3B8] leading-relaxed">
                Connect your TON wallet to view real balance, check distribution logs, and claim your tokens on-chain.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="wallet-btn-connect-main"
            onClick={() => {
              if (tonConnectUI) {
                tonConnectUI.openModal();
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#38F8B0] hover:bg-[#38F8B0]/90 text-[#05020D] text-sm font-black py-3.5 transition-colors cursor-pointer shadow-lg shadow-[#38F8B0]/20"
          >
            <Wallet2 className="h-4 w-4" /> Connect Wallet
          </button>

          <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] text-amber-200/90 leading-relaxed font-sans">
            <strong>Security Protocol:</strong> $VIRAL App will never ask for your seed phrase, recovery keys, or private phrase. Only authorize operations from within safe wallet interfaces like Tonkeeper.
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-24 w-24 bg-[#38F8B0]/5 blur-xl"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#38F8B0] animate-pulse"></div>
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wide">
                TON Wallet Connected
              </span>
            </div>
            <button
              id="wallet-btn-disconnect"
              onClick={() => {
                if (tonConnectUI) {
                  tonConnectUI.disconnect();
                } else {
                  // Fallback: trigger backend disconnect directly if UI not available
                  fetch('/api/wallet/disconnect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                  }).then(() => onBalanceUpdated());
                }
              }}
              className="text-[10px] font-mono font-bold text-[#FF4D6D] bg-[#FF4D6D]/10 hover:bg-[#FF4D6D]/20 px-2.5 py-1 rounded border border-[#FF4D6D]/20 cursor-pointer transition-all"
            >
              Disconnect Wallet
            </button>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center text-[10px] bg-[#05020D]/80 border border-[#A9A3B8]/10 rounded p-2 text-[#A9A3B8]">
              <span className="shrink-0 font-bold text-white mr-1.5">Wallet:</span>
              <span className="truncate break-all text-[#38F8B0] font-bold select-all">
                {tonAddress || user.wallet_address}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
              <div className="bg-[#05020D]/60 border border-[#A9A3B8]/10 rounded p-2.5">
                <span className="text-[9px] text-[#A9A3B8] block mb-0.5 uppercase tracking-wider">Real TON Balance</span>
                {loadingRealBalances ? (
                  <span className="text-[#FFD36A] animate-pulse">Querying RPC...</span>
                ) : realTonBalance !== null ? (
                  <strong className="text-white text-xs font-extrabold">{realTonBalance.toFixed(4)} TON</strong>
                ) : (
                  <span className="text-[#A9A3B8]/60">Real balance unavailable</span>
                )}
              </div>

              <div className="bg-[#05020D]/60 border border-[#A9A3B8]/10 rounded p-2.5">
                <span className="text-[9px] text-[#A9A3B8] block mb-0.5 uppercase tracking-wider">Real GRAM Balance</span>
                {loadingRealBalances ? (
                  <span className="text-[#FFD36A] animate-pulse">Querying RPC...</span>
                ) : realGramBalance !== null ? (
                  <strong className="text-white text-xs font-extrabold">{realGramBalance.toFixed(4)} GRAM</strong>
                ) : (
                  <span className="text-[#A9A3B8]/60">Real balance unavailable</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 text-[10px]">
              <button
                type="button"
                id="wallet-btn-refresh-balance"
                onClick={() => fetchRealBalances(tonAddress || user.wallet_address || '')}
                disabled={loadingRealBalances}
                className="inline-flex items-center gap-1 text-[#38F8B0] hover:text-[#38F8B0]/80 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`h-3 w-3 ${loadingRealBalances ? 'animate-spin' : ''}`} /> Refresh Balance
              </button>
            </div>
          </div>

          {/* Security Warning Statement (Requirement 6) */}
          <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] text-amber-200/90 leading-relaxed font-sans">
            <strong>Security Protocol:</strong> $VIRAL App will never ask for your seed phrase, recovery keys, or private phrase. Only authorize operations from within safe wallet interfaces like Tonkeeper.
          </div>
        </div>
      )}

      {/* Balance Layers Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Layer 1: vVIRAL */}
        <div className="rounded-xl border border-[#FFD36A]/35 bg-gradient-to-br from-[#0B0618] to-[#FFD36A]/5 glass p-4 space-y-1.5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-24 w-24 bg-[#FFD36A]/5 blur-xl"></div>
          <Coins className="h-4 w-4 text-[#FFD36A]" />
          <div>
            <div className="stat-label">vVIRAL Balance (Internal)</div>
            <div className="mt-1 flex items-baseline gap-1 text-xl font-extrabold text-white">
              <span className="gold-text font-mono">{balance?.vviral_balance?.toLocaleString() || 0}</span>
              <span className="text-[10px] text-[#A9A3B8]">vVIRAL</span>
            </div>
            {balance?.vviral_pending > 0 && (
              <div className="text-[9px] text-[#FFD36A] mt-1 font-mono">
                • {balance.vviral_pending.toLocaleString()} pending audit
              </div>
            )}
          </div>
        </div>

        {/* Layer 2: Viral Power */}
        <div className="rounded-xl border border-[#8A2BFF]/35 bg-[#0B0618]/60 glass p-4 space-y-1.5 relative overflow-hidden">
          <Award className="h-4 w-4 text-[#B066FF]" />
          <div>
            <div className="stat-label">Viral Power Reputation</div>
            <div className="mt-1 flex items-baseline gap-1 text-xl font-extrabold text-[#B066FF]">
              <span className="font-mono">{balance?.viral_power || 0}</span>
              <span className="text-[10px] text-[#A9A3B8]">VP</span>
            </div>
            <div className="text-[9px] text-[#38F8B0] mt-1 font-mono">
              • Quality Rank: {user.quality_score}
            </div>
          </div>
        </div>

        {/* Layer 3: Real $VIRAL */}
        <div className="rounded-xl border border-[#38F8B0]/35 bg-gradient-to-br from-[#0B0618] to-[#38F8B0]/5 glass p-4 space-y-1.5 relative overflow-hidden">
          <Wallet2 className="h-4 w-4 text-[#38F8B0]" />
          <div>
            <div className="stat-label">Real $VIRAL (On-Chain)</div>
            <div className="mt-1 flex items-baseline gap-1 text-xl font-extrabold text-[#38F8B0]">
              <span className="font-mono">{balance?.real_viral_balance?.toLocaleString() || 0}</span>
              <span className="text-[10px] text-[#A9A3B8]">$VIRAL</span>
            </div>
            <div className="text-[9px] text-[#A9A3B8] mt-1 font-mono leading-normal">
              {tonAddress || user.wallet_address ? (
                <span className="text-[#38F8B0]">Real $VIRAL will become available after bonding/migration.</span>
              ) : (
                <span className="text-[#FF4D6D]">Connect wallet to view real balance</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Send & Claim actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Internal SEND (Section 20) */}
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
          <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Send className="h-4 w-4 text-[#B066FF]" /> Internal vVIRAL Transfer
          </h3>

          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">Recipient Username / Telegram ID</label>
              <input
                id="wallet-send-recipient"
                type="text"
                placeholder="e.g. TON_Sniper, 11223344"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2.5 text-xs text-white focus:border-[#8A2BFF] focus:outline-none placeholder-[#A9A3B8]/30"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono tracking-wider text-[#A9A3B8] uppercase mb-1">vVIRAL Amount</label>
              <input
                id="wallet-send-amount"
                type="number"
                placeholder="0"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="w-full rounded bg-[#05020D]/60 border border-[#A9A3B8]/10 p-2.5 text-xs text-white focus:border-[#8A2BFF] focus:outline-none placeholder-[#A9A3B8]/30"
              />
            </div>

            {/* Fee Preview */}
            {amtNum > 0 && (
              <div className="flex justify-between text-[10px] bg-[#05020D]/80 p-2 rounded border border-[#A9A3B8]/5 font-mono">
                <span className="text-[#A9A3B8]">Fee (1%): <strong className="text-white">{processFee} vVIRAL</strong></span>
                <span className="text-[#38F8B0]">Recipient gets: <strong className="font-black text-[#38F8B0]">{netSend} vVIRAL</strong></span>
              </div>
            )}

            {sendError && <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2 rounded">{sendError}</div>}
            {sendSuccess && <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 p-2 rounded">{sendSuccess}</div>}

            <button
              id="wallet-btn-send"
              type="submit"
              disabled={isSending}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8A2BFF] hover:bg-[#B066FF] text-xs font-bold py-2.5 text-white cursor-pointer transition-all"
            >
              {isSending ? 'Executing Transfer...' : 'Send vVIRAL'}
            </button>
          </form>
        </div>

        {/* Alpha vVIRAL Reward Preview (Section 5) */}
        <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3">
          <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownToLine className="h-4 w-4 text-[#FFD36A]" /> Alpha vVIRAL Reward Preview
          </h3>

          {claimInfo ? (
            <div className="space-y-3 text-xs text-[#A9A3B8]">
              {/* Alpha Status Indicator */}
              <div className="flex items-center gap-1.5 bg-[#FFD36A]/5 border border-[#FFD36A]/10 p-2 rounded-lg">
                <span className="h-2 w-2 rounded-full bg-[#FFD36A] animate-pulse"></span>
                <span className="text-[10px] font-bold text-[#FFD36A] uppercase font-mono">
                  Real Claim Not Active Yet (Alpha Stage)
                </span>
              </div>

              {/* Alpha Disclaimer */}
              <p className="text-[10px] text-[#A9A3B8] leading-relaxed font-sans bg-[#05020D]/40 p-2.5 rounded border border-[#A9A3B8]/5">
                <strong>Alpha Disclaimer:</strong> vVIRAL is an internal Alpha reward point. During Alpha, it shows your estimated future $VIRAL allocation at a 1:1 ratio. Real $VIRAL claim is not active yet and will be enabled only after the official launch.
              </p>

              {/* Claims parameters preview */}
              <div className="rounded-lg bg-[#05020D]/60 p-3 border border-[#A9A3B8]/5 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#A9A3B8]">Your Valid vVIRAL:</span>
                  <strong className="text-white">{claimInfo.userValidvViral?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9A3B8]">Total Ecosystem vVIRAL:</span>
                  <strong className="text-white">{claimInfo.totalValidvViral?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9A3B8]">Conversion Rate:</span>
                  <strong className="text-[#FFD36A]">1:1</strong>
                </div>
                <div className="flex justify-between border-t border-[#A9A3B8]/5 pt-1.5 mt-1">
                  <span className="text-white font-bold">Estimated Future $VIRAL Allocation:</span>
                  <strong className="text-[#38F8B0] text-xs font-black">{claimInfo.userValidvViral?.toLocaleString()} $VIRAL</strong>
                </div>
              </div>

              {/* Connected wallet validation */}
              <div className="text-[10px] leading-relaxed font-mono">
                {claimInfo.hasWallet ? (
                  <div className="flex items-center gap-1 text-[#38F8B0] bg-[#38F8B0]/5 border border-[#38F8B0]/10 p-2 rounded-lg">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">TON Connected: {claimInfo.wallet_address}</span>
                  </div>
                ) : (
                  <div className="text-[#FF4D6D] bg-[#FF4D6D]/5 border border-[#FF4D6D]/10 p-2 rounded-lg">
                    No wallet connected. Go to More {`>`} Profile to link TON wallet.
                  </div>
                )}
              </div>

              {claimError && <div className="text-[11px] text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 p-2 rounded">{claimError}</div>}
              {claimSuccess && <div className="text-[11px] text-[#38F8B0] bg-[#38F8B0]/10 border border-[#38F8B0]/20 p-2 rounded">{claimSuccess}</div>}

              <button
                type="button"
                disabled={true}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#38F8B0]/5 border border-[#38F8B0]/20 text-[#38F8B0]/50 text-xs font-bold py-2.5 disabled:opacity-50 cursor-not-allowed font-mono uppercase"
              >
                {claimInfo.hasWallet ? 'Claim Not Active Yet' : 'Connect Wallet to Prepare for Future Claim'}
              </button>
            </div>
          ) : (
            <div className="text-xs text-[#A9A3B8] font-mono">Loading preview parameters...</div>
          )}
        </div>
      </div>

      {/* Transaction History (Ledger Auditor) */}
      <div className="space-y-2">
        <h3 className="font-sans text-[10px] font-bold text-white uppercase tracking-wider">Transaction Ledger Audit</h3>

        {loadingTx ? (
          <div className="text-[11px] text-[#A9A3B8] font-mono">Loading transaction logs...</div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-[#A9A3B8]/10 bg-[#0B0618]/60 p-5 text-center text-xs text-[#A9A3B8]">
            No transactions found on ledger records. Complete tasks to initiate entries!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex gap-2 items-center justify-between p-2.5 rounded-lg border border-[#A9A3B8]/10 bg-[#0B0618]/40 glass hover:border-[#8A2BFF]/20 transition-all">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-[220px] uppercase tracking-tight">{tx.metadata}</div>
                  <div className="text-[8px] font-mono text-[#A9A3B8]">
                    {tx.id.substring(0, 8)} • {new Date(tx.created_at).toLocaleDateString()} • {tx.type.toUpperCase()}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-extrabold font-mono ${tx.direction === 'credit' ? 'text-[#38F8B0]' : 'text-[#FF4D6D]'}`}>
                    {tx.direction === 'credit' ? '+' : '-'}{tx.amount} {tx.currency}
                  </span>
                  <div className="text-[8px] font-mono font-bold text-[#38F8B0] uppercase tracking-wider">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
