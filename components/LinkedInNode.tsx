
import React, { useState, useEffect, useRef } from 'react';
import { LinkedInNodeData } from '../types';
import { getLinkedInContent } from '../services/webScraperService';

interface LinkedInNodeProps {
    data: LinkedInNodeData;
    isSelected: boolean;
    onUpdate: (id: string, updates: Partial<LinkedInNodeData>) => void;
    onConnectStart: (id: string) => void;
    onDelete: (id: string) => void;
}

export const LinkedInNode: React.FC<LinkedInNodeProps> = ({ data, isSelected, onUpdate, onConnectStart, onDelete }) => {
    const [inputUrl, setInputUrl] = useState(data.url);
    const [showContent, setShowContent] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    // Measure dimensions for connections
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

    const handleFetch = async () => {
        onUpdate(data.id, { isFetching: true, fetchError: undefined });
        try {
            const result = await getLinkedInContent(inputUrl);

            onUpdate(data.id, {
                content: result.content,
                isFetching: false,
                url: inputUrl,
                title: result.title,
                imageUrl: result.imageUrl
            });
        } catch (e: any) {
            onUpdate(data.id, { isFetching: false, fetchError: e.message });
        }
    };

    return (
        <div
            ref={nodeRef}
            className={`w-80 bg-white border-2 rounded-3xl shadow-soft flex flex-col overflow-hidden transition-all duration-200 ${isSelected ? 'border-blue-400 scale-105 shadow-xl' : 'border-gray-100 hover:border-gray-300'}`}
        >
            {/* Header */}
            <div className="bg-[#0077b5] px-4 py-3 flex justify-between items-center border-b border-blue-600 cursor-move handle">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.6.6 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                    </svg>
                    <span className="font-semibold text-sm text-white">LinkedIn Post</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(data.id); }} className="text-white/70 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="https://www.linkedin.com/posts/..."
                        className="w-full bg-cream-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-clay-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all font-medium"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Thumbnail Image */}
                {data.imageUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black shadow-inner">
                        <img
                            src={data.imageUrl}
                            alt="Post Thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                ) : null}

                <div className="flex justify-center">
                    {!data.content && !data.isFetching && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFetch(); }}
                            className="w-full bg-[#0077b5] hover:bg-[#006097] text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1 transition-transform border border-blue-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            Extract Post
                        </button>
                    )}
                    {data.isFetching && (
                        <div className="flex items-center gap-2 text-xs text-blue-500 font-medium">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            Extracting post...
                        </div>
                    )}
                </div>

                {/* Status Area */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                        <span className={data.content ? "text-emerald-600 font-medium" : data.fetchError ? "text-red-500 font-medium" : "text-gray-400"}>
                            {data.isFetching ? "Processing..." :
                                data.content ? "Content Ready" :
                                    data.fetchError ? "Error" : "No Content"}
                        </span>
                        {data.content && (
                            <button
                                className="text-clay-600 hover:text-clay-900 font-medium"
                                onClick={(e) => { e.stopPropagation(); setShowContent(!showContent); }}
                            >
                                {showContent ? "Hide" : "View"}
                            </button>
                        )}
                    </div>
                    {data.fetchError && (
                        <span className="text-[10px] text-red-600 leading-tight bg-red-50 p-2 rounded-lg border border-red-100">
                            {data.fetchError}
                        </span>
                    )}
                </div>

                {/* Content Preview */}
                {showContent && (
                    <textarea
                        className="w-full h-32 bg-white border border-gray-200 rounded-xl p-3 text-[10px] text-clay-600 font-mono resize-none focus:outline-none focus:border-blue-300 shadow-inner"
                        value={data.content || ""}
                        onChange={(e) => onUpdate(data.id, { content: e.target.value })}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="Post content..."
                    />
                )}
            </div>

            {/* Output Handle */}
            <div
                className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#0077b5] rounded-full border-4 border-white cursor-crosshair hover:scale-125 transition-transform z-10 shadow-md"
                title="Connect to Agent"
                onMouseDown={(e) => { e.stopPropagation(); onConnectStart(data.id); }}
            />
        </div>
    );
};
