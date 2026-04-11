"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Bell, ChevronDown, Loader2, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { searchMovies, getCategories, getCountries } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ── Country slug → ISO code mapping ──────────────────────────────────────────
export const COUNTRY_CODES = {
    'viet-nam':      'vn',
    'trung-quoc':    'cn',
    'han-quoc':      'kr',
    'nhat-ban':      'jp',
    'my':            'us',
    'anh':           'gb',
    'phap':          'fr',
    'duc':           'de',
    'thai-lan':      'th',
    'hong-kong':     'hk',
    'dai-loan':      'tw',
    'an-do':         'in',
    'y':             'it',
    'tay-ban-nha':   'es',
    'canada':        'ca',
    'uc':            'au',
    'nga':           'ru',
    'brazil':        'br',
    'mexico':        'mx',
    'philippines':   'ph',
    'indonesia':     'id',
    'malaysia':      'my',
    'singapore':     'sg',
    'ha-lan':        'nl',
    'thuy-sy':       'ch',
    'thuy-dien':     'se',
    'dan-mach':      'dk',
    'na-uy':         'no',
    'phan-lan':      'fi',
    'ba-lan':        'pl',
    'tho-nhi-ky':    'tr',
    'israel':        'il',
    'iran':          'ir',
    'arabia-xeut':   'sa',
    'uae':           'ae',
    'bo-dao-nha':    'pt',
    'colombia':      'co',
};

