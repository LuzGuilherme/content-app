import React, { useRef, useEffect } from 'react';
import { AgentNodeData, VoicePersona } from '../types';

interface AgentNodeProps {
  data: AgentNodeData;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<AgentNodeData>) => void;
  onChatOpen: (id: string) => void;
  onDelete: (id: string) => void;
  isConnected: boolean;
}

export const AgentNode: React.FC<AgentNodeProps> = ({ data, isSelected, onUpdate, onChatOpen, onDelete, isConnected }) => {
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

  return (
    <div
      ref={nodeRef}
      className={`w-72 bg-white border-2 rounded-3xl shadow-soft flex flex-col overflow-hidden transition-all duration-200 ${isSelected ? 'border-purple-500 scale-105 shadow-xl' : 'border-gray-100 hover:border-gray-300'}`}
    >
      {/* Input Handle */}
      <div
        className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-4 border-white z-10 shadow-md ${isConnected ? 'bg-purple-500' : 'bg-gray-200'}`}
        title="Input from Source"
      />

      {/* Header */}
      <div className="bg-purple-50 px-4 py-3 flex justify-between items-center border-b border-purple-100 cursor-move handle">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <input
            className="bg-transparent text-sm font-semibold text-clay-900 focus:outline-none w-32 placeholder-clay-400"
            value={data.name}
            onChange={(e) => onUpdate(data.id, { name: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(data.id); }} className="text-clay-400 hover:text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-clay-500 font-bold tracking-wider">Model</label>
          <select
            className="w-full bg-cream-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-clay-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 shadow-sm transition-all"
            value={data.model}
            onChange={(e) => onUpdate(data.id, { model: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <optgroup label="Google Gemini">
              <option value="gemini-3-flash-preview">Gemini 2.5 Flash (Fast)</option>
              <option value="gemini-3-pro-preview">Gemini 2.5 Pro (Reasoning)</option>
            </optgroup>
            <optgroup label="Anthropic Claude">
              <option value="claude-sonnet-4-5-20250929">Claude 4.5 Sonnet</option>
            </optgroup>
          </select>
        </div>



        <div className="pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onChatOpen(data.id); }}
            className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${isConnected ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            disabled={!isConnected}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            {isConnected ? "Open Chat Generator" : "Connect Source First"}
          </button>
        </div>
      </div>
    </div>
  );
};