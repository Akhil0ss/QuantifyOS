"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Zap, Activity, Cpu, Target, BrainCircuit,
    ShieldCheck, Loader2, SignalHigh
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function StatusPanel() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const workspaceId = user ? `default-${user.uid}` : '';

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                // Fetch from multiple sources for a unified view
                const [saasRes, intelRes, securityRes] = await Promise.all([
                    fetch("/api/saas/status", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`/api/intelligence/status?workspace_id=${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`/api/security/status?workspace_id=${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (saasRes.ok && intelRes.ok && securityRes.ok) {
                    const saas = await saasRes.json();
                    const intel = await intelRes.json();
                    const security = await securityRes.json();

                    setMetrics({
                        activeAgents: saas.total_active_agents || 0,
                        tasksToday: saas.total_load_tasks || 0,
                        intelligenceScore: intel.intelligence_score || 0,
                        securityStatus: "Beta Stable",
                        autonomyLevel: "Beta Tier 1",
                        evolutionActive: true
                    });
                }
            } catch (error) {
                console.error("Failed to fetch status metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 15000);
        return () => clearInterval(interval);
    }, [user]);

    if (loading || !metrics) {
        return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse">
                <div className="h-4 w-24 bg-white/5 rounded mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl" />)}
                </div>
            </div>
        );
    }

    const items = [
        { label: "Autonomy Status", value: metrics.autonomyLevel, icon: <BrainCircuit className="text-indigo-400" size={18} />, color: "indigo" },
        { label: "Evolution Status", value: metrics.evolutionActive ? "Active" : "Halted", icon: <Zap className="text-fuchsia-400" size={18} />, color: "fuchsia", ping: metrics.evolutionActive },
        { label: "Intelligence Score", value: metrics.intelligenceScore, icon: <Target className="text-blue-400" size={18} />, color: "blue" },
        { label: "Active Agents", value: metrics.activeAgents, icon: <Cpu className="text-sky-400" size={18} />, color: "sky" },
        { label: "Tasks Logged", value: metrics.tasksToday, icon: <Activity className="text-emerald-400" size={18} />, color: "emerald" },
        { label: "Security Layer", value: metrics.securityStatus, icon: <ShieldCheck className="text-amber-400" size={18} />, color: "amber" }
    ];

    return (
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <SignalHigh size={14} className="text-indigo-500" /> System Pulse
                </h3>
                <span className="text-[10px] font-mono text-zinc-600">V1.0 Stable</span>
            </div>

            <div className="space-y-3">
                {items.map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 flex items-center justify-center`}>
                                {item.icon}
                            </div>
                            <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {item.ping && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                                </span>
                            )}
                            <span className="text-sm font-bold text-white">{item.value}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
