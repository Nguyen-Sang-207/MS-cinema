"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserIcon, LogOut, ShieldCheck, Mail, Key } from 'lucide-react';

export default function User() {
  const { currentUser, isUnlocked, loginWithGoogle, loginWithFacebook, logout, verifyCode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    if (verifyCode(codeInput)) {
      setCodeError(false);
      setCodeInput('');
    } else {
      setCodeError(true);
    }
  };

  const handleLogin = async (provider) => {
    setLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithFacebook();
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex justify-center bg-background">
        <div className="w-full max-w-md">
          <div className="bg-surface-container rounded-2xl p-6 border border-white/5 shadow-2xl">
            
            {/* Header / Avatar Section */}
            <div className="flex flex-col items-center border-b border-white/5 pb-6 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 flex items-center justify-center border border-white/10 shadow-md ring-4 ring-black/20">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-white/50" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">{currentUser.displayName}</h2>
              <div className="flex items-center gap-1.5 mt-1.5 text-white/40">
                <Mail className="w-3.5 h-3.5" />
                <span className="text-sm">{currentUser.email}</span>
              </div>
            </div>

            {/* Status Section */}
            <div className="bg-[#1c1c1e]/50 rounded-xl p-5 mb-8 border border-white/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center flex-none border border-white/5 shadow-inner">
                  {isUnlocked ? <ShieldCheck className="w-5 h-5 text-green-500" /> : <Key className="w-5 h-5 text-white/50" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Đặc quyền người dùng</h3>
                  <p className={`text-xs ${isUnlocked ? 'text-green-500' : 'text-white/40'}`}>
                    {isUnlocked ? 'Khóa xem phim đã được mở' : 'Chưa kích hoạt mã bí mật'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                {isUnlocked ? (
                  <p className="text-sm text-white/50 leading-relaxed pl-13">
                    Bạn hiện có toàn quyền xem các phim bản quyền trên nền tảng mà không bị giới hạn.
                  </p>
                ) : (
                  <div>
                    <p className="text-[13px] text-white/50 mb-3">
                      Để xem phim không giới hạn, vui lòng nhập mã bí mật của bạn.
                    </p>
                    <form onSubmit={handleVerify} className="flex gap-2">
                      <input 
                        type="text" 
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value)}
                        placeholder="Nhập mã truy cập..."
                        className={`flex-1 min-w-0 h-10 bg-black/60 border ${codeError ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-3 text-white placeholder-white/30 text-sm outline-none transition-colors focus:border-white/30`}
                      />
                      <button type="submit" className="h-10 px-5 bg-white hover:bg-gray-200 text-black font-semibold text-sm rounded-lg transition-colors whitespace-nowrap">
                        Áp dụng
                      </button>
                    </form>
                    {codeError && <p className="text-red-500 text-[12px] font-medium mt-1.5">Mã không chính xác, vui lòng thử lại.</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-rose-500 text-white/70 hover:text-white text-sm font-bold py-3.5 rounded-xl transition-all border border-white/5 hover:border-transparent active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
            </button>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface-container rounded-2xl p-8 border border-white/5 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5 border border-white/10 shadow-inner">
              <UserIcon className="w-10 h-10 text-[#d1d5db]" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Đăng nhập</h1>
            <p className="text-white/50 text-sm">
              Đăng nhập để xem phim không giới hạn
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Đăng nhập với Google</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleLogin('facebook')}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#1877F2] text-white font-bold text-sm rounded-xl hover:bg-[#1877F2]/90 transition-all shadow-lg shadow-[#1877F2]/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Đăng nhập với Facebook</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
