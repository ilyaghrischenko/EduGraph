// src/components/Layout.tsx
import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, type NavLinkDef } from './Navbar';
import { C, F } from '../styles/tokens';

interface LayoutProps {
    children: ReactNode;
    navLinks?: NavLinkDef[];
    showGoogleDriveControls?: boolean;
    /** Remove max-width constraint (for full-bleed pages) */
    fluid?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, navLinks, showGoogleDriveControls, fluid }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
            {navLinks && navLinks.length > 0 && <Navbar links={navLinks} showGoogleDriveControls={showGoogleDriveControls} />}

            <main
                className={fluid
                    ? 'flex-1 w-full min-w-0'
                    : 'flex-1 w-full max-w-[1100px] mx-auto px-4 md:px-6 xl:px-0 min-w-0'}
            >
                {children}
            </main>

            <footer
                className="flex flex-col gap-2 px-4 py-4 text-center md:flex-row md:items-center md:justify-between md:px-6 md:text-left"
                style={{ borderTop: `1px solid ${C.border}` }}
            >
                <span style={{ fontFamily: F.sans, fontSize: '0.875rem', color: C.textMuted }}>
                    © 2026 EduGraph
                </span>
                <Link
                    to="/privacy"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center"
                    style={{ fontFamily: F.sans, fontSize: '0.875rem', color: C.textMuted, textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = C.accent}
                      onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
                >
                    Privacy
                </Link>
            </footer>
        </div>
    );
};
