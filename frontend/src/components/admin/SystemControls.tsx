"use client";

import { useState } from "react";
import { Power, Zap, Box, ShieldCheck, AlertCircle, Ban } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '';

export default function SystemControls({ config, onUpdate }: { config: any, onUpdate: () => void }) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const toggles = [
        { key: "evolution_enabled", label: "Evolution Engine", icon: <Zap size={18} />, color: "fuchsia" },
        { key: "predictive_evolution_enabled", label: "Predictive Evolution", icon: <Zap size={18} className="animate-pulse" />, color: "indigo" },
        { key: "hardware_control_enabled", label: "Hardware Bridge", icon: <Box size={18} />, color: "sky" },
        { key: "beta_mode", label: "Public Beta Mode", icon: <ShieldCheck size={18} />, color: "amber" },
    ];

    const toggleFeature = async (key: string, currentValue: boolean) => {
        setIsUpdating(key);
        try {
            const res = await fetch(`${API}/api/admin/config/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: !currentValue })
            });
            if (res.ok) {
                toast.success(`${key.replace(/_/g, ' ')} toggled.`);
                onUpdate();
            }
        } catch (e) {
            toast.error("Failed to update config.");
        } finally {
            setIsUpdating(null);
        }
    };

    const emergencyStop = async () => {
        if (!confirm("Are you sure? This will halt ALL autonomous activity across ALL workspaces.")) return;
        try {
            const res = await fetch(`${API}/api/admin/emergency/stop`, { method: "POST" });
            if (res.ok) {
                toast.error("EMERGENCY STOP INITIALIZED", { duration: 5000 });
                onUpdate();
            }
        } catch (e) {
            toast.error("Failed to initialize emergency stop.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {toggles.map((toggle) => (
                    <div key={toggle.key} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-${toggle.color}-500/10 flex items-center justify-center text-${toggle.color}-400`}>
                                {toggle.icon}
                            </div>
                            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">{toggle.label}</span>
                        </div>
                        <button
                            onClick={() => toggleFeature(toggle.key, config[toggle.key])}
                            disabled={isUpdating === toggle.key}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${config[toggle.key] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                        >
                            {isUpdating === toggle.key ? "UPDATING..." : (config[toggle.key] ? "ENABLED" : "DISABLED")}
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">Emergency Protocols</h3>
                </div>
                <p className="text-xs text-red-400/60 font-medium">Use these controls only in case of critical system failure or security breach.</p>
                <div className="flex gap-4">
                    <button
                        onClick={emergencyStop}
                        className="flex-1 py-3 px-6 bg-red-600 text-white text-[11px] font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Ban size={16} /> STOP ALL AGENTS
                    </button>
                    <button
                        onClick={async () => {
                            await fetch(`${API}/api/admin/emergency/reset`, { method: "POST" });
                            onUpdate();
                            toast.success("Emergency state reset.");
                        }}
                        className="py-3 px-6 bg-white/5 border border-white/10 text-white text-[11px] font-bold rounded-xl hover:bg-white/10 transition-all"
                    >
                        RESET SYSTEM
                    </button>
                </div>
            </div>
        </div>
    );
}
