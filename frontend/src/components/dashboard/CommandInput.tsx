"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Send, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CommandInputProps {
    onTaskCreated?: () => void;
}

export default function CommandInput({ onTaskCreated }: CommandInputProps) {
    const { user } = useAuth();
    const [command, setCommand] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const workspaceId = user ? `default-${user.uid}` : "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim() || !user || !workspaceId) return;

        setIsSubmitting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ goal: command }),
            });

            if (res.ok) {
                setCommand("");
                toast.success("CEO: Strategy formulated. Execution sequence started.", {
                    icon: <Sparkles className="text-amber-400" size={16} />,
                    style: { background: "#141414", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
                });
                if (onTaskCreated) onTaskCreated();
            } else {
                toast.error("System: Autonomous loop failed to initialize.");
            }
        } catch (error) {
            console.error("Failed to submit task:", error);
            toast.error("Network: Connection to CEO API severed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative group">
            {/* Animated Glow Wrapper */}
            <div className={`absolute -inset-[1px] bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 rounded-2xl blur-sm transition-opacity duration-1000 ${isFocused ? 'opacity-40' : 'opacity-10 group-hover:opacity-20'}`} />

            <div className={`relative bg-[#0f0f10] rounded-2xl border transition-all duration-300 ${isFocused ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : 'border-white/10'}`}>
                <form onSubmit={handleSubmit} className="flex items-center gap-4 p-2 relative overflow-hidden">
                    {/* Subtle Background Animation */}
                    <AnimatePresence>
                        {isFocused && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    <div className="flex-1 relative flex items-center pl-4">
                        <div className={`shrink-0 transition-colors duration-300 ${isFocused ? 'text-indigo-400' : 'text-zinc-600'}`}>
                            <Terminal size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tell Quantify OS what to do..."
                            className="w-full bg-transparent py-5 px-3 text-lg focus:outline-none placeholder:text-zinc-700 text-zinc-100 font-medium tracking-tight"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !command.trim()}
                        className="group/btn relative shrink-0 bg-white text-black h-14 px-8 rounded-xl font-extrabold text-sm transition-all hover:bg-zinc-100 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />

                        <div className="relative flex items-center justify-center gap-2">
                            {isSubmitting ? (
                                <><Loader2 size={18} className="animate-spin" /> THINKING...</>
                            ) : (
                                <><Send size={18} /> INITIALIZE <ChevronRight size={16} className="-ml-1 group-hover/btn:translate-x-1 transition-transform" /></>
                            )}
                        </div>
                    </button>
                </form>

                {/* Example Commands Row */}
                <div className="px-6 py-3 border-t border-white/5 flex items-center gap-4 overflow-hidden">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest shrink-0">Suggestions:</span>
                    <div className="flex items-center gap-3 animate-slide-left whitespace-nowrap">
                        {["Build sales automation", "Analyze CSV behavior", "Connect MQTT gateway", "Autonomous Market Report"].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setCommand(s)}
                                className="text-[10px] font-semibold text-zinc-500 hover:text-indigo-400 transition-colors bg-white/[0.03] px-2 py-0.5 rounded border border-white/5"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes slide-left {
            from { transform: translateX(0); }
            to { transform: translateX(-10px); }
        }
        .animate-slide-left {
            animation: slide-left 20s linear infinite alternate;
        }
      `}</style>
        </div>
    );
}
