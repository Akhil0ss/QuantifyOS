'use client';

import { Briefcase, BarChart3, TrendingUp, Globe, Target, ArrowUpRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

export default function BusinessSection() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [intelligence, setIntelligence] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const workspaceId = user ? `default-${user.uid.slice(0, 8)}` : '';

    useEffect(() => {
        const fetchBusinessData = async () => {
            if (!user || !workspaceId) return;
            try {
                const token = await user.getIdToken();
                const headers = { Authorization: `Bearer ${token}` };

                const [saasRes, intelRes] = await Promise.all([
                    fetch('/api/saas/status', { headers }),
                    fetch(`/api/intelligence/status?workspace_id=${workspaceId}`, { headers })
                ]);

                if (saasRes.ok && intelRes.ok) {
                    setStats(await saasRes.json());
                    setIntelligence(await intelRes.json());
                }
            } catch (e) {
                console.error("Failed to fetch business data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchBusinessData();
    }, [user, workspaceId]);

    const metrics = [
        {
            label: "Global SaaS Load",
            value: stats ? `${((stats.total_load_tasks / 1000) * 100).toFixed(1)}%` : "0%",
            trend: stats?.total_active_agents > 0 ? "Optimal" : "Idle",
            icon: BarChart3,
            color: "text-emerald-400"
        },
        {
            label: "Intelligence Growth",
            value: intelligence ? `${intelligence.intelligence_score}` : "0",
            trend: intelligence?.improvement_delta >= 0 ? `+${intelligence.improvement_delta}` : `${intelligence.improvement_delta}`,
            icon: Globe,
            color: "text-blue-400"
        },
        {
            label: "Mission Success Rate",
            value: intelligence?.metrics ? `${(intelligence.metrics.task_success_rate * 100).toFixed(0)}%` : "0%",
            trend: intelligence?.metrics?.tasks_successful > 0 ? "Verified" : "Syncing",
            icon: Target,
            color: "text-purple-400"
        }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <Briefcase className="text-emerald-500" size={24} />
                    Economic & Business Engine
                </h1>
                <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">Strategic Autonomy • High-Frequency Execution</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 flex justify-center py-10">
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                ) : (
                    metrics.map((m, i) => (
                        <div key={i} className="p-6 bg-[#111113] border border-white/5 rounded-3xl space-y-4 group hover:border-emerald-500/20 transition-all">
                            <div className="flex justify-between items-start">
                                <div className={`p-2 bg-white/[0.03] rounded-xl ${m.color}`}>
                                    <m.icon size={18} />
                                </div>
                                <span className={`text-[10px] font-black ${m.trend.includes('-') ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'} px-2 py-0.5 rounded-full`}>{m.trend}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{m.label}</p>
                                <p className="text-2xl font-black text-white mt-1 font-mono">{m.value}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <TrendingUp className="text-emerald-400" size={20} />
                        Active Strategic Directives
                    </h3>
                </div>
                <div className="space-y-3">
                    {[
                        { name: "Global Market Arbitrage", status: intelligence?.intelligence_score > 50 ? "Optimizing" : "Initializing", gain: intelligence?.metrics?.tasks_successful || 0 },
                        { name: "Swarm Expansion Protocol", status: stats?.active_workspaces > 50 ? "Stable" : "Scaling", gain: stats?.total_active_agents || 0 }
                    ].map((n, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-sm font-bold text-white uppercase tracking-tight">{n.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{n.status}</span>
                                <span className="text-xs font-black text-emerald-400 font-mono">{n.gain} <span className="text-[9px] text-zinc-600">UNITS</span></span>
                                <ArrowUpRight className="text-zinc-600 group-hover:text-white transition-colors" size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
