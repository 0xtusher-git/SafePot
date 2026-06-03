"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, History, ArrowRight, Users, AlertCircle, Timer, Trophy, Loader2, Lock, Copy } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Contract, formatUnits, JsonRpcProvider, parseUnits } from "ethers";
import Link from "next/link";

const SAFEPOT_ADDRESS = process.env.NEXT_PUBLIC_SAFEPOT_ADDRESS || "0x51716a253fF07910DE9ADB5eC25B757C451d763f";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const SAFEPOT_ABI = [
  "function getGroup(uint256 groupId) external view returns (uint256 id, string name, uint256 maxMembers, uint256 contributionAmount, string roundDuration, address[] members, uint256 currentRound, uint256 potBalance, uint256 currentTurnIndex, bool isComplete, bool isPrivate, string inviteCode)",
  "function memberContributions(uint256, address) external view returns (uint256)",
  "function contribute(uint256 groupId) external",
  "event PotDistributed(uint256 indexed groupId, address winner, uint256 amount)"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const avatarColors = ["#1B4332","#2D6A4F","#40916C","#52B788","#74C69D", "#004B23", "#38B000", "#70E000", "#9EF01A", "#CCFF33"];

type Member = {
  address: string;
  hasPaid: boolean;
  isNext: boolean;
};

type HistoryEvent = {
  round: number;
  winner: string;
  amount: number;
  txHash: string;
};

type GroupData = {
  id: number;
  name: string;
  amount: number;
  duration: string;
  currentRound: number;
  potSize: number;
  potBalance: number;
  isComplete: boolean;
  isPrivate: boolean;
  inviteCode: string;
  maxMembers: number;
  members: Member[];
  history: HistoryEvent[];
};

export default function GroupDetail() {
  const { id } = useParams();
  const { isConnected, isTrusted, provider, signer, address, displayNames } = useWeb3();
  const [mounted, setMounted] = useState(false);
  
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributing, setContributing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fallback UI Timer
  const [timeLeft, setTimeLeft] = useState({ days: 5, hours: 8, minutes: 22, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
            else { hours = 23; if (days > 0) days--; }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mounted && id) {
      fetchGroupDetails();
    }
  }, [mounted, id, provider]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const rpcProvider = provider || new JsonRpcProvider("https://rpc.testnet.arc.network");
      const safePot = new Contract(SAFEPOT_ADDRESS, SAFEPOT_ABI, rpcProvider);
      
      const groupId = Number(id);
      
      // Fetch core group data — try new ABI first, fall back to old if contract not upgraded yet
      let data: any;
      let contractIsPrivate = false;
      let contractInviteCode = "";

      try {
        data = await safePot.getGroup(groupId);
        // New contract returns isPrivate and inviteCode
        contractIsPrivate = data.isPrivate ?? false;
        contractInviteCode = data.inviteCode ?? "";
      } catch (abiErr: any) {
        // BAD_DATA means old contract without isPrivate/inviteCode — use fallback ABI
        if (abiErr?.code === "BAD_DATA" || abiErr?.code === "INVALID_ARGUMENT") {
          console.warn("[SafePot] Falling back to legacy getGroup ABI (contract not yet upgraded)");
          const legacyABI = [
            "function getGroup(uint256 groupId) external view returns (uint256 id, string name, uint256 maxMembers, uint256 contributionAmount, string roundDuration, address[] members, uint256 currentRound, uint256 potBalance, uint256 currentTurnIndex, bool isComplete)",
            "function memberContributions(uint256, address) external view returns (uint256)",
            "event PotDistributed(uint256 indexed groupId, address winner, uint256 amount)"
          ];
          const legacySafePot = new Contract(SAFEPOT_ADDRESS, legacyABI, rpcProvider);
          data = await legacySafePot.getGroup(groupId);
          contractIsPrivate = false;
          contractInviteCode = "";
        } else {
          throw abiErr;
        }
      }
      
      if (Number(data.id) === 0) {
        setError("Group not found");
        setLoading(false);
        return;
      }
      
      const currentRound = Number(data.currentRound);
      const contributionAmount = Number(formatUnits(data.contributionAmount, 6));
      const maxMembers = Number(data.maxMembers);
      const currentTurnIndex = Number(data.currentTurnIndex);
      
      // Fetch members and their payment status
      const members: Member[] = [];
      const rawMembers: string[] = data.members;
      
      for (let i = 0; i < rawMembers.length; i++) {
        const memberAddress = rawMembers[i];
        const contributionRound = await safePot.memberContributions(groupId, memberAddress);
        const hasPaid = Number(contributionRound) >= currentRound;
        const isNext = i === currentTurnIndex && !data.isComplete;
        
        members.push({
          address: memberAddress,
          hasPaid,
          isNext
        });
      }
      
      // Fetch History safely in chunks to avoid 10k limit
      const latestBlock = await rpcProvider.getBlockNumber();
      let events: any[] = [];
      const filter = safePot.filters.PotDistributed(groupId);
      let fromBlock = Math.max(0, latestBlock - 100000); // look back ~100k blocks max
      
      while (fromBlock <= latestBlock) {
        let toBlock = Math.min(fromBlock + 9999, latestBlock);
        try {
          const chunkEvents = await safePot.queryFilter(filter, fromBlock, toBlock);
          events = [...events, ...chunkEvents];
        } catch (e) {
          console.warn(`Failed logs from ${fromBlock} to ${toBlock}`, e);
        }
        fromBlock = toBlock + 1;
      }
      
      const history: HistoryEvent[] = events.map((event: any, index: number) => {
        return {
          round: index + 1,
          winner: event.args[1],
          amount: Number(formatUnits(event.args[2], 6)),
          txHash: event.transactionHash
        };
      }).reverse(); // Newest first

      setGroup({
        id: groupId,
        name: data.name,
        amount: contributionAmount,
        duration: data.roundDuration,
        currentRound: currentRound,
        potSize: contributionAmount * maxMembers,
        potBalance: Number(formatUnits(data.potBalance, 6)),
        isComplete: data.isComplete,
        isPrivate: contractIsPrivate,
        inviteCode: contractInviteCode,
        maxMembers: maxMembers,
        members: members,
        history: history
      });
      
    } catch (err) {
      console.error(err);
      setError("Failed to fetch group details.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const handleContribute = async () => {
    if (!isConnected || !signer) { alert("Please connect wallet"); return; }
    // Only enforce trust score for PUBLIC groups — private groups bypass this check
    if (!group?.isPrivate && !isTrusted) { alert("Trust score too low for public groups. Improve at arc-grade.vercel.app"); return; }
    if (!group) return;
    
    setContributing(true);
    try {
      const usdcAmount = parseUnits(group.amount.toString(), 6);
      
      // 1. Check/Approve USDC
      const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
      const safePot = new Contract(SAFEPOT_ADDRESS, SAFEPOT_ABI, signer);
      
      try {
        const allowance = await usdc.allowance(address, SAFEPOT_ADDRESS);
        if (allowance < usdcAmount) {
          console.log("Requesting approval...");
          const approveTx = await usdc.approve(SAFEPOT_ADDRESS, usdcAmount);
          await approveTx.wait();
        }
      } catch (err) {
        console.warn("Allowance check failed, proceeding to approve anyway", err);
        const approveTx = await usdc.approve(SAFEPOT_ADDRESS, usdcAmount);
        await approveTx.wait();
      }
      
      // 2. Contribute
      console.log("Contributing...");
      
      const feeData = await signer.provider?.getFeeData();
      const txOptions = feeData?.gasPrice ? { gasPrice: feeData.gasPrice } : {};
      
      const tx = await safePot.contribute(group.id, txOptions);
      alert("Contribution transaction sent! Waiting for confirmation...");
      await tx.wait();
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      alert("Successfully contributed!");
      fetchGroupDetails(); // Refresh
      
    } catch (err: any) {
      console.error(err);
      alert("Transaction failed: " + (err.reason || err.message));
    } finally {
      setContributing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-forest animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Fetching group data from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-6">{error || "Could not load group"}</p>
          <Link href="/browse" className="bg-forest text-white px-6 py-2 rounded-full font-bold inline-block">Back to Browse</Link>
        </div>
      </div>
    );
  }

  const paidCount = group.members.filter(m => m.hasPaid).length;
  const progressPercent = group.members.length === 0 ? 0 : (paidCount / group.members.length) * 100;
  
  const isMember = address ? group.members.some(m => m.address.toLowerCase() === address.toLowerCase()) : false;
  const myMemberInfo = isMember ? group.members.find(m => m.address.toLowerCase() === address!.toLowerCase()) : null;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-4xl font-extrabold text-gray-900">{group.name}</h1>
              <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {group.duration}
              </span>
              {group.isPrivate && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Private
                </span>
              )}
              {group.isComplete && (
                <span className="bg-gray-200 text-gray-700 border border-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Cycle Completed
                </span>
              )}
            </div>
            <p className="text-gray-500 font-medium">ID: {group.id} • {group.amount} USDC per round</p>
          </div>
          {isConnected && isMember && !group.isComplete && (
            <div className="flex gap-3 flex-wrap">
              {myMemberInfo?.hasPaid ? (
                <button disabled className="px-6 py-2 bg-gray-100 text-gray-400 rounded-full font-bold border border-gray-200 shadow-sm cursor-not-allowed flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> Paid for Round {group.currentRound}
                </button>
              ) : (
                <button onClick={handleContribute} disabled={contributing}
                  className={`px-6 py-2 rounded-full transition-all font-bold shadow-md flex items-center gap-2 ${contributing ? 'bg-forest/70 text-white cursor-not-allowed' : 'bg-forest hover:bg-forest/90 text-white hover:shadow-lg hover:-translate-y-0.5'}`}>
                  {contributing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-gold" />} 
                  {contributing ? 'Confirming...' : `Contribute ${group.amount} USDC`}
                </button>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Invite Link Panel — visible only to group members for private groups */}
            {group.isPrivate && isMember && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Private Group — Invite Link
                </h2>
                <p className="text-xs text-amber-600 mb-3">Share this link with trusted members to let them join. Only people with this link can join.</p>
                <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-2xl p-3">
                  <span className="font-mono text-xs text-gray-700 break-all flex-1">{`${window.location.origin}/join/${group.inviteCode}`}</span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${group.inviteCode}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors flex-shrink-0">
                    <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </motion.div>
            )}
            {/* Countdown */}
            {!group.isComplete && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-forest" /> Round Deadline
                </h2>
                <div className="flex gap-4 justify-center">
                  {[
                    { label: "Days", val: timeLeft.days },
                    { label: "Hours", val: timeLeft.hours },
                    { label: "Min", val: timeLeft.minutes },
                    { label: "Sec", val: timeLeft.seconds },
                  ].map(t => (
                    <div key={t.label} className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 min-w-[64px]">
                      <span className="text-3xl font-extrabold text-forest tabular-nums" suppressHydrationWarning>
                        {String(t.val).padStart(2, "0")}
                      </span>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{t.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Round Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm border-l-4 ${group.isComplete ? 'border-l-gray-300' : 'border-l-forest'}`}>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {group.isComplete ? "Final Pot Distributed" : `Round ${group.currentRound} Progress`}
                  </h2>
                  <p className="text-gray-400 text-sm font-medium">Target: {group.potSize} USDC</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-forest">{group.potBalance}
                    <span className="text-base text-gray-400 font-semibold ml-1">USDC</span>
                  </p>
                  <p className="text-xs text-gray-400 font-medium">{Math.round(group.isComplete ? 100 : progressPercent)}% collected</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${group.isComplete ? 100 : progressPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={`${group.isComplete ? 'bg-gray-400' : 'bg-forest'} h-full rounded-full`} />
              </div>
              {!group.isComplete && (
                <p className="text-gray-500 text-sm font-medium">{paidCount} of {group.maxMembers} spots have paid their contribution this round.</p>
              )}
            </motion.div>

            {/* Members List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-forest" /> Member Roster
              </h2>
              
              {group.members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-medium">No members have joined yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {group.members.map((member, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${member.isNext ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ background: avatarColors[i % avatarColors.length] }}>
                          {member.address.slice(2, 4).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-mono text-gray-800 text-sm font-semibold">
                            {displayNames[member.address.toLowerCase()] || `${member.address.slice(0, 8)}...${member.address.slice(-6)}`}
                          </p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Status:
                            {group.isComplete ? (
                              <span className="ml-1 text-gray-500 font-bold">Finished</span>
                            ) : member.hasPaid ? (
                              <span className="ml-1 text-green-600 font-bold">✓ Paid</span>
                            ) : (
                              <span className="ml-1 text-red-500 font-bold">✗ Pending</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isNext && !group.isComplete && (
                          <span className="bg-gold text-forest text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            Receives Pot Next
                          </span>
                        )}
                        {!group.isComplete && (
                          member.hasPaid
                            ? <ShieldCheck className="w-5 h-5 text-green-500" />
                            : <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pot Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className={`${group.isComplete ? 'bg-gray-500 border-gray-600' : 'bg-forest border-forest'} border rounded-3xl p-6 shadow-md text-center`}>
              <Trophy className={`w-8 h-8 mx-auto mb-2 ${group.isComplete ? 'text-gray-300' : 'text-gold'}`} />
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">
                {group.isComplete ? "Final Pot" : "Current Pot"}
              </p>
              <p className="text-4xl font-extrabold text-white mb-1">{group.potBalance}</p>
              <p className="text-white/70 font-bold text-sm mb-4">USDC</p>
              
              {group.isComplete ? (
                <div className="w-full bg-gray-600 text-white/50 font-bold py-3 rounded-full text-sm">
                  Cycle Completed
                </div>
              ) : (
                <div className="w-full bg-forest text-white/80 border border-white/20 font-bold py-3 rounded-full text-sm">
                  Distribution occurs automatically
                </div>
              )}
            </motion.div>

            {/* Round History */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-forest" /> Round History
              </h2>
              
              {group.history.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4 font-medium">No rounds completed yet.</p>
              ) : (
                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                  {group.history.map((hist, i) => (
                    <div key={i} className="relative pl-6 border-l-2 border-gray-100 last:border-l-0 pb-5 last:pb-0">
                      <div className="absolute w-3 h-3 bg-forest rounded-full -left-[7px] top-1 shadow-sm"></div>
                      <h3 className="text-gray-900 font-bold mb-1 text-sm">Round {hist.round} Complete</h3>
                      <p className="text-xs text-gray-400 font-medium mb-2">Pot distributed to:</p>
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                        <span className="font-mono text-xs text-forest font-semibold" title={hist.winner}>
                          {displayNames[hist.winner.toLowerCase()] || `${hist.winner.slice(0, 6)}...${hist.winner.slice(-4)}`}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-extrabold text-gray-900 ml-auto">{hist.amount} USDC</span>
                      </div>
                      <Link href={`https://explorer.testnet.arc.network/tx/${hist.txHash}`} target="_blank" className="text-forest text-[10px] mt-2 block hover:underline font-semibold">
                        View Transaction
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
