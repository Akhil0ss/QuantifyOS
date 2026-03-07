'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ShieldAlert, Send, X, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function CredentialRequestModal() {
    const { user } = useAuth();
    const [request, setRequest] = useState<any>(null);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const requestsRef = ref(db, `api_requests/${user.uid}`);
        const unsubscribe = onValue(requestsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Find the first pending request
                const pendingId = Object.keys(data).find(id => data[id].status === 'pending');
                if (pendingId) {
                    setRequest({ ...data[pendingId], id: pendingId });
                } else {
                    setRequest(null);
                }
            } else {
                setRequest(null);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleSubmit = async () => {
        if (!apiKey.trim() || !request) return;
        setLoading(true);

        try {
            const requestRef = ref(db, `api_requests/${user?.uid}/${request.id}`);
            await update(requestRef, {
                api_key: apiKey.trim(),
                status: 'completed'
            });
            toast.success(`${request.service} credential applied. Resuming task...`);
            setApiKey('');
            setRequest(null);
        } catch (error) {
            toast.error("Failed to transmit credential.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeny = async () => {
        if (!request) return;
        try {
            const requestRef = ref(db, `api_requests/${user?.uid}/${request.id}`);
            await update(requestRef, { status: 'denied' });
            setRequest(null);
            toast.error("Credential request denied.");
        } catch (error) { }
    };

    if (!request) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                <Key size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Credential Required</h3>
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{request.service} Integration</p>
                            </div>
                            <button
                                onClick={handleDeny}
                                className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
                            <div className="flex gap-3">
                                <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-400 leading-relaxed italic">
                                    "{request.description}"
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
                                    Enter {request.service} API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                        autoFocus
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Key size={14} className="text-zinc-700" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleDeny}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/5 text-xs font-bold text-zinc-500 hover:bg-white/5 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !apiKey.trim()}
                                    className="flex-[2] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Grant Access
                                </button>
                            </div>
                            <p className="text-[9px] text-zinc-600 text-center uppercase tracking-tight">
                                Transmitted securely to your isolated sovereign environment
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
