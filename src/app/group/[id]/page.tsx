"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, History, ArrowRight, Users, AlertCircle, Timer, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

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

const avatarColors = ["#1B4332","#2D6A4F","#40916C","#52B788","#74C69D"];

export default function GroupDetail() {
  const { id } = useParams();
  const { isConnected, isTrusted } = useWeb3();
  const [mounted, setMounted] = useState(false);
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

  if (!mounted) return null;

  const paidCount = MOCK_GROUP.members.filter(m => m.hasPaid).length;
  const progressPercent = (paidCount / MOCK_GROUP.members.length) * 100;

  const handleContribute = () => {
    if (!isTrusted) { alert("Trust score too low. Improve at arc-grade.vercel.app"); return; }
    alert("Trigger MetaMask to approve and transfer USDC contribution.");
  };

  const handleLeave = () => alert("Trigger MetaMask to leave group (if allowed).");

  const handleDistribute = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#1B4332','#F4C430','#2D6A4F'] });
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-4xl font-extrabold text-gray-900">{MOCK_GROUP.name}</h1>
              <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {MOCK_GROUP.duration}
              </span>
            </div>
            <p className="text-gray-500 font-medium">ID: {id} • {MOCK_GROUP.amount} USDC per round</p>
          </div>
          {isConnected && (
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleLeave}
                className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-full transition-colors text-sm font-bold shadow-sm">
                Leave Group
              </button>
              <button onClick={handleContribute}
                className="px-6 py-2 bg-forest hover:bg-forest/90 text-white rounded-full transition-all font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold" /> Contribute {MOCK_GROUP.amount} USDC
              </button>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown */}
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

            {/* Round Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm border-l-4 border-l-forest">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Round {MOCK_GROUP.currentRound} Progress</h2>
                  <p className="text-gray-400 text-sm font-medium">Target: {MOCK_GROUP.potSize} USDC</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-forest">{paidCount * MOCK_GROUP.amount}
                    <span className="text-base text-gray-400 font-semibold ml-1">USDC</span>
                  </p>
                  <p className="text-xs text-gray-400 font-medium">{Math.round(progressPercent)}% collected</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="bg-forest h-full rounded-full" />
              </div>
              <p className="text-gray-500 text-sm font-medium">{paidCount} of {MOCK_GROUP.members.length} members have paid their contribution this round.</p>
            </motion.div>

            {/* Members List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-forest" /> Member Roster
              </h2>
              <div className="space-y-3">
                {MOCK_GROUP.members.map((member, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${member.isNext ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ background: avatarColors[i % avatarColors.length] }}>
                        {member.address.slice(2, 4).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-mono text-gray-800 text-sm font-semibold">{member.address}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          ArcGrade: <span className="text-forest font-bold">{member.score}</span>
                          {member.hasPaid
                            ? <span className="ml-2 text-green-600 font-bold">✓ Paid</span>
                            : <span className="ml-2 text-red-500 font-bold">✗ Pending</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.isNext && (
                        <span className="bg-gold text-forest text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          Receives Pot Next
                        </span>
                      )}
                      {member.hasPaid
                        ? <ShieldCheck className="w-5 h-5 text-green-500" />
                        : <AlertCircle className="w-5 h-5 text-red-400" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pot Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-forest border border-forest rounded-3xl p-6 shadow-md text-center">
              <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Current Pot</p>
              <p className="text-4xl font-extrabold text-white mb-1">{MOCK_GROUP.potSize}</p>
              <p className="text-white/70 font-bold text-sm mb-4">USDC</p>
              <button onClick={handleDistribute}
                className="w-full bg-gold hover:bg-yellow-400 text-forest font-bold py-3 rounded-full transition-all text-sm shadow-sm hover:-translate-y-0.5">
                🎉 Distribute Pot
              </button>
            </motion.div>

            {/* Round History */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-forest" /> Round History
              </h2>
              <div className="space-y-5">
                {MOCK_GROUP.history.map((hist, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-gray-100 last:border-l-0 pb-5 last:pb-0">
                    <div className="absolute w-3 h-3 bg-forest rounded-full -left-[7px] top-1 shadow-sm"></div>
                    <h3 className="text-gray-900 font-bold mb-1 text-sm">Round {hist.round} Complete</h3>
                    <p className="text-xs text-gray-400 font-medium mb-2">Pot distributed to:</p>
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                      <span className="font-mono text-xs text-forest font-semibold">{hist.winner}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-extrabold text-gray-900 ml-auto">{hist.amount} USDC</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
