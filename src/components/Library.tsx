'use client';

import { useState, useEffect } from 'react';
import { Book, fetchBooks, deleteBookFile, getBookProgress, formatDate, formatFileSize } from '../lib/bookStorage';
import { BookOpen, Search, Clock, Trash2, Plus, FileText, User, Calendar, HardDrive, Tag } from 'lucide-react';

interface LibraryProps {
  onBookSelect: (book: Book) => void;
  onUploadNew: () => void;
}

const Library: React.FC<LibraryProps> = ({ onBookSelect, onUploadNew }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'uploadDate' | 'lastRead'>('uploadDate');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const fetchedBooks = await fetchBooks();
      // Merge with local progress data
      const booksWithProgress = fetchedBooks.map(book => {
        const progress = getBookProgress(book.id);
        return {
          ...book,
          currentPage: progress?.currentPage || 0,
          totalPages: progress?.totalPages || 0,
          lastRead: progress?.lastRead || book.lastRead
        };
      });
      setBooks(booksWithProgress);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedBooks = books
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterTag === 'all' || 
                           (book.tags && book.tags.includes(filterTag));
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'uploadDate':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'lastRead':
          const aLastRead = a.lastRead || a.uploadDate;
          const bLastRead = b.lastRead || b.uploadDate;
          return new Date(bLastRead).getTime() - new Date(aLastRead).getTime();
        default:
          return 0;
      }
    });

  const handleDeleteBook = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this book from your library?')) {
      const success = await deleteBookFile(bookId);
      if (success) {
        await loadBooks(); // Refresh the list
      } else {
        alert('Failed to delete book');
      }
    }
  };

  const allTags = Array.from(new Set(books.flatMap(book => book.tags || [])));

  const getReadingProgress = (book: Book): number => {
    if (!book.currentPage || !book.totalPages) return 0;
    return Math.round((book.currentPage / book.totalPages) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{color: 'var(--deep-blue)'}}>
          वेदिक पुस्तकालय / Vedic Library
        </h1>
        <p className="text-lg opacity-80">
          Your collection of spiritual texts and sacred literature
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50" />
            <input
              type="text"
              placeholder="खोजें पुस्तकें / Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="lastRead">Recently Read</option>
            <option value="uploadDate">Recently Added</option>
            <option value="title">Title A-Z</option>
          </select>

          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="all">All Categories</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          <button
            onClick={onUploadNew}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors text-white font-medium"
            style={{background: 'var(--saffron)'}}
          >
            <Plus className="w-5 h-5" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" style={{color: 'var(--saffron)'}} />
            <p className="text-lg" style={{color: 'var(--deep-blue)'}}>Loading your library...</p>
          </div>
        </div>
      ) : filteredAndSortedBooks.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2 opacity-60">
            {books.length === 0 ? 'No books in your library yet' : 'No books match your search'}
          </h3>
          <p className="opacity-50 mb-6">
            {books.length === 0 
              ? 'Upload your first Vedic scripture or spiritual text to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {books.length === 0 && (
            <button
              onClick={onUploadNew}
              className="px-8 py-3 rounded-lg transition-colors text-white font-medium"
              style={{background: 'var(--saffron)'}}
            >
              Upload Your First Book
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => onBookSelect(book)}
              className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-orange-400 overflow-hidden group"
            >
              {/* Book Cover/Header */}
              <div className="p-6 border-b border-orange-100" style={{background: 'var(--cream)'}}>
                <div className="flex items-start justify-between mb-3">
                  <FileText className="w-8 h-8 text-orange-600 flex-shrink-0" />
                  <button
                    onClick={(e) => handleDeleteBook(book.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    title="Delete book"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{color: 'var(--deep-blue)'}}>
                  {book.title}
                </h3>
                
                {book.author && (
                  <div className="flex items-center text-sm opacity-75 mb-2">
                    <User className="w-4 h-4 mr-1" />
                    <span>{book.author}</span>
                  </div>
                )}

                {book.description && (
                  <p className="text-sm opacity-70 line-clamp-2 mb-3">
                    {book.description}
                  </p>
                )}

                {/* Reading Progress */}
                {book.currentPage && book.totalPages && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Reading Progress</span>
                      <span>{getReadingProgress(book)}%</span>
                    </div>
                    <div className="w-full bg-orange-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${getReadingProgress(book)}%`,
                          background: 'var(--saffron)'
                        }}
                      />
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      Page {book.currentPage} of {book.totalPages}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {book.tags && book.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {book.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 3 && (
                      <span className="text-xs opacity-60">+{book.tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Book Metadata */}
              <div className="p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center opacity-60">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Added: {formatDate(book.uploadDate)}</span>
                  </div>
                </div>

                {book.lastRead && (
                  <div className="flex items-center opacity-60">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Last read: {formatDate(book.lastRead)}</span>
                  </div>
                )}

                <div className="flex items-center opacity-60">
                  <HardDrive className="w-4 h-4 mr-2" />
                  <span>{book.fileSize}</span>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <div className="flex items-center justify-center py-2 rounded-lg transition-colors group-hover:bg-orange-50">
                    <BookOpen className="w-4 h-4 mr-2" style={{color: 'var(--saffron)'}} />
                    <span className="font-medium" style={{color: 'var(--saffron)'}}>
                      {book.currentPage ? 'Continue Reading' : 'Start Reading'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {books.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-lg" style={{background: 'var(--cream)'}}>
            <BookOpen className="w-8 h-8 mx-auto mb-2" style={{color: 'var(--saffron)'}} />
            <div className="text-2xl font-bold" style={{color: 'var(--deep-blue)'}}>
              {books.length}
            </div>
            <div className="text-sm opacity-75">Books in Library</div>
          </div>
          
          <div className="text-center p-6 rounded-lg" style={{background: 'var(--cream)'}}>
            <Clock className="w-8 h-8 mx-auto mb-2" style={{color: 'var(--saffron)'}} />
            <div className="text-2xl font-bold" style={{color: 'var(--deep-blue)'}}>
              {books.filter(book => book.lastRead).length}
            </div>
            <div className="text-sm opacity-75">Books Started</div>
          </div>
          
          <div className="text-center p-6 rounded-lg" style={{background: 'var(--cream)'}}>
            <Tag className="w-8 h-8 mx-auto mb-2" style={{color: 'var(--saffron)'}} />
            <div className="text-2xl font-bold" style={{color: 'var(--deep-blue)'}}>
              {allTags.length}
            </div>
            <div className="text-sm opacity-75">Categories</div>
          </div>

          <div className="text-center p-6 rounded-lg" style={{background: 'var(--cream)'}}>
            <HardDrive className="w-8 h-8 mx-auto mb-2" style={{color: 'var(--saffron)'}} />
            <div className="text-2xl font-bold" style={{color: 'var(--deep-blue)'}}>
              {books.reduce((total, book) => total + (book.contentLength || 0), 0) > 1024 
                ? `${(books.reduce((total, book) => total + (book.contentLength || 0), 0) / 1024 / 1024).toFixed(1)}MB`
                : `${Math.round(books.reduce((total, book) => total + (book.contentLength || 0), 0) / 1024)}KB`
              }
            </div>
            <div className="text-sm opacity-75">Books Storage</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;