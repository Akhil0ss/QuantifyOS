'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { Save, User as UserIcon, ShieldAlert, Cpu, Settings, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '';


export default function ProfileSection() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [prefs, setPrefs] = useState({
        autonomy_level: 'medium',
        auto_retry_limit: 2,
        financial_override: true,
        background_polling: false
    });

    const fetchPrefs = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/user/autonomy`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrefs(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile settings:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPrefs();
    }, [fetchPrefs]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/user/autonomy`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(prefs)
            });
            if (res.ok) {
                toast.success('Autonomy preferences saved!');
            } else {
                toast.error('Failed to save preferences');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-2xl">
                    <UserIcon size={32} className="text-white drop-shadow-lg" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{user?.displayName || 'Autocrat Administrator'}</h2>
                    <p className="text-gray-400">{user?.email}</p>
                </div>
            </div>

            {/* Autonomy Dials */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        <Cpu size={18} className="text-blue-400" /> Autonomy Controls
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">Granular settings for agent independence and operational boundaries.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Autonomy Level */}
                    <div className="bg-[#141414] rounded-xl border border-white/5 p-5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Base Autonomy Level</label>
                        <select
                            value={prefs.autonomy_level}
                            onChange={(e) => setPrefs({ ...prefs, autonomy_level: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="low">Low (Requires approvals for most actions)</option>
                            <option value="medium">Medium (Standard operation)</option>
                            <option value="high">High (Proactive execution)</option>
                            <option value="ultimate">Ultimate (Unrestricted Sandbox)</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-2">Defines how aggressively agents generate and execute unprompted sub-tasks.</p>
                    </div>

                    {/* Auto-Retry Logic */}
                    <div className="bg-[#141414] rounded-xl border border-white/5 p-5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Failure Auto-Retry Limit: {prefs.auto_retry_limit}</label>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            value={prefs.auto_retry_limit}
                            onChange={(e) => setPrefs({ ...prefs, auto_retry_limit: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                            <span>0 (Fail instantly)</span>
                            <span>5 (Persistent)</span>
                        </div>
                    </div>

                    {/* Financial Override */}
                    <div className="bg-[#141414] rounded-xl border border-white/5 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <ShieldAlert size={14} className="text-red-400" /> Financial Safeguard
                                </label>
                                <button
                                    onClick={() => setPrefs({ ...prefs, financial_override: !prefs.financial_override })}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prefs.financial_override ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${prefs.financial_override ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Require explicit human authorization before executing any action that drains Agent Wallet funds.</p>
                        </div>
                    </div>

                    {/* Background Polling */}
                    <div className="bg-[#141414] rounded-xl border border-white/5 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Settings size={14} className="text-purple-400" /> Background Evolution
                                </label>
                                <button
                                    onClick={() => setPrefs({ ...prefs, background_polling: !prefs.background_polling })}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prefs.background_polling ? 'bg-purple-500' : 'bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${prefs.background_polling ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Allow L5 engines to passively scan environment data and execute self-improvement loops without prompts.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}
