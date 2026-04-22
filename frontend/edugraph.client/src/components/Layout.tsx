// src/components/Layout.tsx
import React, {type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, type NavLinkDef } from './Navbar';

interface LayoutProps {
    children: ReactNode;
    navLinks?: NavLinkDef[];
}

export const Layout: React.FC<LayoutProps> = ({ children, navLinks }) => {
    return (
        <div className="flex flex-col min-h-screen relative pb-[60px]">
            {navLinks && navLinks.length > 0 && (
                <header>
                    <Navbar links={navLinks} />
                </header>
            )}

            <div className="container mx-auto px-4 max-w-6xl flex-grow">
                <main role="main" className="pb-3">
                    {children}
                </main>
            </div>

            <footer className="border-t border-gray-200 text-gray-500 absolute bottom-0 w-full h-[60px] leading-[60px]">
                <div className="container mx-auto px-4 max-w-6xl">
                    &copy; 2025 - EduGraph - <Link to="/privacy" className="text-blue-600 hover:underline">Privacy</Link>
                </div>
            </footer>
        </div>
    );
};