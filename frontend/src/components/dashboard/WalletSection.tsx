'use client';

import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, Coins, Lock } from 'lucide-react';

export default function WalletSection() {
    const transactions = [
        { type: "Outbound", amount: "0.002 BTC", note: "API Over-usage Settle", time: "2h ago", status: "Settled" },
        { type: "Inbound", amount: "$84.00", note: "SaaS Subscription Payment", time: "5h ago", status: "Verified" },
        { type: "Internal", amount: "0.01 ETH", note: "Agent Bounty Allocation", time: "1d ago", status: "Settled" }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Wallet className="text-sky-500" size={24} />
                        Agent Financial Wallet
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Autonomous spending for infrastructure & bounties.</p>
                </div>
                <div className="flex bg-[#111113] p-1 rounded-xl border border-white/5">
                    <button className="px-4 py-2 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Withdraw</button>
                    <button className="px-4 py-2 rounded-lg bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest ml-1 shadow-lg shadow-sky-500/20">Add Funds</button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-gradient-to-br from-[#1c1c1e] to-[#121213] border border-white/5 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-[60px]" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Coins className="text-sky-400" size={20} />
                            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Total Balance</h3>
                        </div>
                        <p className="text-4xl font-black text-white tracking-tighter">$14,821.42</p>
                        <div className="flex gap-4">
                            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-300">
                                <span className="text-zinc-500">BTC:</span> 0.2418
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-300">
                                <span className="text-zinc-500">ETH:</span> 4.821
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                        <history className="text-zinc-500" size={20} />
                        <h3 className="text-white font-bold">Recent Ledger Flow</h3>
                    </div>
                    <div className="space-y-4">
                        {transactions.map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${t.type === 'Inbound' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {t.type === 'Inbound' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{t.note}</p>
                                        <p className="text-[9px] text-zinc-500 font-medium uppercase mt-0.5">{t.time} • {t.status}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-black ${t.type === 'Inbound' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                    {t.type === 'Inbound' ? '+' : '-'}{t.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-sky-500/5 border border-sky-500/10 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Lock className="text-sky-400" size={20} />
                    <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Security Vault Active</p>
                        <p className="text-xs text-zinc-500">Multi-sig wallet verification required for transactions over $500.</p>
                    </div>
                </div>
                <button className="text-xs font-black text-sky-400 uppercase tracking-widest hover:text-sky-300 transition-colors">Manage Keys</button>
            </div>
        </div>
    );
}
