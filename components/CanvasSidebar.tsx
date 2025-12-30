import React, { useState } from 'react';
import { CanvasMetadata } from '../types';

interface CanvasSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    canvases: CanvasMetadata[];
    currentCanvasId: string | null;
    onSelectCanvas: (id: string) => void;
    onCreateCanvas: (name: string) => void;
    onDeleteCanvas: (id: string) => void;
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
    isOpen,
    onClose,
    canvases,
    currentCanvasId,
    onSelectCanvas,
    onCreateCanvas,
    onDeleteCanvas,
}) => {
    const [newCanvasName, setNewCanvasName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCanvasName.trim()) {
            onCreateCanvas(newCanvasName.trim());
            setNewCanvasName('');
            setIsCreating(false);
        }
    };

    return (
        <div
            className={`fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
        >
            <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-clay-900">Your Canvases</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-clay-600 transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {canvases.map((canvas) => (
                        <div
                            key={canvas.id}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition border group ${currentCanvasId === canvas.id
                                ? 'bg-cream-100 border-gold-400 text-clay-900 shadow-sm'
                                : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50 hover:text-clay-800'
                                }`}
                        >
                            <button
                                onClick={() => onSelectCanvas(canvas.id)}
                                className="flex-1 text-left truncate mr-2"
                            >
                                <div className="font-medium truncate">{canvas.name}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Last edited: {new Date(canvas.updated_at).toLocaleDateString()}
                                </div>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete "${canvas.name}"?`)) {
                                        onDeleteCanvas(canvas.id);
                                    }
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete Canvas"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    {isCreating ? (
                        <form onSubmit={handleCreate} className="space-y-2">
                            <input
                                type="text"
                                value={newCanvasName}
                                onChange={(e) => setNewCanvasName(e.target.value)}
                                placeholder="Canvas Name..."
                                className="w-full bg-gray-50 text-clay-900 px-3 py-2 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none text-sm"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-clay-900 hover:bg-clay-800 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-clay-900/10"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-white text-clay-600 border border-dashed border-gray-300 hover:border-gold-400 px-4 py-3 rounded-xl transition shadow-sm hover:shadow-md"
                        >
                            <span className="text-lg">+</span>
                            <span className="font-medium">New Canvas</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
