'use client';

import { motion } from 'framer-motion';
import {
    Sparkles, HeartPulse, TrendingUp, ShieldCheck, Zap, Box,
    CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import EvolutionStats from './EvolutionStats';
import CapabilityExplorer from './CapabilityExplorer';

export default function EvolutionHub() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="text-fuchsia-400" size={24} /> Perpetual Evolution Engine
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Autonomous self-healing, competitive research, and capability growth</p>
            </div>

            {/* Evolution Stats */}
            <EvolutionStats />

            {/* Main Grid — 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Self-Healing Repository */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#141414] border border-white/5 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <HeartPulse className="text-emerald-400" size={20} /> Self-Healing Repository
                    </h3>
                    <div className="space-y-3">
                        {[
                            { file: 'payment_gate.py', action: 'Syntax error auto-repaired', time: '2h ago', status: 'healed' },
                            { file: 'mqtt_driver.py', action: 'Missing import added', time: '6h ago', status: 'healed' },
                            { file: 'csv_analyzer.py', action: 'Type mismatch corrected', time: '12h ago', status: 'healed' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-zinc-200">{item.action} in <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded">{item.file}</code></p>
                                    <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wide">{item.time} • Verified by Sandbox</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Competitive Market IQ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-[#141414] border border-white/5 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="text-blue-400" size={20} /> Competitive Market IQ
                    </h3>
                    <div className="space-y-3">
                        {[
                            { trend: 'Multi-Chain wallet integration', source: 'Competitor X', action: 'Prototype ready' },
                            { trend: 'Voice-first AI interfaces', source: 'Market trend', action: 'Under analysis' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <TrendingUp className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-sm font-medium text-zinc-200">Identified &apos;{item.trend}&apos; from {item.source}</p>
                                    <button className="mt-2 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded uppercase tracking-widest hover:bg-blue-500/20 transition-all">
                                        {item.action}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Capability Explorer — Full width */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#141414] border border-white/5 rounded-2xl p-6"
            >
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Box className="text-blue-400" size={20} /> Capability Explorer
                </h3>
                <CapabilityExplorer />
            </motion.div>
        </div>
    );
}
