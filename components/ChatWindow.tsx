import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatSession, ChatMessage, VoicePersona } from '../types';
import { createChatSession, sendMessage } from '../services/geminiService';
import { sendClaudeMessage } from '../services/claudeService';
import { Chat } from '@google/genai';

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
    session: ChatSession | undefined;
    allSessions: ChatSession[];
    activeSessionId: string | null;
    nodeName: string;
    contextText: string;
    defaultModel: string;
    voices: VoicePersona[];
    onUpdateMessages: (nodeId: string, messages: ChatMessage[], model?: string) => void;
    onCreateSession: () => void;
    onSwitchSession: (sessionId: string) => void;
    onUpdateNodeModel: (model: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, newTitle: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    isOpen, onClose, session, allSessions, activeSessionId, nodeName, contextText, defaultModel, voices, onUpdateMessages, onCreateSession, onSwitchSession, onUpdateNodeModel, onDeleteSession, onRenameSession
}) => {
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>(session?.model || defaultModel);
    const chatInstanceRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Always sync with the card's model (defaultModel) when it changes or when the session changes
        if (defaultModel) {
            setSelectedModel(defaultModel);
        }
    }, [defaultModel, session?.id]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [session?.messages, isOpen, activeSessionId]);

    // Construct the System Prompt
    const getSystemPrompt = () => {
        let prompt = `You are a social media content expert and a professional ghostwriter.
You have been provided with the following source content (video transcript or blog article):
"""
${contextText.substring(0, 50000)} ... [truncated if too long]
"""

Your goal is to help the user repurpose this content into various formats (Tweets, LinkedIn posts, Blog summaries, etc.).

CRITICAL INSTRUCTION - VOICE SELECTION:
You have access to the following "Voice Personas" trained by the user. 
Analyze the user's request to determine the target platform or style (e.g., if they ask for "LinkedIn", use the LinkedIn persona; if "Tweet", use a Twitter/Short-form persona).

ENFORCEMENT RULES:
1. **MATCHING**: If the request matches a persona type, strictly adopt that persona.
2. **LANGUAGE**: You MUST generate content in the "Language" specified by the selected persona. If the source content is in a different language, TRANSLATE and ADAPT it to the persona's language. THIS IS MANDATORY.
3. **STYLE**: Include specific writing quirks, formatting, or instructions defined in "Instructions".

AVAILABLE PERSONAS:
${voices.length === 0 ? "No custom personas available. Use a generic professional tone." : voices.map((v, i) => `
${i + 1}. [${v.name}] (Type: ${v.type})
   - Language: ${v.language}
   - Instructions: ${v.customInstructions || "None"}
   - Reference Samples:
     ${v.samples.slice(0, 3).map(s => `"${s.content.substring(0, 150)}..."`).join('\n     ')}
`).join('\n')}

If no specific persona matches the request, maintain a high-quality, professional, and engaging tone suitable for the context.
ALWAYS format your response with clear headers and bullet points where applicable.`;

        return prompt;
    };

    const chatModelRef = useRef<string | null>(null);

    // Initialize Chat Instance when window opens or session changes
    useEffect(() => {
        if (isOpen && session && contextText && !selectedModel.startsWith('claude')) {
            // Check if we need to initialize or re-initialize (if model changed)
            if (!chatInstanceRef.current || chatModelRef.current !== selectedModel) {
                initializeGeminiChat();
            }
        }
    }, [isOpen, session?.id, contextText, selectedModel, voices]);

    const initializeGeminiChat = () => {
        const systemPrompt = getSystemPrompt();
        chatInstanceRef.current = createChatSession(selectedModel, systemPrompt);
        chatModelRef.current = selectedModel;
    };

    // Reset chat instance if model or context changes deeply (simplified)
    useEffect(() => {
        if (!isOpen) {
            chatInstanceRef.current = null;
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || !session) return;

        const currentModel = selectedModel;
        const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
        const updatedMessages = [...session.messages, userMsg];

        // Update local state and parent state immediately
        onUpdateMessages(session.nodeId, updatedMessages, currentModel);
        setInput('');
        setIsTyping(true);

        try {
            if (currentModel.startsWith('claude')) {
                let fullSystemPrompt = getSystemPrompt(); // Reuse the same prompt logic

                // Add specific Claude identity instruction if needed, though the prompt is robust
                fullSystemPrompt += `\nYou are powered by ${currentModel}.`;

                const replyText = await sendClaudeMessage(updatedMessages, fullSystemPrompt, currentModel);
                const botMsg: ChatMessage = { role: 'model', text: replyText, timestamp: Date.now() };
                onUpdateMessages(session.nodeId, [...updatedMessages, botMsg], currentModel);

            } else {
                // Gemini
                if (!chatInstanceRef.current) {
                    initializeGeminiChat();
                }

                if (chatInstanceRef.current) {
                    const replyText = await sendMessage(chatInstanceRef.current, userMsg.text);
                    const botMsg: ChatMessage = { role: 'model', text: replyText, timestamp: Date.now() };
                    onUpdateMessages(session.nodeId, [...updatedMessages, botMsg], currentModel);
                } else {
                    const botMsg: ChatMessage = { role: 'model', text: "Error: Could not initialize chat session.", timestamp: Date.now() };
                    onUpdateMessages(session.nodeId, [...updatedMessages, botMsg], currentModel);
                }
            }
        } catch (error: any) {
            console.error("Chat error:", error);
            const botMsg: ChatMessage = { role: 'model', text: `Error: ${error.message || "Failed to generate response."}`, timestamp: Date.now() };
            onUpdateMessages(session.nodeId, [...updatedMessages, botMsg], currentModel);
        }

        setIsTyping(false);
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        setSelectedModel(newModel);
        onUpdateNodeModel(newModel);
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Mock attachment behavior for now - append to input
        setInput(prev => prev + `\n[Attached: ${file.name}]\n`);
        // Reset input
        e.target.value = '';
    };

    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const startEditing = (sessionId: string, currentTitle: string) => {
        setEditingSessionId(sessionId);
        setEditTitle(currentTitle || "New Chat");
    };

    const saveTitle = (sessionId: string) => {
        if (editTitle.trim()) {
            onRenameSession(sessionId, editTitle.trim());
        }
        setEditingSessionId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
        if (e.key === 'Enter') {
            saveTitle(sessionId);
        } else if (e.key === 'Escape') {
            setEditingSessionId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-full md:w-[800px] bg-white/90 backdrop-blur-2xl border-l border-white/50 shadow-2xl flex z-50 transform transition-transform duration-300 ease-in-out translate-x-0 font-sans">

            {/* Sidebar (Session List) */}
            <div className="w-64 bg-cream-100/50 border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-clay-800">Chats</h3>
                    <button onClick={onCreateSession} className="bg-clay-900 hover:bg-clay-800 text-white text-xs px-3 py-1.5 rounded-full transition flex items-center gap-1 shadow-lg shadow-clay-900/10">
                        <span>+</span> New
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">

                    {allSessions.map(sess => (
                        <div
                            key={sess.id}
                            onClick={() => onSwitchSession(sess.id)}
                            className={`w-full text-left px-3 py-3 rounded-xl text-sm transition flex justify-between items-center group cursor-pointer ${activeSessionId === sess.id
                                ? 'bg-white text-clay-900 shadow-sm border border-gray-100'
                                : 'text-gray-500 hover:bg-white/50 hover:text-clay-800'
                                }`}
                        >
                            <div className="flex-1 min-w-0 pr-2">
                                {editingSessionId === sess.id ? (
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={() => saveTitle(sess.id)}
                                        onKeyDown={(e) => handleKeyDown(e, sess.id)}
                                        className="w-full bg-white text-clay-900 px-1 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gold-400"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        <div className="truncate font-medium">{sess.title || "New Chat"}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">{new Date(sess.createdAt).toLocaleDateString()}</div>
                                    </>
                                )}
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(sess.id, sess.title || "New Chat");
                                    }}
                                    className="text-gray-400 hover:text-gold-500 p-1 rounded"
                                    title="Rename Chat"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (deletingSessionId === sess.id) {
                                            onDeleteSession(sess.id);
                                            setDeletingSessionId(null);
                                        } else {
                                            setDeletingSessionId(sess.id);
                                            setTimeout(() => setDeletingSessionId((current) => current === sess.id ? null : current), 3000);
                                        }
                                    }}
                                    className={`p-1 rounded transition-colors ${deletingSessionId === sess.id ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-red-500'}`}
                                    title={deletingSessionId === sess.id ? "Click again to confirm" : "Delete Chat"}
                                >
                                    {deletingSessionId === sess.id ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                    {allSessions.length === 0 && (
                        <div className="text-gray-400 text-xs text-center mt-10 p-4">
                            No stored chats. Start a new one!
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/50">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="md:hidden">
                            {/* Mobile sidebar toggle placeholder if needed, or back button */}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-clay-900">{nodeName}</h2>
                            <div className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Connected to Context
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={selectedModel}
                            onChange={handleModelChange}
                            className="bg-gray-50 border-gray-200 text-clay-700 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-gold-400 cursor-pointer shadow-sm"
                        >
                            <optgroup label="Google Gemini">
                                <option value="gemini-3-flash-preview">Gemini 2.5 Flash</option>
                                <option value="gemini-3-pro-preview">Gemini 2.5 Pro</option>
                            </optgroup>
                            <optgroup label="Anthropic Claude">
                                <option value="claude-sonnet-4-5-20250929">Claude 4.5 Sonnet</option>
                            </optgroup>
                        </select>

                        <button onClick={onClose} className="text-gray-400 hover:text-clay-800 p-2 rounded-full hover:bg-gray-100 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-cream-50">
                    {!session || session.messages.length === 0 && (
                        <div className="text-center text-clay-500 mt-10">
                            <div className="mb-4 text-4xl">✨</div>
                            <p>Generate posts, threads, or summaries based on your content.</p>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                <button onClick={() => setInput("Draft a Twitter thread summarizing this.")} className="text-xs bg-white text-clay-600 hover:bg-gold-50 hover:text-clay-900 px-3 py-1 rounded-full border border-gray-200 shadow-sm transition">Twitter Thread</button>
                                <button onClick={() => setInput("Write a LinkedIn post about the key takeaways.")} className="text-xs bg-white text-clay-600 hover:bg-gold-50 hover:text-clay-900 px-3 py-1 rounded-full border border-gray-200 shadow-sm transition">LinkedIn Post</button>
                                <button onClick={() => setInput("Summarize the main points.")} className="text-xs bg-white text-clay-600 hover:bg-gold-50 hover:text-clay-900 px-3 py-1 rounded-full border border-gray-200 shadow-sm transition">Summarize</button>
                            </div>
                        </div>
                    )}
                    {session?.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-3xl px-6 py-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-clay-900 text-white rounded-br-none'
                                : 'bg-white text-clay-800 rounded-bl-none border border-white/50'
                                }`}>
                                {msg.role === 'model' ? (
                                    <div className="max-w-none text-sm prose prose-sm prose-slate [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-3xl rounded-bl-none px-4 py-3 border border-white/50 shadow-sm flex items-center gap-1">
                                <span className="w-2 h-2 bg-clay-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-clay-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-clay-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white/80 border-t border-gray-200 backdrop-blur">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={`Message ${selectedModel}...`}
                            className="w-full bg-gray-50 text-clay-900 rounded-2xl pl-10 pr-12 py-3 resize-none h-14 focus:outline-none focus:ring-2 focus:ring-gold-400 border border-gray-200 placeholder-gray-400 shadow-inner"
                        />

                        {/* Attachment Button */}
                        <button
                            onClick={handleAttachmentClick}
                            className="absolute left-3 top-4 text-gray-400 hover:text-clay-600 transition"
                            title="Attach file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping || !session}
                            className="absolute right-2 top-2 p-2 bg-clay-900 hover:bg-clay-800 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-clay-900/10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-gray-400">
                        Powered by {selectedModel}
                    </div>
                </div>
            </div>
        </div>
    );
};