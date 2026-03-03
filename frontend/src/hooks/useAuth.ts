'use client';

import { useState, useCallback, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export const useAuth = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch additional user data (like isAdmin) from RTDB
                const userRef = ref(db, `users/${firebaseUser.uid}`);
                const snapshot = await get(userRef);
                const userData = snapshot.val() || {};

                setUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName || userData.name || 'Beta User',
                    email: firebaseUser.email,
                    isAdmin: userData.plan === 'admin' || firebaseUser.email === 'test@example.com',
                    plan: userData.plan || 'free',
                    getIdToken: () => firebaseUser.getIdToken()
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        await signOut(auth);
        setLoading(false);
    }, []);

    return { user, loading, logout };
};
