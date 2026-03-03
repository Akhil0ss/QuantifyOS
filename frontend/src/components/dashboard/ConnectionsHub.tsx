'use client';

import { motion } from 'framer-motion';
import WhatsAppBridge from './WhatsAppBridge';
import HardwareSection from './HardwareSection';
import { Link2, SignalHigh, Smartphone, Cpu } from 'lucide-react';

export default function ConnectionsHub() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 border-b border-white/5 pb-8">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                    <Link2 size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Connections Hub</h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Hybrid Bridge • Bio-Digital Interface</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Smartphone size={18} className="text-emerald-400" />
                        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Mobile Command Bridge</h2>
                    </div>
                    <WhatsAppBridge />
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu size={18} className="text-cyan-400" />
                        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Physical Hardware Bus</h2>
                    </div>
                    <HardwareSection />
                </section>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-3">
                    <SignalHigh className="text-zinc-500 group-hover:text-emerald-500 transition-colors" size={16} />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Neural Latency Normal (14ms)</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-600">ORACLE-EAD-1 // STABLE</div>
            </div>
        </div>
    );
}
