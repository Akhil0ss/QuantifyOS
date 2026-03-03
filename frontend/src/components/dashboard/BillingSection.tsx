'use client';

import { CreditCard, Zap, Package, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function BillingSection() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [subRes, plansRes] = await Promise.all([
                fetch('/api/billing/subscription', { headers }),
                fetch('/api/billing/plans', { headers })
            ]);

            if (subRes.ok && plansRes.ok) {
                setSubscription(await subRes.json());
                setPlans(await plansRes.json());
            }
        } catch (e) {
            console.error("Failed to fetch billing data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        if (!user) return;
        setIsUpgrading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ plan: planId })
            });

            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast.success(data.message || "Plan updated successfully");
                fetchData();
            }
        } catch (e) {
            toast.error("Failed to initiate upgrade");
        } finally {
            setIsUpgrading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="animate-spin text-zinc-600" />
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Retrieving Subscription State...</span>
            </div>
        );
    }

    const planList = plans ? Object.entries(plans).map(([id, details]: [string, any]) => ({
        id,
        ...details,
        active: subscription?.plan === id,
        features: [
            `${details.max_agents} AI Agents`,
            `${details.max_tasks_per_hour} Tasks/Hour`,
            details.evolution_enabled ? "Evolution Enabled" : "Manual Core",
            details.hardware_bridge ? "Hardware Bridge" : "Cloud Only"
        ]
    })) : [];

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
                {planList.map((p, i) => (
                    <div key={i} className={`p-6 bg-[#111113] border ${p.active ? 'border-blue-500/40 shadow-lg shadow-blue-500/10' : 'border-white/5'} rounded-3xl space-y-6 relative overflow-hidden flex flex-col`}>
                        {p.active && (
                            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-[9px] font-black text-white uppercase tracking-[0.2em] rounded-bl-xl">
                                Active Plan
                            </div>
                        )}
                        <div>
                            <h3 className="text-white font-bold">{p.name}</h3>
                            <p className="text-2xl font-black text-white mt-2">${p.price_monthly}<span className="text-xs text-zinc-600">/mo</span></p>
                        </div>
                        <ul className="flex-1 space-y-3">
                            {p.features.map((f: string, j: number) => (
                                <li key={j} className="flex gap-2 text-xs text-zinc-500 leading-tight">
                                    <Check className="text-blue-500 shrink-0" size={14} />
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={p.active || isUpgrading}
                            onClick={() => handleUpgrade(p.id)}
                            className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${p.active ? 'bg-white/5 text-zinc-400 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'} disabled:opacity-50`}
                        >
                            {isUpgrading ? 'Redirecting...' : p.active ? 'Current Strategy' : 'Select Plan'}
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
                            <span>SaaS Node Load</span>
                            <span className="text-white">Optimal</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="w-[12%] h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
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
                            <p className="text-sm font-bold text-white uppercase">{subscription?.status || 'Active'}</p>
                            <p className="text-xs text-zinc-500">Subscription managed via Stripe</p>
                        </div>
                        <button className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Portal</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
