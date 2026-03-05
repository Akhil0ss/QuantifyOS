'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { HardDrive, Download, RotateCcw, Trash2, Plus, Loader2, Archive, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Backup {
    id: string;
    workspace_id: string;
    created_at: string;
    size_bytes: number;
    file_count: number;
}

export default function BackupsSection() {
    const { user } = useAuth();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);

    const fetchBackups = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/backups/list`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setBackups(await res.json());
        } catch { } finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchBackups(); }, [fetchBackups]);

    const createBackup = async () => {
        if (!user) return;
        setCreating(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/backups/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                toast.success('Backup created successfully!');
                fetchBackups();
            } else toast.error('Backup failed');
        } catch { toast.error('Error creating backup'); }
        setCreating(false);
    };

    const restoreBackup = async (backupId: string) => {
        if (!user) return;
        if (!confirm('This will overwrite your current workspace. Are you sure?')) return;
        setRestoring(backupId);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/backups/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ backup_id: backupId })
            });
            if (res.ok) toast.success('Workspace restored!');
            else toast.error('Restore failed');
        } catch { toast.error('Error'); }
        setRestoring(null);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <HardDrive size={18} className="text-cyan-400" /> Workspace Backups
                    </h3>
                    <p className="text-sm text-zinc-500">Create and restore workspace snapshots. Max 5 backups per workspace.</p>
                </div>
                <button
                    onClick={createBackup}
                    disabled={creating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-all border border-cyan-500/20 text-sm font-medium"
                >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Create Backup
                </button>
            </div>

            {backups.length === 0 ? (
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-12 text-center">
                    <Archive size={32} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No backups yet. Create your first backup to protect your workspace data.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {backups.map((b, i) => (
                        <motion.div
                            key={b.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-[#141414] border border-white/5 rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                <Archive size={18} className="text-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{b.id}</p>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(b.created_at).toLocaleString()}</span>
                                    <span>{formatSize(b.size_bytes)}</span>
                                    <span>{b.file_count} files</span>
                                </div>
                            </div>
                            <button
                                onClick={() => restoreBackup(b.id)}
                                disabled={!!restoring}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/10 transition-all"
                            >
                                {restoring === b.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                Restore
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
