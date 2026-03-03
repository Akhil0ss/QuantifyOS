"use client";

import { Shield, Lock, Database, Globe, ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#020202] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-32">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#020202]/50 to-[#020202] pointer-events-none" />

            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-black/40 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <ArrowLeft size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Return to Interface</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Shield className="text-indigo-500" size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Sovereign Privacy Protocol v1.0</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 pt-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <header className="space-y-4">
                        <h1 className="text-5xl font-black text-white tracking-tighter">Your Intelligence. <br /><span className="text-indigo-500">Your Sovereignty.</span></h1>
                        <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                            Quantify OS is built on the principle of Digital Sovereignty. Unlike traditional SaaS platforms, we do not monetize your data or "learn" from your proprietary intelligence without your explicit consent.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                            <Database className="text-indigo-400" size={24} />
                            <h3 className="text-lg font-black text-white">Data Isolation</h3>
                            <p className="text-sm leading-relaxed text-zinc-400">
                                Your workspace data, memory layers (Semantic, Procedural, Episodic), and evolved tools are stored in **user-configured storage** (Local, S3, or Private Firestore). They are physically isolated from other users.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                            <Globe className="text-emerald-400" size={24} />
                            <h3 className="text-lg font-black text-white">Global Cloud vs Local</h3>
                            <p className="text-sm leading-relaxed text-zinc-400">
                                The Global SaaS layer (Firebase) is used exclusively for platform orchestration, billing, and basic configuration pointers. Your agents' actual "thought processes" happen either locally on your hardware or within your private web sessions.
                            </p>
                        </div>
                    </div>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <Terminal size={20} className="text-indigo-500" />
                            Core Privacy Principles
                        </h2>
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h4 className="font-bold text-white uppercase text-xs tracking-widest">1. Intelligence Ownership</h4>
                                <p className="text-zinc-500 leading-relaxed">
                                    Every strategy learned by the Evolution Engine in your workspace belongs to you. We do not aggregate these models to train global models unless you explicitly opt-in to the "Global Knowledge Grid."
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-white uppercase text-xs tracking-widest">2. Kill-Switch Authority</h4>
                                <p className="text-zinc-500 leading-relaxed">
                                    You retain the ultimate authority to halt all autonomous processes. Our Kill-Switch protocols are hardware-level in our infrastructure and software-level in your client, ensuring no agent remains active without your direct supervision if requested.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-white uppercase text-xs tracking-widest">3. Encryption & Transit</h4>
                                <p className="text-zinc-500 leading-relaxed">
                                    All communications between your client and the backend engines are encrypted with industry-standard TLS. API keys for third-party providers (OpenAI, Anthropic, etc.) are encrypted at rest and only used to sign requests within your isolated process.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-6">
                        <Lock className="text-indigo-400 shrink-0" size={32} />
                        <div>
                            <p className="text-zinc-300 font-bold text-sm">Need a Private Instance?</p>
                            <p className="text-xs text-zinc-500 mt-1">If your compliance requires 100% air-gapped deployment, contact our Enterprise team for Sovereign Hardened Hardware options.</p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
