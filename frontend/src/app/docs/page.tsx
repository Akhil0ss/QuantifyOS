"use client";

import { motion } from "framer-motion";
import {
    BookOpen, Terminal, Network, Cpu, Shield,
    ArrowLeft, ChevronRight, Code, Zap, Database
} from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
    const sections = [
        {
            title: "Core Architecture",
            icon: <Network className="text-indigo-500" size={20} />,
            content: "Quantify OS is built on a distributed swarm-intelligence model. Our core engine, the Sovereign Kernel, manages the lifecycle of micro-agents across isolated logical containers."
        },
        {
            title: "L12 Swarm Logic",
            icon: <Cpu className="text-blue-500" size={20} />,
            content: "Swarm Orchestration allows for task decomposition where a parent goal is broken into independent sub-tasks executed by specialized agents (Dev, Market, Fin)."
        },
        {
            title: "Self-Healing Protocols",
            icon: <Shield className="text-emerald-500" size={20} />,
            content: "The L7 Healing Engine monitors execution traces. Upon fault detection, it performs automated root-cause analysis and applies structural repairs in a sandbox before production deployment."
        }
    ];

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-300 font-sans p-6 md:p-12 selection:bg-indigo-500/30">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#4f46e510,transparent_50%)] pointer-events-none" />

            <header className="max-w-5xl mx-auto mb-20 relative z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft size={14} /> Back to Interface
                </Link>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-500">
                        <BookOpen size={32} />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Sovereign <span className="text-indigo-500">Documentation.</span></h1>
                </div>
                <p className="text-zinc-500 text-lg max-w-2xl font-medium leading-relaxed">
                    Deep-dive into the technical foundations of the world's most advanced autonomous operating system.
                </p>
            </header>

            <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
                {/* Sidebar Nav */}
                <aside className="md:col-span-4 space-y-8">
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">Navigation</h4>
                        {[
                            "Getting Started",
                            "System Architecture",
                            "Swarm Orchestration",
                            "Evolutionary Learning",
                            "API Reference",
                            "Security Protocols"
                        ].map((nav, i) => (
                            <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] text-sm font-bold text-zinc-600 hover:text-white transition-all group">
                                {nav}
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>

                    <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/10">
                        <Zap className="text-indigo-400 mb-4" size={24} />
                        <p className="text-xs font-black text-white uppercase tracking-widest mb-2">Pro Implementation</p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Need custom agent definitions for your enterprise? Contact our specialized engineers for bespoke swarm building.</p>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="md:col-span-8 space-y-16">
                    {sections.map((section, i) => (
                        <motion.section
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                {section.icon}
                                <h2 className="text-xl font-black text-white uppercase tracking-widest">{section.title}</h2>
                            </div>
                            <p className="text-base text-zinc-500 leading-relaxed font-medium">
                                {section.content}
                            </p>

                            <div className="p-4 rounded-2xl bg-[#080808] border border-white/5 font-mono text-[11px] text-zinc-400">
                                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                                    <Terminal size={12} />
                                    <span>system_manifest.v15</span>
                                </div>
                                <div className="opacity-60 space-y-1">
                                    <p>Initializing Sovereign Kernel...</p>
                                    <p>Loading Layer 1: Logic Boundaries... [OK]</p>
                                    <p>Syncing Swarm Mesh... [SUCCESS]</p>
                                    <p className="text-indigo-500">Target: Systemic Independence</p>
                                </div>
                            </div>
                        </motion.section>
                    ))}

                    {/* Tech Spec Table */}
                    <section className="space-y-6 pt-10 border-t border-white/5">
                        <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Database className="text-indigo-500" size={20} />
                            Technical Specifications
                        </h3>
                        <div className="rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left text-[11px] font-bold">
                                <thead>
                                    <tr className="bg-white/5 text-zinc-500 uppercase tracking-widest">
                                        <th className="p-4">Engine</th>
                                        <th className="p-4">Latency</th>
                                        <th className="p-4">Auth Tier</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-zinc-400">
                                    <tr>
                                        <td className="p-4">Evolution Core</td>
                                        <td className="p-4 text-emerald-500">12ms</td>
                                        <td className="p-4">S-Global</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Self-Healing</td>
                                        <td className="p-4 text-emerald-500">45ms</td>
                                        <td className="p-4">L7 Admin</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Swarm Mesh</td>
                                        <td className="p-4 text-amber-500">220ms</td>
                                        <td className="p-4">Standard</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="max-w-5xl mx-auto mt-32 pt-10 border-t border-white/5 flex justify-between items-center opacity-40">
                <div className="text-[10px] font-black uppercase tracking-[0.2em]">Quantify OS v15 / Docs</div>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                    <Link href="/terms">Terms</Link>
                    <Link href="/privacy">Privacy</Link>
                </div>
            </footer>
        </div>
    );
}
