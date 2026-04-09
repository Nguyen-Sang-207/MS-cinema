"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getMoviesByCategory, getMoviesByList, getMoviesByCountry, getCategories, getCountries } from '@/services/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import { ChevronDown, X, Check, SlidersHorizontal, Search, RotateCcw, Shuffle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1970;

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Cũ nhất', value: 'oldest' },
    { label: 'Tên A - Z', value: 'name_asc' },
    { label: 'Tên Z - A', value: 'name_desc' },
];

const TYPES = [

    { label: 'Tất cả', value: '' },
    { label: 'Phim Lẻ', value: 'single' },
    { label: 'Phim Bộ', value: 'series' },
];


const TYPE_CONFIG = {
    'the-loai': {
        label: 'Thể Loại',
        fetcher: (slug, page, year) => getMoviesByCategory(slug, page, year),
    },
    'quoc-gia': {
        label: 'Quốc Gia',
        fetcher: (slug, page, year) => getMoviesByCountry(slug, page, year),
    },
    'phim-le': {
        label: 'Danh Sách',
        slug: 'phim-le',
        fetcher: (slug, page, year) => getMoviesByList('phim-le', page, year),
    },
    'phim-bo': {
        label: 'Danh Sách',
        slug: 'phim-bo',
        fetcher: (slug, page, year) => getMoviesByList('phim-bo', page, year),
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function MobileFilterSection({ title, children }) {
    return (
        <div className="flex flex-col gap-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{title}</p>
            {children}
        </div>
    );
}

function DualRangeSlider({ min, max, valueMin, valueMax, onChange }) {
    const [singleMode, setSingleMode] = useState(false);
    const [minInput, setMinInput] = useState(String(valueMin));
    const [maxInput, setMaxInput] = useState(String(valueMax));
    const [singleInput, setSingleInput] = useState('');

    useEffect(() => { setMinInput(String(valueMin)); }, [valueMin]);
    useEffect(() => { setMaxInput(String(valueMax)); }, [valueMax]);

    const fillLeft = ((valueMin - min) / (max - min)) * 100;
    const fillRight = 100 - ((valueMax - min) / (max - min)) * 100;

    const parseYearInput = (val) => {
        let y = parseInt(val);
        if (isNaN(y)) return NaN;
        // If user typed exactly 2 digits, convert to 19xx or 20xx
        if (String(val).length === 2) {
            const currentYY = CURRENT_YEAR % 100;
            if (y <= currentYY) y += 2000;
            else y += 1900;
        }
        return Math.max(min, Math.min(max, y));
    };

    const commitMin = (val) => {
        const y = parseYearInput(val);
        if (!isNaN(y) && y < valueMax) onChange(y, valueMax);
        else setMinInput(String(valueMin));
    };
    const commitMax = (val) => {
        const y = parseYearInput(val);
        if (!isNaN(y) && y > valueMin) onChange(valueMin, y);
        else setMaxInput(String(valueMax));
    };
    const commitSingle = (val) => {
        const y = parseYearInput(val);
        if (!isNaN(y)) {
            onChange(y, y);
            setSingleInput(String(y));
        }
    };
    const handleReset = () => {
        setSingleInput('');
        setSingleMode(false);
        onChange(MIN_YEAR, CURRENT_YEAR);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <button type="button" onClick={handleReset}
                    className={`flex-none px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${valueMin === MIN_YEAR && valueMax === CURRENT_YEAR && !singleMode
                            ? 'bg-white/5 text-white border-white/10'
                            : 'bg-transparent text-white/60 border-transparent hover:text-white hover:bg-white/5'
                        }`}>
                    Tất cả
                </button>
                <div className="flex-1 flex items-center bg-transparent border border-white/10 focus-within:border-primary rounded-lg px-3 gap-2 transition-colors">
                    <span className="text-xs text-white/50 whitespace-nowrap flex-none">Năm</span>
                    <input
                        type="number" min={min} max={max} value={singleInput}
                        onChange={e => { setSingleInput(e.target.value); setSingleMode(true); }}
                        onBlur={e => { if (e.target.value) commitSingle(e.target.value); }}
                        onKeyDown={e => { if (e.key === 'Enter' && singleInput) commitSingle(singleInput); }}
                        className="flex-1 bg-transparent py-2 text-sm font-semibold text-white outline-none min-w-0"
                    />
                    {singleInput && (
                        <button type="button" onClick={() => { setSingleInput(''); setSingleMode(false); onChange(MIN_YEAR, CURRENT_YEAR); }}
                            className="flex-none text-white/40 hover:text-white transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {!singleMode && (
                <>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-transparent border border-white/10 focus-within:border-primary rounded-lg px-2 py-2 transition-colors">
                            <p className="text-[10px] text-white/50 uppercase tracking-widest text-center mb-0.5">Từ năm</p>
                            <input type="number" min={min} max={max} value={minInput}
                                onChange={e => setMinInput(e.target.value)}
                                onBlur={e => commitMin(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && commitMin(minInput)}
                                className="w-full bg-transparent text-sm font-semibold text-white text-center outline-none"
                            />
                        </div>
                        <span className="text-white/20 flex-none px-1">→</span>
                        <div className="flex-1 bg-transparent border border-white/10 focus-within:border-primary rounded-lg px-2 py-2 transition-colors">
                            <p className="text-[10px] text-white/50 uppercase tracking-widest text-center mb-0.5">Đến năm</p>
                            <input type="number" min={min} max={max} value={maxInput}
                                onChange={e => setMaxInput(e.target.value)}
                                onBlur={e => commitMax(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && commitMax(maxInput)}
                                className="w-full bg-transparent text-sm font-semibold text-white text-center outline-none"
                            />
                        </div>
                    </div>
                    <div className="relative h-7 flex items-center mt-2">
                        <div className="absolute left-0 right-0 h-1.5 rounded-lg bg-white/10 pointer-events-none" />
                        <div className="absolute h-1.5 rounded-lg bg-primary pointer-events-none"
                            style={{ left: `${fillLeft}%`, right: `${fillRight}%` }} />
                        <input type="range" min={min} max={max} value={valueMin}
                            onChange={e => onChange(Math.min(Number(e.target.value), valueMax - 1), valueMax)}
                            className="slider-dual absolute inset-0 w-full" />
                        <input type="range" min={min} max={max} value={valueMax}
                            onChange={e => onChange(valueMin, Math.max(Number(e.target.value), valueMin + 1))}
                            className="slider-dual absolute inset-0 w-full" />
                    </div>
                </>
            )}
        </div>
    );
}

function FilterPill({ label, active, onClear, onClose, children }) {
    const [open, setOpen] = useState(false);

    const [pos, setPos] = useState({ top: 0, left: 0 });
    const pillRef = useRef(null);

    const latestOnClose = useRef(onClose);
    useEffect(() => { latestOnClose.current = onClose; }, [onClose]);

    const openDropdown = () => {
        if (pillRef.current) {
            const rect = pillRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 8,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - Math.min(window.innerWidth - 32, 320))),
            });
        }
        setOpen(true);
    };

    const closeDropdown = () => {
        setOpen(false);
        latestOnClose.current?.(); // Commit pending state using latest closure
    };

    // Close on outside click (use mouseup to ensure input blurs have processed)
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            const portal = document.getElementById('fp-portal');
            if (!pillRef.current?.contains(e.target) && !portal?.contains(e.target)) {
                closeDropdown();
            }
        };

        document.addEventListener('mouseup', handler);
        return () => document.removeEventListener('mouseup', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = () => closeDropdown();

        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, [open]);

    return (
        <div ref={pillRef} className="relative flex-none">
            <div className={`flex items-center rounded-xl border text-sm font-bold transition-all select-none backdrop-blur-md ${active
                    ? 'bg-primary/20 text-white border-primary/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}>
                <span className="pl-4 pr-2 py-2.5 whitespace-nowrap cursor-pointer"
                    onClick={() => (open ? closeDropdown() : openDropdown())}>
                    {label}
                </span>
                {active ? (
                    <span className="pr-3 py-2.5 cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); onClear?.(); closeDropdown(); }}>

                        <X className="w-3.5 h-3.5" />
                    </span>
                ) : (
                    <span className="pr-3 py-2.5 cursor-pointer opacity-50"
                        onClick={() => (open ? closeDropdown() : openDropdown())}>

                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </span>
                )}
            </div>

            {createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            id="fp-portal"
                            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
                            className="bg-[#0f0f15]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden max-w-[calc(100vw-32px)] min-w-[180px] ring-1 ring-white/5"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="w-full max-h-[60vh] overflow-y-auto hide-scrollbar rounded-2xl">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

function RadioList({ options, value, onChange }) {
    return (
        <div className="py-2 flex flex-col w-full">
            {options.map(opt => (
                <div key={opt.value} onClick={() => onChange(opt.value)}
                    className={`flex items-center justify-between w-full text-left px-5 py-2.5 text-sm transition-colors cursor-pointer ${value === opt.value ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}>
                    <span>{opt.label}</span>
                    {value === opt.value && <Check className="w-4 h-4 text-primary flex-none" />}
                </div>
            ))}
        </div>
    );
}

