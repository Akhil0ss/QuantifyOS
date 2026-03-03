'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Cpu, Smartphone, Link2 } from 'lucide-react';
import ConfigSection from './ConfigSection';
import HardwareSection from './HardwareSection';
import WhatsAppBridge from './WhatsAppBridge';

type SubTab = 'ai' | 'hardware' | 'whatsapp';

export default function ConnectionsHub() {
    const [subTab, setSubTab] = useState<SubTab>('ai');

    const tabs = [
        { id: 'ai' as SubTab, label: 'AI Providers', icon: <Globe size={16} />, color: 'blue' },
        { id: 'hardware' as SubTab, label: 'Hardware Bridge', icon: <Cpu size={16} />, color: 'emerald' },
        { id: 'whatsapp' as SubTab, label: 'WhatsApp', icon: <Smartphone size={16} />, color: 'green' },
    ];

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-600/20 text-blue-400 shadow-blue-500/10 border-blue-500/20',
        emerald: 'bg-emerald-600/20 text-emerald-400 shadow-emerald-500/10 border-emerald-500/20',
        green: 'bg-green-600/20 text-green-400 shadow-green-500/10 border-green-500/20',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Link2 className="text-cyan-400" size={24} /> Connections
                </h1>
                <p className="text-zinc-500 text-sm mt-1">AI providers, hardware devices, and messaging bridges</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 p-1 bg-[#141414] rounded-xl border border-white/5 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${subTab === tab.id
                                ? `${colorMap[tab.color]} shadow-lg border`
                                : 'text-zinc-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <motion.div
                key={subTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {subTab === 'ai' && <ConfigSection />}
                {subTab === 'hardware' && <HardwareSection />}
                {subTab === 'whatsapp' && <WhatsAppBridge />}
            </motion.div>
        </div>
    );
}
