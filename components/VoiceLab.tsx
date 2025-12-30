import React, { useState, useRef } from 'react';
import { ArrowLeft, Mic, Plus, FileText, Upload, Save, X, Trash2, Linkedin, Check, Globe, Twitter, ArrowRight, Wand2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { VoicePersona, VoiceType, VoiceSample } from '../types';

interface VoiceLabProps {
    onBack: () => void;
    voices: VoicePersona[];
    onSaveVoice: (voice: VoicePersona) => void;
    onDeleteVoice: (id: string) => void;
}

export const LANGUAGES = [
    "English", "Spanish", "French", "German", "Portuguese",
    "Chinese", "Japanese", "Hindi", "Arabic", "Russian"
];

export const VoiceLab: React.FC<VoiceLabProps> = ({ onBack, voices, onSaveVoice, onDeleteVoice }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingVoice, setEditingVoice] = useState<VoicePersona | null>(null);

    // Form State
    const [voiceName, setVoiceName] = useState('');
    const [voiceType, setVoiceType] = useState<VoiceType>(VoiceType.LINKEDIN);
    const [voiceLanguage, setVoiceLanguage] = useState('English');
    const [samples, setSamples] = useState<VoiceSample[]>([]);
    const [instructions, setInstructions] = useState('');
    const [newSampleText, setNewSampleText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasLinkedIn = voices.some(v => v.type === VoiceType.LINKEDIN);
    const hasTwitter = voices.some(v => v.type === VoiceType.TWITTER);
    const allProfilesCreated = hasLinkedIn && hasTwitter;

    const handleCreateNew = () => {
        setEditingVoice(null);

        let defaultType = VoiceType.LINKEDIN;
        if (hasLinkedIn && !hasTwitter) {
            defaultType = VoiceType.TWITTER;
        } else if (!hasLinkedIn && hasTwitter) {
            defaultType = VoiceType.LINKEDIN;
        }

        setVoiceName(defaultType === VoiceType.LINKEDIN ? 'My LinkedIn Voice' : 'My Twitter Voice');
        setVoiceType(defaultType);
        setVoiceLanguage('English');
        setSamples([]);
        setInstructions('');
        setNewSampleText('');
        setIsEditing(true);
    };

    const handleEdit = (voice: VoicePersona) => {
        setEditingVoice(voice);
        setVoiceName(voice.name);
        setVoiceType(voice.type);
        setVoiceLanguage(voice.language || 'English');
        setSamples(voice.samples);
        setInstructions(voice.customInstructions || '');
        setNewSampleText('');
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!voiceName.trim()) return;

        const voice: VoicePersona = {
            id: editingVoice ? editingVoice.id : uuidv4(),
            name: voiceName,
            type: voiceType,
            language: voiceLanguage,
            samples: samples,
            customInstructions: instructions,
            createdAt: editingVoice ? editingVoice.createdAt : Date.now(),
        };

        onSaveVoice(voice);
        setIsEditing(false);
    };

    const handleAddTextSample = () => {
        if (!newSampleText.trim()) return;
        setSamples([...samples, {
            id: uuidv4(),
            type: 'text',
            content: newSampleText
        }]);
        setNewSampleText('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            // In a real app, we'd upload to storage. Here we just mock it with the filename/placeholder
            setSamples(prev => [...prev, {
                id: uuidv4(),
                type: 'file',
                content: `File: ${file.name}`,
                filename: file.name
            }]);
        });

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveSample = (id: string) => {
        setSamples(samples.filter(s => s.id !== id));
    };

    const getVoiceIcon = (type: VoiceType) => {
        switch (type) {
            case VoiceType.LINKEDIN: return <Linkedin size={24} />;
            case VoiceType.TWITTER: return <Twitter size={24} />;
            default: return <Mic size={24} />;
        }
    };

    if (isEditing) {
        return (
            <div className="fixed inset-0 z-50 bg-[#FDFDFB] text-clay-900 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 font-sans overflow-y-auto selection:bg-rose-100">
                {/* Ambient Background */}
                <div className="fixed top-[-20%] right-[-10%] w-[1000px] h-[1000px] rounded-full bg-gradient-to-bl from-rose-200/20 to-transparent blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 pb-32">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-3 hover:bg-white border border-transparent hover:border-gray-200 rounded-full transition-all text-clay-500 hover:text-clay-900 shadow-sm hover:shadow-md"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="text-3xl font-extrabold text-clay-900 tracking-tight">{editingVoice ? 'Edit Persona' : 'New Voice Persona'}</h2>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={!voiceName.trim()}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-rose-500/20 transform hover:-translate-y-0.5"
                        >
                            <Save size={20} />
                            Save Persona
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-fit">

                        {/* LEFT COLUMN: Identity & Instructions */}
                        <div className="space-y-6 flex flex-col">

                            {/* Core Settings */}
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-clay-900">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                                        {getVoiceIcon(voiceType)}
                                    </div>
                                    Identity & Tone
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-clay-500 uppercase tracking-wider ml-1">Persona Name</label>
                                        <input
                                            type="text"
                                            value={voiceName}
                                            onChange={(e) => setVoiceName(e.target.value)}
                                            className="w-full bg-cream-50 hover:bg-cream-100 border border-gray-200 rounded-2xl px-5 py-4 text-clay-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-gray-400 font-medium text-lg"
                                            placeholder="e.g. My Professional LinkedIn Voice"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-clay-500 uppercase tracking-wider ml-1">Platform</label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    setVoiceType(VoiceType.LINKEDIN);
                                                    if (!editingVoice) setVoiceName('My LinkedIn Voice');
                                                }}
                                                disabled={hasLinkedIn && (editingVoice?.type !== VoiceType.LINKEDIN)}
                                                className={`flex-1 relative group overflow-hidden p-4 rounded-2xl border-2 transition-all duration-300 ${voiceType === VoiceType.LINKEDIN
                                                    ? 'bg-blue-50/50 border-blue-500 shadow-lg shadow-blue-500/10'
                                                    : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                                                    } ${hasLinkedIn && (editingVoice?.type !== VoiceType.LINKEDIN) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Linkedin size={28} className={voiceType === VoiceType.LINKEDIN ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'} />
                                                    <span className={`font-bold ${voiceType === VoiceType.LINKEDIN ? 'text-blue-900' : 'text-gray-500 group-hover:text-blue-700'}`}>LinkedIn</span>
                                                </div>
                                                {voiceType === VoiceType.LINKEDIN && (
                                                    <div className="absolute top-3 right-3 text-blue-500">
                                                        <Check size={16} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setVoiceType(VoiceType.TWITTER);
                                                    if (!editingVoice) setVoiceName('My Twitter Voice');
                                                }}
                                                disabled={hasTwitter && (editingVoice?.type !== VoiceType.TWITTER)}
                                                className={`flex-1 relative group overflow-hidden p-4 rounded-2xl border-2 transition-all duration-300 ${voiceType === VoiceType.TWITTER
                                                    ? 'bg-sky-50/50 border-sky-500 shadow-lg shadow-sky-500/10'
                                                    : 'bg-white border-gray-100 hover:border-sky-200 hover:bg-sky-50/30'
                                                    } ${hasTwitter && (editingVoice?.type !== VoiceType.TWITTER) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Twitter size={28} className={voiceType === VoiceType.TWITTER ? 'text-sky-600' : 'text-gray-400 group-hover:text-sky-500'} />
                                                    <span className={`font-bold ${voiceType === VoiceType.TWITTER ? 'text-sky-900' : 'text-gray-500 group-hover:text-sky-700'}`}>Twitter</span>
                                                </div>
                                                {voiceType === VoiceType.TWITTER && (
                                                    <div className="absolute top-3 right-3 text-sky-500">
                                                        <Check size={16} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-clay-500 uppercase tracking-wider ml-1">Output Language</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-clay-400">
                                                <Globe size={18} />
                                            </div>
                                            <select
                                                value={voiceLanguage}
                                                onChange={(e) => setVoiceLanguage(e.target.value)}
                                                className="w-full bg-cream-50 hover:bg-cream-100 border border-gray-200 rounded-2xl pl-11 pr-4 py-4 text-clay-900 appearance-none focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium cursor-pointer"
                                            >
                                                {LANGUAGES.map(lang => (
                                                    <option key={lang} value={lang}>{lang}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-clay-400">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Style Instructions */}
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex-1 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-clay-900">
                                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm">
                                        <Wand2 size={20} />
                                    </div>
                                    Style Instructions
                                </h3>
                                <div className="flex-1 flex flex-col space-y-2">
                                    <p className="text-sm text-clay-500">
                                        Fine-tune the output. Be specific (e.g., "Use emojis," "Be concise," "No hashtags").
                                    </p>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Enter specific style prompts here..."
                                        className="w-full flex-1 min-h-[150px] bg-cream-50 hover:bg-cream-100 border border-gray-200 rounded-2xl px-5 py-4 text-base text-clay-800 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 resize-none leading-relaxed placeholder:text-gray-400 transition-all"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Training Samples (Expanded) */}
                        <div className="flex flex-col h-full">
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-clay-900">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                                        <FileText size={20} />
                                    </div>
                                    Training Knowledge Base
                                </h3>

                                <p className="text-sm text-clay-500 mb-6 leading-relaxed">
                                    Add 3-5 examples of your best writing. The AI will analyze these to mimic your unique voice.
                                </p>

                                {/* Input Tabs/Area */}
                                <div className="space-y-6">
                                    {/* Text Input Area */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-bold text-clay-500 uppercase tracking-wider">Paste Content</label>
                                            <span className="text-xs text-clay-400">Blog posts, tweets, captions</span>
                                        </div>
                                        <textarea
                                            value={newSampleText}
                                            onChange={(e) => setNewSampleText(e.target.value)}
                                            placeholder="Paste your text example here..."
                                            className="w-full h-40 bg-cream-50 hover:bg-cream-100 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-clay-800 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 resize-none placeholder:text-gray-400 transition-all"
                                        />
                                        <button
                                            onClick={handleAddTextSample}
                                            disabled={!newSampleText.trim()}
                                            className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-clay-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Plus size={18} />
                                            Add as Text Sample
                                        </button>
                                    </div>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs">
                                            <span className="px-3 bg-white text-gray-400 uppercase tracking-wider font-bold">Or Upload Files</span>
                                        </div>
                                    </div>

                                    {/* File Upload Area */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all group"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            multiple
                                            onChange={handleFileUpload}
                                        />
                                        <div className="w-14 h-14 rounded-full bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-400 group-hover:text-rose-600 transition-colors">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-base text-clay-800 font-bold group-hover:text-rose-700 transition-colors">Click to upload documents</p>
                                        <p className="text-sm text-gray-400 mt-1">Supports PDF, TXT, DOCX (Max 10MB)</p>
                                    </div>
                                </div>

                                {/* Sample List (Scrollable if many) */}
                                <div className="mt-8 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">
                                        Attached Samples ({samples.length})
                                    </h4>

                                    {samples.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 italic border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                            No samples added yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {samples.map(sample => (
                                                <div key={sample.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-rose-200 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className={`min-w-10 h-10 rounded-xl flex items-center justify-center ${sample.type === 'file' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                                            {sample.type === 'file' ? <FileText size={20} /> : <NotepadTextIcon size={20} />}
                                                        </div>
                                                        <div className="truncate pr-4">
                                                            <p className="text-sm font-bold text-clay-900 truncate w-full">
                                                                {sample.type === 'file' ? sample.filename : (sample.content.substring(0, 50) + (sample.content.length > 50 ? '...' : ''))}
                                                            </p>
                                                            <p className="text-xs text-clay-400 mt-0.5 uppercase tracking-wide font-medium">
                                                                {sample.type === 'file' ? 'File Upload' : 'Text Snippet'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveSample(sample.id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                        title="Remove sample"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFB] text-clay-900 p-6 md:p-12 font-sans selection:bg-gold-300/30 overflow-y-auto">
            {/* Ambient Background */}
            <div className="fixed top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-purple-200/20 to-transparent blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-rose-200/20 to-transparent blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 pb-20">
                <div className="mb-12 flex items-end justify-between">
                    <div>
                        <button
                            onClick={onBack}
                            className="group flex items-center gap-2 text-clay-500 hover:text-clay-900 mb-6 transition-colors px-4 py-2 hover:bg-white/80 rounded-full w-fit border border-transparent hover:border-gray-200 cursor-pointer"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Dashboard</span>
                        </button>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-clay-900 tracking-tight mb-4">
                            Voice & Persona Lab
                        </h1>
                        <p className="text-xl text-clay-500 max-w-2xl leading-relaxed">
                            Create, clone, and manage your AI voice personas to ensure brand consistency.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Add New Card */}
                    <button
                        onClick={handleCreateNew}
                        disabled={allProfilesCreated}
                        className={`group relative h-80 rounded-[2.5rem] border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-white/60 transition-all text-center flex flex-col items-center justify-center p-8 overflow-hidden ${allProfilesCreated ? 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-transparent' : 'cursor-pointer'}`}
                    >
                        {!allProfilesCreated && <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-purple-50/0 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />}

                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-full bg-white group-hover:bg-purple-50 shadow-sm border border-gray-100 flex items-center justify-center mb-6 text-purple-300 group-hover:text-purple-600 transition-all group-hover:scale-110 duration-300">
                                <Plus size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-clay-400 group-hover:text-purple-600 transition-colors">
                                {allProfilesCreated ? 'Limit Reached' : 'New Persona'}
                            </h3>
                            <p className="text-sm font-medium text-clay-400 mt-2 px-8">
                                {allProfilesCreated ? 'You have created all available voice profiles.' : 'Train a new persona with text or file samples'}
                            </p>
                        </div>
                    </button>

                    {/* Existing Voices */}
                    {voices.map(voice => (
                        <div key={voice.id} className="group relative h-80 bg-white border border-gray-100 rounded-[2.5rem] p-8 overflow-hidden hover:border-purple-200 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            {/* Background Gradient Blob */}
                            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${voice.type === VoiceType.TWITTER ? 'bg-sky-100/50' : 'bg-blue-100/50'}`} />

                            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteVoice(voice.id); }}
                                    className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="relative h-full flex flex-col">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105 duration-300 shadow-sm
                                    ${voice.type === VoiceType.TWITTER ? 'bg-sky-50 text-sky-500' : 'bg-blue-50 text-blue-500'}`}>
                                    {getVoiceIcon(voice.type)}
                                </div>

                                <h3 className="text-2xl font-bold mb-3 text-clay-900 group-hover:text-purple-900 transition-colors">{voice.name}</h3>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-clay-500 uppercase tracking-wide">
                                        {voice.samples.length} Samples
                                    </span>
                                    {(voice.customInstructions?.length || 0) > 0 && (
                                        <span className="bg-green-50 border border-green-100 px-3 py-1 rounded-lg text-xs font-bold text-green-600 uppercase tracking-wide">
                                            Trained
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-clay-500 line-clamp-2 mb-auto leading-relaxed">
                                    {voice.customInstructions || <span className="italic opacity-50">No specific instructions set.</span>}
                                </p>

                                <button
                                    onClick={() => handleEdit(voice)}
                                    className="mt-6 w-full py-3 bg-gray-50 hover:bg-purple-50 rounded-xl text-sm font-bold text-clay-600 hover:text-purple-600 transition-all border border-gray-100 hover:border-purple-100 flex items-center justify-center gap-2 group/btn"
                                >
                                    Edit Configuration
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper icon component
const NotepadTextIcon = ({ size }: { size: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M8 2v4" /><path d="M12 2v4" /><path d="M16 2v4" /><rect width="16" height="18" x="4" y="4" rx="2" /><path d="M8 10h6" /><path d="M8 14h8" /><path d="M8 18h5" />
    </svg>
);
