"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, History, Users, Timer, TrendingUp, AlertCircle, Gift, Loader2, Edit2, Check, X, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Contract, formatUnits, JsonRpcProvider } from "ethers";
import { useWalletDetailsModal } from "thirdweb/react";
import { client } from "@/lib/thirdwebClient";

const SAFEPOT_ADDRESS = process.env.NEXT_PUBLIC_SAFEPOT_ADDRESS || "0x51716a253fF07910DE9ADB5eC25B757C451d763f";

const SAFEPOT_ABI = [
  "function nextGroupId() external view returns (uint256)",
  "function getGroup(uint256 groupId) external view returns (uint256 id, string name, uint256 maxMembers, uint256 contributionAmount, string roundDuration, address[] members, uint256 currentRound, uint256 potBalance, uint256 currentTurnIndex, bool isComplete)",
  "function memberContributions(uint256, address) external view returns (uint256)",
  "function pendingInstallments(uint256, address) external view returns (uint256)",
  "function installmentAmount(uint256, address) external view returns (uint256)",
  "event ContributionMade(uint256 indexed groupId, address member, uint256 amount)",
  "event PotDistributed(uint256 indexed groupId, address winner, uint256 amount)"
];

type ActiveGroup = {
  id: number;
  name: string;
  amount: number;
  duration: string;
  membersCount: number;
  maxMembers: number;
  currentRound: number;
  potBalance: number;
  isTurn: boolean;
  hasPaid: boolean;
  potSize: number;
  isComplete: boolean;
  pendingInstallments: number;
  installmentAmount: number;
};

type Activity = {
  type: "contribution" | "win";
  groupId: number;
  groupName: string;
  amount: number;
  txHash: string;
  blockNumber: number;
};

