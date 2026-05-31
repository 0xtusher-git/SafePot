"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Info, ShieldCheck } from "lucide-react";

export default function CreateGroup() {
  const { isConnected, isTrusted } = useWeb3();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [members, setMembers] = useState(5);
  const [amount, setAmount] = useState(100);
  const [duration, setDuration] = useState("monthly");

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
        <p className="text-cream/70">You need to connect your wallet to create a group.</p>
      </div>
    );
  }

  if (!isTrusted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Trust Score Too Low</h2>
        <p className="text-cream/70 mb-6 max-w-md">
          Only trusted wallets can create new SafePot groups. Please improve your ArcGrade score to continue.
        </p>
        <a 
          href="https://arc-grade.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-red-500/20 text-red-300 px-6 py-3 rounded-full hover:bg-red-500/30 transition-colors"
        >
          Improve Score
        </a>
      </div>
    );
  }

  const potSize = members * amount;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call SafePot.sol createGroup() paying 0.5 USDC
    alert("This would trigger a MetaMask transaction to approve 0.5 USDC and call createGroup().");
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-white mb-2">Create a Group</h1>
      <p className="text-cream/70 mb-8">Set up a new trust-gated savings pool for you and your friends.</p>

      <form onSubmit={handleCreate} className="bg-forest/50 border border-teal/40 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-cream/90 mb-2">Group Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-forest/80 border border-teal/50 rounded-xl px-4 py-3 text-white placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              placeholder="e.g. Crypto Dreamers"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-cream/90 mb-2">Number of Members</label>
              <input 
                type="number" 
                required
                min={2}
                max={10}
                value={members}
                onChange={(e) => setMembers(parseInt(e.target.value) || 2)}
                className="w-full bg-forest/80 border border-teal/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-all"
              />
              <p className="text-xs text-cream/50 mt-1">Between 2 and 10 members.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-cream/90 mb-2">Contribution per Round (USDC)</label>
              <input 
                type="number" 
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                className="w-full bg-forest/80 border border-teal/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cream/90 mb-2">Round Duration</label>
            <select 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-forest/80 border border-teal/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-all appearance-none"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="bg-teal/20 border border-teal/30 p-6 rounded-2xl mt-8">
            <h3 className="text-lg font-bold text-white mb-4">Group Preview</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-cream/70">Total Pot Size:</span>
              <span className="text-xl font-bold text-gold">{potSize} USDC</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-cream/70">Cycle Duration:</span>
              <span className="text-white font-medium">{members} {duration}s</span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-teal/30">
              <span className="text-cream/70 flex items-center gap-1">
                <Info className="w-4 h-4" /> Creation Fee:
              </span>
              <span className="text-white font-mono">0.5 USDC</span>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full mt-8 bg-gold hover:bg-yellow-500 text-forest font-bold text-lg py-4 rounded-full transition-all shadow-[0_0_15px_rgba(244,196,48,0.2)] hover:shadow-[0_0_25px_rgba(244,196,48,0.4)] flex justify-center items-center gap-2"
        >
          <ShieldCheck className="w-5 h-5" />
          Create Group
        </button>
      </form>
    </div>
  );
}
