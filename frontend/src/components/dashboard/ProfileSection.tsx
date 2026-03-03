'use client';

import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Shield, ShieldCheck, MapPin, Globe, Edit2 } from 'lucide-react';

export default function ProfileSection() {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-500/20">
                        {user?.displayName?.[0] || 'Q'}
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">{user?.displayName || 'Quantify Sovereign'}</h1>
                    <p className="text-zinc-500 font-medium flex items-center gap-2 mt-1">
                        <Mail size={14} />
                        {user?.email || 'test@example.com'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-[#111113] border border-white/5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={14} className="text-blue-500" /> Security Status
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-zinc-400">Auth Method</span>
                            <span className="text-xs font-bold text-white uppercase tracking-tighter">Firebase / JWT</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-zinc-400">Account Tier</span>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-tighter">
                                {user?.plan || 'Free Tier'} {user?.isAdmin ? '(Admin)' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#111113] border border-white/5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={14} className="text-emerald-500" /> Digital Presence
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-zinc-400">Region</span>
                            <span className="text-xs font-bold text-white uppercase tracking-tighter flex items-center gap-1">
                                <MapPin size={10} /> Global / Oracle Cloud
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-zinc-400">Identity Verified</span>
                            <ShieldCheck size={14} className="text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
                <h3 className="text-white font-bold mb-2">Sovereign Identity Key</h3>
                <p className="text-zinc-500 text-sm mb-4">Your hashed identity signature for the decentralized ledger. Unique to your UID.</p>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-blue-400/60 break-all leading-relaxed">
                    UID: {user?.uid || 'INITIALIZING...'}
                </div>
            </div>
        </div>
    );
}
