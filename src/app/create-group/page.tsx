"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Info, ShieldCheck, Sparkles, AlertCircle, Lock, Globe, Copy, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Contract, parseUnits, isError } from "ethers";

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const SAFEPOT_ADDRESS = process.env.NEXT_PUBLIC_SAFEPOT_ADDRESS ?? "";

const USDC_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

const SAFEPOT_ABI = [
  "function createGroup(string memory name, uint256 maxMembers, uint256 contributionAmount, string memory roundDuration, bool isPrivate, string memory inviteCode) external",
];

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (const byte of array) {
    code += chars[byte % chars.length];
  }
  return code;
}

function decodeError(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown error";
  const e = error as Record<string, unknown>;
  if (typeof e.reason === "string" && e.reason.length > 0) return e.reason;
  if (isError(error, "CALL_EXCEPTION")) {
    const revert = (error as any).revert;
    if (revert && revert.args && revert.args.length > 0) return `Contract reverted: ${revert.args[0]}`;
    return `Transaction reverted. Check that:\n• SAFEPOT_ADDRESS env var is set\n• You have enough USDC and it's approved\n• You're on the correct network`;
  }
  if (isError(error, "ACTION_REJECTED")) return "Transaction rejected in wallet.";
  if (isError(error, "INSUFFICIENT_FUNDS")) return "Insufficient funds for gas.";
  if (typeof e.message === "string") return e.message;
  return "Unknown error – check console for details.";
}

