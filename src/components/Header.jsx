"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, Film } from 'lucide-react';

const Header = () => {
    const [keyword, setKeyword] = useState('');
    const router = useRouter();

    const handleSearch = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            router.push(`/tim-kiem?q=${encodeURIComponent(keyword)}`);
            setKeyword('');
        }
    };

    return (
        <header className="header">
            <div className="container header-content">
                <Link href="/" className="logo">
                    <Film style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    MS Cinema
                </Link>

                <nav className="nav-links">
                    <Link href="/" className="nav-link">Trang chủ</Link>
                    <Link href="/" className="nav-link">Phim mới</Link>
                    <Link href="/" className="nav-link">Phim bộ</Link>
                    <Link href="/" className="nav-link">Phim lẻ</Link>
                </nav>

                <form className="search-bar" onSubmit={handleSearch}>
                    <SearchIcon size={20} color="#b3b3b3" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm phim..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </form>
            </div>
        </header>
    );
};

export default Header;
