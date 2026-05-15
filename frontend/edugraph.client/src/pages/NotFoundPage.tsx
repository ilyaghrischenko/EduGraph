import React from 'react';
import { Layout } from '../components/Layout';
import { Seo } from '../components/Seo';
import { C, F } from '../styles/tokens';

export const NotFoundPage: React.FC = () => (
    <Layout>
        <Seo
            title="Сторінку не знайдено | EduGraph"
            description="Запитану сторінку EduGraph не знайдено."
            noindex
        />
        <div className="w-full max-w-[640px] pt-8 md:pt-12">
            <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 4vw, 1.5rem)', fontWeight: 700, color: C.textPrimary, marginBottom: '16px' }}>
                Сторінку не знайдено
            </h1>
            <p style={{ fontFamily: F.sans, color: C.textMuted, lineHeight: 1.7 }}>
                Перевірте адресу або поверніться на головну сторінку.
            </p>
        </div>
    </Layout>
);
