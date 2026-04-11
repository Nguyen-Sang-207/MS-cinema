"use client";
import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function XepHangPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <TrendingUp className="w-16 h-16 text-white/10 mb-4" strokeWidth={1.5} />
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Bảng Xếp Hạng</h2>
            <p className="text-sm md:text-base text-on-surface-variant text-center">
                Tính năng đang được cập nhật...
            </p>
        </div>
    );
}
