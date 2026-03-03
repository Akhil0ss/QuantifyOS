"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, ShieldCheck, TrendingUp, History, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function EvolutionFeed() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch("/api/evolution/status", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.history || []);
                }
            } catch (error) {
                console.error("Failed to fetch evolution history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 30000); // 30s refresh as requested
        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-fuchsia-500" size={24} /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} className="text-fuchsia-500" /> Evolution Feed
                </h3>
            </div>

            <div className="space-y-3">
                {history.length === 0 ? (
                    <div className="p-6 text-center bg-white/[0.02] border border-white/5 rounded-xl text-xs text-zinc-600">
                        Evolution engine is surveying the capability landscape...
                    </div>
                ) : (
                    history.slice().reverse().map((event, i) => (
                        <motion.div
                            key={event.timestamp + i}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex gap-4"
                        >
                            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${event.type === 'bug_fix' ? 'bg-emerald-500/10 text-emerald-400' :
                                    event.type === 'market_feature_gap' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-fuchsia-500/10 text-fuchsia-400'
                                }`}>
                                {event.type === 'bug_fix' ? <ShieldCheck size={20} /> :
                                    event.type === 'market_feature_gap' ? <TrendingUp size={20} /> :
                                        <Sparkles size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">{event.type.replace(/_/g, ' ')}</span>
                                    <span className="text-[10px] text-zinc-600">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm font-medium text-zinc-200 truncate">{event.details || event.action}</p>
                                {event.result && <p className="text-[11px] text-zinc-500 mt-1 italic">{event.result}</p>}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
