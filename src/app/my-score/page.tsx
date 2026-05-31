"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, Info, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MyScore() {
  const { isConnected, isTrusted, trustScore, address, connect } = useWeb3();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400 border-gray-400 bg-gray-500/10";
    if (score >= 80) return "text-green-400 border-green-400 bg-green-500/10";
    if (score >= 50) return "text-yellow-400 border-yellow-400 bg-yellow-500/10";
    return "text-red-400 border-red-400 bg-red-500/10";
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">My ArcGrade Score</h1>
        <p className="text-cream/70 text-lg max-w-2xl">
          SafePot relies on ArcGrade's on-chain trust protocol to ensure group savings are secure and participants are reliable.
        </p>
      </div>

      {!isConnected ? (
        <div className="bg-forest/50 border border-teal/40 rounded-3xl p-12 text-center w-full max-w-lg backdrop-blur-sm shadow-xl">
          <ShieldAlert className="w-16 h-16 text-gold mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Not Connected</h2>
          <p className="text-cream/70 mb-8">Connect your wallet to view your current ArcGrade trust score.</p>
          <button 
            onClick={connect}
            className="bg-gold hover:bg-yellow-500 text-forest font-bold px-8 py-4 rounded-full transition-all shadow-[0_0_15px_rgba(244,196,48,0.3)] inline-flex items-center gap-2"
          >
            Connect Wallet <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Score Display */}
          <div className="bg-teal/10 border border-teal/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative">
            {isTrusted && <ShieldCheck className="absolute top-4 right-4 w-8 h-8 text-green-400" />}
            {!isTrusted && <ShieldAlert className="absolute top-4 right-4 w-8 h-8 text-red-400" />}
            
            <h3 className="text-cream/80 font-medium uppercase tracking-wider text-sm mb-8">Current Score</h3>
            
            <div className={`w-48 h-48 rounded-full border-[12px] flex flex-col items-center justify-center mb-8 ${getScoreColor(trustScore)} shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>
              <span className="text-6xl font-black">{trustScore ?? "--"}</span>
              <span className="text-sm font-medium mt-2 opacity-80">/ 100</span>
            </div>

            {isTrusted ? (
              <div className="bg-green-500/20 text-green-400 px-6 py-2 rounded-full font-bold border border-green-500/30">
                Status: Trusted ✅
              </div>
            ) : (
              <div className="bg-red-500/20 text-red-400 px-6 py-2 rounded-full font-bold border border-red-500/30 flex flex-col gap-1">
                <span>Status: Untrusted ❌</span>
              </div>
            )}
            
            <p className="text-xs font-mono text-cream/50 mt-4">{address}</p>
          </div>

          {/* Explanation & Action */}
          <div className="flex flex-col gap-6">
            <div className="bg-forest/60 border border-teal/40 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-gold" /> Why does this matter?
              </h3>
              <p className="text-cream/70 text-sm leading-relaxed mb-4">
                In a rotating savings group, members who receive the pot early must be trusted to continue making their contributions in later rounds. 
              </p>
              <p className="text-cream/70 text-sm leading-relaxed">
                By enforcing a minimum ArcGrade trust score, SafePot significantly reduces the risk of default and ensures a safe, reliable environment for all participants.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-900 to-forest border border-teal/50 rounded-3xl p-8 flex-1 flex flex-col justify-center items-center text-center">
              <h3 className="text-lg font-bold text-white mb-2">Need a higher score?</h3>
              <p className="text-cream/60 text-sm mb-6">
                You can improve your ArcGrade score by increasing on-chain activity, holding certain assets, or completing verification steps.
              </p>
              <a 
                href="https://arc-grade.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full transition-colors border border-white/20 inline-flex items-center gap-2 text-sm font-bold w-full justify-center"
              >
                Improve on ArcGrade <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
