"use client";

import { motion } from "framer-motion";
import { Coins, ArrowRightLeft, TrendingUp, Users } from "lucide-react";

export default function EconomyVisualizer() {
    const agentTransfers = [
        { from: "Researcher_Alpha", to: "Coder_X", amount: 0.005, task: "Module Logic Optimization", time: "2m ago" },
        { from: "Evolution_Orch", to: "Researcher_Alpha", amount: 0.012, task: "Market Pulse Scan", time: "15m ago" },
        { from: "Coder_X", to: "Healer_Main", amount: 0.002, task: "Bug Validation", time: "1h ago" },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Overview */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#101010] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <Coins size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-white tracking-tight">Internal GDP</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Total Agent Circulation</p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">$14.82</span>
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                            <TrendingUp size={10} /> +12%
                        </span>
                    </div>
                </div>

                <div className="bg-[#101010] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-white tracking-tight">Active Bounties</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Internal Task Markets</p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">42</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Settled today</span>
                    </div>
                </div>
            </div>

            {/* Transfer Visualizer */}
            <div className="lg:col-span-2 bg-[#101010] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <ArrowRightLeft size={14} className="text-indigo-500" /> Micro-Flow Ledger
                    </h4>
                    <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-0.5 rounded">Real-time settlement</span>
                </div>

                <div className="space-y-3">
                    {agentTransfers.map((tx, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-white/10" />
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-white/10" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-zinc-300">{tx.from}</span>
                                        <ArrowRightLeft size={8} className="text-zinc-600" />
                                        <span className="text-[11px] font-bold text-zinc-300">{tx.to}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-medium">{tx.task}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] font-black text-emerald-400 leading-none">${tx.amount.toFixed(3)}</span>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">{tx.time}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
