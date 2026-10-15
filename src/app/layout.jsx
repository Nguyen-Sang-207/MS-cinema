import Script from 'next/script';
import { AuthProvider } from '../contexts/AuthContext';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import './globals.css';

export const metadata = {
  title: 'MS Cinema - Xem phim trực tuyến',
  description: 'Trải nghiệm xem phim với giao diện tuyệt đẹp',
};

export const viewport = {
  themeColor: '#0e0e0e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* DNS prefetch & preconnect for video embed servers and image CDN */}
        <link rel="dns-prefetch" href="https://player.phimapi.com" />
        <link rel="preconnect" href="https://player.phimapi.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://phimapi.com" />
        <link rel="preconnect" href="https://phimapi.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i0.wp.com" />
        <link rel="preconnect" href="https://i0.wp.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://phimimg.com" />
        <link rel="preconnect" href="https://phimimg.com" crossOrigin="anonymous" />
      </head>
      <body
        className="flex flex-col min-h-screen bg-surface text-on-surface font-sans selection:bg-primary/30 selection:text-primary pb-16 md:pb-0 overflow-x-hidden antialiased"
        suppressHydrationWarning
      >
        <div id="google_translate_element" style={{ display: 'none' }} suppressHydrationWarning></div>
        <Script src="/google-translate-init.js" strategy="beforeInteractive" />
        <Script 
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
        
        <AuthProvider>
          <TopNav />
          <BottomNav />
          <main className="relative pb-24 w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
