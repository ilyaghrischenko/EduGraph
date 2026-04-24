// src/components/Navbar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { C, F } from '../styles/tokens';

export interface NavLinkDef {
    label: string;
    href: string;
}

interface NavbarProps {
    links: NavLinkDef[];
}

export const Navbar: React.FC<NavbarProps> = ({ links }) => {
    const { pathname } = useLocation();

    return (
        <nav style={{
            borderBottom: `1px solid ${C.border}`,
            background: 'rgba(10,13,20,0.85)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
                {/* Logo */}
                <Link to="/" style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.1rem', color: C.accent, textDecoration: 'none', letterSpacing: '-0.02em' }}>
                    EduGraph
                </Link>

                {/* Links */}
                <ul style={{ display: 'flex', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
                    {links.map((link) => {
                        const active = pathname === link.href;
                        return (
                            <li key={link.href}>
                                <Link
                                    to={link.href}
                                    style={{
                                        display: 'block',
                                        padding: '5px 14px',
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
        </nav>
    );
};