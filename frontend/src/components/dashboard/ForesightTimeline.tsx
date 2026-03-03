"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Rocket, Zap, Globe } from "lucide-react";

const projections = [
    { time: "4 Months", title: "Cross-Platform Agency", desc: "Agents bridge between mobile and desktop environments seamlessly.", icon: <Globe size={18} />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { time: "9 Months", title: "Autonomous Internal Economy", desc: "Full agent-to-agent negotiation and bounty settlement for complex tasks.", icon: <Zap size={18} />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { time: "18 Months", title: "Global MCP Mesh", desc: "Universal host integration with any hardware device on the planet.", icon: <Rocket size={18} />, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
    { time: "24 Months", title: "Digital Sovereignty", desc: "Quantify OS achieves self-sustaining strategic goal alignment beyond human prompts.", icon: <BrainCircuit size={18} />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
];

export default function ForesightTimeline() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <Rocket className="text-indigo-500" /> Technology Foresight
                    </h3>
                    <p className="text-zinc-500 text-xs font-medium mt-1 uppercase tracking-widest">Rolling 2-Year Evolutionary Projection</p>
                </div>
            </div>

            <div className="relative mt-12 pb-12 overflow-x-auto no-scrollbar flex gap-6 px-2">
                {/* Connector Line */}
                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />

                {projections.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="min-w-[280px] relative z-10 group"
                    >
                        {/* Period Indicator */}
                        <div className="flex flex-col items-center mb-8">
                            <div className={`w-12 h-12 rounded-full ${item.bg} border-2 ${item.border} flex items-center justify-center ${item.color} shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>
                            <div className="h-12 w-px bg-white/10 mt-2" />
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-black px-2 py-0.5 rounded border border-white/5 mt-2">
                                + {item.time}
                            </span>
                        </div>

                        {/* Card */}
                        <div className="bg-[#101010]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 group-hover:border-white/10 transition-colors">
                            <h4 className={`text-sm font-bold ${item.color} mb-2 tracking-tight`}>{item.title}</h4>
                            <p className="text-zinc-500 text-[11px] leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
