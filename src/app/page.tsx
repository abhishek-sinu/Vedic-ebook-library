'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import EBookReader from '../components/EBookReader';
import FileUpload from '../components/FileUpload';
import BookDebugInfo from '../components/BookDebugInfo';
import { Book } from '../lib/bookStorage';

const AppContent = () => {
  const { isAuthenticated, user, logout, login, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'reading' | 'upload' | 'debug'>('reading');
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
      login(user, token);
    }} />;
  }

  // Handle book selection
  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setCurrentView('reading');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setSelectedBook(null);
    setCurrentView('reading');
  };

  return (
    <div className="min-h-screen" style={{background: '#e8d5b7'}}>
      <main>
        {currentView === 'reading' && (
          <EBookReader 
            bookId={selectedBook?.id || ''} 
            title={selectedBook?.title}
            user={user}
            onLogout={handleLogout}
            onBookSelect={handleBookSelect}
            onViewChange={setCurrentView}
          />
        )}
        
        {currentView === 'upload' && user?.role === 'admin' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('reading')}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-800 text-amber-100 rounded-lg hover:bg-amber-900 transition-colors"
              >
                <span>← Back to Reading</span>
              </button>
            </div>
            <FileUpload onUploadComplete={() => setCurrentView('reading')} />
          </div>
        )}
        
        {currentView === 'debug' && user?.role === 'admin' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('reading')}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-800 text-amber-100 rounded-lg hover:bg-amber-900 transition-colors"
              >
                <span>← Back to Reading</span>
              </button>
            </div>
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


