'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { Wallet, Coins, ArrowUpRight, ArrowDownRight, ShieldCheck, History, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function WalletSection() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [funding, setFunding] = useState(false);
    const [fundAmount, setFundAmount] = useState<string>('50');

    const [settings, setSettings] = useState({
        authorized: false,
        spend_limit: 0
    });
    const [savingAuth, setSavingAuth] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // Parallel fetch
            const [balRes, txRes, setRes] = await Promise.all([
                fetch(`${API}/api/wallet/balance`, { headers }),
                fetch(`${API}/api/wallet/transactions`, { headers }),
                fetch(`${API}/api/wallet/settings`, { headers })
            ]);

            if (balRes.ok) setBalance((await balRes.json()).balance);
            if (txRes.ok) setTransactions(await txRes.json());
            if (setRes.ok) setSettings(await setRes.json());

        } catch (error) {
            console.error("Failed to load wallet data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleFund = async () => {
        if (!user || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
            toast.error("Please enter a valid funding amount");
            return;
        }

        setFunding(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/wallet/fund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Number(fundAmount),
                    description: "Manual wallet top-up"
                })
            });

            if (res.ok) {
                toast.success(`Successfully added $${fundAmount} to wallet!`);
                setFundAmount('');
                fetchData(); // Refresh UI
            } else {
                toast.error("Failed to add funds");
            }
        } catch (error) {
            toast.error("An error occurred during funding");
            console.error(error);
        } finally {
            setFunding(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!user) return;
        setSavingAuth(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/wallet/authorize-spend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success("Wallet settings saved successfully");
            } else {
                toast.error("Failed to save wallet settings");
            }
        } catch (error) {
            toast.error("An error occurred saving settings");
        } finally {
            setSavingAuth(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading wallet data...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 pt-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Wallet className="text-emerald-400" size={24} /> Agent Financial Wallet
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Manage intrinsic funds used by agents for API calls and external services.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-indigo-900/30 via-emerald-950/20 to-black border border-emerald-500/20 p-8 rounded-2xl relative overflow-hidden md:col-span-1 group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Coins size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-emerald-400/80 font-medium uppercase tracking-wider">Available Balance</p>
                            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                Sovereign Tier
                            </span>
                        </div>
                        <motion.h3
                            key={balance}
                            initial={{ scale: 1.1, color: "#10b981" }}
                            animate={{ scale: 1, color: "#ffffff" }}
                            className="text-5xl font-black text-white mb-8 tracking-tighter"
                        >
                            ${balance.toFixed(2)}
                        </motion.h3>

                        {/* Usage Intelligence Mini-Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">Intelligence</p>
                                <p className="text-sm font-black text-zinc-200">42%</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">Execution</p>
                                <p className="text-sm font-black text-zinc-200">58%</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 text-sm">$</span>
                                <input
                                    type="number"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    placeholder="Amount"
                                    className="w-full bg-black/40 border border-emerald-500/20 rounded-xl p-3 pl-8 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleFund}
                                disabled={funding}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest flex flex-row items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                            >
                                <CreditCard size={18} /> {funding ? 'Processing...' : 'Top Up Wallet'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings & Authorization */}
                <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl md:col-span-2 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                            <ShieldCheck className="text-blue-400" size={20} /> Spend Authorization
                        </h3>
                        <p className="text-sm text-gray-400 mb-8">
                            Control whether your autonomous agents are allowed to deduce funds from this wallet to accomplish tasks.
                            If disabled, agents will fail tasks that require paid APIs.
                        </p>

                        <div className="space-y-6">
                            <label className="flex items-center gap-4 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={settings.authorized}
                                        onChange={(e) => setSettings({ ...settings, authorized: e.target.checked })}
                                    />
                                    <div className={`block w-14 h-8 rounded-full transition-colors ${settings.authorized ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.authorized ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold block">Allow Autonomous Spending</span>
                                    <span className="text-xs text-gray-500 block">Agents can spend up to their defined limit per task loop.</span>
                                </div>
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-semibold uppercase">Global Spend Limit ($)</label>
                                    <input
                                        type="number"
                                        disabled={!settings.authorized}
                                        value={settings.spend_limit}
                                        onChange={(e) => setSettings({ ...settings, spend_limit: Number(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSaveSettings}
                            disabled={savingAuth}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-2 text-sm font-bold transition-all disabled:opacity-50"
                        >
                            {savingAuth ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <History size={18} className="text-gray-400" /> Transaction Ledger
                    </h3>
                </div>

                <div className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-sm">No transactions found in ledger.</div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {tx.type === 'credit' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{tx.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className={`font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
