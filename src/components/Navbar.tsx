"use client";

import Link from "next/link";
import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, Wallet } from "lucide-react";

export function Navbar() {
  const { address, isConnected, connect, disconnect, isTrusted } = useWeb3();

  return (
    <nav className="w-full py-4 px-6 md:px-12 flex justify-between items-center border-b border-teal/30 bg-forest/80 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <ShieldCheck className="text-gold w-8 h-8" />
        <span className="text-2xl font-bold tracking-tight text-white">
          Safe<span className="text-gold">Pot</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/browse" className="text-cream/80 hover:text-white transition-colors">
          Browse Groups
        </Link>
        {isConnected && (
          <Link href="/dashboard" className="text-cream/80 hover:text-white transition-colors">
            Dashboard
          </Link>
        )}

        {isConnected ? (
          <div className="flex items-center gap-3">
            {isTrusted && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                <ShieldCheck w-3 h-3 /> Trusted
              </span>
            )}
            {!isTrusted && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                Untrusted
              </span>
            )}
            <div className="group relative">
              <button className="flex items-center gap-2 bg-teal hover:bg-teal/80 text-white px-4 py-2 rounded-full transition-all border border-teal/50">
                <Wallet className="w-4 h-4" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-32">
                <button
                  onClick={disconnect}
                  className="w-full text-left px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white text-sm rounded-lg shadow-xl"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-gold hover:bg-yellow-500 text-forest font-bold px-6 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(244,196,48,0.3)] hover:shadow-[0_0_25px_rgba(244,196,48,0.5)] flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" /> Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
