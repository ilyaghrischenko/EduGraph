import React from 'react';
import { DotDotDot } from './DotDotDot';
import { LOADING_STEPS } from './loadingSteps';

interface LoadingOverlayProps {
    currentStep: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ currentStep }) => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"
         style={{ background: 'radial-gradient(ellipse at center, #0f1520 0%, #0a0d14 70%)' }}>
        <div className="relative mb-10 h-24 w-24">
            <div className="absolute inset-0 rounded-full"
                 style={{ border: '1px solid rgba(79,255,176,0.15)' }} />
            <div className="absolute inset-0 animate-spin rounded-full"
                 style={{
                     border: '2px solid transparent',
                     borderTopColor: '#4fffb0',
                     animationDuration: '1.4s',
                 }} />
            <div className="absolute inset-3 animate-spin rounded-full"
                 style={{
                     border: '1.5px solid transparent',
                     borderTopColor: '#67e8f9',
                     animationDuration: '2.1s',
                     animationDirection: 'reverse',
                 }} />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full"
                     style={{
                         background: '#4fffb0',
                         boxShadow: '0 0 12px 4px rgba(79,255,176,0.6)',
                         animation: 'pulse 1.5s ease-in-out infinite',
                     }} />
            </div>
        </div>

        <div className="flex w-[calc(100vw-2rem)] max-w-[280px] flex-col gap-3">
            {LOADING_STEPS.map((step, index) => {
                const isDone = index < currentStep;
                const isActive = index === currentStep;
                const isPending = index > currentStep;

                return (
                    <div key={step.label} className="flex items-center gap-3 transition-all duration-500"
                         style={{ opacity: isPending ? 0.3 : 1 }}>
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                            {isDone ? (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="#4fffb0" strokeWidth="1.5" />
                                    <path d="M5 8l2 2 4-4" stroke="#4fffb0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : isActive ? (
                                <div className="h-2 w-2 rounded-full"
                                     style={{
                                         background: '#4fffb0',
                                         boxShadow: '0 0 6px 2px rgba(79,255,176,0.5)',
                                         animation: 'pulse 1s ease-in-out infinite',
                                     }} />
                            ) : (
                                <div className="h-2 w-2 rounded-full"
                                     style={{ background: 'rgba(255,255,255,0.2)' }} />
                            )}
                        </div>

                        <span className="text-sm"
                              style={{
                                  fontFamily: "'DM Sans', sans-serif",
                                  color: isDone ? '#4fffb0' : isActive ? '#e2e8f0' : '#64748b',
                                  letterSpacing: '0.01em',
                              }}>
                            {step.label}
                            {isActive && (
                                <span style={{ color: '#4fffb0' }}>
                                    <DotDotDot />
                                </span>
                            )}
                        </span>
                    </div>
                );
            })}
        </div>

        <p className="mt-8 text-xs" style={{ color: '#334155', fontFamily: "'DM Sans', sans-serif" }}>
            це може зайняти певний час
        </p>
    </div>
);
