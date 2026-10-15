const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://phimapi.com';
const API_V1 = process.env.NEXT_PUBLIC_API_V1_URL || `${BASE_URL}/v1/api`;
export const CDN_IMAGE = 'https://phimimg.com';

// Format raw image path into full valid URL
export const formatImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return `${CDN_IMAGE}${path}`;
    if (path.startsWith('upload/') || path.startsWith('uploads/')) return `${CDN_IMAGE}/${path}`;
    return `${CDN_IMAGE}/uploads/movies/${path}`;
};

// Optimized image URL via Photon CDN
export const getOptimizedImageUrl = (path, width = 400, height = null, quality = 85) => {
    if (!path) return '';
    const fullUrl = formatImageUrl(path);
    const cleanUrl = fullUrl.replace(/^https?:\/\//, '');
    if (height) {
        return `https://i0.wp.com/${cleanUrl}?resize=${width},${height}&quality=${quality}`;
    }
    return `https://i0.wp.com/${cleanUrl}?w=${width}&quality=${quality}`;
};

// Create a RAM Cache layer for lightning-fast zero-latency navigation
const CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

const fetchWithCache = async (url) => {
    if (CACHE.has(url)) {
        const cached = CACHE.get(url);
        if (Date.now() - cached.time < CACHE_TTL) return cached.data;
        CACHE.delete(url); // Expired
    }
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Fetch failed with status ${res.status}`);
    }
    const data = await res.json();
    CACHE.set(url, { data, time: Date.now() });
    return data;
};

export const getNewMovies = async (page = 1) => {
    try {
        const data = await fetchWithCache(`${API_V1}/danh-sach/phim-moi-cap-nhat?page=${page}`);
        if (data?.data?.items) return { items: data.data.items, ...data.data };
        if (data?.items) return { items: data.items, ...data };
        return data;
    } catch (error) { console.error('getNewMovies error:', error); return null; }
};

export const getMovieDetail = async (slug) => {
    try {
        return await fetchWithCache(`${BASE_URL}/phim/${slug}`);
    } catch (error) { console.error('getMovieDetail error:', error); return null; }
};

export const searchMovies = async (keyword, limit = 24, page = 1) => {
    try {
        return await fetchWithCache(`${API_V1}/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}&page=${page}`);
    } catch (error) { console.error('searchMovies error:', error); return null; }
};

export const getCategories = async () => {
    try {
        return await fetchWithCache(`${API_V1}/the-loai`);
    } catch (error) { console.error('getCategories error:', error); return null; }
};

export const getCountries = async () => {
    try {
        return await fetchWithCache(`${API_V1}/quoc-gia`);
    } catch (error) { console.error('getCountries error:', error); return null; }
};

export const getMoviesByList = async (listSlug, page = 1, year = null) => {
    try {
        const yearParam = year ? `&year=${year}` : '';
        const data = await fetchWithCache(`${API_V1}/danh-sach/${listSlug}?page=${page}${yearParam}`);
        // Return full data object so Browse can read pagination info
        if (data?.data?.items) return data.data;
        if (data?.items) return data;
        return { items: [], params: {} };
    } catch (error) { console.error('getMoviesByList error:', error); return { items: [], params: {} }; }
};

export const getMoviesByCategory = async (categorySlug, page = 1, year = null) => {
    try {
        const yearParam = year ? `&year=${year}` : '';
        const data = await fetchWithCache(`${API_V1}/the-loai/${categorySlug}?page=${page}${yearParam}`);
        // Return full data object so Browse can read pagination info
        if (data?.data?.items) return data.data;
        if (data?.items) return data;
        return { items: [], params: {} };
    } catch (error) { console.error('getMoviesByCategory error:', error); return { items: [], params: {} }; }
};

export const getMoviesByCountry = async (countrySlug, page = 1, year = null) => {
    try {
        const yearParam = year ? `&year=${year}` : '';
        const data = await fetchWithCache(`${API_V1}/quoc-gia/${countrySlug}?page=${page}${yearParam}`);
        if (data?.data?.items) return data.data;
        if (data?.data) return data.data;
        if (data?.items) return data;
        return { items: [], params: {} };
    } catch (error) { console.error('getMoviesByCountry error:', error); return { items: [], params: {} }; }
};

export const getTopMovies = async (type = 'phim-bo', page = 1) => {
    try {
        const data = await fetchWithCache(`${API_V1}/danh-sach/${type}?page=${page}`);
        if (data?.data) return data.data;
        return null;
    } catch (error) { console.error('getTopMovies error:', error); return null; }
};