export default function CreateGroup() {
  const { isConnected, isTrusted, signer } = useWeb3();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState(5);
  const [amount, setAmount] = useState(100);
  const [duration, setDuration] = useState("monthly");
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode] = useState(() => generateInviteCode());
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const potSize = members * amount;
  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);
    setTxStatus(null);

    if (!signer) { setTxError("Wallet not connected properly. Please reconnect."); return; }

    if (!SAFEPOT_ADDRESS || SAFEPOT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setTxError("NEXT_PUBLIC_SAFEPOT_ADDRESS is not set in your .env.local file. Add the deployed contract address and restart the dev server.");
      return;
    }

    if (!name.trim()) { setTxError("Please enter a group name."); return; }

    // Public groups require trust score
    if (!isPrivate && !isTrusted) {
      setTxError("Public groups require a trust score of 50+. Switch to 'Private' to create an invite-only group.");
      return;
    }

    setLoading(true);

    try {
      const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
      const safePot = new Contract(SAFEPOT_ADDRESS, SAFEPOT_ABI, signer);
      const myAddress = await signer.getAddress();

      const feeData = await signer.provider?.getFeeData();
      const txOptions = feeData?.gasPrice ? { gasPrice: feeData.gasPrice } : {};

      const CREATION_FEE = 500_000n;

      setTxStatus("Step 1/2 – Checking USDC allowance…");

      let needsApprove = true;
      try {
        const currentAllowance: bigint = await usdc.allowance(myAddress, SAFEPOT_ADDRESS);
        needsApprove = currentAllowance < CREATION_FEE;
      } catch (allowanceErr) {
        console.warn("[SafePot] allowance() call failed – proceeding with approve anyway.", allowanceErr);
      }

      if (needsApprove) {
        setTxStatus("Step 1/2 – Approving 0.5 USDC creation fee… (confirm in wallet)");
        const approveTx = await usdc.approve(SAFEPOT_ADDRESS, CREATION_FEE, txOptions);
        setTxStatus("Step 1/2 – Approve transaction sent, waiting for confirmation…");
        await approveTx.wait();
      } else {
        console.log("[SafePot] Sufficient allowance already exists, skipping approve.");
      }

      const contribution = parseUnits(amount.toString(), 6);
      const maxMembersBN = BigInt(members);
      const finalInviteCode = isPrivate ? inviteCode : "";

      setTxStatus("Step 2/2 – Creating group… (confirm in wallet)");

      const createTx = await safePot.createGroup(
        name.trim(),
        maxMembersBN,
        contribution,
        duration,
        isPrivate,
        finalInviteCode,
        txOptions
      );

      setTxStatus("Step 2/2 – Transaction sent, waiting for confirmation…");
      const receipt = await createTx.wait();

      // Try to extract the group ID from logs
      // GroupCreated event topic
      const iface = new (await import("ethers")).Interface([
        "event GroupCreated(uint256 indexed groupId, string name, address creator)"
      ]);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "GroupCreated") {
            setCreatedGroupId(Number(parsed.args[0]));
          }
        } catch {}
      }

      setTxStatus(isPrivate ? "Private group created! Share your invite link." : "Group created! Redirecting…");
      if (!isPrivate) router.push("/dashboard");

    } catch (error: unknown) {
      const reason = decodeError(error);
      console.error("[SafePot] Transaction failed:", error);
      setTxError(reason);
    } finally {
      setLoading(false);
    }
  };

  // ── Guard: Not Connected ───────────────────────────────────────────────
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

  // ── Success state for private group ───────────────────────────────────
  if (createdGroupId !== null && isPrivate) {
    return (
      <div className="flex-1 min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 rounded-3xl p-10 max-w-lg w-full shadow-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Private Group Created! 🎉</h2>
          <p className="text-gray-500 font-medium mb-6">Share this invite link with your trusted friends to let them join.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3 mb-4 text-left">
            <Lock className="w-5 h-5 text-forest flex-shrink-0" />
            <span className="font-mono text-sm text-gray-700 break-all flex-1">{inviteLink}</span>
            <button onClick={copyLink} className="bg-forest text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-forest/90 transition-colors flex-shrink-0">
              <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-6">
            ⚠️ Save this link! It cannot be regenerated.
          </p>
          <button onClick={() => router.push(`/group/${createdGroupId}`)} className="w-full bg-forest text-white font-bold py-3 rounded-full hover:bg-forest/90 transition-all shadow-md">
            Go to Group
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main Form ──────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Create a Group</h1>
          <p className="text-gray-500 font-medium mb-8">Set up a new trust-gated savings pool for you and your friends.</p>
        </motion.div>

        <AnimatePresence>
          {(!SAFEPOT_ADDRESS || SAFEPOT_ADDRESS === "0x0000000000000000000000000000000000000000") && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Contract address not configured</p>
                <p className="text-sm text-amber-700 mt-0.5">Add <code className="font-mono bg-amber-100 px-1 rounded">NEXT_PUBLIC_SAFEPOT_ADDRESS</code> to <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code> and restart the dev server.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form onSubmit={handleCreate} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col gap-6">

          {/* Privacy Toggle */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Group Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${!isPrivate ? 'border-forest bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                <Globe className={`w-5 h-5 flex-shrink-0 ${!isPrivate ? 'text-forest' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-bold text-sm ${!isPrivate ? 'text-forest' : 'text-gray-600'}`}>Public</p>
                  <p className="text-xs text-gray-400 mt-0.5">Listed on Browse Groups. Trust score 50+ required to join.</p>
                </div>
              </button>
              <button type="button" onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${isPrivate ? 'border-forest bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                <Lock className={`w-5 h-5 flex-shrink-0 ${isPrivate ? 'text-forest' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-bold text-sm ${isPrivate ? 'text-forest' : 'text-gray-600'}`}>Private</p>
                  <p className="text-xs text-gray-400 mt-0.5">Invite-only via unique link. Not visible to the public.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Private invite code preview */}
          <AnimatePresence>
            {isPrivate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Your invite link (save after creation)
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-mono text-xs text-amber-800 break-all flex-1">{inviteLink}</p>
                  <button type="button" onClick={copyLink} className="text-amber-700 hover:text-amber-900 font-bold text-xs bg-amber-100 px-2 py-1 rounded-lg flex-shrink-0">
                    {copied ? "✓" : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200/60">
                  <p className="text-xs text-amber-900 font-bold mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-red-500" /> Social Guarantee
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    You are responsible for this member's behavior. If they stop contributing (rug), your 30% held funds will be slashed and distributed to the remaining members. Only invite people you trust.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Low Trust Warning for Public groups */}
          <AnimatePresence>
            {!isPrivate && !isTrusted && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">Trust score too low for public groups</p>
                  <p className="text-sm text-red-600 mt-0.5">Switch to Private to create an invite-only group, or <a href="https://arc-grade.vercel.app" target="_blank" className="underline">improve your score</a>.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Group Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={50}
              placeholder="e.g. Alpha Savers, Family Chit..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all font-medium" />
          </div>

          {/* Members */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700">Max Members</label>
              <span className="text-2xl font-extrabold text-forest">{members}</span>
            </div>
            <input type="range" min={2} max={10} value={members} onChange={e => setMembers(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-forest" />
            <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium"><span>2</span><span>10</span></div>
          </div>

          {/* Contribution Amount */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contribution per Round (USDC)</label>
            <div className="grid grid-cols-3 gap-3">
              {[50, 100, 200].map(v => (
                <button key={v} type="button" onClick={() => setAmount(v)}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${amount === v ? 'bg-forest border-forest text-white shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  {v} USDC
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              <input type="number" value={amount} onChange={e => setAmount(Math.max(1, Number(e.target.value)))} min={1}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-forest transition-all font-medium pr-16" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">USDC</span>
            </div>
          </div>

          {/* Round Duration */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Round Duration</label>
            <div className="grid grid-cols-3 gap-3">
              {["weekly", "biweekly", "monthly"].map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all capitalize ${duration === d ? 'bg-forest border-forest text-white shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  {d === "biweekly" ? "Bi-weekly" : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <motion.div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
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
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-sm">Visibility</span>
                <span className={`font-bold text-sm flex items-center gap-1 ${isPrivate ? 'text-amber-700' : 'text-forest'}`}>
                  {isPrivate ? <><Lock className="w-3 h-3" /> Private</> : <><Globe className="w-3 h-3" /> Public</>}
                </span>
              </div>
              <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                <span className="text-gray-500 font-medium text-sm flex items-center gap-1">
                  <Info className="w-4 h-4" /> Creation Fee
                </span>
                <span className="font-mono font-bold text-gray-900">0.5 USDC</span>
              </div>
            </div>
          </motion.div>

          {/* Transaction status */}
          <AnimatePresence>
            {txStatus && (
              <motion.div key="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin shrink-0" />
                <p className="text-sm text-blue-800 font-medium">{txStatus}</p>
              </motion.div>
            )}
            {txError && (
              <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700 mb-0.5">Transaction Failed</p>
                  <p className="text-sm text-red-600 whitespace-pre-wrap">{txError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading || (!isPrivate && !isTrusted)}
            className="w-full bg-forest hover:bg-forest/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isPrivate ? <Lock className="w-5 h-5 text-gold" /> : <ShieldCheck className="w-5 h-5 text-gold" />}
                Create {isPrivate ? "Private" : ""} Group
              </span>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
