import React from 'react';

export const TypeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.5v-1.5a3.375 3.375 0 00-3.375-3.375h-9.75A3.375 3.375 0 003 5.625v1.5m16.5 0v1.5a3.375 3.375 0 01-3.375 3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5m3.375 0h-3.375" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75V3.75m0 9h-3.375M12 3.75h3.375" />
    </svg>
);