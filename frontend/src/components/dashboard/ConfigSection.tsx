'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Shield, Database, Cpu, Globe, HardDrive, Infinity, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '';

export default function ConfigSection() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeMode, setActiveMode] = useState('api');
    const [localModels, setLocalModels] = useState<string[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [pollingWeb, setPollingWeb] = useState(false);
    const [webStatus, setWebStatus] = useState({ status: 'disconnected', tier: 'Free' });
    const [config, setConfig] = useState<{
        active_provider_id: string;
        fallback_pool: any[];
        routing_strategy: 'manual' | 'smart';
    }>({
        active_provider_id: '',
        fallback_pool: [],
        routing_strategy: 'manual'
    });

    // Helper to get active provider details for the currently viewed tab
    const currentTabProvider = config.fallback_pool.find(p => p.mode === activeMode) || {
        mode: activeMode,
        provider: activeMode === 'api' ? 'openai' : activeMode === 'local' ? 'ollama' : 'chatgpt',
        api_key: '',
        model_name: '',
        local_url: 'http://localhost:11434',
        performance_tier: 'high',
        id: ''
    };

    // Helper to get active provider details
    const activeProvider = config.fallback_pool.find(p => p.id === config.active_provider_id) || null;

    useEffect(() => {
        const fetchConfig = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const response = await fetch(`${API}/api/config/ai`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setConfig({
                        active_provider_id: data.active_provider_id || '',
                        fallback_pool: data.fallback_pool || [],
                        routing_strategy: data.routing_strategy || 'manual'
                    });

                    const active = data.fallback_pool?.find((p: any) => p.id === data.active_provider_id);
                    if (active) {
                        setActiveMode(active.mode);
                        if (active.mode === 'web') {
                            checkWebStatus(active.provider);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch AI configuration:", error);
            }
        };

        if (user) fetchConfig();
    }, [user]);

    const checkWebStatus = async (provider: string) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API}/api/config/ai/web-status?provider=${provider}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWebStatus(data);
                if (data.status === 'connected') {
                    setPollingWeb(false);
                }
            }
        } catch (error) {
            console.error("Web status check failed");
        }
    };

    const handleWebConnect = async () => {
        if (!currentTabProvider || currentTabProvider.mode !== 'web' || !user) return;
        setPollingWeb(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API}/api/config/ai/web-connect?provider=${currentTabProvider.provider}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                console.log(`Login window for ${currentTabProvider.provider} requested.`);
            } else {
                setPollingWeb(false);
            }
        } catch (error) {
            console.error("Failed to trigger web connect:", error);
            setPollingWeb(false);
        }
    };

    // Polling effect for Web AI login
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pollingWeb && activeMode === 'web' && currentTabProvider?.mode === 'web') {
            interval = setInterval(() => {
                checkWebStatus(currentTabProvider.provider);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [pollingWeb, activeMode, currentTabProvider]);

    // Auto-detect cloud model
    useEffect(() => {
        const detectCloudModel = async () => {
            if (activeMode !== 'api' || !currentTabProvider || currentTabProvider.mode !== 'api' || !currentTabProvider.api_key || currentTabProvider.api_key.length < 10 || !user) return;
            try {
                const token = await user.getIdToken();
                const response = await fetch(`${API}/api/config/ai/auto-detect`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ provider: currentTabProvider.provider, api_key: currentTabProvider.api_key })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        updateProviderConfig('api', { model_name: data.model_name });
                    }
                }
            } catch (error) {
                console.warn("Model detection failed");
            }
        };

        const timer = setTimeout(detectCloudModel, 1000);
        return () => clearTimeout(timer);
    }, [activeMode, currentTabProvider?.provider, currentTabProvider?.api_key, user]);

    // Auto-fetch Local Models (Ollama, LM Studio)
    useEffect(() => {
        const fetchLocalModels = async () => {
            if (activeMode !== 'local' || !currentTabProvider || currentTabProvider.mode !== 'local' || !currentTabProvider.local_url) return;
            setFetchingModels(true);
            try {
                let url = `${currentTabProvider.local_url}/api/tags`;
                if (currentTabProvider.provider === 'lmstudio') {
                    url = `${currentTabProvider.local_url}/v1/models`;
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    let models: string[] = [];
                    if (currentTabProvider.provider === 'lmstudio') {
                        models = data.data?.map((m: any) => m.id) || [];
                    } else {
                        models = data.models?.map((m: any) => m.name) || [];
                    }

                    setLocalModels(models);
                    if (models.length > 0 && !models.includes(currentTabProvider.model_name)) {
                        updateProviderConfig('local', { model_name: models[0] });
                    }
                }
            } catch (error) {
                console.warn(`${currentTabProvider.provider} not reachable at`, currentTabProvider.local_url);
                setLocalModels([]);
            } finally {
                setFetchingModels(false);
            }
        };

        const timer = setTimeout(fetchLocalModels, 500);
        return () => clearTimeout(timer);
    }, [activeMode, currentTabProvider?.local_url, currentTabProvider?.provider]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API}/api/config/ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });
            if (response.ok) {
                console.log("Configuration saved successfully");
                toast.success('AI configuration saved successfully');
            } else {
                toast.error('Failed to save AI configuration');
            }
        } catch (error) {
            console.error("Failed to save AI configuration:", error);
            toast.error('An error occurred while saving');
        } finally {
            setLoading(false);
        }
    };

    const handleMakePrimary = () => {
        if (currentTabProvider.id) {
            setConfig({ ...config, active_provider_id: currentTabProvider.id });
        } else {
            const newId = `${activeMode}_${Date.now()}`;
            const newProvider = {
                id: newId,
                mode: activeMode,
                provider: activeMode === 'api' ? 'openai' : activeMode === 'local' ? 'ollama' : 'chatgpt',
                api_key: '',
                model_name: 'default',
                local_url: 'http://127.0.0.1:11434',
                performance_tier: 'high',
            };
            setConfig(prev => ({
                ...prev,
                fallback_pool: [...prev.fallback_pool, newProvider],
                active_provider_id: newId
            }));
        }
    };

    // Update provider in pool, or add it if it doesn't exist for this mode
    const updateProviderConfig = (mode: string, updates: any) => {
        setConfig(prev => {
            const pool = [...prev.fallback_pool];
            const idx = pool.findIndex(p => p.mode === mode);

            if (idx >= 0) {
                pool[idx] = { ...pool[idx], ...updates };
            } else {
                // If it doesn't exist, create a baseline
                pool.push({
                    id: `${mode}_${Date.now()}`,
                    mode: mode,
                    provider: mode === 'api' ? 'openai' : mode === 'local' ? 'ollama' : 'chatgpt',
                    api_key: '',
                    model_name: 'default',
                    local_url: 'http://127.0.0.1:11434',
                    performance_tier: 'high',
                    ...updates
                });
            }

            // Automatically set as active if it's the first one
            let newActiveId = prev.active_provider_id;
            if (!newActiveId && pool.length === 1) {
                newActiveId = pool[0].id;
            }

            return { ...prev, fallback_pool: pool, active_provider_id: newActiveId };
        });
    };


    const modes = [
        { id: 'api', label: 'API Cloud', icon: Globe },
        { id: 'local', label: 'Local Hardware', icon: HardDrive },
        { id: 'web', label: 'Web Subscription', icon: Infinity },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Cpu className="text-blue-400" size={24} /> AI Intelligence Matrix
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Configure your primary AI and automatic fallback systems.</p>
                </div>

                {/* Fallback Strategy Toggle */}
                <div className="flex bg-[#141414] p-1 rounded-xl border border-white/5 shadow-lg">
                    <button
                        onClick={() => setConfig({ ...config, routing_strategy: 'manual' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${config.routing_strategy === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Manual Priority
                    </button>
                    <button
                        onClick={() => setConfig({ ...config, routing_strategy: 'smart' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${config.routing_strategy === 'smart' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Auto-Fallback (Smart)
                    </button>
                </div>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex bg-[#141414] p-1 rounded-xl border border-white/5 shadow-lg max-w-2xl">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setActiveMode(mode.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeMode === mode.id
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <mode.icon size={16} />
                        {mode.label}
                    </button>
                ))}
            </div>

            {/* Configuration Panel */}
            <div className="bg-[#141414] p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    {activeMode === 'api' && <Globe size={120} />}
                    {activeMode === 'local' && <HardDrive size={120} />}
                    {activeMode === 'web' && <Infinity size={120} />}
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header for active tab */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <div className="flex items-center gap-3">
                            {activeMode === 'api' && <Globe className="text-blue-400" size={24} />}
                            {activeMode === 'local' && <HardDrive className="text-green-400" size={24} />}
                            {activeMode === 'web' && <Infinity className="text-purple-400" size={24} />}
                            <div>
                                <h3 className="text-lg font-bold text-white capitalize">{activeMode} Provider</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {config.active_provider_id === currentTabProvider.id
                                        ? "This is currently your Primary AI engine."
                                        : "This provider is in your fallback pool."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <select
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-gray-200 focus:border-blue-500 focus:outline-none transition-all uppercase tracking-wider"
                                value={currentTabProvider.performance_tier}
                                onChange={(e) => updateProviderConfig(activeMode, { performance_tier: e.target.value })}
                            >
                                <option className="bg-gray-900 text-white" value="low">Tier: Low Task (Fast)</option>
                                <option className="bg-gray-900 text-white" value="medium">Tier: Medium Task</option>
                                <option className="bg-gray-900 text-white" value="high">Tier: High Task (Reasoning)</option>
                            </select>

                            {(!currentTabProvider.id || config.active_provider_id !== currentTabProvider.id) && (
                                <button
                                    onClick={handleMakePrimary}
                                    className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold uppercase transition-all"
                                >
                                    Make Primary
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* API Mode Fields */}
                        {activeMode === 'api' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">API Service</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-blue-500 focus:outline-none transition-all cursor-pointer hover:bg-black/60 text-white"
                                        value={currentTabProvider.provider}
                                        onChange={(e) => updateProviderConfig('api', { provider: e.target.value })}
                                    >
                                        <option className="bg-gray-900 text-white" value="openai">OpenAI</option>
                                        <option className="bg-gray-900 text-white" value="anthropic">Anthropic</option>
                                        <option className="bg-gray-900 text-white" value="gemini">Google Gemini</option>
                                        <option className="bg-gray-900 text-white" value="deepseek">DeepSeek</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">API Key</label>
                                        {currentTabProvider.model_name && currentTabProvider.api_key && (
                                            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1 font-mono uppercase tracking-tighter shadow-sm animate-in fade-in zoom-in duration-300">
                                                <CheckCircle2 size={10} /> {currentTabProvider.model_name} Connected
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="sk-..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm pr-12 focus:border-blue-500 focus:outline-none transition-all hover:bg-black/60"
                                            value={currentTabProvider.api_key}
                                            onChange={(e) => updateProviderConfig('api', { api_key: e.target.value })}
                                        />
                                        <Shield className="absolute right-4 top-4 text-gray-600" size={18} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Local Mode Fields */}
                        {activeMode === 'local' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Local Provider</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-blue-500 focus:outline-none transition-all cursor-pointer hover:bg-black/60 text-white"
                                        value={currentTabProvider.provider}
                                        onChange={(e) => updateProviderConfig('local', { provider: e.target.value })}
                                    >
                                        <option className="bg-gray-900 text-white" value="ollama">Ollama</option>
                                        <option className="bg-gray-900 text-white" value="lmstudio">LM Studio</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                                        Available Local Models
                                        {fetchingModels && <RefreshCw size={12} className="animate-spin text-blue-400" />}
                                    </label>
                                    {localModels.length > 0 ? (
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-blue-500 focus:outline-none transition-all cursor-pointer text-white"
                                            value={currentTabProvider.model_name}
                                            onChange={(e) => updateProviderConfig('local', { model_name: e.target.value })}
                                        >
                                            {localModels.map(m => <option className="bg-gray-900 text-white" key={m} value={m}>{m}</option>)}
                                        </select>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="llama3, mistral, etc."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-blue-500 focus:outline-none transition-all"
                                                value={currentTabProvider.model_name}
                                                onChange={(e) => updateProviderConfig('local', { model_name: e.target.value })}
                                            />
                                            <AlertCircle className="absolute right-4 top-4 text-amber-500/50" size={18} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                                        {currentTabProvider.provider === 'lmstudio' ? 'LM Studio Base URL' : 'Ollama Base URL (or Tunnel)'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="http://127.0.0.1:11434 or https://your-tunnel.ngrok-free.app"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm font-mono focus:border-blue-500 focus:outline-none transition-all placeholder:text-gray-700"
                                        value={currentTabProvider.local_url}
                                        onChange={(e) => updateProviderConfig('local', { local_url: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-500 leading-relaxed">
                                        To use local models with the cloud, use a tunnel like <span className="text-blue-400">Ngrok</span> or ensure <span className="text-gray-300 font-mono">OLLAMA_ORIGINS="*"</span> is set.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Web Mode Fields */}
                        {activeMode === 'web' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Web Platform</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-blue-500 focus:outline-none transition-all cursor-pointer hover:bg-black/60 text-white"
                                        value={currentTabProvider.provider}
                                        onChange={(e) => {
                                            updateProviderConfig('web', { provider: e.target.value });
                                            setWebStatus({ status: 'disconnected', tier: 'Free' });
                                            setPollingWeb(false);
                                        }}
                                    >
                                        <option className="bg-gray-900 text-white" value="chatgpt">ChatGPT</option>
                                        <option className="bg-gray-900 text-white" value="claude">Claude</option>
                                        <option className="bg-gray-900 text-white" value="gemini_web">Gemini (Web)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Connection Status</label>
                                        {webStatus.status === 'connected' && (
                                            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1 font-mono uppercase tracking-tighter">
                                                <CheckCircle2 size={10} /> {webStatus.tier} Active
                                            </span>
                                        )}
                                    </div>
                                    <div className={`w-full border rounded-xl p-3.5 flex items-center gap-4 transition-all ${webStatus.status === 'connected'
                                        ? 'bg-blue-500/5 border-blue-500/20'
                                        : 'bg-black/40 border-white/10'
                                        }`}>
                                        <div className={`p-2 rounded-lg ${webStatus.status === 'connected' ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                                            <Infinity size={20} className={webStatus.status === 'connected' ? 'text-blue-400' : 'text-gray-500'} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {webStatus.status === 'connected' ? `${currentTabProvider.provider.toUpperCase()} Linked` : 'No Active Session'}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {pollingWeb ? 'Waiting for browser login...' : webStatus.status === 'connected' ? `Subscription: ${webStatus.tier}` : 'Click connect to authenticate'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <button
                                        onClick={handleWebConnect}
                                        disabled={pollingWeb || !currentTabProvider.id}
                                        className={`w-full h-[52px] rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all group ${pollingWeb
                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-wait'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                    >
                                        {pollingWeb ? (
                                            <><RefreshCw size={18} className="animate-spin" /> Authentication in progress...</>
                                        ) : (
                                            <><Globe size={18} className="group-hover:scale-110 transition-transform" /> Connect Browser Session</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0a0a0a] border-t border-white/10 z-50 flex items-center justify-between shadow-2xl">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-200 uppercase tracking-tighter flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" /> System Routing: {config.routing_strategy === 'smart' ? 'Auto-Fallback (Smart)' : 'Manual Priority'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5">Primary: {activeProvider?.provider || 'None'} | {config.fallback_pool.length} Configured Models</span>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}

