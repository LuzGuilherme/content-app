
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { VideoNode } from './components/VideoNode';
import { BlogNode } from './components/BlogNode';
import { LinkedInNode } from './components/LinkedInNode';
import { AgentNode } from './components/AgentNode';
import { ChatWindow } from './components/ChatWindow';
import { ZoomControls } from './components/ZoomControls';
import { FileNode } from './components/FileNode';
import { NodeData, NodeType, Edge, Position, ChatSession, NodeChatState, VideoNodeData, AgentNodeData, BlogNodeData, LinkedInNodeData, FileNodeData, CanvasMetadata, VoicePersona, VoiceType } from './types';
import { Auth } from './components/Auth';
import { CanvasSidebar } from './components/CanvasSidebar';
import { Toolbar } from './components/Toolbar';
import { Dashboard } from './components/Dashboard';
import { VoiceLab } from './components/VoiceLab';
import { PipelinesView } from './components/PipelinesView';

// Constants
const GRID_SIZE = 20;

function App() {
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [chats, setChats] = useState<Record<string, NodeChatState>>({});
    const [graphId, setGraphId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [session, setSession] = useState<any>(null);

    // View State
    const [currentView, setCurrentView] = useState<'dashboard' | 'canvas' | 'voice-lab' | 'pipelines'>('dashboard');
    const [voices, setVoices] = useState<VoicePersona[]>([]);

    // Canvas State
    const [canvasList, setCanvasList] = useState<CanvasMetadata[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [connectionStartId, setConnectionStartId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
    const [panning, setPanning] = useState({ x: 0, y: 0 });
    const [isDraggingNode, setIsDraggingNode] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const dragStartRef = useRef<Position>({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    // Chat State
    const [activeChatNodeId, setActiveChatNodeId] = useState<string | null>(null);

    // Zoom State
    const [zoom, setZoom] = useState(1);

    // --- Global Event Listeners for robust drag handling ---
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDraggingNode || isPanning) {
                setIsDraggingNode(false);
                setIsPanning(false);
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDraggingNode, isPanning]);

    // --- Supabase Persistence ---

    // Session management
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                setNodes([]);
                setEdges([]);
                setChats({});
                setGraphId(null);
                setIsLoaded(false);
                setCurrentView('dashboard');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load initial data and canvas list
    useEffect(() => {
        if (!session) return;

        const fetchCanvasList = async () => {
            const { data, error } = await supabase
                .from('saved_graphs')
                .select('id, name, updated_at')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false });

            if (data) {
                setCanvasList(data);
                if (!graphId && data.length > 0) {
                    setGraphId(data[0].id);
                } else if (!graphId && data.length === 0) {
                    createNewCanvas("My First Canvas");
                }
            } else if (error) {
                console.error('Error loading canvas list:', error);
                if (error.code === '42703') {
                    alert("Database Error: The 'name' column is missing. Please run the migration in Supabase.");
                }
            }
        };

        fetchCanvasList();
    }, [session]);

    // Load graph data when graphId changes
    useEffect(() => {
        if (!session || !graphId) return;

        const loadGraph = async () => {
            // Reset state while loading
            setIsLoaded(false);

            const { data, error } = await supabase
                .from('saved_graphs')
                .select('*')
                .eq('id', graphId)
                .single();

            if (data) {
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setChats(data.chats || {});
            } else if (error) {
                console.error('Error loading graph:', error);
            }
            setIsLoaded(true);
        };

        loadGraph();
    }, [session, graphId]);

    const createNewCanvas = async (name: string) => {
        if (!session) return;

        const { data, error } = await supabase
            .from('saved_graphs')
            .insert({
                user_id: session.user.id,
                name: name,
                nodes: [],
                edges: [],
                chats: {}
            })
            .select()
            .single();

        if (data) {
            setCanvasList(prev => [data, ...prev]);
            setGraphId(data.id);
            // State will be cleared by the loadGraph effect mostly, but we can reset here for speed
            setNodes([]);
            setEdges([]);
            setChats({});
            setIsSidebarOpen(false);
        } else if (error) {
            console.error('Error creating canvas:', error);
            alert(`Failed to create canvas: ${error.message}`);
        }
    };

    const switchCanvas = (id: string) => {
        if (id === graphId) return;
        // Save current changes first is handled by debounced effect? 
        // Actually, debounced effect runs on change. If we switch immediately, the last change might not be saved if it was < 1s ago.
        // For safety we could force save, but for now rely on debounce or just accept minor race condition. 
        // Ideally we force save effectively.
        setGraphId(id);
        setIsSidebarOpen(false);
    };

    const deleteCanvas = async (id: string) => {
        if (!session) return;

        const { error } = await supabase
            .from('saved_graphs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting canvas:', error);
            alert(`Failed to delete canvas: ${error.message}`);
        } else {
            const newList = canvasList.filter(c => c.id !== id);
            setCanvasList(newList);

            // If we deleted the current canvas, switch to another one
            if (id === graphId) {
                setGraphId(null); // Clear first
                if (newList.length > 0) {
                    setGraphId(newList[0].id);
                } else {
                    createNewCanvas("My First Canvas");
                }
            }
        }
    };

    // Save on change (debounced)
    useEffect(() => {
        if (!isLoaded || !graphId) return;

        const saveGraph = async () => {
            const { error } = await supabase
                .from('saved_graphs')
                .update({
                    nodes: nodes,
                    edges: edges,
                    chats: chats,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', graphId);

            if (error) {
                console.error('Error saving graph:', error);
            }
        };

        const timeoutId = setTimeout(saveGraph, 1000); // Debounce 1s

        return () => clearTimeout(timeoutId);
    }, [nodes, edges, chats, graphId, isLoaded]);

    // --- Actions ---

    const addNode = (type: NodeType) => {
        const id = uuidv4();
        // Calculate center position accounting for zoom and pan
        const centerX = (window.innerWidth / 2 - panning.x) / zoom - 150;
        const centerY = (window.innerHeight / 2 - panning.y) / zoom - 100;

        const position = {
            x: centerX,
            y: centerY
        };

        let newNode: NodeData;

        if (type === NodeType.VIDEO_SOURCE) {
            newNode = {
                id, type, position,
                url: '',
                isTranscribing: false
            } as VideoNodeData;
        } else if (type === NodeType.BLOG_SOURCE) {
            newNode = {
                id, type, position,
                url: '',
                isFetching: false
            } as BlogNodeData;
        } else if (type === NodeType.LINKEDIN_SOURCE) {
            newNode = {
                id, type, position,
                url: '',
                isFetching: false
            } as LinkedInNodeData;
        } else if (type === NodeType.FILE_SOURCE) {
            newNode = {
                id, type, position,
                fileName: '',
                fileType: '',
                isProcessing: false
            } as FileNodeData;
        } else {
            newNode = {
                id, type, position,
                name: 'Content Generator',
                model: 'gemini-3-flash-preview',
            } as AgentNodeData;

            // Initialize chat session
            setChats(prev => ({
                ...prev,
                [id]: { activeSessionId: null, sessions: [] }
            }));
        }

        setNodes([...nodes, newNode]);
    };

    const deleteNode = (id: string) => {
        setNodes(nodes.filter(n => n.id !== id));
        setEdges(edges.filter(e => e.sourceId !== id && e.targetId !== id));
        if (activeChatNodeId === id) setActiveChatNodeId(null);
    };

    const updateNode = (id: string, updates: Partial<NodeData>) => {
        setNodes(prevNodes => prevNodes.map(n => n.id === id ? { ...n, ...updates } : n) as NodeData[]);
    };

    const createNewChatSession = (nodeId: string) => {
        const newSessionId = uuidv4();
        const newSession: ChatSession = {
            id: newSessionId,
            nodeId,
            title: 'New Chat',
            messages: [],
            model: 'gemini-3-flash-preview', // Default
            createdAt: Date.now()
        };

        setChats(prev => {
            const nodeState = prev[nodeId] || { activeSessionId: null, sessions: [] };

            // Safety check and migration for legacy data
            let currentSessions: ChatSession[] = [];

            if (Array.isArray((nodeState as any).sessions)) {
                currentSessions = (nodeState as any).sessions;
            } else if (Array.isArray((nodeState as any).messages)) {
                // Migrate legacy messages to a session
                const legacySession: ChatSession = {
                    id: uuidv4(),
                    nodeId,
                    title: 'Previous Conversation',
                    messages: (nodeState as any).messages,
                    model: 'gemini-3-flash-preview',
                    createdAt: Date.now()
                };
                currentSessions = [legacySession];
            }

            return {
                ...prev,
                [nodeId]: {
                    activeSessionId: newSessionId,
                    sessions: [newSession, ...currentSessions]
                }
            };
        });
        return newSessionId;
    };

    const switchChatSession = (nodeId: string, sessionId: string) => {
        setChats(prev => ({
            ...prev,
            [nodeId]: {
                ...prev[nodeId],
                activeSessionId: sessionId
            }
        }));
    };

    const deleteChatSession = (nodeId: string, sessionId: string) => {
        setChats(prev => {
            const nodeState = prev[nodeId];
            if (!nodeState) return prev;

            const currentSessions = Array.isArray(nodeState.sessions) ? nodeState.sessions : [];
            const updatedSessions = currentSessions.filter(s => s.id !== sessionId);

            let newActiveId = nodeState.activeSessionId;
            if (nodeState.activeSessionId === sessionId) {
                // If we deleted the active session, switch to the first available one, or null
                newActiveId = updatedSessions.length > 0 ? updatedSessions[0].id : null;
            }

            return {
                ...prev,
                [nodeId]: {
                    ...nodeState,
                    sessions: updatedSessions,
                    activeSessionId: newActiveId
                }
            };
        });
    };

    const renameChatSession = (nodeId: string, sessionId: string, newTitle: string) => {
        setChats(prev => {
            const nodeState = prev[nodeId];
            if (!nodeState) return prev;

            const currentSessions = Array.isArray(nodeState.sessions) ? nodeState.sessions : [];
            const updatedSessions = currentSessions.map(s =>
                s.id === sessionId ? { ...s, title: newTitle } : s
            );

            return {
                ...prev,
                [nodeId]: {
                    ...nodeState,
                    sessions: updatedSessions
                }
            };
        });
    };

    const updateChatMessages = (nodeId: string, messages: any[], model?: string) => {
        setChats(prev => {
            const nodeState = prev[nodeId];
            if (!nodeState || !nodeState.activeSessionId) return prev;

            // Safety check
            const currentSessions = Array.isArray(nodeState.sessions) ? nodeState.sessions : [];

            const updatedSessions = currentSessions.map(s =>
                s.id === nodeState.activeSessionId
                    ? { ...s, messages, ...(model ? { model } : {}) }
                    : s
            );

            return {
                ...prev,
                [nodeId]: {
                    ...nodeState,
                    sessions: updatedSessions
                }
            };
        });
    };

    const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));

    // --- Voice Persistence ---

    // Load voices on session load
    useEffect(() => {
        if (!session) return;

        const fetchVoices = async () => {
            const { data, error } = await supabase
                .from('voice_personas')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (data) {
                // Map DB columns (snake_case) to domain model (camelCase)
                const mappedVoices: VoicePersona[] = data.map((row: any) => ({
                    id: row.id,
                    name: row.name,
                    type: row.type as VoiceType,
                    language: row.language,
                    samples: row.samples,
                    customInstructions: row.custom_instructions,
                    createdAt: new Date(row.created_at).getTime()
                }));
                setVoices(mappedVoices);
            } else if (error) {
                console.error('Error loading voices:', error);
            }
        };

        fetchVoices();
    }, [session]);

    // --- Voice Lab Handlers ---

    const handleSaveVoice = async (voice: VoicePersona) => {
        if (!session) return;

        // Optimistic update
        setVoices(prev => {
            const exists = prev.find(v => v.id === voice.id);
            if (exists) {
                return prev.map(v => v.id === voice.id ? voice : v);
            }
            return [voice, ...prev];
        });

        // Persist to Supabase
        const { error } = await supabase
            .from('voice_personas')
            .upsert({
                id: voice.id,
                user_id: session.user.id,
                name: voice.name,
                type: voice.type,
                language: voice.language,
                custom_instructions: voice.customInstructions,
                samples: voice.samples,
                created_at: new Date(voice.createdAt).toISOString()
            });

        if (error) {
            console.error('Error saving voice:', error);
            alert(`Failed to save voice: ${error.message}`);
            // Revert state? simplified here
        }
    };

    const handleDeleteVoice = async (id: string) => {
        if (!session) return;

        // Optimistic update
        setVoices(prev => prev.filter(v => v.id !== id));

        // Delete from Supabase
        const { error } = await supabase
            .from('voice_personas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting voice:', error);
            alert(`Failed to delete voice: ${error.message}`);
        }
    };

    // --- Canvas Interaction ---

    const handleMouseDown = (e: React.MouseEvent, nodeId?: string) => {
        if (connectionStartId) {
            // If clicking anywhere while connecting, likely cancelling or finishing
            if (nodeId) handleConnectEnd(nodeId);
            else setConnectionStartId(null);
            return;
        }

        dragStartRef.current = { x: e.clientX, y: e.clientY };

        if (nodeId) {
            // Dragging a node
            setSelectedNodeId(nodeId);
            setIsDraggingNode(true);
            setIsPanning(false);
        } else {
            // Panning canvas (middle click or click on bg)
            setIsDraggingNode(false);
            setIsPanning(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });

        // Safety check: if mouse buttons are released but we think we are dragging, stop.
        // This catches cases where mouseup happened outside the window or was missed.
        if (e.buttons === 0 && (isDraggingNode || isPanning)) {
            setIsDraggingNode(false);
            setIsPanning(false);
            return;
        }

        if (isDraggingNode && selectedNodeId) {
            const dx = (e.clientX - dragStartRef.current.x) / zoom;
            const dy = (e.clientY - dragStartRef.current.y) / zoom;

            const node = nodes.find(n => n.id === selectedNodeId);
            if (node) {
                updateNode(selectedNodeId, {
                    position: {
                        x: node.position.x + dx,
                        y: node.position.y + dy
                    }
                });
                dragStartRef.current = { x: e.clientX, y: e.clientY };
            }
        } else if (isPanning && !connectionStartId) {
            // Panning
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            setPanning(p => ({ x: p.x + dx, y: p.y + dy }));
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        setIsDraggingNode(false);
        setIsPanning(false);
        // Do NOT clear connectionStartId here, it requires a second click
    };

    // --- Connections ---

    const handleConnectStart = (nodeId: string) => {
        setConnectionStartId(nodeId);
    };

    const handleConnectEnd = (targetId: string) => {
        if (!connectionStartId) return;
        if (connectionStartId === targetId) return; // No self loops

        const source = nodes.find(n => n.id === connectionStartId);
        const target = nodes.find(n => n.id === targetId);

        // Enforce Source -> Agent direction logic
        const isSourceNode = [NodeType.VIDEO_SOURCE, NodeType.BLOG_SOURCE, NodeType.LINKEDIN_SOURCE, NodeType.FILE_SOURCE].includes(source?.type as NodeType);

        if (isSourceNode && target?.type === NodeType.LLM_AGENT) {
            // Allow multiple connections to this agent
            // Check if this specific connection already exists to avoid duplicates
            const exists = edges.some(e => e.sourceId === connectionStartId && e.targetId === targetId);
            if (!exists) {
                setEdges([...edges, { id: uuidv4(), sourceId: connectionStartId, targetId }]);
            }
        }

        setConnectionStartId(null);
    };

    const getConnectorPoint = (node: NodeData, type: 'source' | 'target') => {
        const { x, y } = node.position;
        const { width, height } = node.dimensions || { width: 0, height: 0 };

        if (type === 'source') {
            return { x: x + width, y: y + height / 2 }; // Right side
        } else {
            return { x: x, y: y + height / 2 }; // Left side
        }
    };

    const disconnectEdge = (edgeId: string) => {
        setEdges(prev => prev.filter(e => e.id !== edgeId));
    };

    const renderConnectionLine = (edge: Edge) => {
        const sourceNode = nodes.find(n => n.id === edge.sourceId);
        const targetNode = nodes.find(n => n.id === edge.targetId);

        if (!sourceNode || !targetNode) return null;

        const start = getConnectorPoint(sourceNode, 'source');
        const end = getConnectorPoint(targetNode, 'target');

        // Cubic Bezier control points
        const cp1 = { x: start.x + 50, y: start.y };
        const cp2 = { x: end.x - 50, y: end.y };

        // Calculate midpoint of the cubic bezier curve (t=0.5)
        const t = 0.5;
        // B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
        const midX = Math.pow(1 - t, 3) * start.x +
            3 * Math.pow(1 - t, 2) * t * cp1.x +
            3 * (1 - t) * Math.pow(t, 2) * cp2.x +
            Math.pow(t, 3) * end.x;

        const midY = Math.pow(1 - t, 3) * start.y +
            3 * Math.pow(1 - t, 2) * t * cp1.y +
            3 * (1 - t) * Math.pow(t, 2) * cp2.y +
            Math.pow(t, 3) * end.y;

        return (
            <g key={edge.id} className="group" style={{ pointerEvents: 'auto' }}>
                {/* Visible Line */}
                <path
                    d={`M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`}
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    className="pointer-events-auto"
                />

                {/* Invisible Hit Area (wider for easier hovering) */}
                <path
                    d={`M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                    className="cursor-pointer pointer-events-auto"
                />

                {/* Disconnect Button (visible on group hover) */}
                <foreignObject
                    x={midX - 16}
                    y={midY - 16}
                    width="32"
                    height="32"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
                >
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            disconnectEdge(edge.id);
                        }}
                        className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all border-2 border-white"
                        title="Delete Connection"
                    >
                        <Trash2 size={14} className="text-white" />
                    </div>
                </foreignObject>
            </g>
        );
    };

    const renderTempConnection = () => {
        if (!connectionStartId) return null;

        const sourceNode = nodes.find(n => n.id === connectionStartId);
        if (!sourceNode) return null;

        const start = getConnectorPoint(sourceNode, 'source');

        // Calculate end point based on mouse position, adjusting for pan and zoom
        // The SVG is transformed by pan/zoom, so we need to reverse that logic
        // The mousePos is in screen coordinates (clientX/clientY)
        // renderConnectionLine uses node positions which are in "canvas space"

        // However, the SVG itself has the transform applied:
        // transform: `translate(${panning.x}px, ${panning.y}px) scale(${zoom})`
        // So any point inside the SVG is already in world space IF the SVG was 1:1.
        // But since the SVG moves with the canvas, we need to calculate the point relative to the SVG's origin.

        // Actually, let's look at how nodes are positioned. 
        // Nodes are absolute positioned div's in a container that has the same transform.
        // Node { x: 100, y: 100 } appears at (100*zoom + pan.x, 100*zoom + pan.y).

        // The SVG also has the same transform.
        // So standard circle at cx=100 cy=100 inside SVG appears at screen (100*zoom + pan.x, ...).

        // So we need to convert mouse screen coordinates back to "canvas space".
        // Screen = Canvas * Zoom + Pan
        // Canvas = (Screen - Pan) / Zoom

        // Note: mousePos is clientX/Y. We need to be careful about the offset of the container if it's not at 0,0.
        // The container is "w-screen h-screen", so 0,0 is likely top-left of window.
        // But let's verify if there is any offset. The parent div is w-screen h-screen relative.
        // So clientX/Y should be correct relative to the container.

        const endX = (mousePos.x - panning.x) / zoom;
        const endY = (mousePos.y - panning.y) / zoom;

        // Simple straight line or curve to mouse
        return (
            <path
                d={`M ${start.x} ${start.y} L ${endX} ${endY}`}
                fill="none"
                stroke="#EAB308"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="pointer-events-none opacity-60"
            />
        );
    };

    // Get active chat data
    const getActiveChatData = () => {
        if (!activeChatNodeId) return null;
        const agentNode = nodes.find(n => n.id === activeChatNodeId) as AgentNodeData;

        // Find all edges where this agent is the target (inputs)
        const inputEdges = edges.filter(e => e.targetId === activeChatNodeId);

        // Get all connected source nodes
        const sourceNodes = inputEdges
            .map(edge => nodes.find(n => n.id === edge.sourceId))
            .filter(n => n !== undefined) as NodeData[];

        // Aggregate context from all sources
        let contextText = "";

        if (sourceNodes.length > 0) {
            contextText = sourceNodes.map(sourceNode => {
                let content = "";
                let title = "";
                let typeLabel = "";

                if (sourceNode?.type === NodeType.VIDEO_SOURCE) {
                    const vidNode = sourceNode as VideoNodeData;
                    title = vidNode.title || "Untitled Video";
                    content = vidNode.transcript || "[No Transcript Available]";
                    typeLabel = "VIDEO SOURCE";
                } else if (sourceNode?.type === NodeType.BLOG_SOURCE) {
                    const blogNode = sourceNode as BlogNodeData;
                    title = blogNode.title || "Untitled Blog";
                    content = blogNode.content || "[No Content Available]";
                    typeLabel = "BLOG SOURCE";
                } else if (sourceNode?.type === NodeType.LINKEDIN_SOURCE) {
                    const liNode = sourceNode as LinkedInNodeData;
                    title = liNode.title || "Untitled Post";
                    content = liNode.content || "[No Content Available]";
                    typeLabel = "LINKEDIN SOURCE";
                } else if (sourceNode?.type === NodeType.FILE_SOURCE) {
                    const fileNode = sourceNode as FileNodeData;
                    title = fileNode.fileName || "Untitled File";
                    content = fileNode.content || "[No Content Available]";
                    typeLabel = "FILE SOURCE";
                }

                return `\n\n--- [${typeLabel}]: ${title} ---\n${content}`;
            }).join("\n");
        }

        const nodeChatState = chats[activeChatNodeId] as any;

        // Handle migration from old format to new format
        let sessions: ChatSession[] = [];
        let activeSessionId = nodeChatState?.activeSessionId;

        if (nodeChatState?.sessions) {
            sessions = nodeChatState.sessions;
        } else if (nodeChatState?.messages) {
            // Migration: allow viewing old messages
            const legacySession: ChatSession = {
                id: 'legacy-session',
                nodeId: activeChatNodeId,
                title: 'Previous Conversation',
                messages: nodeChatState.messages,
                model: 'gemini-3-flash-preview',
                createdAt: Date.now()
            };
            sessions = [legacySession];
            activeSessionId = 'legacy-session';
        }

        const activeSession = sessions.find(s => s.id === activeSessionId);

        // Find active voice if one is selected
        const activeVoice = agentNode.voiceId ? voices.find(v => v.id === agentNode.voiceId) : undefined;

        return {
            agent: agentNode,
            sourceNode: sourceNodes[0] || null, // Keep primary source for backward compat if needed, or null
            contextText,
            session: activeSession,
            allSessions: sessions,
            activeSessionId: activeSessionId,
            activeVoice: activeVoice
        };
    };

    const handleOpenChat = (nodeId: string) => {
        const nodeState = chats[nodeId] as any;

        let hasSession = false;
        if (nodeState) {
            if (Array.isArray(nodeState.sessions) && nodeState.sessions.length > 0) {
                hasSession = true;
            } else if (nodeState.messages && nodeState.messages.length > 0) {
                // Component will handle legacy migration visual, but effectively we have a session
                hasSession = true;
            }
        }

        if (!hasSession) {
            const newSessionId = createNewChatSession(nodeId);
            // createNewChatSession updates state, but we also need to set active chat
            // ensure we set it active immediately so UI responds
            setActiveChatNodeId(nodeId);
            // It might be redundant if createNewChatSession sets it, but let's check createNewChatSession
            // createNewChatSession only updates 'chats' state with new session and sets it as active in that node's state
            // But we still need to set 'activeChatNodeId' state of App to show the window.
        } else {
            setActiveChatNodeId(nodeId);
        }
    };

    const chatData = getActiveChatData();

    if (!session) {
        return <Auth />;
    }

    if (currentView === 'dashboard') {
        return (
            <Dashboard
                onNavigateToCanvas={() => setCurrentView('canvas')}
                onNavigateToVoiceLab={() => setCurrentView('voice-lab')}
                onNavigateToPipelines={() => setCurrentView('pipelines')}
                userEmail={session.user.email}
                onLogout={() => supabase.auth.signOut()}
            />
        );
    }

    if (currentView === 'voice-lab') {
        return (
            <VoiceLab
                onBack={() => setCurrentView('dashboard')}
                voices={voices}
                onSaveVoice={handleSaveVoice}
                onDeleteVoice={handleDeleteVoice}
            />
        );
    }

    if (currentView === 'pipelines') {
        return (
            <PipelinesView
                onBack={() => setCurrentView('dashboard')}
                voices={voices}
            />
        );
    }

    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col font-sans">
            <CanvasSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                canvases={canvasList}
                currentCanvasId={graphId}
                onSelectCanvas={switchCanvas}
                onCreateCanvas={createNewCanvas}
                onDeleteCanvas={deleteCanvas}
            />

            {/* Toolbar */}
            <Toolbar
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                currentCanvasName={canvasList.find(c => c.id === graphId)?.name || (graphId ? "Loading..." : "Select Canvas")}
                onAddNode={addNode}
                onLogout={() => supabase.auth.signOut()}
                onNavigateToDashboard={() => setCurrentView('dashboard')}
            />

            <div className="absolute bottom-4 left-4 z-40 text-gray-500 text-xs select-none pointer-events-none">
                Use Middle Mouse or Click & Drag Bg to Pan
            </div>

            {/* Controls */}
            <ZoomControls
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
            />


            {/* Canvas Area */}
            <div
                ref={canvasRef}
                className={`flex-1 relative cursor-grab active:cursor-grabbing grid-bg ${isDraggingNode || connectionStartId ? 'select-none' : ''}`}
                onMouseDown={(e) => handleMouseDown(e)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                    backgroundSize: `${20 * zoom}px ${20 * zoom}px`
                }}
            >
                {/* SVG Layer for Edges */}
                <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
                    style={{
                        transform: `translate(${panning.x}px, ${panning.y}px) scale(${zoom})`,
                        transformOrigin: '0 0'
                    }}
                >
                    {edges.map(renderConnectionLine)}
                    {renderTempConnection()}
                </svg>

                {/* Nodes Layer */}
                <div
                    className="absolute top-0 left-0 w-full h-full transform-gpu pointer-events-none"
                    style={{
                        transform: `translate(${panning.x}px, ${panning.y}px) scale(${zoom})`,
                        transformOrigin: '0 0'
                    }}
                >
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            className="absolute pointer-events-auto"
                            style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
                            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, node.id); }}
                            onMouseUp={() => { if (connectionStartId && connectionStartId !== node.id) handleConnectEnd(node.id); }}
                        >
                            {node.type === NodeType.VIDEO_SOURCE ? (
                                <VideoNode
                                    data={node as VideoNodeData}
                                    isSelected={selectedNodeId === node.id}
                                    onUpdate={updateNode}
                                    onConnectStart={handleConnectStart}
                                    onDelete={deleteNode}
                                />
                            ) : node.type === NodeType.BLOG_SOURCE ? (
                                <BlogNode
                                    data={node as BlogNodeData}
                                    isSelected={selectedNodeId === node.id}
                                    onUpdate={updateNode}
                                    onConnectStart={handleConnectStart}
                                    onDelete={deleteNode}
                                />
                            ) : node.type === NodeType.LINKEDIN_SOURCE ? (
                                <LinkedInNode
                                    data={node as LinkedInNodeData}
                                    isSelected={selectedNodeId === node.id}
                                    onUpdate={updateNode}
                                    onConnectStart={handleConnectStart}
                                    onDelete={deleteNode}
                                />
                            ) : node.type === NodeType.FILE_SOURCE ? (
                                <FileNode
                                    data={node as FileNodeData}
                                    isSelected={selectedNodeId === node.id}
                                    onUpdate={updateNode}
                                    onConnectStart={handleConnectStart}
                                    onDelete={deleteNode}
                                    isConnected={edges.some(e => e.sourceId === node.id)}
                                />
                            ) : (
                                <AgentNode
                                    data={node as AgentNodeData}
                                    isSelected={selectedNodeId === node.id}
                                    onUpdate={updateNode}
                                    onChatOpen={handleOpenChat}
                                    onDelete={deleteNode}
                                    isConnected={edges.some(e => e.targetId === node.id)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Overlay */}
            <ChatWindow
                isOpen={!!activeChatNodeId}
                onClose={() => setActiveChatNodeId(null)}
                session={chatData?.session}
                allSessions={chatData?.allSessions || []}
                activeSessionId={chatData?.activeSessionId || null}
                nodeName={chatData?.agent?.name || "Agent"}
                defaultModel={chatData?.agent?.model || "gemini-3-flash-preview"}
                contextText={chatData?.contextText || ""}
                voices={voices}
                onUpdateMessages={updateChatMessages}
                onCreateSession={() => activeChatNodeId && createNewChatSession(activeChatNodeId)}
                onSwitchSession={(sessionId) => activeChatNodeId && switchChatSession(activeChatNodeId, sessionId)}
                onUpdateNodeModel={(model) => activeChatNodeId && updateNode(activeChatNodeId, { model })}
                onDeleteSession={(sessionId) => activeChatNodeId && deleteChatSession(activeChatNodeId, sessionId)}
                onRenameSession={(sessionId, newTitle) => activeChatNodeId && renameChatSession(activeChatNodeId, sessionId, newTitle)}
            />
        </div>
    );
}

export default App;
