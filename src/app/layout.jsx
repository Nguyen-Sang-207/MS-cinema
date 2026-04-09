import { AuthProvider } from '../contexts/AuthContext';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import './globals.css';

export const metadata = {
  title: 'MS Cinema - Xem phim trực tuyến',
  description: 'Trải nghiệm xem phim với giao diện tuyệt đẹp',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="flex flex-col min-h-screen bg-surface text-on-surface font-sans selection:bg-primary/30 selection:text-primary pb-16 md:pb-0 overflow-x-hidden antialiased">
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
