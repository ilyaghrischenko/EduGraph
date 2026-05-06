// src/pages/StudentSearchPage.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { NodeObject } from 'react-force-graph-2d';
import { Link } from 'react-router-dom';
import { usersApi } from '../api/usersApi';
import type { FolderResponse, SearchDocumentResponse } from '../types/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GraphNode extends NodeObject {
    id: string;
    title: string;
    url?: string;
    type: 'root' | 'folder' | 'document' | 'trunk';
}

interface GraphLink {
    source: string;
    target: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

type PageState = 'foldersLoading' | 'folders' | 'loading' | 'results' | 'empty' | 'error' | 'foldersError';

// ─── Constants ───────────────────────────────────────────────────────────────

const LOADING_STEPS = [
    { label: 'Отримуємо матеріали', duration: 3000 },
    { label: 'Аналізуємо зміст', duration: 5000 },
    { label: 'Знаходимо релевантні документи', duration: 5000 },
    { label: 'Будуємо граф', duration: 99999 },
];

const NODE_COLOR = '#4fffb0';
const NODE_HOVER_COLOR = '#67e8f9';
const LINK_COLOR = 'rgba(79, 255, 176, 0.18)';
const BG_COLOR = '#0a0d14';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFullGraph(docs: SearchDocumentResponse[]): GraphData {
    const nodes: GraphNode[] = docs.map((doc, i) => ({
        id: `doc:${i}`,
        title: doc.title,
        url: doc.url,
        type: 'document',
    }));

    const links: GraphLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            links.push({ source: nodes[i].id, target: nodes[j].id });
        }
    }

    return { nodes, links };
}

function buildFoldersGraph(folders: FolderResponse[]): GraphData {
    const root: GraphNode = {
        id: 'root:g7',
        title: 'G7',
        type: 'root',
    };

    const nodes: GraphNode[] = [
        root,
        ...folders.map((folder) => ({
            id: `trunk:${folder.id}`,
            title: '',
            type: 'trunk' as const,
        })),
        ...(folders.length > 0 ? [{
            id: 'trunk:tail',
            title: '',
            type: 'trunk' as const,
        }] : []),
        ...folders.map((folder) => ({
            id: `folder:${folder.id}`,
            title: folder.name,
            url: folder.link,
            type: 'folder' as const,
        })),
    ];

    const links: GraphLink[] = [];
    folders.forEach((folder, index) => {
        const trunkId = `trunk:${folder.id}`;
        links.push({
            source: index === 0 ? root.id : `trunk:${folders[index - 1].id}`,
            target: trunkId,
        });
        links.push({
            source: trunkId,
            target: `folder:${folder.id}`,
        });
    });

    if (folders.length > 0) {
        links.push({
            source: `trunk:${folders[folders.length - 1].id}`,
            target: 'trunk:tail',
        });
    }

    return { nodes, links };
}

function applyFoldersLayout(graph: GraphData, width: number, height: number): GraphData {
    const root = graph.nodes.find((node) => node.type === 'root');
    const folders = graph.nodes.filter((node) => node.type === 'folder');
    const trunkNodes = graph.nodes.filter((node) => node.type === 'trunk');
    const rootY = -Math.min(260, height * 0.24);
    const firstBranchY = rootY + 150;
    const branchGap = Math.min(62, Math.max(46, (height * 0.55) / Math.max(folders.length, 1)));
    const branchOffset = Math.min(280, Math.max(190, width * 0.16));

    const positionedFolders = folders.map((node, index) => {
        const side = index % 2 === 0 ? 1 : -1;
        const x = side * branchOffset;
        const y = firstBranchY + index * branchGap;

        return { ...node, x, y, fx: x, fy: y };
    });

    const positionedTrunkNodes = trunkNodes.map((node, index) => {
        const y = firstBranchY + Math.min(index, folders.length) * branchGap;

        return { ...node, x: 0, y, fx: 0, fy: y };
    });

    return {
        nodes: [
            ...(root ? [{ ...root, x: 0, y: rootY, fx: 0, fy: rootY }] : []),
            ...positionedTrunkNodes,
            ...positionedFolders,
        ],
        links: graph.links,
    };
}

// ─── Loading Overlay ─────────────────────────────────────────────────────────

