'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Building2, Save, FileText, Target, Users, Star, Swords, MessageSquare, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const API = ''; // Relative paths — proxied by Next.js rewrites

export default function BusinessSection() {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [config, setConfig] = useState({
        company_name: '',
        industry: '',
        target_audience: '',
        primary_directive: '',
        company_description: '',
        tone_of_voice: '',
        core_competitors: '',
        unique_value_proposition: '',
        risk_tolerance: 'balanced',
        anti_directives: ''
    });

    const [okrs, setOkrs] = useState<string[]>(['']);
    const { user } = useAuth();

    useEffect(() => {
        const fetchConfig = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${API}/api/config/business`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && Object.keys(data).length > 0) {
                        setConfig({
                            company_name: data.company_name || '',
                            industry: data.industry || '',
                            target_audience: data.target_audience || '',
                            primary_directive: data.primary_directive || '',
                            company_description: data.company_description || '',
                            tone_of_voice: data.tone_of_voice || '',
                            core_competitors: data.core_competitors || '',
                            unique_value_proposition: data.unique_value_proposition || '',
                            risk_tolerance: data.risk_tolerance || 'balanced',
                            anti_directives: data.anti_directives || ''
                        });
                        setOkrs(data.okrs && data.okrs.length > 0 ? data.okrs : ['']);
                    }
                }
            } catch (error) {
                console.error("Failed to load business config", error);
            }
        };
        fetchConfig();
    }, [user]);

    const addOkr = () => setOkrs([...okrs, '']);
    const updateOkr = (index: number, value: string) => {
        const newOkrs = [...okrs];
        newOkrs[index] = value;
        setOkrs(newOkrs);
    };
    const removeOkr = (index: number) => {
        if (okrs.length > 1) {
            setOkrs(okrs.filter((_, i) => i !== index));
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const token = await user.getIdToken();
            const payload = { ...config, okrs: okrs.filter(o => o.trim() !== '') };
            const res = await fetch(`${API}/api/config/business`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setSaved(true);
                toast.success('Business profile saved successfully');
                setTimeout(() => setSaved(false), 3000);
            } else {
                toast.error('Failed to save business profile');
            }
        } catch (error) {
            console.error("Failed to save business config", error);
            toast.error('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Building2 className="text-orange-400" size={24} /> Business & Corporate Profile
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Contextualize Quantify OS so agents understand your business better.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-6 py-2 text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : saved ? <><Save size={18} /> Saved</> : 'Save Profile'}
                </button>
            </div>

            <div className="bg-[#141414] p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Building2 size={150} />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
                            <FileText size={16} className="text-orange-400" /> General Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Company / Project Name</label>
                                <input
                                    type="text"
                                    placeholder="Acme Corp"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                    value={config.company_name}
                                    onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Industry / Niche</label>
                                <input
                                    type="text"
                                    placeholder="Fintech, SaaS, E-commerce..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                    value={config.industry}
                                    onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Details */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-2 mt-8">
                            <Target size={16} className="text-orange-400" /> Strategic Context
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <Users size={14} /> Target Audience
                                </label>
                                <input
                                    type="text"
                                    placeholder="B2B Enterprise, Gen-Z Gamers..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                    value={config.target_audience}
                                    onChange={(e) => setConfig({ ...config, target_audience: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <Target size={14} /> Ultimate Objective (Primary Directive)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Maximize weekly active users"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                    value={config.primary_directive}
                                    onChange={(e) => setConfig({ ...config, primary_directive: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brand & Market Positioning */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-2 mt-8">
                            <Star size={16} className="text-orange-400" /> Brand & Positioning
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <Swords size={14} /> Core Competitors
                                </label>
                                <input
                                    type="text"
                                    placeholder="OpenAI, Anthropic (separated by comma)"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                    value={config.core_competitors}
                                    onChange={(e) => setConfig({ ...config, core_competitors: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <Star size={14} /> Unique Value Proposition (UVP)
                                </label>
                                <input
                                    type="text"
                                    placeholder="We provide local-first, uncensored swarms..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                    value={config.unique_value_proposition}
                                    onChange={(e) => setConfig({ ...config, unique_value_proposition: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <MessageSquare size={14} /> Tone of Voice & Personality
                                </label>
                                <input
                                    type="text"
                                    placeholder="Professional, analytical, bold but never arrogant."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                    value={config.tone_of_voice}
                                    onChange={(e) => setConfig({ ...config, tone_of_voice: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Guardrails (V11) */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-2 mt-8">
                            <Target size={16} className="text-orange-400" /> Strategic Autonomy Guardrails
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <Target size={14} /> Active OKRs (Immediate Priorities)
                                </label>
                                <p className="text-[10px] text-gray-500 pb-1 -mt-2">These dictate the immediate short-term objectives the Swarm Orchestrator will optimize for.</p>
                                {okrs.map((okr, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Objective ${index + 1}...`}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white"
                                            value={okr}
                                            onChange={(e) => updateOkr(index, e.target.value)}
                                        />
                                        <button
                                            onClick={() => removeOkr(index)}
                                            className="px-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
                                        >
                                            <span className="sr-only">Remove</span>
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addOkr}
                                    className="text-orange-400 text-xs font-medium hover:text-orange-300 transition-colors"
                                >
                                    + Add another OKR
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <Shield size={14} /> Risk Tolerance & Financial Posture
                                </label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 text-white [&>option]:bg-gray-900 [&>option]:text-white"
                                    value={config.risk_tolerance}
                                    onChange={(e) => setConfig({ ...config, risk_tolerance: e.target.value })}
                                >
                                    <option value="conservative">Conservative (Human Approval Req. for everything)</option>
                                    <option value="balanced">Balanced (Auto-deploy minor fixes, strict wallet budget)</option>
                                    <option value="aggressive">Aggressive (Full Autonomy, Auto-scale & Open Wallet)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40 flex items-center gap-2">
                                    <AlertTriangle size={14} /> Anti-Directives (Hard Boundaries)
                                </label>
                                <textarea
                                    placeholder="Never deploy without testing. Never violate terms of service. Never spend over $500/day."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 h-24 text-white"
                                    value={config.anti_directives}
                                    onChange={(e) => setConfig({ ...config, anti_directives: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comprehensive Summary */}
                    <div className="space-y-2 mt-8">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-white/40">Core Business Description</label>
                        <p className="text-[10px] text-gray-500 pb-1">This text is embedded into the persona of top-level structural agents to give them high-order context.</p>
                        <textarea
                            placeholder="We build autonomous systems for enterprise efficiency, focusing on the reduction of operational bottlenecks through AI..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm focus:border-orange-500 focus:outline-none transition-all hover:bg-black/60 h-32 text-white"
                            value={config.company_description}
                            onChange={(e) => setConfig({ ...config, company_description: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
