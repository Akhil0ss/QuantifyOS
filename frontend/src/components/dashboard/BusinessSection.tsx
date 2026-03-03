'use client';

import { Briefcase, TrendingUp, Users, Target, Rocket, Layers } from 'lucide-react';

export default function BusinessSection() {
    const metrics = [
        { label: "Active Revenue", val: "$12,482.00", change: "+14.2%" },
        { label: "Market Reach", val: "L4 Global", change: "Stable" },
        { label: "Agent Efficiency", val: "99.8%", change: "+0.3%" },
        { label: "Network Value", val: "0.82 BTC", change: "-1.2%" }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <Briefcase className="text-amber-500" size={24} />
                    Business Context
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Operational objectives and market-aligned intelligence.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="p-5 bg-[#111113] border border-white/5 rounded-3xl hover:border-amber-500/20 transition-all">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{m.label}</p>
                        <p className="text-lg font-black text-white font-mono">{m.val}</p>
                        <p className={`text-[10px] font-bold mt-1 ${m.change.startsWith('+') ? 'text-emerald-500' : 'text-zinc-600'}`}>
                            {m.change}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                        <Target className="text-amber-400" size={20} />
                        <h3 className="text-white font-bold">Priority Initiatives</h3>
                    </div>
                    <ul className="space-y-4">
                        {[
                            "Scale WhatsApp Automation Flow",
                            "Stabilize Hardware Telemetry",
                            "Expand Swarm Intelligence Grid"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span className="text-sm text-zinc-400">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                        <Layers className="text-indigo-400" size={20} />
                        <h3 className="text-white font-bold">Market Intelligence</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Sentiment Score</span>
                            <span className="font-mono text-emerald-400">88/100</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="w-[88%] h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                            Positive correlation detected in vertical SaaS markets.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
