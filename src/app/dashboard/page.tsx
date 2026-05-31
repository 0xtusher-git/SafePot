"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, History, Users, Timer, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { isConnected, isTrusted, trustScore, address } = useWeb3();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xl text-cream/70">Please connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  // Calculate ring color based on score (mock logic)
  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400 border-gray-400";
    if (score >= 80) return "text-green-400 border-green-400";
    if (score >= 50) return "text-yellow-400 border-yellow-400";
    return "text-red-400 border-red-400";
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Dashboard</h1>
          <p className="text-cream/70">Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
        <Link 
          href="/create-group"
          className="bg-gold text-forest font-bold px-6 py-3 rounded-full hover:bg-yellow-500 transition-colors shadow-lg shadow-gold/20"
        >
          + Create New Group
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trust Score Card */}
        <div className="bg-teal/20 border border-teal/40 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm">
          <ShieldCheck className="absolute top-4 left-4 w-6 h-6 text-gold opacity-50" />
          <h3 className="text-cream/80 font-medium uppercase tracking-wider text-xs mb-4">ArcGrade Trust Score</h3>
          
          <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center mb-4 ${getScoreColor(trustScore)} shadow-[0_0_20px_rgba(0,0,0,0.2)] inset-shadow-sm`}>
            <span className="text-4xl font-bold">{trustScore ?? "--"}</span>
          </div>
          
          {isTrusted ? (
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30">
              Trusted Wallet
            </span>
          ) : (
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold border border-red-500/30 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Untrusted Wallet
            </span>
          )}
          <Link href="/my-score" className="text-teal-200 text-xs mt-4 hover:underline">
            View Details
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          <div className="bg-forest/40 border border-teal/30 rounded-3xl p-6 flex flex-col justify-center">
            <div className="w-12 h-12 bg-teal/40 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="text-gold w-6 h-6" />
            </div>
            <p className="text-cream/60 text-sm mb-1 uppercase tracking-wider">Total Saved</p>
            <h2 className="text-3xl font-bold text-white">500 <span className="text-xl text-cream/70">USDC</span></h2>
          </div>
          <div className="bg-forest/40 border border-teal/30 rounded-3xl p-6 flex flex-col justify-center">
            <div className="w-12 h-12 bg-teal/40 rounded-full flex items-center justify-center mb-4">
              <Users className="text-gold w-6 h-6" />
            </div>
            <p className="text-cream/60 text-sm mb-1 uppercase tracking-wider">Active Groups</p>
            <h2 className="text-3xl font-bold text-white">2</h2>
          </div>
        </div>
      </div>

      {/* Active Groups Section */}
      <h2 className="text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
        <Timer className="text-gold w-6 h-6" /> My Active Groups
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mock Group Card */}
        <Link href="/group/1" className="bg-teal/10 border border-teal/30 rounded-2xl p-6 hover:bg-teal/20 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">Alpha Savers</h3>
              <p className="text-cream/60 text-sm">Monthly • 100 USDC/round</p>
            </div>
            <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold border border-gold/30">
              Your Turn: Round 3
            </span>
          </div>
          <div className="w-full bg-forest/50 h-3 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-teal-400 to-gold h-full w-[40%] rounded-full"></div>
          </div>
          <div className="flex justify-between text-xs text-cream/70">
            <span>2/5 Members Paid</span>
            <span>Pot: 200/500 USDC</span>
          </div>
        </Link>
      </div>

      {/* History */}
      <h2 className="text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
        <History className="text-gold w-6 h-6" /> Recent Activity
      </h2>
      <div className="bg-forest/30 border border-teal/30 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-teal/30 flex justify-between items-center bg-teal/10">
          <span className="text-cream/90 font-medium">Contributed to Alpha Savers</span>
          <span className="text-red-400 font-mono">-100 USDC</span>
        </div>
        <div className="p-4 border-b border-teal/30 flex justify-between items-center bg-teal/5">
          <span className="text-cream/90 font-medium">Won Pot in Beta Builders</span>
          <span className="text-green-400 font-mono">+400 USDC</span>
        </div>
      </div>
    </div>
  );
}
