"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { getNewMovies, getMoviesByCategory, getMoviesByList } from '../services/api';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import Loader from '../components/Loader';

export default function Home() {
    const [movies, setMovies] = useState([]);
    const [actionMovies, setActionMovies] = useState([]);
    const [romanceMovies, setRomanceMovies] = useState([]);
    const [animeMovies, setAnimeMovies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                // Fetch new movies and other categories/lists
                const [newData, actionData, romanceData, animeData] = await Promise.all([
                    getNewMovies(1),
                    getMoviesByCategory('hanh-dong'),
                    getMoviesByCategory('tinh-cam'),
                    getMoviesByList('hoat-hinh')
                ]);

                if (newData && newData.items) setMovies(newData.items);
                // API now returns { items, params } object — extract .items
                if (actionData) setActionMovies(actionData.items || actionData);
                if (romanceData) setRomanceMovies(romanceData.items || romanceData);
                if (animeData) setAnimeMovies(animeData.items || animeData);
            } catch (err) {
                console.error("Error fetching homepage groups:", err);
            }
            setLoading(false);
        };
        fetchMovies();
    }, []);

    const [topMovies, setTopMovies] = useState([]);

    useEffect(() => {
        if (!movies.length) return;
        const pool = movies.slice(0, Math.min(20, movies.length));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTopMovies([...pool].sort(() => Math.random() - 0.5).slice(0, 10));
    }, [movies]);

    // Auto-slide Hero through all movies
    useEffect(() => {
        if (topMovies.length === 0) return;
        const interval = setInterval(() => {
            setHeroIndex(prev => (prev + 1) % topMovies.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [topMovies]);

    if (loading && movies.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] pt-20">
                <Loader text="Đợi xíu..." />
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Auto-sliding Crossfade Hero Wrapper */}
            <div className="relative w-full h-[65vh] md:h-[80vh] min-h-[450px] md:min-h-[600px] bg-black overflow-hidden">
                {topMovies.map((m, idx) => (
                    <div
                        key={m._id || idx}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                    >
                        <Hero movie={m} />
                    </div>
                ))}
            </div>

            {/* Smooth transition from hero — no overlap */}
            <div className="relative z-20 space-y-8 md:space-y-12 mb-16 bg-background pt-6 md:pt-10">
                <MovieRow
                    title="Phim mới cập nhật"
                    movies={movies}
                    isContinueWatching={true}
                    viewAllLink="/phim-le"
                />
                <MovieRow
                    title="Thịnh hành"
                    movies={[...movies].reverse()}
                    viewAllLink="/phim-bo"
                />
                <MovieRow
                    title="Hành Động Kịch Tính"
                    movies={actionMovies}
                    viewAllLink="/the-loai/hanh-dong"
                />
                <MovieRow
                    title="Phim tình cảm"
                    movies={romanceMovies}
                    viewAllLink="/the-loai/tinh-cam"
                />
                <MovieRow
                    title="Phim hoạt hình"
                    movies={animeMovies}
                    viewAllLink="/the-loai/hoat-hinh"
                />
            </div>
        </div>
    );
}
