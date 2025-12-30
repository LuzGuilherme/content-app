import React from 'react';
import {
    Plus,
    Mic,
    LogOut,
    Layout,
    Settings,
    Zap,
    ArrowRight,
    Sparkles,
    Activity
} from 'lucide-react';

interface DashboardProps {
    onNavigateToCanvas: () => void;
    onNavigateToVoiceLab: () => void;
    onNavigateToPipelines: () => void;
    userEmail: string;
    onLogout: () => void;
}

export function Dashboard({
    onNavigateToCanvas,
    onNavigateToVoiceLab,
    onNavigateToPipelines,
    userEmail,
    onLogout
}: DashboardProps) {
    return (
        <div className="min-h-screen bg-[#FDFDFB] text-clay-900 font-sans selection:bg-gold-300/30 overflow-hidden relative">
            {/* Ambient Background - Subtle Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-gold-200/20 to-transparent blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-purple-200/20 to-transparent blur-[100px] pointer-events-none" />

            {/* Navigation Bar */}
            <nav className="relative z-50 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-xl shadow-gray-900/10">
                            <Layout size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-clay-900">Synclay</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-gray-200/50 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                            <span className="text-xs font-medium text-clay-600 tracking-wide">SYSTEM OPERATIONAL</span>
                        </div>

                        <div className="h-6 w-px bg-gray-200 hidden md:block" />

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-clay-600 hidden sm:block">{userEmail}</span>
                            <button
                                onClick={onLogout}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-clay-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group"
                                title="Sign Out"
                            >
                                <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 py-12 md:py-20">

                {/* Hero Section */}
                <div className="mb-20 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100/50 border border-gold-200 text-gold-700 text-xs font-semibold uppercase tracking-wider mb-6">
                        <Sparkles size={12} className="fill-gold-700" />
                        <span>AI-Powered Workspace</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-clay-900 leading-[1.1]">
                        What will you <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-500 to-amber-600">orchestrate</span> today?
                    </h1>
                    <p className="text-xl text-clay-500 max-w-xl leading-relaxed">
                        Design content pipelines, train voice personas, and deploy intelligent agents in a unified canvas.
                    </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Primary Action - New Canvas (Spans 8 columns) */}
                    <div className="md:col-span-8 group relative rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] overflow-hidden transition-all duration-500 min-h-[320px] flex flex-col justify-between p-10 cursor-pointer" onClick={onNavigateToCanvas}>
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-gold-50/80 to-transparent rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700 ease-out" />

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gold-400 text-white flex items-center justify-center shadow-lg shadow-gold-400/20 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <Plus size={28} />
                            </div>
                            <h3 className="text-3xl font-bold text-clay-900 mb-3 group-hover:text-gold-600 transition-colors">Start a new canvas</h3>
                            <p className="text-clay-500 text-lg max-w-md">Launch a blank infinite workspace to map out your ideas, agents, and data sources.</p>
                        </div>

                        <div className="relative z-10 flex items-center gap-2 text-gold-600 font-semibold mt-8 group-hover:translate-x-2 transition-transform duration-300">
                            <span>Create Canvas</span>
                            <ArrowRight size={20} />
                        </div>
                    </div>

                    {/* Secondary Actions Column (Spans 4 columns) */}
                    <div className="md:col-span-4 flex flex-col gap-6">

                        {/* Pipelines Card */}
                        <div className="flex-1 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] p-8 cursor-pointer group transition-all duration-300" onClick={onNavigateToPipelines}>
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Zap size={24} />
                                </div>
                                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                                    <ArrowRight size={16} className="-rotate-45" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-clay-900 mb-2">Pipelines</h3>
                            <p className="text-clay-500 text-sm">Automate repetitive workflows with templates.</p>
                        </div>

                        {/* Voice Lab Card */}
                        <div className="flex-1 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] p-8 cursor-pointer group transition-all duration-300" onClick={onNavigateToVoiceLab}>
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Mic size={24} />
                                </div>
                                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                                    <ArrowRight size={16} className="-rotate-45" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-clay-900 mb-2">Voice Lab</h3>
                            <p className="text-clay-500 text-sm">Clone and manage AI voice personas.</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Stats */}
                <div className="mt-20 pt-8 border-t border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-6 opacity-70">
                    <div className="flex items-center gap-6 text-sm text-clay-400">
                        <span className="flex items-center gap-2">
                            ACTIVE MODEL: <span className="font-semibold text-clay-600">GEMINI 1.5 PRO</span>
                        </span>
                        <span className="hidden md:inline">|</span>
                        <span className="flex items-center gap-2">
                            VERSION <span className="font-semibold text-clay-600">2.4.0 (BETA)</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-clay-400 hover:text-clay-600 cursor-pointer transition-colors">
                        <Settings size={14} />
                        <span>PREFERENCES</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
