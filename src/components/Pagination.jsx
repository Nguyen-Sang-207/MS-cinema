"use client";
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Shared Pagination component — rounded square style
 * Props:
 *   page        : current page number (1-indexed)
 *   totalPages  : total number of pages
 *   onPageChange: callback(newPage)
 */
export default function Pagination({ page, totalPages, onPageChange }) {
    if (!totalPages || totalPages <= 1) return null;

    // Build page number array with ellipsis
    const pages = [];
    const delta = 2;
    const lo = Math.max(1, page - delta);
    const hi = Math.min(totalPages, page + delta);

    if (lo > 1) {
        pages.push(1);
        if (lo > 2) pages.push('…');
    }
    for (let i = lo; i <= hi; i++) pages.push(i);
    if (hi < totalPages) {
        if (hi < totalPages - 1) pages.push('…');
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-center gap-1.5 md:gap-2 flex-wrap mt-10 mb-8 overflow-hidden px-2">
            {/* Previous button */}
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold rounded-lg
                           bg-surface-container text-white/60 border border-white/10
                           hover:bg-white/8 hover:text-white transition-all
                           disabled:opacity-20 disabled:cursor-not-allowed whitespace-nowrap"
            >
                <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> 
                <span className="hidden xs:inline">Trước</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 md:gap-2">
                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`dots-${i}`} className="w-8 h-10 flex items-center justify-center text-white/30 text-xs md:text-sm select-none">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-xs md:text-sm font-extrabold rounded-lg border transition-all
                                ${p === page
                                    ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                                    : 'bg-surface-container text-white/60 border-white/10 hover:bg-white/8 hover:text-white'
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}
            </div>

            {/* Next button */}
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold rounded-lg
                           bg-surface-container text-white/60 border border-white/10
                           hover:bg-white/8 hover:text-white transition-all
                           disabled:opacity-20 disabled:cursor-not-allowed whitespace-nowrap"
            >
                <span className="hidden xs:inline">Sau</span>
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
        </div>
    );

}
