import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ShieldCheck, Activity, Search, Code, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

const API = ''; // Relative paths — Next.js rewrites proxy to backend

export default function ShadowTrace() {
    const { user } = useAuth();
    const [scans, setScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScans = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${API}/api/capabilities/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const caps = Object.values(data.capabilities || {});

                    // Transform real capabilities into scan format
                    const recentCaps = caps.slice(-4).map((cap: any) => ({
                        type: cap.status.toUpperCase(),
                        label: cap.name.replace(/_/g, ' '),
                        detail: cap.description,
                        status: cap.status === 'working' ? 'success' : (cap.status === 'testing' ? 'active' : 'pending'),
                        icon: cap.status === 'working' ? <ShieldCheck size={14} /> : <Activity size={14} />
                    }));

                    setScans(recentCaps.length > 0 ? recentCaps : [
                        { type: "IDLE", label: "No Active Scans", detail: "System in monitoring mode", status: "pending", icon: <Terminal size={14} /> }
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch shadow traces:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScans();
        const interval = setInterval(fetchScans, 60000);
        return () => clearInterval(interval);
    }, [user]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 overflow-hidden relative min-h-[400px]">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Terminal size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-zinc-200 tracking-tight">Shadow Execution Trace</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Live Predictive Governance</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Engine</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <AnimatePresence>
                    {scans.map((scan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 group"
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${scan.status === 'active' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' :
                                scan.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' :
                                    'bg-zinc-500/10 border-white/5 text-zinc-500'
                                }`}>
                                {scan.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-300 tracking-tight truncate block">{scan.label}</span>
                                    {scan.status === 'success' && <CheckCircle2 size={10} className="text-emerald-400" />}
                                </div>
                                <p className="text-[10px] text-zinc-600 font-medium truncate">{scan.detail}</p>
                            </div>
                            <div className="h-1 px-4 bg-white/5 rounded-full overflow-hidden w-16 invisible sm:visible">
                                <motion.div
                                    className={`h-full ${scan.status === 'active' ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: scan.status === 'pending' ? '30%' : '100%' }}
                                    transition={{ duration: 1.5, repeat: scan.status === 'active' ? Infinity : 0 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
