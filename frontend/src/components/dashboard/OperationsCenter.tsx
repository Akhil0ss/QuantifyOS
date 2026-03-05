'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Network, LayoutGrid, List } from 'lucide-react';
import TaskSection from './TaskSection';
import SwarmSection from './SwarmSection';

type SubTab = 'tasks' | 'swarm';

export default function OperationsCenter() {
    const [subTab, setSubTab] = useState<SubTab>('tasks');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="text-blue-400" size={24} /> Operations Center
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Task execution, agent orchestration, and swarm management</p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 p-1 bg-[#141414] rounded-xl border border-white/5 w-fit">
                <button
                    onClick={() => setSubTab('tasks')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${subTab === 'tasks'
                            ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-500/20'
                            : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <List size={16} /> Tasks & Agents
                </button>
                <button
                    onClick={() => setSubTab('swarm')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${subTab === 'swarm'
                            ? 'bg-purple-600/20 text-purple-400 shadow-lg shadow-purple-500/10 border border-purple-500/20'
                            : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Network size={16} /> Swarm Activity
                </button>
            </div>

            {/* Content */}
            <motion.div
                key={subTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {subTab === 'tasks' && <TaskSection />}
                {subTab === 'swarm' && <SwarmSection />}
            </motion.div>
        </div>
    );
}