interface LoadingOverlayProps {
    currentStep: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ currentStep }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
         style={{ background: 'radial-gradient(ellipse at center, #0f1520 0%, #0a0d14 70%)' }}>

        {/* Orbital spinner */}
        <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 rounded-full"
                 style={{ border: '1px solid rgba(79,255,176,0.15)' }} />
            <div className="absolute inset-0 rounded-full animate-spin"
                 style={{
                     border: '2px solid transparent',
                     borderTopColor: '#4fffb0',
                     animationDuration: '1.4s',
                 }} />
            <div className="absolute inset-3 rounded-full animate-spin"
                 style={{
                     border: '1.5px solid transparent',
                     borderTopColor: '#67e8f9',
                     animationDuration: '2.1s',
                     animationDirection: 'reverse',
                 }} />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full"
                     style={{
                         background: '#4fffb0',
                         boxShadow: '0 0 12px 4px rgba(79,255,176,0.6)',
                         animation: 'pulse 1.5s ease-in-out infinite',
                     }} />
            </div>
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-3 min-w-[280px]">
            {LOADING_STEPS.map((step, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                const isPending = i > currentStep;

                return (
                    <div key={i} className="flex items-center gap-3 transition-all duration-500"
                         style={{ opacity: isPending ? 0.3 : 1 }}>
                        {/* Icon */}
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {isDone ? (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="#4fffb0" strokeWidth="1.5" />
                                    <path d="M5 8l2 2 4-4" stroke="#4fffb0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : isActive ? (
                                <div className="w-2 h-2 rounded-full"
                                     style={{
                                         background: '#4fffb0',
                                         boxShadow: '0 0 6px 2px rgba(79,255,176,0.5)',
                                         animation: 'pulse 1s ease-in-out infinite',
                                     }} />
                            ) : (
                                <div className="w-2 h-2 rounded-full"
                                     style={{ background: 'rgba(255,255,255,0.2)' }} />
                            )}
                        </div>

                        {/* Label */}
                        <span className="text-sm"
                              style={{
                                  fontFamily: "'DM Sans', sans-serif",
                                  color: isDone ? '#4fffb0' : isActive ? '#e2e8f0' : '#64748b',
                                  letterSpacing: '0.01em',
                              }}>
              {step.label}
                            {isActive && (
                                <span style={{ color: '#4fffb0' }}>
                  <DotDotDot />
                </span>
                            )}
            </span>
                    </div>
                );
            })}
        </div>

        <p className="mt-8 text-xs" style={{ color: '#334155', fontFamily: "'DM Sans', sans-serif" }}>
            це може зайняти до 30–60 секунд
        </p>
    </div>
);

