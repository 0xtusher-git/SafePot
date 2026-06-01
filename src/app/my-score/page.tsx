"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, Info, ShieldAlert, ArrowRight, ExternalLink, TrendingUp, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function MyScore() {
  const { isConnected, isTrusted, trustScore, address, connect } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isConnected) {
      setLoading(true);
      setTimeout(() => setLoading(false), 1500);
    }
  }, [isConnected]);

  if (!mounted) return null;

  const scoreColor = trustScore === null ? "#9CA3AF"
    : trustScore >= 80 ? "#10B981"
    : trustScore >= 50 ? "#F59E0B"
    : "#EF4444";

  const scoreBg = trustScore === null ? "bg-gray-50 border-gray-200"
    : trustScore >= 80 ? "bg-green-50 border-green-200"
    : trustScore >= 50 ? "bg-amber-50 border-amber-200"
    : "bg-red-50 border-red-200";

  const scoreLabel = trustScore === null ? "No Score"
    : trustScore >= 80 ? "Excellent"
    : trustScore >= 50 ? "Fair"
    : "Poor";

  const strokeDashoffset = trustScore ? 314 - (314 * trustScore) / 100 : 314;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">My ArcGrade Score</h1>
          <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
            SafePot relies on ArcGrade&apos;s on-chain trust protocol to ensure group savings are secure and participants are reliable.
          </p>
        </motion.div>

        {!isConnected ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Wallet Not Connected</h2>
            <p className="text-gray-500 font-medium mb-8">Connect your wallet to view your current ArcGrade trust score.</p>
            <button onClick={connect}
              className="bg-forest hover:bg-forest/90 text-white font-bold px-8 py-4 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2">
              Connect Wallet <ArrowRight className="w-5 h-5 text-gold" />
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score Display */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-8">Current Score</h3>

              {loading ? (
                <div className="w-44 h-44 flex items-center justify-center mb-8">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-forest rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                    <motion.circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray="314"
                      initial={{ strokeDashoffset: 314 }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1.8, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-6xl font-black text-gray-900">{trustScore ?? "--"}</span>
                    <span className="text-sm font-bold text-gray-400 mt-1">/ 100</span>
                  </div>
                </div>
              )}

              <span className={`px-5 py-2 rounded-full font-bold text-sm border ${scoreBg} mb-4`}>
                {scoreLabel} — {isTrusted ? "Trusted ✅" : "Untrusted ❌"}
              </span>
              <p className="text-xs font-mono text-gray-400 break-all">{address}</p>
            </motion.div>

            {/* Info & Actions */}
            <div className="flex flex-col gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-forest" /> Why does this matter?
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-3 font-medium">
                  In a rotating savings group, members who receive the pot early must be trusted to continue making contributions in later rounds.
                </p>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">
                  By enforcing a minimum ArcGrade trust score, SafePot significantly reduces the risk of default and ensures a safe environment for all participants.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-forest border border-forest rounded-3xl p-6 shadow-md flex flex-col justify-center items-center text-center">
                <TrendingUp className="w-8 h-8 text-gold mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Need a higher score?</h3>
                <p className="text-white/70 text-sm mb-6 font-medium">
                  Improve your on-chain activity, hold certain assets, or complete verification steps on ArcGrade.
                </p>
                <a href="https://arc-grade.vercel.app" target="_blank" rel="noopener noreferrer"
                  className="bg-gold hover:bg-yellow-400 text-forest font-bold px-6 py-3 rounded-full transition-all shadow-md hover:-translate-y-0.5 inline-flex items-center gap-2 text-sm w-full justify-center">
                  Improve on ArcGrade <ExternalLink className="w-4 h-4" />
                </a>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-forest" /> Score Requirements
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Join Groups", min: "50+" },
                    { label: "Create Groups", min: "70+" },
                    { label: "Admin Access", min: "90+" },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">{r.label}</span>
                      <span className="font-bold text-forest bg-green-50 px-2 py-0.5 rounded-lg border border-green-200 text-xs">{r.min} score</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