function ScrollableList({ items, value, onChange }) {
    return (
        <div className="max-h-72 overflow-y-auto py-2 flex flex-col w-full hide-scrollbar">
            {[{ name: 'Tất cả', slug: '' }, ...items].map(item => (
                <div key={item.slug} onClick={() => onChange(item.slug)}
                    className={`flex items-center justify-between w-full text-left px-5 py-2.5 text-sm transition-colors cursor-pointer ${value === item.slug ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}>
                    <span>{item.name}</span>
                    {value === item.slug && <Check className="w-4 h-4 text-primary flex-none" />}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Browse Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Browse({ type: typeProp }) {
    const { slug, type: typeParam } = {} /* TODO parse slug */;
    const location = usePathname();

    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageTitle, setPageTitle] = useState('');
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);

    const [selectedType, setSelectedType] = useState('');
    const [selectedCat, setSelectedCat] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [yearMin, setYearMin] = useState(MIN_YEAR);
    const [yearMax, setYearMax] = useState(CURRENT_YEAR);

    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Draft states for mobile filter (sync to main states only on 'Áp dụng')
    const [pendingYearMin, setPendingYearMin] = useState(MIN_YEAR);
    const [pendingYearMax, setPendingYearMax] = useState(CURRENT_YEAR);
    const [pendingType, setPendingType] = useState('');
    const [pendingCat, setPendingCat] = useState('');
    const [pendingCountry, setPendingCountry] = useState('');
    const [pendingSort, setPendingSort] = useState('newest');

    // Sync draft states when opening the mobile modal
    const openMobileFilter = () => {
        setPendingYearMin(yearMin);
        setPendingYearMax(yearMax);
        setPendingType(selectedType);
        setPendingCat(selectedCat);
        setPendingCountry(selectedCountry);
        setPendingSort(sortBy);
        setIsMobileFilterOpen(true);
    };

    const isYearDefault = yearMin === MIN_YEAR && yearMax === CURRENT_YEAR;


    const normalType = typeProp || typeParam || 'the-loai';
    const config = TYPE_CONFIG[normalType] || TYPE_CONFIG['the-loai'];

    useEffect(() => {
        getCategories().then(d => {
            const raw = d?.data?.items || d?.items || [];
            setCategories(raw.filter(cat => !cat.name.includes('18+')));
        });
        getCountries().then(d => setCountries(d?.data?.items || d?.items || []));
    }, []);

    // Handle Mobile Filter History/Back gesture & Body Scroll Lock
    useEffect(() => {
        const handlePopState = () => setIsMobileFilterOpen(false);
        if (isMobileFilterOpen) {
            window.history.pushState({ filterModal: true }, '');
            window.addEventListener('popstate', handlePopState);
            document.body.style.overflow = 'hidden';
            return () => {
                window.removeEventListener('popstate', handlePopState);
                document.body.style.overflow = '';
                if (window.history.state?.filterModal) {
                    window.history.back();
                }
            };
        }
    }, [isMobileFilterOpen]);


    useEffect(() => { 
        setPage(1);
    }, [slug, normalType, selectedType, selectedCat, selectedCountry, sortBy, yearMin, yearMax]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const effectiveSlug = slug || config.slug || '';

        (async () => {
            try {
                // Fetcher wrapper that safely includes 'year' parameter
                const getItemsAndMeta = async (p, yearOverride = null) => {
                    const result = await config.fetcher(effectiveSlug, p, yearOverride);
                    if (Array.isArray(result)) return { items: result, totalPages: 1, totalItems: result.length };
                    const meta = result?.params?.pagination || result?.pagination || {};
                    const totalP = meta.totalPages || (meta.totalItems ? Math.ceil(meta.totalItems / (meta.totalItemsPerPage || 24)) : 1);
                    return { items: result?.items || [], totalPages: totalP, totalItems: meta.totalItems || 0, itemsPerPage: meta.totalItemsPerPage || 24 };
                };

                const filterAndSort = (list) => list.filter(m => {
                    if (selectedType && selectedType === 'single' && m.type !== 'single') return false;
                    if (selectedType && selectedType === 'series' && m.type === 'single') return false;
                    if (selectedCat && selectedCat !== (normalType === 'the-loai' ? slug : '')) {
                        const cats = Array.isArray(m.category) ? m.category : [];
                        if (!cats.some(c => c.slug === selectedCat || c.id === selectedCat)) return false;
                    }
                    if (selectedCountry && selectedCountry !== (normalType === 'quoc-gia' ? slug : '')) {
                        const countriesContent = Array.isArray(m.country) ? m.country : [];
                        if (!countriesContent.some(c => c.slug === selectedCountry || c.id === selectedCountry)) return false;
                    }
                    if (!isYearDefault && m.year) {
                        const y = parseInt(m.year);
                        if (!isNaN(y) && (y < yearMin || y > yearMax)) return false;
                    }
                    return true;
                }).sort((a, b) => {
                    if (sortBy === 'oldest') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
                    if (sortBy === 'newest') return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
                    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'vi');
                    if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'vi');
                    return 0;
                });

                const isYearDefault = yearMin === MIN_YEAR && yearMax === CURRENT_YEAR;
                const isSingleYear = !isYearDefault && yearMin === yearMax;
                const isYearRange = !isYearDefault && yearMin !== yearMax;

                let allItems = [];
                let tp = 1;

                if (isSingleYear) {
                    // Exact year -> Let API do all the work
                    const batch = await getItemsAndMeta(page, yearMin);
                    if (cancelled) return;
                    tp = batch.totalPages;
                    allItems = filterAndSort(batch.items);
                } else if (isYearRange) {
                    // Year Range -> Fetch multiple years in parallel
                    const yearsToFetch = [];
                    for (let y = yearMax; y >= yearMin; y--) yearsToFetch.push(y);

                    const parallelResults = await Promise.all(
                        yearsToFetch.map(y => getItemsAndMeta(page, y))
                    );
                    if (cancelled) return;

                    const seen = new Set();
                    for (const result of parallelResults) {
                        for (const movie of result.items) {
                            if (!seen.has(movie._id)) {
                                seen.add(movie._id);
                                allItems.push(movie);
                            }
                        }
                        if (result.totalPages > tp) tp = result.totalPages;
                    }

                    allItems = filterAndSort(allItems).slice(0, 24); // Cap at 24 items to avoid "dồn phim chung"
                    tp = Math.max(1, tp);
                } else {
                    // Default or huge range -> Fetch with sparse fill optimization
                    const MULTIPLIER = 5;
                    const apiStartPage = (page - 1) * MULTIPLIER + 1;
                    const batch = await getItemsAndMeta(apiStartPage, null);
                    if (cancelled) return;
                    tp = batch.totalPages;
                    allItems = filterAndSort(batch.items);

                    if (allItems.length < 24 && apiStartPage < tp) {
                        const promises = [];
                        for (let i = 1; i < MULTIPLIER; i++) {
                            if (apiStartPage + i <= tp) promises.push(getItemsAndMeta(apiStartPage + i, null));
                        }
                        const extraBatches = await Promise.all(promises);
                        for (const b of extraBatches) {
                            allItems = [...allItems, ...filterAndSort(b.items)];
                        }
                    }
                    if (allItems.length > 24) allItems = allItems.slice(0, 24);
                    
                    tp = Math.ceil(tp / MULTIPLIER);
                }

                if (cancelled) return;

                setMovies(allItems);
                setTotalPages(tp); // Always preserve real total pages so it never vanishes

                const matchName = [...categories, ...countries].find(i => i.slug === effectiveSlug);
                setPageTitle(matchName?.name || (config.slug === effectiveSlug ? config.label : ''));

            } catch (error) {
                console.error("Browse fetch error:", error);
                if (!cancelled) setMovies([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [slug, normalType, page, config.slug, config.label, config.fetcher, categories, countries, selectedType, selectedCat, selectedCountry, sortBy, yearMin, yearMax]);



    const handlePageChange = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredMovies = movies.filter(m => {
        if (selectedType && selectedType !== 'single' && m.type === 'single') return false;
        if (selectedType && selectedType !== 'series' && m.type !== 'single') return false;

        if (selectedCat && selectedCat !== (normalType === 'the-loai' ? slug : '')) {
            const categoriesContent = Array.isArray(m.category) ? m.category : [];
            const hasCat = categoriesContent.some(c => c.slug === selectedCat || c.id === selectedCat);
            if (categoriesContent.length > 0 && !hasCat) return false;
        }
        
        if (selectedCountry && selectedCountry !== (normalType === 'quoc-gia' ? slug : '')) {
             const countriesContent = Array.isArray(m.country) ? m.country : [];
             const hasCountry = countriesContent.some(c => c.slug === selectedCountry || c.id === selectedCountry);
             if (countriesContent.length > 0 && !hasCountry) return false;
        }

        if (!isYearDefault && m.year) {
            const y = parseInt(m.year);
            if (!isNaN(y) && (y < yearMin || y > yearMax)) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === 'oldest') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
        if (sortBy === 'newest') return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'vi');
        if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'vi');
        return 0;
    });

    const displayTitle = pageTitle || (normalType === 'phim-le' ? 'Phim Lẻ' : normalType === 'phim-bo' ? 'Phim Bộ' : config.label);

    const resetAll = () => {
        setSelectedType('');
        setSelectedCat(normalType === 'the-loai' && slug ? slug : '');
        setSelectedCountry(normalType === 'quoc-gia' && slug ? slug : '');
        setSortBy('newest');
        setYearMin(MIN_YEAR); setYearMax(CURRENT_YEAR);
        setPendingYearMin(MIN_YEAR); setPendingYearMax(CURRENT_YEAR);
        setPendingType('');
        setPendingCat(normalType === 'the-loai' && slug ? slug : '');
        setPendingCountry(normalType === 'quoc-gia' && slug ? slug : '');
        setPendingSort('newest');
        setPage(1);
    };

    const commitAllPending = () => {
        setYearMin(pendingYearMin);
        setYearMax(pendingYearMax);
        setSelectedType(pendingType);
        setSelectedCat(pendingCat);
        setSelectedCountry(pendingCountry);
        setSortBy(pendingSort);
        setPage(1); 
    };


    const activeCount = [
        selectedType && normalType !== 'phim-le' && normalType !== 'phim-bo' ? 'type' : '',
        selectedCat && normalType !== 'the-loai' ? 'cat' : '',
        selectedCountry && normalType !== 'quoc-gia' ? 'country' : '',
        sortBy !== 'newest' ? 'sort' : '',
        !isYearDefault ? 'year' : '',
    ].filter(Boolean).length;

    const sortLabel = SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Sắp xếp';
    const typeLabel = selectedType ? TYPES.find(t => t.value === selectedType)?.label : 'Loại phim';
    const catLabel = selectedCat ? categories.find(c => c.slug === selectedCat)?.name : 'Thể loại';
    const countryLabel = selectedCountry ? countries.find(c => c.slug === selectedCountry)?.name : 'Quốc gia';
    const yearLabel = isYearDefault ? 'Năm' : yearMin === yearMax ? `${yearMin}` : `${yearMin}–${yearMax}`;


    return (
        <div className="min-h-screen bg-background pt-20 md:pt-24 pb-20">
            <style>{`
                .slider-dual {
                    -webkit-appearance: none; appearance: none;
                    background: transparent; pointer-events: none;
                    height: 28px;
                }
                .slider-dual::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #3b82f6; border: 2.5px solid #fff;
                    pointer-events: all; cursor: pointer;
                    box-shadow: 0 0 8px rgba(59,130,246,.6);
                    transition: transform .15s;
                }
                .slider-dual::-webkit-slider-thumb:hover { transform: scale(1.15); }
                .slider-dual::-moz-range-thumb {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #3b82f6; border: 2.5px solid #fff;
                    pointer-events: all; cursor: pointer;
                    box-shadow: 0 0 8px rgba(59,130,246,.6);
                }
                .slider-dual::-webkit-slider-runnable-track { background: transparent; }
                .slider-dual::-moz-range-track { background: transparent; }
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <div className="max-w-[1400px] mx-auto px-4 md:px-12">
                
                <div className="mb-6">
                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-0.5">Khám phá</p>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl md:text-3xl font-sans font-bold text-white tracking-tight">
                            {displayTitle}
                        </h1>
                        {!loading && filteredMovies.length > 0 && (
                            <p className="text-sm text-white/35 font-medium ml-0.5">Hiển thị {filteredMovies.length} bộ phim</p>
                        )}
                    </div>
                </div>

                <div className="md:hidden mb-6">
                    <button onClick={() => setIsMobileFilterOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white active:bg-white/10 transition-colors">
                        <SlidersHorizontal className="w-4 h-4 text-primary" /> 
                        <span>Bộ lọc phim</span>
                        {activeCount > 0 && <span className="w-4 h-4 rounded-sm bg-primary flex items-center justify-center text-[10px] ml-1">{activeCount}</span>}
                    </button>
                </div>

                <div className="hidden md:block mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                        <FilterPill label={sortLabel} active={sortBy !== 'newest'} onClear={() => setSortBy('newest')}>
                            <div className="w-52">
                                <RadioList options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
                            </div>
                        </FilterPill>

                        <FilterPill
                            label={yearLabel}
                            active={!isYearDefault}
                            onClear={() => { setYearMin(MIN_YEAR); setYearMax(CURRENT_YEAR); setPendingYearMin(MIN_YEAR); setPendingYearMax(CURRENT_YEAR); }}
                            onClose={commitAllPending}>
                            <div className="w-[300px] max-w-full px-5 py-5">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-4">Năm sản xuất</p>
                                <DualRangeSlider
                                    min={MIN_YEAR} max={CURRENT_YEAR}
                                    valueMin={pendingYearMin} valueMax={pendingYearMax}
                                    onChange={(mn, mx) => { setPendingYearMin(mn); setPendingYearMax(mx); }}
                                />
                            </div>
                        </FilterPill>


                        {normalType !== 'phim-le' && normalType !== 'phim-bo' && (
                            <FilterPill label={typeLabel} active={!!selectedType} onClear={() => setSelectedType('')}>
                                <div className="w-44">
                                    <RadioList options={TYPES} value={selectedType} onChange={setSelectedType} />
                                </div>
                            </FilterPill>
                        )}



                        {categories.length > 0 && normalType !== 'the-loai' && (
                            <FilterPill label={catLabel} active={!!selectedCat && selectedCat !== slug} onClear={() => setSelectedCat('')}>
                                <div className="w-48">
                                    <ScrollableList items={categories} value={selectedCat} onChange={setSelectedCat} />
                                </div>
                            </FilterPill>
                        )}

                        {countries.length > 0 && normalType !== 'quoc-gia' && (
                            <FilterPill label={countryLabel} active={!!selectedCountry && selectedCountry !== slug} onClear={() => setSelectedCountry('')}>
                                <div className="w-48">
                                    <ScrollableList items={countries} value={selectedCountry} onChange={setSelectedCountry} />
                                </div>
                            </FilterPill>
                        )}

                        {activeCount > 0 && (
                            <div onClick={resetAll}
                                className="flex-none flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 bg-red-500/5 hover:bg-red-500/10 rounded-lg font-bold cursor-pointer whitespace-nowrap transition-all">
                                <X className="w-3.5 h-3.5" /> Xóa ({activeCount})
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredMovies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <p className="text-white/40 text-lg font-semibold">Không tìm thấy bộ phim nào phù hợp với bộ lọc.</p>
                    </div>
                ) : (
                    <>
                        <div className="movie-grid">
                            {filteredMovies.map(movie => (
                                <MovieCard key={movie._id || movie.slug} movie={movie} isGrid />
                            ))}
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                    </>
                )}
            </div>

            {/* ── Mobile Filter Bottom Sheet ── */}
            <div className={`fixed inset-0 z-[100] flex flex-col justify-end md:hidden transition-all duration-300 ${isMobileFilterOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileFilterOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileFilterOpen(false)} />
                
                {/* Sheet Content */}
                <div className={`relative w-full max-h-[82vh] bg-[#121216] rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isMobileFilterOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                        
                        {/* Drag Handle for Swipe-to-close */}
                        <div className="w-full flex justify-center pt-4 pb-2" 
                             onTouchStart={e => e.currentTarget.dataset.startY = e.touches[0].clientY}
                             onTouchEnd={e => {
                                 if (e.changedTouches[0].clientY - (e.currentTarget.dataset.startY || 0) > 40) setIsMobileFilterOpen(false);
                             }}>
                            <div className="w-12 h-1.5 bg-white/20 rounded-full pointer-events-none" />
                        </div>

                        {/* Header */}
                        <div className="flex-none flex items-center justify-between px-6 pb-4 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Chọn bộ lọc
                            </h3>
                            <button onClick={() => setIsMobileFilterOpen(false)} className="text-primary text-sm font-bold active:opacity-70 transition-opacity">
                                XONG
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto overscroll-none px-6 py-4 pb-28 hide-scrollbar flex flex-col gap-6"
                            onTouchStart={e => {
                                if (e.currentTarget.scrollTop <= 0) {
                                    e.currentTarget.dataset.tsY = e.touches[0].clientY;
                                } else {
                                    e.currentTarget.dataset.tsY = '';
                                }
                            }}
                            onTouchEnd={e => {
                                if (e.currentTarget.dataset.tsY) {
                                    const dy = e.changedTouches[0].clientY - parseFloat(e.currentTarget.dataset.tsY);
                                    if (dy > 60 && e.currentTarget.scrollTop <= 0) {
                                        setIsMobileFilterOpen(false);
                                    }
                                }
                            }}
                        >
                            
                            <MobileFilterSection title="Sắp xếp theo">
                                <div className="relative">
                                    <select value={pendingSort} onChange={e => setPendingSort(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer">
                                        {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-[#121216]">{opt.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                            </MobileFilterSection>

                            <MobileFilterSection title="Khoảng năm">
                                <div className="px-1 py-1">
                                <DualRangeSlider min={MIN_YEAR} max={CURRENT_YEAR} valueMin={pendingYearMin} valueMax={pendingYearMax} onChange={(mn, mx) => { setPendingYearMin(mn); setPendingYearMax(mx); }} />
                            </div>

                            </MobileFilterSection>

                            {normalType !== 'phim-le' && normalType !== 'phim-bo' && (
                                <MobileFilterSection title="Loại">
                                    <div className="relative">
                                        <select value={pendingType} onChange={e => setPendingType(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer">
                                            <option value="" className="bg-[#121216]">Tất cả</option>
                                            {TYPES.map(opt => <option key={opt.value} value={opt.value} className="bg-[#121216]">{opt.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                    </div>
                                </MobileFilterSection>
                            )}



                            {categories.length > 0 && normalType !== 'the-loai' && (
                                <MobileFilterSection title="Thể loại">
                                    <div className="relative">
                                        <select value={pendingCat} onChange={e => setPendingCat(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer">
                                            <option value="" className="bg-[#121216]">Tất cả</option>
                                            {categories.map(c => <option key={c.slug} value={c.slug} className="bg-[#121216]">{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                    </div>
                                </MobileFilterSection>
                            )}

                            {countries.length > 0 && normalType !== 'quoc-gia' && (
                                <MobileFilterSection title="Quốc gia">
                                    <div className="relative">
                                        <select value={pendingCountry} onChange={e => setPendingCountry(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer">
                                            <option value="" className="bg-[#121216]">Tất cả</option>
                                            {countries.map(c => <option key={c.slug} value={c.slug} className="bg-[#121216]">{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                    </div>
                                </MobileFilterSection>
                            )}
                        </div>

                        {/* Bottom Sticky Action */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#121216] border-t border-white/5 flex items-center gap-3">
                            <button onClick={resetAll} className="flex-none w-[120px] py-3.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-bold rounded-xl transition-colors text-sm">
                                Xóa lại {activeCount > 0 ? `(${activeCount})` : ''}
                            </button>
                            <button onClick={() => { commitAllPending(); setIsMobileFilterOpen(false); }} className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl active:bg-primary/90 transition-colors text-center text-sm shadow-[0_4px_14px_rgba(59,130,246,0.3)]">
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
        </div>
    );
}
