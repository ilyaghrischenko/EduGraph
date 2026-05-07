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
    parentId?: string;
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
const DOCUMENT_NODE_WIDTH = 160;
const DOCUMENT_NODE_HEIGHT = 44;
const DOCUMENT_NODE_GAP = 22;
const DOCUMENT_GROUP_GAP = 56;
const ROOT_NODE_MIN_WIDTH = 92;
const FOLDER_NODE_MIN_WIDTH = 120;
const FOLDER_NODE_MAX_WIDTH = 240;
const FOLDER_NODE_HORIZONTAL_PADDING = 34;
const DOCUMENT_FOLDER_GAP = 76;
const ROOT_DOCUMENT_GAP = 44;

let textMeasureContext: CanvasRenderingContext2D | null | undefined;
const textWidthCache = new Map<string, number>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGraph(folders: FolderResponse[], docs: SearchDocumentResponse[] = []): GraphData {
    const root: GraphNode = {
        id: 'root:g7',
        title: 'G7',
        type: 'root',
    };
    const folderNodeIdByName = new Map(folders.map((folder) => [folder.name, `folder:${folder.id}`]));
    const documentNodes: GraphNode[] = docs.map((doc, index) => {
        const parentId = doc.folderName === null
            ? root.id
            : folderNodeIdByName.get(doc.folderName) ?? root.id;

        return {
            id: `doc:${index}`,
            title: doc.title,
            url: doc.url,
            parentId,
            type: 'document' as const,
        };
    });

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
        ...documentNodes,
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

    documentNodes.forEach((doc) => {
        links.push({
            source: doc.parentId ?? root.id,
            target: doc.id,
        });
    });

    return { nodes, links };
}

function fitCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;

    let fitted = text;
    while (fitted.length > 1 && ctx.measureText(`${fitted}…`).width > maxWidth) {
        fitted = fitted.slice(0, -1);
    }

    return `${fitted}…`;
}

function getDocumentLabelLines(ctx: CanvasRenderingContext2D, title: string, maxWidth: number): string[] {
    const words = title
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    const lines: string[] = [];

    words.forEach((word) => {
        if (lines.length === 0) {
            lines.push(word);
            return;
        }

        const currentLine = lines[lines.length - 1];
        const candidate = `${currentLine} ${word}`;
        if (lines.length < 2 && ctx.measureText(candidate).width > maxWidth) {
            lines.push(word);
            return;
        }

        lines[lines.length - 1] = candidate;
    });

    if (lines.length === 0) return [fitCanvasText(ctx, title, maxWidth)];

    return lines.slice(0, 2).map((line, index) => {
        const suffix = index === 1 && lines.length > 2 ? '…' : '';
        return fitCanvasText(ctx, `${line}${suffix}`, maxWidth);
    });
}

function getFolderNodeWidth(title: string): number {
    return getTitleNodeWidth(title, FOLDER_NODE_MIN_WIDTH);
}

function getRootNodeWidth(title: string): number {
    return getTitleNodeWidth(title, ROOT_NODE_MIN_WIDTH);
}

function getTitleNodeWidth(title: string, minWidth: number): number {
    const measuredWidth = getNodeTextWidth(title);

    return Math.min(
        FOLDER_NODE_MAX_WIDTH,
        Math.max(minWidth, measuredWidth + FOLDER_NODE_HORIZONTAL_PADDING),
    );
}

function getNodeTextWidth(title: string): number {
    const cacheKey = `12:${title}`;
    const cachedWidth = textWidthCache.get(cacheKey);
    if (cachedWidth !== undefined) return cachedWidth;

    const width = measureCanvasTextWidth(title) ?? title.length * 9;
    textWidthCache.set(cacheKey, width);

    return width;
}

function measureCanvasTextWidth(title: string): number | null {
    if (typeof document === 'undefined') return null;

    if (textMeasureContext === undefined) {
        textMeasureContext = document.createElement('canvas').getContext('2d');
    }

    if (!textMeasureContext) return null;

    textMeasureContext.font = "12px 'DM Sans', sans-serif";
    return textMeasureContext.measureText(title).width;
}

