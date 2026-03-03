"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Shield, BrainCircuit, Zap, Globe,
  ArrowRight, CheckCircle2, Terminal, Code,
  ShieldAlert, Sparkles, Coins, Search, Activity,
  Cpu, Database, Share2, Layers, Bot,
  Lock, ZapOff, Fingerprint, Command, Server,
  CircuitBoard, Network, FileText, ClipboardCheck,
  ShieldCheck, Workflow, Boxes
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "QUANTIFY_OS INITIALIZED...",
    "K15 CORE ONLINE.",
    "SWARM MESH SYNCED.",
    "SCANNING SECTOR 7G...",
    "EVOLUTIONARY GAP DETECTED.",
    "AUTO-HEALING ACTIVE."
  ]);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(1), `SYSTEM EVENT: ${Math.random().toString(36).substring(7).toUpperCase()} ... OK`]);
    }, 4000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [user, loading, router]);

  const stats = [
    { label: "Intelligence Score", val: "L15+", color: "text-indigo-400" },
    { label: "Active Swarms", val: "1,240", color: "text-blue-400" },
    { label: "Self-Heals/Day", val: "48,192", color: "text-emerald-400" },
    { label: "Uptime Protocol", val: "99.99%", color: "text-cyan-400" }
  ];

  const features = [
    {
      title: "Swarm Orchestration (L12)",
      desc: "Hyper-parallelized micro-agent execution mesh. Solves multi-dimensional goals by decomposing tasks across a specialized talent grid.",
      icon: <Share2 size={20} />,
      tag: "Autonomous"
    },
    {
      title: "Evolutionary Reflection",
      desc: "Topological memory system that learns from every trace. Your OS literally rewrites its own strategies to optimize for your specific workflow.",
      icon: <BrainCircuit size={20} />,
      tag: "Self-Learning"
    },
    {
      title: "L7 Self-Healing Core",
      desc: "Automated error correction with sandboxed validation. Detects, analyzes, repairs, and verifies system faults before you even notice them.",
      icon: <Shield size={20} />,
      tag: "Resilient"
    },
    {
      title: "Sovereign Financials",
      desc: "Inter-agent autonomous wallet system. Managed bounties, resource settling, and agent-led micro-transactions on a private ledger.",
      icon: <Coins size={20} />,
      tag: "Economic"
    },
    {
      title: "2-Year Tech Foresight",
      desc: "Predictive engine mapping industry trajectories 24 months out. Keeps your competitive edge sharp by anticipating future tech stacks.",
      icon: <Search size={20} />,
      tag: "Predictive"
    },
    {
      title: "Shadow Simulation",
      desc: "High-fidelity dry-run environments. Every autonomous decision is pre-validated to ensure 100% safety and impact alignment.",
      icon: <Layers size={20} />,
      tag: "Safe-Execution"
    },
    {
      title: "MCP Host Architecture",
      desc: "Direct integration with the Model Context Protocol. Connect your agents to hardware, external databases, and local assets with zero lag.",
      icon: <Network size={20} />,
      tag: "Interoperable"
    },
    {
      title: "Deterministic Autopilot",
      desc: "Strict logical boundary enforcement. No 'hallucination' loops. Every agent action is bound by symbolic logic and real-world constraints.",
      icon: <Workflow size={20} />,
      tag: "Logical"
    },
    {
      title: "Perpetual Growth Engine",
      desc: "The OS identifies capability gaps and automatically generates new Python modules to fulfill missing technical requirements.",
      icon: <Boxes size={20} />,
      tag: "Self-Building"
    },
    {
      title: "Air-Gapped Privacy",
      desc: "Optional local-only execution. Your data never touches our cloud; the system runs entirely on your private hardware.",
      icon: <Lock size={20} />,
      tag: "Sovereign"
    },
    {
      title: "Audit-Ready Logs",
      desc: "Cryptographically signed execution traces. Every agent decision is logged with a verifiable hash for complete transparency.",
      icon: <ClipboardCheck size={20} />,
      tag: "Traceable"
    },
    {
      title: "Bio-Digital WhatsApp Bridge",
      desc: "Remote command execution via WhatsApp. Approve high-value agent transactions or receive critical CEO alerts anywhere in the world.",
      icon: <Share2 size={20} />,
      tag: "Connected"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Sci-Fi Background Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e510,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Glowing Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 3px, transparent 3px)'
      }} />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-black/80 backdrop-blur-xl py-3 border-white/10' : 'bg-transparent py-6 border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
              <Fingerprint className="text-white" size={24} />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-black tracking-tighter text-white block leading-none">QUANTIFY OS</span>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-none mt-1">Sovereign Intelligence Matrix</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Capabilities</a>
            <a href="#architecture" className="hover:text-indigo-400 transition-colors">Architecture</a>
            <a href="#trust" className="hover:text-indigo-400 transition-colors">Trust</a>
            <Link href="/docs" className="hover:text-indigo-400 transition-colors border-l border-white/10 pl-8">Docs</Link>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-10 bg-zinc-900 rounded-full animate-pulse" />
            ) : user ? (
              <Link href="/dashboard" className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Enter Interface
              </Link>
            ) : (
              <Link href="/login" className="px-6 py-2.5 rounded-xl border border-white/20 bg-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/40 transition-all">
                Login / Auth
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[85vh] flex flex-col justify-center items-center px-6 pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-600/5 blur-[120px] rounded-full"
          />

          {/* Edge-to-Edge Grid Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        {/* Hyper-Dense Sidebars (Filling blank spaces) */}
        <div className="hidden xl:flex absolute top-1/2 -translate-y-1/2 left-12 h-[60vh] w-48 flex-col justify-between z-30 pointer-events-none text-zinc-700">
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Integrity_Monitor</p>
              <div className="h-px w-full bg-white/5" />
            </div>
            {[
              { label: "CORE_STABILITY", val: "99.98%" },
              { label: "MEMORY_ISOLATION", val: "HARDENED" },
              { label: "LATENCY_SWARM", val: "0.24ms" }
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[8px] font-bold uppercase tracking-tighter text-zinc-600">{item.label}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      className="h-full bg-indigo-500/40"
                    />
                  </div>
                  <span className="text-[8px] font-mono">{item.val}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[7px] font-mono leading-tight opacity-40">
              S_KERNEL_v15.4_INIT<br />
              0x8849F_HASH_OK<br />
              RSA_4096_ACTIVE<br />
              LOGIC_BOUND_TRUE
            </p>
          </div>
        </div>

        <div className="hidden xl:flex absolute top-1/2 -translate-y-1/2 right-12 h-[60vh] w-48 flex-col justify-between z-30 pointer-events-none text-right">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Swarm_Diagnostics</p>
            <div className="grid grid-cols-4 gap-1 h-20">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
                  className="bg-indigo-500/20 rounded-sm"
                />
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">Active Agent Threads</p>
              <p className="text-xl font-black text-white italic">1,402</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center justify-end gap-2 text-emerald-500">
                <Activity size={10} />
                <span className="text-[9px] font-black">UPTIME_100%</span>
              </div>
              <p className="text-[7px] text-zinc-600 font-medium">Sovereign Layer 7 Pulse: SYNCED</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl w-full text-center relative z-20 space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Build 27.4.03 LIVE • S-TIER ENGINES ACTIVE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-7xl md:text-[110px] font-black tracking-tighter text-white leading-[0.9] flex flex-col"
          >
            <span>SYSTEMIC</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 italic">AUTONOMY.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-500 md:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
          >
            The world's first self-evolving OS. Quantify replaces traditional automation with an autonomous swarm that observes, learns, and builds its own tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 gap-y-6"
          >
            <Link href="/login" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-3 group whitespace-nowrap">
              Initialize Sovereign Kernel
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/docs" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-3">
              View Documentation
            </Link>
          </motion.div>
        </div>

        {/* Live Metrics bar removed from here to follow user request for gap filling below */}
      </header>

      {/* Feature Section with Bullet Points */}
      <section id="features" className="py-20 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-32 h-fit">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-500">
                <Bot size={28} />
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter">Hyper-Dense <br /><span className="text-zinc-600 italic">Capabilities.</span></h2>
              <p className="text-zinc-500 leading-relaxed font-medium">Modular engines that plug directly into your workspace. From financial autonomy to self-healing codebases.</p>

              <div className="space-y-4 pt-8">
                {[
                  "Deterministic Logic Chains",
                  "Zero-Human Touch Recovery",
                  "Multi-Node Swarm Consensus",
                  "Sovereign Memory Encryption",
                  "Hardware-Level Kill Switches",
                  "Real-Time Topological Reflection",
                  "Autonomous Bounty Settlement",
                  "Cross-Provider Model Routing",
                  "Air-Gapped Execution Mode",
                  "Neural Path Optimization",
                  "Topological Context Mapping",
                  "Asynchronous Swarm Sync"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{item}</span>
                  </div>
                ))}
              </div>

              {/* Integrated System Metrics */}
              <div className="pt-12 grid grid-cols-2 gap-3 pb-12">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm"
                  >
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-sm font-black ${stat.color}`}>{stat.val}</p>
                  </motion.div>
                ))}
              </div>

              {/* Sovereign Compliance Section to fill the final gap */}
              <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/10 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-indigo-400" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Sovereign Compliance</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                  Quantify OS is engineered for strict enterprise compliance. Every autonomous decision is cryptographically signed and stored on your private ledger for instant auditing.
                </p>
                <div className="flex gap-4 opacity-30">
                  <div className="px-2 py-1 border border-white/20 rounded text-[8px] font-black">SOC2_READY</div>
                  <div className="px-2 py-1 border border-white/20 rounded text-[8px] font-black">HIPAA_SECURE</div>
                  <div className="px-2 py-1 border border-white/20 rounded text-[8px] font-black">GDPR_SOVEREIGN</div>
                </div>
              </div>

              {/* Real-time Swarm Analytics Visual to fill the remaining gap */}
              <div className="p-6 rounded-3xl bg-[#080808] border border-white/5 space-y-6 overflow-hidden relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="text-indigo-500 animate-pulse" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Swarm Pulse</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-500">STABLE_v15.4</span>
                </div>

                <div className="flex items-end gap-1 h-20">
                  {[40, 70, 45, 90, 65, 80, 50, 95, 85, 40, 60, 75, 55, 90, 40, 80, 65].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.05
                      }}
                      className="flex-1 bg-gradient-to-t from-indigo-500/20 to-indigo-500/60 rounded-t-sm"
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-zinc-600">
                  <span>0ms Delay</span>
                  <span>1.2k Nodes Active</span>
                  <span>99.9% Efficiency</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-[#080808] border border-white/5 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                      {f.icon}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-md border border-indigo-500/20">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-white font-black uppercase text-xs tracking-widest mb-3">{f.title}</h3>
                  <p className="text-[11px] leading-relaxed text-zinc-500 font-medium">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section id="trust" className="py-20 bg-[#050505] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase tracking-[0.2em]">Engineered for Trust</h2>
            <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mb-8" />
            <p className="text-zinc-500 max-w-2xl mx-auto">We don't ask for your trust. We provide the cryptographic proof of every action taken by your agents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
              <ShieldCheck className="text-emerald-500" size={32} />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">SOC 2 / HIPAA Ready</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">Compliance patterns built into the structural engine ensure all data handling meets gold-standard security requirements.</p>
              <Link href="/audit" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2 pt-4">View Audit History <ArrowRight size={12} /></Link>
            </div>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
              <FileText className="text-indigo-500" size={32} />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Open Methodology</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">Our swarm logic is fully documented. No black boxes. Understand every step of the agent reasoning process.</p>
              <Link href="/docs" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2 pt-4">Read Documentation <ArrowRight size={12} /></Link>
            </div>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
              <Lock className="text-amber-500" size={32} />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Sovereign Encryption</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">All workspace keys and data are encrypted with your private seed. Not even the platform admins can read your thoughts.</p>
              <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2 pt-4">Privacy Policy <ArrowRight size={12} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Deep-Dive */}
      <section id="architecture" className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-black text-white tracking-tighter mb-4">The Sovereign <br /><span className="text-indigo-500 italic">Stack Architecture.</span></h2>
              <p className="text-zinc-500 leading-relaxed font-medium">Quantify OS is built on a 7-layer cognitive engine, separated from the browser and global services for maximum security.</p>
            </div>

            <div className="space-y-4">
              {[
                { title: "Layer 1: Symbolic Logic Host", desc: "Deterministic kernel for agent thought boundaries." },
                { title: "Layer 2: Swarm Mesh Topology", desc: "Communication bus for parallelized micro-agents." },
                { title: "Layer 3: Procedural Memory", desc: "Graph-based storage of evolved strategies and lessons." },
                { title: "Layer 4: Economic Ledger", desc: "Private blockchain for inter-agent bounty settlement." }
              ].map((layer, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-indigo-500 font-black text-xl">0{i + 1}</div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{layer.title}</h4>
                    <p className="text-[10px] text-zinc-600 font-medium">{layer.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 h-full w-full relative z-10">
            {[
              { title: "K15 Sovereign Kernel", icon: <Fingerprint size={24} />, meta: "0x8849F_SIG_STABLE", status: "ENC_RSA_4096", color: "text-indigo-400" },
              { title: "L12 Swarm Mesh", icon: <Network size={24} />, meta: "N_ACTIVE: 1,402", status: "LATENCY: 0.2ms", color: "text-blue-400" },
              { title: "L7 Self-Healing", icon: <Shield size={24} />, meta: "H_SUCCESS: 99.9%", status: "ZERO_TOUCH_FAILOVER", color: "text-emerald-400" },
              { title: "Evo_Adaptive Engine", icon: <BrainCircuit size={24} />, meta: "v15.4_EVOLUTION", status: "REFACTOR: ACTIVE", color: "text-cyan-400" }
            ].map((box, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-3xl bg-black border border-white/5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#4f46e510,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`${box.color} drop-shadow-[0_0_8px_currentColor]`}>
                  {box.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{box.title}</h4>
                  <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{box.meta}</p>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] font-black tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">
                  {box.status}
                </div>
              </motion.div>
            ))}

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/5" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-white/5" />
            </div>
          </div>
        </div>
      </section>

      {/* System Logs - Futuristic Ticker */}
      <div className="py-2 bg-indigo-600/5 border-y border-white/5 overflow-hidden flex items-center">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {logs.map((log, i) => (
            <span key={i} className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">
              <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
              {log}
            </span>
          ))}
          {logs.map((log, i) => (
            <span key={`dup-${i}`} className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">
              <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
              {log}
            </span>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">THE FUTURE IS AN <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">OPEN TERMINAL.</span></h2>
          <p className="text-zinc-500 text-lg font-medium">Join the select few operating at L15 systemic autonomy.</p>

          <div className="flex justify-center pt-8">
            <Link href="/login" className="px-12 py-6 rounded-2xl bg-indigo-600 text-white font-black text-lg uppercase tracking-[0.2em] hover:bg-indigo-500 hover:scale-105 transition-all shadow-2xl active:scale-95">
              Enter the Swarm
            </Link>
          </div>
        </div>

        {/* Animated Matrix Background for CTA */}
        <div className="absolute inset-0 opacity-10 blur-[2px] pointer-events-none flex items-center justify-center">
          <div className="text-[8px] font-mono text-indigo-500 leading-tight select-none">
            {Array(20).fill(0).map((_, i) => (
              <div key={i}>{Array(100).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join(' ')}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#020202]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-500 border border-indigo-500/30">
              <Command size={18} />
            </div>
            <span className="text-sm font-black text-white uppercase tracking-tighter">QUANTIFY OS</span>
          </div>

          <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-zinc-600">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/audit" className="hover:text-white transition-colors">Audit</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>

          <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">© 2026 SOVEREIGN_KERNEL_v15.0</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
