"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMovieDetail, searchMovies, getMoviesByCategory, getOptimizedImageUrl } from '@/services/api';
import {
    Play, Clapperboard, X, Star, Clock, Globe,
    ChevronDown, ChevronUp, MessageSquare, Film, Tv, Sparkles, Lock, Key, Unlock, LogIn, Heart, MoreHorizontal, MessageCircle
} from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import Loader from '@/components/Loader';
import { useAuth, db } from '@/contexts/AuthContext';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatTimeAgo = (timeValue) => {
    if (typeof timeValue === 'string' && !Number(timeValue)) return timeValue;
    const ts = Number(timeValue);
    if (!ts) return 'Vừa xong';
    const diff = Math.max(0, Date.now() - ts);
    const s = Math.floor(diff / 1000);
    if (s < 60) return "Vừa xong";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} ngày trước`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo} tháng trước`;
    return `${Math.floor(mo / 12)} năm trước`;
};

const imgUrl = (p, w = 1280) => {
    if (!p) return '/placeholder.jpg';
    const quality = w < 1200 ? 70 : 80;
    return getOptimizedImageUrl(p, w, null, quality) || '/placeholder.jpg';
};

import StarRating from '@/components/movie-detail/StarRating';
import EpisodePanel from '@/components/movie-detail/EpisodePanel';
// ── SectionHeading ────────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-primary rounded-full flex-none" />
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-primary" />}
                <h2 className="text-lg md:text-xl font-sans font-bold text-white">{title}</h2>
                {subtitle && <span className="text-sm text-white/30 font-sans">{subtitle}</span>}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MovieDetail({ params }) {
    const slug = React.use(params).slug;
    const location = usePathname();
    const { currentUser, isUnlocked, verifyCode } = useAuth();

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentEpisode, setCurrentEpisode] = useState(null);
    const [currentServerIndex, setCurrentServerIndex] = useState(0);
    const [relatedMovies, setRelatedMovies] = useState([]);
    const [suggestedMovies, setSuggestedMovies] = useState([]);
    const [codeInput, setCodeInput] = useState('');
    const [codeError, setCodeError] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [userRating, setUserRating] = useState(0);
    const [commentsOpen, setCommentsOpen] = useState(true);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [visibleCount, setVisibleCount] = useState(5);
    const playerRef = useRef(null);
    const sortInitialized = useRef(false);

    // ── Fetch data ────────────────────────────────────────────────────────────
    useEffect(() => {
        window.scrollTo(0, 0);
        const shouldAutoPlay = new URLSearchParams('').get('play') === 'true';
        // Reset all states when navigating to a new movie — intentional synchronous reset
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMovie(null); setError(null);
        setIsPlaying(false); setCurrentEpisode(null);
        setCurrentServerIndex(0);
        setRelatedMovies([]); setSuggestedMovies([]);

        (async () => {
            try {
                setLoading(true);
                const data = await getMovieDetail(slug);
                if (!data || !data.movie) {
                    setError('Không tìm thấy phim');
                    setLoading(false);
                    return;
                }
                const m = { ...data.movie, episodes: data.episodes || [] };
                setMovie(m);
                if (m.episodes[0]?.server_data?.[0]) {
                    setCurrentEpisode(m.episodes[0].server_data[0]);
                    if (shouldAutoPlay) setIsPlaying(true);
                }
                // ── Unblock UI as soon as movie data is ready ──────────────
                setLoading(false);

                // ── Fetch secondary data in background (non-blocking) ──────
                const firstCatSlug = m.category?.[0]?.slug;
                const vnKeyword = m.name.split(':')[0].split('(')[0].trim();

                // Run all secondary fetches in parallel, they don't block the player
                const [rel, suggested] = await Promise.all([
                    searchMovies(vnKeyword, 16).catch(() => null),
                    firstCatSlug ? getMoviesByCategory(firstCatSlug).catch(() => null) : Promise.resolve(null),
                ]);

                // Related movies
                const relItems = rel?.data?.items || rel?.items || [];
                const filtered = relItems.filter(r => r.slug !== slug);
                if (filtered.length < 3 && m.origin_name) {
                    const kw2 = m.origin_name.split(' ').slice(0, 2).join(' ');
                    searchMovies(kw2, 16).then(rel2 => {
                        const items2 = rel2?.data?.items || rel2?.items || [];
                        const combined = [
                            ...filtered,
                            ...items2.filter(r => r.slug !== slug && !filtered.find(f => f.slug === r.slug))
                        ];
                        setRelatedMovies(combined.slice(0, 12));
                    }).catch(() => {});
                } else {
                    setRelatedMovies(filtered.slice(0, 12));
                }

                // Suggested movies
                if (suggested) {
                    const suggestedItems = suggested?.items || suggested || [];
                    setSuggestedMovies(suggestedItems.filter(s => s.slug !== slug).slice(0, 18));
                }
            } catch (err) {
                console.error('MovieDetail error:', err);
                setError('Đã xảy ra lỗi khi tải phim');
                setLoading(false);
            }
        })();
    }, [slug]);

    // ── Đồng bộ Firestore (Tự động tải & Lắng nghe comment) ──────────────────
    useEffect(() => {
        if (!slug || !db) return;
        const docRef = doc(db, 'movie_comments', slug);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().comments || [];
                // Kiểm tra xem comment nào là của User đang đăng nhập dựa vào uid
                const syncedComments = data.map(c => ({
                    ...c,
                    isMine: currentUser ? c.uid === currentUser.uid : false,
                    replies: (c.replies || []).map(r => ({
                        ...r, 
                        isMine: currentUser ? r.uid === currentUser.uid : false
                    }))
                }));
                
                if (!sortInitialized.current) {
                    // Lần đầu tải trang -> Sắp xếp rốt ráo theo lượng tương tác
                    syncedComments.sort((a, b) => {
                        const scoreA = (a.likes || 0) * 2 + (a.replies?.length || 0);
                        const scoreB = (b.likes || 0) * 2 + (b.replies?.length || 0);
                        return scoreB - scoreA !== 0 ? scoreB - scoreA : b.id - a.id;
                    });
                    sortInitialized.current = true;
                    setComments(syncedComments);
                } else {
                    // Các lần update data tiếp theo (vd thả tim) -> KHÔNG dời dòng comment, giữ yên vị trí để không rối mắt
                    setComments(prevComments => {
                        const newOrder = [];
                        const syncedMap = new Map(syncedComments.map(c => [c.id, c]));
                        
                        // Cập nhật lại data chỗ cũ
                        prevComments.forEach(pc => {
                            if (syncedMap.has(pc.id)) {
                                newOrder.push(syncedMap.get(pc.id));
                                syncedMap.delete(pc.id);
                            }
                        });
                        
                        // Comment nào mới tinh (người khác vừa cmt) thì hất lên đầu
                        const brandNew = Array.from(syncedMap.values()).sort((a, b) => b.id - a.id);
                        
                        return [...brandNew, ...newOrder];
                    });
                }
                
            } else {
                setComments([]);
            }
        }, (err) => {
            console.error("Lỗi Firestore:", err.message);
        });

        return () => unsubscribe();
    }, [slug, currentUser]);

    // ── Update document title ────────────────────────────────────────────────
    useEffect(() => {
        if (movie) {
            const epText = isPlaying && currentEpisode ? ` - Tập ${currentEpisode.name}` : '';
            document.title = `${movie.name}${epText} - Movie Web`;
        } else {
            document.title = 'Movie Web - Xem Phim Online';
        }
        
        return () => {
            document.title = 'Movie Web - Xem Phim Online';
        };
    }, [movie, isPlaying, currentEpisode]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    // Reset iframe loaded state whenever episode changes
    const watchEpisode = (ep) => {
        setIframeLoaded(false);
        setCurrentEpisode(ep);
        setIsPlaying(true);
        requestAnimationFrame(() => {
            if (playerRef.current) {
                const navbarH = window.innerWidth >= 768 ? 80 : 64;
                const top = playerRef.current.getBoundingClientRect().top + window.scrollY - navbarH;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert("Bạn cần đăng nhập để bình luận!");
        if (!newComment.trim() && userRating === 0) return;
        
        let updatedComments = [...comments];
        if (replyingTo) {
            updatedComments = updatedComments.map(c => 
                c.id === replyingTo 
                ? { ...c, replies: [...(c.replies || []), { id: Date.now(), uid: currentUser.uid, avatar: currentUser.displayName?.charAt(0).toUpperCase() || 'B', name: currentUser.displayName || 'Bạn', text: newComment, timestamp: Date.now(), time: 'Vừa xong', likes: 0, hasLiked: false }] }
                : c
            );
            setExpandedReplies(prev => ({ ...prev, [replyingTo]: true }));
        } else {
            updatedComments = [
                { id: Date.now(), uid: currentUser.uid, avatar: currentUser.displayName?.charAt(0).toUpperCase() || 'B', name: currentUser.displayName || 'Bạn', text: newComment, timestamp: Date.now(), time: 'Vừa xong', rating: userRating, likes: 0, hasLiked: false, replies: [] },
                ...updatedComments
            ];
        }
        
        setNewComment('');
        setUserRating(0);
        setReplyingTo(null);

        // Lưu lên máy chủ Firebase
        try {
            await setDoc(doc(db, 'movie_comments', slug), { comments: updatedComments }, { merge: true });
        } catch (err) {
            console.error("Lỗi lưu bình luận lên Firebase:", err);
            alert("Lỗi lưu bình luận. Hãy kiểm tra lại kết nối Firebase.");
        }
    };

    const deleteComment = async (id, parentId = null) => {
        let updatedComments = [...comments];
        if (parentId) {
            updatedComments = updatedComments.map(c => c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== id) } : c);
        } else {
            updatedComments = updatedComments.filter(c => c.id !== id);
            if (expandedReplies[id]) {
                const newExp = { ...expandedReplies };
                delete newExp[id];
                setExpandedReplies(newExp);
            }
        }
        try {
            await setDoc(doc(db, 'movie_comments', slug), { comments: updatedComments }, { merge: true });
        } catch (err) {
            console.error("Lỗi xóa bình luận lên Firebase:", err);
        }
    };

    const toggleLike = async (commentId, replyId = null) => {
        if (!currentUser) return alert("Đăng nhập để thả tim nhé!");

        let updatedComments = [...comments];
        if (replyId) {
            updatedComments = updatedComments.map(c => c.id === commentId ? { ...c, replies: c.replies.map(r => r.id === replyId ? { ...r, hasLiked: !r.hasLiked, likes: r.hasLiked ? r.likes - 1 : r.likes + 1 } : r) } : c);
        } else {
            updatedComments = updatedComments.map(c => c.id === commentId ? { ...c, hasLiked: !c.hasLiked, likes: c.hasLiked ? c.likes - 1 : c.likes + 1 } : c);
        }
        
        // Optimistic
        setComments(updatedComments);

        try {
            await setDoc(doc(db, 'movie_comments', slug), { comments: updatedComments }, { merge: true });
        } catch (err) {
            console.error("Lỗi lưu thả tim:", err);
        }
    };

    const handleVerify = (e) => {
        e.preventDefault();
        if (verifyCode(codeInput)) {
            setCodeError(false);
            setCodeInput('');
        } else {
            setCodeError(true);
        }
    };

    const serverData = movie?.episodes?.[currentServerIndex]?.server_data || [];

    // ── Auto-scroll to player after isPlaying is set and DOM is ready ──────────
    useEffect(() => {
        if (!isPlaying) return;
        // Use two rAFs to guarantee scroll happens after React paints the player DOM
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
        });
    }, [isPlaying]);

    // ── States ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader text="Đang tải phim..." />
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-2xl text-white/50 font-sans">{error || 'Không tìm thấy phim'}</p>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full bg-background min-h-screen">

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 1 — HERO / INLINE PLAYER
            ═══════════════════════════════════════════════════════════════ */}
            <section
                ref={playerRef}
                className={`relative w-full overflow-hidden transition-all duration-500 scroll-mt-16 md:scroll-mt-20 ${isPlaying
                    ? 'bg-black'
                    : 'min-h-[100dvh] min-h-screen flex flex-col justify-center md:justify-end'
                    }`}
            >
                {isPlaying ? (
                    /* ── CHECK AUTH / UNLOCK ── */
                    (!currentUser || !isUnlocked) ? (
                        <div className="relative w-full pt-16 md:pt-20 bg-background flex flex-col items-center justify-center min-h-screen px-4">
                            <div className="w-full max-w-sm bg-surface-container rounded-xl p-8 border border-white/5 shadow-2xl relative z-10 text-center">
                                <button onClick={() => setIsPlaying(false)} className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                                
                                {!currentUser ? (
                                    <div className="flex flex-col items-center mt-2">
                                        <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-6">
                                            <Lock className="w-8 h-8 text-white/70" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Đăng nhập tài khoản</h3>
                                        <p className="text-white/50 text-sm mb-8 leading-snug">
                                            Bạn cần đăng nhập để xem nội dung phim này.
                                        </p>
                                        <Link href="/nguoi-dung" className="flex items-center justify-center w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-all">
                                            Đi tới Đăng nhập
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center mt-2">
                                        <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-6">
                                            <Key className="w-8 h-8 text-white/70" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Yêu cầu truy cập</h3>
                                        <p className="text-white/50 text-sm mb-8 leading-snug">
                                            Vui lòng nhập Mã Truy Cập để mở khóa trình phát phim.
                                        </p>
                                        <form onSubmit={handleVerify} className="w-full space-y-4">
                                            <input 
                                                type="text" 
                                                value={codeInput}
                                                onChange={e => setCodeInput(e.target.value)}
                                                placeholder="Mã bí mật"
                                                className={`w-full bg-black/50 border ${codeError ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-primary'} rounded-xl px-4 py-3 text-white placeholder-white/30 text-center text-sm outline-none transition-all`}
                                            />
                                            {codeError && <p className="text-rose-500 text-xs font-medium -mt-2">Mã truy cập không hợp lệ</p>}
                                            <button type="submit" className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-all">
                                                Mở khóa
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                    /* ── VIDEO PLAYER ── */
                    <div className="relative w-full pt-16 md:pt-20 bg-black flex flex-col items-center justify-center min-h-screen">
                        <div className="relative w-full md:w-[85%] lg:w-[75%] max-w-[1200px] aspect-video md:mt-4 md:rounded-xl overflow-hidden shadow-2xl bg-[#0a0a0a]">
                            {/* Loading spinner — visible until iframe fires onLoad */}
                            {!iframeLoaded && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-3">
                                    <div className="w-10 h-10 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
                                    <span className="text-white/30 text-xs font-medium">Đang kết nối nguồn phim...</span>
                                </div>
                            )}
                            {currentEpisode?.link_embed ? (
                            <iframe
                                key={currentEpisode.link_embed}
                                src={currentEpisode.link_embed}
                                className="w-full h-full border-0"
                                allowFullScreen
                                allow="autoplay; fullscreen"
                                title="Movie Player"
                                onLoad={() => setIframeLoaded(true)}
                            />
                            ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                                Đang tải nguồn phim...
                            </div>
                            )}
                        </div>
                        {/* Info bar */}
                        <div className="flex items-center justify-between w-full md:w-[85%] lg:w-[75%] max-w-[1200px] px-4 md:px-6 py-3 bg-black/60 md:bg-transparent md:pt-4 border-b border-white/5 md:border-none">
                            <div className="flex items-center gap-2 min-w-0">
                                <Play className="w-4 h-4 text-primary fill-current flex-none" />
                                <span className="text-sm text-white font-bold truncate">{movie.name}</span>
                                {movie.type !== 'single' && currentEpisode && (
                                    <span className="text-sm text-primary font-sans ml-1 flex-none">— Tập {currentEpisode.name}</span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsPlaying(false)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/15 text-white/70 hover:text-white text-xs font-bold rounded-lg border border-white/10 transition-all flex-none ml-4"
                            >
                                <X className="w-3.5 h-3.5" /> Thông tin phim
                            </button>
                        </div>
                        </div>
                    )
                ) : (
                    /* ── HERO ── */
                    <>
                        {/* Background landscape image */}
                        <div className="absolute inset-0 z-0 bg-black">
                            {/* Mobile: Use Vertical Banner (thumb_url) to avoid cropping sides */}
                            <img
                                src={imgUrl(movie.thumb_url || movie.poster_url)}
                                alt={movie.name}
                                className="w-full h-full object-cover object-top sm:hidden"
                                referrerPolicy="no-referrer"
                                fetchPriority="high"
                                decoding="sync"
                            />
                            {/* Desktop: Use Horizontal Banner (poster_url) to fit wide screens */}
                            <img
                                src={imgUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                className="w-full h-full object-cover object-top hidden sm:block"
                                referrerPolicy="no-referrer"
                                fetchPriority="high"
                                decoding="sync"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent" />
                        </div>

                        <div className="relative z-10 px-5 md:px-16 pt-55 pb-20 sm:pt-24 sm:pb-14 md:pt-32 md:pb-28 max-w-3xl space-y-3 md:space-y-5 w-full">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                                {movie.type === 'single' || parseInt(movie.episode_total) === 1
                                    ? <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg text-xs font-bold rounded-lg"><Film className="w-3 h-3" />Phim Lẻ</span>
                                    : <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg text-xs font-bold rounded-lg"><Tv className="w-3 h-3" />Phim Bộ</span>
                                }
                                {[movie.year, movie.quality, movie.lang].filter(Boolean).map((b, i) => (
                                    <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg text-xs font-semibold rounded-lg">{b}</span>
                                ))}
                                {movie.episode_current && movie.type !== 'single' && (
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg text-xs font-bold rounded-lg">{movie.episode_current}</span>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-sans font-bold text-white leading-[1.05] tracking-tight drop-shadow-2xl line-clamp-2">
                                    {movie.name}
                                </h1>
                                {movie.origin_name && (
                                    <p className="mt-1 text-sm md:text-base text-white/45 italic font-sans tracking-wider">{movie.origin_name}</p>
                                )}
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap gap-4 text-sm text-white/55 font-sans">
                                {movie.time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary/70" />{movie.time}</span>}
                                {movie.country?.[0]?.name && (
                                    <Link href={`/quoc-gia/${movie.country[0].slug}`}
                                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                                    >
                                        <Globe className="w-4 h-4 text-primary/70" />{movie.country[0].name}
                                    </Link>
                                )}
                            </div>

                            {/* Genres */}
                            {movie.category?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {movie.category.map(c => (
                                        <span key={c.id} className="px-2.5 py-1 text-xs bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg rounded-lg cursor-pointer hover:bg-white/20 transition-colors">{c.name}</span>
                                    ))}
                                </div>
                            )}

                            {/* Description — visible on all devices */}
                            {movie.content && (
                                <p className="text-sm md:text-base text-white/70 font-sans leading-relaxed line-clamp-3 md:line-clamp-4 max-w-2xl"
                                    dangerouslySetInnerHTML={{ __html: movie.content }} />
                            )}

                            {/* CTA */}
                            <div className="flex flex-wrap gap-2 md:gap-3 pt-1 md:pt-2">
                                <button
                                    onClick={() => watchEpisode(currentEpisode || serverData[0])}
                                    className="flex items-center gap-2 px-6 md:px-10 py-2.5 md:py-4 bg-primary text-white font-sans font-bold text-sm md:text-base rounded-lg hover:bg-primary/85 hover:scale-105 active:scale-95 transition-all shadow-[0_0_35px_rgba(59,130,246,0.45)]"
                                >
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Xem Phim
                                </button>
                                {movie.trailer_url && (
                                    <button 
                                        onClick={() => window.open(movie.trailer_url, '_blank')}
                                        className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-4 bg-white/10 backdrop-blur-md text-white font-sans font-bold text-sm md:text-base rounded-lg hover:bg-white/20 hover:scale-105 active:scale-95 transition-all border border-white/15"
                                    >
                                        <Clapperboard className="w-4 h-4 md:w-5 md:h-5" /> Trailer
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 2 — POSTER + EPISODES + RELATED
            ═══════════════════════════════════════════════════════════════ */}
            <section className="max-w-[1400px] mx-auto px-4 md:px-12 py-10 md:py-14">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                    {/* Poster — hidden on mobile */}
                    <div className="flex-none self-start hidden md:block">
                        <div className="w-40 md:w-48 lg:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/8">
                            <img
                                src={imgUrl(movie.poster_url || movie.thumb_url)}
                                alt={movie.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="flex-1 flex flex-col gap-8 min-w-0">

                        {/* Server tabs */}
                        {movie.episodes?.length > 1 && (
                            <div className="flex items-center flex-wrap gap-2">
                                <span className="text-xs font-bold text-white/35 uppercase tracking-widest mr-1">Server:</span>
                                {movie.episodes.map((s, i) => (
                                    <button key={i}
                                        onClick={() => { setCurrentServerIndex(i); if (s.server_data?.[0]) setCurrentEpisode(s.server_data[0]); }}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-lg border transition-all ${i === currentServerIndex
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {s.server_name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Episode panel */}
                        {serverData.length > 0 && (
                            <EpisodePanel
                                serverData={serverData}
                                currentEpisode={currentEpisode}
                                onSelect={watchEpisode}
                            />
                        )}

                        {/* Related movies — landscape list */}
                        {relatedMovies.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-primary rounded-full flex-none" />
                                    <span className="font-sans font-bold text-white text-base">Các phần & Phim liên quan</span>
                                    <span className="text-xs text-white/30 font-sans">({relatedMovies.length})</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto hide-scrollbar rounded-xl border border-white/5 bg-black/20">
                                    {relatedMovies.map((rm, i) => (
                                        <Link
                                            key={rm._id || rm.slug}
                                            href={`/phim/${rm.slug}`}
                                            className={`flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors group/rel ${i < relatedMovies.length - 1 ? 'border-b border-white/5' : ''
                                                }`}
                                        >
                                            <div className="w-16 flex-none aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/5">
                                                <img
                                                    src={imgUrl(rm.poster_url || rm.thumb_url, 400)}
                                                    alt={rm.name}
                                                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/rel:scale-110"
                                                    referrerPolicy="no-referrer"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white group-hover/rel:text-primary transition-colors truncate leading-tight">{rm.name}</p>
                                                <p className="text-xs text-white/40 truncate mt-0.5 italic">{rm.origin_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {rm.year && <span className="text-[10px] text-white/40">{rm.year}</span>}
                                                    {rm.episode_current && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-white/8 text-white/50 rounded font-bold">{rm.episode_current}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Play className="w-4 h-4 text-white/20 group-hover/rel:text-primary flex-none transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 3 — RATING & COMMENTS
            ═══════════════════════════════════════════════════════════════ */}
            <section id="comment-section" className="max-w-[1400px] mx-auto px-4 md:px-12 pb-12 scroll-mt-24">
                <div className="rounded-2xl bg-surface-container border border-white/5 overflow-hidden">
                    <button
                        onClick={() => setCommentsOpen(o => !o)}
                        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-sans font-bold text-white md:text-lg text-base">Đánh giá & Bình luận</span>
                            <span className="text-sm font-medium text-white/40">({comments.length})</span>
                        </div>
                        {commentsOpen ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
                    </button>

                    {commentsOpen && (
                        <div className="px-6 md:px-8 pb-8 flex flex-col gap-6 border-t border-white/5 bg-surface-container/50">
                            <div className="pt-6">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Đánh giá phim này</p>
                                <StarRating rating={userRating} onChange={setUserRating} />
                            </div>

                            <form onSubmit={submitComment} className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center font-bold text-white/80 text-sm flex-none">B</div>
                                <div className="flex-1 flex flex-col gap-3">
                                    <div className="flex flex-col">
                                        {replyingTo && (
                                            <div className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-t-xl mb-[-4px] border border-b-0 border-white/5">
                                                <span className="text-xs text-white/50">Đang trả lời bình luận...</span>
                                                <button type="button" onClick={() => setReplyingTo(null)} className="text-white/40 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        )}
                                        <textarea
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            placeholder={replyingTo ? "Đăng bình luận trả lời..." : "Chia sẻ cảm nhận về bộ phim..."}
                                            rows={replyingTo ? 2 : 3}
                                            className={`w-full bg-black/30 border border-white/10 focus:border-white/20 focus:bg-black/50 ${replyingTo ? 'rounded-b-xl rounded-t-none' : 'rounded-xl'} px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none resize-none transition-all`}
                                        />
                                    </div>
                                    <button type="submit" disabled={!newComment.trim() && userRating === 0}
                                        className="self-end px-6 py-2.5 bg-white text-black hover:bg-white/90 font-bold text-sm rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                        Đăng bình luận
                                    </button>
                                </div>
                            </form>

                            <div className="h-px bg-white/5 my-2" />

                            <div className="flex flex-col gap-7 pt-4">
                                {comments.slice(0, visibleCount).map(c => (
                                    <div key={c.id} className="flex gap-3 relative group w-full">
                                        {/* Avatar & Content code remains same... */}
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 mt-1 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/5 shadow-inner flex items-center justify-center text-[13px] font-bold text-white/80 flex-none">{c.avatar}</div>
                                        
                                        <div className="flex-1 min-w-0 pr-14 leading-tight">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[13px] font-semibold text-white/50">{c.name}</span>
                                                {c.text && c.rating > 0 && (
                                                    <div className="scale-[0.8] origin-left opacity-80"><StarRating rating={c.rating} readonly size="sm" /></div>
                                                )}
                                            </div>
                                            
                                            {!c.text && c.rating > 0 ? (
                                                <div className="my-1.5 opacity-90"><StarRating rating={c.rating} readonly size="sm" /></div>
                                            ) : (
                                                <p className="text-[14.5px] sm:text-[15px] text-white/95 leading-relaxed font-sans break-words tracking-wide">
                                                    {c.text}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center gap-4 mt-2.5">
                                                <span className="text-[12px] font-medium text-white/40">{c.timestamp ? formatTimeAgo(c.timestamp) : c.time}</span>
                                                <button onClick={() => setReplyingTo(c.id)} className="text-[12px] font-semibold text-white/60 hover:text-white transition-colors">Trả lời</button>
                                                {c.isMine && (
                                                    <button onClick={() => deleteComment(c.id)} className="text-[12px] font-semibold text-rose-500/80 hover:text-rose-500 transition-colors">Xóa</button>
                                                )}
                                                {!c.isMine && (
                                                    <button className="text-[12px] font-semibold text-white/30 hover:text-white transition-colors flex items-center gap-1 group/rep">
                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {c.replies?.length > 0 && (
                                                <button onClick={() => setExpandedReplies(p => ({ ...p, [c.id]: !p[c.id] }))} className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-white/40 hover:text-white/80 transition-colors">
                                                    <div className="w-6 h-px bg-white/10"></div> {expandedReplies[c.id] ? 'Ẩn câu trả lời' : `Xem thêm ${c.replies.length} câu trả lời`} {expandedReplies[c.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                            )}
                                            
                                            {/* Sub-replies */}
                                            {expandedReplies[c.id] && c.replies?.length > 0 && (
                                                <div className="flex flex-col gap-6 mt-5 ml-1 border-l border-white/5 pl-4">
                                                    {c.replies.map(r => (
                                                        <div key={r.id} className="flex gap-3 relative group w-full">
                                                            <div className="w-7 h-7 sm:w-8 sm:h-8 mt-1 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/5 shadow-inner flex items-center justify-center text-[11px] font-bold text-white/80 flex-none">{r.avatar}</div>
                                                            <div className="flex-1 min-w-0 pr-12 leading-tight">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[12.5px] font-semibold text-white/50">{r.name}</span>
                                                                </div>
                                                                <p className="text-[14px] text-white/95 leading-relaxed font-sans break-words tracking-wide">
                                                                    {r.text}
                                                                </p>
                                                                <div className="flex items-center gap-4 mt-2">
                                                                    <span className="text-[11px] font-medium text-white/40">{r.timestamp ? formatTimeAgo(r.timestamp) : r.time}</span>
                                                                    {r.isMine && (
                                                                        <button onClick={() => deleteComment(r.id, c.id)} className="text-[11px] font-semibold text-rose-500/80 hover:text-rose-500 transition-colors">Xóa</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="absolute right-0 top-0 flex flex-col items-center gap-1">
                                                                <button 
                                                                    onClick={() => toggleLike(c.id, r.id)}
                                                                    className="p-1 focus:outline-none group/like"
                                                                >
                                                                    <Heart className={`w-[14px] h-[14px] transition-all duration-300 ${r.hasLiked ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-white/30 group-hover/like:text-white/60'}`} />
                                                                </button>
                                                                {r.likes > 0 && <span className="text-[10px] font-medium text-white/40 -mt-0.5">{r.likes}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute right-0 top-0 flex flex-col items-center gap-1">
                                            <button 
                                                onClick={() => toggleLike(c.id)}
                                                className="p-1 sm:p-1.5 focus:outline-none group/like"
                                            >
                                                <Heart className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-300 ${c.hasLiked ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-white/30 group-hover/like:text-white/60'}`} />
                                            </button>
                                            <span className="text-[11px] font-medium text-white/40 -mt-0.5">{c.likes > 0 ? c.likes : 'Thích'}</span>
                                        </div>
                                    </div>
                                ))}

                                <div id="comment-controls" className="mt-4 flex flex-wrap justify-center gap-3">
                                    {comments.length > visibleCount && (
                                        <button 
                                            onClick={() => setVisibleCount(prev => prev + 5)}
                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[13px] font-semibold text-white/60 hover:text-white transition-all active:scale-95"
                                        >
                                            Xem thêm bình luận ({comments.length - visibleCount})
                                        </button>
                                    )}
                                    {visibleCount > 5 && (
                                        <button 
                                            onClick={() => {
                                                setVisibleCount(5);
                                                // Cố định ngay vị trí màn hình vào bình luận số 5 (bình luận vừa được rút gọn)
                                                setTimeout(() => {
                                                    const controls = document.getElementById('comment-controls');
                                                    if (controls) {
                                                        // behavior: 'instant' để không sinh ra hiệu ứng lướt giật cục
                                                        // block: 'end' để ốp nút bấm xuống đáy màn hình, nhường toàn bộ khung chữ phía trên cho comment
                                                        controls.scrollIntoView({ behavior: 'instant', block: 'end' });
                                                    }
                                                }, 10);
                                            }}
                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[13px] font-semibold text-white/60 hover:text-white transition-all active:scale-95"
                                        >
                                            Ẩn bớt
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 4 — SUGGESTED MOVIES (same genre)
            ═══════════════════════════════════════════════════════════════ */}
            {suggestedMovies.length > 0 && (
                <section className="max-w-[1400px] mx-auto px-4 md:px-12 pb-20">
                    <div className="flex items-center justify-between mb-5">
                        <SectionHeading
                            title={`Phim đề xuất${movie.category?.[0]?.name ? ` — ${movie.category[0].name}` : ''}`}
                        />
                        {movie.category?.[0]?.slug && (
                            <Link href={`/the-loai/${movie.category[0].slug}`}
                                className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                            >
                                Xem tất cả <span className="text-white/30 ml-1">›</span>
                            </Link>
                        )}
                    </div>
                    <div className="movie-grid">
                        {suggestedMovies.map(sm => (
                            <MovieCard key={sm._id || sm.slug} movie={sm} isGrid={true} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
