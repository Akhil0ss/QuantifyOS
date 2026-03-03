"use client";

import { motion } from "framer-motion";
import { Users, Layout, Zap, Activity, Cpu, ShieldAlert } from "lucide-react";

export default function MetricsDashboard({ metrics }: { metrics: any }) {
    const stats = [
        { label: "Active Users", value: metrics?.active_workspaces || 0, icon: <Users size={20} className="text-blue-400" />, color: "blue" },
        { label: "Active Workspaces", value: metrics?.active_workspaces || 0, icon: <Layout size={20} className="text-indigo-400" />, color: "indigo" },
        { label: "Tasks Today", value: metrics?.total_tasks || 0, icon: <Activity size={20} className="text-emerald-400" />, color: "emerald" },
        { label: "Active Agents", value: metrics?.active_agents || 0, icon: <Cpu size={20} className="text-sky-400" />, color: "sky" },
        { label: "Evolution Cycles", value: metrics?.evolution_cycles_today || 0, icon: <Zap size={20} className="text-fuchsia-400" />, color: "fuchsia" },
        { label: "System Load", value: metrics?.system_load || 0, icon: <ShieldAlert size={20} className="text-amber-400" />, color: "amber" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.04] transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>
                    </div>
                    {/* Subtle Gradient Background */}
                    <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-${stat.color}-500/5 blur-3xl rounded-full`} />
                </motion.div>
            ))}
        </div>
    );
}
