'use client';

import { useState, useEffect } from 'react';
import { Database, HardDrive, Cloud, Server, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MemorySection() {
    const { user } = useAuth();
    const [config, setConfig] = useState({
        storage_type: 'local',
        storage_credentials: {} as any
    });
    const [activeTab, setActiveTab] = useState('local');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchConfig();
    }, [user]);

    const fetchConfig = async () => {
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`${API}/api/config/memory`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    storage_type: data.storage_type || 'local',
                    storage_credentials: data.storage_credentials || {}
                });
                setActiveTab(data.storage_type || 'local');
            }
        } catch (error) {
            console.error('Failed to fetch memory config:', error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await user?.getIdToken();
            const res = await fetch(`${API}/api/config/memory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setSaved(true);
                toast.success('Memory configuration saved successfully');
                setTimeout(() => setSaved(false), 3000);
            } else {
                toast.error('Failed to save memory configuration');
            }
        } catch (error) {
            console.error('Failed to save memory config:', error);
            toast.error('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    const updateCredentials = (key: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            storage_credentials: {
                ...prev.storage_credentials,
                [key]: value
            }
        }));
    };

    const storageOptions = [
        { id: 'local', label: 'Local SQLite', icon: HardDrive },
        { id: 'supabase', label: 'Supabase (pgvector)', icon: Server },
        { id: 'postgres', label: 'PostgreSQL', icon: Database },
        { id: 'mongodb', label: 'MongoDB', icon: Database },
        { id: 'gdrive', label: 'Google Drive', icon: Cloud },
        { id: 's3', label: 'AWS S3', icon: Cloud },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 pt-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Database className="text-purple-400" size={24} /> Memory Subsystem
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Configure where your AI and agents store their semantic data.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : saved ? <><CheckCircle2 size={18} /> Saved</> : 'Save Integration'}
                </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex bg-[#141414] p-1 rounded-xl border border-white/5 shadow-lg max-w-2xl">
                {storageOptions.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setActiveTab(option.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === option.id
                            ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <option.icon size={16} />
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Configuration Panel */}
            <div className="bg-[#141414] p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    {activeTab === 'local' && <HardDrive size={120} />}
                    {activeTab === 'supabase' && <Server size={120} />}
                    {activeTab === 'postgres' && <Database size={120} />}
                    {activeTab === 'mongodb' && <Database size={120} />}
                    {activeTab === 'gdrive' && <Cloud size={120} />}
                    {activeTab === 's3' && <Cloud size={120} />}
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header for active tab */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 gap-4">
                        <div className="flex items-center gap-3">
                            {activeTab === 'local' && <HardDrive className="text-purple-400" size={24} />}
                            {activeTab === 'supabase' && <Server className="text-purple-400" size={24} />}
                            {activeTab === 'postgres' && <Database className="text-purple-400" size={24} />}
                            {activeTab === 'mongodb' && <Database className="text-purple-400" size={24} />}
                            {activeTab === 'gdrive' && <Cloud className="text-purple-400" size={24} />}
                            {activeTab === 's3' && <Cloud className="text-purple-400" size={24} />}
                            <div>
                                <h3 className="text-lg font-bold text-white capitalize">{storageOptions.find(o => o.id === activeTab)?.label} Integration</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-500">Configure credentials for secure remote access.</p>
                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Topology Synced</span>
                                </div>
                            </div>
                        </div>

                        {config.storage_type === activeTab ? (
                            <span className="text-[10px] bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20 flex items-center gap-1 font-mono uppercase tracking-tighter shrink-0">
                                <CheckCircle2 size={12} /> Primary Active Storage
                            </span>
                        ) : (
                            <button
                                onClick={() => setConfig({ ...config, storage_type: activeTab })}
                                className="text-xs bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 rounded-lg border border-white/10 transition-colors shrink-0 font-medium"
                            >
                                Set as Primary Storage
                            </button>
                        )}
                    </div>

                    {/* V11 7-Layer Auto-Provisioning Graphic */}
                    <div className="bg-black/20 border border-white/5 rounded-xl p-6 mb-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Database size={14} className="text-purple-400" /> V11 Auto-Provisioning Enabled
                                </h4>
                                <p className="text-xs text-gray-500 max-w-xl">
                                    Quantify OS will automatically create the necessary tables, collections, and vector spaces within your selected integration to support the full 7-Layer Enterprise Memory Architecture.
                                </p>
                            </div>
                            <span className="text-[10px] font-bold tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">L7 ARCHITECTURE</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                            {['Semantic (Vector)', 'Procedural', 'Episodic', 'Knowledge Graph', 'Working State', 'Autobiographical', 'Emotional/Alignment'].map((layer, i) => (
                                <div key={i} className="bg-[#141414] border border-white/5 p-3 rounded-lg flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></div>
                                    <span className="text-xs text-gray-400">{layer}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 max-w-2xl">
                        {config.storage_type === activeTab && (
                            <div className="bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                                <HardDrive size={48} className="text-gray-600" />
                                <div>
                                    <h4 className="text-sm font-bold text-white">Local System Storage</h4>
                                    <p className="text-xs text-gray-400 mt-2 max-w-md">Data is saved directly to your local hardware. No extra configuration is needed. Ensures highest privacy but data is device-dependent.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 's3' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">AWS Access Key</label>
                                    <input
                                        type="text"
                                        placeholder="AKIA..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60"
                                        value={config.storage_credentials?.aws_access_key || ''}
                                        onChange={(e) => updateCredentials('aws_access_key', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">AWS Secret Key</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="Secret..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm pr-12 focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60"
                                            value={config.storage_credentials?.aws_secret_key || ''}
                                            onChange={(e) => updateCredentials('aws_secret_key', e.target.value)}
                                        />
                                        <Shield className="absolute right-4 top-4 text-gray-600" size={18} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Bucket Name & Region</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="my-agent-bucket"
                                            className="w-2/3 bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60"
                                            value={config.storage_credentials?.aws_bucket_name || ''}
                                            onChange={(e) => updateCredentials('aws_bucket_name', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="us-east-1"
                                            className="w-1/3 bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60"
                                            value={config.storage_credentials?.aws_region || ''}
                                            onChange={(e) => updateCredentials('aws_region', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'gdrive' && (
                            <>
                                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-400 text-xs">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <p>Google Drive integration requires a Service Account JSON key or OAuth2 client ID. For headless agent autonomy, Service Account JSON is recommended.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Service Account JSON</label>
                                    <textarea
                                        placeholder='{ "type": "service_account", "project_id": "...", "private_key": "..." }'
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm font-mono focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60 h-32"
                                        value={config.storage_credentials?.gdrive_service_account_json || ''}
                                        onChange={(e) => updateCredentials('gdrive_service_account_json', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Target Folder ID (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="1X-abcDEFghi..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60"
                                        value={config.storage_credentials?.gdrive_folder_id || ''}
                                        onChange={(e) => updateCredentials('gdrive_folder_id', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'supabase' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Supabase Project URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://xyzcompany.supabase.co"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                        value={config.storage_credentials?.supabase_url || ''}
                                        onChange={(e) => updateCredentials('supabase_url', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Service Role Key</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="eyJhbG..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm pr-12 focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                            value={config.storage_credentials?.supabase_key || ''}
                                            onChange={(e) => updateCredentials('supabase_key', e.target.value)}
                                        />
                                        <Shield className="absolute right-4 top-4 text-gray-600" size={18} />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Use the service_role key to bypass RLS for administrative AI storage.</p>
                                </div>
                            </>
                        )}

                        {activeTab === 'postgres' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">PostgreSQL Connection String</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="postgresql://user:password@localhost:5432/dbname"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm pr-12 focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                        value={config.storage_credentials?.postgres_url || ''}
                                        onChange={(e) => updateCredentials('postgres_url', e.target.value)}
                                    />
                                    <Shield className="absolute right-4 top-4 text-gray-600" size={18} />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Requires the pgvector extension for semantic similarity search.</p>
                            </div>
                        )}

                        {activeTab === 'mongodb' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">MongoDB URI</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="mongodb+srv://user:password@cluster.mongodb.net/dbname"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm pr-12 focus:border-purple-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                        value={config.storage_credentials?.mongodb_uri || ''}
                                        onChange={(e) => updateCredentials('mongodb_uri', e.target.value)}
                                    />
                                    <Shield className="absolute right-4 top-4 text-gray-600" size={18} />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Use MongoDB Atlas for built-in vector search capabilities.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
