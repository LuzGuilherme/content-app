export enum NodeType {
  VIDEO_SOURCE = 'VIDEO_SOURCE',
  BLOG_SOURCE = 'BLOG_SOURCE',
  LINKEDIN_SOURCE = 'LINKEDIN_SOURCE',
  FILE_SOURCE = 'FILE_SOURCE',
  LLM_AGENT = 'LLM_AGENT',
}

export interface Position {
  x: number;
  y: number;
}

export interface BaseNodeData {
  id: string;
  type: NodeType;
  position: Position;
  dimensions?: { width: number; height: number };
}

export interface VideoNodeData extends BaseNodeData {
  type: NodeType.VIDEO_SOURCE;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  transcript?: string;
  isTranscribing: boolean;
  transcriptionError?: string;
}

export interface BlogNodeData extends BaseNodeData {
  type: NodeType.BLOG_SOURCE;
  url: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  isFetching: boolean;
  fetchError?: string;
}

export interface LinkedInNodeData extends BaseNodeData {
  type: NodeType.LINKEDIN_SOURCE;
  url: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  isFetching: boolean;
  fetchError?: string;
}

export interface FileNodeData extends BaseNodeData {
  type: NodeType.FILE_SOURCE;
  fileName: string;
  fileType: string;
  content?: string;
  isProcessing: boolean;
  error?: string;
}

export interface AgentNodeData extends BaseNodeData {
  type: NodeType.LLM_AGENT;
  model: string;
  name: string;
  systemPrompt?: string;
  voiceId?: string;
}

export type NodeData = VideoNodeData | AgentNodeData | BlogNodeData | LinkedInNodeData | FileNodeData;

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  nodeId: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: number;
}

export interface NodeChatState {
  activeSessionId: string | null;
  sessions: ChatSession[];
}

export interface CanvasMetadata {
  id: string;
  name: string;
  updated_at: string;
}

// --- Voice & Persona Lab Types ---

export enum VoiceType {
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
  // Future types: BLOG, CASUAL, PROFESSIONAL
}

export interface VoiceSample {
  id: string;
  type: 'text' | 'file';
  content: string; // The text content or file name/metadata
  filename?: string;
}

export interface VoicePersona {
  id: string;
  name: string;
  type: VoiceType;
  language: string; // ISO code or full name, e.g., 'English', 'Spanish'
  samples: VoiceSample[];
  customInstructions?: string; // "Input prompts"
  createdAt: number;
}

// --- Pipelines ---

export enum PipelineType {
  LINKEDIN_VIDEO_TO_POSTS = 'LINKEDIN_VIDEO_TO_POSTS',
  TWITTER_THREAD_GENERATOR = 'TWITTER_THREAD_GENERATOR',
}

export interface PipelineTemplate {
  id: string;
  type: PipelineType;
  name: string;
  description: string;
  icon: string;
}

export interface PipelineSource {
  type: 'video' | 'blog' | 'text' | 'linkedin' | 'file';
  value: string;
}

export interface PipelineConfig {
  pipelineId: string;
  inputs: {
    postCount: number;
    sources: PipelineSource[];
    [key: string]: any;
  };
  voiceId?: string; // Optional, can be auto-selected
  model: string;
}

export interface PipelineResult {
  content: string;
  timestamp: number;
}
