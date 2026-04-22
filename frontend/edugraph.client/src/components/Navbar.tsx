import React from 'react';
import { Link } from 'react-router-dom';

export interface NavLinkDef {
    label: string;
    href: string;
}

interface NavbarProps {
    links: NavLinkDef[];
}

export const Navbar: React.FC<NavbarProps> = ({ links }) => {
    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm mb-6">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-wrap items-center justify-between py-2">
                    <Link to="/" className="text-xl font-medium text-gray-900 py-1 mr-4">
                        EduGraph
                    </Link>
                    <div className="flex-grow flex items-center justify-between sm:flex-row flex-col">
                        <ul className="flex flex-row space-x-4 m-0 p-0 list-none">
                            {links.map((link) => (
                                <li key={link.href} className="nav-item">
                                    <Link
                                        to={link.href}
                                        className="block py-2 text-gray-800 hover:text-blue-600 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
};