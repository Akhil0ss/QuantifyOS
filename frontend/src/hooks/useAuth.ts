'use client';

import { useState, useCallback, useEffect } from 'react';

export const useAuth = () => {
    const [user, setUser] = useState<{
        uid: string;
        displayName: string;
        email: string;
        isAdmin: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate auth check
        setTimeout(() => {
            setUser({
                uid: 'dev_user_01',
                displayName: 'Quantify Sovereign',
                email: 'test@example.com', // This email currently triggers Admin UI in page.tsx
                isAdmin: true // Adding explicit flag for future-proofing
            });
            setLoading(false);
        }, 500);
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        setTimeout(() => {
            setUser(null);
            setLoading(false);
        }, 300);
    }, []);

    return { user, loading, logout };
};
