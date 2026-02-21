import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const VedicKnowledgeFlow = dynamic(() => import('./VedicKnowledgeFlow'), { ssr: false });

export default function HomeLanding({ onLoginClick }: { onLoginClick: () => void }) {
  const router = useRouter();
  const handleLoginClick = () => {
    router.push('/');
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-slate-100 to-indigo-200">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 shadow-md">
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide drop-shadow-lg mb-2 sm:mb-0 cursor-pointer">Sastra Nidhi</h1>
        </a>
        <div className="w-full sm:w-auto flex justify-end">
          <button
            style={{
              background: 'linear-gradient(90deg, #1976d2 0%, #ffd700 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 12px #1976d233',
              letterSpacing: 0.5,
              transition: 'background 0.3s',
              position: 'relative',
              zIndex: 1,
            }}
            className="w-full sm:w-auto"
            onClick={handleLoginClick}
          >
            Login / Sign Up
          </button>
        </div>
      </header>

      {/* Main Diagram */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-7xl">
          <div className="w-full">
            <VedicKnowledgeFlow />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 text-center py-3 sm:py-4 shadow-inner text-white font-medium text-sm sm:text-base">
        © {new Date().getFullYear()} Sastra Nidhi. All rights reserved.
      </footer>
    </div>
  );
}
