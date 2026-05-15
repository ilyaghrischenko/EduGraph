import React from 'react';
import { C, F } from '../styles/tokens';

interface PageHeadingProps {
    eyebrow: string;
    title: string;
}

export const PageHeading: React.FC<PageHeadingProps> = ({ eyebrow, title }) => (
    <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: F.display, fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(79,255,176,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
            {eyebrow}
        </p>
        <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 5vw, 1.6rem)', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
            {title}
        </h1>
    </div>
);
