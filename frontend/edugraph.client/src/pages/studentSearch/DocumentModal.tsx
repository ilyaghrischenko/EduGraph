import React from 'react';
import type { GraphNode } from './types';

interface DocumentModalProps {
    document: GraphNode;
    onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ document, onClose }) => (
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
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all"
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
                        className="interactive-button flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
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
