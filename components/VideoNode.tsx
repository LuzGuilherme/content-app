import React, { useState, useEffect, useRef } from 'react';
import { VideoNodeData, NodeType } from '../types';
import { getTranscript } from '../services/transcriptionService';

interface VideoNodeProps {
    data: VideoNodeData;
    isSelected: boolean;
    onUpdate: (id: string, updates: Partial<VideoNodeData>) => void;
    onConnectStart: (id: string) => void;
    onDelete: (id: string) => void;
}

export const VideoNode: React.FC<VideoNodeProps> = ({ data, isSelected, onUpdate, onConnectStart, onDelete }) => {
    const [inputUrl, setInputUrl] = useState(data.url);
    const [showTranscript, setShowTranscript] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    // Measure dimensions
    useEffect(() => {
        if (!nodeRef.current) return;
        const observer = new ResizeObserver(() => {
            if (nodeRef.current) {
                const { offsetWidth, offsetHeight } = nodeRef.current;
                if (
                    !data.dimensions ||
                    data.dimensions.width !== offsetWidth ||
                    data.dimensions.height !== offsetHeight
                ) {
                    onUpdate(data.id, { dimensions: { width: offsetWidth, height: offsetHeight } });
                }
            }
        });
        observer.observe(nodeRef.current);
        return () => observer.disconnect();
    }, [nodeRef, data.id, data.dimensions, onUpdate]);

    // Extract video ID for thumbnail (simple regex for YouTube)
    useEffect(() => {
        const videoIdMatch = inputUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (videoIdMatch && videoIdMatch[1]) {
            const videoId = videoIdMatch[1];
            const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            if (data.thumbnailUrl !== thumb) {
                onUpdate(data.id, { thumbnailUrl: thumb, url: inputUrl, transcriptionError: undefined });
            }
        }
    }, [inputUrl, data.id, data.thumbnailUrl, onUpdate]);

    const handleTranscribe = async () => {
        onUpdate(data.id, { isTranscribing: true, transcriptionError: undefined });
        try {
            const text = await getTranscript(data.url);
            onUpdate(data.id, { transcript: text, isTranscribing: false });
        } catch (e: any) {
            onUpdate(data.id, { isTranscribing: false, transcriptionError: e.message });
        }
    };

    return (
        <div
            ref={nodeRef}
            className={`w-80 bg-white border-2 rounded-3xl shadow-soft flex flex-col overflow-hidden transition-all duration-200 ${isSelected ? 'border-red-500 scale-105 shadow-xl' : 'border-gray-100 hover:border-gray-300'}`}
        >
            {/* Header */}
            <div className="bg-red-50 px-4 py-3 flex justify-between items-center border-b border-red-100 cursor-move handle">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span className="font-semibold text-sm text-clay-900">Video Source</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(data.id); }} className="text-clay-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Paste YouTube URL..."
                        className="w-full bg-cream-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-clay-800 placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-all font-medium"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag when typing
                    />
                </div>

                {data.thumbnailUrl ? (
                    <div className="relative group aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black shadow-inner">
                        <img src={data.thumbnailUrl} alt="Video Thumbnail" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        {!data.transcript && !data.isTranscribing && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleTranscribe(); }}
                                    className="bg-white/90 hover:bg-white text-red-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 transition-transform transform hover:scale-105 border border-red-100 backdrop-blur-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                    Transcribe
                                </button>
                            </div>
                        )}
                        {data.isTranscribing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-video bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200">
                        No Video Loaded
                    </div>
                )}

                {/* Transcript Status */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                        <span className={data.transcript ? "text-emerald-600 font-medium" : data.transcriptionError ? "text-red-500 font-medium" : "text-gray-400"}>
                            {data.isTranscribing ? "Transcribing..." :
                                data.transcript ? "Transcript Ready" :
                                    data.transcriptionError ? "Error" : "No Transcript"}
                        </span>
                        {data.transcript && (
                            <button
                                className="text-clay-600 hover:text-clay-900 font-medium"
                                onClick={(e) => { e.stopPropagation(); setShowTranscript(!showTranscript); }}
                            >
                                {showTranscript ? "Hide" : "View"}
                            </button>
                        )}
                    </div>
                    {data.transcriptionError && (
                        <span className="text-[10px] text-red-600 leading-tight bg-red-50 p-2 rounded-lg border border-red-100">
                            {data.transcriptionError}
                        </span>
                    )}
                </div>

                {/* Manual Transcript View */}
                {showTranscript && (
                    <textarea
                        className="w-full h-24 bg-white border border-gray-200 rounded-xl p-3 text-[10px] text-clay-600 font-mono resize-none focus:outline-none focus:border-red-300 shadow-inner"
                        value={data.transcript || ""}
                        onChange={(e) => onUpdate(data.id, { transcript: e.target.value })}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="Transcript will appear here..."
                    />
                )}
            </div>

            {/* Output Handle */}
            <div
                className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full border-4 border-white cursor-crosshair hover:scale-125 transition-transform z-10 shadow-md"
                title="Connect to Agent"
                onMouseDown={(e) => { e.stopPropagation(); onConnectStart(data.id); }}
            />
        </div>
    );
};