"use client";

import Link from "next/link";
import { useWeb3 } from "@/lib/Web3Context";
import { ShieldCheck, Users, Coins, ArrowRight, Star, Lock, Zap } from "lucide-react";
import CountUp from "react-countup";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const { isConnected, connect, isTrusted } = useWeb3();

  return (
    <div className="flex-1 flex flex-col items-center w-full overflow-x-hidden">
      {/* ───── HERO ───── */}
      <section className="w-full relative overflow-hidden bg-white">
        {/* Subtle background blobs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-green-50 rounded-full blur-[120px] -z-0 opacity-60" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-50 rounded-full blur-[100px] -z-0 opacity-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          {/* Text Side */}
          <div>
            {/* Live badge */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-live flex-shrink-0" />
              <ShieldCheck className="w-4 h-4 text-forest flex-shrink-0" />
              <span className="text-sm font-bold text-gray-700">Live on Arc Testnet</span>
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
              Save Together. <br />
              <span className="text-forest">Win Together.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-500 max-w-xl mb-10 font-medium leading-relaxed">
              Trustless group savings on Arc Testnet powered by USDC. Only verified wallets join — no defaults, no drama.
            </motion.p>

            {/* CTA */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 items-center">
              {!isConnected ? (
                <>
                  <button onClick={connect}
                    className="group inline-flex items-center gap-2 px-8 py-4 font-bold text-white bg-forest rounded-full transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/20 text-lg">
                    Connect Wallet <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-gold" />
                  </button>
                  <Link href="/browse"
                    className="inline-flex items-center gap-2 px-6 py-4 font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-all text-base">
                    Browse Groups
                  </Link>
                </>
              ) : isTrusted ? (
                <Link href="/dashboard"
                  className="group inline-flex items-center gap-2 px-8 py-4 font-bold text-forest bg-gold rounded-full transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/30 text-lg">
                  Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="bg-red-50 border border-red-100 p-5 rounded-2xl max-w-sm shadow-sm">
                  <h3 className="text-red-700 font-bold text-base mb-1">Trust Score Too Low</h3>
                  <p className="text-red-500 text-sm mb-3 font-medium">Improve your score to access SafePot.</p>
                  <a href="https://arc-grade.vercel.app" target="_blank" rel="noopener noreferrer"
                    className="inline-block px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-full text-sm transition-colors">
                    Improve Score →
                  </a>
                </div>
              )}
            </motion.div>

            {/* Trust Badges */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-3 mt-8">
              {[
                { icon: Lock, label: "Trust-Gated" },
                { icon: ShieldCheck, label: "ArcGrade Verified" },
                { icon: Zap, label: "On-Chain Transparent" },
              ].map(b => (
                <span key={b.label} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                  <b.icon className="w-3.5 h-3.5 text-forest" /> {b.label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Illustration Side */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              {/* Animated savings pot SVG */}
              <div className="animate-float">
                <svg viewBox="0 0 300 300" className="w-full h-auto drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
                  {/* Pot body */}
                  <ellipse cx="150" cy="220" rx="100" ry="20" fill="#D1FAE5" opacity="0.5"/>
                  <path d="M 60 160 Q 55 240 150 245 Q 245 240 240 160 Z" fill="#1B4332"/>
                  <path d="M 60 160 Q 55 230 150 235 Q 245 230 240 160 Z" fill="#2D6A4F"/>
                  {/* Pot rim */}
                  <ellipse cx="150" cy="160" rx="90" ry="18" fill="#40916C"/>
                  <ellipse cx="150" cy="155" rx="90" ry="18" fill="#52B788"/>
                  {/* Lid */}
                  <ellipse cx="150" cy="148" rx="80" ry="14" fill="#1B4332"/>
                  <rect x="135" y="126" width="30" height="16" rx="8" fill="#F4C430"/>
                  <ellipse cx="150" cy="126" rx="15" ry="7" fill="#F4C430"/>
                  {/* Gold coins */}
                  <ellipse cx="110" cy="195" rx="14" ry="7" fill="#F4C430" opacity="0.9"/>
                  <ellipse cx="150" cy="200" rx="14" ry="7" fill="#F4C430"/>
                  <ellipse cx="190" cy="193" rx="14" ry="7" fill="#F4C430" opacity="0.8"/>
                  {/* USDC text */}
                  <text x="150" y="204" textAnchor="middle" fill="#92400E" fontWeight="bold" fontSize="9" fontFamily="monospace">USDC</text>
                  {/* Sparkles */}
                  <text x="60" y="110" fontSize="20" fill="#F4C430" opacity="0.8">✦</text>
                  <text x="220" y="90" fontSize="14" fill="#F4C430" opacity="0.6">✦</text>
                  <text x="240" y="140" fontSize="10" fill="#2D6A4F" opacity="0.8">✦</text>
                  <text x="40" y="170" fontSize="12" fill="#52B788" opacity="0.6">✦</text>
                </svg>
              </div>
              {/* Floating stat cards */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute top-4 -right-4 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Saved</p>
                <p className="text-xl font-extrabold text-forest">$45,200</p>
              </motion.div>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                className="absolute bottom-8 -left-4 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs font-bold text-gray-400 uppercase">Members</p>
                <p className="text-xl font-extrabold text-forest">850+</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───── STATS BAR ───── */}
      <section className="w-full bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Groups", value: 142, prefix: "", suffix: "", icon: Users, color: "bg-green-50" },
            { label: "Total USDC Saved", value: 45200, prefix: "$", suffix: "", icon: Coins, color: "bg-yellow-50" },
            { label: "Total Members", value: 850, prefix: "", suffix: "+", icon: Star, color: "bg-blue-50" },
          ].map((stat, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white border border-gray-100 rounded-3xl p-8 flex items-center gap-5 shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
              <div className={`w-16 h-16 rounded-2xl ${stat.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-8 h-8 text-forest" />
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-gray-900 flex items-baseline gap-0.5">
                  {stat.prefix}<CountUp end={stat.value} duration={2.5} separator="," />{stat.suffix}
                </h3>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-xs mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="w-full bg-gray-50 border-t border-gray-100 py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-4">
            <span className="text-xs font-bold text-forest uppercase tracking-widest bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">How it works</span>
          </motion.div>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-16">
            Simple. Trustless. Rewarding.
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            {[
              { step: "1", icon: ShieldCheck, title: "Verify Trust", desc: "Connect your wallet. ArcGrade checks your on-chain reputation to ensure only trusted wallets participate.", color: "bg-green-50 text-forest border-green-100" },
              { step: "2", icon: Users, title: "Join a Group", desc: "Create or join a savings group. Agree on USDC contribution and round duration with your co-savers.", color: "bg-blue-50 text-blue-700 border-blue-100" },
              { step: "3", icon: Coins, title: "Save & Win", desc: "Contribute USDC each round. One member wins the full pot per round, rotating until everyone wins.", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center group">
                <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 ${item.color}`}>
                  <item.icon className="w-9 h-9" />
                </div>
                <div className="absolute top-0 right-1/4 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-extrabold text-gray-700 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TRUST BADGE ───── */}
      <section className="w-full bg-white border-t border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="bg-gray-50 border border-gray-200 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="w-20 h-20 bg-forest rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
              <ShieldCheck className="w-10 h-10 text-gold" />
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-bold text-forest uppercase tracking-widest mb-2">Trust Layer</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Powered by ArcGrade</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Every SafePot member is vetted using ArcGrade&apos;s on-chain reputation protocol. Only wallets with a proven history of trustworthy behavior can participate — making your savings group safer than ever.
              </p>
            </div>
            <a href="https://arc-grade.vercel.app" target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 bg-forest hover:bg-forest/90 text-white font-bold px-6 py-3 rounded-full transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2 text-sm">
              View ArcGrade <ArrowRight className="w-4 h-4 text-gold" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
