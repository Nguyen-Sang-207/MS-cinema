"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Cấu hình Firebase
// Lấy các giá trị này từ biến môi trường (.env)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "Chưa-Cấu-Hình",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('movie_unlocked') === 'true';
    }
    return false;
  });
  const [loading, setLoading] = useState(true);

  // Mã bí mật đã được đổi
  const SECRET_CODE = 'AnhSangDepTrai';

  useEffect(() => {
    // Lắng nghe trạng thái đăng nhập thực tế từ Firebase

    // Lắng nghe trạng thái đăng nhập thực tế từ Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Đăng nhập bằng Google (Thực tế)
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      if (firebaseConfig.apiKey === "Chưa-Cấu-Hình") {
        alert("Tính năng đăng nhập chưa được kết nối. Vui lòng thêm config Firebase vào file .env!");
      } else {
        alert("Đăng nhập thất bại: " + error.message);
      }
    }
  };

  // Đăng nhập bằng Facebook (Thực tế)
  const loginWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Lỗi đăng nhập Facebook:", error);
      if (firebaseConfig.apiKey === "Chưa-Cấu-Hình") {
        alert("Tính năng đăng nhập chưa được kết nối. Vui lòng thêm config Firebase vào file .env!");
      } else {
        alert("Đăng nhập Facebook thất bại: " + error.message);
      }
    }
  };

  // Đăng xuất (Thực tế)
  const logout = async () => {
    try {
      await signOut(auth);
      setIsUnlocked(false);
      localStorage.removeItem('movie_unlocked');
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Kiểm tra Code
  const verifyCode = (code) => {
    // So sánh không phân biệt hoa thường
    if (code.toLowerCase() === SECRET_CODE.toLowerCase()) {
      setIsUnlocked(true);
      localStorage.setItem('movie_unlocked', 'true');
      return true;
    }
    return false;
  };

  const value = {
    currentUser,
    isUnlocked,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    verifyCode,
    SECRET_CODE
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
