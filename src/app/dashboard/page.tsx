"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, History, Users, Timer, TrendingUp, AlertCircle, Gift } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function Dashboard() {
  const { isConnected, isTrusted, trustScore, address } = useWeb3();
  const [mounted, setMounted] = useState(false);
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

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-light">
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
            <p className="text-gray-500 font-medium">Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}</p>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="text-forest w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold text-xs mb-1 uppercase tracking-wider">Total Saved</p>
              <h2 className="text-3xl font-extrabold text-gray-900">500 <span className="text-xl text-gray-400 font-semibold">USDC</span></h2>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                <Users className="text-gold w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold text-xs mb-1 uppercase tracking-wider">Active Groups</p>
              <h2 className="text-3xl font-extrabold text-gray-900">2</h2>
            </motion.div>
          </div>
        </div>

        {/* Active Groups Section */}
        <div className="flex justify-between items-center mt-8 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Timer className="text-forest w-6 h-6" /> My Active Groups
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mock Group Card 1 */}
          <Link href="/group/1" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between border-l-4 border-l-forest">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-forest transition-colors">Alpha Savers</h3>
                <p className="text-gray-500 text-sm font-medium mt-1">Monthly • 100 USDC/round</p>
              </div>
              <span className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-200">
                Your Turn: Round 3
              </span>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                <span>Round 2 Progress</span>
                <span>40% Filled</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }} whileInView={{ width: "40%" }} transition={{ duration: 1 }}
                  className="bg-forest h-full rounded-full"
                ></motion.div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${i <= 2 ? 'bg-forest' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-bold">200 / 500 USDC</p>
                  <p>Current Pot</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                <Timer className="w-4 h-4 text-forest" />
                <span suppressHydrationWarning>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
              </div>
              <button className="text-forest font-bold text-sm hover:underline">Contribute</button>
            </div>
          </Link>

          {/* Mock Group Card 2 (Won Pot scenario) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between border-l-4 border-l-gold">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 transition-colors">Beta Builders</h3>
                <p className="text-gray-500 text-sm font-medium mt-1">Weekly • 50 USDC/round</p>
              </div>
              <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200 flex items-center gap-1">
                <Gift className="w-3 h-3" /> Pot Won!
              </span>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                <span>Round 5 Progress</span>
                <span>100% Filled</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4">
                <div className="bg-gold h-full w-full rounded-full"></div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-forest" />
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-bold">200 / 200 USDC</p>
                  <p>Total Pot</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={triggerConfetti}
                className="bg-gold hover:bg-yellow-500 text-forest font-bold px-4 py-2 rounded-full text-sm transition-colors shadow-sm"
              >
                Claim Pot
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
          <History className="text-forest w-6 h-6" /> Recent Activity
        </h2>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div className="flex flex-col">
               <span className="text-gray-900 font-bold text-sm">Contributed to Alpha Savers</span>
               <span className="text-gray-500 text-xs">Today at 10:42 AM</span>
            </div>
            <span className="text-gray-900 font-bold font-mono">-100 USDC</span>
          </div>
          <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div className="flex flex-col">
               <span className="text-gray-900 font-bold text-sm">Won Pot in Beta Builders</span>
               <span className="text-gray-500 text-xs">Yesterday</span>
            </div>
            <span className="text-green-600 font-bold font-mono">+200 USDC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
