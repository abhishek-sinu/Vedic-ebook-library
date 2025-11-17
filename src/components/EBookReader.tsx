'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft, ZoomIn, ZoomOut, Settings, SkipForward, SkipBack, AlertCircle, Bookmark, BookmarkCheck, User, Upload, Bug, ChevronDown, Plus, FileText, Search } from 'lucide-react';
import { updateBookProgress, fetchBookContent, fetchBooks, Book } from '../lib/bookStorage';
import { useAuth } from '../contexts/AuthContext';

interface EBookReaderProps {
  bookId?: string;
  title?: string;
  user?: { role: string; username: string; name?: string } | null;
  onLogout?: () => void;
  onBookSelect?: (book: Book) => void;
  onViewChange?: (view: 'reading' | 'upload' | 'debug') => void;
}

const EBookReader: React.FC<EBookReaderProps> = ({ bookId, title, user, onLogout, onBookSelect, onViewChange }) => {
  // Books and categories state
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<{name: string; books: Book[]; expanded: boolean}[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{pageIndex: number; context: string; match: string; beforeContext: string; afterContext: string; fullContext: string}[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0); // For loading text animation
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const contentRef = useRef<HTMLDivElement>(null);
  
  // IAST normalization function
  const normalizeIAST = (text: string) => {
    const iASTMap: { [key: string]: string } = {
      'Ā': 'A', 'ā': 'a',
      'Ī': 'I', 'ī': 'i',
      'Ū': 'U', 'ū': 'u',
      'Ṛ': 'R', 'ṛ': 'r',
      'Ṝ': 'R', 'ṝ': 'r',
      'Ḷ': 'L', 'ḷ': 'l',
      'Ḹ': 'L', 'ḹ': 'l',
      'Ṃ': 'M', 'ṃ': 'm',
      'Ḥ': 'H', 'ḥ': 'h',
      'Ṅ': 'N', 'ṅ': 'n',
      'Ñ': 'N', 'ñ': 'n',
      'Ṭ': 'T', 'ṭ': 't',
      'Ḍ': 'D', 'ḍ': 'd',
      'Ṇ': 'N', 'ṇ': 'n',
      'Ś': 'S', 'ś': 's',
      'Ṣ': 'S', 'ṣ': 's',
      'Ṁ': 'M', 'ṁ': 'm'
    };

    return text.replace(/[ĀāĪīŪūṚṛṜṝḶḷḸḹṂṃḤḥṄṅÑñṬṭḌḍṆṇŚśṢṣṀṁ]/g, (char) => {
      return iASTMap[char] || char;
    });
  };
  
  // Initialize responsive font size based on screen width
  const getDefaultFontSize = () => {
    if (typeof window !== 'undefined') {
      return 18; // 18px for both mobile and desktop for better readability
    }
    return 18; // Default for SSR
  };
  
  const [fontSize, setFontSize] = useState(getDefaultFontSize());
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [wordsPerPage, setWordsPerPage] = useState(500);
  const [content, setContent] = useState<string>('');
  const [bookTitle, setBookTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [highlightedContent, setHighlightedContent] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<{[key: string]: number}>({});

  // Get user context for bookmark functionality
  const { user: authUser } = useAuth();

  // Load books on component mount
  useEffect(() => {
    const loadBooks = async () => {
      setLoadingBooks(true);
      try {
        const fetchedBooks = await fetchBooks();
        setBooks(fetchedBooks);
        organizeBooks(fetchedBooks);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };
    loadBooks();
  }, []);

  // Organize books into categories
  const organizeBooks = (booksList: Book[]) => {
    const categoryMap = new Map<string, Book[]>();
    booksList.forEach(book => {
      const category = (book.tags && book.tags.length > 0) ? book.tags[0] : 'Spiritual Literature';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(book);
    });

    const organizedCategories = Array.from(categoryMap.entries()).map(([name, books]) => ({
      name,
      books,
      expanded: true
    }));

    setCategories(organizedCategories);
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleBookSelection = (book: Book) => {
    if (onBookSelect) {
      onBookSelect(book);
    }
  };

  // Search functionality
  const performSearch = (query: string) => {
    if (!query.trim() || !content) {
      setSearchResults([]);
      setShowSearchResults(false);
      setCurrentSearchIndex(0);
      setIsSearchMode(false);
      return;
    }

    const results: {pageIndex: number; context: string; match: string; beforeContext: string; afterContext: string; fullContext: string}[] = [];
    const normalizedSearchTerm = normalizeIAST(query.toLowerCase());

    pages.forEach((page, pageIndex) => {
      const cleanText = page.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const normalizedText = normalizeIAST(cleanText.toLowerCase());
      
      let searchIndex = 0;
      while (true) {
        const foundIndex = normalizedText.indexOf(normalizedSearchTerm, searchIndex);
        if (foundIndex === -1) break;
        
        // Extract extended context around the match
        const contextStart = Math.max(0, foundIndex - 100);
        const contextEnd = Math.min(cleanText.length, foundIndex + normalizedSearchTerm.length + 100);
        const beforeContext = cleanText.substring(contextStart, foundIndex);
        const matchText = cleanText.substring(foundIndex, foundIndex + normalizedSearchTerm.length);
        const afterContext = cleanText.substring(foundIndex + normalizedSearchTerm.length, contextEnd);
        
        // Full context for display
        const fullContext = cleanText.substring(contextStart, contextEnd);
        const shortContext = `${contextStart > 0 ? '...' : ''}${beforeContext}${matchText}${afterContext}${contextEnd < cleanText.length ? '...' : ''}`;
        
        results.push({
          pageIndex,
          context: shortContext,
          match: matchText,
          beforeContext,
          afterContext,
          fullContext: `${contextStart > 0 ? '...' : ''}${fullContext}${contextEnd < cleanText.length ? '...' : ''}`
        });
        
        searchIndex = foundIndex + 1;
      }
    });

    setSearchResults(results);
    setShowSearchResults(results.length > 0);
    setIsSearchMode(results.length > 0);
    setCurrentSearchIndex(0);
    
    // Navigate to first result if found
    if (results.length > 0) {
      setCurrentPage(results[0].pageIndex + 1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search to avoid too many calls
    if (value.trim()) {
      const timeoutId = setTimeout(() => performSearch(value), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearchMode(false);
    }
  };

  // Function to scroll to a specific search match
  const scrollToSearchMatch = (pageIndex: number, matchIndex: number = 0) => {
    setTimeout(() => {
      const matchElement = document.getElementById(`search-match-${pageIndex + 1}-${matchIndex}`);
      if (matchElement && contentRef.current) {
        // Remove previous active highlighting from all matches
        document.querySelectorAll('span[id^="search-match-"]').forEach(span => {
          const element = span as HTMLElement;
          element.style.backgroundColor = '#fbbf24';
          element.style.boxShadow = 'none';
        });
        
        // Highlight current match with different color
        matchElement.style.backgroundColor = '#f59e0b';
        matchElement.style.boxShadow = '0 0 0 2px #f59e0b';
        
        // Scroll to the match
        matchElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }, 200); // Give time for the page content to update
  };

  const goToNextSearchResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      const targetPage = searchResults[nextIndex].pageIndex + 1;
      setCurrentPage(targetPage);
      // Scroll to the match after page change
      scrollToSearchMatch(searchResults[nextIndex].pageIndex, 0);
    }
  };

  const goToPreviousSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      const targetPage = searchResults[prevIndex].pageIndex + 1;
      setCurrentPage(targetPage);
      // Scroll to the match after page change
      scrollToSearchMatch(searchResults[prevIndex].pageIndex, 0);
    }
  };

  // Function to jump to a specific search result
  const goToSearchResult = (index: number) => {
    if (index >= 0 && index < searchResults.length) {
      setCurrentSearchIndex(index);
      const targetPage = searchResults[index].pageIndex + 1;
      setCurrentPage(targetPage);
      // Scroll to the match after page change
      scrollToSearchMatch(searchResults[index].pageIndex, 0);
    }
  };

  // Language and category management
  const toggleLanguage = (language: string) => {
    setSelectedLanguage(language);
  };

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filter books by selected language
  const getBooksByLanguage = (language: string) => {
    // This is a placeholder - you would implement actual language filtering
    // based on your book metadata
    return organizeBooks(books);
  };

  const languageConfig = {
    english: { label: 'English books', code: 'EN', icon: 'EN', count: 603 },
    telugu: { label: 'Telugu books', code: 'TE', icon: 'తె', count: 45 },
    sanskrit: { label: 'Sanskrit books', code: 'संस्कृत', icon: 'सं', count: 128 }
  };

  // Fold/Unfold all categories
  const foldAllCategories = () => {
    setExpandedCategories({});
  };

  const unfoldAllCategories = () => {
    const allExpanded: {[key: string]: boolean} = {};
    categories.forEach(category => {
      allExpanded[category.name] = true;
    });
    setExpandedCategories(allExpanded);
  };

  // Loading text animation effect
  useEffect(() => {
    const loadingTexts = [
      'Loading ancient wisdom...',
      'Preparing sacred texts...',
      'Unveiling timeless knowledge...',
      'Opening spiritual gateway...',
      'Accessing divine literature...',
      'Illuminating sacred pages...',
      'Discovering eternal truths...',
      'Connecting to higher wisdom...'
    ];

    const interval = setInterval(() => {
      setCurrentTextIndex(prev => (prev + 1) % loadingTexts.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadingTexts = [
    'Loading ancient wisdom...',
    'Preparing sacred texts...',
    'Unveiling timeless knowledge...',
    'Opening spiritual gateway...',
    'Accessing divine literature...',
    'Illuminating sacred pages...',
    'Discovering eternal truths...',
    'Connecting to higher wisdom...'
  ];

  // Load book content when component mounts
  useEffect(() => {
    if (!bookId) {
      setIsLoading(false);
      setContent('');
      setError('');
      return;
    }

    const loadContent = async () => {
      console.log('Loading content for book ID:', bookId);
      setIsLoading(true);
      setError('');
      try {
        const result = await fetchBookContent(bookId);
        console.log('fetchBookContent result:', result);
        if (result) {
          console.log('Setting content with length:', result.content.length);
          setContent(result.content);
        } else {
          console.error('fetchBookContent returned null/undefined');
          setError('Failed to load book content');
        }
      } catch (err) {
        console.error('Error loading book:', err);
        setError('Error loading book content');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [bookId]);

  // Load user's bookmark after content is loaded
  useEffect(() => {
    if (content && (user || authUser) && bookId) {
      const bookmarkedPage = loadBookmark();
      console.log('Loading bookmark for user:', (user || authUser)?.username, 'book:', bookId, 'page:', bookmarkedPage);
      setCurrentPage(bookmarkedPage);
      setIsBookmarked(!!localStorage.getItem(getBookmarkKey()!));
    }
  }, [content, user, authUser, bookId]);

  // Split content into pages based on word count
  const pages = useMemo(() => {
    console.log('Creating pages from content. Content length:', content.length);
    if (!content) {
      console.log('No content available for pagination');
      return [];
    }
    
    const words = content.split(/\s+/);
    console.log('Total words in content:', words.length);
    const pageArray = [];
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      let pageContent = pageWords.join(' ');
      
      // Try to end pages at natural breaks (sentences, paragraphs)
      if (i + wordsPerPage < words.length) {
        const lastSentenceIndex = pageContent.lastIndexOf('. ');
        const lastParagraphIndex = pageContent.lastIndexOf('</p>');
        const breakPoint = Math.max(lastSentenceIndex, lastParagraphIndex);
        
        if (breakPoint > pageContent.length * 0.7) {
          const adjustedWords = pageContent.substring(0, breakPoint + 1).split(/\s+/);
          pageContent = adjustedWords.join(' ');
          i = i - wordsPerPage + adjustedWords.length;
        }
      }
      
      pageArray.push(pageContent);
    }
    
    console.log('Created pages:', pageArray.length);
    return pageArray;
  }, [content, wordsPerPage]);

  const totalPages = pages.length;
  const currentPageContent = pages[currentPage - 1] || '';

  // Update highlighted content when page content changes or search query changes
  useEffect(() => {
    let highlighted = currentPageContent;
    
    // Apply search highlighting if there's a search query
    if (searchQuery && searchQuery.trim() && highlighted) {
      const normalizedSearchTerm = normalizeIAST(searchQuery.toLowerCase());
      const normalizedContent = normalizeIAST(highlighted.toLowerCase());
      
      // Find all matches in normalized content
      const matches: { start: number; end: number }[] = [];
      let searchIndex = 0;
      
      while (true) {
        const foundIndex = normalizedContent.indexOf(normalizedSearchTerm, searchIndex);
        if (foundIndex === -1) break;
        
        matches.push({
          start: foundIndex,
          end: foundIndex + normalizedSearchTerm.length
        });
        
        searchIndex = foundIndex + 1;
      }
      
      // Apply highlighting from right to left to preserve indices
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const originalText = highlighted.substring(match.start, match.end);
        const beforeText = highlighted.substring(0, match.start);
        const afterText = highlighted.substring(match.end);
        
        // Create unique ID for each match
        const matchId = `search-match-${currentPage}-${i}`;
        
        highlighted = beforeText + 
          `<span id="${matchId}" style="background-color: #fbbf24; color: #000; font-weight: bold; display: inline-block; padding: 2px 4px; border-radius: 3px;">` + 
          originalText + 
          '</span>' + 
          afterText;
      }
    }
    
    setHighlightedContent(highlighted);
  }, [currentPageContent, searchQuery, currentPage]);

  // Auto-scroll to current search result when page content updates
  useEffect(() => {
    if (isSearchMode && searchResults.length > 0 && highlightedContent) {
      // Check if current page has search results
      const currentPageIndex = currentPage - 1;
      const currentResultPage = searchResults[currentSearchIndex]?.pageIndex;
      
      if (currentResultPage === currentPageIndex) {
        scrollToSearchMatch(currentPageIndex, 0);
      }
    }
  }, [highlightedContent, isSearchMode, currentSearchIndex, searchResults, currentPage]);

  // Auto-save bookmark when page changes (but not on initial load)
  useEffect(() => {
    if ((user || authUser) && content && currentPage > 1 && bookId) {
      console.log('Auto-saving bookmark for user:', (user || authUser)?.username, 'book:', bookId, 'page:', currentPage);
      saveBookmark(currentPage);
    }
  }, [currentPage, user, authUser, content, bookId]);

  // Keyboard navigation for pages
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          event.preventDefault();
          goToFirstPage();
          break;
        case 'End':
          event.preventDefault();
          goToLastPage();
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages]);

  // Sync page input value with current page
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  // Handle responsive font size on window resize
  useEffect(() => {
    const handleResize = () => {
      const newDefaultSize = 20;
      if (Math.abs(fontSize - getDefaultFontSize()) <= 2) {
        setFontSize(newDefaultSize);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fontSize]);

  // Update progress when page changes
  useEffect(() => {
    if (bookId && totalPages > 0) {
      const progress = Math.round((currentPage / totalPages) * 100);
      updateBookProgress(bookId, currentPage, totalPages);
    }
  }, [currentPage, totalPages, bookId]);

  const scrollToChapter = (chapterText: string) => {
    // Find which page contains this chapter
    const chapterIndex = pages.findIndex(page => page.includes(chapterText));
    if (chapterIndex !== -1) {
      setCurrentPage(chapterIndex + 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const increaseFontSize = () => {
    setFontSize(prev => prev + 2); // No maximum limit
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 14)); // Minimum 14px
  };

  // Bookmark functions
  const getBookmarkKey = () => {
    const currentUser = user || authUser;
    if (!currentUser || !bookId) return null;
    return `vedic_bookmark_${currentUser.username}_${bookId}`;
  };

  const saveBookmark = (pageNumber: number) => {
    const key = getBookmarkKey();
    if (key && bookId) {
      const bookmarkData = {
        page: pageNumber,
        timestamp: Date.now(),
        bookTitle: bookTitle || `Book ${bookId}`
      };
      localStorage.setItem(key, JSON.stringify(bookmarkData));
      console.log('Bookmark saved:', key, bookmarkData);
      setIsBookmarked(true);
      
      setBookmarks(prev => ({
        ...prev,
        [bookId]: pageNumber
      }));
    }
  };

  const loadBookmark = () => {
    const key = getBookmarkKey();
    if (key) {
      const saved = localStorage.getItem(key);
      console.log('Loading bookmark with key:', key, 'data:', saved);
      if (saved) {
        try {
          const bookmarkData = JSON.parse(saved);
          return bookmarkData.page || 1;
        } catch (e) {
          console.error('Error parsing bookmark data:', e);
        }
      }
    }
    return 1; // Default to first page
  };

  const removeBookmark = () => {
    const key = getBookmarkKey();
    if (key && bookId) {
      localStorage.removeItem(key);
      setIsBookmarked(false);
      setBookmarks(prev => {
        const updated = { ...prev };
        delete updated[bookId];
        return updated;
      });
    }
  };

  const toggleBookmark = () => {
    if (isBookmarked) {
      removeBookmark();
    } else {
      saveBookmark(currentPage);
    }
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageInputValue(value);
  };

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInputValue);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        e.currentTarget.blur();
      } else {
        // Reset to current page if invalid
        setPageInputValue(currentPage.toString());
      }
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInputValue);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      // Reset to current page if invalid
      setPageInputValue(currentPage.toString());
    }
  };

  // Extract chapters/sections from content
  const chapters = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="text-center">
          <div className="relative mx-auto mb-8" style={{ width: '200px', height: '150px' }}>
            {/* Animated book pages */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white border border-amber-300 rounded-r-lg shadow-lg"
                style={{
                  width: '180px',
                  height: '120px',
                  left: `${i * 2}px`,
                  top: `${i * 2}px`,
                  transformOrigin: 'left center',
                  animation: `pageFlipToLeft 4s ease-in-out infinite ${i * 0.5}s`,
                  zIndex: 8 - i
                }}
              >
                <div className="p-3 h-full flex flex-col">
                  <div className="h-2 bg-amber-200 rounded mb-1"></div>
                  <div className="h-1 bg-amber-100 rounded mb-1"></div>
                  <div className="h-1 bg-amber-100 rounded mb-2"></div>
                  <div className="h-1 bg-amber-100 rounded mb-1"></div>
                  <div className="h-1 bg-amber-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-lg font-medium text-amber-800 mb-6 h-8">
            <span
              key={currentTextIndex}
              style={{
                animation: 'showTwoWords 1s ease-in-out'
              }}
            >
              {loadingTexts[currentTextIndex]}
            </span>
          </div>

          <div className="w-64 mx-auto">
            <div 
              className="h-2 bg-amber-300 rounded-full overflow-hidden"
              style={{
                animation: 'progressFlow 3s ease-in-out infinite'
              }}
            >
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pageFlipToLeft {
            0% { 
              transform: rotateY(0deg);
              z-index: 10;
            }
            25% { 
              transform: rotateY(-45deg);
              z-index: 10;
            }
            50% { 
              transform: rotateY(-90deg);
              z-index: 10;
            }
            75% { 
              transform: rotateY(-135deg);
              z-index: 5;
            }
            100% { 
              transform: rotateY(-180deg);
              z-index: 5;
            }
          }
          
          @keyframes showTwoWords {
            0%, 10% { 
              opacity: 1;
              transform: scale(1.05);
            }
            12.5%, 100% { 
              opacity: 0;
              transform: scale(1);
            }
          }
          
          @keyframes progressFlow {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{color: 'red'}} />
          <p className="text-lg mb-4" style={{color: 'var(--deep-blue)'}}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg"
            style={{background: 'var(--saffron)', color: 'var(--deep-blue)'}}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col">
      {/* Header Bar */}
      <div className="bg-gray-900 text-gray-100 px-4 py-3 flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-yellow-400">GAURAMRITA</h1>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm">Switch to reading mode</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => onViewChange?.('upload')}
                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                  title="Upload Books"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </>
            )}
            <span className="text-sm">{(user || authUser)?.name || (user || authUser)?.username || 'Guest User'}</span>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Logout"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Language Selection */}
        <div className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4">
          {Object.entries(languageConfig).map(([langKey, config]) => (
            <button
              key={langKey}
              onClick={() => toggleLanguage(langKey)}
              className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                selectedLanguage === langKey
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={config.label}
            >
              {config.icon}
            </button>
          ))}
          
          {/* Navigation Icons */}
          <div className="flex flex-col space-y-4 pt-6 border-t border-gray-700">
            <button className="p-2 text-gray-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Panel */}
        <div className="w-80 bg-gray-800 text-white flex flex-col flex-shrink-0">
          {/* Language Section Header */}
          <div className="p-4 bg-yellow-400 text-gray-900">
            <h3 className="text-lg font-semibold">
              {languageConfig[selectedLanguage as keyof typeof languageConfig].label} ({languageConfig[selectedLanguage as keyof typeof languageConfig].count})
            </h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-700 bg-gray-700">
            <button className="flex-1 p-3 text-sm font-medium border-b-2 border-yellow-400 text-yellow-400">
              CATEGORIES
            </button>
            <button className="flex-1 p-3 text-sm font-medium text-gray-400 hover:text-gray-200">
              AUTHORS
            </button>
            <button className="flex-1 p-3 text-sm font-medium text-gray-400 hover:text-gray-200">
              TITLE
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Search the catalog"
                className="w-full bg-gray-600 text-white placeholder-gray-400 border border-gray-500 rounded px-4 py-2 pr-10 focus:outline-none focus:border-yellow-400"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto">
            {loadingBooks ? (
              <div className="p-4 text-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.name} className="border-b border-gray-700">
                  <button
                    onClick={() => toggleCategoryExpanded(category.name)}
                    className="w-full p-4 text-left hover:bg-gray-700 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Plus className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedCategories[category.name] ? 'transform rotate-45' : ''
                      }`} />
                      <span className="font-medium text-gray-200">{category.name}</span>
                    </div>
                  </button>
                  
                  {expandedCategories[category.name] && (
                    <div className="bg-gray-750">
                      {category.books.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleBookSelection(book)}
                          className={`w-full p-3 pl-12 text-left hover:bg-gray-600 transition-colors ${
                            bookId === book.id
                              ? 'bg-gray-600 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          <div className="text-sm font-medium">{book.title}</div>
                          {book.author && (
                            <div className="text-xs text-gray-500 mt-1">{book.author}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-gray-700 flex justify-between">
            <button 
              onClick={foldAllCategories}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Fold all
            </button>
            <button 
              onClick={unfoldAllCategories}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Unfold all
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white flex flex-col">
          {/* Search Bar */}
          {bookId && content && (
            <div className="p-4 border-b border-amber-300" style={{ backgroundColor: '#f4e6d1' }}>
              <div className="relative flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-700" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={`Search in "${title}"...`}
                    className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  />
                </div>
                
                {/* Search Results Navigation */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-amber-800">
                      {currentSearchIndex + 1} of {searchResults.length}
                    </span>
                    <button
                      onClick={goToPreviousSearchResult}
                      className="p-1 hover:bg-amber-200 rounded text-amber-700"
                      disabled={searchResults.length <= 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={goToNextSearchResult}
                      className="p-1 hover:bg-amber-200 rounded text-amber-700"
                      disabled={searchResults.length <= 1}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Search Results Summary */}
              {showSearchResults && (
                <div className="mt-2 text-sm text-amber-800">
                  {searchResults.length > 0 ? (
                    `Found ${searchResults.length} matches`
                  ) : (
                    searchQuery && 'No matches found'
                  )}
                </div>
              )}
            </div>
          )}
          
          {bookId && content ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Search Results Display */}
              {isSearchMode && searchResults.length > 0 && (
                <div className="flex-1 overflow-hidden flex">
                  {/* Search Results Sidebar */}
                  <div className="w-96 bg-amber-50 border-r border-amber-200 flex flex-col">
                    <div className="p-4 bg-amber-100 border-b border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-amber-800">Search Results</h3>
                        <button
                          onClick={() => {
                            setIsSearchMode(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="text-amber-600 hover:text-amber-800 p-1"
                          title="Close search"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-amber-700">
                        Found {searchResults.length} matches for "{searchQuery}"
                      </p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                      {searchResults.slice(0, Math.min(searchResults.length, 50)).map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 mb-2 rounded-lg cursor-pointer border transition-colors ${
                            index === currentSearchIndex
                              ? 'bg-amber-200 border-amber-400'
                              : 'bg-white border-amber-200 hover:bg-amber-100'
                          }`}
                          onClick={() => goToSearchResult(index)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-amber-600">
                              Page {result.pageIndex + 1}
                            </span>
                            <span className="text-xs text-amber-500">
                              Match {index + 1}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {result.fullContext}
                          </p>
                        </div>
                      ))}
                      
                      {searchResults.length > 50 && (
                        <div className="p-3 text-center text-sm text-amber-600">
                          Showing first 50 of {searchResults.length} results
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Main Content with Current Result */}
                  <div className="flex-1 flex flex-col">
                    {/* Reading Controls */}
                    <div className="border-b border-gray-200 p-4 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <BookOpen className="w-5 h-5 text-amber-600" />
                          <span className="font-bold text-gray-800 text-lg">Reading: {title}</span>
                          <span className="text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded">
                            Result {currentSearchIndex + 1} of {searchResults.length}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={decreaseFontSize}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                            title="Decrease font size"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          
                          <span className="text-sm px-2 text-gray-600 font-semibold">{fontSize}px</span>
                          
                          <button
                            onClick={increaseFontSize}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                            title="Increase font size"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={toggleBookmark}
                            className={`p-2 rounded-lg transition-colors ${
                              isBookmarked 
                                ? 'text-yellow-600 bg-yellow-100' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="w-4 h-4" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                          
                          {/* Page Navigation */}
                          <div className="flex items-center space-x-2 border-l border-gray-300 pl-4 ml-2">
                            <button
                              onClick={goToPreviousSearchResult}
                              disabled={currentSearchIndex === 0}
                              className={`p-2 rounded-lg transition-colors ${
                                currentSearchIndex === 0 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Previous search result"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={goToNextSearchResult}
                              disabled={currentSearchIndex >= searchResults.length - 1}
                              className={`p-2 rounded-lg transition-colors ${
                                currentSearchIndex >= searchResults.length - 1
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Next search result"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Book Content */}
                    <div ref={contentRef} className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#da9d5b' }}>
                      <div 
                        className="prose max-w-none text-gray-800 leading-relaxed"
                        style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                        dangerouslySetInnerHTML={{ 
                          __html: highlightedContent
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Normal Reading Mode */}
              {!isSearchMode && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Reading Controls */}
                  <div className="border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-gray-800 text-lg">Reading: {title}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={decreaseFontSize}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                      title="Decrease font size"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm px-2 text-gray-600 font-semibold">{fontSize}px</span>
                    
                    <button
                      onClick={increaseFontSize}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                      title="Increase font size"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={toggleBookmark}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked 
                          ? 'text-yellow-600 bg-yellow-100' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Page Navigation */}
                    <div className="flex items-center space-x-2 border-l border-gray-300 pl-4 ml-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-colors ${
                          currentPage === 1 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center space-x-1 min-w-[4rem] text-center">
                        <input
                          type="number"
                          value={pageInputValue}
                          onChange={handlePageInput}
                          onKeyDown={handlePageInputSubmit}
                          onBlur={handlePageInputBlur}
                          min={1}
                          max={totalPages}
                          className="w-12 text-sm text-center border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <span className="text-sm text-gray-600">/ {totalPages}</span>
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage >= totalPages}
                        className={`p-2 rounded-lg transition-colors ${
                          currentPage >= totalPages 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Content */}
              <div ref={contentRef} className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#eccaa7ff' }}>
                <div 
                  className="prose max-w-none text-gray-800 leading-relaxed"
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                  dangerouslySetInnerHTML={{ 
                    __html: highlightedContent
                  }}
                />
              </div>

              {/* Footer Controls */}
              <div className="bg-gray-800 border-t border-gray-700 p-4 flex-shrink-0">
                <div className="flex items-center justify-center">
                  <button className="flex items-center space-x-2 text-gray-300 hover:text-white">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">About the book</span>
                  </button>
                </div>
              </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Your Vedic Library</h2>
                <p className="text-gray-500 mb-2">Select a book from the categories on the left to start reading</p>
                <p className="text-gray-500">Browse through sacred texts and spiritual literature</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EBookReader;