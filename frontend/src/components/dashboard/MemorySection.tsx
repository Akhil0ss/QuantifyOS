'use client';

import { Brain, Database, Search, Cpu, HardDrive, Share2 } from 'lucide-react';

export default function MemorySection() {
    const memoryNodes = [
        { type: "Semantic", size: "4.2 GB", items: "12,402", health: 98 },
        { type: "Procedural", size: "1.1 GB", items: "842", health: 100 },
        { type: "Episodic", size: "8.4 GB", items: "2,190", health: 94 },
        { type: "Short-term", size: "14 MB", items: "42", health: 100 }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Brain className="text-purple-500" size={24} />
                        7-Layer Memory System
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">L10 Enterprise Reasoning Core</p>
                </div>
                <div className="flex bg-[#111113] p-1 rounded-xl border border-white/5">
                    <button className="px-4 py-2 rounded-lg bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Optimize</button>
                    <button className="px-4 py-2 rounded-lg text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Audit</button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memoryNodes.map((node, i) => (
                    <div key={i} className="p-6 bg-[#111113] border border-white/5 rounded-3xl group hover:border-purple-500/20 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Database size={18} />
                                </div>
                                <h3 className="text-white font-bold">{node.type} Memory</h3>
                            </div>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                                {node.health}% Health
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Storage Size</p>
                                <p className="text-lg font-black text-white font-mono">{node.size}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stored Items</p>
                                <p className="text-lg font-black text-white font-mono">{node.items}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Search className="text-purple-400" size={20} />
                        <h3 className="text-white font-bold">Search Memory Index</h3>
                    </div>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Retrieve episodic trace or semantic fact..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                        <div className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-zinc-500 border border-white/5">KB_CTRL + K</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
