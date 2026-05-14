// src/pages/StudentSearchPage.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { NodeObject } from 'react-force-graph-2d';
import { Link, useLocation } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { usersApi } from '../api/usersApi';
import type { FolderResponse, SearchDocumentResponse } from '../types/api';
import { getSafeGoogleDriveUrl } from '../utils/safeUrl';
import { getStoredRole } from '../utils/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GraphNode extends NodeObject {
    id: string;
    title: string;
    url?: string;
    content?: string;
    folderName?: string | null;
    parentId?: string;
    type: 'root' | 'folder' | 'document' | 'trunk';
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
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
const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1280;
const ADMIN_NAV_LINKS = [
    { label: 'Пошук', href: '/admin/search' },
    { label: 'Заявки', href: '/admin/sign-up-applications' },
    { label: 'Студенти', href: '/admin/add-user' },
    { label: 'Викладачі', href: '/admin/teachers' },
];
const TEACHER_NAV_LINKS = [
    { label: 'Пошук', href: '/teacher/search' },
    { label: 'Заявки', href: '/teacher/sign-up-applications' },
    { label: 'Студенти', href: '/teacher/add-user' },
];

const ROLE_LABELS: Record<string, string> = {
    Admin: 'Адміністратор',
    Teacher: 'Викладач',
    Student: 'Студент',
};

interface GraphMetrics {
    documentNodeWidth: number;
    documentNodeHeight: number;
    documentNodeGap: number;
    documentGroupGap: number;
    rootNodeMinWidth: number;
    folderNodeMinWidth: number;
    folderNodeMaxWidth: number;
    titleHorizontalPadding: number;
    documentFolderGap: number;
    rootDocumentGap: number;
    rootNodeHeight: number;
    folderNodeHeight: number;
    rootFontSize: number;
    folderFontSize: number;
    documentFontSize: number;
    documentLineHeight: number;
    rootRadius: number;
    folderRadius: number;
    leafRadius: number;
    leafHoverRadius: number;
    documentRadius: number;
    titleRadius: number;
    rootYOffsetMax: number;
    rootYOffsetRatio: number;
    firstBranchGap: number;
    branchGapMin: number;
    branchGapMax: number;
    branchOffsetWithDocsMin: number;
    branchOffsetWithDocsMax: number;
    branchOffsetWithDocsRatio: number;
    branchOffsetFoldersMin: number;
    branchOffsetFoldersMax: number;
    branchOffsetFoldersRatio: number;
    rootDocumentCenterOffsetY: number;
    folderDocumentCenterOffsetY: number;
    folderChargeStrength: number;
    resultChargeStrength: number;
    folderLinkDistance: number;
    resultLinkDistance: number;
}

const DESKTOP_GRAPH_METRICS: GraphMetrics = {
    documentNodeWidth: 160,
    documentNodeHeight: 44,
    documentNodeGap: 22,
    documentGroupGap: 56,
    rootNodeMinWidth: 92,
    folderNodeMinWidth: 120,
    folderNodeMaxWidth: 240,
    titleHorizontalPadding: 34,
    documentFolderGap: 76,
    rootDocumentGap: 44,
    rootNodeHeight: 40,
    folderNodeHeight: 44,
    rootFontSize: 14,
    folderFontSize: 12,
    documentFontSize: 11,
    documentLineHeight: 14,
    rootRadius: 20,
    folderRadius: 15,
    leafRadius: 5.5,
    leafHoverRadius: 8,
    documentRadius: 11,
    titleRadius: 13,
    rootYOffsetMax: 260,
    rootYOffsetRatio: 0.24,
    firstBranchGap: 150,
    branchGapMin: 56,
    branchGapMax: 68,
    branchOffsetWithDocsMin: 90,
    branchOffsetWithDocsMax: 170,
    branchOffsetWithDocsRatio: 0.07,
    branchOffsetFoldersMin: 190,
    branchOffsetFoldersMax: 280,
    branchOffsetFoldersRatio: 0.16,
    rootDocumentCenterOffsetY: 112,
    folderDocumentCenterOffsetY: -24,
    folderChargeStrength: -520,
    resultChargeStrength: -350,
    folderLinkDistance: 180,
    resultLinkDistance: 120,
};

