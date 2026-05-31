"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, History, ArrowRight, User, AlertCircle } from "lucide-react";

// Mock data
const MOCK_GROUP = {
  id: "1",
  name: "Alpha Savers",
  amount: 100,
  duration: "monthly",
  currentRound: 3,
  potSize: 500,
  members: [
    { address: "0x1234...5678", score: 92, isNext: false, hasPaid: true },
    { address: "0x8765...4321", score: 85, isNext: true, hasPaid: false },
    { address: "0xabcd...efgh", score: 78, isNext: false, hasPaid: true },
    { address: "0x9999...8888", score: 95, isNext: false, hasPaid: false },
    { address: "0x4444...3333", score: 88, isNext: false, hasPaid: false },
  ],
  history: [
    { round: 1, winner: "0x1234...5678", amount: 500 },
    { round: 2, winner: "0xabcd...efgh", amount: 500 },
  ]
};

export default function GroupDetail() {
  const { id } = useParams();
  const { isConnected, isTrusted, address } = useWeb3();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const paidMembersCount = MOCK_GROUP.members.filter(m => m.hasPaid).length;
  const progressPercent = (paidMembersCount / MOCK_GROUP.members.length) * 100;

  const handleContribute = () => {
    if (!isTrusted) {
      alert("Your wallet trust score is too low to use SafePot. Improve your score at arc-grade.vercel.app");
      return;
    }
    alert("Trigger MetaMask to approve and transfer USDC contribution.");
  };

  const handleLeave = () => {
    alert("Trigger MetaMask to leave group (if allowed).");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">{MOCK_GROUP.name}</h1>
            <span className="bg-teal/30 text-teal-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal/50">
              {MOCK_GROUP.duration}
            </span>
          </div>
          <p className="text-cream/70">ID: {id} • {MOCK_GROUP.amount} USDC per round</p>
        </div>
        
        {isConnected && (
          <div className="flex gap-3">
            <button 
              onClick={handleLeave}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/20 transition-colors text-sm font-bold"
            >
              Leave Group
            </button>
            <button 
              onClick={handleContribute}
              className="px-6 py-2 bg-gold hover:bg-yellow-500 text-forest rounded-full transition-colors font-bold shadow-[0_0_15px_rgba(244,196,48,0.2)]"
            >
              Contribute {MOCK_GROUP.amount} USDC
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Progress & Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Current Round Progress */}
          <div className="bg-forest/40 border border-teal/30 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Round {MOCK_GROUP.currentRound} Progress</h2>
                <p className="text-cream/60 text-sm">Target: {MOCK_GROUP.potSize} USDC</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gold">{paidMembersCount * MOCK_GROUP.amount} <span className="text-lg text-cream/70">USDC</span></p>
              </div>
            </div>

            <div className="w-full bg-forest border border-teal/30 h-4 rounded-full overflow-hidden mb-4">
              <div 
                className="bg-gradient-to-r from-teal-400 to-gold h-full rounded-full transition-all duration-1000" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <p className="text-cream/80 text-sm">{paidMembersCount} of {MOCK_GROUP.members.length} members have paid their contribution this round.</p>
          </div>

          {/* Members List */}
          <div className="bg-teal/10 border border-teal/30 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-gold" /> Member Roster
            </h2>
            <div className="space-y-4">
              {MOCK_GROUP.members.map((member, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${member.isNext ? 'bg-gold/10 border-gold/40' : 'bg-forest/50 border-teal/20'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.hasPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {member.hasPaid ? <ShieldCheck w-5 h-5 /> : <AlertCircle w-5 h-5 />}
                    </div>
                    <div>
                      <p className="font-mono text-cream/90">{member.address}</p>
                      <p className="text-xs text-cream/50">ArcGrade Score: <span className="text-gold font-bold">{member.score}</span></p>
                    </div>
                  </div>
                  
                  {member.isNext && (
                    <span className="bg-gold text-forest text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-gold/20">
                      Receives Pot Next
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - History */}
        <div className="space-y-8">
          <div className="bg-forest/60 border border-teal/30 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-teal-400" /> Round History
            </h2>
            <div className="space-y-6">
              {MOCK_GROUP.history.map((hist, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-teal/30 last:border-l-0 pb-6 last:pb-0">
                  <div className="absolute w-3 h-3 bg-teal-400 rounded-full -left-[7px] top-1"></div>
                  <h3 className="text-cream/90 font-bold mb-1">Round {hist.round} Complete</h3>
                  <p className="text-sm text-cream/60 mb-2">Pot distributed to:</p>
                  <div className="flex items-center gap-2 bg-teal/20 px-3 py-2 rounded-lg border border-teal/30">
                    <span className="font-mono text-xs text-gold">{hist.winner}</span>
                    <ArrowRight className="w-3 h-3 text-cream/50" />
                    <span className="text-xs font-bold text-white">{hist.amount} USDC</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
