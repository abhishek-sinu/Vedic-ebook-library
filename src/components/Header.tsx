'use client';

import { BookOpen, Upload, List as ListIcon } from 'lucide-react';
import React, { useState } from 'react';
import BookListModal from './BookListModal';
import FileUpload from './FileUpload';
import { fetchBooks } from '../lib/bookStorage';
import UserManagementModal from './UserManagementModal';

interface HeaderProps {
  user?: { role: string; username: string; name?: string } | null;
  authUser?: { role: string; username: string; name?: string } | null;
  onLogout?: () => void;
  onViewChange?: (view: 'reading' | 'upload' | 'debug') => void;
}


const Header: React.FC<HeaderProps> = ({ user, authUser, onLogout, onViewChange }) => {
  const [showBooksModal, setShowBooksModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const handleShowBooks = async () => {
    setShowBooksModal(true);
    setLoadingBooks(true);
    try {
      const fetchedBooks = await fetchBooks(undefined, 1, 50);
      setBooks(fetchedBooks);
    } catch (e) {
      setBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  };

  // Dynamically set header background and text for light/dark theme
  let headerBg = 'var(--bg)';
  let headerTopText = 'var(--text)';
  let headerUserText = 'var(--text)';
  let headerButtonBg = 'var(--accent)';
  let headerButtonText = 'var(--deep-blue)';
  if (typeof window !== 'undefined') {
    const theme = document.body.getAttribute('data-theme');
    if (!theme || theme === 'light') {
      headerBg = 'var(--color-vb-header-top)';
      headerTopText = 'var(--color-vb-header-top-text)';
      headerUserText = 'var(--color-vb-normal-text)';
      headerButtonBg = 'var(--color-vb-action-bg)';
      headerButtonText = 'var(--color-vb-action-text)';
    } else if (theme === 'dark') {
      headerButtonBg = 'var(--button-orange-bg)';
      headerButtonText = 'var(--button-orange-text)';
    }
  }

  return (
    <>
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{
          background: headerBg,
          color: headerTopText,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6" style={{ color: headerTopText }} />
            <h1 className="text-xl font-bold" style={{ color: headerTopText }}>Vaisnava-Manjusha</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user?.name && (
              <span className="font-semibold" style={{ color: headerUserText }}>{user.name}</span>
            )}
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="p-2 rounded transition-colors"
                  style={{ color: 'var(--icon)', background: 'transparent' }}
                  title="Upload Books"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShowBooks}
                  className="p-2 rounded transition-colors"
                  style={{ color: 'var(--icon)', background: 'transparent' }}
                  title="Show All Books"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="p-2 rounded transition-colors"
                    style={{ color: 'var(--icon)', background: 'transparent' }}
                    title="Manage Users"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-7a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 10-8 0 4 4 0 008 0z" /></svg>
                  </button>
              </>
            )}
            {/* Profile icon removed, handled in SideNav */}
            {onLogout && (
              <button
                onClick={onLogout}
                className={`px-4 py-2 rounded-lg font-medium transition-colors${typeof window !== 'undefined' && document.body.getAttribute('data-theme') === 'dark' ? ' bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600' : ''}`}
                style={{ background: typeof window !== 'undefined' && document.body.getAttribute('data-theme') === 'dark' ? undefined : headerButtonBg, color: typeof window !== 'undefined' && document.body.getAttribute('data-theme') === 'dark' ? undefined : headerButtonText }}
                title="Logout"
              >
                Logout
              </button>
            )}
          </div>
        </div>
        {/* Profile modal removed, handled in SideNav */}
      </div>
      <BookListModal
        open={showBooksModal}
        onClose={() => setShowBooksModal(false)}
        books={books}
      />
      {showUploadModal && (
        <FileUpload
          onUploadComplete={() => setShowUploadModal(false)}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      {showBooksModal && loadingBooks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg px-8 py-6 flex flex-col items-center">
            <span className="text-lg font-semibold mb-2">Loading books...</span>
            <div className="loader border-4 border-yellow-400 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
          </div>
        </div>
      )}
      <UserManagementModal open={showUserModal} onClose={() => setShowUserModal(false)} />
    </>
  );
};

export default Header;