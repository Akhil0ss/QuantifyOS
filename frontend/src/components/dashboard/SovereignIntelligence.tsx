"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, Shield, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import ForesightTimeline from "./ForesightTimeline";
import ShadowTrace from "./ShadowTrace";
import EconomyVisualizer from "./EconomyVisualizer";

const API = ''; // Relative paths — Next.js rewrites proxy to backend

export default function SovereignIntelligence() {
    const { user } = useAuth();
    const [intel, setIntel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const workspaceId = user ? `default-${user.uid}` : "";

    useEffect(() => {
        const fetchIntel = async () => {
            if (!user || !workspaceId) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${API}/api/intelligence/status?workspace_id=${workspaceId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setIntel(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch intelligence status:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIntel();
    }, [user, workspaceId]);

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-indigo-600/20 via-blue-600/5 to-transparent border border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Brain size={120} className="text-white" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit mb-4">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            {loading ? "Initializing..." : `Tier ${intel?.level || 1} Autonomy Active`}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                        {loading ? "Analyzing Engine..." : `IQ ${intel?.score || 0}: Sovereign Intelligence`}
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-xl font-medium leading-relaxed">
                        The core engine is currently anchored to the year 2026/2027 trajectories.
                        Live foresight, inter-agent micro-transactions, and predictive governance are fully operational.
                    </p>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Evolution Foresight - Full Width */}
                <div className="xl:col-span-3">
                    <ForesightTimeline />
                </div>

                {/* Shadow Trace - High Fidelity Simulation */}
                <div className="xl:col-span-1">
                    <ShadowTrace />
                </div>

                {/* Economy & Agent Micro-flows */}
                <div className="xl:col-span-2">
                    <EconomyVisualizer />
                </div>
            </div>

            {/* AI Governance Card */}
            <motion.div
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Zero-Risk Predictive Security</h4>
                        <p className="text-xs text-zinc-500 font-medium">All autonomous evolution steps are dry-run in shadow environments before deployment.</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Shield Active
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
