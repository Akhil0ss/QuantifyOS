'use client';

import { motion } from 'framer-motion';
import TaskSection from './TaskSection';
import SwarmSection from './SwarmSection';
import { Activity, Network, Zap } from 'lucide-react';

export default function OperationsCenter() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 border-b border-white/5 pb-8">
                <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Operations Center</h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">L1 Multi-Agent Execution Grid</p>
                </div>
            </header>

            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-amber-400" />
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Strategic Goal Execution</h2>
                </div>
                <TaskSection />
            </section>

            <section className="pt-12 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Network size={18} className="text-fuchsia-400" />
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Swarm Mesh Topology</h2>
                </div>
                <SwarmSection />
            </section>
        </div>
    );
}
