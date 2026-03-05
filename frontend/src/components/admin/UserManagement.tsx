"use client";

import { useState } from "react";
import { User, CreditCard, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function UserManagement({ users, onUpdate }: { users: any[], onUpdate: () => void }) {
    const [search, setSearch] = useState("");
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const changePlan = async (uid: string, newPlan: string) => {
        setUpdatingUid(uid);
        try {
            const res = await fetch(`${API}/api/admin/users/${uid}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: newPlan })
            });
            if (res.ok) {
                toast.success(`User updated to ${newPlan} plan.`);
                onUpdate();
            }
        } catch (e) {
            toast.error("Failed to update user plan.");
        } finally {
            setUpdatingUid(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                    type="text"
                    placeholder="Search users by email or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a0b]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] border-bottom border-white/5">
                            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User</th>
                            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Plan</th>
                            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => (
                            <tr key={user.uid} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{user.name}</p>
                                            <p className="text-[10px] text-zinc-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${user.plan === 'enterprise' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                        }`}>
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => changePlan(user.uid, user.plan === 'enterprise' ? 'free' : 'enterprise')}
                                            disabled={updatingUid === user.uid}
                                            className="px-3 py-1 bg-white/5 text-[9px] font-bold text-zinc-400 rounded-lg hover:bg-white/10 hover:text-white transition-all uppercase"
                                        >
                                            {updatingUid === user.uid ? 'Updating...' : `Switch to ${user.plan === 'enterprise' ? 'Free' : 'Enterprise'}`}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
