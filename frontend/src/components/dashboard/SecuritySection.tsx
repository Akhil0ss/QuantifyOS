'use client';

import { Shield, Lock, Eye, Terminal, Key, Cpu, ShieldAlert, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

export default function SecuritySection() {
    const { user } = useAuth();
    const [security, setSecurity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSecurity = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/security/status', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setSecurity(await res.json());
                }
            } catch (e) {
                console.error("Failed to fetch security status", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSecurity();
        const interval = setInterval(fetchSecurity, 15000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Shield className="text-emerald-500" size={24} />
                        Sovereign Security Ops
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">L12 Hardened Perimeter • Zero-Trust Mesh</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <div className={`w-1.5 h-1.5 rounded-full ${security?.active_threats > 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${security?.active_threats > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {security?.active_threats > 0 ? 'Threat Mitigation' : 'Active Guard'}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 flex justify-center py-10">
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                ) : (
                    [
                        { label: "Firewall Traversal", val: "Optimal", icon: <Lock className="text-emerald-400" /> },
                        { label: "Neural Privacy", val: "Encrypted", icon: <Eye className="text-blue-400" /> },
                        { label: "Active Threats", val: security?.active_threats || 0, icon: <Activity className="text-amber-400" /> }
                    ].map((stat, i) => (
                        <div key={i} className="p-6 bg-[#111113] border border-white/5 rounded-3xl space-y-4 group hover:border-emerald-500/20 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:scale-110 transition-transform">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-lg font-black text-white mt-1 font-mono">{stat.val}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl space-y-6">
                    <h3 className="text-white font-bold flex items-center gap-3">
                        <Key className="text-emerald-400" size={18} /> SSH & API Access
                    </h3>
                    <div className="space-y-4">
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Primary access to Oracle VM is restricted to your current session.
                            New device pairing requires multi-sig approval.
                        </p>
                        <div className="flex gap-2">
                            <button className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all">Rotate Keys</button>
                            <button className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all">Audit Logs</button>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-4">
                            <h3 className="text-white font-bold flex items-center gap-3">
                                <ShieldAlert className="text-emerald-400" size={20} /> Integrity Verification
                            </h3>
                            <div className="flex items-center justify-between text-xs font-bold font-mono">
                                <span className="text-zinc-500 uppercase">Architecture Scan:</span>
                                <span className="text-emerald-400">PASSED</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold font-mono">
                                <span className="text-zinc-500 uppercase">Dependency Audit:</span>
                                <span className="text-emerald-400">PASSED</span>
                            </div>
                        </div>
                        <div className="pt-8">
                            <button className="w-full py-4 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all">
                                Perform Deep Audit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
