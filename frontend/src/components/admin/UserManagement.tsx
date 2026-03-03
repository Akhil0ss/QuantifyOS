"use client";

import { useState } from "react";
import { User, CreditCard, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

export default function UserManagement({ users, onUpdate }: { users: any[], onUpdate: () => void }) {
    const { user: currentUser } = useAuth();
    const [search, setSearch] = useState("");
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const changePlan = async (uid: string, newPlan: string) => {
        if (!currentUser) return;
        setUpdatingUid(uid);
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch(`/api/admin/users/${uid}/plan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ plan: newPlan })
            });
            if (res.ok) {
                toast.success(`User updated to ${newPlan} strategy.`);
                onUpdate();
            }
        } catch (e) {
            toast.error("Failed to update user privilege.");
        } finally {
            setUpdatingUid(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                    type="text"
                    placeholder="Search operators by email or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#111113] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0b]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                            <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Operator</th>
                            <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Deployment Tier</th>
                            <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Administrative Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-10 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">No matching operators found</td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/20 shadow-inner">
                                                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white tracking-tight">{user.name || 'Unnamed Operator'}</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${user.plan === 'enterprise' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                                            'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                            }`}>
                                            {user.plan} Tier
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => changePlan(user.uid, user.plan === 'enterprise' ? 'free' : 'enterprise')}
                                                disabled={updatingUid === user.uid}
                                                className="px-4 py-2 bg-white/5 text-[9px] font-black text-zinc-400 rounded-xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest border border-white/5"
                                            >
                                                {updatingUid === user.uid ? 'Updating...' : `Switch to ${user.plan === 'enterprise' ? 'Baseline' : 'Enterprise'}`}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
