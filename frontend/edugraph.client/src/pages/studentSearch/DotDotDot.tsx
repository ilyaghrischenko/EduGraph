import React, { useEffect, useState } from 'react';

export const DotDotDot: React.FC = () => {
    const [dots, setDots] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setDots((currentDots) => (currentDots + 1) % 4), 400);
        return () => clearInterval(id);
    }, []);

    return <span>{'.'.repeat(dots)}&nbsp;</span>;
};
