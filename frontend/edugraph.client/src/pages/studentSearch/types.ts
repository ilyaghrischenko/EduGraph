import type { NodeObject } from 'react-force-graph-2d';

export interface GraphNode extends NodeObject {
    id: string;
    title: string;
    url?: string;
    content?: string;
    folderName?: string | null;
    parentId?: string;
    type: 'root' | 'folder' | 'document' | 'trunk';
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export type PageState = 'foldersLoading' | 'folders' | 'loading' | 'results' | 'empty' | 'error' | 'foldersError';
