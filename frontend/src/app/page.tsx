"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import {
  Rocket, Shield, BrainCircuit, Zap, Globe,
  ArrowRight, CheckCircle2, Terminal, Code,
  ShieldAlert, Sparkles, Coins, Search, Activity
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const features = [
    {
      title: "2-Year Tech Foresight",
      desc: "Our engine doesn't just analyze the present. It projects industry trajectories 24 months into the future, ensuring your swarms are always ahead.",
      icon: <Search className="text-indigo-400" size={24} />,
      gradient: "from-indigo-500/20 to-transparent"
    },
    {
      title: "Shadow Simulation",
      desc: "Every autonomous decision is pre-executed in a high-fidelity shadow container to predict impact and safety scores before it touches your codebase.",
      icon: <Activity className="text-emerald-400" size={24} />,
      gradient: "from-emerald-500/20 to-transparent"
    },
    {
      title: "Inter-Agent Economy",
      desc: "Agents negotiate and settle micro-bounties using their internal wallets, creating a self-optimizing marketplace for complex task resolution.",
      icon: <Coins className="text-amber-400" size={24} />,
      gradient: "from-amber-500/20 to-transparent"
    },
    {
      title: "The MCP Universal Mesh",
      desc: "Model Context Protocol support allows your agents to interface with any modern hardware or software service using a single standardized bridge.",
      icon: <Globe className="text-cyan-400" size={24} />,
      gradient: "from-cyan-500/20 to-transparent"
    },
    {
      title: "Zero-Risk Governance",
      desc: "Integrated Global & Workspace Kill Switches combined with strict identity validation ensure you remain the ultimate sovereign of your AI army.",
      icon: <ShieldAlert className="text-red-400" size={24} />,
      gradient: "from-red-500/20 to-transparent"
    },
    {
      title: "Swarm Load Balancing",
      desc: "Autonomous edge-orchestration moves your workloads to the most cost-effective and highest performance compute nodes globally.",
      icon: <Zap className="text-fuchsia-400" size={24} />,
      gradient: "from-fuchsia-500/20 to-transparent"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              <span className="text-white font-black text-xl">Q</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tighter text-white block leading-none">Quantify OS</span>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-none mt-1">S-Tier Sovereignty</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
            <a href="#economy" className="hover:text-white transition-colors">Economy</a>
            <a href="#governance" className="hover:text-white transition-colors">Governance</a>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-10 bg-zinc-800 animate-pulse rounded-full" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                Enter OS
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-all"
              >
                Authenticate
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-32 md:pt-60 md:pb-48 overflow-hidden">
          {/* Animated Background Orbs */}
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-10 overflow-hidden"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Phase 1 S-Tier Certified</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-600"
            >
              Digital Sovereignty <br className="hidden lg:block" /> Has Arrived.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-2xl text-zinc-500 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              The world's first autonomous AI Operating System designed for systemic independence.
              Quantify OS V11 doesn't just follow instructions—it evolves to meet your goals.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link
                href={user ? "/dashboard" : "/login"}
                className="group relative px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.4)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {user ? "Enter System" : "Get Sovereignty"}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#intelligence"
                className="px-10 py-5 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-black text-lg hover:bg-white/[0.08] transition-all"
              >
                Deep Dive Research
              </a>
            </motion.div>
          </div>
        </section>

        {/* Intelligence Radar Section */}
        <section id="intelligence" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-8">
                  <BrainCircuit size={28} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 leading-tight">
                  Rolling 24-Month <br />
                  <span className="text-indigo-500 uppercase tracking-widest text-lg font-bold">Evolutionary Foresight</span>
                </h2>
                <p className="text-lg text-zinc-500 font-medium leading-relaxed mb-8">
                  Quantify OS continuously ingests live market signals from across the global network. It targets a moving technological horizon exactly 2 years from the current date.
                </p>
                <ul className="space-y-4">
                  {[
                    "Deterministic goal decomposition",
                    "Autonomous capability generation",
                    "Self-refactoring core modules",
                    "Live market pulse ingestion"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-300">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Evolution Engine Logs</span>
                  </div>
                  <div className="space-y-4 font-mono text-[11px] text-indigo-400 opacity-80">
                    <p className="flex gap-4"><span className="text-zinc-600">03:42:11</span> <span className="text-white">INGESTING:</span> tech_trajectory_2028.json</p>
                    <p className="flex gap-4"><span className="text-zinc-600">03:42:12</span> <span className="text-white">SCANNING:</span> github.com/mcp-mesh-standard</p>
                    <p className="flex gap-4"><span className="text-zinc-600">03:42:15</span> <span className="text-emerald-400">SUCCESS:</span> capability_mcp_bridge_v2 generated</p>
                    <p className="flex gap-4"><span className="text-zinc-600">03:42:16</span> <span className="text-indigo-400 font-bold">SIMULATING:</span> shadow_dry_run_0x4f...</p>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-6">
                      <div className="h-full w-2/3 bg-indigo-500 animate-pulse" />
                    </div>
                  </div>
                </div>
                {/* Visual Accent */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-32 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase tracking-[0.2em]">The Sovereign Toolkit</h2>
              <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -8 }}
                  className={`p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-black text-white mb-4 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Economy & Swarm Visualization Section */}
        <section id="economy" className="py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-black text-white tracking-tighter mb-6">A Self-Sustaining Economy.</h2>
              <p className="text-zinc-500 font-medium">Agents earn, spend, and negotiate micro-bounties to achieve complex results. No human intervention required.</p>
            </div>

            <div className="relative h-[400px] rounded-3xl bg-black border border-white/5 flex items-center justify-center overflow-hidden">
              {/* Visual Mock of Swarm Network */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="w-[300px] h-[300px] rounded-full border border-indigo-500/20 animate-spin-slow" />
                <div className="absolute w-[450px] h-[450px] rounded-full border border-blue-500/10 animate-spin-reverse-slow" />
                <div className="absolute w-[150px] h-[150px] rounded-full bg-indigo-500/20 blur-[100px]" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { label: "Daily Transactions", val: "14.2k", icon: <ArrowRightLeft size={16} /> },
                  { label: "Active Nodes", val: "842", icon: <Globe size={16} /> },
                  { label: "Avg Bounty", val: "$0.004", icon: <Coins size={16} /> },
                  { label: "Settlement Time", val: "12ms", icon: <Zap size={16} /> }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="flex items-center justify-center text-indigo-400 mb-2">{stat.icon}</div>
                    <div className="text-2xl font-black text-white">{stat.val}</div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="max-w-5xl mx-auto px-6">
            <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-indigo-600 to-blue-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 text-center">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-tight">
                  Start Your Autonomous <br /> Evolution Today.
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={user ? "/dashboard" : "/login"}
                    className="px-10 py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-zinc-100 transition-all shadow-2xl"
                  >
                    Initialize Your Workspace
                  </Link>
                  <a
                    href="#pricing"
                    className="px-10 py-5 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/20 text-white font-black text-lg hover:bg-black/30 transition-all"
                  >
                    B2B Enterprise Access
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">Q</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-white">Quantify OS</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-sm font-medium leading-relaxed">
              The world's most advanced autonomous infrastructure.
              Built for high-frequency evolution and digital sovereignty.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-zinc-500 font-medium">
              <li><a href="#" className="hover:text-white">Evolution Engine</a></li>
              <li><a href="#" className="hover:text-white">Swarm Orchestration</a></li>
              <li><a href="#" className="hover:text-white">MCP Bridge</a></li>
              <li><a href="#" className="hover:text-white">Sovereign Wallet</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Security & Legal</h4>
            <ul className="space-y-4 text-sm text-zinc-500 font-medium">
              <li><Link href="/privacy" className="hover:text-white text-indigo-400">Privacy Sovereignty</Link></li>
              <li><a href="#" className="hover:text-white">Kill Switch Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Protocol</a></li>
              <li><a href="#" className="hover:text-white">Audit Reports</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/[0.03] text-center">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em]">© 2026 QUANTIFY OS V11.0 / AUTH_S_TIER_GLOBAL</p>
        </div>
      </footer>

      {/* Tailwind Extended Helpers */}
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse 5s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Dummy Icon for stats
function ArrowRightLeft({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
    </svg>
  );
}
