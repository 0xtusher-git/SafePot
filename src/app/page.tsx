"use client";

import Link from "next/link";
import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, Users, Coins, ArrowRight } from "lucide-react";

export default function Home() {
  const { isConnected, connect, isTrusted, address } = useWeb3();

  return (
    <div className="flex-1 flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full px-6 py-24 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal/30 rounded-full blur-[120px] -z-10" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest/50 border border-gold/30 mb-8 backdrop-blur-sm">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <span className="text-sm font-medium text-cream/90">Powered by ArcGrade Trust Protocol</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white via-cream to-gold">
          Save Together. <br className="hidden md:block" /> Trust On-Chain.
        </h1>
        
        <p className="text-xl md:text-2xl text-cream/80 max-w-2xl mb-12 font-light">
          Group savings powered by Arc Testnet. Only verified, trusted wallets allowed.
        </p>

        {!isConnected ? (
          <button 
            onClick={connect}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-forest bg-gold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(244,196,48,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2 text-lg">
              Connect Wallet to Join <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {isTrusted ? (
              <Link 
                href="/dashboard"
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-teal rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-teal/80 border border-teal-light"
              >
                <span className="relative z-10 flex items-center gap-2 text-lg">
                  Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl max-w-md backdrop-blur-sm">
                <h3 className="text-red-400 font-bold text-lg mb-2">Trust Score Too Low</h3>
                <p className="text-cream/80 text-sm mb-4">
                  Your wallet ({address?.slice(0,6)}...{address?.slice(-4)}) trust score is too low to join SafePot.
                </p>
                <a 
                  href="https://arc-grade.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm hover:bg-red-500/30 transition-colors"
                >
                  Improve your score
                </a>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Groups", value: "142", icon: Users },
            { label: "Total USDC Saved", value: "$45,200", icon: Coins },
            { label: "Total Members", value: "850+", icon: ShieldCheck },
          ].map((stat, i) => (
            <div key={i} className="bg-forest/40 border border-teal/40 rounded-3xl p-8 flex flex-col items-center text-center backdrop-blur-sm hover:bg-forest/60 transition-colors">
              <div className="w-16 h-16 rounded-full bg-teal/30 flex items-center justify-center mb-4">
                <stat.icon className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">{stat.value}</h3>
              <p className="text-cream/60 font-medium uppercase tracking-wider text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-white">How SafePot Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-teal/0 via-gold/30 to-teal/0 z-0"></div>
          
          {[
            {
              step: "1",
              title: "Verify Trust",
              desc: "Connect your wallet. We use ArcGrade to ensure only wallets with a high trust score can participate.",
            },
            {
              step: "2",
              title: "Join a Group",
              desc: "Create a new savings group or join an existing one. Agree on the USDC contribution and round duration.",
            },
            {
              step: "3",
              title: "Save & Win",
              desc: "Contribute USDC every round. One member gets the full pot each round, rotating until everyone wins.",
            }
          ].map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-forest border-4 border-teal flex items-center justify-center text-3xl font-bold text-gold mb-6 shadow-xl">
                {item.step}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-cream/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
