"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout, MessageSquare, Activity, Sparkles, Box, ShieldCheck, Zap, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import StatusPanel from "./StatusPanel";
import CommandInput from "./CommandInput";
import EvolutionFeed from "./EvolutionFeed";
import CapabilityExplorer from "./CapabilityExplorer";
import TaskSection from "./TaskSection";
import { useAuth } from "../../hooks/useAuth";

export default function CommandCenter() {
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleTaskCreated = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const submitFeedback = async () => {
        if (!feedback.trim() || !user) return;
        setIsSending(true);
        try {
            const token = await user.getIdToken();
            await fetch("/api/beta/feedback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: feedback, type: "beta_feedback" })
            });
            toast.success("Feedback logged. Your contribution is encoded.", {
                style: { background: "#141414", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
            });
            setFeedback("");
            setIsFeedbackOpen(false);
        } catch (e) {
            toast.error("Failed to transmit feedback.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Top Section: Command & Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Command Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">Q</span>
                                Command Center
                            </h1>
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 tracking-widest uppercase">Public Beta</span>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">Unified autonomous operating interface for Quantify OS V1.0.</p>
                    </div>

                    <CommandInput onTaskCreated={handleTaskCreated} />

                    {/* Core Operations Feed */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={16} className="text-sky-400" /> Active Operations
                            </h2>
                        </div>
                        <div className="bg-[#0f0f10] rounded-2xl border border-white/5 overflow-hidden">
                            {/* Reusing TaskSection for the detailed task feed, but with simplified styling if needed */}
                            <div className="p-1 scale-[0.99] origin-top">
                                <TaskSection key={refreshKey} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column: Intelligence & Status */}
                <div className="lg:col-span-4 space-y-8">
                    <StatusPanel />

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-xl space-y-8">
                        <CapabilityExplorer />
                        <div className="h-px bg-white/5" />
                        <EvolutionFeed />
                        <div className="h-px bg-white/5" />

                        {/* Feedback Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageCircle size={14} className="text-amber-500" /> Beta Feedback
                            </h3>
                            {isFeedbackOpen ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Suggest a feature or report a bug..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 min-h-[80px] resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={submitFeedback}
                                            disabled={isSending || !feedback.trim()}
                                            className="flex-1 bg-white text-black text-[10px] font-bold py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                        >
                                            {isSending ? "SENDING..." : "SUBMIT"}
                                        </button>
                                        <button
                                            onClick={() => setIsFeedbackOpen(false)}
                                            className="px-3 bg-white/5 text-zinc-400 text-[10px] font-bold py-2 rounded-lg hover:bg-white/10"
                                        >
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsFeedbackOpen(true)}
                                    className="w-full py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-[11px] font-bold hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
                                >
                                    SHARE FEEDBACK
                                </button>
                            )}
                        </div>
                    </div>

                    {/* System Health / Security Badge */}
                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between group hover:bg-indigo-500/10 transition-all">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-indigo-400" size={20} />
                            <div>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-none">Core Safety</p>
                                <p className="text-xs text-indigo-200/60 font-medium mt-1">Architecture Frozen & Verified</p>
                            </div>
                        </div>
                        <Zap className="text-indigo-500/40 group-hover:text-amber-400 transition-colors" size={16} />
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
        </div>
    );
}