function resolveDocumentGroupCenters(
    documentGroups: Map<string, GraphNode[]>,
    positionById: Map<string, { x: number; y: number }>,
): Map<string, number> {
    const groups = [...documentGroups.entries()]
        .map(([parentId, nodes]) => {
            const parentPosition = positionById.get(parentId);
            const height = nodes.length * DOCUMENT_NODE_HEIGHT + Math.max(0, nodes.length - 1) * DOCUMENT_NODE_GAP;

            return parentPosition
                ? { parentId, centerY: parentPosition.y + (parentId === 'root:g7' ? 112 : -24), height }
                : null;
        })
        .filter((group): group is { parentId: string; centerY: number; height: number } => group !== null)
        .sort((a, b) => a.centerY - b.centerY);

    for (let i = 1; i < groups.length; i++) {
        const previous = groups[i - 1];
        const current = groups[i];
        const minCenterY = previous.centerY + previous.height / 2 + DOCUMENT_GROUP_GAP + current.height / 2;

        if (current.centerY < minCenterY) {
            current.centerY = minCenterY;
        }
    }

    const centers = new Map<string, number>();
    groups.forEach((group) => centers.set(group.parentId, group.centerY));

    return centers;
}

function applyGraphLayout(graph: GraphData, width: number, height: number): GraphData {
    const root = graph.nodes.find((node) => node.type === 'root');
    const folders = graph.nodes.filter((node) => node.type === 'folder');
    const trunkNodes = graph.nodes.filter((node) => node.type === 'trunk');
    const documents = graph.nodes.filter((node) => node.type === 'document');
    const rootY = -Math.min(260, height * 0.24);
    const firstBranchY = rootY + 150;
    const branchGap = Math.min(62, Math.max(46, (height * 0.55) / Math.max(folders.length, 1)));
    const branchOffset = documents.length > 0
        ? Math.min(170, Math.max(90, width * 0.07))
        : Math.min(280, Math.max(190, width * 0.16));

    const positionById = new Map<string, { x: number; y: number }>();

    const positionedFolders = folders.map((node, index) => {
        const side = index % 2 === 0 ? 1 : -1;
        const x = side * branchOffset;
        const y = firstBranchY + index * branchGap;

        positionById.set(node.id, { x, y });
        return { ...node, x, y, fx: x, fy: y };
    });

    const positionedTrunkNodes = trunkNodes.map((node, index) => {
        const y = firstBranchY + Math.min(index, folders.length) * branchGap;

        positionById.set(node.id, { x: 0, y });
        return { ...node, x: 0, y, fx: 0, fy: y };
    });
    if (root) {
        positionById.set(root.id, { x: 0, y: rootY });
    }

    const documentGroups = new Map<string, GraphNode[]>();
    documents.forEach((node) => {
        const parentId = node.parentId ?? root?.id;
        if (!parentId) return;
        documentGroups.set(parentId, [...(documentGroups.get(parentId) ?? []), node]);
    });
    const documentGroupCenters = resolveDocumentGroupCenters(documentGroups, positionById);
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

    const positionedDocuments = documents.map((node) => {
        const parentId = node.parentId ?? root?.id;
        const parentPosition = parentId ? positionById.get(parentId) : undefined;
        if (!parentId || !parentPosition) {
            return node;
        }

        const siblings = documentGroups.get(parentId) ?? [];
        const index = Math.max(0, siblings.findIndex((doc) => doc.id === node.id));
        const isRootParent = parentId === root?.id;
        const side = isRootParent ? -1 : parentPosition.x >= 0 ? 1 : -1;
        const groupCenterY = documentGroupCenters.get(parentId) ?? parentPosition.y + (parentId === root?.id ? 112 : -24);
        const yOffset = (index - (siblings.length - 1) / 2) * (DOCUMENT_NODE_HEIGHT + DOCUMENT_NODE_GAP);
        const parentTitle = parentId ? nodeById.get(parentId)?.title ?? '' : '';
        const parentWidth = isRootParent ? getRootNodeWidth(parentTitle) : getFolderNodeWidth(parentTitle);
        const x = parentPosition.x + side * (
            isRootParent
                ? parentWidth / 2 + ROOT_DOCUMENT_GAP + DOCUMENT_NODE_WIDTH / 2
                : parentWidth / 2 + DOCUMENT_FOLDER_GAP + DOCUMENT_NODE_WIDTH / 2
        );
        const y = groupCenterY + yOffset;

        return { ...node, x, y, fx: x, fy: y };
    });

    return {
        nodes: [
            ...(root ? [{ ...root, x: 0, y: rootY, fx: 0, fy: rootY }] : []),
            ...positionedTrunkNodes,
            ...positionedFolders,
            ...positionedDocuments,
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
    const [folders, setFolders] = useState<FolderResponse[]>([]);
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
        if (!graphData || dimensions.width <= 0 || dimensions.height <= 0) {
            return graphData;
        }

        return applyGraphLayout(graphData, dimensions.width, dimensions.height);
    }, [dimensions.height, dimensions.width, graphData]);

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
            const loadedFolders = await usersApi.getFolders();
            setFolders(loadedFolders);
            setGraphData(buildGraph(loadedFolders));
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
                setGraphData(buildGraph(folders, docs));
                setPageState('results');
            }
        } catch (err: unknown) {
            clearStepTimers();
            setError(err instanceof Error ? err.message : 'Помилка запиту');
            setPageState('error');
        }
    }, [clearStepTimers, folders, pageState, query, startLoadingSteps]);

    useEffect(() => () => clearStepTimers(), [clearStepTimers]);
    useEffect(() => {
        let ignore = false;

        usersApi.getFolders()
            .then((loadedFolders) => {
                if (ignore) return;
                setFolders(loadedFolders);
                setGraphData(buildGraph(loadedFolders));
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
            const isDocument = n.type === 'document';
            if (n.type === 'trunk') return;

            const r = isRoot ? 20 : isFolder ? 15 : isHovered ? 8 : 5.5;

            // Glow halo
            const glowR = isRoot || isFolder || isDocument ? r * 2.6 : r * 5;
            const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            grd.addColorStop(0, isHovered ? 'rgba(103,232,249,0.45)' : 'rgba(79,255,176,0.25)');
            grd.addColorStop(1, 'rgba(79,255,176,0)');
            ctx.beginPath();
            if (isDocument) {
                ctx.rect(x - DOCUMENT_NODE_WIDTH / 2, y - DOCUMENT_NODE_HEIGHT / 2, DOCUMENT_NODE_WIDTH, DOCUMENT_NODE_HEIGHT);
            } else {
                ctx.arc(x, y, glowR, 0, Math.PI * 2);
            }
            ctx.fillStyle = grd;
            ctx.fill();

            ctx.fillStyle = isRoot
                ? 'rgba(79,255,176,0.16)'
                : isFolder
                    ? 'rgba(255,255,255,0.05)'
                    : isDocument
                        ? 'rgba(255,255,255,0.045)'
                    : isHovered ? NODE_HOVER_COLOR : NODE_COLOR;
            ctx.strokeStyle = isHovered ? NODE_HOVER_COLOR : isRoot || isFolder || isDocument ? 'rgba(79,255,176,0.55)' : 'rgba(255,255,255,0.25)';
            ctx.lineWidth = isRoot || isFolder || isDocument ? 1.5 : 1;

            if (isRoot || isFolder || isDocument) {
                const w = isRoot ? getRootNodeWidth(n.title) : isFolder ? getFolderNodeWidth(n.title) : DOCUMENT_NODE_WIDTH;
                const h = isRoot ? 40 : isFolder ? 44 : DOCUMENT_NODE_HEIGHT;
                const bx = x - w / 2;
                const by = y - h / 2;
                const br = isDocument ? 11 : 13;
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

            if (isRoot || isFolder || isDocument) {
                ctx.font = `${isRoot ? 14 : isFolder ? 12 : 11}px 'DM Sans', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isHovered ? NODE_HOVER_COLOR : '#e2e8f0';

                if (isDocument) {
                    const lines = getDocumentLabelLines(ctx, n.title, DOCUMENT_NODE_WIDTH - 24);
                    const lineHeight = 14;
                    const firstLineY = y - ((lines.length - 1) * lineHeight) / 2;
                    lines.forEach((line, index) => {
                        ctx.fillText(line, x, firstLineY + index * lineHeight);
                    });
                } else {
                    const label = isFolder ? fitCanvasText(ctx, n.title, getFolderNodeWidth(n.title) - 22) : n.title;
                    ctx.fillText(label, x, y);
                }
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
                const w = n.type === 'root' ? getRootNodeWidth(n.title) : getFolderNodeWidth(n.title);
                const h = n.type === 'root' ? 40 : 44;
                ctx.fillStyle = color;
                ctx.fillRect((node.x ?? 0) - w / 2, (node.y ?? 0) - h / 2, w, h);
                return;
            }
            if (n.type === 'document') {
                ctx.fillStyle = color;
                ctx.fillRect(
                    (node.x ?? 0) - DOCUMENT_NODE_WIDTH / 2,
                    (node.y ?? 0) - DOCUMENT_NODE_HEIGHT / 2,
                    DOCUMENT_NODE_WIDTH,
                    DOCUMENT_NODE_HEIGHT,
                );
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
                        {`${graphData.nodes.filter((node) => node.type === 'folder').length} папок · ${graphData.nodes.filter((node) => node.type === 'document').length} документів`}
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
