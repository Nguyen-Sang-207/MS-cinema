"use client";
import React from 'react';
import { Home, SlidersHorizontal, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();
    const path = pathname;

    const linkClass = (active) =>
        `flex flex-col items-center gap-1 p-2 transition-colors ${
            active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
        }`;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-lg border-t border-surface-container-high z-50 flex items-center justify-around px-2 pb-safe">
            <Link href="/" className={linkClass(path === '/')}>
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-medium">Trang chủ</span>
            </Link>
            <Link href="/loc-phim" className={linkClass(path === '/loc-phim')}>
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-medium">Lọc phim</span>
            </Link>
            <Link href="/xep-hang" className={linkClass(path === '/xep-hang')}>
                <TrendingUp className="w-5 h-5" />
                <span className="text-[10px] font-medium">Xếp hạng</span>
            </Link>
            <Link href="/nguoi-dung" className={linkClass(path === '/nguoi-dung')}>
                <User className="w-5 h-5" />
                <span className="text-[10px] font-medium">Người dùng</span>
            </Link>
        </div>
    );
}
