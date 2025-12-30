import React from 'react';
import { Layout, Video, FileText, Linkedin, Bot, LogOut, ChevronRight, Home } from 'lucide-react';
import { NodeType } from '../types';

interface ToolbarProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    currentCanvasName: string;
    onAddNode: (type: NodeType) => void;
    onLogout: () => void;
    onNavigateToDashboard: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    onToggleSidebar,
    currentCanvasName,
    onAddNode,
    onLogout,
    onNavigateToDashboard,
}) => {
    return (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-1 p-1.5 bg-white/80 backdrop-blur-xl border border-white/40 rounded-full shadow-soft transition-all hover:bg-white/90 hover:scale-[1.01] hover:border-white/60">

                {/* Navigation Section */}
                <div className="flex items-center gap-3 pl-4 pr-2 border-r border-gray-200/50">
                    <button
                        onClick={onNavigateToDashboard}
                        className="p-2 text-gray-400 hover:text-clay-800 hover:bg-clay-100 rounded-lg transition-colors"
                        title="Dashboard"
                    >
                        <Home size={18} />
                    </button>
                    <button
                        onClick={onToggleSidebar}
                        className="group flex items-center gap-2 text-gray-500 hover:text-clay-900 transition-colors"
                        title="Projects"
                    >
                        <Layout size={18} />
                        <span className="text-sm font-medium">Projects</span>
                    </button>

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-0.5">Canvas</span>
                        <div className="flex items-center gap-1 text-gray-700 max-w-[140px]">
                            <span className="text-xs font-semibold truncate">{currentCanvasName || 'Select Canvas'}</span>
                            <ChevronRight size={12} className="opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Tools Section */}
                <div className="flex items-center gap-1 px-1">
                    <ToolbarButton
                        icon={<Video size={18} />}
                        label="Video"
                        colorClass="text-clay-600 hover:bg-clay-100" // Updated to neutral/clay
                        onClick={() => onAddNode(NodeType.VIDEO_SOURCE)}
                    />
                    <ToolbarButton
                        icon={<FileText size={18} />}
                        label="Blog"
                        colorClass="text-clay-600 hover:bg-clay-100"
                        onClick={() => onAddNode(NodeType.BLOG_SOURCE)}
                    />
                    <ToolbarButton
                        icon={<FileText size={18} />}
                        label="File"
                        colorClass="text-clay-600 hover:bg-clay-100"
                        onClick={() => onAddNode(NodeType.FILE_SOURCE)}
                    />
                    <ToolbarButton
                        icon={<Linkedin size={18} />}
                        label="LinkedIn"
                        colorClass="text-clay-600 hover:bg-clay-100"
                        onClick={() => onAddNode(NodeType.LINKEDIN_SOURCE)}
                    />
                </div>

                {/* Separator */}
                <div className="w-px h-8 bg-gray-200/50 mx-1"></div>

                {/* Agent Section */}
                <div className="flex items-center px-1">
                    <button
                        onClick={() => onAddNode(NodeType.LLM_AGENT)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-clay-800 to-clay-900 hover:from-clay-700 hover:to-clay-800 text-white rounded-full transition-all shadow-lg shadow-clay-900/20 hover:shadow-clay-900/40 transform hover:-translate-y-0.5"
                    >
                        <Bot size={18} />
                        <span className="text-sm font-semibold">Agent</span>
                    </button>
                </div>

                {/* Separator */}
                <div className="w-px h-8 bg-gray-200/50 mx-1"></div>

                {/* Logout Section */}
                <div className="pr-1.5 pl-1">
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    colorClass?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, label, onClick, colorClass = "text-gray-500 hover:bg-gray-100" }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 group ${colorClass}`}
    >
        <span className="transition-transform group-hover:scale-110">{icon}</span>
        <span className={`text-sm font-medium ${colorClass.split(' ')[0]}`}>{label}</span>
    </button>
);
