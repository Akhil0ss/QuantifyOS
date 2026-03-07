'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Sparkles, Terminal, Key, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const STEPS = [
    {
        title: 'Welcome to Quantify OS',
        description: 'The world\'s first self-evolving autonomous operating system.',
        icon: Rocket,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
    },
    {
        title: 'Try Your First Command',
        description: 'Type a natural language instruction below and watch the OS execute it autonomously.',
        icon: Terminal,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        hasInput: true,
        placeholder: 'Research the latest AI trends and summarize them',
    },
    {
        title: 'Configure AI Provider',
        description: 'Add your AI provider key. The OS will request missing keys automatically when needed.',
        icon: Key,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        hasKeyInput: true,
    },
];

interface OnboardingWizardProps {
    onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [command, setCommand] = useState('');
    const [apiKey, setApiKey] = useState('');

    const current = STEPS[step];

    const handleNext = async () => {
        if (step === 1 && command.trim()) {
            // Submit the first command
            try {
                const workspaceId = `default-${user?.uid}`;
                const token = await user?.getIdToken();
                await fetch(`/api/workspaces/${workspaceId}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ goal: command }),
                });
                toast.success('First task launched!');
            } catch { }
        }

        if (step === 2 && apiKey.trim()) {
            // Save the API key to workspace config
            try {
                const workspaceId = `default-${user?.uid}`;
                const token = await user?.getIdToken();
                await fetch(`/api/workspaces/${workspaceId}/config`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        key: 'provider_config',
                        value: { provider: 'openai', api_key: apiKey }
                    }),
                });
                toast.success('AI Provider configured!');
            } catch { }
        }

        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
            <div className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Progress */}
                <div className="flex gap-1 p-4 pb-0">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-indigo-500' : 'bg-white/5'}`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8"
                    >
                        <div className={`inline-flex p-3 rounded-2xl ${current.bg} border border-white/5 mb-6`}>
                            <current.icon size={24} className={current.color} />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">{current.title}</h2>
                        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">{current.description}</p>

                        {current.hasInput && (
                            <div className="mb-6">
                                <input
                                    type="text"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    placeholder={current.placeholder}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        )}

                        {current.hasKeyInput && (
                            <div className="mb-6">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">OpenAI / Anthropic API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50"
                                />
                                <p className="text-[10px] text-zinc-600 mt-2">You can skip this — the OS will ask when it needs a key.</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            {step > 0 ? (
                                <button onClick={() => setStep(step - 1)} className="text-xs text-zinc-500 hover:text-white transition-colors">
                                    Back
                                </button>
                            ) : <div />}
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-100 active:scale-95 transition-all"
                            >
                                {step === STEPS.length - 1 ? (
                                    <><Check size={16} /> Launch OS</>
                                ) : (
                                    <><ChevronRight size={16} /> Continue</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
