"use client";

import Link from "next/link";
import { useWeb3 } from "@/lib/Web3Context";
import { Mail, ShieldCheck, Wallet } from "lucide-react";

export function Navbar() {
  const { address, isConnected, connect, changeWallet, disconnect, isTrusted, loginMethod, userEmail } = useWeb3();

  return (
    <nav className="w-full py-4 px-6 md:px-12 flex justify-between items-center border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm transition-all">
      <Link href="/" className="flex items-center gap-2 group">
        <ShieldCheck className="text-forest w-8 h-8 group-hover:scale-110 transition-transform" />
        <span className="text-2xl font-bold tracking-tight text-forest">
          Safe<span className="text-gold">Pot</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/browse" className="text-gray-600 font-medium hover:text-forest transition-colors">
          Browse Groups
        </Link>
        {isConnected && (
          <Link href="/dashboard" className="text-gray-600 font-medium hover:text-forest transition-colors">
            Dashboard
          </Link>
        )}

        {isConnected ? (
          <div className="flex items-center gap-3">
            {isTrusted ? (
              <span className="flex items-center gap-1 text-xs font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Trusted
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200 shadow-sm">
                Untrusted
              </span>
            )}
            <div className="group relative">
              <button className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-forest font-semibold px-4 py-2 rounded-full transition-all border border-gray-200 shadow-sm hover:shadow-md">
                <Wallet className="w-4 h-4 text-gold" />
                <span className="flex flex-col items-start leading-tight">
                  <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  {loginMethod === "thirdweb" && userEmail && (
                    <span className="text-[10px] text-gray-400 font-normal flex items-center gap-0.5">
                      <Mail className="w-2.5 h-2.5" />{userEmail}
                    </span>
                  )}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-44 origin-top-right z-50">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={changeWallet}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <Wallet className="w-3.5 h-3.5 text-forest" /> Change Wallet
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    onClick={disconnect}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-600 text-gray-700 font-medium text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-forest hover:bg-forest/90 text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Wallet className="w-4 h-4 text-gold" /> Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
