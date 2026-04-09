"use client";
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ text = 'Đang tải...' }) {
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[50vh] gap-4">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" strokeWidth={2} />
            {text && (
                <p className="text-sm font-medium text-white/40 font-sans tracking-wide">
                    {text}
                </p>
            )}
        </div>
    );
}

