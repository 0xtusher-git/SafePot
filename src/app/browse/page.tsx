"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShieldAlert, Users, Filter, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Contract, JsonRpcProvider, formatUnits } from "ethers";

const SAFEPOT_ADDRESS = process.env.NEXT_PUBLIC_SAFEPOT_ADDRESS || "0x51716a253fF07910DE9ADB5eC25B757C451d763f";

const SAFEPOT_ABI = [
  "function nextGroupId() external view returns (uint256)",
  "function getGroup(uint256 groupId) external view returns (uint256 id, string name, uint256 maxMembers, uint256 contributionAmount, string roundDuration, address[] members, uint256 currentRound, uint256 potBalance, uint256 currentTurnIndex, bool isComplete, bool isPrivate, string inviteCode)"
];

type Group = {
  id: number;
  name: string;
  members: number;
  maxMembers: number;
  amount: number;
  duration: string;
  isComplete: boolean;
};

const durationColors: Record<string, string> = {
  weekly: "bg-blue-50 text-blue-700 border-blue-200",
  biweekly: "bg-purple-50 text-purple-700 border-purple-200",
  monthly: "bg-green-50 text-green-700 border-green-200",
};

export default function BrowseGroups() {
  const { isConnected, isTrusted, provider, signer } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const [filterAmount, setFilterAmount] = useState<string>("all");
  const [filterDuration, setFilterDuration] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchGroups();
  }, [provider]); // Re-fetch if provider changes (e.g. user connects/disconnects)

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use connected provider, OR fallback to public Arc Testnet RPC if unconnected
      const rpcProvider = provider || new JsonRpcProvider("https://rpc.testnet.arc.network");
      
      const safePot = new Contract(SAFEPOT_ADDRESS, SAFEPOT_ABI, rpcProvider);
      
      const nextIdBigInt = await safePot.nextGroupId();
      const nextId = Number(nextIdBigInt);
      
      const fetchedGroups: Group[] = [];
      
      // Loop backwards to show newest first, starting from nextId - 1 down to 1
      for (let i = nextId - 1; i >= 1; i--) {
        try {
          const groupData = await safePot.getGroup(i);
          
          // Skip private groups — they should not appear on the public browse page
          if (groupData.isPrivate) continue;
          
          fetchedGroups.push({
            id: Number(groupData.id),
            name: groupData.name,
            members: groupData.members.length,
            maxMembers: Number(groupData.maxMembers),
            amount: Number(formatUnits(groupData.contributionAmount, 6)), // USDC has 6 decimals
            duration: groupData.roundDuration,
            isComplete: groupData.isComplete
          });
        } catch (err) {
          console.error(`Failed to fetch group ${i}`, err);
        }
      }
      
      setGroups(fetchedGroups);
    } catch (err) {
      console.error("Failed to fetch nextGroupId", err);
      setError("Failed to connect to the SafePot contract. Please check your network or contract address.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const filteredGroups = groups.filter(g => {
    if (filterAmount !== "all") {
      if (filterAmount === "under100" && g.amount >= 100) return false;
      if (filterAmount === "100-300" && (g.amount < 100 || g.amount > 300)) return false;
      if (filterAmount === "over300" && g.amount <= 300) return false;
    }
    if (filterDuration !== "all" && g.duration !== filterDuration) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleJoin = async (groupId: number) => {
    if (!isConnected || !signer) { alert("Please connect your wallet first."); return; }
    if (!isTrusted) { alert("Your wallet trust score is too low. Improve at arc-grade.vercel.app"); return; }
    
    try {
      const safePot = new Contract(SAFEPOT_ADDRESS, [
        "function joinGroup(uint256 groupId) external"
      ], signer);

      const feeData = await signer.provider?.getFeeData();
      const txOptions = feeData?.gasPrice ? { gasPrice: feeData.gasPrice } : {};

      const tx = await safePot.joinGroup(groupId, txOptions);
      alert("Transaction sent! Waiting for confirmation...");
      await tx.wait();
      alert("Successfully joined group!");
      fetchGroups(); // refresh groups
    } catch (err: any) {
      console.error(err);
      alert("Transaction failed: " + (err.reason || err.message || "Unknown error"));
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Browse Groups</h1>
          <p className="text-gray-500 font-medium text-lg">Find a trust-gated savings pool that matches your goals.</p>
        </motion.div>

        {/* Search + Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-8 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={filterAmount} onChange={e => setFilterAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-forest text-sm font-medium appearance-none cursor-pointer">
                <option value="all">Any Amount</option>
                <option value="under100">&lt; 100 USDC</option>
                <option value="100-300">100–300 USDC</option>
                <option value="over300">&gt; 300 USDC</option>
              </select>
            </div>
            <select value={filterDuration} onChange={e => setFilterDuration(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-forest text-sm font-medium appearance-none cursor-pointer">
              <option value="all">Any Duration</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </motion.div>

        {/* Alerts */}
        {!isConnected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-8 flex items-center gap-3 shadow-sm">
            <ShieldAlert className="text-amber-500 w-5 h-5 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">Connect your wallet to verify your ArcGrade score and join groups.</p>
          </motion.div>
        )}
        {isConnected && !isTrusted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 p-4 rounded-xl mb-8 flex items-center gap-3 shadow-sm">
            <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              Your wallet trust score is too low.{" "}
              <a href="https://arc-grade.vercel.app" target="_blank" rel="noreferrer" className="underline font-bold">Improve your score →</a>
            </p>
          </motion.div>
        )}
        
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 p-4 rounded-xl mb-8 flex items-center gap-3 shadow-sm">
            <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-forest animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Fetching active groups from blockchain...</p>
          </div>
        )}

        {/* Group Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredGroups.map((group, i) => {
                const fill = (group.members / group.maxMembers) * 100;
                const potSize = group.amount * group.maxMembers;
                const isFull = group.members >= group.maxMembers;
                
                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.10)" }}
                    className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5 border-l-4 cursor-pointer relative overflow-hidden ${isFull || group.isComplete ? 'border-l-gray-300 opacity-75' : 'border-l-forest'}`}
                  >
                    {group.isComplete && (
                      <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Completed
                      </div>
                    )}
                    {isFull && !group.isComplete && (
                      <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Full
                      </div>
                    )}
                    
                    {/* Card Header */}
                    <div className="flex justify-between items-start mt-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                        <p className="text-gray-500 text-sm font-medium mt-0.5">{group.amount} USDC per round</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${durationColors[group.duration] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {group.duration || "monthly"}
                        </span>
                        <span className="text-xs font-bold text-gold bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-lg">
                          🏆 {potSize.toLocaleString()} USDC pot
                        </span>
                      </div>
                    </div>

                    {/* Member Avatars */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {Array.from({ length: group.members }).map((_, j) => (
                          <div key={j} className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-forest to-teal flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {String.fromCharCode(65 + (j % 26))}
                          </div>
                        ))}
                        {Array.from({ length: group.maxMembers - group.members }).map((_, j) => (
                          <div key={`empty-${j}`} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shadow-sm">
                            <Users className="w-3 h-3 text-gray-400" />
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-600 ml-1">{group.members}/{group.maxMembers} joined</span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                        <span>Spots filled</span>
                        <span className={isFull ? "text-gray-500" : "text-forest"}>{Math.round(fill)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fill}%` }}
                          transition={{ duration: 1 }}
                          className={`h-full rounded-full ${isFull ? 'bg-gray-400' : 'bg-forest'}`}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Link href={`/group/${group.id}`}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-center py-2.5 rounded-xl transition-colors text-sm font-bold">
                        View Details
                      </Link>
                      <button onClick={() => handleJoin(group.id)}
                        disabled={!isTrusted || isFull || group.isComplete}
                        className={`flex-1 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-1 
                          ${!isTrusted || isFull || group.isComplete 
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                            : "bg-forest hover:bg-forest/90 text-white shadow-sm"}`}>
                        {isFull ? "Group Full" : "Join Group"} {!isFull && isTrusted && !group.isComplete && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredGroups.length === 0 && !error && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No groups found</h3>
                <p className="text-gray-400 font-medium">Try adjusting your filters, or be the first to create one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
