'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Smartphone, QrCode, Loader2, CheckCircle2, AlertCircle, XCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');

export default function WhatsAppBridge() {
    const { user } = useAuth();
    const [status, setStatus] = useState<'disconnected' | 'starting' | 'qr_ready' | 'connected'>('disconnected');
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [sending, setSending] = useState(false);

    const workspaceId = user ? `default-${user.uid}` : '';

    const checkStatus = useCallback(async () => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/whatsapp/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                if (data.status === 'connected') {
                    setStatus('connected');
                    setQrCodeUrl(null);
                } else if (data.is_running && status !== 'connected') {
                    // Try to fetch QR
                    fetchQrCode();
                } else {
                    setStatus('disconnected');
                }
            }
        } catch (error) {
            console.error('Failed to get WhatsApp status:', error);
        } finally {
            setLoading(false);
        }
    }, [user, workspaceId, status]);

    const fetchQrCode = async () => {
        if (!user || !workspaceId) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/whatsapp/qr`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setQrCodeUrl(url);
                setStatus('qr_ready');
                toast.success('QR Code Ready - Scan with WhatsApp');
            } else if (res.status === 404) {
                setStatus('starting');
            } else if (res.status === 400) {
                // Not running
                setStatus('disconnected');
            }
        } catch (error) {
            console.error('Failed to fetch QR:', error);
        }
    };

    useEffect(() => {
        checkStatus();

        let interval: any;
        if (status === 'starting' || status === 'qr_ready') {
            interval = setInterval(checkStatus, 3000);
        } else {
            interval = setInterval(checkStatus, 10000);
        }

        return () => clearInterval(interval);
    }, [checkStatus, status]);

    const handleStart = async () => {
        if (!user || !workspaceId) return;
        setStatus('starting');
        toast.loading('Initializing secure bridge...', { id: 'wa-start' });
        try {
            const token = await user.getIdToken();
            await fetch(`${API}/api/workspaces/${workspaceId}/whatsapp/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Session starting, generating QR code...', { id: 'wa-start' });
        } catch (error) {
            console.error('Failed to start WhatsApp:', error);
            setStatus('disconnected');
            toast.error('Failed to initialize bridge', { id: 'wa-start' });
        }
    };

    const handleStop = async () => {
        if (!user || !workspaceId) return;
        toast.loading('Terminating bridge...', { id: 'wa-stop' });
        try {
            const token = await user.getIdToken();
            await fetch(`${API}/api/workspaces/${workspaceId}/whatsapp/stop`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStatus('disconnected');
            setQrCodeUrl(null);
            toast.success('Bridge terminated', { id: 'wa-stop' });
        } catch (error) {
            console.error('Failed to stop WhatsApp:', error);
            toast.error('Error stopping bridge', { id: 'wa-stop' });
        }
    };

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !workspaceId || !testPhone || !testMessage) return;
        setSending(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API}/api/workspaces/${workspaceId}/whatsapp/message`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ to: testPhone, message: testMessage })
            });

            if (res.ok) {
                toast.success('Message sent successfully!');
                setTestMessage('');
            } else {
                toast.error('Failed to send message. Make sure the chat exists.');
            }
        } catch (error) {
            console.error('Failed to send:', error);
            toast.error('An error occurred');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
    }

    return (
        <div className="bg-[#141414] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">WhatsApp CEO Bridge</h2>
                        <p className="text-sm text-gray-500">Enable bidirectional notifications and remote command execution</p>
                    </div>
                </div>

                {status === 'connected' && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Linked</span>
                    </div>
                )}
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {status === 'disconnected' && (
                        <motion.div
                            key="disconnected"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-center py-8"
                        >
                            <QrCode size={48} className="text-gray-600 mx-auto mb-4" />
                            <h3 className="text-white font-semibold mb-2">Device Not Linked</h3>
                            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">Link your WhatsApp to allow the Autonomous CEO to send you alerts, ask for permissions, and receive your commands remotely.</p>
                            <button
                                onClick={handleStart}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                            >
                                Generate Secure QR Code
                            </button>
                        </motion.div>
                    )}

                    {status === 'starting' && (
                        <motion.div
                            key="starting"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-white font-semibold mb-1">Initializing Encryption Layer...</h3>
                            <p className="text-gray-500 text-sm">Stand by while the node spins up your secure session.</p>
                        </motion.div>
                    )}

                    {status === 'qr_ready' && qrCodeUrl && (
                        <motion.div
                            key="qr_ready"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center py-4"
                        >
                            <div className="bg-white p-4 rounded-xl mb-6">
                                {/* Next Image component doesn't work well with blob URLs, using standard img */}
                                <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                            </div>
                            <h3 className="text-white font-semibold mb-1">Scan to Link</h3>
                            <p className="text-gray-400 text-sm mb-6">Open WhatsApp on your phone {"->"} Linked Devices {"->"} Link a Device</p>
                            <button
                                onClick={handleStop}
                                className="text-gray-500 hover:text-white text-sm flex items-center gap-1 transition-colors"
                            >
                                <XCircle size={16} /> Cancel Session
                            </button>
                        </motion.div>
                    )}

                    {status === 'connected' && (
                        <motion.div
                            key="connected"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        >
                            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 mb-6 flex items-start gap-4">
                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-emerald-400 font-semibold mb-1">Bi-Directional Comm Link Online</h4>
                                    <p className="text-sm text-gray-400">The Autonomous CEO will now forward high-risk execution approvals, process completed alerts, and accept direct inbound text commands.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSendTest} className="space-y-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                <h4 className="text-sm font-semibold text-gray-300">Test Connection</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Contact Name or Number</label>
                                        <input
                                            type="text"
                                            value={testPhone}
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="e.g. John Doe"
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Message</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={testMessage}
                                                onChange={(e) => setTestMessage(e.target.value)}
                                                placeholder="Hello from CEO"
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={sending}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
                                            >
                                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-6 text-right">
                                <button
                                    onClick={handleStop}
                                    className="text-rose-500 hover:bg-rose-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Disconnect Device
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
