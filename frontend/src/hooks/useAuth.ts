'use client';

export const useAuth = () => {
    // Basic mock for build compatibility
    return {
        user: {
            uid: 'dev_user',
            displayName: 'Quantify User',
            email: 'test@example.com'
        },
        loading: false,
        logout: async () => console.log('Mock Logout')
    };
};
