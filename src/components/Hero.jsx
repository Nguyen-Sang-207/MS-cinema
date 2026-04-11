"use client";
import React from 'react';
import Image from 'next/image';
import { Play, Clapperboard } from 'lucide-react';
import Link from 'next/link';

export default function Hero({ movie }) {
    if (!movie) return null;

    const getImageUrl = (path) => {
        if (!path) return '';
        const url = path.startsWith('http') ? path : `https://img.ophim.live/uploads/movies/${path}`;
        const cleanUrl = url.replace(/^https?:\/\//, '');
        // Fast globally distributed Photon CDN for large hero banners
        return `https://i0.wp.com/${cleanUrl}?w=1280&quality=80`;
    };

    return (
        <div className="relative w-full h-[65vh] md:h-[80vh] min-h-[450px] md:min-h-[600px] flex items-end pb-12 md:pb-24 px-4 md:px-12 overflow-hidden">
            {/* Background Images — Split by device to prevent cropping */}
            <div className="absolute inset-0 w-full h-full z-0 bg-black">
                {/* Mobile: Vertical (Portrait) */}
                {getImageUrl(movie.thumb_url || movie.poster_url) && (
                    <Image
                        src={getImageUrl(movie.thumb_url || movie.poster_url)}
                        alt={movie.name}
                        fill
                        className="object-cover object-top sm:hidden"
                        priority
                        unoptimized
                    />
                )}
                {/* Desktop: Horizontal (Landscape) */}
                {getImageUrl(movie.poster_url || movie.thumb_url) && (
                    <Image
                        src={getImageUrl(movie.poster_url || movie.thumb_url)}
                        alt={movie.name}
                        fill
                        className="object-cover object-top hidden sm:block"
                        priority
                        unoptimized
                    />
                )}
                <div className="absolute inset-0 hero-gradient"></div>
                <div className="absolute inset-0 side-gradient"></div>
                <div className="absolute inset-0 hero-vignette"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-3xl space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 text-xs md:text-sm font-sans font-bold tracking-widest uppercase text-white/60">
                    <span className="line-clamp-1 border-l-2 border-primary pl-3">{movie.origin_name}</span>
                    {movie.year && (
                        <span className="flex items-center gap-2 flex-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
                            {movie.year}
                        </span>
                    )}
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-sans font-bold text-white tracking-tight leading-[1.1] drop-shadow-2xl line-clamp-2 pb-2">
                    {movie.name}
                </h1>

                <p className={`text-sm md:text-base text-white/70 font-sans max-w-2xl leading-[1.6] drop-shadow-md ${movie.name.length > 35 ? 'line-clamp-2' : 'line-clamp-3 md:line-clamp-4'}`}>
                    {movie.content ? (
                        <span dangerouslySetInnerHTML={{ __html: movie.content }} />
                    ) : movie.name.length > 35 ? (
                        `Thưởng thức ${movie.name} (${movie.year || 'mới nhất'}) cực nét và trọn bộ, tốc độ cao ngay hôm nay tại hệ thống MS-cinema.`
                    ) : (
                        `Mời bạn theo dõi trọn phần của bộ phim ${movie.name} (${movie.origin_name}) ra mắt năm ${movie.year || 'gần đây'}. Xem Phim để thưởng thức độ phân giải sắc nét và đường truyền tốc độ cao tại MS-cinema.`
                    )}
                </p>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-4 md:pt-6">
                    <Link href={`/phim/${movie.slug}?play=true`} className="flex items-center gap-2 md:gap-3 px-5 md:px-8 py-2.5 md:py-4 bg-primary text-on-primary rounded-lg font-sans font-bold text-sm md:text-lg hover:bg-primary-container hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                        <Play className="w-4 h-4 md:w-6 md:h-6 fill-current" />
                        Xem Phim
                    </Link>

                    <Link href={`/phim/${movie.slug}`} className="flex items-center gap-2 md:gap-3 px-5 md:px-8 py-2.5 md:py-4 bg-surface-container-high/80 backdrop-blur-md text-on-surface rounded-lg font-sans font-bold text-sm md:text-lg hover:bg-surface-container-highest hover:scale-105 active:scale-95 transition-all duration-300 border border-surface-container-highest">
                        <Clapperboard className="w-4 h-4 md:w-6 md:h-6" />
                        Chi tiết
                    </Link>
                </div>
            </div>
        </div>
    );
}
