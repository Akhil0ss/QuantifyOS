'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { redirect } from 'next/navigation';

import DashboardHome from '@/components/dashboard/DashboardHome';
import OperationsCenter from '@/components/dashboard/OperationsCenter';
import ConnectionsHub from '@/components/dashboard/ConnectionsHub';
import EvolutionHub from '@/components/dashboard/EvolutionHub';
import MarketplaceSection from '@/components/dashboard/MarketplaceSection';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BusinessSection from '@/components/dashboard/BusinessSection';
import MemorySection from '@/components/dashboard/MemorySection';
import WalletSection from '@/components/dashboard/WalletSection';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import BillingSection from '@/components/dashboard/BillingSection';
import BackupsSection from '@/components/dashboard/BackupsSection';
import SecuritySection from '@/components/dashboard/SecuritySection';
import SovereignIntelligence from '@/components/dashboard/SovereignIntelligence';

import {
    LayoutDashboard, Activity, Link2, Sparkles, Store,
    Settings, User as UserIcon, ShieldCheck, LogOut, MessageSquare,
    BrainCircuit, Briefcase, Wallet, CreditCard, HardDrive, Database
} from 'lucide-react';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'blue' },
    { id: 'operations', label: 'Operations', icon: Activity, color: 'blue' },
    { id: 'intelligence', label: 'Intelligence', icon: BrainCircuit, color: 'fuchsia' },
    { id: 'connections', label: 'Connections', icon: Link2, color: 'cyan' },
    { id: 'evolution', label: 'Evolution', icon: Sparkles, color: 'fuchsia' },
    { id: 'marketplace', label: 'Marketplace', icon: Store, color: 'orange' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'zinc' },
];

const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: 'UserIcon' },
    { id: 'business', label: 'Business', icon: 'Briefcase' },
    { id: 'memory', label: 'Memory', icon: 'Database' },
    { id: 'wallet', label: 'Wallet', icon: 'Wallet' },
    { id: 'billing', label: 'Billing', icon: 'CreditCard' },
    { id: 'backups', label: 'Backups', icon: 'HardDrive' },
    { id: 'security', label: 'Security', icon: 'ShieldCheck' },
];

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settingsTab, setSettingsTab] = useState('profile');

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                <span className="text-zinc-500 text-sm">Initializing Quantify OS...</span>
            </div>
        </div>
    );

    if (!user) {
        redirect('/login');
        return null;
    }

    const activeColor = (id: string) => {
        const item = navItems.find(n => n.id === id);
        if (!item) return '';
        const map: Record<string, string> = {
            blue: 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5',
            cyan: 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5',
            fuchsia: 'bg-gradient-to-r from-fuchsia-600/20 to-purple-600/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-lg shadow-fuchsia-500/5',
            orange: 'bg-gradient-to-r from-orange-600/20 to-amber-600/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/5',
            zinc: 'bg-white/10 text-white border border-white/10 shadow-lg shadow-white/5',
        };
        return map[item.color] || '';
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-60 bg-[#111113] border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="px-6 py-6">
                    <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
                        Quantify OS
                    </h2>
                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest mt-0.5">V1.0 Stable</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${isActive
                                    ? activeColor(item.id)
                                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                                    }`}
                            >
                                <Icon size={17} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom — Profile + Logout inline */}
                <div className="px-3 pb-4 border-t border-white/5 pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setActiveTab('settings'); setSettingsTab('profile'); }}
                            className="flex flex-1 items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                        >
                            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                                <UserIcon size={12} className="text-blue-400" />
                            </div>
                            <span className="font-medium truncate">{user.displayName || 'Profile'}</span>
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center justify-center p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                            title="Sign Out"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>

                    {user?.email === "test@example.com" && (
                        <button
                            onClick={() => window.location.href = '/admin'}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20 transition-all uppercase tracking-widest"
                        >
                            <ShieldCheck size={14} /> Owner Panel
                        </button>
                    )}

                    {/* Beta Feedback */}
                    <button
                        onClick={() => window.open('mailto:feedback@quantifyos.com?subject=Quantify%20OS%20Beta%20Feedback', '_blank')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10 transition-all uppercase tracking-widest"
                    >
                        <MessageSquare size={12} /> Send Feedback
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-60 flex-1 p-8 min-h-screen">
                {/* Notification Bell — fixed top right */}
                <div className="fixed top-4 right-6 z-40">
                    <NotificationCenter />
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DashboardHome />
                        </motion.div>
                    )}

                    {activeTab === 'operations' && (
                        <motion.div
                            key="operations"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <OperationsCenter />
                        </motion.div>
                    )}

                    {activeTab === 'intelligence' && (
                        <motion.div
                            key="intelligence"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SovereignIntelligence />
                        </motion.div>
                    )}

                    {activeTab === 'connections' && (
                        <motion.div
                            key="connections"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ConnectionsHub />
                        </motion.div>
                    )}

                    {activeTab === 'evolution' && (
                        <motion.div
                            key="evolution"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <EvolutionHub />
                        </motion.div>
                    )}

                    {activeTab === 'marketplace' && (
                        <motion.div
                            key="marketplace"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MarketplaceSection />
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="space-y-6 max-w-5xl">
                                <div>
                                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Settings className="text-zinc-400" size={24} /> Settings
                                    </h1>
                                    <p className="text-zinc-500 text-sm mt-1">Profile, AI config, billing, security, backups, and all OS preferences</p>
                                </div>

                                <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#141414] rounded-xl border border-white/5">
                                    {settingsTabs.map((tab) => {
                                        const iconMap: Record<string, any> = {
                                            UserIcon, Briefcase, Database, Wallet, CreditCard, HardDrive, ShieldCheck
                                        };
                                        const TabIcon = iconMap[tab.icon];
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setSettingsTab(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${settingsTab === tab.id
                                                    ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {TabIcon && <TabIcon size={14} />}
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={settingsTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="min-h-[400px]"
                                    >
                                        {settingsTab === 'profile' && <ProfileSection />}
                                        {settingsTab === 'business' && <BusinessSection />}
                                        {settingsTab === 'memory' && <MemorySection />}
                                        {settingsTab === 'wallet' && <WalletSection />}
                                        {settingsTab === 'billing' && <BillingSection />}
                                        {settingsTab === 'backups' && <BackupsSection />}
                                        {settingsTab === 'security' && <SecuritySection />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