// ── Dropdown Menu ────────────────────────────────────────────────────────────
function NavDropdown({ label, items, basePath }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 text-sm font-semibold text-on-surface hover:text-primary transition-colors"
            >
                {label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="absolute top-full mt-3 left-0 w-56 bg-[#0f0f15]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-[60] ring-1 ring-white/5"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="w-full">
                            <div className="max-h-72 overflow-y-auto hide-scrollbar py-2 rounded-2xl">
                                {items.map(item => (
                                    <button
                                        key={item.slug}
                                        onClick={() => { router.push(`${basePath}/${item.slug}`); setOpen(false); }}
                                        className="w-full text-left px-5 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors"
                                    >
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── TopNav ───────────────────────────────────────────────────────────────────
export default function TopNav() {
    const { currentUser } = useAuth();
    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchCacheRef = useRef({});

    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);

    const router = useRouter();
    const pathname = usePathname();
    const dropdownRef = useRef(null);

    // Ranking types — placeholder, to be implemented later
    const rankingItems = [
        { slug: 'imdb', name: 'IMDB' },
        { slug: 'yeu-thich', name: 'Yêu thích' },
        { slug: 'danh-gia', name: 'Đánh giá' },
    ];

    useEffect(() => {
        getCategories().then(d => {
            const raw = d?.data?.items || d?.items || [];
            setCategories(raw.filter(cat => !cat.name.includes('18+')));
        });
        getCountries().then(d => setCountries(d?.data?.items || d?.items || []));
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const trimmed = keyword.trim();
        if (trimmed.length > 1) {
            setShowSuggestions(true); // Instant visual feedback
            
            if (searchCacheRef.current[trimmed]) {
                setSuggestions(searchCacheRef.current[trimmed]);
                setIsSearching(false);
            } else {
                setIsSearching(true);
            }

            const fetchSuggestions = async () => {
                if (searchCacheRef.current[trimmed]) return; // Already cached
                
                try {
                    const data = await searchMovies(trimmed, 5);
                    const items = data?.data?.items || data?.items || [];
                    searchCacheRef.current[trimmed] = items;
                    
                    // Only apply if the current keyword still matches the requested one
                    setSuggestions(prev => searchCacheRef.current[trimmed]);
                } catch (err) {
                    console.error("Error fetching suggestions", err);
                } finally {
                    setIsSearching(false);
                }
            };
            const id = setTimeout(fetchSuggestions, 200);
            return () => clearTimeout(id);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setIsSearching(false);
        }
    }, [keyword]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            router.push(`/tim-kiem?q=${encodeURIComponent(keyword)}`);
            setShowSuggestions(false);
            setIsSearchOpen(false);
            setKeyword('');
        }
    };

    const getImgUrl = (p) => p?.startsWith('http') ? p : `https://img.ophim.live/uploads/movies/${p}`;

    return (
        <header className="fixed top-0 right-0 left-0 h-16 md:h-20 z-50 px-4 md:px-8">
            {/* Background Layer (prevents nested backdrop-filter bugs) */}
            <div className={`absolute inset-0 transition-all duration-300 ${scrolled
                ? 'bg-black/80 backdrop-blur-2xl shadow-xl border-b border-white/5 shadow-black/50'
                : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent'
            }`} />

            <div className="relative z-10 w-full h-full flex items-center justify-between">

            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6 flex-1 min-w-0">
                <Link href="/" className="flex flex-col drop-shadow-md hover:opacity-80 transition-opacity flex-none notranslate" translate="no">
                    <span className="text-3xl md:text-4xl font-sans font-black text-primary leading-none tracking-tighter">MS</span>
                    <span className="text-[7px] md:text-[9px] font-sans font-bold text-on-surface tracking-[0.25em] leading-none mt-1 ml-0.5">CINEMA</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-5 ml-2">
                    {/* Direct links — highlight active route */}
                    <Link href="/phim-le"
                        className={`text-sm font-semibold transition-colors ${pathname === '/phim-le' ? 'text-primary' : 'text-on-surface hover:text-primary'}`}
                    >
                        Phim Lẻ
                    </Link>
                    <Link href="/phim-bo"
                        className={`text-sm font-semibold transition-colors ${pathname === '/phim-bo' ? 'text-primary' : 'text-on-surface hover:text-primary'}`}
                    >
                        Phim Bộ
                    </Link>

                    {/* Thể loại dropdown */}
                    {categories.length > 0 && (
                        <NavDropdown label="Thể loại" items={categories} basePath="/the-loai" />
                    )}

                    {/* Quốc gia dropdown */}
                    {countries.length > 0 && (
                        <NavDropdown label="Quốc gia" items={countries} basePath="/quoc-gia" />
                    )}

                    {/* Xếp hạng dropdown */}
                    <NavDropdown label="Xếp hạng" items={rankingItems} basePath="/xep-hang" />
                </nav>
            </div>

            {/* Right: Search + Bell + User */}
            <div className="flex items-center gap-2 md:gap-4 ml-4">
                {/* Expandable Search */}
                <div className="relative flex items-center justify-end w-10 h-10" ref={dropdownRef}>
                    <AnimatePresence>
                        {isSearchOpen && (
                            <motion.form
                                onSubmit={handleSearch}
                                className="absolute right-0 flex items-center bg-surface-container-low border border-white/10 rounded-full h-10 pr-10 overflow-hidden"
                                initial={{ width: 40, opacity: 0 }}
                                animate={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? 200 : 280, opacity: 1 }}
                                exit={{ width: 40, opacity: 0 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Nhập tên phim..."
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    onBlur={() => { if (!keyword) setIsSearchOpen(false); }}
                                    className="w-full bg-transparent text-on-surface items-center py-2 pl-4 outline-none text-sm"
                                />
                                <button type="submit" className="hidden" />
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Fixed Icon that NEVER Moves */}
                    <button
                        type="button"
                        aria-label="Tìm kiếm"
                        onClick={(e) => {
                            if (!isSearchOpen) {
                                setIsSearchOpen(true);
                            } else if (keyword) {
                                handleSearch(e);
                            } else {
                                setIsSearchOpen(false);
                            }
                        }}
                        className={`absolute right-0 z-10 flex items-center justify-center w-10 h-10 transition-colors drop-shadow-md rounded-full ${isSearchOpen ? 'text-primary hover:text-white' : 'text-on-surface hover:text-primary'}`}
                    >
                        <Search className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    {/* Suggestions dropdown */}
                    <AnimatePresence>
                        {showSuggestions && (isSearching || suggestions.length > 0) && (
                            <motion.div
                                className="absolute top-full mt-3 right-0 w-[280px] bg-[#0f0f15]/85 backdrop-blur-[32px] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-[60] flex flex-col ring-1 ring-white/5"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <div className="w-full rounded-2xl">
                                    {isSearching && suggestions.length === 0 ? (
                                        <div className="flex items-center justify-center p-6">
                                            <Loader2 className="w-5 h-5 text-white/40 animate-spin" strokeWidth={1.5} />
                                        </div>
                                    ) : (
                                        suggestions.map(movie => (
                                            <Link href={`/phim/${movie.slug}`}
                                                key={movie._id || movie.slug}
                                                onClick={() => { setShowSuggestions(false); setIsSearchOpen(false); setKeyword(''); }}
                                                className="flex items-center gap-3 p-3 hover:bg-white/8 transition-colors border-b border-white/5 last:border-0"
                                            >
                                                <Image
                                                src={`https://i0.wp.com/${getImgUrl(movie.thumb_url).replace(/^https?:\/\//, '')}?resize=96,64&quality=60`}
                                                className="w-12 h-8 object-cover rounded-md flex-none bg-surface-container-high"
                                                alt={movie.name}
                                                width={48}
                                                height={32}
                                                unoptimized
                                            />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-sm truncate">{movie.name}</p>
                                                    <p className="text-white/40 text-xs truncate">{movie.origin_name} · {movie.year}</p>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button aria-label="Thông báo" className="relative p-2 text-on-surface hover:text-primary transition-colors drop-shadow-md">
                    <Bell className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-surface-container-lowest" />
                </button>

                <Link href="/nguoi-dung" className="hidden sm:flex items-center gap-3 pl-2 md:pl-4 md:border-l border-white/20 cursor-pointer group">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#3b82f6] flex items-center justify-center font-bold text-white border border-transparent group-hover:border-white/30 transition-all shadow-md">
                        {currentUser ? (
                            currentUser.photoURL && !currentUser.photoURL.includes('ui-avatars.com') ? (
                                <Image src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover" width={40} height={40} unoptimized />
                            ) : (
                                currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'
                            )
                        ) : (
                            <UserIcon className="w-5 h-5 text-white" strokeWidth={2} />
                        )}
                    </div>
                </Link>
            </div>
            </div>
        </header>
    );
}
