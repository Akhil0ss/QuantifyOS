"use client";

import { motion } from "framer-motion";
import { AlertCircle, Zap, ShieldAlert, History, Box } from "lucide-react";

export default function MonitoringArea({ errors, evolution }: { errors: any[], evolution?: any }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Error Monitor */}
            <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-500" /> Platform Error Log
                </h3>
                <div className="bg-[#0a0a0b] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-white/[0.02] border-b border-white/5">
                        <p className="text-[10px] font-bold text-zinc-400">Showing last {errors.length} production errors</p>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                        {errors.length === 0 ? (
                            <div className="p-10 text-center space-y-2">
                                <History size={32} className="text-zinc-700 mx-auto" />
                                <p className="text-xs text-zinc-500 font-medium">No critical errors reported.</p>
                            </div>
                        ) : (
                            errors.map((error, i) => (
                                <div key={i} className="p-4 hover:bg-white/[0.01] transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] font-bold uppercase">{error.component}</span>
                                                <span className="text-[9px] text-zinc-600 font-mono">{error.datetime}</span>
                                            </div>
                                            <p className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                                                {error.error}
                                            </p>
                                        </div>
                                        <AlertCircle size={14} className="text-red-900/40 group-hover:text-red-500 transition-colors shrink-0" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Evolution Activity */}
            <div className="lg:col-span-5 space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-fuchsia-500" /> Evolution Intelligence
                </h3>
                <div className="space-y-4">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capabilities Learned</p>
                                <h4 className="text-2xl font-bold text-white mt-1">124</h4>
                            </div>
                            <Box size={24} className="text-fuchsia-500/20 group-hover:text-fuchsia-500 transition-colors" />
                        </div>
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full w-3/4 bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
                        </div>
                    </div>

                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-4">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Global Evolution Density</h4>
                        <div className="flex items-end gap-1 h-12">
                            {[4, 7, 5, 8, 3, 9, 6, 8, 5, 7, 4, 9].map((h, i) => (
                                <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-sm group-hover:bg-indigo-500/40 transition-all" style={{ height: `${h * 10}%` }} />
                            ))}
                        </div>
                        <p className="text-[10px] text-indigo-300/60 font-medium">Platform-wide cognitive expansion is nominal.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
