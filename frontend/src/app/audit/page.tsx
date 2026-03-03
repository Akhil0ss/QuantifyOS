"use client";

import { motion } from "framer-motion";
import { ClipboardCheck, ShieldCheck, Search, Activity, ArrowLeft, BarChart3, AlertTriangle, Fingerprint } from "lucide-react";
import Link from "next/link";

export default function AuditPage() {
    const auditLogs = [
        { date: "2026.03.01", event: "L15 Kernel Certification", status: "PASSED", score: "99.8%" },
        { date: "2026.02.28", event: "Self-Healing Stress Test", status: "VERIFIED", score: "100%" },
        { date: "2026.02.15", event: "Swarm Consensus Audit", status: "PASSED", score: "94.2%" },
        { date: "2026.02.10", event: "Memory Leak Perimeter Guard", status: "SECURE", score: "0.00ms" }
    ];

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-300 font-sans p-6 md:p-12 overflow-x-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_100%_100%,#4f46e508,transparent_50%)] pointer-events-none" />

            <header className="max-w-5xl mx-auto mb-20 relative z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft size={14} /> Back to Interface
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <ClipboardCheck size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter">Transparency <span className="text-emerald-500">& Audit.</span></h1>
                            <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Sovereign Integrity Report v15.4</p>
                        </div>
                    </div>
                    <div className="hidden lg:block">
                        <div className="flex gap-10">
                            <div className="text-center">
                                <div className="text-2xl font-black text-white">99.98%</div>
                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Safety Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-emerald-500">A+</div>
                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Risk Rating</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto space-y-12 relative z-10">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-3xl bg-[#080808] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck size={120} />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-indigo-500" />
                            Security Posture
                        </h3>
                        <p className="text-sm text-zinc-500 leading-relaxed font-medium mb-8">
                            Our infrastructure is audited in real-time by the Sovereign Intelligence Engine. Any deviation from prescribed safety benchmarks triggers an immediate workspace lockdown.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                                <span className="text-zinc-600">Model Routing Sanitization</span>
                                <span className="text-emerald-500">Verified</span>
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                                <span className="text-zinc-600">Wallet Transaction Guard</span>
                                <span className="text-emerald-500">Active</span>
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-zinc-600">Encrypted Trace Hashing</span>
                                <span className="text-emerald-500">Live</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-8 rounded-3xl bg-[#080808] border border-white/5 relative overflow-hidden group">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <BarChart3 size={16} className="text-blue-500" />
                            Performance Integrity
                        </h3>
                        <p className="text-sm text-zinc-500 leading-relaxed font-medium mb-8">
                            Systemic health metrics are visualized through cryptographically signed telemetry. We maintain 100% data fidelity across the evolution loop.
                        </p>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                                    <span>Evolution Accuracy</span>
                                    <span>98.4%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "98.4%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                                    <span>Healing Success Rate</span>
                                    <span>100%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Audit History Table */}
                <section className="space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Search size={16} className="text-zinc-500" />
                        Historical Verification Logs
                    </h3>
                    <div className="rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left font-bold text-[10px]">
                            <thead>
                                <tr className="bg-white/5 text-zinc-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">Protocol Event</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Confidence Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-zinc-400">
                                {auditLogs.map((log, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-zinc-600 font-mono">{log.date}</td>
                                        <td className="p-4 uppercase tracking-widest">{log.event}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-zinc-500">{log.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Real-time Ticker Simulation */}
                <div className="p-4 rounded-xl bg-indigo-600/5 border border-indigo-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity size={14} className="text-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Trace Monitoring</span>
                        <span className="text-[9px] font-mono text-zinc-700">|</span>
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">Verifying_0x554A... OK</span>
                    </div>
                    <Fingerprint className="text-zinc-800" size={16} />
                </div>
            </main>

            <footer className="max-w-5xl mx-auto mt-32 py-12 border-t border-white/5 text-center flex flex-col items-center gap-4">
                <AlertTriangle size={24} className="text-amber-500 opacity-40" />
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.4em]">Audit records are immutable and cryptographically bound to the v15 seed.</p>
            </footer>
        </div>
    );
}