function getGraphMetrics(width: number): GraphMetrics {
    if (width < TABLET_WIDTH) {
        return {
            ...DESKTOP_GRAPH_METRICS,
            documentNodeWidth: 92,
            documentNodeHeight: 30,
            documentNodeGap: 10,
            documentGroupGap: 8,
            rootNodeMinWidth: 64,
            folderNodeMinWidth: 80,
            folderNodeMaxWidth: 112,
            titleHorizontalPadding: 20,
            documentFolderGap: 8,
            rootDocumentGap: 12,
            rootNodeHeight: 28,
            folderNodeHeight: 30,
            rootFontSize: 12,
            folderFontSize: 10,
            documentFontSize: 9,
            documentLineHeight: 11,
            rootRadius: 14,
            folderRadius: 10,
            leafRadius: 4,
            leafHoverRadius: 6,
            documentRadius: 8,
            titleRadius: 9,
            rootYOffsetMax: 120,
            rootYOffsetRatio: 0.16,
            firstBranchGap: 96,
            branchGapMin: 38,
            branchGapMax: 42,
            branchOffsetWithDocsMin: 46,
            branchOffsetWithDocsMax: 58,
            branchOffsetWithDocsRatio: 0.18,
            branchOffsetFoldersMin: 64,
            branchOffsetFoldersMax: 84,
            branchOffsetFoldersRatio: 0.26,
            rootDocumentCenterOffsetY: 72,
            folderDocumentCenterOffsetY: -10,
            folderChargeStrength: -260,
            resultChargeStrength: -220,
            folderLinkDistance: 96,
            resultLinkDistance: 82,
        };
    }

    if (width < DESKTOP_WIDTH) {
        return {
            ...DESKTOP_GRAPH_METRICS,
            documentNodeWidth: 100,
            documentNodeHeight: 34,
            documentNodeGap: 14,
            documentGroupGap: 12,
            rootNodeMinWidth: 76,
            folderNodeMinWidth: 96,
            folderNodeMaxWidth: 128,
            titleHorizontalPadding: 26,
            documentFolderGap: 12,
            rootDocumentGap: 20,
            rootNodeHeight: 34,
            folderNodeHeight: 38,
            rootFontSize: 13,
            folderFontSize: 11,
            documentFontSize: 10,
            documentLineHeight: 12,
            rootRadius: 16,
            folderRadius: 12,
            leafRadius: 4.5,
            leafHoverRadius: 7,
            documentRadius: 9,
            titleRadius: 10,
            rootYOffsetMax: 180,
            rootYOffsetRatio: 0.2,
            firstBranchGap: 120,
            branchGapMin: 50,
            branchGapMax: 58,
            branchOffsetWithDocsMin: 44,
            branchOffsetWithDocsMax: 52,
            branchOffsetWithDocsRatio: 0.07,
            branchOffsetFoldersMin: 100,
            branchOffsetFoldersMax: 140,
            branchOffsetFoldersRatio: 0.18,
            rootDocumentCenterOffsetY: 88,
            folderDocumentCenterOffsetY: -16,
            folderChargeStrength: -360,
            resultChargeStrength: -280,
            folderLinkDistance: 130,
            resultLinkDistance: 96,
        };
    }

    return DESKTOP_GRAPH_METRICS;
}

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
            id: `doc:${doc.chunkId || index}`,
            title: doc.title,
            url: getSafeGoogleDriveUrl(doc.url) ?? undefined,
            content: doc.content,
            folderName: doc.folderName,
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
            url: getSafeGoogleDriveUrl(folder.link) ?? undefined,
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

function getFolderNodeWidth(title: string, metrics: GraphMetrics): number {
    return getTitleNodeWidth(title, metrics.folderNodeMinWidth, metrics.folderNodeMaxWidth, metrics.titleHorizontalPadding, metrics.folderFontSize);
}

function getRootNodeWidth(title: string, metrics: GraphMetrics): number {
    return getTitleNodeWidth(title, metrics.rootNodeMinWidth, metrics.folderNodeMaxWidth, metrics.titleHorizontalPadding, metrics.rootFontSize);
}

function getTitleNodeWidth(title: string, minWidth: number, maxWidth: number, horizontalPadding: number, fontSize: number): number {
    const measuredWidth = getNodeTextWidth(title, fontSize);

    return Math.min(
        maxWidth,
        Math.max(minWidth, measuredWidth + horizontalPadding),
    );
}

