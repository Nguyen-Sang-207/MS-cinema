import React from 'react';
import { getMovieDetail } from '@/services/api';
import MovieDetailClient from './MovieDetailClient';

// Server Component để cung cấp SEO Dynamic Metadata
export async function generateMetadata({ params }) {
    const slug = (await params).slug;
    
    try {
        const data = await getMovieDetail(slug);
        if (!data || !data.movie) {
            return { title: 'Không tìm thấy phim - Movie Web' };
        }

        const movie = data.movie;
        const title = `${movie.name} - Movie Web`;
        // Helper resize ảnh như ở phía Client
        const imgUrl = (p, w = 1200) => {
            if (!p) return '/placeholder.jpg';
            const baseUrl = p.startsWith('http') ? p : `https://img.ophim.live/uploads/movies/${p}`;
            const cleanUrl = baseUrl.replace(/^https?:\/\//, '');
            return `https://i0.wp.com/${cleanUrl}?w=${w}&quality=80`;
        };

        const imageUrl = imgUrl(movie.thumb_url || movie.poster_url);
        
        let plainTextDesc = `Xem phim ${movie.name} vietsub chất lượng cao.`;
        if (movie.content) {
            // Lọc ra nội dung dạng văn bản thuần
            plainTextDesc = movie.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...';
        }

        return {
            title: title,
            description: plainTextDesc,
            openGraph: {
                title: title,
                description: plainTextDesc,
                images: [imageUrl],
                type: 'video.movie',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: plainTextDesc,
                images: [imageUrl],
            }
        };
    } catch (e) {
        return {
            title: 'Phim Tổng Hợp - Movie Web',
        };
    }
}

export default function MovieDetailPage({ params }) {
    // Truyền nguyên params xuống cho Client Component xử lý giao diện y như cũ
    return <MovieDetailClient params={params} />;
}
