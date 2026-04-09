const BASE_URL = 'https://ophim1.com';
const API_V1 = 'https://ophim1.com/v1/api';

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
    const data = await res.json();
    CACHE.set(url, { data, time: Date.now() });
    return data;
};

export const getNewMovies = async (page = 1) => {
    try {
        const data = await fetchWithCache(`${API_V1}/danh-sach/phim-moi-cap-nhat?page=${page}`);
        if (data?.data?.items) return { items: data.data.items, ...data.data };
        return data;
    } catch (error) { console.error(error); return null; }
};

export const getMovieDetail = async (slug) => {
    try {
        return await fetchWithCache(`${BASE_URL}/phim/${slug}`);
    } catch (error) { console.error(error); return null; }
};

export const searchMovies = async (keyword, limit = 24, page = 1) => {
    try {
        return await fetchWithCache(`${API_V1}/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=${limit}&page=${page}`);
    } catch (error) { console.error(error); return null; }
};

export const getCategories = async () => {
    try {
        return await fetchWithCache(`${API_V1}/the-loai`);
    } catch (error) { console.error(error); return null; }
};

export const getCountries = async () => {
    try {
        return await fetchWithCache(`${API_V1}/quoc-gia`);
    } catch (error) { console.error(error); return null; }
};

export const getMoviesByList = async (listSlug, page = 1, year = null) => {
    try {
        const yearParam = year ? `&year=${year}` : '';
        const data = await fetchWithCache(`${API_V1}/danh-sach/${listSlug}?page=${page}${yearParam}`);
        // Return full data object so Browse can read pagination info
        if (data?.data?.items) return data.data;
        return { items: [], params: {} };
    } catch (error) { console.error(error); return { items: [], params: {} }; }
};


export const getMoviesByCategory = async (categorySlug, page = 1, year = null) => {
    try {
        const yearParam = year ? `&year=${year}` : '';
        const data = await fetchWithCache(`${API_V1}/the-loai/${categorySlug}?page=${page}${yearParam}`);
        // Return full data object so Browse can read pagination info
        if (data?.data?.items) return data.data;
        return { items: [], params: {} };
    } catch (error) { console.error(error); return { items: [], params: {} }; }
};


export const getMoviesByCountry = async (countrySlug, page = 1, year = null) => {
    try {
        const yearParam = year ? `&year=${year}` : '';
        const data = await fetchWithCache(`${API_V1}/quoc-gia/${countrySlug}?page=${page}${yearParam}`);
        if (data?.data) return data.data;
        return null;
    } catch (error) { console.error(error); return null; }
};


export const getTopMovies = async (type = 'phim-bo', page = 1) => {
    try {
        const data = await fetchWithCache(`${API_V1}/danh-sach/${type}?page=${page}`);
        if (data?.data) return data.data;
        return null;
    } catch (error) { console.error(error); return null; }
};
