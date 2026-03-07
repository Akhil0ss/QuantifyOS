'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Download, CheckCircle2, Loader2, Search, Cpu, Globe, Database, Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const API = '';

interface MarketplaceTool {
    name: string;
    description: string;
    status: 'installed' | 'available';
    category?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
    'web': Globe,
    'data': Database,
    'hardware': Cpu,
    'default': Wrench,
};

export default function MarketplaceCatalog() {
    const { user } = useAuth();
    const [tools, setTools] = useState<MarketplaceTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const workspaceId = user ? `default-${user.uid}` : '';

    useEffect(() => {
        if (!user) return;
        fetchTools();
    }, [user]);

    const fetchTools = async () => {
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/marketplace/catalog`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTools(data.tools || []);
            }
        } catch (e) {
            console.error('Failed to fetch marketplace:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async (toolName: string) => {
        setInstalling(toolName);
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/marketplace/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ tool_name: toolName })
            });
            if (res.ok) {
                toast.success(`${toolName} installed successfully`);
                fetchTools();
            }
        } catch {
            toast.error('Installation failed');
        } finally {
            setInstalling(null);
        }
    };

    const filtered = tools.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <Package size={18} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">Tool Marketplace</h3>
                        <p className="text-[10px] text-zinc-500">{tools.filter(t => t.status === 'installed').length} installed · {tools.length} total</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tools..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/30"
                />
            </div>

            {/* Tools Grid */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-zinc-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {filtered.map((tool, i) => {
                        const CategoryIcon = CATEGORY_ICONS[tool.category || 'default'] || CATEGORY_ICONS.default;
                        return (
                            <motion.div
                                key={tool.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all group"
                            >
                                <div className="p-2 rounded-lg bg-white/[0.03] text-zinc-500 group-hover:text-purple-400 transition-colors">
                                    <CategoryIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{tool.name}</p>
                                    <p className="text-[10px] text-zinc-600 truncate">{tool.description}</p>
                                </div>
                                {tool.status === 'installed' ? (
                                    <div className="shrink-0 flex items-center gap-1 text-emerald-500">
                                        <CheckCircle2 size={14} />
                                        <span className="text-[9px] font-bold uppercase">Active</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleInstall(tool.name)}
                                        disabled={installing === tool.name}
                                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                                    >
                                        {installing === tool.name ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                        Install
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <p className="text-xs text-zinc-600 text-center py-8">No tools found{search ? ` matching "${search}"` : ''}</p>
                    )}
                </div>
            )}
        </div>
    );
}
