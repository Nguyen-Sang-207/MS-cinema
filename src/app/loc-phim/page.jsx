"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { getMoviesByCategory, getMoviesByList, getMoviesByCountry, getCategories, getCountries } from '@/services/api';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/Pagination';
import { ChevronDown, X, SlidersHorizontal, Film, Shuffle, Check, RotateCcw } from 'lucide-react';


// ─────────────────────────────────────────────────────────────────────────────
// Constants — identical to Browse.jsx
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


// ─────────────────────────────────────────────────────────────────────────────
// DualRangeSlider — copied from Browse.jsx
// ─────────────────────────────────────────────────────────────────────────────
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
        if (!isNaN(y)) { onChange(y, y); setSingleInput(String(y)); }
    };
    const handleReset = () => { setSingleInput(''); setSingleMode(false); onChange(MIN_YEAR, CURRENT_YEAR); };

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

// ─────────────────────────────────────────────────────────────────────────────
// FilterPill, RadioList, ScrollableList — Identical to Browse/Search
// ─────────────────────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClear, onClose, children }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const pillRef = useRef(null);

    const latestOnClose = useRef(onClose);
    latestOnClose.current = onClose; // Always keep the latest callback without firing re-renders

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
        latestOnClose.current?.();
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
// MobileFilterSection — same as Browse.jsx
// ─────────────────────────────────────────────────────────────────────────────
function MobileFilterSection({ title, children }) {
    return (
        <div className="flex flex-col gap-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{title}</p>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Filter Page
// ─────────────────────────────────────────────────────────────────────────────
export default function FilterPage() {
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);

    // Filter state (applied — used for actual filtering)
    const [selectedType, setSelectedType] = useState('');
    const [selectedCat, setSelectedCat] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [yearMin, setYearMin] = useState(MIN_YEAR);
    const [yearMax, setYearMax] = useState(CURRENT_YEAR);

    // Draft states for mobile filter (sync to main states only on 'Tìm phim')
    const [pendingYearMin, setPendingYearMin] = useState(MIN_YEAR);
    const [pendingYearMax, setPendingYearMax] = useState(CURRENT_YEAR);
    const [pendingType, setPendingType] = useState('');
    const [pendingCat, setPendingCat] = useState('');
    const [pendingCountry, setPendingCountry] = useState('');
    const [pendingSort, setPendingSort] = useState('newest');

    // Filter panel open/close (bottom sheet)
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Sync draft states when opening the mobile modal
    const openMobileFilter = () => {
        setPendingYearMin(yearMin);
        setPendingYearMax(yearMax);
        setPendingType(selectedType);
        setPendingCat(selectedCat);
        setPendingCountry(selectedCountry);
        setPendingSort(sortBy);
        setIsFilterOpen(true);
    };

    // Results state
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const isYearDefault = yearMin === MIN_YEAR && yearMax === CURRENT_YEAR;

    useEffect(() => {
        getCategories().then(d => {
            const raw = d?.data?.items || d?.items || [];
            // Filter out 18+ categories
            setCategories(raw.filter(cat => !cat.name.includes('18+')));
        });
        getCountries().then(d => setCountries(d?.data?.items || d?.items || []));
    }, []);

    // Handle Mobile Filter History/Back gesture & Body Scroll Lock
    useEffect(() => {
        const handlePopState = () => setIsFilterOpen(false);
        if (isFilterOpen) {
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
    }, [isFilterOpen]);

    const activeCount = [

        selectedType, selectedCat, selectedCountry,
        sortBy !== 'newest' ? 'sort' : '',
        !isYearDefault ? 'year' : '',
    ].filter(Boolean).length;

    const resetAll = () => {
        setSelectedType(''); setSelectedCat(''); setSelectedCountry('');
        setSortBy('newest');
        setYearMin(MIN_YEAR); setYearMax(CURRENT_YEAR);
        setPendingYearMin(MIN_YEAR); setPendingYearMax(CURRENT_YEAR);
        setPendingType(''); setPendingCat(''); setPendingCountry('');
        setPendingSort('newest');
    };

    // Commit pending year to applied state, then run filter
    const handleApply = (pg = 1) => {
        setYearMin(pendingYearMin);
        setYearMax(pendingYearMax);
        applyFiltersWithYear(pendingYearMin, pendingYearMax, pg);
    };

    // Commit pending year to applied state (for desktop pill close)
    // Commit ALL pending states to applied states
    const commitAllPending = () => {
        setYearMin(pendingYearMin);
        setYearMax(pendingYearMax);
        setSelectedType(pendingType);
        setSelectedCat(pendingCat);
        setSelectedCountry(pendingCountry);
        setSortBy(pendingSort);
        setPage(1); // Auto reset to first page
    };

    // Desktop auto-apply hooks
    useEffect(() => {
        // Skip initial mount render if no specific filters are applied
        if (!searched && activeCount === 0) return;
        applyFiltersWithYear(yearMin, yearMax, 1);
    }, [selectedType, selectedCat, selectedCountry, sortBy, yearMin, yearMax]);


    // Fetch movies based on current filters (takes explicit year args to avoid stale closure)
    const applyFiltersWithYear = async (appliedYearMin, appliedYearMax, pg = 1) => {


        setIsFilterOpen(false);
        setLoading(true);
        setSearched(true);
        setPage(pg);
        try {
            let allItems = [];
            let tp = 1;

            // Determine if we're doing single-year server-side filter (exact) or year-range (client-side)
            const isAppliedYearDefault = appliedYearMin === MIN_YEAR && appliedYearMax === CURRENT_YEAR;
            const isSingleYear = !isAppliedYearDefault && appliedYearMin === appliedYearMax;
            const isYearRange = !isAppliedYearDefault && appliedYearMin !== appliedYearMax;

            // The API year param to pass (only for single year — exact server match)
            const apiYear = isSingleYear ? appliedYearMin : null;

            const fetchPageData = async (p, yearOverride = apiYear) => {
                let data;
                if (selectedCat) data = await getMoviesByCategory(selectedCat, p, yearOverride);
                else if (selectedCountry) data = await getMoviesByCountry(selectedCountry, p, yearOverride);
                else if (selectedType === 'single') data = await getMoviesByList('phim-le', p, yearOverride);
                else if (selectedType === 'series') data = await getMoviesByList('phim-bo', p, yearOverride);
                else data = await getMoviesByList('phim-le', p, yearOverride);

                const meta = data?.params?.pagination || data?.pagination || {};
                const apiTotalPages = meta.totalPages || (meta.totalItems ? Math.ceil(meta.totalItems / (meta.totalItemsPerPage || 24)) : 1);
                return { items: data?.items || [], totalPages: apiTotalPages, totalItems: meta.totalItems || 0 };
            };

            const filterByType = (list) => list.filter(m => {
                if (selectedType === 'single' && m.type !== 'single') return false;
                if (selectedType === 'series' && m.type === 'single') return false;
                
                if (selectedCat) {
                    const cats = Array.isArray(m.category) ? m.category : [];
                    if (!cats.some(c => c.slug === selectedCat || c.id === selectedCat)) return false;
                }
                
                if (selectedCountry) {
                    const countriesContent = Array.isArray(m.country) ? m.country : [];
                    if (!countriesContent.some(c => c.slug === selectedCountry || c.id === selectedCountry)) return false;
                }
                
                if (!isAppliedYearDefault && m.year) {
                    const y = parseInt(m.year);
                    if (!isNaN(y) && (y < appliedYearMin || y > appliedYearMax)) return false;
                }
                return true;
            });

            if (isSingleYear) {
                // EXACT year: API handles filtering on server — just paginate normally
                const batch = await fetchPageData(pg, apiYear);
                tp = batch.totalPages;
                allItems = filterByType(batch.items);
            } else if (isYearRange) {
                // YEAR RANGE: fetch multiple years in parallel
                const yearsToFetch = [];
                for (let y = appliedYearMax; y >= appliedYearMin; y--) yearsToFetch.push(y);

                // Fetch all years for current page in parallel
                const yearPage = pg; // each "UI page" maps to page 1 of each year
                const parallelResults = await Promise.all(
                    yearsToFetch.map(y => fetchPageData(yearPage, y))
                );

                // Merge and deduplicate by _id
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

                allItems = filterByType(allItems).slice(0, 24); // Cap at 24 to avoid UI overcrowding
                tp = Math.max(1, tp);
            } else {
                // NO year filter or huge range: fetch normally with sparse fill logic
                const MULTIPLIER = 5;
                const apiStartPage = (pg - 1) * MULTIPLIER + 1;
                const firstBatch = await fetchPageData(apiStartPage, null);
                tp = firstBatch.totalPages;
                allItems = filterByType(firstBatch.items);

                if (allItems.length < 24 && apiStartPage < tp) {
                    const promises = [];
                    for (let i = 1; i < MULTIPLIER; i++) {
                        if (apiStartPage + i <= tp) promises.push(fetchPageData(apiStartPage + i, null));
                    }
                    const extraBatches = await Promise.all(promises);
                    for (const b of extraBatches) {
                        allItems = [...allItems, ...filterByType(b.items)];
                    }
                }
                
                if (allItems.length > 24) allItems = allItems.slice(0, 24);

                tp = Math.ceil(tp / MULTIPLIER);
            }

            allItems.sort((a, b) => {
                if (sortBy === 'oldest') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
                if (sortBy === 'newest') return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
                if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'vi');
                if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'vi');
                return 0;
            });

            setMovies(allItems);
            setTotalPages(tp); // Preserve totalPages so pagination buttons never vanish

        } catch (error) {
            console.error('Filter apply error:', error);
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };


    // Random: pick a random category then apply
    const handleRandom = () => {
        if (categories.length === 0) return;
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const randomSort = SORT_OPTIONS[Math.floor(Math.random() * SORT_OPTIONS.length)];
        setSelectedCat(randomCat.slug);
        setSortBy(randomSort.value);
        setSelectedType('');
        setSelectedCountry('');
        setYearMin(MIN_YEAR);
        setYearMax(CURRENT_YEAR);
        // Directly fetch so user sees result immediately
        (async () => {
            setLoading(true);
            setSearched(true);
            setPage(1);
            try {
                const data = await getMoviesByCategory(randomCat.slug, 1);
                let items = (data?.items || []).sort((a, b) => {
                    if (randomSort.value === 'oldest') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
                    if (randomSort.value === 'newest') return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
                    if (randomSort.value === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'vi');
                    if (randomSort.value === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'vi');
                    return 0;
                });
                const meta = data?.params?.pagination || {};
                setMovies(items);
                setTotalPages(meta.totalItems ? Math.ceil(meta.totalItems / (meta.totalItemsPerPage || 24)) : 1);
            } catch { setMovies([]); } finally { setLoading(false); }
        })();
    };

    const handlePageChange = (p) => {
        applyFiltersWithYear(yearMin, yearMax, p);
        window.scrollTo({ top: 0, behavior: 'instant' });
    };


    // Labels for active filter chips
    const sortLabel = SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Mới nhất';
    const catLabel = selectedCat ? categories.find(c => c.slug === selectedCat)?.name : '';
    const countryLabel = selectedCountry ? countries.find(c => c.slug === selectedCountry)?.name : '';
    const typeLabel = selectedType ? TYPES.find(t => t.value === selectedType)?.label : '';
    const yearLabel = !isYearDefault ? (yearMin === yearMax ? `${yearMin}` : `${yearMin}–${yearMax}`) : '';

    return (
        <div className="min-h-screen bg-background pt-20 pb-24">
            <style>{`
                .slider-dual {
                    -webkit-appearance: none; appearance: none;
                    background: transparent; pointer-events: none; height: 28px;
                }
                .slider-dual::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #3b82f6; border: 2.5px solid #fff;
                    pointer-events: all; cursor: pointer;
                    box-shadow: 0 0 8px rgba(59,130,246,.6); transition: transform .15s;
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

                {/* ── Header ── */}
                <div className="mb-6">
                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-0.5">Khám phá</p>
                    <h1 className="text-2xl md:text-3xl font-sans font-bold text-white tracking-tight">Lọc Phim</h1>
                    {searched && !loading && (
                        <p className="text-sm text-white/35 font-medium mt-1">
                    {movies.length > 0 ? `Tìm thấy ${movies.length} phim ở trang này` : 'Không tìm thấy phim phù hợp'}

                        </p>
                    )}
                </div>

                {/* ── Action bar (Mobile Trigger) ── */}
                <div className="md:hidden flex items-center gap-3 mb-6">
                    <button onClick={openMobileFilter} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white active:bg-white/10 transition-colors">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        <span>Bộ lọc phim</span>
                        {activeCount > 0 && <span className="w-4 h-4 rounded-sm bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] text-primary ml-1">{activeCount}</span>}
                    </button>
                    <button onClick={handleRandom} disabled={categories.length === 0} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white active:bg-white/10 transition-colors disabled:opacity-40">
                        <Shuffle className="w-4 h-4 text-primary" />
                    </button>
                </div>

                {/* ── Desktop Filter Pills ── */}
                <div className="hidden md:flex mb-8 items-center gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                    <FilterPill label={sortLabel} active={sortBy !== 'newest'} onClear={() => setSortBy('newest')}>
                        <div className="w-52">
                            <RadioList options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
                        </div>
                    </FilterPill>

                    <FilterPill
                        label={yearLabel || 'Năm'}
                        active={!isYearDefault}
                        onClear={() => { setYearMin(MIN_YEAR); setYearMax(CURRENT_YEAR); setPendingYearMin(MIN_YEAR); setPendingYearMax(CURRENT_YEAR); applyFiltersWithYear(MIN_YEAR, CURRENT_YEAR, 1); }}
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

                    <FilterPill label={typeLabel || 'Loại phim'} active={!!selectedType} onClear={() => setSelectedType('')}>
                        <div className="w-44">
                            <RadioList options={TYPES} value={selectedType} onChange={setSelectedType} />
                        </div>
                    </FilterPill>

                    {categories.length > 0 && (
                        <FilterPill label={catLabel || 'Thể loại'} active={!!selectedCat} onClear={() => setSelectedCat('')}>
                            <div className="w-48">
                                <ScrollableList items={categories} value={selectedCat} onChange={setSelectedCat} />
                            </div>
                        </FilterPill>
                    )}

                    {countries.length > 0 && (
                        <FilterPill label={countryLabel || 'Quốc gia'} active={!!selectedCountry} onClear={() => setSelectedCountry('')}>
                            <div className="w-48">
                                <ScrollableList items={countries} value={selectedCountry} onChange={setSelectedCountry} />
                            </div>
                        </FilterPill>
                    )}

                    <div className="w-[1px] h-8 bg-white/10 mx-2" />

                    <button
                        onClick={handleRandom}
                        disabled={categories.length === 0}
                        className="flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm font-bold active:bg-primary/20 transition-colors disabled:opacity-40"
                    >
                        <Shuffle className="w-4 h-4" />
                        Ngẫu nhiên
                    </button>

                    {activeCount > 0 && (
                        <div onClick={() => { resetAll(); applyFiltersWithYear(MIN_YEAR, CURRENT_YEAR, 1); }}
                            className="flex-none flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 bg-red-500/5 hover:bg-red-500/10 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-all">
                            <X className="w-3.5 h-3.5" /> Xóa ({activeCount})
                        </div>
                    )}
                </div>

                {/* ── Active filter chips (Mobile only) ── */}
                {activeCount > 0 && (
                    <div className="md:hidden flex flex-wrap gap-2 items-center mb-5">
                        {catLabel && <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/90 shadow-md text-[10px] font-semibold rounded-[8px]">{catLabel}</span>}
                        {countryLabel && <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/90 shadow-md text-[10px] font-semibold rounded-[8px]">{countryLabel}</span>}
                        {typeLabel && <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/90 shadow-md text-[10px] font-semibold rounded-[8px]">{typeLabel}</span>}
                        {sortBy !== 'newest' && <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/90 shadow-md text-[10px] font-semibold rounded-[8px]">{sortLabel}</span>}
                        {yearLabel && <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/90 shadow-md text-[10px] font-semibold rounded-[8px]">{yearLabel}</span>}
                        <button onClick={() => { resetAll(); applyFiltersWithYear(MIN_YEAR, CURRENT_YEAR, 1); }} className="px-2.5 py-1 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-100 shadow-md text-[10px] font-bold rounded-[8px] flex items-center gap-1 active:bg-red-500/20 transition-colors">
                            <X className="w-2.5 h-2.5" /> Xóa lọc
                        </button>
                    </div>
                )}


                {/* ── Results ── */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : searched && movies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-2 px-4 text-center">
                        <Search className="w-12 h-12 text-white/20 mb-2" strokeWidth={1.5} />
                        <h3 className="text-white/80 text-[17px] font-semibold">Không tìm thấy kết quả</h3>
                        <p className="text-white/40 text-[15px]">Vui lòng thử bộ lọc hoặc từ khóa khác</p>
                    </div>
                ) : movies.length > 0 ? (
                    <>
                        <div className="movie-grid">
                            {movies.map(movie => (
                                <MovieCard key={movie._id || movie.slug} movie={movie} isGrid />
                            ))}
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 gap-2 text-center px-4">
                        <h3 className="text-white/80 text-[17px] font-semibold">Sẵn sàng khám phá</h3>
                        <p className="text-white/40 text-[15px]">Chọn bộ lọc và nhấn TÌM PHIM</p>
                    </div>
                )}
            </div>

            {/* ── Filter Bottom Sheet — identical to Browse.jsx ── */}
            <div className={`fixed inset-0 z-[100] flex flex-col justify-end transition-all duration-300 ${isFilterOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isFilterOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsFilterOpen(false)}
                />

                {/* Sheet */}
                <div className={`relative w-full max-h-[82vh] bg-[#121216] rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFilterOpen ? 'translate-y-0' : 'translate-y-full'}`}>

                    {/* Drag handle */}
                    <div className="w-full flex justify-center pt-4 pb-2"
                        onTouchStart={e => e.currentTarget.dataset.startY = e.touches[0].clientY}
                        onTouchEnd={e => {
                            if (e.changedTouches[0].clientY - (e.currentTarget.dataset.startY || 0) > 40) setIsFilterOpen(false);
                        }}>
                        <div className="w-12 h-1.5 bg-white/20 rounded-full pointer-events-none" />
                    </div>

                    {/* Sheet Header */}
                    <div className="flex-none flex items-center justify-between px-6 pb-4 border-b border-white/5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Chọn bộ lọc
                        </h3>
                        <button onClick={() => setIsFilterOpen(false)} className="text-primary text-sm font-bold active:opacity-70 transition-opacity">
                            XONG
                        </button>
                    </div>

                    {/* Sheet Body */}
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
                                    setIsFilterOpen(false);
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

                        <MobileFilterSection title="Loại phim">
                            <div className="relative">
                                <select value={pendingType} onChange={e => setPendingType(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer">
                                    <option value="" className="bg-[#121216]">Tất cả</option>
                                    {TYPES.filter(t => t.value).map(opt => <option key={opt.value} value={opt.value} className="bg-[#121216]">{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            </div>
                        </MobileFilterSection>

                        {categories.length > 0 && (
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

                        {countries.length > 0 && (
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

                    {/* Bottom Action */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#121216] border-t border-white/5 flex items-center gap-3">
                        <button onClick={resetAll} className="flex-none w-[120px] py-3.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-bold rounded-xl transition-colors text-sm">
                            Xóa lại {activeCount > 0 ? `(${activeCount})` : ''}
                        </button>
                        <button onClick={() => { commitAllPending(); setIsFilterOpen(false); }} className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl active:bg-primary/90 transition-colors text-center text-sm shadow-[0_4px_14px_rgba(59,130,246,0.3)]">
                            Tìm phim
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
