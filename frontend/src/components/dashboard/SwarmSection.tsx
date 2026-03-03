'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Network, Bot, MessageSquare, Play, Square, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SwarmSection() {
    const { user } = useAuth();
    const [agents, setAgents] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state for spawning
    const [spawning, setSpawning] = useState(false);
    const [role, setRole] = useState('Researcher Agent');
    const [goal, setGoal] = useState('');

    const fetchData = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // Mapping workspace_id to standard default pattern default-{uid[:8]}
            const workspace_id = `default-${user.uid.slice(0, 8)}`;

            const [agentsRes, msgsRes] = await Promise.all([
                fetch(`/api/swarm/active?workspace_id=${workspace_id}`, { headers }),
                fetch(`/api/swarm/messages?workspace_id=${workspace_id}`, { headers })
            ]);

            if (agentsRes.ok) setAgents(await agentsRes.json());
            if (msgsRes.ok) setMessages(await msgsRes.json());

        } catch (error) {
            console.error("Failed to load swarm data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();

        // Polling for live updates
        const interval = setInterval(() => {
            if (user && !document.hidden) fetchData();
        }, 3000);

        return () => clearInterval(interval);
    }, [user]);

    const handleSpawn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !goal.trim()) {
            toast.error("Please provide a goal for the agent");
            return;
        }

        setSpawning(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/swarm/spawn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    workspace_id: user.uid,
                    parent_task_id: 'manual_ui_spawn',
                    role: role,
                    goal: goal
                })
            });

            if (res.ok) {
                toast.success(`Spawned ${role} successfully`);
                setGoal('');
                fetchData();
            } else {
                toast.error("Failed to spawn agent");
            }
        } catch (error) {
            toast.error("An error occurred");
            console.error(error);
        } finally {
            setSpawning(false);
        }
    };

    const handleTerminate = async (agent_id: string) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/swarm/terminate/${agent_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ workspace_id: user.uid })
            });

            if (res.ok) {
                toast.success("Agent terminated");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to terminate agent");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'running': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'terminated': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    if (loading && agents.length === 0) return <div className="p-8 text-center text-gray-500 animate-pulse">Scanning Swarm Network...</div>;

    const activeCount = agents.filter(a => a.status === 'running' || a.status === 'pending').length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 scroll-smooth">
            <header className="mb-6 flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-white">
                        <Network className="text-fuchsia-500" size={24} /> Swarm Orchestration
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Monitor and deploy specialized sub-agents coordinating in parallel.</p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-white/10 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-xs font-medium text-gray-300">{activeCount} Active Nodes</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">
                    {/* Active Agents Grid */}
                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                <Activity size={16} /> Agent Topology
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {agents.length === 0 ? (
                                <div className="col-span-full p-8 text-center border border-dashed border-white/10 rounded-xl text-gray-500 flex flex-col items-center">
                                    <AlertCircle size={32} className="mb-3 opacity-50" />
                                    <p className="text-sm">No agents currently deployed in swarm.</p>
                                </div>
                            ) : (
                                agents.map(agent => (
                                    <div key={agent.id} className="bg-black/40 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 text-fuchsia-400 rounded-lg">
                                                    <Bot size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-white">{agent.role}</h4>
                                                    <p className="text-[10px] text-gray-500 font-mono">{agent.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded-full border uppercase font-bold tracking-wider ${getStatusColor(agent.status)}`}>
                                                {agent.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                                            {agent.goal}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                            <span className="text-[10px] text-gray-500">
                                                Started: {new Date(agent.created_at).toLocaleTimeString()}
                                            </span>
                                            {(agent.status === 'running' || agent.status === 'pending') && (
                                                <button
                                                    onClick={() => handleTerminate(agent.id)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                                    title="Terminate Agent"
                                                >
                                                    <Square size={14} fill="currentColor" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Inter-Agent Message Bus */}
                    <div className="bg-[#141414] border border-white/5 rounded-2xl flex flex-col h-[400px]">
                        <div className="p-5 border-b border-white/5 bg-black/20">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                <MessageSquare size={16} /> Inter-Agent Comms
                            </h3>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-600">
                                    Awaiting message telemetry...
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className="bg-black/40 border border-white/5 p-3 rounded-lg flex gap-3">
                                        <div className="text-fuchsia-500 opacity-60 mt-0.5">❯</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1 opacity-50">
                                                <span>{msg.sender_id.split('-')[0]} → {msg.receiver_id === 'broadcast' ? 'ALL' : msg.receiver_id.split('-')[0]}</span>
                                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Spawn Controls */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-fuchsia-900/20 to-[#141414] border border-fuchsia-500/20 p-6 rounded-2xl sticky top-24">
                        <h3 className="text-lg font-semibold text-white mb-2">Manual Spawn</h3>
                        <p className="text-xs text-fuchsia-200/60 mb-6">
                            Deploy a specialized single-purpose agent to the swarm.
                        </p>

                        <form onSubmit={handleSpawn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Agent Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                >
                                    <option>Researcher Agent</option>
                                    <option>Coder Agent</option>
                                    <option>Reviewer Agent</option>
                                    <option>Data Analyst</option>
                                    <option>Web Scraper</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Primary Goal</label>
                                <textarea
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="Define the specific objective for this agent to accomplish autonomously..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors min-h-[120px] resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={spawning || !goal.trim()}
                                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-fuchsia-800 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-500/20 mt-4"
                            >
                                {spawning ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <><Play size={16} fill="currentColor" /> Deploy Node</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
