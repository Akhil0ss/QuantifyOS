'use client';

import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, Coins, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function WalletSection() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const [balRes, txRes] = await Promise.all([
                    fetch("/api/wallet/balance", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/wallet/transactions", { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (balRes.ok) {
                    const data = await balRes.json();
                    setBalance(data.balance);
                }
                if (txRes.ok) {
                    const data = await txRes.json();
                    setTransactions(Object.values(data).reverse());
                }
            } catch (error) {
                console.error("Failed to fetch wallet data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, [user]);

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;
    }

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
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-gradient-to-br from-[#1c1c1e] to-[#121213] border border-white/5 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-[60px]" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Coins className="text-sky-400" size={20} />
                            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Total Balance</h3>
                        </div>
                        <p className="text-4xl font-black text-white tracking-tighter">${balance?.toLocaleString() || '0.00'}</p>
                    </div>
                </div>

                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl space-y-6 overflow-hidden">
                    <div className="flex items-center gap-3">
                        <History size={20} className="text-zinc-500" />
                        <h3 className="text-white font-bold">Recent Ledger Flow</h3>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                        {transactions.length === 0 ? (
                            <p className="text-xs text-zinc-600 font-medium py-4 text-center">No recent ledger activity.</p>
                        ) : (
                            transactions.map((t, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${t.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {t.amount > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white truncate max-w-[120px]">{t.description || 'System Settle'}</p>
                                            <p className="text-[9px] text-zinc-500 font-medium uppercase mt-0.5">{new Date(t.timestamp).toLocaleTimeString()} • Verified</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                        {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
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
