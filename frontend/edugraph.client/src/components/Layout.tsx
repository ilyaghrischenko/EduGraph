// src/components/Layout.tsx
import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, type NavLinkDef } from './Navbar';
import { C, F } from '../styles/tokens';

interface LayoutProps {
    children: ReactNode;
    navLinks?: NavLinkDef[];
    /** Remove max-width constraint (for full-bleed pages) */
    fluid?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, navLinks, fluid }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
            {navLinks && navLinks.length > 0 && <Navbar links={navLinks} />}

            <main style={{ flex: 1, maxWidth: fluid ? undefined : '1100px', width: '100%', margin: '0 auto', padding: fluid ? 0 : '0 24px' }}>
                {children}
            </main>

            <footer style={{ borderTop: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: F.sans, fontSize: '0.75rem', color: C.textMuted }}>
          © 2026 EduGraph
        </span>
                <Link to="/privacy" style={{ fontFamily: F.sans, fontSize: '0.75rem', color: C.textMuted, textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = C.accent}
                      onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
                >
                    Privacy
                </Link>
            </footer>
        </div>
    );
};