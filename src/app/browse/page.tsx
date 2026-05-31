"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShieldAlert, Users, Coins } from "lucide-react";

const MOCK_GROUPS = [
  { id: 1, name: "Alpha Savers", members: 2, maxMembers: 5, amount: 100, duration: "monthly" },
  { id: 2, name: "Crypto Dreamers", members: 4, maxMembers: 10, amount: 50, duration: "weekly" },
  { id: 3, name: "Arc Whales", members: 1, maxMembers: 4, amount: 500, duration: "monthly" },
  { id: 4, name: "Steady Growth", members: 3, maxMembers: 6, amount: 200, duration: "biweekly" },
];

export default function BrowseGroups() {
  const { isConnected, isTrusted, address } = useWeb3();
  const [mounted, setMounted] = useState(false);
  
  const [filterAmount, setFilterAmount] = useState<string>("all");
  const [filterDuration, setFilterDuration] = useState<string>("all");

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const filteredGroups = MOCK_GROUPS.filter(g => {
    if (filterAmount !== "all") {
      if (filterAmount === "under100" && g.amount >= 100) return false;
      if (filterAmount === "100-300" && (g.amount < 100 || g.amount > 300)) return false;
      if (filterAmount === "over300" && g.amount <= 300) return false;
    }
    if (filterDuration !== "all" && g.duration !== filterDuration) return false;
    return true;
  });

  const handleJoin = (groupId: number) => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!isTrusted) {
      alert("Your wallet trust score is too low to join SafePot. Improve your score at arc-grade.vercel.app");
      return;
    }
    alert(`Trigger MetaMask transaction to join group ${groupId}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Browse Groups</h1>
          <p className="text-cream/70">Find a trust-gated savings pool that matches your goals.</p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filterAmount}
            onChange={(e) => setFilterAmount(e.target.value)}
            className="bg-forest/80 border border-teal/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold"
          >
            <option value="all">Any Amount</option>
            <option value="under100">&lt; 100 USDC</option>
            <option value="100-300">100 - 300 USDC</option>
            <option value="over300">&gt; 300 USDC</option>
          </select>

          <select 
            value={filterDuration}
            onChange={(e) => setFilterDuration(e.target.value)}
            className="bg-forest/80 border border-teal/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold"
          >
            <option value="all">Any Duration</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mb-8 flex items-center gap-3">
          <ShieldAlert className="text-yellow-500 w-5 h-5 flex-shrink-0" />
          <p className="text-sm text-yellow-200">Connect your wallet to verify your ArcGrade score and join groups.</p>
        </div>
      )}

      {isConnected && !isTrusted && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-8 flex items-center gap-3">
          <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0" />
          <p className="text-sm text-red-200">
            Your wallet trust score is too low to join groups. <a href="https://arc-grade.vercel.app" target="_blank" rel="noreferrer" className="underline font-bold">Improve it here</a>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <div key={group.id} className="bg-teal/10 border border-teal/30 rounded-2xl p-6 hover:bg-teal/20 transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{group.name}</h3>
              <span className="bg-forest text-cream/80 px-2 py-1 rounded text-xs border border-teal/50 uppercase tracking-wider">
                {group.duration}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
              <div>
                <p className="text-cream/50 text-xs uppercase mb-1 flex items-center gap-1"><Coins w-3 h-3/> Contribution</p>
                <p className="text-lg font-bold text-white">{group.amount} USDC</p>
              </div>
              <div>
                <p className="text-cream/50 text-xs uppercase mb-1 flex items-center gap-1"><Coins w-3 h-3/> Pot Size</p>
                <p className="text-lg font-bold text-gold">{group.amount * group.maxMembers} USDC</p>
              </div>
              <div className="col-span-2">
                <p className="text-cream/50 text-xs uppercase mb-1 flex items-center gap-1"><Users w-3 h-3/> Members Needed</p>
                <div className="w-full bg-forest/50 h-2 rounded-full overflow-hidden mt-1 mb-1">
                  <div 
                    className="bg-teal-400 h-full rounded-full" 
                    style={{ width: `${(group.members / group.maxMembers) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-cream/80">{group.members} / {group.maxMembers} joined</p>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <Link 
                href={`/group/${group.id}`}
                className="flex-1 bg-forest border border-teal/50 text-white text-center py-2 rounded-xl hover:bg-teal/30 transition-colors text-sm font-medium"
              >
                View Details
              </Link>
              <button 
                onClick={() => handleJoin(group.id)}
                className={`flex-1 font-bold py-2 rounded-xl transition-all text-sm ${
                  isTrusted 
                    ? "bg-gold hover:bg-yellow-500 text-forest" 
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                Join Group
              </button>
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-teal/30 rounded-2xl">
            <Search className="w-12 h-12 text-teal/40 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No groups found</h3>
            <p className="text-cream/60">Try adjusting your filters to find open groups.</p>
          </div>
        )}
      </div>
    </div>
  );
}
