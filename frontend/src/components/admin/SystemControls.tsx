"use client";

import { useState } from "react";
import { Power, Zap, Box, ShieldCheck, AlertCircle, Ban, RefreshCcw } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

export default function SystemControls({ config, onUpdate }: { config: any, onUpdate: () => void }) {
    const { user } = useAuth();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const toggles = [
        { key: "evolution_enabled", label: "Evolution Engine", icon: <Zap size={18} />, color: "fuchsia" },
        { key: "predictive_evolution_enabled", label: "Predictive Evolution", icon: <Zap size={18} className="animate-pulse" />, color: "indigo" },
        { key: "hardware_control_enabled", label: "Hardware Bridge", icon: <Box size={18} />, color: "sky" },
        { key: "beta_mode", label: "Public Beta Mode", icon: <ShieldCheck size={18} />, color: "amber" },
    ];

    const toggleFeature = async (key: string, currentValue: boolean) => {
        if (!user) return;
        setIsUpdating(key);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/config/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ [key]: !currentValue })
            });
            if (res.ok) {
                toast.success(`${key.replace(/_/g, ' ')} status updated.`);
                onUpdate();
            }
        } catch (e) {
            toast.error("Failed to update system cluster config.");
        } finally {
            setIsUpdating(null);
        }
    };

    const emergencyStop = async () => {
        if (!user) return;
        if (!confirm("Are you sure? This will halt ALL autonomous activity across ALL workspaces.")) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/emergency/stop", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast.error("EMERGENCY STOP INITIALIZED", { duration: 5000 });
                onUpdate();
            }
        } catch (e) {
            toast.error("Failed to initialize emergency stop.");
        }
    };

    const resetSystem = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/emergency/reset", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Emergency state reset.");
                onUpdate();
            }
        } catch (e) {
            toast.error("Reset failed.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {toggles.map((toggle) => (
                    <div key={toggle.key} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl bg-${toggle.color}-500/10 flex items-center justify-center text-${toggle.color}-400 group-hover:scale-105 transition-transform`}>
                                {toggle.icon}
                            </div>
                            <div>
                                <span className="text-xs font-black text-gray-200 uppercase tracking-widest">{toggle.label}</span>
                                <p className="text-[10px] text-zinc-500 font-medium">Global Toggle</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleFeature(toggle.key, config[toggle.key])}
                            disabled={isUpdating === toggle.key}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${config[toggle.key] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                        >
                            {isUpdating === toggle.key ? "UPDATING..." : (config[toggle.key] ? "ENABLED" : "DISABLED")}
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[60px]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-red-500">
                        <AlertCircle size={20} />
                        <h3 className="font-black text-sm uppercase tracking-widest">Emergency Tactical Protocols</h3>
                    </div>
                    <p className="text-xs text-red-400/60 font-medium mt-2 leading-relaxed max-w-lg">
                        Use these controls only in case of critical systemic failure or security breach.
                        Actions here affect the entire platform cluster globally.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={emergencyStop}
                            className="flex-1 py-4 px-6 bg-red-600 text-white text-[10px] font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-red-600/20 border border-red-500/30"
                        >
                            <Ban size={16} /> STOP ALL AGENTS
                        </button>
                        <button
                            onClick={resetSystem}
                            className="flex items-center gap-2 py-4 px-8 bg-white/5 border border-white/10 text-white text-[10px] font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            <RefreshCcw size={16} /> RESET CLUSTER
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
