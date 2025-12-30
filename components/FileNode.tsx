import React, { useRef, useState, useEffect } from 'react';
import { FileNodeData } from '../types';
import { FileText, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
// Using a CDN for the worker to avoid complex build configuration updates
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface FileNodeProps {
    data: FileNodeData;
    isSelected: boolean;
    onUpdate: (id: string, updates: Partial<FileNodeData>) => void;
    onDelete: (id: string) => void;
    onConnectStart: (id: string) => void;
    isConnected: boolean;
}

export const FileNode: React.FC<FileNodeProps> = ({ data, isSelected, onUpdate, onDelete, onConnectStart, isConnected }) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

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

    const parseFile = async (file: File) => {
        onUpdate(data.id, { isProcessing: true, error: undefined, fileName: file.name, fileType: file.type });

        try {
            let content = '';

            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                }
                content = text;
            } else if (
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                content = result.value;
            } else if (file.type === 'text/plain') {
                content = await file.text();
            } else {
                throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
            }

            onUpdate(data.id, { content, isProcessing: false });
        } catch (err: any) {
            console.error("File parsing error:", err);
            onUpdate(data.id, { error: err.message || 'Failed to parse file', isProcessing: false });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            parseFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            parseFile(file);
        }
    };

    return (
        <div
            ref={nodeRef}
            className={`w-72 bg-white border-2 rounded-3xl shadow-soft flex flex-col overflow-hidden transition-all duration-200 ${isSelected ? 'border-orange-400 scale-105 shadow-xl' : 'border-gray-100 hover:border-gray-300'}`}
        >
            {/* Header */}
            <div className="bg-orange-50 px-4 py-3 flex justify-between items-center border-b border-orange-100 cursor-move handle">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-400" />
                    <span className="text-sm font-semibold text-clay-900 truncate w-40">
                        {data.fileName || 'File Source'}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(data.id); }}
                    className="text-clay-400 hover:text-red-500"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 bg-cream-50/50">
                {!data.fileName ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-400 hover:bg-white'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-8 w-8 text-clay-400 mb-2" />
                        <span className="text-xs text-clay-500 font-medium">Click to Upload or Drag & Drop</span>
                        <span className="text-[10px] text-clay-400 mt-1">PDF, DOCX, TXT</span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                                <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-clay-900 truncate" title={data.fileName}>
                                    {data.fileName}
                                </div>
                                <div className="text-[10px] text-clay-500 uppercase">
                                    {data.fileType.split('/')[1] || 'FILE'}
                                </div>
                            </div>
                        </div>

                        {data.isProcessing && (
                            <div className="flex items-center gap-2 text-xs text-blue-500 animate-pulse font-medium">
                                <Loader2 size={12} className="animate-spin" />
                                <span>Parsing file content...</span>
                            </div>
                        )}

                        {data.error && (
                            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <span>{data.error}</span>
                            </div>
                        )}

                        {data.content && !data.isProcessing && (
                            <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                Content extracted ({data.content.length} chars)
                            </div>
                        )}

                        <button
                            onClick={() => {
                                // Reset to allow re-upload
                                onUpdate(data.id, { fileName: '', content: undefined, error: undefined });
                            }}
                            className="text-xs text-clay-500 underline hover:text-clay-800"
                        >
                            Replace File
                        </button>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <div
                className={`absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-4 border-white z-10 cursor-pointer hover:scale-110 transition-transform shadow-md ${isConnected ? 'bg-orange-500' : 'bg-gray-200'}`}
                title="Connect to Agent"
                onMouseDown={(e) => { e.stopPropagation(); onConnectStart(data.id); }}
            />
        </div>
    );
};
