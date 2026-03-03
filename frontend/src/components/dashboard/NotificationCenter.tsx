'use client';

import { Bell, Zap, AlertCircle, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenter() {
    const notifications = [
        { id: 1, type: 'info', title: 'System Deployment Active', desc: 'Oracle VM V1.0 node successfully provisioned and serving on Port 80.', time: '2m ago' },
        { id: 2, type: 'zap', title: 'Intelligence Refinement', desc: 'Evolutionary loop completed a successful refactor of the Hardware Bridge.', time: '15m ago' },
        { id: 3, type: 'alert', title: 'High-Risk Operation', desc: 'Agent Researcher_Alpha is requesting permission to access external financial API.', time: '1h ago' },
        { id: 4, type: 'success', title: 'Bounty Settled', desc: 'Internal micro-transaction of 0.002 BTC finalized for Coder_X task completion.', time: '4h ago' }
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'zap': return <Zap size={14} className="text-fuchsia-400" />;
            case 'alert': return <AlertCircle size={14} className="text-rose-400" />;
            case 'success': return <CheckCircle2 size={14} className="text-emerald-400" />;
            default: return <Info size={14} className="text-blue-400" />;
        }
    };

    return (
        <div className="w-80 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <header className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Bell size={12} /> Live Pulse
                </h3>
                <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Mark all</button>
            </header>

            <div className="space-y-3">
                {notifications.map((n, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={n.id}
                        className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.06] transition-all cursor-pointer"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getIcon(n.type)}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{n.title}</h4>
                                    <span className="text-[9px] font-mono text-zinc-600">{n.time}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{n.desc}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-4 px-1">
                <button className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    Open History <ArrowUpRight size={10} />
                </button>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
