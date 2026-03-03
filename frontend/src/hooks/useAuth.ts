'use client';

import { useState, useCallback, useEffect } from 'react';
import { auth, db, googleProvider, githubProvider } from '../lib/firebase';
import { onAuthStateChanged, signOut, signInWithPopup, signInWithEmailAndPassword, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export const useAuth = () => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
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
            } catch (error) {
                console.error("Auth metadata sync error:", error);
                // Fallback to basic auth user if DB fails
                if (firebaseUser) {
                    setUser({
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName || 'Beta User',
                        email: firebaseUser.email,
                        isAdmin: firebaseUser.email === 'test@example.com',
                        plan: 'free',
                        getIdToken: () => firebaseUser.getIdToken()
                    });
                } else {
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = useCallback(async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Google sign-in error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const signInWithGithub = useCallback(async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, githubProvider);
        } catch (error) {
            console.error("Github sign-in error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Email sign-in error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        await signOut(auth);
        setLoading(false);
    }, []);

    return { user, loading, logout, signInWithGoogle, signInWithGithub, signInWithEmail };
};
