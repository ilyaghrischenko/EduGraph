// src/components/Navbar.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GoogleDriveControls } from './GoogleDriveControls';
import { C, F } from '../styles/tokens';

export interface NavLinkDef {
    label: string;
    href: string;
}

interface NavbarProps {
    links: NavLinkDef[];
    showGoogleDriveControls?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ links, showGoogleDriveControls }) => {
    const { pathname } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const mobileMenuId = 'mobile-navigation-menu';

    useEffect(() => {
        if (!menuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [menuOpen]);

    return (
        <nav className="sticky top-0 z-50" style={{
            borderBottom: `1px solid ${C.border}`,
            background: 'rgba(10,13,20,0.85)',
            backdropFilter: 'blur(12px)',
        }}>
            <div className="mx-auto flex min-h-14 max-w-[1100px] items-center justify-between gap-4 px-4 py-2 md:px-6 xl:px-0">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="inline-flex min-h-11 items-center"
                        style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.1rem', color: C.accent, textDecoration: 'none', letterSpacing: '-0.02em' }}
                        onClick={() => setMenuOpen(false)}
                    >
                        EduGraph
                    </Link>
                    {showGoogleDriveControls && <GoogleDriveControls />}
                </div>

                {/* Desktop links */}
                <div className="hidden flex-shrink-0 items-center md:flex">
                    <ul className="flex" style={{ gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
                        {links.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        style={{
                                            display: 'inline-flex',
                                            minHeight: '44px',
                                            alignItems: 'center',
                                            padding: '0 14px',
                                            borderRadius: '8px',
                                            fontFamily: F.sans,
                                            fontSize: '0.85rem',
                                            fontWeight: active ? 500 : 400,
                                            color: active ? C.accent : C.textMuted,
                                            background: active ? C.accentDim : 'transparent',
                                            border: `1px solid ${active ? C.accentBorder : 'transparent'}`,
                                            textDecoration: 'none',
                                            transition: 'color 0.15s, background 0.15s',
                                        }}
                                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = C.textPrimary; e.currentTarget.style.background = C.surface; } }}
                                        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = 'transparent'; } }}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <button
                    type="button"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg md:hidden"
                    aria-label={menuOpen ? 'Закрити навігацію' : 'Відкрити навігацію'}
                    aria-expanded={menuOpen}
                    aria-controls={mobileMenuId}
                    onClick={() => setMenuOpen((open) => !open)}
                    style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        color: C.textPrimary,
                        cursor: 'pointer',
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        {menuOpen ? (
                            <>
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </>
                        ) : (
                            <>
                                <path d="M4 7h16" />
                                <path d="M4 12h16" />
                                <path d="M4 17h16" />
                            </>
                        )}
                    </svg>
                </button>
            </div>

            {menuOpen && (
                <div
                    id={mobileMenuId}
                    className="md:hidden"
                    style={{
                        borderTop: `1px solid ${C.border}`,
                        background: 'rgba(10,13,20,0.97)',
                    }}
                >
                    <ul className="mx-auto flex max-w-[1100px] flex-col gap-2 px-4 py-3" style={{ listStyle: 'none', margin: 0 }}>
                        {links.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="flex min-h-11 items-center rounded-lg px-3"
                                        style={{
                                            fontFamily: F.sans,
                                            fontSize: '1rem',
                                            fontWeight: active ? 500 : 400,
                                            color: active ? C.accent : C.textMuted,
                                            background: active ? C.accentDim : 'transparent',
                                            border: `1px solid ${active ? C.accentBorder : C.border}`,
                                            textDecoration: 'none',
                                        }}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </nav>
    );
};
