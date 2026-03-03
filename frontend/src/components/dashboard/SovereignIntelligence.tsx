'use client';

import { motion } from 'framer-motion';
import EvolutionFeed from './EvolutionFeed';
import ForesightTimeline from './ForesightTimeline';
import EvolutionStats from './EvolutionStats';
import { Sparkles, BrainCircuit, LineChart } from 'lucide-react';

export default function SovereignIntelligence() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 border-b border-white/5 pb-8">
                <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-2xl">
                    <BrainCircuit size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Sovereign Intelligence</h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Cognitive Trajectory • Systemic Foresight</p>
                </div>
            </header>

            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <LineChart size={18} className="text-blue-400" />
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Evolutionary Metrics</h2>
                </div>
                <EvolutionStats />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-fuchsia-400" />
                        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Live Refinement Stream</h2>
                    </div>
                    <div className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                        <EvolutionFeed />
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BrainCircuit size={18} className="text-indigo-400" />
                        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Probabilistic Foresight</h2>
                    </div>
                    <ForesightTimeline />
                </section>
            </div>
        </div>
    );
}
