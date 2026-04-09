"use client";
import React, { useState, useEffect } from 'react';

// ── EpisodePanel ──────────────────────────────────────────────────────────────
const CHUNK = 100;

export default function EpisodePanel({ serverData, currentEpisode, onSelect }) {
    const currentIdx = serverData.findIndex(ep => ep.name === currentEpisode?.name);
    // Fixed: Math.floor needs single division expression
    const initialRange = Math.floor(Math.max(0, currentIdx) / CHUNK) * CHUNK;
    const [rangeStart, setRangeStart] = useState(initialRange);

    const totalChunks = Math.ceil(serverData.length / CHUNK);
    const visibleEps = serverData.slice(rangeStart, rangeStart + CHUNK);

    // Auto-switch tab when current episode changes
    useEffect(() => {
        if (currentIdx >= 0) {
            setRangeStart(Math.floor(currentIdx / CHUNK) * CHUNK);
        }
    }, [currentEpisode, currentIdx]);

    return (
        <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full flex-none" />
                <span className="font-sans font-bold text-white text-base">Danh sách tập</span>
                <span className="text-xs text-white/30 font-sans">({serverData.length} tập)</span>
            </div>

            {/* Range tabs */}
            {totalChunks > 1 && (
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: totalChunks }, (_, i) => {
                        const start = i * CHUNK;
                        const end = Math.min(start + CHUNK - 1, serverData.length - 1);
                        const isActive = rangeStart === start;
                        const hasCurrent = currentIdx >= start && currentIdx <= end;
                        return (
                            <button
                                key={i}
                                onClick={() => setRangeStart(start)}
                                className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${isActive
                                    ? 'bg-primary text-white border-primary'
                                    : hasCurrent
                                        ? 'bg-primary/20 text-primary border-primary/40'
                                        : 'bg-white/5 text-white/50 border-white/8 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {start + 1}–{end + 1}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Scrollable episode grid */}
            <div className="max-h-48 overflow-y-auto overscroll-contain rounded-xl bg-black/20 border border-white/5 p-3 hide-scrollbar">
                <div className="flex flex-wrap gap-2">
                    {visibleEps.map((ep, i) => {
                        const isActive = currentEpisode?.name === ep.name;
                        return (
                            <button
                                key={i}
                                onClick={() => onSelect(ep)}
                                className={`min-w-[44px] px-2.5 py-2 text-xs font-bold rounded-lg border transition-all ${isActive
                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/40 scale-105'
                                    : 'bg-surface-container-high text-white/60 border-white/8 hover:bg-primary/20 hover:border-primary/40 hover:text-white'
                                    }`}
                            >
                                {ep.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

