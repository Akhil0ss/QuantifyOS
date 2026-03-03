'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Github, Mail, Chrome } from 'lucide-react';

export default function LoginPage() {
    const { user, signInWithGoogle, signInWithGithub, signInWithEmail } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#141414] rounded-2xl p-8 border border-white/5 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Quantify OS
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm">Welcome to your autonomous future.</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full h-12 flex items-center justify-center gap-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                        <Chrome size={20} />
                        Sign in with Google
                    </button>

                    <button
                        onClick={signInWithGithub}
                        className="w-full h-12 flex items-center justify-center gap-3 bg-[#24292e] rounded-lg font-medium hover:bg-[#2c3238] transition-colors border border-white/10"
                    >
                        <Github size={20} />
                        Sign in with GitHub
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#141414] px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="email"
                            placeholder="Email address"
                            className="w-full h-12 px-4 bg-transparent rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full h-12 px-4 bg-transparent rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            onClick={() => signInWithEmail(email, password)}
                            className="w-full h-12 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Mail size={18} />
                            Continue with Email
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-500">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
}
