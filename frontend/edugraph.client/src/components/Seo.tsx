import { useEffect } from 'react';

interface SeoProps {
    title: string;
    description: string;
    noindex?: boolean;
    imageUrl?: string;
}

function upsertMeta(selector: string, attrs: Record<string, string>): void {
    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
    }

    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertCanonical(): void {
    let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!element) {
        element = document.createElement('link');
        element.rel = 'canonical';
        document.head.appendChild(element);
    }

    element.href = window.location.href;
}

export function Seo({ title, description, noindex, imageUrl }: SeoProps) {
    useEffect(() => {
        const socialImageUrl = imageUrl ?? `${window.location.origin}/vite.svg`;

        document.title = title;
        upsertMeta('meta[name="description"]', { name: 'description', content: description });
        upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });
        upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
        upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
        upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
        upsertMeta('meta[property="og:url"]', { property: 'og:url', content: window.location.href });
        upsertMeta('meta[property="og:image"]', { property: 'og:image', content: socialImageUrl });
        upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
        upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
        upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
        upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImageUrl });
        upsertCanonical();
    }, [description, imageUrl, noindex, title]);

    return null;
}
