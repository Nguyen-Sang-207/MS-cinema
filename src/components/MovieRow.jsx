"use client";
import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import MovieCard from './MovieCard';

export default function MovieRow({ title, movies, isContinueWatching, viewAllLink }) {
    const rowRef = useRef(null);

    // Mouse drag refs
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const [isDragging, setIsDragging] = useState(false);
    const isDown = useRef(false);

    // Touch direction detection refs
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const isHorizontalSwipe = useRef(null); // null=undecided, true=horizontal, false=vertical

    const scroll = (direction) => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth * 0.8
                : scrollLeft + clientWidth * 0.8;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    // ── Mouse handlers (desktop) ─────────────────────────────────────────────
    const handleMouseDown = (e) => {
        isDown.current = true;
        startX.current = e.pageX - rowRef.current.offsetLeft;
        scrollLeft.current = rowRef.current.scrollLeft;
        // Use inline style override so React re-renders can't bounce it back
        rowRef.current.style.scrollSnapType = 'none';
        rowRef.current.style.scrollBehavior = 'auto';
    };

    const handleMouseMove = (e) => {
        if (!isDown.current) return;
        e.preventDefault();
        const x = e.pageX - rowRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        if (Math.abs(walk) > 10 && !isDragging) setIsDragging(true);
        rowRef.current.scrollLeft = scrollLeft.current - walk;
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (!isDown.current) return;
            isDown.current = false;
            setTimeout(() => setIsDragging(false), 50);
            if (rowRef.current) {
                rowRef.current.style.scrollSnapType = '';
                rowRef.current.style.scrollBehavior = '';
            }
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    // ── Touch handlers (mobile) ─────────────────────────────────────────────
    // Strategy: detect swipe direction on first movement.
    // Vertical → release control, let page scroll naturally.
    // Horizontal → card row takes over.
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isHorizontalSwipe.current = null;
        if (rowRef.current) {
            rowRef.current.style.scrollSnapType = 'none';
            rowRef.current.style.scrollBehavior = 'auto';
        }
    };

    const handleTouchMove = (e) => {
        const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
        const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

        // Lock in direction on first significant movement (> 5px)
        if (isHorizontalSwipe.current === null && (dx > 5 || dy > 5)) {
            isHorizontalSwipe.current = dx > dy;
        }

        if (isHorizontalSwipe.current === false) {
            // Vertical: restore snap/smooth and do NOT block the event → page scrolls
            if (rowRef.current) {
                rowRef.current.style.scrollSnapType = '';
                rowRef.current.style.scrollBehavior = '';
            }
        }
        // Horizontal: browser's native overflow-x scroll handles card movement automatically
    };

    const handleTouchEnd = () => {
        isHorizontalSwipe.current = null;
        if (rowRef.current) {
            rowRef.current.style.scrollSnapType = '';
            rowRef.current.style.scrollBehavior = '';
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <div className="relative group w-full py-4 md:py-6">
            <div className="flex items-center justify-between mb-3 md:mb-6 px-4 md:px-12">
                <h2 className="text-lg md:text-2xl font-sans font-bold text-on-surface tracking-tight">
                    {title}
                </h2>
                {viewAllLink ? (
                    <Link href={viewAllLink}
                        className="flex items-center gap-1 text-sm font-sans font-semibold text-primary hover:text-primary-container transition-colors"
                    >
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <button className="flex items-center gap-1 text-sm font-sans font-semibold text-primary hover:text-primary-container transition-colors">
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="relative">
                {/* Left arrow - desktop only */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-primary transition-all shadow-xl border border-white/10"
                >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <div
                    ref={rowRef}
                    className={`flex gap-3 md:gap-5 overflow-x-auto hide-scrollbar scroll-smooth pb-8 pt-4 -mt-4 px-4 md:px-12 snap-x snap-mandatory select-none ${isDragging ? '[&_*]:pointer-events-none cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onDragStart={(e) => e.preventDefault()}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie._id || movie.slug}
                            movie={movie}
                            isContinueWatching={isContinueWatching}
                        />
                    ))}
                </div>

                {/* Right arrow - desktop only */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-primary transition-all shadow-xl border border-white/10"
                >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
}
