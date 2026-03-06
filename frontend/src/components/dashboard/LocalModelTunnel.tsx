'use client';

import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { ref, onChildAdded, update, get } from 'firebase/database';

export default function LocalModelTunnel() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const requestsRef = ref(db, `tunnels/${user.uid}/requests`);

        // Listen for new requests
        const unsubscribe = onChildAdded(requestsRef, async (snapshot) => {
            const reqId = snapshot.key;
            const data = snapshot.val();

            if (!reqId || data?.status !== 'pending') return;

            // Immediately mark as processing so other tabs don't grab it
            try {
                // Check if still pending before atomic-ish update
                const currentData = (await get(ref(db, `tunnels/${user.uid}/requests/${reqId}`))).val();
                if (currentData?.status !== 'pending') return;

                await update(ref(db, `tunnels/${user.uid}/requests/${reqId}`), {
                    status: 'processing'
                });

                // Execute the actual request locally
                console.log(`[Zero-Config Tunnel] Relaying ${data.method || 'POST'} request to ${data.url}`);

                const fetchOptions: RequestInit = {
                    method: data.method || 'POST',
                    headers: { 'Content-Type': 'application/json' },
                };

                if ((data.method || 'POST') !== 'GET' && data.payload) {
                    fetchOptions.body = JSON.stringify(data.payload);
                }

                const response = await fetch(data.url, fetchOptions);

                if (!response.ok) {
                    throw new Error(`Local model returned HTTP ${response.status}`);
                }

                const resData = await response.json();
                const responseText = resData?.message?.content || JSON.stringify(resData);

                // Send response back
                await update(ref(db, `tunnels/${user.uid}/requests/${reqId}`), {
                    status: 'completed',
                    response: responseText
                });
                console.log(`[Zero-Config Tunnel] Request completed successfully`);

            } catch (err: any) {
                console.error('[Zero-Config Tunnel] Request failed:', err);
                await update(ref(db, `tunnels/${user.uid}/requests/${reqId}`), {
                    status: 'error',
                    error: err.message || 'Failed to connect to local model. Ensure Ollama/LMStudio is running and CORS allows the web app.'
                });
            }
        });

        return () => {
            // firebase/database doesn't return an unsubscribe function for onChildAdded directly the traditional way 
            // but we can use off() if needed. In modern modular SDK, it does return an unsubscribe function!
            unsubscribe();
        };
    }, [user]);

    // Hidden global component
    return null;
}
