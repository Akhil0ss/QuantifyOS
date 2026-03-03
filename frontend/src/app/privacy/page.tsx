"use client";

import Link from "next/link";
import { Shield, Lock, Eye, FileText, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                        <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold text-lg">Q</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Quantify OS</span>
                    </div>
                    <div className="w-24" /> {/* Spacer */}
                </div>
            </nav>

            <main className="pt-32 pb-20 max-w-4xl mx-auto px-6">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 font-bold text-[10px] text-indigo-400 uppercase tracking-widest">
                        <Shield size={12} /> Privacy Commitment
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">Privacy Policy</h1>
                    <p className="text-zinc-500 text-sm">Last updated: March 2026</p>
                </div>

                <div className="space-y-12 text-zinc-400 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Eye className="text-indigo-400" size={20} /> Data Sovereignty
                        </h2>
                        <p>
                            Quantify OS is built on the principle of **Digital Sovereignty**. We believe that your data, your intelligence, and your autonomous workflows belong exclusively to you. Unlike traditional SaaS platforms, Quantify OS is designed to operate on infrastructure you control.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Lock className="text-emerald-400" size={20} /> Information Collection
                        </h2>
                        <p>
                            When you use Quantify OS, we collect minimal information necessary to provide our services:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>**Account Information**: Your name and email address used for authentication.</li>
                            <li>**Workspace Configuration**: Metadata about your autonomous swarms and configured providers.</li>
                            <li>**Usage Metrics**: Technical telemetry to ensure system stability and performance.</li>
                        </ul>
                        <p className="mt-4">
                            We **do not** read your private files, your inter-agent communications, or your generated intelligence assets unless explicitly authorized for support purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileText className="text-blue-400" size={20} /> AI Ethics & Shadow Trace
                        </h2>
                        <p>
                            Our "Shadow Trace" system logs all predictive simulations. These logs are stored locally within your workspace or in your private Firebase instance. We do not use your proprietary data or agent logic to train global models.
                        </p>
                    </section>

                    <section className="p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-2">Workspace Isolation</h3>
                        <p className="text-sm">
                            Each workspace is a cryptographically isolated environment. User A cannot see, hear, or influence User B’s autonomous agents. This isolation is maintained even during swarm load-balancing operations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Your Rights</h2>
                        <p>
                            You have the right to export all your data, delete your account, and terminate all autonomous processes at any time via the **Global Kill Switch**.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">Q</span>
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-white">Quantify OS S-Tier</span>
                    </div>
                    <p className="text-xs text-zinc-600">
                        © 2026 Quantify OS. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
