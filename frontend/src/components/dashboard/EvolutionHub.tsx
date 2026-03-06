'use client';

import { motion } from 'framer-motion';
import {
    Sparkles, HeartPulse, TrendingUp, ShieldCheck, Zap, Box,
    CheckCircle2, AlertTriangle, Clock, Play, Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import EvolutionStats from './EvolutionStats';
import EvolutionFeed from './EvolutionFeed';
import CapabilityExplorer from './CapabilityExplorer';
import toast from 'react-hot-toast';

export default function EvolutionHub() {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    const workspaceId = user ? `default-${user.uid}` : '';

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user || !workspaceId) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/evolution/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.history || []);
                }
            } catch (error) {
                console.error('Failed to fetch evolution events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, [user, workspaceId]);

    const handleTriggerEvolution = async () => {
        if (!user) return;
        setTriggering(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/evolution/run`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Evolution cycle triggered! Monitoring capability gaps...');
            } else {
                toast.error('Failed to trigger evolution');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setTriggering(false);
        }
    };

    const healingEvents = events.filter(e => e.type === 'bug_fix').slice(0, 3);
    const marketEvents = events.filter(e => e.type === 'market_feature_gap').slice(0, 2);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-fuchsia-400" size={24} /> Perpetual Evolution Engine
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Autonomous self-healing, competitive research, and capability growth</p>
                </div>
                <button
                    onClick={handleTriggerEvolution}
                    disabled={triggering}
                    className="flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30"
                >
                    {triggering ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    {triggering ? 'Engaging...' : 'Trigger Evolution'}
                </button>
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
                        {healingEvents.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-white/5 rounded-xl">
                                No self-healing events recorded in this cycle.
                            </div>
                        ) : healingEvents.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-zinc-200">{item.details}</p>
                                    <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wide">{new Date(item.timestamp).toLocaleTimeString()} • Verified by Sandbox</p>
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
                        {marketEvents.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-white/5 rounded-xl">
                                Surveying market for new capability vectors...
                            </div>
                        ) : marketEvents.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <TrendingUp className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-sm font-medium text-zinc-200">{item.details}</p>
                                    <button className="mt-2 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded uppercase tracking-widest hover:bg-blue-500/20 transition-all">
                                        {item.result === 'success' ? 'Prototype Ready' : 'Under Analysis'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Evolution Feed — Full width */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="bg-[#141414] border border-white/5 rounded-2xl p-6"
            >
                <EvolutionFeed />
            </motion.div>

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
