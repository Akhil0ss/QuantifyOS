'use client';

import { Store, Zap, Shield, Search, Download, Star, ExternalLink } from 'lucide-react';

export default function MarketplaceSection() {
    const agents = [
        { name: "Researcher_Alpha", role: "Market Analysis", author: "Quantify Core", price: "Free", rating: 4.9 },
        { name: "Healer_Main", role: "Bug Fixing", author: "Quantify Core", price: "Premium", rating: 5.0 },
        { name: "Scraper_X", role: "Web Intelligence", author: "L6 Protocol", price: "Free", rating: 4.7 },
        { name: "Coder_Evolution", role: "Auto-Refactor", author: "Quantify V11", price: "Premium", rating: 4.9 },
    ];

    return (
        <div className="max-w-6xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Store className="text-blue-500" size={24} />
                        Agent Store
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">L12 Swarm Orchestration • Community Skills</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input
                        type="text"
                        placeholder="Search skills, agents, or tools..."
                        className="w-full bg-[#111113] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {agents.map((a, i) => (
                    <div key={i} className="bg-[#111113] border border-white/5 rounded-3xl p-6 group hover:border-blue-500/20 transition-all flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-bold">{a.name}</h3>
                                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                    <Star size={10} fill="currentColor" /> {a.rating}
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mb-4">{a.role}</p>
                            <div className="flex gap-2 mb-8">
                                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{a.author}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${a.price === 'Free' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {a.price}
                            </span>
                            <button className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
                                <Download size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-12 bg-blue-600/5 border border-blue-500/10 rounded-[40px] flex flex-col items-center text-center space-y-6">
                <Shield className="text-blue-400" size={48} />
                <div>
                    <h2 className="text-2xl font-black text-white">Developer SDK</h2>
                    <p className="text-zinc-500 text-sm max-w-lg mt-2 leading-relaxed">
                        Build your own autonomous sub-agents and list them on the global grid.
                        Monetize your specialized prompt chains and toolsets.
                    </p>
                </div>
                <button className="px-10 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl">
                    Get Started <ExternalLink className="inline ml-2" size={14} />
                </button>
            </div>
        </div>
    );
}
