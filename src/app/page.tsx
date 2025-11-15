'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import Library from '../components/Library';
import EBookReader from '../components/EBookReader';
import FileUpload from '../components/FileUpload';
import BookDebugInfo from '../components/BookDebugInfo';
import { Book } from '../lib/bookStorage';
import { LogOut, User } from 'lucide-react';

const AppContent = () => {
  const { isAuthenticated, user, logout, login, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'library' | 'upload' | 'debug'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{background: 'var(--cream)'}}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{color: 'var(--deep-blue)'}}>Loading Vedic Library...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={(user, token) => {
      // The login function from AuthContext will handle the state update
      login(user, token);
    }} />;
  }

  // Handle book selection
  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
  };

  const handleBackToLibrary = () => {
    setSelectedBook(null);
    setCurrentView('library');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setSelectedBook(null);
    setCurrentView('library');
  };

  // If reading a book, show the reader
  if (selectedBook) {
    return (
      <EBookReader 
        bookId={selectedBook.id} 
        title={selectedBook.title}
        onBack={handleBackToLibrary}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'var(--cream)'}}>
      {/* Header with user info and logout */}
      <header className="border-b border-orange-200 p-4" style={{background: 'var(--deep-blue)'}}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">वेदिक ग्रंथालय</h1>
            <span className="text-orange-200">/ Vedic E-Books Library</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <User className="w-5 h-5" />
              <span>Welcome, {user?.name || user?.username}</span>
              {user?.role === 'admin' && (
                <span className="px-2 py-1 rounded-full text-xs" style={{background: 'var(--saffron)', color: 'var(--deep-blue)'}}>
                  Admin
                </span>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-orange-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('library')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'library'
                  ? 'text-white'
                  : 'hover:bg-orange-100'
              }`}
              style={{
                background: currentView === 'library' ? 'var(--saffron)' : 'transparent',
                color: currentView === 'library' ? 'var(--deep-blue)' : 'var(--deep-blue)'
              }}
            >
              पुस्तकालय (Library)
            </button>
            
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'upload'
                    ? 'text-white'
                    : 'hover:bg-orange-100'
                }`}
                style={{
                  background: currentView === 'upload' ? 'var(--saffron)' : 'transparent',
                  color: currentView === 'upload' ? 'var(--deep-blue)' : 'var(--deep-blue)'
                }}
              >
                अपलोड (Upload)
              </button>
            )}
            
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('debug')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'debug'
                    ? 'text-white'
                    : 'hover:bg-orange-100'
                }`}
                style={{
                  background: currentView === 'debug' ? 'var(--saffron)' : 'transparent',
                  color: currentView === 'debug' ? 'var(--deep-blue)' : 'var(--deep-blue)'
                }}
              >
                🛠️ Debug
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {currentView === 'library' && (
          <Library 
            onBookSelect={handleBookSelect}
            onUploadNew={() => setCurrentView('upload')}
            user={user}
          />
        )}
        
        {currentView === 'upload' && (
          <div className="max-w-4xl mx-auto p-6">
            <FileUpload onUploadComplete={() => setCurrentView('library')} />
          </div>
        )}
        
        {currentView === 'debug' && user?.role === 'admin' && (
          <div className="max-w-4xl mx-auto p-6">
            <BookDebugInfo />
          </div>
        )}
      </main>
    </div>
  );
};

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


