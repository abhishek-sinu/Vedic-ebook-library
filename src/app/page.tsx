'use client';

import { useState } from 'react';
import EBookReader from '../components/EBookReader';
import FileUpload from '../components/FileUpload';
import Library from '../components/Library';
import BookDebugInfo from '../components/BookDebugInfo';
import { Book } from '../lib/bookStorage';

export default function Home() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentView, setCurrentView] = useState<'library' | 'upload' | 'reader' | 'debug'>('library');

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setCurrentView('reader');
  };

  const handleBackToLibrary = () => {
    setSelectedBook(null);
    setCurrentView('library');
  };

  const handleUploadSuccess = () => {
    setCurrentView('library');
  };

  return (
    <div className="min-h-screen" style={{background: 'var(--cream)'}}>
      {/* Header */}
      <header className="shadow-lg" style={{background: 'var(--deep-blue)', color: 'var(--cream)'}}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">वेदिक ग्रंथालय</h1>
            <p className="text-lg opacity-90">Vedic E-Books Library</p>
          </div>
          
          {currentView !== 'reader' && (
            <nav className="mt-4 flex space-x-4">
              <button
                onClick={() => setCurrentView('library')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === 'library'
                    ? 'bg-saffron text-deep-blue'
                    : 'bg-transparent text-cream hover:bg-cream hover:text-deep-blue'
                }`}
                style={{
                  backgroundColor: currentView === 'library' ? 'var(--saffron)' : 'transparent',
                  color: currentView === 'library' ? 'var(--deep-blue)' : 'var(--cream)'
                }}
              >
                पुस्तकालय (Library)
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === 'upload'
                    ? 'bg-saffron text-deep-blue'
                    : 'bg-transparent text-cream hover:bg-cream hover:text-deep-blue'
                }`}
                style={{
                  backgroundColor: currentView === 'upload' ? 'var(--saffron)' : 'transparent',
                  color: currentView === 'upload' ? 'var(--deep-blue)' : 'var(--cream)'
                }}
              >
                अपलोड (Upload)
              </button>
              <button
                onClick={() => setCurrentView('debug')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === 'debug'
                    ? 'bg-saffron text-deep-blue'
                    : 'bg-transparent text-cream hover:bg-cream hover:text-deep-blue'
                }`}
                style={{
                  backgroundColor: currentView === 'debug' ? 'var(--saffron)' : 'transparent',
                  color: currentView === 'debug' ? 'var(--deep-blue)' : 'var(--cream)'
                }}
              >
                📊 Debug
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'library' && (
          <Library 
            onBookSelect={handleBookSelect} 
            onUploadNew={() => setCurrentView('upload')}
          />
        )}
        
        {currentView === 'upload' && (
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        )}
        
        {currentView === 'debug' && (
          <BookDebugInfo />
        )}
        
        {currentView === 'reader' && selectedBook && (
          <EBookReader
            bookId={selectedBook.id}
            title={selectedBook.title}
            onBack={handleBackToLibrary}
          />
        )}
      </main>
    </div>
  );
}
