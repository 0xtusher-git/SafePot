"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Info, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CreateGroup() {
  const { isConnected, isTrusted } = useWeb3();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState(5);
  const [amount, setAmount] = useState(100);
  const [duration, setDuration] = useState("monthly");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const potSize = members * amount;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    alert("This would trigger a MetaMask transaction to approve 0.5 USDC and call createGroup().");
    setLoading(false);
    router.push("/dashboard");
  };

  if (!isConnected) {
    return (
      <div className="flex-1 min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 rounded-3xl p-12 max-w-md shadow-sm">
          <ShieldAlert className="w-16 h-16 text-amber-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Connect Wallet</h2>
          <p className="text-gray-500 font-medium">You need to connect your wallet to create a group.</p>
        </motion.div>
      </div>
    );
  }

  if (!isTrusted) {
    return (
      <div className="flex-1 min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 rounded-3xl p-12 max-w-md shadow-sm">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Trust Score Too Low</h2>
          <p className="text-gray-500 font-medium mb-6 max-w-sm mx-auto">
            Your wallet trust score is too low to use SafePot. Improve your score at arc-grade.vercel.app
          </p>
          <a href="https://arc-grade.vercel.app" target="_blank" rel="noopener noreferrer"
            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-6 py-3 rounded-full transition-colors border border-red-200 inline-block">
            Improve Score →
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Create a Group</h1>
          <p className="text-gray-500 font-medium mb-8">Set up a new trust-gated savings pool for you and your friends.</p>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onSubmit={handleCreate} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Group Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all font-medium"
              placeholder="e.g. Crypto Dreamers" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Number of Members</label>
              <input type="number" required min={2} max={10} value={members} onChange={e => setMembers(parseInt(e.target.value) || 2)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all font-medium" />
              <p className="text-xs text-gray-400 mt-1 font-medium">Between 2 and 10 members.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Contribution per Round (USDC)</label>
              <input type="number" required min={1} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all font-medium" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Round Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all font-medium appearance-none cursor-pointer">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Live Preview */}
          <motion.div layout className="bg-green-50 border border-green-100 p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest" /> Group Preview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-sm">Total Pot Size</span>
                <span className="text-2xl font-extrabold text-forest">{potSize.toLocaleString()} <span className="text-base text-gray-400 font-semibold">USDC</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-sm">Cycle Duration</span>
                <span className="text-gray-900 font-bold">{members} {duration}s</span>
              </div>
              <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                <span className="text-gray-500 font-medium text-sm flex items-center gap-1">
                  <Info className="w-4 h-4" /> Creation Fee
                </span>
                <span className="font-mono font-bold text-gray-900">0.5 USDC</span>
              </div>
            </div>
          </motion.div>

          <button type="submit" disabled={loading}
            className="w-full bg-forest hover:bg-forest/90 disabled:opacity-60 text-white font-bold text-lg py-4 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" /> Create Group
              </span>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
