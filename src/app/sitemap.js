import { getNewMovies, getCategories } from '@/services/api';

export default async function sitemap() {
    // Nếu bạn có tên miền riêng, hãy khai báo vào file .env.local biến NEXT_PUBLIC_SITE_URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ms-cinema.vercel.app';

    // Các trang lõi cố định của Website
    const routes = [
        '',
        '/loc-phim',
        '/phim-bo',
        '/phim-le',
        '/tim-kiem',
        '/xep-hang',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8, // Trang chủ ưu tiên 1.0 (cao nhất)
    }));

    try {
        // Lấy danh sách thể loại từ API để đưa vào sitemap báo cho Google Index
        const catRes = await getCategories();
        const categories = catRes?.data?.items || catRes?.items || [];
        const catRoutes = categories.map((cat) => ({
            url: `${baseUrl}/the-loai/${cat.slug}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        // Khai báo Top các PHIM VỪA CẬP NHẬT để Google thu thập dữ liệu nhanh chóng
        const newMoviesRes = await getNewMovies(1);
        const latestMovies = newMoviesRes?.items || [];
        const movieRoutes = latestMovies.map((movie) => ({
            url: `${baseUrl}/phim/${movie.slug}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'always',
            priority: 0.9,
        }));

        // Trả về tất cả hợp nhất
        return [...routes, ...catRoutes, ...movieRoutes];
    } catch (e) {
        console.error('Lỗi khi render Sitemap', e);
        return routes;
    }
}
