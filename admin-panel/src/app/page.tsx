"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, AlertTriangle, Settings, Users, Activity, Zap, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import MetricsDashboard from "../components/admin/MetricsDashboard";
import SystemControls from "../components/admin/SystemControls";
import UserManagement from "../components/admin/UserManagement";
import MonitoringArea from "../components/admin/MonitoringArea";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchData = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [mRes, cRes, uRes, eRes] = await Promise.all([
                fetch(`${API}/api/admin/metrics`, { headers }),
                fetch(`${API}/api/admin/config`, { headers }),
                fetch(`${API}/api/admin/users`, { headers }),
                fetch(`${API}/api/admin/errors`, { headers })
            ]);

            if (mRes.ok && cRes.ok && uRes.ok && eRes.ok) {
                setMetrics(await mRes.json());
                setConfig(await cRes.json());
                setUsers(await uRes.json());
                setErrors(await eRes.json());
                setAuthorized(true);
            } else if (mRes.status === 403) {
                toast.error("Access Denied: Owner only.");
                router.push("/dashboard");
            }
        } catch (e) {
            console.error("Failed to load admin data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user) router.push("/login");
            else fetchData();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#050505]">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (!authorized) return null;

    const tabs = [
        { id: "overview", label: "Overview", icon: <Activity size={16} /> },
        { id: "monitoring", label: "Monitoring", icon: <Zap size={16} /> },
        { id: "controls", label: "Controls", icon: <Settings size={16} /> },
        { id: "users", label: "Users", icon: <Users size={16} /> },
    ];

    return (
        <div className="min-h-screen bg-[#050505] p-8">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Owner Control Panel</h1>
                            <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 tracking-widest uppercase flex items-center gap-1">
                                <ShieldCheck size={10} /> System Privileged
                            </span>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">Platform-level management & system operations.</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all group"
                    >
                        <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "overview" && <MetricsDashboard metrics={metrics} />}
                        {activeTab === "monitoring" && <MonitoringArea errors={errors} />}
                        {activeTab === "controls" && <SystemControls config={config} onUpdate={fetchData} apiBase={API} user={user} />}
                        {activeTab === "users" && <UserManagement users={users} onUpdate={fetchData} user={user} apiBase={API} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
