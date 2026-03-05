'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Cpu, Plus, Radio, Server, Plug, Signal, SignalHigh, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HardwareSection() {
    const { user } = useAuth();
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Register form state
    const [registering, setRegistering] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('sensor');
    const [description, setDescription] = useState('');

    // Auth token copy state
    const [newToken, setNewToken] = useState<{ id: string, token: string } | null>(null);

    const fetchData = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/hardware/list?workspace_id=${user.uid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setDevices(await res.json());
        } catch (error) {
            console.error("Failed to load hardware list", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
        const interval = setInterval(() => { if (user) fetchData(); }, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return toast.error("Device name is required");

        setRegistering(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/hardware/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    workspace_id: user.uid,
                    name, type, description
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success("Device registered successfully!");
                setNewToken({ id: data.device.id, token: data.device.token });
                setName('');
                setDescription('');
                fetchData();
            } else {
                toast.error("Failed to register device");
            }
        } catch (error) {
            toast.error("Registration error");
        } finally {
            setRegistering(false);
        }
    };

    const copyToken = (token: string) => {
        navigator.clipboard.writeText(token);
        toast.success("Auth Token copied to clipboard!");
    };

    const isOnline = (lastPing: number) => {
        // Consider offline if ping is older than 5 minutes (300000ms)
        if (!lastPing) return false;
        return (Date.now() - lastPing) < 300000;
    };

    if (loading && devices.length === 0) return <div className="p-8 text-center text-gray-500 animate-pulse">Scanning Hardware Bus...</div>;

    const onlineCount = devices.filter(d => isOnline(d.lastPing)).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="mb-6 flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-white">
                        <Cpu className="text-cyan-400" size={24} /> Hardware Bridge
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Connect physical IoT devices, sensors, and actuators to your Quantify agents.</p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-white/10 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-cyan-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-xs font-medium text-gray-300">{onlineCount} Devices Connected</span>
                </div>
            </header>

            {newToken && (
                <div className="bg-gradient-to-br from-cyan-900/30 to-black border border-cyan-500/50 p-6 rounded-2xl animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl">
                            <Server size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Device Secret Generated</h3>
                            <p className="text-xs text-cyan-400/80">You must copy this token now. It will not be shown again.</p>
                        </div>
                    </div>

                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex items-center justify-between font-mono text-sm mb-4">
                        <span className="text-gray-300 truncate max-w-[80%]">{newToken.token}</span>
                        <button onClick={() => copyToken(newToken.token)} className="text-gray-500 hover:text-white transition-colors">
                            <Copy size={16} />
                        </button>
                    </div>

                    <div className="text-xs text-gray-400">
                        <p>Webhook URL: <code className="bg-white/5 px-1 py-0.5 rounded text-gray-300">POST /api/hardware/webhook/{newToken.id}</code></p>
                        <p className="mt-1">Auth Header: <code className="bg-white/5 px-1 py-0.5 rounded text-gray-300">Authorization: Bearer &lt;Token&gt;</code></p>
                    </div>

                    <button
                        onClick={() => setNewToken(null)}
                        className="mt-6 text-xs text-cyan-400 font-semibold hover:text-cyan-300"
                    >
                        I have copied to secure storage.
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Connected Devices Data Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-2">
                        <Radio size={16} /> Provisioned Hardware
                    </h3>

                    {devices.length === 0 ? (
                        <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-gray-500 bg-[#141414]">
                            <Plug size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No hardware linked to this workspace.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {devices.map(device => {
                                const online = isOnline(device.last_ping);
                                return (
                                    <div key={device.id} className="bg-[#141414] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-semibold text-white tracking-tight">{device.name}</h4>
                                                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-widest ${online ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
                                                    {online ? <SignalHigh size={10} /> : <Signal size={10} />}
                                                    {online ? 'Online' : 'Offline'}
                                                </span>
                                            </div>

                                            <div className="flex gap-2 mb-4">
                                                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded uppercase tracking-wider">{device.type}</span>
                                            </div>

                                            <p className="text-xs text-gray-500 font-mono mb-4">ID: {device.id}</p>
                                        </div>

                                        <div className="pt-3 border-t border-white/5 flex flex-col gap-1">
                                            <div className="text-[10px] text-gray-500 flex justify-between">
                                                <span>Last Ping:</span>
                                                <span className={online ? 'text-cyan-400/80' : ''}>
                                                    {device.last_ping ? new Date(device.last_ping).toLocaleTimeString() : 'Never'}
                                                </span>
                                            </div>
                                            {device.telemetry && Object.keys(device.telemetry).length > 0 && (
                                                <div className="text-[10px] text-gray-500 flex justify-between mt-1">
                                                    <span>Data Packets:</span>
                                                    <span className="font-mono text-gray-300 bg-white/5 px-1 py-0.5 rounded">
                                                        {JSON.stringify(device.telemetry).substring(0, 20)}...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Registration Form */}
                <div className="lg:col-span-1">
                    <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl sticky top-24">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <Plus size={18} className="text-cyan-400" /> Register Token
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                            Generate a secure webhook bridge for a dedicated physical device on your local network.
                        </p>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Device Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Factory Thermal Sensor A"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Device Class</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                >
                                    <option value="sensor">Telemetry Sensor (Read-only)</option>
                                    <option value="actuator">Actuator (Write-only)</option>
                                    <option value="hybrid">Hybrid Transceiver</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Hardware Specs / Note</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional metadata..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={registering || !name.trim()}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all mt-6"
                            >
                                {registering ? 'Securing Link...' : 'Generate Target Secret'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
