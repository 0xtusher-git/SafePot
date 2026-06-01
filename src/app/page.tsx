"use client";

import Link from "next/link";
import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, Users, Coins, ArrowRight } from "lucide-react";
import CountUp from "react-countup";
import { motion } from "framer-motion";

export default function Home() {
  const { isConnected, connect, isTrusted, address } = useWeb3();

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 flex flex-col items-center w-full bg-light">
      {/* Hero Section */}
      <section className="w-full px-6 py-24 flex flex-col items-center text-center relative overflow-hidden">
        {/* Clean background elements */}
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-green-50/50 to-transparent -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/5 rounded-full blur-[100px] -z-10" />
        
        <motion.div 
          initial="hidden" animate="visible" variants={fadeUpVariant} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-ring relative z-10" />
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-700">Powered by ArcGrade Trust Protocol</span>
        </motion.div>

        <motion.h1 
          initial="hidden" animate="visible" variants={fadeUpVariant} transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-forest"
        >
          Save Together. <br className="hidden md:block" /> Win Together.
        </motion.h1>
        
        <motion.p 
          initial="hidden" animate="visible" variants={fadeUpVariant} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-600 max-w-2xl mb-12 font-medium"
        >
          Trustless group savings on Arc Testnet powered by USDC.
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fadeUpVariant} transition={{ duration: 0.5, delay: 0.3 }}>
          {!isConnected ? (
            <button 
              onClick={connect}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-forest rounded-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/20"
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
                  className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-forest bg-gold rounded-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/30"
                >
                  <span className="relative z-10 flex items-center gap-2 text-lg">
                    Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ) : (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl max-w-md shadow-sm">
                  <h3 className="text-red-700 font-bold text-lg mb-2">Trust Score Too Low</h3>
                  <p className="text-red-600/80 text-sm mb-4">
                    Your wallet trust score is too low to use SafePot.
                  </p>
                  <a 
                    href="https://arc-grade.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-full text-sm transition-colors"
                  >
                    Improve your score
                  </a>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-12 relative z-10 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Groups", value: 142, prefix: "", suffix: "", icon: Users },
            { label: "Total USDC Saved", value: 45200, prefix: "$", suffix: "", icon: Coins },
            { label: "Total Members", value: 850, prefix: "", suffix: "+", icon: ShieldCheck },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow group hover:-translate-y-1 duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <stat.icon className="w-8 h-8 text-forest" />
              </div>
              <h3 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                {stat.prefix}
                <CountUp end={stat.value} duration={2.5} separator="," />
                {stat.suffix}
              </h3>
              <p className="text-gray-500 font-bold uppercase tracking-wider text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 text-center">
        <motion.h2 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}
          className="text-3xl md:text-5xl font-bold mb-16 text-gray-900"
        >
          How SafePot Works
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent z-0"></div>
          
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
            <motion.div 
              key={i} 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} transition={{ duration: 0.5, delay: i * 0.2 }}
              className="relative z-10 flex flex-col items-center group"
            >
              <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center text-3xl font-bold text-forest mb-6 shadow-sm group-hover:border-gold group-hover:scale-110 transition-all duration-300">
                {item.step}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