function getNodeTextWidth(title: string, fontSize: number): number {
    const cacheKey = `${fontSize}:${title}`;
    const cachedWidth = textWidthCache.get(cacheKey);
    if (cachedWidth !== undefined) return cachedWidth;

    const width = measureCanvasTextWidth(title, fontSize) ?? title.length * fontSize * 0.75;
    textWidthCache.set(cacheKey, width);

    return width;
}

function measureCanvasTextWidth(title: string, fontSize: number): number | null {
    if (typeof document === 'undefined') return null;

    if (textMeasureContext === undefined) {
        textMeasureContext = document.createElement('canvas').getContext('2d');
    }

    if (!textMeasureContext) return null;

    textMeasureContext.font = `${fontSize}px 'DM Sans', sans-serif`;
    return textMeasureContext.measureText(title).width;
}

function resolveDocumentGroupCenters(
    documentGroups: Map<string, GraphNode[]>,
    positionById: Map<string, { x: number; y: number }>,
    metrics: GraphMetrics,
): Map<string, number> {
    const groups = [...documentGroups.entries()]
        .map(([parentId, nodes]) => {
            const parentPosition = positionById.get(parentId);
            const height = nodes.length * metrics.documentNodeHeight + Math.max(0, nodes.length - 1) * metrics.documentNodeGap;

            return parentPosition
                ? { parentId, centerY: parentPosition.y + (parentId === 'root:g7' ? metrics.rootDocumentCenterOffsetY : metrics.folderDocumentCenterOffsetY), height }
                : null;
        })
        .filter((group): group is { parentId: string; centerY: number; height: number } => group !== null)
        .sort((a, b) => a.centerY - b.centerY);

    for (let i = 1; i < groups.length; i++) {
        const previous = groups[i - 1];
        const current = groups[i];
        const minCenterY = previous.centerY + previous.height / 2 + metrics.documentGroupGap + current.height / 2;

        if (current.centerY < minCenterY) {
            current.centerY = minCenterY;
        }
    }

    const centers = new Map<string, number>();
    groups.forEach((group) => centers.set(group.parentId, group.centerY));

    return centers;
}

function getDocumentGroupHeight(count: number, metrics: GraphMetrics): number {
    if (count <= 0) return 0;

    return count * metrics.documentNodeHeight + Math.max(0, count - 1) * metrics.documentNodeGap;
}

