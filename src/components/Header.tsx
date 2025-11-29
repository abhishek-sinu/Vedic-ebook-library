'use client';

import { BookOpen, Upload, List as ListIcon } from 'lucide-react';
import React, { useState } from 'react';
import BookListModal from './BookListModal';
import { fetchBooks } from '../lib/bookStorage';

interface HeaderProps {
  user?: { role: string; username: string; name?: string } | null;
  authUser?: { role: string; username: string; name?: string } | null;
  onLogout?: () => void;
  onViewChange?: (view: 'reading' | 'upload' | 'debug') => void;
}


const Header: React.FC<HeaderProps> = ({ user, authUser, onLogout, onViewChange }) => {
  const [showBooksModal, setShowBooksModal] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

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

  return (
    <>
      <div className="bg-gray-900 text-gray-100 px-4 py-3 flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold text-yellow-400">GAURAMRITA</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user?.name && (
              <span className="font-semibold text-yellow-300 mr-2">{user.name}</span>
            )}
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => onViewChange?.('upload')}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Upload Books"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShowBooks}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Show All Books"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </>
            )}
            {/* Profile icon removed, handled in SideNav */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ background: 'var(--saffron)', color: 'var(--deep-blue)' }}
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
      {showBooksModal && loadingBooks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg px-8 py-6 flex flex-col items-center">
            <span className="text-lg font-semibold mb-2">Loading books...</span>
            <div className="loader border-4 border-yellow-400 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;