"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, TerminalSquare, BrainCircuit, Activity, Zap, PlayCircle, Settings, Coffee, UserCog, Megaphone, LineChart, GanttChart, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function TaskSection() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newGoal, setNewGoal] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Telemetry trace state
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [taskTraces, setTaskTraces] = useState<any[]>([]);
    const [pollingInterval, setPollingInterval] = useState<any>(null);

    // Using a default workspace for the user for now
    const workspaceId = user ? `default-${user.uid}` : '';

    const fetchTasks = useCallback(async () => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const sorted = data.sort((a: any, b: any) => b.created_at - a.created_at);
                setTasks(sorted);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [user, workspaceId]);

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 5000);
        return () => clearInterval(interval);
    }, [fetchTasks]);

    const fetchTraces = async (taskId: string) => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/tasks/${taskId}/traces`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTaskTraces(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch traces:', error);
        }
    };

    const toggleExpand = (taskId: string) => {
        if (expandedTaskId === taskId) {
            setExpandedTaskId(null);
            setTaskTraces([]);
            if (pollingInterval) clearInterval(pollingInterval);
        } else {
            setExpandedTaskId(taskId);
            setTaskTraces([]);
            fetchTraces(taskId);

            if (pollingInterval) clearInterval(pollingInterval);
            const interval = setInterval(() => fetchTraces(taskId), 2000);
            setPollingInterval(interval);
        }
    };

    useEffect(() => {
        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [pollingInterval]);

    const handleApprove = async (taskId: string) => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/tasks/${taskId}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Task approved. Resuming execution...');
                fetchTasks();
            } else {
                toast.error('Failed to approve task');
            }
        } catch (error) {
            console.error('Failed to approve task:', error);
            toast.error('An error occurred');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim() || !user || !workspaceId) return;
        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ goal: newGoal })
            });
            if (res.ok) {
                setNewGoal('');
                fetchTasks();
                toast.success('Task submitted to the Autonomous CEO');
            } else {
                toast.error('Failed to submit task');
            }
        } catch (error) {
            console.error('Failed to create task:', error);
            toast.error('An error occurred while submitting');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done': return <CheckCircle2 className="text-emerald-400" size={20} />;
            case 'failed': return <AlertCircle className="text-rose-400" size={20} />;
            case 'running': return <Loader2 className="text-sky-400 animate-spin" size={20} />;
            case 'awaiting_approval': return <AlertCircle className="text-amber-400" size={20} />;
            default: return <Clock className="text-slate-400" size={20} />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'done': return <span className="text-emerald-400">Completed</span>;
            case 'failed': return <span className="text-rose-400">Failed</span>;
            case 'running': return <span className="text-sky-400">In Progress</span>;
            case 'awaiting_approval': return <span className="text-amber-400">Awaiting Approval</span>;
            default: return <span className="text-slate-400">Pending</span>;
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'thought': return <BrainCircuit size={16} className="text-fuchsia-400" />;
            case 'tool_call': return <TerminalSquare size={16} className="text-sky-400" />;
            case 'tool_result': return <CheckCircle2 size={16} className="text-emerald-400" />;
            case 'error': return <AlertCircle size={16} className="text-rose-400" />;
            case 'system': return <Settings size={16} className="text-indigo-400" />;
            case 'delegation_cto': return <UserCog size={16} className="text-blue-400" />;
            case 'delegation_cmo': return <Megaphone size={16} className="text-orange-400" />;
            case 'delegation_cfo': return <LineChart size={16} className="text-emerald-400" />;
            case 'delegation_coo': return <GanttChart size={16} className="text-purple-400" />;
            default: return <Activity size={16} className="text-slate-400" />;
        }
    };

    const activeTasks = tasks.filter(t => t.status === 'running').length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;

    return (
        <div className="space-y-8">
            {/* CEO Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#1c1c1e] to-[#121213] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-sky-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 ring-1 ring-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Active Ops</p>
                            <h2 className="text-2xl font-bold text-white mt-0.5">{activeTasks}</h2>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#1c1c1e] to-[#121213] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Completed Log</p>
                            <h2 className="text-2xl font-bold text-white mt-0.5">{completedTasks}</h2>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#1c1c1e] to-[#121213] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-fuchsia-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 ring-1 ring-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Dynamic Tools</p>
                            <h2 className="text-2xl font-bold text-white mt-0.5">Online</h2>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#1c1c1e] to-[#121213] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">CEO Presence</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                                <h2 className="text-md font-bold text-white">Active & Listening</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Command Input */}
            <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-fuchsia-600/10 p-[1px] rounded-2xl shadow-lg">
                <div className="bg-[#141414] rounded-2xl focus-within:bg-[#1a1a1c] transition-all">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 p-2">
                        <div className="flex-1 w-full relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                <Coffee size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Message your CEO... (e.g. 'Can you check my emails and summarize the urgent ones?')"
                                className="w-full bg-transparent py-4 pl-12 pr-4 text-[15px] focus:outline-none placeholder:text-gray-600 text-white font-medium"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                disabled={submitting}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || !newGoal.trim()}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-8 py-3.5 font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                        >
                            {submitting ? <><Loader2 size={18} className="animate-spin" /> Thinking...</> : <><Send size={18} /> Chat</>}
                        </button>
                    </form>
                </div>
            </div>

            {/* Live Operations Feed */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-sky-400" /> Active Operations & Conversations
                </h3>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center p-16 bg-[#141414] rounded-2xl border border-white/5 shadow-inner">
                            <Coffee size={48} className="text-gray-600 mx-auto mb-4" />
                            <h3 className="text-white font-semibold mb-1">CEO is on Standby</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">Issue a command above. If a tool doesn't exist, the CEO will autonomously code it, test it, and execute.</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={task.id}
                                className={`bg-[#141414] rounded-2xl border ${task.status === 'running' ? 'border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.05)]' : 'border-white/5 hover:border-white/10'} transition-all overflow-hidden flex flex-col`}
                            >
                                {/* Operation Header */}
                                <div
                                    className="p-5 flex items-start sm:items-center justify-between cursor-pointer select-none group"
                                    onClick={() => toggleExpand(task.id)}
                                >
                                    <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${task.status === 'running' ? 'bg-sky-500/10 border-sky-500/20' :
                                            task.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/10' :
                                                'bg-white/5 border-white/5'
                                            }`}>
                                            {getStatusIcon(task.status)}
                                        </div>
                                        <div className="flex-1 pr-4">
                                            <h3 className="text-[15px] font-semibold text-white leading-tight">{task.goal}</h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                    {getStatusText(task.status)}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                <span className="text-xs text-gray-500">
                                                    {task.created_at ? new Date(task.created_at).toLocaleTimeString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {task.status === 'awaiting_approval' && (
                                        <div className="flex gap-2 pr-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleApprove(task.id)}
                                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-lg border border-amber-500/20 text-xs font-bold transition-all flex items-center gap-2"
                                            >
                                                <Zap size={14} /> Approve Action
                                            </button>
                                        </div>
                                    )}

                                    <div className="shrink-0 p-2 rounded-lg bg-white/5 text-gray-400 group-hover:bg-white/10 transition-colors hidden sm:block">
                                        {expandedTaskId === task.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Detailed Trace Expand */}
                                <AnimatePresence>
                                    {expandedTaskId === task.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5 bg-[#0f0f10] relative"
                                        >
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Activity size={14} className="text-indigo-400" /> Execution Telemetry Node
                                                    </h4>
                                                </div>

                                                {taskTraces.length === 0 ? (
                                                    <div className="flex items-center gap-3 text-sm text-sky-400 font-mono py-8 justify-center bg-sky-900/10 rounded-xl border border-sky-500/10">
                                                        <Loader2 size={16} className="animate-spin" /> Synchronizing brain streams...
                                                    </div>
                                                ) : (
                                                    <div className="relative space-y-0 pl-3">
                                                        {/* Vertical connection line */}
                                                        <div className="absolute top-4 left-5 bottom-4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                                                        {taskTraces.map((trace, index) => {

                                                            const isDynamic = trace.action.includes('Dynamic') || trace.action.includes('Sandboxing') || trace.action.includes('Tool Compiled');
                                                            const isToolCall = trace.category === 'tool_call';

                                                            return (
                                                                <div key={trace.id} className="relative z-10 flex gap-4 text-[13px] font-mono items-start pb-6">

                                                                    {/* Timeline Dot */}
                                                                    <div className={`mt-1 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-[#0f0f10] ${isDynamic ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                                                                        isToolCall ? 'bg-sky-500/20 text-sky-400' :
                                                                            trace.category.startsWith('delegation_') ? 'bg-amber-500/20 text-amber-400' :
                                                                                'bg-[#1a1a1c] text-gray-400 border border-white/10'
                                                                        }`}>
                                                                        {getCategoryIcon(trace.category)}
                                                                    </div>

                                                                    <div className={`flex-1 ${trace.category.startsWith('delegation_') ? 'bg-amber-500/5' : 'bg-white/[0.02]'} border border-white/5 rounded-lg p-4 hover:bg-white/[0.04] transition-all`}>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className={`font-bold ${isDynamic ? 'text-fuchsia-400' :
                                                                                trace.category.startsWith('delegation_') ? 'text-amber-400' :
                                                                                    'text-gray-300'
                                                                                }`}>
                                                                                {trace.action}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-500 bg-black/40 px-2 py-0.5 rounded">
                                                                                {new Date(trace.timestamp).toLocaleTimeString()}
                                                                            </span>
                                                                        </div>

                                                                        {trace.details && (
                                                                            <div className={`text-[12px] ${trace.category.startsWith('delegation_') ? 'text-amber-100/70' : 'text-gray-400'} break-words whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar`}>
                                                                                {typeof trace.details === 'object'
                                                                                    ? JSON.stringify(trace.details, null, 2)
                                                                                    : trace.details}
                                                                            </div>
                                                                        )}

                                                                        {isDynamic && (
                                                                            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/10 w-fit px-2 py-1 rounded">
                                                                                <Zap size={10} /> Dynamic Tool Code Authenticated
                                                                            </div>
                                                                        )}

                                                                        {trace.category.startsWith('delegation_') && (
                                                                            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 w-fit px-2 py-1 rounded">
                                                                                <Users size={10} /> Specialized C-Suite Sub-Agent Spawned
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {task.status === 'done' && task.result && (
                                                            <div className="relative z-10 flex gap-4 text-[13px] font-mono items-start pb-2 pt-2">
                                                                <div className="mt-1 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-[#0f0f10] bg-emerald-500/20 text-emerald-400">
                                                                    <CheckCircle2 size={12} />
                                                                </div>
                                                                <div className="flex-1 border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-5">
                                                                    <span className="text-emerald-400 font-bold tracking-wider uppercase text-[11px] block mb-2">Final Operation Result</span>
                                                                    <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{task.result}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
