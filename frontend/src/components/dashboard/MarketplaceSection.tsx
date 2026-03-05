'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';

// Use relative paths — Next.js rewrites in next.config.ts proxy /api/* to the Oracle backend
// This avoids Mixed Content (HTTPS→HTTP) browser blocks on production Vercel

export default function MarketplaceSection() {
    const { user } = useAuth();
    const [catalog, setCatalog] = useState<any[]>([]);
    const [installed, setInstalled] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const workspaceId = user ? `default-${user.uid}` : '';

    const fetchMarketplaceData = useCallback(async () => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            const [catalogRes, installedRes] = await Promise.all([
                fetch(`/api/workspaces/${workspaceId}/marketplace/catalog`, { headers }),
                fetch(`/api/workspaces/${workspaceId}/marketplace/installed`, { headers })
            ]);

            if (catalogRes.ok) {
                setCatalog(await catalogRes.json());
            } else {
                console.error('[Marketplace] Catalog fetch failed:', catalogRes.status, await catalogRes.text());
            }
            if (installedRes.ok) {
                setInstalled(await installedRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch marketplace data:', error);
        } finally {
            setLoading(false);
        }
    }, [user, workspaceId]);

    useEffect(() => {
        fetchMarketplaceData();
    }, [fetchMarketplaceData]);

    const handleInstall = async (moduleId: string) => {
        if (!user || !workspaceId) return;
        setInstalling(moduleId);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/workspaces/${workspaceId}/marketplace/install/${moduleId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Module Installed successfully!');
                fetchMarketplaceData();
            } else {
                toast.error('Failed to install module');
            }
        } catch (error) {
            console.error('Install error:', error);
            toast.error('An error occurred');
        } finally {
            setInstalling(null);
        }
    };

    const isInstalled = (moduleId: string) => {
        return installed.some(mod => mod.id === moduleId);
    };

    const categories = ['All', ...Array.from(new Set(catalog.map(item => item.category).filter(Boolean)))].sort();

    const filteredCatalog = useMemo(() => {
        return catalog.filter(module => {
            const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || module.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [catalog, searchQuery, selectedCategory]);

    // Dynamic icon renderer
    const RenderIcon = ({ iconName, type }: { iconName: string, type: string }) => {
        const IconComponent = (Icons as any)[iconName] || Icons.Box;
        let colorClass = 'text-blue-400';
        if (type === 'workflow') colorClass = 'text-pink-400';
        if (type === 'persona') colorClass = 'text-emerald-400';

        return <IconComponent size={24} className={colorClass} />;
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-1">Module Marketplace</h2>
                    <p className="text-sm text-gray-400">Expand your agent's capabilities with pre-built personas and advanced workflows.</p>
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search 100+ tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Categories filter */}
            {!loading && categories.length > 1 && (
                <div className="flex flex-wrap gap-2 pb-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === category
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-[#141414] text-gray-400 hover:text-white border border-white/5 hover:border-white/20'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Icons.Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
                    {filteredCatalog.length === 0 ? (
                        <div className="col-span-1 lg:col-span-2 text-center py-10 text-gray-500 text-sm">
                            No tools found matching your search.
                        </div>
                    ) : (
                        filteredCatalog.map((module) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={module.id}
                                className="bg-[#141414] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors flex flex-col h-full"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                                        <RenderIcon iconName={module.icon} type={module.type} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-white truncate" title={module.name}>{module.name}</h3>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#bbff00] px-2 py-0.5 bg-[#bbff00]/10 rounded-full shrink-0">
                                                {module.type}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{module.category || 'General'}</div>
                                        <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">{module.description}</p>
                                    </div>
                                </div>

                                {/* Model Compatibility Badge */}
                                {module.min_model && (
                                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${module.tier === 'basic' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                                module.tier === 'standard' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                                    'text-red-400 bg-red-500/10 border-red-500/20'
                                            }`}>
                                            <Icons.Cpu size={8} className="inline mr-1 -mt-0.5" />
                                            {module.tier === 'basic' ? 'Any Model' : module.tier === 'standard' ? 'Mid-Range+' : 'Pro Model'}
                                        </span>
                                        <span className="text-[9px] text-gray-600" title={module.min_model}>
                                            Min: {module.min_model}
                                        </span>
                                    </div>
                                )}

                                {/* Supported Providers */}
                                {module.providers && (
                                    <div className="mb-3 flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-600 mr-1">Works with:</span>
                                        {module.providers.map((p: string) => (
                                            <span key={p} className="text-[8px] uppercase font-bold tracking-wider text-gray-500 bg-white/5 px-1.5 py-0.5 rounded" title={p}>
                                                {p === 'openai' ? 'GPT' : p === 'gemini' ? 'Gem' : p === 'ollama' ? 'Oll' : p === 'deepseek' ? 'DS' : p === 'anthropic' ? 'Cld' : 'Web'}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded">
                                        {module.price}
                                    </div>
                                    {isInstalled(module.id) ? (
                                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium px-3 py-1.5 bg-green-900/10 border border-green-500/20 rounded-lg">
                                            <Icons.CheckCircle2 size={14} /> Installed
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleInstall(module.id)}
                                            disabled={installing === module.id}
                                            className="flex items-center gap-1.5 text-xs text-white font-medium px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
                                        >
                                            {installing === module.id ? <Icons.Loader2 size={14} className="animate-spin" /> : <Icons.Download size={14} />}
                                            Install
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
