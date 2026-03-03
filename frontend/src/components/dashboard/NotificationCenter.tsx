'use client';

import { Bell, Zap, AlertCircle, CheckCircle2, Info, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

export default function NotificationCenter() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/notifications/log', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map API log to UI format
                const mapped = data.map((n: any, i: number) => ({
                    id: i,
                    type: n.subject.toLowerCase().includes('welcome') ? 'info' :
                        n.subject.toLowerCase().includes('task') ? 'zap' : 'success',
                    title: n.subject,
                    desc: `Notification sent to ${n.to}. Status: ${n.status}`,
                    time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })).reverse();
                setNotifications(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'zap': return <Zap size={14} className="text-fuchsia-400" />;
            case 'alert': return <AlertCircle size={14} className="text-rose-400" />;
            case 'success': return <CheckCircle2 size={14} className="text-emerald-400" />;
            default: return <Info size={14} className="text-blue-400" />;
        }
    };

    return (
        <div className="w-80 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <header className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Bell size={12} /> Live Pulse
                </h3>
                <button
                    onClick={fetchNotifications}
                    className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300"
                >
                    Refresh
                </button>
            </header>

            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-zinc-600" size={16} />
                    </div>
                ) : notifications.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-8 italic uppercase tracking-widest font-bold">No active pulses</p>
                ) : (
                    notifications.map((n, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={n.id}
                            className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.06] transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{getIcon(n.type)}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate max-w-[140px]">{n.title}</h4>
                                        <span className="text-[9px] font-mono text-zinc-600 shrink-0">{n.time}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{n.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="pt-4 px-1">
                <button className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    Open History <ArrowUpRight size={10} />
                </button>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
