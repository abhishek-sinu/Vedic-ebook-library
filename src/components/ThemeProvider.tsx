"use client";
import React, { useEffect } from "react";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const applyTheme = () => {
      let theme = 'light'; // ← changed from 'dark' to 'light'
      let fontSize = '16px';
      if (typeof window !== 'undefined') {
        document.body.style.zoom = '100%';
        const storedUser = localStorage.getItem('vedic_user') || sessionStorage.getItem('vedic_user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            theme = user?.profile?.preferences?.theme || 'light';
            const fs = user?.profile?.preferences?.fontSize;
            fontSize = fs === 'small' ? '14px' : fs === 'large' ? '18px' : '16px';
          } catch {}
        }
        document.body.setAttribute('data-theme', theme);
        document.body.style.fontSize = fontSize;
      }
    };
    applyTheme();
    const storageListener = () => applyTheme();
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, []);
  return <>{children}</>;
};
