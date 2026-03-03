'use client';

import { Sparkles, Zap, BrainCircuit, Activity, BarChart3, LineChart } from 'lucide-react';
import EvolutionFeed from './EvolutionFeed';
import EvolutionStats from './EvolutionStats';

export default function EvolutionHub() {
    return (
        <div className="max-w-6xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                        <Sparkles className="text-fuchsia-500 animate-pulse" size={36} />
                        Evolutionary Engine
                    </h1>
                    <p className="text-zinc-500 text-lg mt-2 font-medium">Self-Refactoring & Recursive Intelligence Optimization</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-4 rounded-3xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-center">
                        <p className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-1">Growth Index</p>
                        <p className="text-2xl font-black text-white font-mono">+4.8%</p>
                    </div>
                    <div className="px-6 py-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Logic Purity</p>
                        <p className="text-2xl font-black text-white font-mono">99.2%</p>
                    </div>
                </div>
            </header>

            <EvolutionStats />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <Activity size={18} className="text-fuchsia-400" /> Improvement Vector
                        </h2>
                    </div>
                    <div className="bg-[#111113] border border-white/5 rounded-[40px] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/5 blur-[100px] rounded-full" />
                        <EvolutionFeed />
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        <BrainCircuit size={28} className="text-blue-400" /> Intelligence Topology
                    </h2>
                    <div className="p-10 bg-gradient-to-br from-blue-600/5 to-fuchsia-600/5 border border-white/5 rounded-[40px] flex flex-col justify-center items-center text-center space-y-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin" />
                            <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Recursive Loop Stabilized</h3>
                            <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
                                The system is currently iterating on its own response-latency handlers.
                                Level 11 logic protocols are being drafted in the internal sandbox.
                            </p>
                        </div>
                        <button className="px-8 py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl">
                            View Neural Diff
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
