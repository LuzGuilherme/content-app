import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface ZoomControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset?: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, onZoomIn, onZoomOut, onReset }) => {
    return (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20 z-50">
            <button
                onClick={onZoomIn}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                title="Zoom In"
            >
                <Plus size={20} />
            </button>
            <div className="text-xs font-mono text-center text-gray-500 py-1 border-t border-b border-gray-100 cursor-default select-none">
                {Math.round(zoom * 100)}%
            </div>
            <button
                onClick={onZoomOut}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                title="Zoom Out"
            >
                <Minus size={20} />
            </button>
        </div>
    );
};
