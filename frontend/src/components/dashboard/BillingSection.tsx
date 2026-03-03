'use client';

import { CreditCard, Zap, Package, ShieldCheck, Check } from 'lucide-react';

export default function BillingSection() {
    const plans = [
        { name: "Sovereign Individual", price: "$0", features: ["Single Oracle VM", "Standard Swarm", "Community Support"], active: true },
        { name: "Enterprise Mesh", price: "$499/mo", features: ["Unlimited Oracle Nodes", "High-Priority Swarm", "L9 Reasoning Core"], active: false },
        { name: "Quantify V11 Pro", price: "$1,499/mo", features: ["Custom Infrastructure", "Dedicated GPT-4o Cluster", "hardware Sync"], active: false }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <CreditCard className="text-zinc-400" size={24} />
                    Subscription & Billing
                </h1>
                <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">Managed Licensing • SaaS Tiers</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p, i) => (
                    <div key={i} className={`p-6 bg-[#111113] border ${p.active ? 'border-blue-500/40 shadow-lg shadow-blue-500/10' : 'border-white/5'} rounded-3xl space-y-6 relative overflow-hidden flex flex-col`}>
                        {p.active && (
                            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-[9px] font-black text-white uppercase tracking-[0.2em] rounded-bl-xl">
                                Active Plan
                            </div>
                        )}
                        <div>
                            <h3 className="text-white font-bold">{p.name}</h3>
                            <p className="text-2xl font-black text-white mt-2">{p.price}</p>
                        </div>
                        <ul className="flex-1 space-y-3">
                            {p.features.map((f, j) => (
                                <li key={j} className="flex gap-2 text-xs text-zinc-500 leading-tight">
                                    <Check className="text-blue-500 shrink-0" size={14} />
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <button className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${p.active ? 'bg-white/5 text-zinc-400 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}>
                            {p.active ? 'Current Strategy' : 'Upgrade Link'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl space-y-6">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Zap className="text-amber-500" size={18} /> Usage Consumption
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                            <span>API Compute Credits</span>
                            <span className="text-white">84% Remaining</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="w-[84%] h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Your baseline compute is hosted on Oracle EAD-1. Credits are consumed for supplementary cloud reasoning nodes.
                        </p>
                    </div>
                </div>

                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl space-y-6">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={18} /> Billing Security
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400">
                            <CreditCard size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">VISA •••• 4821</p>
                            <p className="text-xs text-zinc-500">Expires 08/2026</p>
                        </div>
                        <button className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Edit</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
