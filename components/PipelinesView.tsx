import React, { useState } from 'react';
import { ArrowLeft, Play, Linkedin, Video, Plus, Trash2, Loader2, Copy, Check, FileText, Globe, Upload, Twitter, Sparkles, Wand2 } from 'lucide-react';
import { PipelineTemplate, PipelineType, VoicePersona, PipelineConfig, PipelineSource, VoiceType } from '../types';
import { executePipeline } from '../services/pipelineService';
import { parseFile } from '../services/fileParser';

interface PipelinesViewProps {
    onBack: () => void;
    voices: VoicePersona[];
}

const TEMPLATES: PipelineTemplate[] = [
    {
        id: 'linkedin-post-generator',
        type: PipelineType.LINKEDIN_VIDEO_TO_POSTS,
        name: 'LinkedIn Post Generator',
        description: 'Generate engaging LinkedIn posts from multiple sources (Videos, Blogs, Text).',
        icon: 'linkedin'
    },
    {
        id: 'twitter-thread-generator',
        type: PipelineType.TWITTER_THREAD_GENERATOR,
        name: 'Twitter Thread Generator',
        description: 'Generate viral Twitter threads from your content sources.',
        icon: 'twitter'
    }
];

export const PipelinesView: React.FC<PipelinesViewProps> = ({ onBack, voices }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate | null>(null);
    const [config, setConfig] = useState<Partial<PipelineConfig>>({
        inputs: {
            postCount: 3,
            sources: []
        },
        model: 'gemini-3-flash-preview' // Default
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleTemplateSelect = (template: PipelineTemplate) => {
        setSelectedTemplate(template);
        setConfig({
            pipelineId: template.id,
            inputs: {
                postCount: 3,
                sources: []
            },
            model: 'gemini-3-flash-preview'
        });
        setResult(null);
    };

    const handlePostCountChange = (count: number) => {
        setConfig(prev => ({
            ...prev,
            inputs: {
                ...prev.inputs,
                postCount: count,
                sources: prev.inputs?.sources || []
            }
        }));
    };

    const addSource = (type: 'video' | 'blog' | 'text' | 'linkedin' | 'file') => {
        const newSource: PipelineSource = { type, value: '' };
        setConfig(prev => ({
            ...prev,
            inputs: {
                ...prev.inputs,
                postCount: prev.inputs?.postCount || 3,
                sources: [...(prev.inputs?.sources || []), newSource]
            }
        }));
    };

    const updateSource = (index: number, value: string) => {
        const newSources = [...(config.inputs?.sources || [])];
        newSources[index] = { ...newSources[index], value };
        setConfig(prev => ({
            ...prev,
            inputs: {
                ...prev.inputs,
                postCount: prev.inputs?.postCount || 3,
                sources: newSources
            }
        }));
    };

    const removeSource = (index: number) => {
        const newSources = [...(config.inputs?.sources || [])];
        newSources.splice(index, 1);
        setConfig(prev => ({
            ...prev,
            inputs: {
                ...prev.inputs,
                postCount: prev.inputs?.postCount || 3,
                sources: newSources
            }
        }));
    };

    const handleExecute = async () => {
        if (!selectedTemplate) return;

        const sources = config.inputs?.sources || [];
        if (sources.length === 0 || sources.every(s => !s.value.trim())) {
            alert("Please add at least one valid source content.");
            return;
        }

        setIsGenerating(true);
        setResult(null);

        try {
            let voice: VoicePersona | undefined;

            if (selectedTemplate.type === PipelineType.LINKEDIN_VIDEO_TO_POSTS) {
                voice = voices.find(v => v.type === VoiceType.LINKEDIN);
            } else if (selectedTemplate.type === PipelineType.TWITTER_THREAD_GENERATOR) {
                voice = voices.find(v => v.type === VoiceType.TWITTER);
            }

            if (!voice && voices.length > 0) {
                voice = voices[0];
            }

            const fullConfig = config as PipelineConfig;

            const output = await executePipeline(fullConfig, selectedTemplate.type, voice);
            setResult(output);
        } catch (error) {
            console.error("Pipeline Execution Error:", error);
            alert("Failed to generate content. See console for details.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 h-screen bg-[#FDFDFB] text-clay-900 font-sans p-6 overflow-y-auto selection:bg-gold-300/30">
            {/* Ambient Background */}
            <div className="fixed top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-purple-200/20 to-transparent blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-gold-200/20 to-transparent blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto pb-32 relative z-10">

                {/* Header */}
                <div className="mb-12 cursor-pointer" onClick={onBack}>
                    <button
                        className="group flex items-center gap-2 text-clay-500 hover:text-clay-900 mb-6 transition-colors px-4 py-2 hover:bg-white/80 rounded-full w-fit border border-transparent hover:border-gray-200"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Dashboard</span>
                    </button>

                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-clay-900 tracking-tight">
                        Content Pipelines
                    </h1>
                    <p className="text-xl text-clay-500 max-w-2xl leading-relaxed">
                        Automate your content creation with intelligent, pre-built workflows designed for speed.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Templates List */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-clay-400 uppercase tracking-wider px-2">
                            <Wand2 size={12} /> Available Workflows
                        </div>

                        <div className="space-y-4">
                            {TEMPLATES.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className={`group p-6 rounded-[2rem] border cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedTemplate?.id === template.id
                                        ? 'bg-white border-purple-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-2 ring-purple-500/10'
                                        : 'bg-white/60 border-gray-100 hover:border-purple-200 hover:bg-white hover:shadow-lg'
                                        }`}
                                >
                                    {selectedTemplate?.id === template.id && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                    )}

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${selectedTemplate?.id === template.id
                                                ? 'bg-purple-100 text-purple-600 shadow-inner'
                                                : 'bg-gray-50 text-clay-400 group-hover:bg-purple-50 group-hover:text-purple-500'
                                                }`}>
                                                {template.icon === 'linkedin' ? <Linkedin size={24} /> : <Twitter size={24} />}
                                            </div>
                                            <h3 className={`text-lg font-bold ${selectedTemplate?.id === template.id ? 'text-clay-900' : 'text-clay-700'}`}>
                                                {template.name}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-clay-500 leading-relaxed pl-[3.75rem]">
                                            {template.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Configuration & Execution */}
                    <div className="lg:col-span-8">
                        {selectedTemplate ? (
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                                    <h2 className="text-3xl font-bold text-clay-900">{selectedTemplate.name}</h2>
                                    <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Configuring
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Settings - Compact */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-clay-500 uppercase tracking-wider ml-1">Output Count</label>
                                            <div className="relative">
                                                <select
                                                    value={config.inputs?.postCount || 3}
                                                    onChange={(e) => handlePostCountChange(parseInt(e.target.value))}
                                                    className="w-full bg-cream-50 hover:bg-cream-100 border border-gray-200 rounded-2xl p-4 text-clay-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium appearance-none cursor-pointer"
                                                >
                                                    {[1, 2, 3, 4, 5, 10].map(n => (
                                                        <option key={n} value={n}>{n} Variants</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-clay-400">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-clay-500 uppercase tracking-wider ml-1">AI Model</label>
                                            <div className="relative">
                                                <select
                                                    value={config.model || 'gemini-3-flash-preview'}
                                                    onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                                                    className="w-full bg-cream-50 hover:bg-cream-100 border border-gray-200 rounded-2xl p-4 text-clay-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium appearance-none cursor-pointer"
                                                >
                                                    <optgroup label="Google Gemini">
                                                        <option value="gemini-3-flash-preview">Gemini 2.5 Flash</option>
                                                        <option value="gemini-3-pro-preview">Gemini 2.5 Pro</option>
                                                    </optgroup>
                                                    <optgroup label="Anthropic Claude">
                                                        <option value="claude-sonnet-4-5-20250929">Claude 4.5 Sonnet</option>
                                                    </optgroup>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-clay-400">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sources Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-clay-500 uppercase tracking-wider ml-1">Context Sources</label>
                                            <div className="flex gap-2">
                                                <button onClick={() => addSource('video')} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Add Video"><Video size={18} /></button>
                                                <button onClick={() => addSource('blog')} className="p-2 rounded-xl bg-green-50 text-green-500 hover:bg-green-100 transition-colors" title="Add Blog"><Globe size={18} /></button>
                                                <button onClick={() => addSource('linkedin')} className="p-2 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors" title="Add LinkedIn"><Linkedin size={18} /></button>
                                                <button onClick={() => addSource('text')} className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="Add Text"><FileText size={18} /></button>
                                                <button onClick={() => document.getElementById('pipeline-file-upload')?.click()} className="p-2 rounded-xl bg-orange-50 text-orange-500 hover:bg-orange-100 transition-colors" title="Upload File"><Upload size={18} /></button>

                                                <input
                                                    type="file"
                                                    id="pipeline-file-upload"
                                                    className="hidden"
                                                    accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.pdf,.docx"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const content = await parseFile(file);
                                                                const value = `[File: ${file.name}]\n\n${content}`;
                                                                const newSource: PipelineSource = { type: 'file', value };
                                                                setConfig(prev => ({
                                                                    ...prev,
                                                                    inputs: {
                                                                        ...prev.inputs,
                                                                        postCount: prev.inputs?.postCount || 3,
                                                                        sources: [...(prev.inputs?.sources || []), newSource]
                                                                    }
                                                                }));
                                                            } catch (error) {
                                                                console.error("File upload error:", error);
                                                                alert("Failed to read file.");
                                                            } finally {
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 min-h-[100px]">
                                            {config.inputs?.sources?.map((source, idx) => (
                                                <div key={idx} className="flex gap-4 items-start animate-in slide-in-from-bottom-2 duration-300">
                                                    <div className="mt-4 text-clay-400">
                                                        {source.type === 'video' && <Video size={18} />}
                                                        {source.type === 'blog' && <Globe size={18} />}
                                                        {source.type === 'linkedin' && <Linkedin size={18} />}
                                                        {source.type === 'text' && <FileText size={18} />}
                                                        {source.type === 'file' && <FileText size={18} className="text-orange-500" />}
                                                    </div>

                                                    {source.type === 'file' ? (
                                                        <div className="flex-1 bg-cream-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-bold text-clay-900 truncate">
                                                                    {source.value.match(/^\[File: (.*?)\]/)?.[1] || "Uploaded File"}
                                                                </div>
                                                                <div className="text-xs text-clay-500 mt-1">
                                                                    Ready for processing
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : source.type === 'text' ? (
                                                        <textarea
                                                            value={source.value}
                                                            onChange={(e) => updateSource(idx, e.target.value)}
                                                            placeholder="Paste context, rough notes, or ideas..."
                                                            className="flex-1 bg-cream-50 border border-gray-200 rounded-2xl p-4 text-sm text-clay-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 min-h-[100px] resize-none transition-all placeholder:text-gray-400"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={source.value}
                                                            onChange={(e) => updateSource(idx, e.target.value)}
                                                            placeholder={
                                                                source.type === 'video' ? "https://youtube.com/..." :
                                                                    source.type === 'blog' ? "https://medium.com/..." :
                                                                        "https://linkedin.com/posts/..."
                                                            }
                                                            className="flex-1 bg-cream-50 border border-gray-200 rounded-2xl p-4 text-sm text-clay-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-gray-400"
                                                        />
                                                    )}

                                                    <button
                                                        onClick={() => removeSource(idx)}
                                                        className="mt-4 text-clay-400 hover:text-red-500 p-1 transition-colors rounded-lg hover:bg-red-50"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}

                                            {(!config.inputs?.sources || config.inputs.sources.length === 0) && (
                                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50/50 text-clay-400">
                                                    <div className="w-12 h-12 rounded-full bg-white mb-3 flex items-center justify-center shadow-sm">
                                                        <Plus size={20} className="text-gray-300" />
                                                    </div>
                                                    <p className="text-sm font-medium">Add content sources to get started</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center gap-4 pt-4">
                                        {/* Voice Indicator */}
                                        <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border font-medium text-sm ${(() => {
                                            const voice = selectedTemplate.type === PipelineType.LINKEDIN_VIDEO_TO_POSTS
                                                ? voices.find(v => v.type === VoiceType.LINKEDIN)
                                                : selectedTemplate.type === PipelineType.TWITTER_THREAD_GENERATOR
                                                    ? voices.find(v => v.type === VoiceType.TWITTER)
                                                    : voices[0];
                                            return voice ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700";
                                        })()}`}>
                                            <Sparkles size={16} />
                                            {(() => {
                                                const voice = selectedTemplate.type === PipelineType.LINKEDIN_VIDEO_TO_POSTS
                                                    ? voices.find(v => v.type === VoiceType.LINKEDIN)
                                                    : selectedTemplate.type === PipelineType.TWITTER_THREAD_GENERATOR
                                                        ? voices.find(v => v.type === VoiceType.TWITTER)
                                                        : voices[0];
                                                return voice ? `Using voice: ${voice.name}` : "Using generic professional voice";
                                            })()}
                                        </div>

                                        <button
                                            onClick={handleExecute}
                                            disabled={isGenerating || (config.inputs?.sources || []).length === 0}
                                            className={`px-8 py-4 rounded-2xl flex items-center gap-2 font-bold text-lg transition-all shadow-lg hover:shadow-xl ${isGenerating || (config.inputs?.sources || []).length === 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20 transform hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    <span>Crushing it...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={20} className="fill-current" />
                                                    <span>Generate</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Results Area */}
                                    {result && (
                                        <div className="mt-12 pt-10 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                                    <Check size={18} />
                                                </div>
                                                Generated Results
                                            </h3>

                                            <div className="space-y-6">
                                                {(() => {
                                                    const parts = result.split(/--- POST \d+ ---/);
                                                    const hasSeparators = result.match(/--- POST \d+ ---/);
                                                    const posts = hasSeparators ? parts.slice(1) : [result];

                                                    return posts.map((postContent, idx) => (
                                                        <div key={idx} className="group bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                                                            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                                                <span className="text-xs font-bold text-clay-400 uppercase tracking-wider flex items-center gap-2">
                                                                    Variant {idx + 1}
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(postContent.trim());
                                                                        const btn = document.getElementById(`copy-btn-${idx}`);
                                                                        if (btn) {
                                                                            const originalText = btn.innerHTML;
                                                                            btn.innerHTML = `<span class="flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied</span>`;
                                                                            setTimeout(() => btn.innerHTML = originalText, 2000);
                                                                        }
                                                                    }}
                                                                    id={`copy-btn-${idx}`}
                                                                    className="text-xs bg-white hover:bg-gray-50 text-clay-600 border border-gray-200 px-4 py-2 rounded-xl transition-all font-medium min-w-[80px] shadow-sm"
                                                                >
                                                                    Copy
                                                                </button>
                                                            </div>
                                                            <div className="p-6">
                                                                <textarea
                                                                    readOnly
                                                                    value={postContent.trim()}
                                                                    className="w-full bg-transparent border-none text-base font-sans text-clay-800 focus:outline-none resize-none leading-relaxed"
                                                                    style={{ height: 'auto', minHeight: '180px' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-clay-400 border-2 border-dashed border-gray-200/60 rounded-[3rem] bg-gray-50/30 p-12">
                                <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center mb-6 animate-pulse-slow">
                                    <Wand2 size={40} className="text-purple-300" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-clay-900">Select a Pipeline</h3>
                                <p className="text-lg max-w-sm text-center opacity-70">
                                    Choose a pre-built workflow from the sidebar to start generating magic.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
