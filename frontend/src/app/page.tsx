"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-100">Quantify OS</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#autonomy" className="hover:text-white transition-colors">Autonomy</a>
            <a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-9 bg-zinc-800 animate-pulse rounded-full" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 text-sm font-semibold transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -top-48 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Version 11 Corrected is Live</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 transition-all">
                The Autonomous <br className="hidden md:block" /> AI Operating System.
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                Quantify OS V11 is the final specification in systemic autonomy.
                Convert complex goals into finished work with a single command.
                Never say no, always build, always deliver.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all shadow-xl shadow-white/10"
                >
                  {user ? "Go to Dashboard" : "Get Started Now"}
                </Link>
                <a
                  href="#features"
                  className="px-8 py-4 rounded-full bg-zinc-900 border border-white/10 text-white font-bold text-lg hover:bg-zinc-800 transition-all"
                >
                  Explore Features
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section id="features" className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/50 transition-all hover:bg-white/[0.05] group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Never Say No</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Our autonomy engine is designed to find a path for every request. If a tool doesn't exist, the system creates it.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/50 transition-all hover:bg-white/[0.05] group">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">User-Owned Memory</h3>
                <p className="text-zinc-500 leading-relaxed">
                  You own your data. Configure local storage, S3, or private cloud. Quantify OS manages the logic, you manage the privacy.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/50 transition-all hover:bg-white/[0.05] group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">WhatsApp Commands</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Send goals directly from your phone. Our persistent web session manager listens and executes commands via Self-WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">Q</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Quantify OS V11</span>
          </div>
          <p className="text-xs text-zinc-600">
            © 2026 Quantify OS. Built for ultimate systemic autonomy.
          </p>
        </div>
      </footer>
    </div>
  );
}