// Animated ellipsis
const DotDotDot: React.FC = () => {
    const [dots, setDots] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setDots(d => (d + 1) % 4), 400);
        return () => clearInterval(id);
    }, []);
    return <span>{'.'.repeat(dots)}&nbsp;</span>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const StudentSearchPage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [pageState, setPageState] = useState<PageState>('foldersLoading');
    const [loadingStep, setLoadingStep] = useState(0);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const hoveredNodeRef = useRef<GraphNode | null>(null);
    const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);
    const visibleGraphData = useMemo(() => {
        if (!graphData || pageState !== 'folders' || dimensions.width <= 0 || dimensions.height <= 0) {
            return graphData;
        }

        return applyFoldersLayout(graphData, dimensions.width, dimensions.height);
    }, [dimensions.height, dimensions.width, graphData, pageState]);

    // Track container size
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            setDimensions({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
        });
        observer.observe(el);
        // initial
        setDimensions({ width: el.clientWidth, height: el.clientHeight });
        return () => observer.disconnect();
    }, []);

    const clearStepTimers = useCallback(() => {
        stepTimersRef.current.forEach(clearTimeout);
        stepTimersRef.current = [];
    }, []);

    const startLoadingSteps = useCallback(() => {
        setLoadingStep(0);
        clearStepTimers();
        let elapsed = 0;
        LOADING_STEPS.forEach((_, i) => {
            if (i === 0) return;
            elapsed += LOADING_STEPS[i - 1].duration;
            const t = setTimeout(() => setLoadingStep(i), elapsed);
            stepTimersRef.current.push(t);
        });
    }, [clearStepTimers]);

    const fetchFolders = useCallback(async () => {
        setPageState('foldersLoading');
        setError(null);
        try {
            const folders = await usersApi.getFolders();
            setGraphData(buildFoldersGraph(folders));
            setPageState('folders');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Помилка запиту');
            setPageState('foldersError');
        }
    }, []);

    const handleSearch = useCallback(async () => {
        if (!query.trim() || pageState === 'loading') return;

        setPageState('loading');
        setError(null);
        setGraphData(null);
        startLoadingSteps();

        try {
            const docs = await usersApi.searchDocuments(query.trim());
            clearStepTimers();
            if (docs.length === 0) {
                setPageState('empty');
            } else {
                setGraphData(buildFullGraph(docs));
                setPageState('results');
            }
        } catch (err: unknown) {
            clearStepTimers();
            setError(err instanceof Error ? err.message : 'Помилка запиту');
            setPageState('error');
        }
    }, [clearStepTimers, pageState, query, startLoadingSteps]);

    useEffect(() => () => clearStepTimers(), [clearStepTimers]);
    useEffect(() => {
        let ignore = false;

        usersApi.getFolders()
            .then((folders) => {
                if (ignore) return;
                setGraphData(buildFoldersGraph(folders));
                setPageState('folders');
            })
            .catch((err: unknown) => {
                if (ignore) return;
                setError(err instanceof Error ? err.message : 'Помилка запиту');
                setPageState('foldersError');
            });

        return () => { ignore = true; };
    }, []);

    // Spread nodes out: increase repulsion and link distance
    useEffect(() => {
        if (!fgRef.current || !visibleGraphData) return;
        fgRef.current.d3Force('charge').strength(pageState === 'folders' ? -520 : -350);
        fgRef.current.d3Force('link').distance(pageState === 'folders' ? 180 : 120);
        fgRef.current.d3ReheatSimulation();
    }, [pageState, visibleGraphData]);

    // ── Graph callbacks ────────────────────────────────────────────────────────

    const handleNodeClick = useCallback((node: NodeObject) => {
        const n = node as GraphNode;
        if (n.url) window.open(n.url, '_blank', 'noopener,noreferrer');
    }, []);

    const handleNodeHover = useCallback((node: NodeObject | null) => {
        const n = node ? (node as GraphNode) : null;
        hoveredNodeRef.current = n;
        setHoveredNode(n);
        document.body.style.cursor = n?.url ? 'pointer' : 'default';
    }, []);

    // Custom canvas node painter — uses ref to avoid re-creating on every hover
    const paintNode = useCallback(
        (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const n = node as GraphNode;
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const isHovered = hoveredNodeRef.current?.id === n.id;
            const isRoot = n.type === 'root';
            const isFolder = n.type === 'folder';
            if (n.type === 'trunk') return;

            const r = isRoot ? 20 : isFolder ? 15 : isHovered ? 8 : 5.5;

            // Glow halo
            const glowR = isRoot || isFolder ? r * 2.6 : r * 5;
            const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            grd.addColorStop(0, isHovered ? 'rgba(103,232,249,0.45)' : 'rgba(79,255,176,0.25)');
            grd.addColorStop(1, 'rgba(79,255,176,0)');
            ctx.beginPath();
            ctx.arc(x, y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            ctx.fillStyle = isRoot
                ? 'rgba(79,255,176,0.16)'
                : isFolder
                    ? 'rgba(255,255,255,0.05)'
                    : isHovered ? NODE_HOVER_COLOR : NODE_COLOR;
            ctx.strokeStyle = isHovered ? NODE_HOVER_COLOR : isRoot || isFolder ? 'rgba(79,255,176,0.55)' : 'rgba(255,255,255,0.25)';
            ctx.lineWidth = isRoot || isFolder ? 1.5 : 1;

            if (isRoot || isFolder) {
                const w = isRoot ? 92 : 120;
                const h = isRoot ? 40 : 44;
                const bx = x - w / 2;
                const by = y - h / 2;
                const br = 13;
                ctx.beginPath();
                ctx.moveTo(bx + br, by);
                ctx.lineTo(bx + w - br, by);
                ctx.arcTo(bx + w, by, bx + w, by + h, br);
                ctx.lineTo(bx + w, by + h - br);
                ctx.arcTo(bx + w, by + h, bx + w - br, by + h, br);
                ctx.lineTo(bx + br, by + h);
                ctx.arcTo(bx, by + h, bx, by + h - br, br);
                ctx.lineTo(bx, by + br);
                ctx.arcTo(bx, by, bx + br, by, br);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            if (isRoot || isFolder) {
                const label = n.title.length > 16 ? n.title.slice(0, 16) + '…' : n.title;
                ctx.font = `${isRoot ? 14 : 12}px 'DM Sans', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isHovered ? NODE_HOVER_COLOR : '#e2e8f0';
                ctx.fillText(label, x, y);
                return;
            }

            // Core circle
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? NODE_HOVER_COLOR : NODE_COLOR;
            ctx.fill();

            // Ring
            ctx.strokeStyle = isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label — always show when hovered, or at high zoom
            const showLabel = isHovered || globalScale > 2;
            if (showLabel) {
                const fontSize = Math.max(9, 11 / globalScale);
                const label = n.title.length > 30 ? n.title.slice(0, 30) + '…' : n.title;
                ctx.font = `${fontSize}px 'DM Sans', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                const tw = ctx.measureText(label).width;
                const pad = 4 / globalScale;
                const bh = fontSize + pad * 2;
                const by = y + r + 5 / globalScale;

                // Pill background
                ctx.fillStyle = 'rgba(10,13,20,0.88)';
                const bx = x - tw / 2 - pad;
                const bw = tw + pad * 2;
                const br = bh / 2;
                ctx.beginPath();
                ctx.moveTo(bx + br, by);
                ctx.lineTo(bx + bw - br, by);
                ctx.arcTo(bx + bw, by, bx + bw, by + bh, br);
                ctx.lineTo(bx + bw, by + bh - br);
                ctx.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
                ctx.lineTo(bx + br, by + bh);
                ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
                ctx.lineTo(bx, by + br);
                ctx.arcTo(bx, by, bx + br, by, br);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = isHovered ? NODE_HOVER_COLOR : 'rgba(226,232,240,0.9)';
                ctx.fillText(label, x, by + pad);
            }
        },
        [],
    );

    // Clickable area matches visual node size
    const paintPointerArea = useCallback(
        (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
            const n = node as GraphNode;
            if (n.type === 'trunk') return;

            if (n.type === 'root' || n.type === 'folder') {
                const w = n.type === 'root' ? 92 : 120;
                const h = n.type === 'root' ? 40 : 44;
                ctx.fillStyle = color;
                ctx.fillRect((node.x ?? 0) - w / 2, (node.y ?? 0) - h / 2, w, h);
                return;
            }
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, 10, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        },
        [],
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            className="flex flex-col h-screen overflow-hidden select-none"
            style={{ background: BG_COLOR, fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <header
                className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <Link
                    to="/"
                    className="font-bold text-lg tracking-tight"
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        color: '#4fffb0',
                        letterSpacing: '-0.02em',
                    }}
                >
                    EduGraph
                </Link>
                <div className="flex items-center gap-2">
          <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                  background: 'rgba(79,255,176,0.1)',
                  color: '#4fffb0',
                  border: '1px solid rgba(79,255,176,0.2)',
                  fontFamily: "'DM Sans', sans-serif",
              }}
          >
            Студент
          </span>
                </div>
            </header>

            {/* ── Search bar ────────────────────────────────────────────────────── */}
            <div
                className="flex-shrink-0 px-6 pt-6 pb-5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
                <div className="max-w-2xl mx-auto">
                    <p
                        className="text-center text-xs uppercase tracking-widest mb-3"
                        style={{ color: 'rgba(79,255,176,0.5)', fontFamily: "'Syne', sans-serif" }}
                    >
                        Пошук знань
                    </p>
                    <div className="relative flex gap-2">
                        <div className="flex-1 relative">
                            {/* Glow behind input */}
                            <div
                                className="absolute inset-0 rounded-xl pointer-events-none"
                                style={{
                                    boxShadow: pageState === 'loading'
                                        ? '0 0 0 1px rgba(79,255,176,0.4), 0 0 20px rgba(79,255,176,0.08)'
                                        : '0 0 0 1px rgba(255,255,255,0.08)',
                                    transition: 'box-shadow 0.3s',
                                }}
                            />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Що хочете знайти? Наприклад: алгоритми сортування..."
                                disabled={pageState === 'loading'}
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none disabled:opacity-50"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#e2e8f0',
                                    fontFamily: "'DM Sans', sans-serif",
                                    caretColor: '#4fffb0',
                                }}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={!query.trim() || pageState === 'loading'}
                            className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{
                                background: 'rgba(79,255,176,0.12)',
                                border: '1px solid rgba(79,255,176,0.3)',
                                color: '#4fffb0',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                            onMouseEnter={(e) => {
                                if (!e.currentTarget.disabled)
                                    e.currentTarget.style.background = 'rgba(79,255,176,0.22)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(79,255,176,0.12)';
                            }}
                        >
                            {pageState === 'loading' ? (
                                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            )}
                            Знайти
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main area ─────────────────────────────────────────────────────── */}
            <div ref={containerRef} className="flex-1 relative min-h-0">

                {/* ── Idle state ─────────────────────────────────────────────────── */}
                {pageState === 'foldersLoading' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif" }}>
                            Завантаження папок…
                        </p>
                    </div>
                )}

                {/* ── Loading overlay ────────────────────────────────────────────── */}
                {pageState === 'loading' && <LoadingOverlay currentStep={loadingStep} />}

                {/* ── Error state ────────────────────────────────────────────────── */}
                {(pageState === 'error' || pageState === 'foldersError') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div
                            className="px-5 py-4 rounded-xl text-sm max-w-md text-center"
                            style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#fca5a5',
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        >
                            {error}
                        </div>
                        <button
                            onClick={pageState === 'foldersError' ? fetchFolders : handleSearch}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: '#4fffb0', background: 'rgba(79,255,176,0.08)', border: '1px solid rgba(79,255,176,0.2)' }}
                        >
                            Спробувати знову
                        </button>
                    </div>
                )}

                {/* ── Empty results ──────────────────────────────────────────────── */}
                {pageState === 'empty' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif" }}>
                            Документів за запитом не знайдено
                        </p>
                    </div>
                )}

                {/* ── Hovered node info strip ────────────────────────────────────── */}
                {(pageState === 'folders' || pageState === 'results') && hoveredNode && hoveredNode.url && (
                    <div
                        className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-sm flex items-center gap-2 pointer-events-none"
                        style={{
                            background: 'rgba(10,13,20,0.9)',
                            border: '1px solid rgba(79,255,176,0.25)',
                            color: '#e2e8f0',
                            fontFamily: "'DM Sans', sans-serif",
                            maxWidth: '80%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <span style={{ color: '#4fffb0', flexShrink: 0 }}>◉</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{hoveredNode.title}</span>
                        <span
                            className="ml-1 flex-shrink-0 text-xs"
                            style={{ color: 'rgba(79,255,176,0.5)' }}
                        >
              — клікніть щоб відкрити
            </span>
                    </div>
                )}

                {/* ── Node count badge ───────────────────────────────────────────── */}
                {(pageState === 'folders' || pageState === 'results') && graphData && (
                    <div
                        className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-lg text-xs"
                        style={{
                            background: 'rgba(10,13,20,0.7)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.3)',
                            fontFamily: "'DM Sans', sans-serif",
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        {pageState === 'folders'
                            ? `${graphData.nodes.filter((node) => node.type === 'folder').length} папок`
                            : `${graphData.nodes.length} документів · ${graphData.links.length} зв'язків`}
                    </div>
                )}

                {/* ── Force Graph ────────────────────────────────────────────────── */}
                {(pageState === 'folders' || pageState === 'results') && visibleGraphData && dimensions.width > 0 && (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={visibleGraphData}
                        width={dimensions.width}
                        height={dimensions.height}
                        backgroundColor={BG_COLOR}
                        nodeCanvasObject={paintNode}
                        nodePointerAreaPaint={paintPointerArea}
                        onNodeClick={handleNodeClick}
                        onNodeHover={handleNodeHover}
                        linkColor={() => LINK_COLOR}
                        linkHoverPrecision={5}
                        linkWidth={0.8}
                        cooldownTicks={120}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.4}
                        onEngineStop={() => {/* graph has settled */}}
                    />
                )}
            </div>

            {/* ── Global styles injection (Syne + DM Sans + pulse keyframe) ─────── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
        </div>
    );
};