function applyGraphLayout(graph: GraphData, width: number, height: number): GraphData {
    const metrics = getGraphMetrics(width);
    const root = graph.nodes.find((node) => node.type === 'root');
    const folders = graph.nodes.filter((node) => node.type === 'folder');
    const trunkNodes = graph.nodes.filter((node) => node.type === 'trunk');
    const documents = graph.nodes.filter((node) => node.type === 'document');
    const documentGroups = new Map<string, GraphNode[]>();
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    documents.forEach((node) => {
        const parentId = node.parentId ?? root?.id;
        if (!parentId) return;
        documentGroups.set(parentId, [...(documentGroups.get(parentId) ?? []), node]);
    });
    const rootY = -Math.min(metrics.rootYOffsetMax, height * metrics.rootYOffsetRatio);
    const firstBranchY = rootY + metrics.firstBranchGap;
    const hasDocumentResults = documents.length > 0;
    const links = graph.links.map((link) => ({
        ...link,
        source: typeof link.source === 'object' ? link.source.id ?? '' : link.source,
        target: typeof link.target === 'object' ? link.target.id ?? '' : link.target,
    }));

    const positionById = new Map<string, { x: number; y: number }>();
    if (root) {
        positionById.set(root.id, { x: 0, y: rootY });
    }

    if (hasDocumentResults) {
        const rootWidth = root ? getRootNodeWidth(root.title, metrics) : metrics.rootNodeMinWidth;
        const maxFolderWidth = folders.reduce(
            (maxWidth, node) => Math.max(maxWidth, getFolderNodeWidth(node.title, metrics)),
            metrics.folderNodeMinWidth,
        );
        const rowGap = Math.max(18, metrics.documentGroupGap);
        const branchOffset = Math.max(
            metrics.branchOffsetWithDocsMin,
            width * metrics.branchOffsetWithDocsRatio,
            rootWidth / 2 + maxFolderWidth / 2 + 32,
        );
        const rootGroupHeight = getDocumentGroupHeight(documentGroups.get(root?.id ?? '')?.length ?? 0, metrics);
        const groupCenterByParentId = new Map<string, number>();
        let previousBottomY = Math.max(
            rootY + metrics.rootNodeHeight / 2,
            rootGroupHeight > 0 ? rootY + metrics.rootDocumentCenterOffsetY + rootGroupHeight / 2 : Number.NEGATIVE_INFINITY,
        );

        if (root && rootGroupHeight > 0) {
            groupCenterByParentId.set(root.id, rootY + metrics.rootDocumentCenterOffsetY);
        }

        const positionedFolders = folders.map((node, index) => {
            const groupHeight = getDocumentGroupHeight(documentGroups.get(node.id)?.length ?? 0, metrics);
            const rowHeight = Math.max(metrics.folderNodeHeight, groupHeight);
            const minCenterY = previousBottomY + rowGap + rowHeight / 2;
            const y = index === 0 ? Math.max(firstBranchY, minCenterY) : minCenterY;
            const side = index % 2 === 0 ? 1 : -1;
            const x = side * branchOffset;

            previousBottomY = y + rowHeight / 2;
            positionById.set(node.id, { x, y });
            groupCenterByParentId.set(node.id, y);

            return { ...node, x, y, fx: x, fy: y };
        });

        const positionedTrunkNodes = trunkNodes.map((node, index) => {
            const y = index < positionedFolders.length
                ? positionedFolders[index].y ?? firstBranchY
                : (positionedFolders[positionedFolders.length - 1]?.y ?? firstBranchY) + rowGap;

            positionById.set(node.id, { x: 0, y });
            return { ...node, x: 0, y, fx: 0, fy: y };
        });

        const positionedDocuments = documents.map((node) => {
            const parentId = node.parentId ?? root?.id;
            const parentPosition = parentId ? positionById.get(parentId) : undefined;
            const siblings = parentId ? documentGroups.get(parentId) ?? [] : [];
            const index = Math.max(0, siblings.findIndex((doc) => doc.id === node.id));
            const groupCenterY = parentId
                ? groupCenterByParentId.get(parentId) ?? parentPosition?.y ?? rootY
                : rootY;
            const parentTitle = parentId ? nodeById.get(parentId)?.title ?? '' : '';
            const parentWidth = parentId === root?.id ? rootWidth : getFolderNodeWidth(parentTitle, metrics);
            const side = parentId === root?.id ? 1 : Math.sign(parentPosition?.x ?? 1);
            const yOffset = (index - (siblings.length - 1) / 2) * (metrics.documentNodeHeight + metrics.documentNodeGap);
            const x = (parentPosition?.x ?? 0) + side * (
                parentWidth / 2 + (parentId === root?.id ? metrics.rootDocumentGap : metrics.documentFolderGap) + metrics.documentNodeWidth / 2
            );

            return { ...node, x, y: groupCenterY + yOffset, fx: x, fy: groupCenterY + yOffset };
        });

        return {
            nodes: [
                ...(root ? [{ ...root, x: 0, y: rootY, fx: 0, fy: rootY }] : []),
                ...positionedTrunkNodes,
                ...positionedFolders,
                ...positionedDocuments,
            ],
            links,
        };
    }

    const branchGap = Math.min(
        metrics.branchGapMax,
        Math.max(metrics.branchGapMin, (height * 0.58) / Math.max(folders.length, 1)),
    );
    const branchOffset = documents.length > 0
        ? Math.min(metrics.branchOffsetWithDocsMax, Math.max(metrics.branchOffsetWithDocsMin, width * metrics.branchOffsetWithDocsRatio))
        : Math.min(metrics.branchOffsetFoldersMax, Math.max(metrics.branchOffsetFoldersMin, width * metrics.branchOffsetFoldersRatio));

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
    const documentGroupCenters = resolveDocumentGroupCenters(documentGroups, positionById, metrics);
    const positionedDocuments = documents.map((node) => {
        const parentId = node.parentId ?? root?.id;
        const parentPosition = parentId ? positionById.get(parentId) : undefined;
        if (!parentId || !parentPosition) {
            return node;
        }

        const siblings = documentGroups.get(parentId) ?? [];
        const index = Math.max(0, siblings.findIndex((doc) => doc.id === node.id));
        const isRootParent = parentId === root?.id;
        const side = isRootParent
            ? -1
            : width < TABLET_WIDTH
                ? (parentPosition.x >= 0 ? -1 : 1)
                : (parentPosition.x >= 0 ? 1 : -1);
        const groupCenterY = documentGroupCenters.get(parentId) ?? parentPosition.y + (parentId === root?.id ? metrics.rootDocumentCenterOffsetY : metrics.folderDocumentCenterOffsetY);
        const yOffset = (index - (siblings.length - 1) / 2) * (metrics.documentNodeHeight + metrics.documentNodeGap);
        const parentTitle = parentId ? nodeById.get(parentId)?.title ?? '' : '';
        const parentWidth = isRootParent ? getRootNodeWidth(parentTitle, metrics) : getFolderNodeWidth(parentTitle, metrics);
        const x = parentPosition.x + side * (
            isRootParent
                ? parentWidth / 2 + metrics.rootDocumentGap + metrics.documentNodeWidth / 2
                : parentWidth / 2 + metrics.documentFolderGap + metrics.documentNodeWidth / 2
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
        links,
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
        <div className="flex w-[calc(100vw-2rem)] max-w-[280px] flex-col gap-3">
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
            це може зайняти певний час
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

interface DocumentModalProps {
    document: GraphNode;
    onClose: () => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ document, onClose }) => (
    <div
        className="document-modal-backdrop fixed inset-0 z-30 flex items-center justify-center px-4 py-4 md:py-6"
        style={{
            background: 'rgba(3,7,18,0.72)',
            backdropFilter: 'blur(12px)',
            fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseDown={onClose}
    >
        <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-modal-title"
            className="document-modal flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl md:max-h-[80vh]"
            style={{
                background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(10,13,20,0.98) 100%)',
                border: '1px solid rgba(79,255,176,0.24)',
                boxShadow: '0 34px 110px rgba(0,0,0,0.58), 0 0 0 1px rgba(255,255,255,0.04), 0 0 64px rgba(79,255,176,0.08)',
            }}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <div
                className="flex items-start justify-between gap-3 px-4 py-4 md:gap-5 md:px-6 md:py-5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
                <div className="min-w-0">
                    <p
                        className="mb-2 text-xs uppercase"
                        style={{ color: 'rgba(79,255,176,0.55)', fontFamily: "'Syne', sans-serif", letterSpacing: '0.12em' }}
                    >
                        Фрагмент документа
                    </p>
                    <h2
                        id="document-modal-title"
                        className="text-base font-medium leading-snug"
                        style={{ color: '#e2e8f0', overflowWrap: 'anywhere' }}
                    >
                        {document.title}
                    </h2>
                    {document.folderName && (
                        <p className="mt-2 text-xs" style={{ color: 'rgba(226,232,240,0.45)' }}>
                            {document.folderName}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(226,232,240,0.72)',
                        cursor: 'pointer',
                    }}
                    aria-label="Закрити панель"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                <div
                    className="rounded-2xl px-4 py-4 md:px-5"
                    style={{
                        background: 'rgba(255,255,255,0.035)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <p
                        className="whitespace-pre-wrap text-sm leading-6"
                        style={{ color: 'rgba(226,232,240,0.88)', overflowWrap: 'anywhere' }}
                    >
                        ...{document.content}...
                    </p>
                </div>
            </div>

            <div
                className="px-4 py-4 md:px-6 md:py-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
                {document.url && (
                    <a
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                        style={{
                            background: 'rgba(79,255,176,0.13)',
                            border: '1px solid rgba(79,255,176,0.32)',
                            color: '#4fffb0',
                            textDecoration: 'none',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 3h7v7" />
                            <path d="M10 14 21 3" />
                            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                        </svg>
                        Відкрити оригінал у Google Drive
                    </a>
                )}
            </div>
        </section>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const StudentSearchPage: React.FC = () => {
    const { pathname } = useLocation();
    const role = getStoredRole();
    const roleLabel = ROLE_LABELS[role ?? ''] ?? 'Студент';
    const panelNavLinks = role === 'Admin' ? ADMIN_NAV_LINKS : role === 'Teacher' ? TEACHER_NAV_LINKS : [];
    const [query, setQuery] = useState('');
    const [pageState, setPageState] = useState<PageState>('foldersLoading');
    const [loadingStep, setLoadingStep] = useState(0);
    const [folders, setFolders] = useState<FolderResponse[]>([]);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<GraphNode | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const hoveredNodeRef = useRef<GraphNode | null>(null);
    const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);
    const graphMetrics = useMemo(() => getGraphMetrics(dimensions.width), [dimensions.width]);
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
        setSelectedDocument(null);
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
        setSelectedDocument(null);
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
        fgRef.current.d3Force('charge').strength(pageState === 'folders' ? graphMetrics.folderChargeStrength : graphMetrics.resultChargeStrength);
        fgRef.current.d3Force('link').distance(pageState === 'folders' ? graphMetrics.folderLinkDistance : graphMetrics.resultLinkDistance);
        fgRef.current.d3ReheatSimulation();
    }, [graphMetrics, pageState, visibleGraphData]);

    // ── Graph callbacks ────────────────────────────────────────────────────────

    const handleNodeClick = useCallback((node: NodeObject) => {
        const n = node as GraphNode;
        if (n.type === 'document') {
            setSelectedDocument(n);
            return;
        }

        if (n.url) window.open(n.url, '_blank', 'noopener,noreferrer');
    }, []);

    const closeDocumentModal = useCallback(() => {
        setSelectedDocument(null);
    }, []);

    useEffect(() => {
        if (!selectedDocument) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeDocumentModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeDocumentModal, selectedDocument]);

    const handleNodeHover = useCallback((node: NodeObject | null) => {
        const n = node ? (node as GraphNode) : null;
        hoveredNodeRef.current = n;
        setHoveredNode(n);
        document.body.style.cursor = n?.url || n?.type === 'document' ? 'pointer' : 'default';
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

            const r = isRoot ? graphMetrics.rootRadius : isFolder ? graphMetrics.folderRadius : isHovered ? graphMetrics.leafHoverRadius : graphMetrics.leafRadius;

            // Glow halo
            const glowR = isRoot || isFolder || isDocument ? r * 2.6 : r * 5;
            const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            grd.addColorStop(0, isHovered ? 'rgba(103,232,249,0.45)' : 'rgba(79,255,176,0.25)');
            grd.addColorStop(1, 'rgba(79,255,176,0)');
            ctx.beginPath();
            if (isDocument) {
                ctx.rect(x - graphMetrics.documentNodeWidth / 2, y - graphMetrics.documentNodeHeight / 2, graphMetrics.documentNodeWidth, graphMetrics.documentNodeHeight);
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
                const w = isRoot ? getRootNodeWidth(n.title, graphMetrics) : isFolder ? getFolderNodeWidth(n.title, graphMetrics) : graphMetrics.documentNodeWidth;
                const h = isRoot ? graphMetrics.rootNodeHeight : isFolder ? graphMetrics.folderNodeHeight : graphMetrics.documentNodeHeight;
                const bx = x - w / 2;
                const by = y - h / 2;
                const br = isDocument ? graphMetrics.documentRadius : graphMetrics.titleRadius;
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
                ctx.font = `${isRoot ? graphMetrics.rootFontSize : isFolder ? graphMetrics.folderFontSize : graphMetrics.documentFontSize}px 'DM Sans', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isHovered ? NODE_HOVER_COLOR : '#e2e8f0';

                if (isDocument) {
                    const lines = getDocumentLabelLines(ctx, n.title, graphMetrics.documentNodeWidth - 18);
                    const lineHeight = graphMetrics.documentLineHeight;
                    const firstLineY = y - ((lines.length - 1) * lineHeight) / 2;
                    lines.forEach((line, index) => {
                        ctx.fillText(line, x, firstLineY + index * lineHeight);
                    });
                } else {
                    const label = isFolder ? fitCanvasText(ctx, n.title, getFolderNodeWidth(n.title, graphMetrics) - 18) : n.title;
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
        [graphMetrics],
    );

    // Clickable area matches visual node size
    const paintPointerArea = useCallback(
        (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
            const n = node as GraphNode;
            if (n.type === 'trunk') return;

            if (n.type === 'root' || n.type === 'folder') {
                const w = n.type === 'root' ? getRootNodeWidth(n.title, graphMetrics) : getFolderNodeWidth(n.title, graphMetrics);
                const h = n.type === 'root' ? graphMetrics.rootNodeHeight : graphMetrics.folderNodeHeight;
                ctx.fillStyle = color;
                ctx.fillRect((node.x ?? 0) - w / 2, (node.y ?? 0) - h / 2, w, h);
                return;
            }
            if (n.type === 'document') {
                ctx.fillStyle = color;
                ctx.fillRect(
                    (node.x ?? 0) - graphMetrics.documentNodeWidth / 2,
                    (node.y ?? 0) - graphMetrics.documentNodeHeight / 2,
                    graphMetrics.documentNodeWidth,
                    graphMetrics.documentNodeHeight,
                );
                return;
            }
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, 10, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        },
        [graphMetrics],
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        /* The graph canvas is viewport-bound; inner regions resize instead of allowing page-level horizontal scroll. */
        <div
            className="flex min-h-[100dvh] flex-col overflow-y-auto select-none md:h-[100dvh] md:min-h-[520px] md:overflow-hidden"
            style={{ background: BG_COLOR, fontFamily: "'DM Sans', sans-serif" }}
        >
            <Seo
                title="Пошук знань | EduGraph"
                description="Пошук навчальних матеріалів у EduGraph."
                noindex
            />
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <header
                className="flex flex-shrink-0 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <Link
                    to="/"
                    className="inline-flex min-h-11 items-center text-lg font-bold tracking-tight"
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        color: '#4fffb0',
                        letterSpacing: '-0.02em',
                    }}
                >
                    EduGraph
                </Link>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                    {panelNavLinks.length > 0 && (
                        <nav aria-label="Навігація панелі">
                            <ul className="flex flex-wrap gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {panelNavLinks.map((link) => {
                                    const active = pathname === link.href;
                                    return (
                                        <li key={link.href}>
                                            <Link
                                                to={link.href}
                                                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm"
                                                style={{
                                                    background: active ? 'rgba(79,255,176,0.12)' : 'rgba(255,255,255,0.04)',
                                                    border: `1px solid ${active ? 'rgba(79,255,176,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                    color: active ? '#4fffb0' : 'rgba(226,232,240,0.68)',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    )}
          <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                  background: 'rgba(79,255,176,0.1)',
                  color: '#4fffb0',
                  border: '1px solid rgba(79,255,176,0.2)',
                  fontFamily: "'DM Sans', sans-serif",
                  width: 'fit-content',
              }}
          >
            {roleLabel}
          </span>
                </div>
            </header>

            {/* ── Search bar ────────────────────────────────────────────────────── */}
            <div
                className="flex-shrink-0 px-4 pb-4 pt-4 md:px-6 md:pb-5 md:pt-6"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
                <div className="max-w-2xl mx-auto">
                    <p
                        className="text-center text-xs uppercase tracking-widest mb-3"
                        style={{ color: 'rgba(79,255,176,0.5)', fontFamily: "'Syne', sans-serif" }}
                    >
                        Пошук знань
                    </p>
                    <div className="relative flex flex-col gap-2 md:flex-row">
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
                                className="min-h-11 w-full rounded-xl px-4 py-3 text-base outline-none disabled:opacity-50 md:text-sm"
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
                            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
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
            <div className="student-search-main flex min-h-[420px] flex-1 overflow-hidden md:min-h-0">
                <div ref={containerRef} className="graph-pane relative min-h-[420px] min-w-0 flex-1 md:min-h-0">

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
                            className="min-h-11 min-w-11 rounded-lg px-4 text-sm transition-colors"
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
                        className="absolute left-3 right-3 top-3 z-10 flex items-center gap-2 rounded-xl px-3 py-2 text-sm pointer-events-none md:left-1/2 md:right-auto md:-translate-x-1/2 md:px-4"
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
                            className="ml-1 hidden flex-shrink-0 text-xs md:inline"
                            style={{ color: 'rgba(79,255,176,0.5)' }}
                        >
              — {hoveredNode.type === 'document' ? 'клікніть щоб переглянути' : 'клікніть щоб відкрити'}
            </span>
                    </div>
                )}

                {/* ── Node count badge ───────────────────────────────────────────── */}
                {(pageState === 'folders' || pageState === 'results') && graphData && (
                    <div
                        className="absolute bottom-4 right-4 z-10 hidden rounded-lg px-3 py-1.5 text-xs xl:block"
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

            </div>

            {(pageState === 'results') && selectedDocument && (
                <DocumentModal
                    document={selectedDocument}
                    onClose={closeDocumentModal}
                />
            )}

            {/* ── Global styles injection (Syne + DM Sans + pulse keyframe) ─────── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .document-modal-backdrop {
          animation: document-modal-backdrop-in 180ms ease-out;
        }
        .document-modal {
          animation: document-modal-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes document-modal-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes document-modal-in {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    );
};
