'use client';

import { Store, Zap, Shield, Search, Download, Star, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function MarketplaceSection() {
    const { user } = useAuth();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [installingId, setInstallingId] = useState<string | null>(null);

    const workspaceId = user ? `default-${user.uid.slice(0, 8)}` : '';

    const fetchCatalog = async () => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/workspaces/${workspaceId}/marketplace/catalog`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setAgents(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch marketplace catalog", e);
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async (moduleId: string) => {
        if (!user || !workspaceId) return;
        setInstallingId(moduleId);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/workspaces/${workspaceId}/marketplace/install/${moduleId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Module integrated into swarm successfully");
            } else {
                toast.error("Failed to install module");
            }
        } catch (e) {
            toast.error("Error during installation");
        } finally {
            setInstallingId(null);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, [user, workspaceId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Synchronizing Global Skill Grid...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Store className="text-blue-500" size={24} />
                        Agent Store
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">L12 Swarm Orchestration • Global Module Catalog</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input
                        type="text"
                        placeholder="Search skills, agents, or tools..."
                        className="w-full bg-[#111113] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {agents.map((a, i) => (
                    <div key={i} className="bg-[#111113] border border-white/5 rounded-3xl p-6 group hover:border-blue-500/20 transition-all flex flex-col justify-between relative overflow-hidden">
                        {a.price === 'Premium' && (
                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-blue-600 text-[8px] font-black text-white uppercase tracking-tighter rounded-bl-lg">Enterprise</div>
                        )}
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-bold truncate pr-2">{a.name}</h3>
                                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold shrink-0">
                                    <Star size={10} fill="currentColor" /> {a.rating || '4.9'}
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mb-4 line-clamp-3 leading-relaxed">{a.description}</p>
                            <div className="flex gap-2 mb-8">
                                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{a.category || 'Core'}</span>
                                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{a.type}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${a.price === 'Free' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {a.price}
                            </span>
                            <button
                                onClick={() => handleInstall(a.id)}
                                disabled={installingId === a.id}
                                className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
                            >
                                {installingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-12 bg-blue-600/5 border border-blue-500/10 rounded-[40px] flex flex-col items-center text-center space-y-6">
                <Shield className="text-blue-400" size={48} />
                <div>
                    <h2 className="text-2xl font-black text-white">Developer SDK Access</h2>
                    <p className="text-zinc-500 text-sm max-w-lg mt-2 leading-relaxed">
                        Deploy custom modules, specialized prompt chains, and unique toolsets to the global grid.
                        Secure your proprietary reasoning loops with enterprise-grade encryption.
                    </p>
                </div>
                <button className="px-10 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl">
                    Open Forge Master <ExternalLink className="inline ml-2" size={14} />
                </button>
            </div>
        </div>
    );
}
