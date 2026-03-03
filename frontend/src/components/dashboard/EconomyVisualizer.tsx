"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, ArrowRightLeft, TrendingUp, Users, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function EconomyVisualizer() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const [balRes, txRes] = await Promise.all([
                    fetch("/api/wallet/balance", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/wallet/transactions", { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (balRes.ok) {
                    const balData = await balRes.json();
                    setBalance(balData.balance);
                }
                if (txRes.ok) {
                    const txData = await txRes.json();
                    setTransactions(Object.values(txData).slice(-3).reverse());
                }
            } catch (error) {
                console.error("Failed to fetch economy data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center bg-[#101010] border border-white/5 rounded-2xl">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Overview */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#101010] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <Coins size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-white tracking-tight">Wallet Balance</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Available for Agents</p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">${balance?.toFixed(2) || '0.00'}</span>
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                            <TrendingUp size={10} /> Stable
                        </span>
                    </div>
                </div>

                <div className="bg-[#101010] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-white tracking-tight">Task Activity</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Internal Flow</p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{transactions.length}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Recent Transfers</span>
                    </div>
                </div>
            </div>

            {/* Transfer Visualizer */}
            <div className="lg:col-span-2 bg-[#101010] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <ArrowRightLeft size={14} className="text-indigo-500" /> Transaction Ledger
                    </h4>
                    <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-0.5 rounded">Real-time settlement</span>
                </div>

                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <p className="text-center py-8 text-xs text-zinc-600 font-medium">No recent transactions located.</p>
                    ) : (
                        transactions.map((tx, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-white/10" />
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-white/10" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-zinc-300">Workspace</span>
                                            <ArrowRightLeft size={8} className="text-zinc-600" />
                                            <span className="text-[11px] font-bold text-zinc-300">{tx.type === 'funding' ? 'Owner' : 'Agent'}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 font-medium">{tx.description || 'System transfer'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[11px] font-black leading-none ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                    </span>
                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
                                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