export default function Dashboard() {
  const { isConnected, isTrusted, trustScore, address, provider, displayNames, setDisplayName, loginMethod, userEmail } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  
  const [activeGroups, setActiveGroups] = useState<ActiveGroup[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const detailsModal = useWalletDetailsModal();

  // Fallback timer just for UI aesthetic (can't determine exact on-chain deadline without block timestamps)
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 30, seconds: 0 });

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
            else {
              hours = 23;
              if (days > 0) days--;
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isConnected && address && provider) {
      fetchDashboardData();
    }
  }, [isConnected, address, provider]);

  const fetchDashboardData = async () => {
    if (!provider) return;
    setLoading(true);
    try {
      const safePot = new Contract(SAFEPOT_ADDRESS, SAFEPOT_ABI, provider);
      
      const nextIdBigInt = await safePot.nextGroupId();
      const nextId = Number(nextIdBigInt);
      
      const myGroups: ActiveGroup[] = [];
      const groupNames: Record<number, string> = {};
      
      // 1. Fetch Groups
      for (let i = 1; i < nextId; i++) {
        const groupData = await safePot.getGroup(i);
        groupNames[i] = groupData.name;
        
        const membersArray: string[] = groupData.members;
        
        // Is user in this group?
        const isMember = membersArray.map(m => m.toLowerCase()).includes(address!.toLowerCase());
        
        if (isMember) {
          const currentRound = Number(groupData.currentRound);
          // Check if paid for current round
          const contributionRound = await safePot.memberContributions(i, address);
          const hasPaid = Number(contributionRound) >= currentRound;
          
          const isTurn = membersArray.length > 0 && membersArray[Number(groupData.currentTurnIndex)]?.toLowerCase() === address!.toLowerCase();
          
          let pInstallments = 0;
          let instAmount = 0;
          try {
            const pInstBigInt = await safePot.pendingInstallments(i, address);
            const instAmtBigInt = await safePot.installmentAmount(i, address);
            pInstallments = Number(pInstBigInt);
            instAmount = Number(formatUnits(instAmtBigInt, 6));
          } catch (e) {
            console.warn("Could not fetch installments (old contract?)", e);
          }
          
          myGroups.push({
            id: i,
            name: groupData.name,
            amount: Number(formatUnits(groupData.contributionAmount, 6)),
            duration: groupData.roundDuration,
            membersCount: membersArray.length,
            maxMembers: Number(groupData.maxMembers),
            currentRound: currentRound,
            potBalance: Number(formatUnits(groupData.potBalance, 6)),
            isTurn: isTurn,
            hasPaid: hasPaid,
            potSize: Number(formatUnits(groupData.contributionAmount, 6)) * Number(groupData.maxMembers),
            isComplete: groupData.isComplete,
            pendingInstallments: pInstallments,
            installmentAmount: instAmount
          });
        }
      }
      
      myGroups.sort((a, b) => b.id - a.id);
      setActiveGroups(myGroups);

      // 2. Fetch Activity Events safely in chunks to avoid 10k RPC limit
      const activities: Activity[] = [];
      const latestBlock = await provider.getBlockNumber();
      
      const filterContribution = safePot.filters.ContributionMade(null, address);
      const filterWin = safePot.filters.PotDistributed(null, address);
      
      let contribEvents: any[] = [];
      let winEvents: any[] = [];
      
      let fromBlock = Math.max(0, latestBlock - 100000); // look back ~100k blocks max
      while (fromBlock <= latestBlock) {
        let toBlock = Math.min(fromBlock + 9999, latestBlock);
        try {
          const [cEvents, wEvents] = await Promise.all([
            safePot.queryFilter(filterContribution, fromBlock, toBlock),
            safePot.queryFilter(filterWin, fromBlock, toBlock)
          ]);
          contribEvents = [...contribEvents, ...cEvents];
          winEvents = [...winEvents, ...wEvents];
        } catch (e) {
          console.warn(`Failed logs from ${fromBlock} to ${toBlock}`, e);
        }
        fromBlock = toBlock + 1;
      }
      let calculatedTotalSaved = 0;
      
      for (const event of contribEvents) {
        if (!event || !('args' in event)) continue;
        const groupId = Number(event.args[0]);
        activities.push({
          type: "contribution",
          groupId,
          groupName: groupNames[groupId] || `Group ${groupId}`,
          amount: Number(formatUnits(event.args[2], 6)),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }
      
      for (const event of winEvents) {
        if (!event || !('args' in event)) continue;
        const groupId = Number(event.args[0]);
        const amount = Number(formatUnits(event.args[2], 6));
        calculatedTotalSaved += amount;
        
        activities.push({
          type: "win",
          groupId,
          groupName: groupNames[groupId] || `Group ${groupId}`,
          amount,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }
      
      activities.sort((a, b) => b.blockNumber - a.blockNumber);
      
      setRecentActivity(activities.slice(0, 5)); // Keep latest 5
      setTotalSaved(calculatedTotalSaved);
      
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-light min-h-[60vh]">
        <p className="text-xl text-gray-500 font-medium">Please connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  const triggerConfetti = (e: React.MouseEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1B4332', '#F4C430', '#2D6A4F']
    });
  };

  const scoreColor = trustScore === null ? "#9CA3AF" : trustScore >= 80 ? "#10B981" : trustScore >= 50 ? "#FBBF24" : "#EF4444";
  const strokeDashoffset = trustScore ? 283 - (283 * trustScore) / 100 : 283;

  return (
    <div className="flex-1 bg-light w-full">
      <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Dashboard</h1>
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-forest"
                    autoFocus
                    maxLength={20}
                  />
                  <button onClick={() => {
                    if (address && draftName.trim()) {
                      setDisplayName(address, draftName.trim());
                    }
                    setIsEditingName(false);
                  }} className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded-md">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-md">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 font-medium flex items-center gap-2">
                  Welcome back, <span className="text-gray-900 font-bold">{address ? (displayNames[address.toLowerCase()] || `${address.slice(0, 6)}...${address.slice(-4)}`) : ""}</span>
                  <button onClick={() => {
                    setDraftName(address ? (displayNames[address.toLowerCase()] || "") : "");
                    setIsEditingName(true);
                  }} className="text-gray-400 hover:text-forest transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </p>
              )}
            </div>
          </div>
          <Link 
            href="/create-group"
            className="bg-forest text-white font-bold px-6 py-3 rounded-full hover:bg-forest/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            + Create New Group
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trust Score Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-6">ArcGrade Trust Score</h3>
            
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <span className="text-4xl font-extrabold text-gray-900 relative z-10">{trustScore ?? "--"}</span>
            </div>
            
            {isTrusted ? (
              <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200 flex items-center gap-2 shadow-sm">
                <ShieldCheck className="w-4 h-4" /> Trusted Wallet
              </span>
            ) : (
              <span className="bg-red-50 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold border border-red-200 flex items-center gap-1 shadow-sm">
                <AlertCircle className="w-4 h-4" /> Untrusted Wallet
              </span>
            )}
            <Link href="/my-score" className="text-forest text-xs mt-4 font-semibold hover:underline">
              View Details
            </Link>
          </motion.div>

          {/* Stats Cards */}
          <div className="md:col-span-2 grid grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow relative">
              {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-3xl z-10"><Loader2 className="w-6 h-6 animate-spin text-forest" /></div>}
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="text-forest w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold text-xs mb-1 uppercase tracking-wider">Total Won</p>
              <h2 className="text-3xl font-extrabold text-gray-900">{totalSaved.toLocaleString()} <span className="text-xl text-gray-400 font-semibold">USDC</span></h2>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow relative">
              {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-3xl z-10"><Loader2 className="w-6 h-6 animate-spin text-forest" /></div>}
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                <Users className="text-gold w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold text-xs mb-1 uppercase tracking-wider">Active Groups</p>
              <h2 className="text-3xl font-extrabold text-gray-900">{activeGroups.filter(g => !g.isComplete).length}</h2>
            </motion.div>
          </div>
        </div>

        {/* My Wallet Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">My Wallet</h2>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500 font-medium text-sm">Address:</span>
              <span className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded-md text-sm border border-gray-200">{address}</span>
            </div>
            {loginMethod === "thirdweb" && userEmail && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 font-medium text-sm">Email:</span>
                <span className="flex items-center gap-1.5 text-gray-700 font-semibold text-sm bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />{userEmail}
                </span>
              </div>
            )}
            {loginMethod === "thirdweb" && (
              <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Never share your private key with anyone.
              </p>
            )}
          </div>
          {loginMethod === "thirdweb" && (
            <button
              onClick={() => detailsModal.open({ client, screen: "export" })}
              className="bg-gray-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md text-sm"
            >
              Export Private Key
            </button>
          )}
        </div>

        {/* Active Groups Section */}
        <div className="flex justify-between items-center mt-8 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Timer className="text-forest w-6 h-6" /> My Groups
          </h2>
        </div>
        
        {loading ? (
           <div className="py-12 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm">
             <Loader2 className="w-8 h-8 text-forest animate-spin mb-3" />
             <p className="text-gray-500 font-medium">Loading your groups...</p>
           </div>
        ) : activeGroups.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No groups yet</h3>
            <p className="text-gray-400 font-medium mb-6">You haven't joined any savings groups.</p>
            <Link href="/browse" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-2.5 rounded-full transition-colors">
              Browse Groups
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {activeGroups.map((group, i) => {
                const fillPercent = group.membersCount === 0 ? 0 : (group.potBalance / group.potSize) * 100;
                
                return (
                  <Link href={`/group/${group.id}`} key={group.id} className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between border-l-4 ${group.isComplete ? 'border-l-gray-300 opacity-80' : group.isTurn ? 'border-l-gold' : 'border-l-forest'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-forest transition-colors">{group.name}</h3>
                        <p className="text-gray-500 text-sm font-medium mt-1">{group.duration || "Monthly"} • {group.amount} USDC/round</p>
                      </div>
                      {group.isComplete ? (
                         <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200">
                           Completed
                         </span>
                      ) : group.isTurn ? (
                         <span className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-200 flex items-center gap-1">
                           <Gift className="w-3 h-3" /> Your Turn!
                         </span>
                      ) : (
                         <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200">
                           Round {group.currentRound}
                         </span>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                        <span>Round {group.currentRound} Progress</span>
                        <span>{Math.round(fillPercent)}% Filled</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          initial={{ width: 0 }} whileInView={{ width: `${fillPercent}%` }} transition={{ duration: 1 }}
                          className={`${group.isComplete ? 'bg-gray-400' : group.isTurn ? 'bg-gold' : 'bg-forest'} h-full rounded-full`}
                        ></motion.div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                        <div className="flex -space-x-2">
                          {Array.from({ length: group.membersCount }).map((_, idx) => (
                            <div key={idx} className={`w-6 h-6 rounded-full border-2 border-white ${idx < (group.potBalance / group.amount) ? 'bg-forest' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 font-bold">{group.potBalance} / {group.potSize} USDC</p>
                          <p>Current Pot</p>
                        </div>
                      </div>
                      
                      {group.pendingInstallments > 0 && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-amber-800 uppercase">Pending Payout</p>
                            <p className="text-[10px] text-amber-700">Releases gradually each round</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-amber-700">{group.pendingInstallments * group.installmentAmount} USDC</p>
                            <p className="text-[10px] text-amber-600 font-medium">in {group.pendingInstallments} payments</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                      {!group.isComplete && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                          <Timer className="w-4 h-4 text-forest" />
                          <span suppressHydrationWarning>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
                        </div>
                      )}
                      
                      {group.isComplete ? (
                        <button className="text-gray-400 font-bold text-sm ml-auto">Cycle Finished</button>
                      ) : group.hasPaid ? (
                        <button className="text-gray-400 font-bold text-sm ml-auto">Paid ✅</button>
                      ) : (
                        <button className="text-forest font-bold text-sm hover:underline ml-auto">Contribute →</button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* History */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <History className="text-forest w-6 h-6" /> Recent Activity
        </h2>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm min-h-[100px] relative">
          {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-forest" /></div>}
          
          {!loading && recentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">No activity yet.</div>
          ) : (
            recentActivity.map((activity, i) => (
              <div key={i} className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors last:border-b-0">
                <div className="flex flex-col">
                   <span className="text-gray-900 font-bold text-sm">
                     {activity.type === 'contribution' ? `Contributed to ${activity.groupName}` : `Won Pot in ${activity.groupName}`}
                   </span>
                   <Link href={`https://explorer.testnet.arc.network/tx/${activity.txHash}`} target="_blank" className="text-forest text-xs hover:underline">
                     Block {activity.blockNumber} • View Tx
                   </Link>
                </div>
                <span className={`font-bold font-mono ${activity.type === 'contribution' ? 'text-gray-900' : 'text-green-600'}`}>
                  {activity.type === 'contribution' ? '-' : '+'}{activity.amount} USDC
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
