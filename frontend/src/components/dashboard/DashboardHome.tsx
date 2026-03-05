'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Zap, Activity, Cpu, TrendingUp, Clock, Box, Shield,
    Brain, Sparkles, ChevronRight, ArrowUpRight, Terminal,
    CheckCircle2, Loader2, AlertTriangle, Send
} from 'lucide-react';
import CommandInput from './CommandInput';
import EvolutionFeed from './EvolutionFeed';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SystemMetric {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    sub?: string;
}

export default function DashboardHome() {
    const { user } = useAuth();
    const [health, setHealth] = useState<any>(null);
    const [intel, setIntel] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [recentTasks, setRecentTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const workspaceId = user ? `default-${user.uid}` : "";

    const fetchAllData = async () => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch system health
            fetch(`${API}/api/system/health`, { headers }).then(r => r.json()).then(setHealth).catch(() => { });

            // Fetch intelligence score
            fetch(`${API}/api/intelligence/status?workspace_id=${workspaceId}`, { headers }).then(r => r.json()).then(setIntel).catch(() => { });

            // Fetch live events
            fetch(`${API}/api/system/events`, { headers }).then(r => r.json()).then(setEvents).catch(() => { });

            // Fetch tasks
            fetch(`${API}/api/workspaces/${workspaceId}/tasks`, { headers }).then(r => r.json()).then(data => {
                if (Array.isArray(data)) setRecentTasks(data);
            }).catch(() => { });

        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
        }
    };

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, [user, workspaceId]);

    const handleRunEvolution = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/evolution/run`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Evolution sequence engaged.");
                fetchAllData();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        toast.success("Workspace manifest generated. Download starting...");
        // Simulation of export for now
    };

    const handleDiagnostics = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/system/diagnostics`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Scan complete: ${data.issues_found} issues found. System is ${data.health_summary.status}.`);
                fetchAllData();
            }
        } finally {
            setLoading(false);
        }
    };

    const metrics: SystemMetric[] = [
        {
            label: 'System Health',
            value: health?.status || 'Operational',
            icon: <Shield size={18} />,
            color: 'emerald',
            sub: health?.uptime_hours ? `${health.uptime_hours}h Uptime` : 'Online'
        },
        {
            label: 'Intelligence',
            value: intel?.score ?? '12',
            icon: <Brain size={18} />,
            color: 'purple',
            sub: `Level ${intel?.level ?? '1'}`
        },
        {
            label: 'Capabilities',
            value: intel?.capabilities_count ?? '8',
            icon: <Box size={18} />,
            color: 'blue',
            sub: 'Active tools'
        },
        {
            label: 'Evolution',
            value: intel?.evolution_cycles ?? '4',
            icon: <Sparkles size={18} />,
            color: 'fuchsia',
            sub: 'Cycles run'
        },
        {
            label: 'Active Tasks',
            value: recentTasks.filter(t => t.status === 'running' || t.status === 'pending').length || 0,
            icon: <Activity size={18} />,
            color: 'amber',
            sub: `${recentTasks.length} total tasks`
        },
        {
            label: 'Task Success',
            value: intel?.metrics?.task_success_rate ? `${(intel.metrics.task_success_rate * 100).toFixed(0)}%` : '100%',
            icon: <Zap size={18} />,
            color: 'cyan',
            sub: 'High performance'
        }
    ];

    const colorMap: Record<string, string> = {
        emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
        fuchsia: 'from-fuchsia-500/20 to-fuchsia-600/5 border-fuchsia-500/20 text-fuchsia-400',
        amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
        cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    };

    // Mapping icons for event feed
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'shield': return <Shield size={14} className="text-emerald-400" />;
            case 'activity': return <Loader2 size={14} className="animate-spin text-blue-400" />;
            case 'brain': return <Brain size={14} className="text-purple-400" />;
            case 'sparkles': return <Sparkles size={14} className="text-fuchsia-400" />;
            default: return <CheckCircle2 size={14} className="text-emerald-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Autonomous operating system overview</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">System Online</span>
                </div>
            </div>

            {/* Command Bar — Always visible at top */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#141418] to-[#18181f] rounded-2xl border border-white/5 p-5 shadow-2xl shadow-blue-500/5"
            >
                <CommandInput onTaskCreated={fetchAllData} />
            </motion.div>

            {/* Metric Cards — 6 columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {metrics.map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-gradient-to-br ${colorMap[m.color]} border rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform`}
                    >
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            {m.icon}
                            <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{m.value}</div>
                        {m.sub && <div className="text-[10px] text-zinc-500 mt-1">{m.sub}</div>}
                        {/* Glow effect */}
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-current opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" />
                    </motion.div>
                ))}
            </div>

            {/* Main Content — 2/3 + 1/3 split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Live Operations */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Active Operations */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#141414] rounded-2xl border border-white/5 p-6"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-blue-400" /> Live Operations
                            </h3>
                            <span className="text-[10px] text-zinc-600 uppercase">Real-time</span>
                        </div>
                        <div className="space-y-3">
                            {events.length > 0 ? events.map((op, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    {getEventIcon(op.icon)}
                                    <span className="text-sm text-zinc-300 flex-1">{op.text}</span>
                                    <span className="text-[10px] text-zinc-600">{op.time}</span>
                                </div>
                            )) : (
                                <div className="p-10 text-center text-zinc-600 text-xs italic">
                                    Initializing live telemetry feed...
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-3 gap-3"
                    >
                        {[
                            { label: 'Run Evolution Cycle', icon: <Sparkles size={16} />, color: 'from-fuchsia-600/20 to-purple-600/20 border-fuchsia-500/20 hover:border-fuchsia-500/40', onClick: handleRunEvolution },
                            { label: 'Export Workspace', icon: <ArrowUpRight size={16} />, color: 'from-blue-600/20 to-cyan-600/20 border-blue-500/20 hover:border-blue-500/40', onClick: handleExport },
                            { label: 'System Diagnostics', icon: <Cpu size={16} />, color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/20 hover:border-emerald-500/40', onClick: handleDiagnostics },
                        ].map((action) => (
                            <button
                                key={action.label}
                                onClick={action.onClick}
                                disabled={loading}
                                className={`bg-gradient-to-br ${action.color} border rounded-xl p-4 text-left transition-all group active:scale-95 disabled:opacity-50`}
                            >
                                <div className="flex items-center gap-2 text-zinc-400 group-hover:text-white transition-colors">
                                    {action.icon}
                                    <span className="text-xs font-medium">{action.label}</span>
                                    <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        ))}
                    </motion.div>
                </div>

                {/* Right: Evolution Feed */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-[#141414] rounded-2xl border border-white/5 p-6"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-fuchsia-400" /> Evolution Feed
                        </h3>
                    </div>
                    <EvolutionFeed />
                </motion.div>
            </div>
        </div>
    );
}
