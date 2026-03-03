'use client';

import { Database, HardDrive, RefreshCw, Clock, Shield, CheckCircle2 } from 'lucide-react';

export default function BackupsSection() {
    const backupLogs = [
        { type: "Full System Snapshot", date: "Today, 04:00 AM", size: "14.2 GB", status: "Verified" },
        { type: "Vector Database Bloom", date: "Yesterday, 11:00 PM", size: "1.2 GB", status: "Verified" },
        { type: "Hardware Telemetry Logs", date: "Yesterday, 06:00 PM", size: "842 MB", status: "Verified" }
    ];

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Database className="text-blue-400" size={24} />
                        Oracle Storage & Backups
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">Resilient Redundancy • Oracle Cloud EAD-1</p>
                </div>
                <button className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all">
                    Initiate Snapshot
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3">
                        <HardDrive className="text-blue-400" size={20} />
                        <h3 className="text-white font-bold">Redundancy Strategy</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-zinc-400">Off-site Replication</span>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Active</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-zinc-400">Retention Policy</span>
                            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">30 Days Sliding</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm text-zinc-400">Cold Storage (LTO-9)</span>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Disabled</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex flex-col justify-center text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <RefreshCw size={28} className="animate-spin-slow" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Next Automated Pulse</h3>
                        <p className="text-zinc-500 text-xs mt-1">Scheduled for 04:00 AM UTC (In 6 hours)</p>
                    </div>
                    <div className="pt-2">
                        <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">Modify Schedule</button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
                    <Clock size={14} className="text-zinc-400" /> Snapshot History
                </h3>
                <div className="bg-[#111113] border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Node</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Size</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backupLogs.map((log, i) => (
                                <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4 text-sm font-bold text-white">{log.type}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-zinc-500">{log.date}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-zinc-400 text-right">{log.size}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            <CheckCircle2 size={10} /> {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
