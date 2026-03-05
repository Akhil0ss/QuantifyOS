import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HeartPulse, Search, TrendingUp, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function EvolutionStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${API}/api/evolution/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (error) {
                console.error('Failed to fetch evolution stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, [user]);

    if (loading || !stats) {
        return (
            <div className="flex items-center gap-2 text-fuchsia-400 font-mono text-sm py-8 justify-center bg-fuchsia-900/10 rounded-2xl border border-fuchsia-500/10 mb-6">
                <Loader2 size={16} className="animate-spin" /> Synchronizing Global Evolution Stream...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <HeartPulse size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Self-Healing</p>
                        <h3 className="text-2xl font-bold text-white mt-0.5">{stats.bugsHealed} <span className="text-xs font-normal text-gray-500">Fixed</span></h3>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 bg-emerald-500/20 rounded-full flex-1 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        ></motion.div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">100% SUCCESS</span>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#141414] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Search size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Market IQ</p>
                        <h3 className="text-2xl font-bold text-white mt-0.5">{stats.marketInsights} <span className="text-xs font-normal text-gray-500">Insights</span></h3>
                    </div>
                </div>
                <div className="mt-4 text-[11px] text-blue-300/70 italic font-medium">
                    "Identified gap in 'Multi-Vector Financial Analysis' - Proposing upgrade."
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#141414] border border-fuchsia-500/20 rounded-2xl p-6 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Autonomous Growth</p>
                        <h3 className="text-2xl font-bold text-white mt-0.5">{stats.autonomousUpgrades} <span className="text-xs font-normal text-gray-500">New Modules</span></h3>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-inner ring-1 ring-fuchsia-500/20">
                        <TrendingUp size={10} /> Evolution Active
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">v13.4.2</div>
                </div>
            </motion.div>
        </div>
    );
}
