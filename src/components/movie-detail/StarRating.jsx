"use client";
import React, { useState } from 'react';
import { Star } from 'lucide-react';

// ── StarRating ────────────────────────────────────────────────────────────────
export default function StarRating({ rating = 0, onChange, readonly = false, size = "lg" }) {
    const [hovered, setHovered] = useState(0);
    const selected = rating;
    const labels = ['', 'Tệ', 'Không hay', 'Bình thường', 'Hay', 'Tuyệt vời'];
    
    const starClass = size === "sm" ? "w-4 h-4" : "w-7 h-7";

    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onMouseEnter={() => !readonly && setHovered(star)}
                        onMouseLeave={() => !readonly && setHovered(0)}
                        onClick={() => !readonly && onChange && onChange(star)}
                        className={`focus:outline-none transition-all duration-200 ${readonly ? 'cursor-default' : 'active:scale-95'}`}
                    >
                        <Star className={`${starClass} transition-colors duration-200 ${star <= (hovered || selected)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-white/10 text-white/20'
                            }`} />
                    </button>
                ))}
            </div>
            {!readonly && selected > 0 && (
                <span className="ml-2 text-[13px] text-amber-400/90 font-medium font-sans">{labels[selected]}</span>
            )}
        </div>
    );
}

