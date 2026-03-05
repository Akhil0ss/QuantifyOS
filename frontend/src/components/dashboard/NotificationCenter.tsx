'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, AlertTriangle, Zap, Mail, X, Send, Loader2 } from 'lucide-react';

interface NotifEntry {
    to: string;
    subject: string;
    status: string;
    timestamp: string;
}

export default function NotificationCenter() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [log, setLog] = useState<NotifEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && user) {
            setLoading(true);
            user.getIdToken().then(token => {
                fetch(`/api/notifications/log`, { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(r => r.json())
                    .then(data => setLog(Array.isArray(data) ? data.reverse().slice(0, 20) : []))
                    .catch(() => setLog([]))
                    .finally(() => setLoading(false));
            });
        }
    }, [open, user]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const sendTest = async () => {
        if (!user) return;
        setSending(true);
        try {
            const token = await user.getIdToken();
            const headers = { 'Authorization': `Bearer ${token}` };
            await fetch(`/api/notifications/test`, { method: 'POST', headers });
            const r = await fetch(`/api/notifications/log`, { headers });
            const data = await r.json();
            setLog(Array.isArray(data) ? data.reverse().slice(0, 20) : []);
        } catch { }
        setSending(false);
    };

    const iconForStatus = (status: string) => {
        if (status === 'sent') return <CheckCircle2 size={12} className="text-emerald-400" />;
        if (status.startsWith('failed')) return <AlertTriangle size={12} className="text-red-400" />;
        return <Mail size={12} className="text-blue-400" />;
    };

    return (
        <div ref={ref} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                title="Notifications"
            >
                <Bell size={18} />
                {log.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-[#141418] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <span className="text-sm font-bold text-white">Notifications</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={sendTest}
                                    disabled={sending}
                                    className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-bold uppercase tracking-wide"
                                >
                                    {sending ? <Loader2 size={10} className="animate-spin" /> : 'Test'}
                                </button>
                                <button onClick={() => setOpen(false)} className="p-1 text-zinc-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-72 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-600" size={20} /></div>
                            ) : log.length === 0 ? (
                                <div className="text-center py-8 text-zinc-600 text-sm">No notifications yet</div>
                            ) : (
                                log.map((n, i) => (
                                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <div className="mt-1">{iconForStatus(n.status)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-zinc-300 truncate">{n.subject}</p>
                                            <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${n.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' :
                                            n.status.startsWith('failed') ? 'bg-red-500/10 text-red-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>{n.status.split(' ')[0]}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
