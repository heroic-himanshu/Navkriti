// components/TopLoadingBar.jsx
'use client';

import { useEffect, useState } from 'react';

let loadingQueue = 0;
let progressValue = 0;
let progressTimer = null;
let listeners = [];

const notifyListeners = () => {
    listeners.forEach(fn => fn());
};

export const LoadingBar = {
    start: () => {
        loadingQueue++;
        if (loadingQueue === 1) {
            progressValue = 0;
            notifyListeners();

            progressTimer = setInterval(() => {
                if (progressValue < 90) {
                    progressValue += Math.random() * 10;
                    if (progressValue > 90) progressValue = 90;
                    notifyListeners();
                }
            }, 200);
        }
    },

    done: () => {
        loadingQueue--;
        if (loadingQueue <= 0) {
            loadingQueue = 0;
            clearInterval(progressTimer);
            progressValue = 100;
            notifyListeners();

            setTimeout(() => {
                progressValue = 0;
                notifyListeners();
            }, 300);
        }
    },

    subscribe: (fn) => {
        listeners.push(fn);
        return () => {
            listeners = listeners.filter(l => l !== fn);
        };
    },

    getProgress: () => progressValue,
    isLoading: () => loadingQueue > 0
};

export default function TopLoadingBar() {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = LoadingBar.subscribe(() => {
            const currentProgress = LoadingBar.getProgress();
            const loading = LoadingBar.isLoading();

            setProgress(currentProgress);
            setIsVisible(loading || currentProgress > 0);
        });

        return unsubscribe;
    }, []);

    if (!isVisible) return null;

    const containerStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 99999,
        pointerEvents: 'none',
        backgroundColor: 'transparent'
    };

    const barStyle = {
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.8), 0 0 5px rgba(59, 130, 246, 0.5)',
        transition: progress === 100 ? 'width 200ms ease-out' : 'width 200ms ease-in-out',
        position: 'relative'
    };

    const glowStyle = {
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: '100px',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6))',
        animation: progress > 0 && progress < 100 ? 'pulse 1s infinite' : 'none'
    };

    return (
        <>
            <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
            <div style={containerStyle}>
                <div style={barStyle}>
                    {progress > 0 && progress < 100 && (
                        <div style={glowStyle}></div>
                    )}
                </div>
            </div>
        </>
    );
}
