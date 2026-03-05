"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    CheckCircle2, Globe, FileJson,
    Cpu, Database, ShieldCheck, Loader2, Sparkles, Box
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function CapabilityExplorer() {
    const { user } = useAuth();
    const [capabilities, setCapabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const workspaceId = user ? `default-${user.uid}` : "";

    useEffect(() => {
        const fetchCapabilities = async () => {
            if (!user || !workspaceId) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${API}/api/workspaces/${workspaceId}/capabilities`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setCapabilities(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch capabilities:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCapabilities();
        const interval = setInterval(fetchCapabilities, 60000);
        return () => clearInterval(interval);
    }, [user, workspaceId]);

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>;
    }

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('web') || n.includes('http')) return <Globe size={18} className="text-sky-400" />;
        if (n.includes('csv') || n.includes('json') || n.includes('file')) return <FileJson size={18} className="text-amber-400" />;
        if (n.includes('hardware') || n.includes('mqtt') || n.includes('iot')) return <Cpu size={18} className="text-emerald-400" />;
        if (n.includes('db') || n.includes('memory') || n.includes('sql')) return <Database size={18} className="text-purple-400" />;
        if (n.includes('security') || n.includes('auth')) return <ShieldCheck size={18} className="text-indigo-400" />;
        return <Box size={18} className="text-zinc-400" />;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" /> Capability Index
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{capabilities.length} ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                {capabilities.length === 0 ? (
                    <div className="col-span-2 p-6 text-center bg-white/[0.02] border border-white/5 rounded-xl text-xs text-zinc-600">
                        Initial capability scan in progress...
                    </div>
                ) : (
                    capabilities.map((cap, i) => (
                        <motion.div
                            key={cap.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-center gap-3 group"
                        >
                            <div className="shrink-0 w-9 h-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                {getIcon(cap.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="text-[13px] font-bold text-zinc-200 truncate">{cap.name.replace(/_/g, ' ')}</span>
                                    {cap.available && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{cap.description}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
