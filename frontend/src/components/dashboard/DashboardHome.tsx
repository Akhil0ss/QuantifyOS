'use client';

import { motion } from 'framer-motion';
import StatusPanel from './StatusPanel';
import EconomyVisualizer from './EconomyVisualizer';
import EvolutionFeed from './EvolutionFeed';
import { Layout, Sparkles, Activity, ShieldCheck } from 'lucide-react';

export default function DashboardHome() {
    return (
        <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            {/* Header section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Layout className="text-blue-500" size={28} />
                        Sovereign Overview
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 font-medium">Quantify OS V1.0 • Systemic Autonomy Active</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Oracle Cloud Online</span>
                    </div>
                </div>
            </header>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Pulse & Economy */}
                <div className="lg:col-span-8 space-y-8">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={18} className="text-blue-400" />
                            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Resource Dynamics</h2>
                        </div>
                        <EconomyVisualizer />
                    </section>

                    <section className="bg-[#111113] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full" />
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-4">Evolutionary Goal Tracking</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                                The system is currently targeting a rolling 24-month horizon.
                                Autonomy Level 9 (Structural Refactoring) is stabilizing within the internal shadow mesh.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: "Refactoring Score", val: "94%" },
                                    { label: "Bounty Efficiency", val: "99.2%" },
                                    { label: "Cognitive Latency", val: "14ms" },
                                    { label: "Uptime (Oracle)", val: "99.99%" }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-lg font-black text-white font-mono">{stat.val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right: Status & Feed */}
                <div className="lg:col-span-4 space-y-8">
                    <StatusPanel />

                    <div className="p-6 bg-[#111113] border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles size={16} className="text-fuchsia-400" />
                            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Latest Refinement</h2>
                        </div>
                        <EvolutionFeed />
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-blue-400" size={20} />
                            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Governance Frozen</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
