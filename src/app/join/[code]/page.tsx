"use client";

import { useWeb3 } from "@/lib/Web3Context";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, Users, ShieldCheck, AlertCircle, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Contract, formatUnits, JsonRpcProvider } from "ethers";
import Link from "next/link";

const SAFEPOT_ADDRESS = process.env.NEXT_PUBLIC_SAFEPOT_ADDRESS || "0x8035224a5d29d94D14C472E767F75BA29E46Fe59";

const SAFEPOT_ABI = [
  "function inviteCodeToGroupId(string) external view returns (uint256)",
  "function getGroup(uint256 groupId) external view returns (uint256 id, string name, uint256 maxMembers, uint256 contributionAmount, string roundDuration, address[] members, uint256 currentRound, uint256 potBalance, uint256 currentTurnIndex, bool isComplete, bool isPrivate, string inviteCode)",
  "function joinPrivateGroup(uint256 groupId, string memory inviteCode) external",
];

type GroupPreview = {
  id: number;
  name: string;
  amount: number;
  duration: string;
  members: number;
  maxMembers: number;
  potSize: number;
  isComplete: boolean;
};

export default function JoinPrivateGroup() {
  const { code } = useParams();
  const router = useRouter();
  const { isConnected, provider, signer, address } = useWeb3();

  const [mounted, setMounted] = useState(false);
  const [group, setGroup] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && code) {
      resolveInviteCode();
    }
  }, [mounted, code, provider]);

  const resolveInviteCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const rpcProvider = provider || new JsonRpcProvider("https://rpc.testnet.arc.network");
      const safePot = new Contract(SAFEPOT_ADDRESS, SAFEPOT_ABI, rpcProvider);

      // Lookup the invite code on-chain
      const groupIdBigInt = await safePot.inviteCodeToGroupId(code);
      const groupId = Number(groupIdBigInt);

      if (groupId === 0) {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
        return;
      }

      const data = await safePot.getGroup(groupId);

      const membersArray: string[] = data.members;

      if (address) {
        const isMember = membersArray.map(m => m.toLowerCase()).includes(address.toLowerCase());
        setAlreadyMember(isMember);
      }

      setGroup({
        id: groupId,
        name: data.name,
        amount: Number(formatUnits(data.contributionAmount, 6)),
        duration: data.roundDuration,
        members: membersArray.length,
        maxMembers: Number(data.maxMembers),
        potSize: Number(formatUnits(data.contributionAmount, 6)) * Number(data.maxMembers),
        isComplete: data.isComplete,
      });

    } catch (err) {
      console.error(err);
      setError("Failed to resolve this invite link. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isConnected || !signer) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!group) return;

    setJoining(true);
    try {
      const safePot = new Contract(SAFEPOT_ADDRESS, SAFEPOT_ABI, signer);

      const feeData = await signer.provider?.getFeeData();
      const txOptions = feeData?.gasPrice ? { gasPrice: feeData.gasPrice } : {};

      const tx = await safePot.joinPrivateGroup(group.id, code as string, txOptions);
      alert("Transaction sent! Waiting for confirmation...");
      await tx.wait();
      alert("You have successfully joined the group!");
      router.push(`/group/${group.id}`);
    } catch (err: any) {
      console.error(err);
      alert("Transaction failed: " + (err.reason || err.message || "Unknown error"));
    } finally {
      setJoining(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-forest animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Resolving invite link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-100 rounded-3xl p-10 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/browse" className="bg-forest text-white px-6 py-2.5 rounded-full font-bold inline-block hover:bg-forest/90 transition-colors">
            Browse Public Groups
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!group) return null;

  const isFull = group.members >= group.maxMembers;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">

          {/* Header Banner */}
          <div className="bg-forest p-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Private Invitation</p>
            <h1 className="text-3xl font-extrabold text-white mb-1">{group.name}</h1>
            <p className="text-white/70 font-medium text-sm">{group.amount} USDC per round • {group.duration}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="p-5 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{group.members}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">/ {group.maxMembers} members</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-2xl font-extrabold text-forest">{group.potSize}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">USDC total pot</p>
            </div>
            <div className="p-5 text-center">
              <p className={`text-2xl font-extrabold ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                {group.maxMembers - group.members}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">spots left</p>
            </div>
          </div>

          {/* Action Area */}
          <div className="p-8">
            {group.isComplete ? (
              <div className="text-center py-4">
                <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-bold text-lg mb-1">Group Cycle Complete</p>
                <p className="text-gray-400 font-medium text-sm">This savings group has finished its cycle.</p>
              </div>
            ) : isFull ? (
              <div className="text-center py-4">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-bold text-lg mb-1">Group is Full</p>
                <p className="text-gray-400 font-medium text-sm">All {group.maxMembers} spots have been taken.</p>
              </div>
            ) : alreadyMember ? (
              <div className="text-center py-4">
                <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-green-700 font-bold text-lg mb-1">You're already a member!</p>
                <Link href={`/group/${group.id}`}
                  className="inline-flex items-center gap-2 bg-forest text-white px-6 py-2.5 rounded-full font-bold mt-4 hover:bg-forest/90 transition-colors">
                  Go to Group <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : !isConnected ? (
              <div className="text-center py-4">
                <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="text-gray-700 font-bold text-lg mb-2">Connect Your Wallet</p>
                <p className="text-gray-500 font-medium text-sm">Connect your wallet to accept this private group invitation.</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 font-medium text-sm text-center mb-6">
                  You've been invited to join <strong>{group.name}</strong>. Joining will add you to the savings rotation.
                </p>
                <button onClick={handleJoin} disabled={joining}
                  className={`w-full flex items-center justify-center gap-2 font-bold text-lg py-4 rounded-full transition-all shadow-md ${joining ? 'bg-forest/70 text-white cursor-not-allowed' : 'bg-forest hover:bg-forest/90 text-white hover:shadow-lg hover:-translate-y-0.5'}`}>
                  {joining
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</>
                    : <><ShieldCheck className="w-5 h-5 text-gold" /> Accept Invitation</>
                  }
                </button>
                <p className="text-xs text-gray-400 text-center mt-3 font-medium">
                  No trust score required for private groups.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
