'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { CreditCard, Check, Crown, Zap, Rocket, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
    name: string;
    price_monthly: number;
    max_agents: number;
    max_tasks_per_hour: number;
    evolution_enabled: boolean;
    predictive_evolution: boolean;
    hardware_bridge: boolean;
}

export default function BillingSection() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Record<string, Plan>>({});
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const FALLBACK_PLANS: Record<string, Plan> = {
        free: { name: 'Free', price_monthly: 0, max_agents: 5, max_tasks_per_hour: 50, evolution_enabled: true, predictive_evolution: false, hardware_bridge: false },
        pro: { name: 'Pro', price_monthly: 29, max_agents: 20, max_tasks_per_hour: 200, evolution_enabled: true, predictive_evolution: true, hardware_bridge: true },
        enterprise: { name: 'Enterprise', price_monthly: 99, max_agents: 100, max_tasks_per_hour: 1000, evolution_enabled: true, predictive_evolution: true, hardware_bridge: true },
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const token = await user.getIdToken();
            const headers = { 'Authorization': `Bearer ${token}` };
            const [plansRes, subRes] = await Promise.all([
                fetch(`/api/billing/plans`, { headers, signal: controller.signal }),
                fetch(`/api/billing/subscription`, { headers, signal: controller.signal })
            ]);
            clearTimeout(timeout);
            if (plansRes.ok) setPlans(await plansRes.json());
            else setPlans(FALLBACK_PLANS);
            if (subRes.ok) setSubscription(await subRes.json());
        } catch {
            clearTimeout(timeout);
            setPlans(FALLBACK_PLANS);
        } finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpgrade = async (planId: string) => {
        if (!user) return;
        setUpgrading(planId);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/billing/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ plan: planId })
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast.success(data.message || 'Plan upgraded!');
                fetchData();
            }
        } catch { toast.error('Upgrade failed'); }
        setUpgrading(null);
    };

    const handleCancel = async () => {
        if (!user) return;
        setCancelling(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/billing/cancel`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { toast.success('Subscription cancelled'); fetchData(); }
            else toast.error('Cancellation failed');
        } catch { toast.error('Error'); }
        setCancelling(false);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

    const currentPlan = subscription?.plan || 'free';
    const planIcons: Record<string, React.ReactNode> = { free: <Zap size={20} />, pro: <Rocket size={20} />, enterprise: <Crown size={20} /> };
    const planColors: Record<string, string> = {
        free: 'border-zinc-700 from-zinc-800/50 to-zinc-900/50',
        pro: 'border-blue-500/30 from-blue-900/20 to-indigo-900/20',
        enterprise: 'border-purple-500/30 from-purple-900/20 to-fuchsia-900/20'
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                    <CreditCard size={18} className="text-blue-400" /> Plan & Billing
                </h3>
                <p className="text-sm text-zinc-500">Manage your subscription and unlock OS capabilities.</p>
            </div>

            {/* Current Plan Badge */}
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Current Plan</p>
                    <p className="text-xl font-bold text-white mt-1 capitalize">{currentPlan}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Status: <span className="text-emerald-400">{subscription?.status || 'active'}</span></p>
                </div>
                {currentPlan !== 'free' && (
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors border border-red-500/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg"
                    >
                        {cancelling ? <Loader2 size={12} className="animate-spin" /> : 'Cancel'}
                    </button>
                )}
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(plans).map(([id, plan]) => {
                    const isCurrent = id === currentPlan;
                    return (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-gradient-to-br ${planColors[id] || planColors.free} border rounded-2xl p-6 relative ${isCurrent ? 'ring-1 ring-blue-500/30' : ''}`}
                        >
                            {isCurrent && (
                                <div className="absolute -top-2 right-4 bg-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Current</div>
                            )}
                            <div className="text-zinc-400 mb-3">{planIcons[id]}</div>
                            <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                            <p className="text-3xl font-bold text-white mt-2">
                                ${plan.price_monthly}<span className="text-sm text-zinc-500 font-normal">/mo</span>
                            </p>

                            <ul className="mt-5 space-y-2 text-sm">
                                <li className="flex items-center gap-2 text-zinc-400"><Check size={12} className="text-emerald-400" /> {plan.max_agents} Agents</li>
                                <li className="flex items-center gap-2 text-zinc-400"><Check size={12} className="text-emerald-400" /> {plan.max_tasks_per_hour} Tasks/hr</li>
                                <li className={`flex items-center gap-2 ${plan.evolution_enabled ? 'text-zinc-400' : 'text-zinc-600 line-through'}`}>
                                    {plan.evolution_enabled ? <Check size={12} className="text-emerald-400" /> : <X size={12} />} Evolution
                                </li>
                                <li className={`flex items-center gap-2 ${plan.predictive_evolution ? 'text-zinc-400' : 'text-zinc-600 line-through'}`}>
                                    {plan.predictive_evolution ? <Check size={12} className="text-emerald-400" /> : <X size={12} />} Predictive AI
                                </li>
                                <li className={`flex items-center gap-2 ${plan.hardware_bridge ? 'text-zinc-400' : 'text-zinc-600 line-through'}`}>
                                    {plan.hardware_bridge ? <Check size={12} className="text-emerald-400" /> : <X size={12} />} Hardware Bridge
                                </li>
                            </ul>

                            <button
                                onClick={() => !isCurrent && id !== 'free' && handleUpgrade(id)}
                                disabled={isCurrent || id === 'free' || !!upgrading}
                                className={`w-full mt-5 py-2.5 rounded-lg text-sm font-bold transition-all ${isCurrent ? 'bg-white/5 text-zinc-600 cursor-default' :
                                    id === 'free' ? 'bg-white/5 text-zinc-600 cursor-default' :
                                        'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                    }`}
                            >
                                {isCurrent ? 'Current Plan' :
                                    upgrading === id ? <Loader2 size={14} className="animate-spin mx-auto" /> :
                                        id === 'free' ? 'Free Tier' : `Upgrade to ${plan.name}`}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
