"use client";
import React from 'react';
import { Play, Heart, Bookmark } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MovieCard({ movie, isContinueWatching, isGrid }) {
    const getImageUrl = (path) => {
        if (!path) return null;
        const url = path.startsWith('http') ? path : `https://img.ophim.live/uploads/movies/${path}`;
        const cleanUrl = url.replace(/^https?:\/\//, '');
        // Keep high quality for main cards to avoid making the site look bad
        return `https://i0.wp.com/${cleanUrl}?resize=400,600&quality=85`;
    };

    // Card is portrait — always prefer thumb_url (vertical ratio)
    const cardImg = movie.thumb_url || movie.poster_url
        ? getImageUrl(movie.thumb_url || movie.poster_url)
        : null;

    const layoutClasses = isGrid
        ? "w-full"
        : "flex-none w-[160px] sm:w-[180px] md:w-[190px] lg:w-[210px] snap-start";

    return (
        <div className={`group/item flex flex-col gap-3 ${layoutClasses}`}>
            {/* Poster Card */}
            <div className="relative aspect-[2/3] transition-all duration-500 block group/card shadow-lg hover:shadow-2xl hover:shadow-primary/30 bg-surface-container-low group-hover/card:-translate-y-1">
                <Link href={`/phim/${movie.slug}`} 
                    className="block w-full h-full overflow-hidden rounded-lg relative"
                    draggable={false}
                >
                    {cardImg ? (
                        <Image
                            src={cardImg}
                            alt={movie.name}
                            fill
                            sizes="(max-width: 768px) 160px, 210px"
                            className="object-cover transition-transform duration-700 group-hover/card:scale-110 pointer-events-none"
                            unoptimized
                            draggable={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                            <span className="text-white/20 text-xs font-bold uppercase tracking-widest">No Image</span>
                        </div>
                    )}
                </Link>

                {/* Top Actions - Bookmark/Heart - Now subtle glass buttons */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 z-20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-2 group-hover/card:translate-x-0">
                    <button
                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-primary text-white transition-all backdrop-blur-md border border-white/10 shadow-lg hover:scale-110 active:scale-95"
                        title="Thêm vào yêu thích"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button
                        className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-primary text-white transition-all backdrop-blur-md border border-white/10 shadow-lg hover:scale-110 active:scale-95"
                        title="Lưu phim"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <Bookmark className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>

                {/* Top Badge Info (Movie/Episode) - Muted style */}
                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="px-2 py-1 bg-black/40 text-white text-[10px] md:text-[11px] font-bold tracking-wider uppercase rounded-md backdrop-blur-md border border-white/10 shadow-lg">
                        {movie.type === 'single' || parseInt(movie.episode_total) === 1 ? 'Movie' : (movie.episode_current || 'Tập 1')}
                    </span>
                </div>

                {/* Bottom Overlay - Visible info + Hover Button */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 flex flex-col items-center justify-end z-10 pointer-events-none">
                    {/* Shadow/Gradient for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/95 via-black/50 to-transparent z-0 rounded-b-lg pointer-events-none"></div>

                    {/* Artistic Original Name - Lowered to the very bottom */}
                    <div className="absolute inset-x-0 bottom-2 z-10 px-3 group-hover/card:opacity-0 transition-opacity duration-300 pointer-events-none">
                        <h4 className="text-[11px] md:text-[13px] font-medium text-white/90 truncate drop-shadow-md tracking-[0.05em] uppercase italic text-left">
                            {movie.origin_name}
                        </h4>
                    </div>

                    {/* Large "Watch" Button - absolute to center bottom */}
                    <Link href={`/phim/${movie.slug}?play=true`}
                        className="absolute inset-x-3 bottom-3 z-20 pointer-events-auto flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg font-bold text-xs md:text-sm hover:bg-primary/90 transition-all shadow-xl hover:scale-[1.03] active:scale-95 opacity-0 translate-y-4 group-hover/card:opacity-100 group-hover/card:translate-y-0 duration-300"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Xem Phim
                    </Link>
                </div>
            </div>

            {/* Vietnamese Name outside card */}
            <Link href={`/phim/${movie.slug}`} className="block px-1">
                <h3 className="text-sm md:text-base font-sans font-bold text-on-surface line-clamp-1 group-hover/item:text-primary transition-colors duration-300">
                    {movie.name}
                </h3>
            </Link>
        </div>
    );
}
