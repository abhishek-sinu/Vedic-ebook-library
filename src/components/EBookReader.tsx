'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, BookOpen, ArrowLeft, ZoomIn, ZoomOut, Settings, SkipForward, SkipBack, AlertCircle } from 'lucide-react';
import { updateBookProgress, fetchBookContent } from '../lib/bookStorage';

// IAST (Sanskrit) character normalization for search
const normalizeIAST = (text: string): string => {
  const iiastMap: { [key: string]: string } = {
    // Vowels with macrons
    'ā': 'a', 'Ā': 'A',
    'ī': 'i', 'Ī': 'I', 
    'ū': 'u', 'Ū': 'U',
    'ē': 'e', 'Ē': 'E',
    'ō': 'o', 'Ō': 'O',
    
    // Retroflex consonants
    'ṭ': 't', 'Ṭ': 'T',
    'ḍ': 'd', 'Ḍ': 'D',
    'ṇ': 'n', 'Ṇ': 'N',
    'ṛ': 'r', 'Ṛ': 'R',
    'ṝ': 'r', 'Ṝ': 'R',
    'ḷ': 'l', 'Ḷ': 'L',
    'ḹ': 'l', 'Ḹ': 'L',
    'ṣ': 's', 'Ṣ': 'S',
    
    // Palatal and other consonants
    'ś': 's', 'Ś': 'S',
    'ñ': 'n', 'Ñ': 'N',
    'ṅ': 'n', 'Ṅ': 'N',
    'ṃ': 'm', 'Ṃ': 'M',
    'ḥ': 'h', 'Ḥ': 'H',
    
    // Additional diacriticals
    'ṁ': 'm', 'Ṁ': 'M'
  };
  
  return text.replace(/[āĀīĪūŪēĒōŌṭṬḍḌṇṆṛṚṝṜḷḶḹḸṣṢśŚñÑṅṄṃṂḥḤṁṀ]/g, (match) => {
    return iiastMap[match] || match;
  });
};

interface EBookReaderProps {
  bookId: string;
  title?: string;
  onBack?: () => void;
}

const EBookReader: React.FC<EBookReaderProps> = ({ bookId, title, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{pageIndex: number, matches: string[]}[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(0);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wordsPerPage, setWordsPerPage] = useState(500);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [highlightedContent, setHighlightedContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Load book content when component mounts
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await fetchBookContent(bookId);
        if (result) {
          setContent(result.content);
          // Don't set highlightedContent here - let it be handled by the page content effect
        } else {
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

  // Split content into pages based on word count
  const pages = useMemo(() => {
    const words = content.split(/\s+/);
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
    
    return pageArray;
  }, [content, wordsPerPage]);

  const totalPages = pages.length;
  const currentPageContent = pages[currentPage - 1] || '';

  // Debug log to check if pages are being created correctly
  useEffect(() => {
    console.log('Pages created:', pages.length);
    console.log('Current page content length:', currentPageContent.length);
    console.log('Current page:', currentPage);
  }, [pages.length, currentPageContent.length, currentPage]);

  // Search functionality for entire book with IAST normalization
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setCurrentSearchResult(0);
      return;
    }

    const results: {pageIndex: number, matches: string[]}[] = [];
    
    // Create flexible pattern for both ASCII and IAST
    const createFlexiblePattern = (searchTerm: string) => {
      return searchTerm.split('').map(char => {
        switch(char.toLowerCase()) {
          case 'a': return '[aāĀ]+';
          case 'i': return '[iīĪ]+';
          case 'u': return '[uūŪ]+';
          case 'e': return '[eēĒ]+';
          case 'o': return '[oōŌ]+';
          case 't': return '[tṭṬ]+';
          case 'd': return '[dḍḌ]+';
          case 'n': return '[nṇṆñÑṅṄ]+';
          case 'r': return '[rṛṚṝṜ]+';
          case 'l': return '[lḷḶḹḸ]+';
          case 's': return '[sṣṢśŚ]+';
          case 'm': return '[mṃṂṁṀ]+';
          case 'h': return '[hḥḤ]+';
          case 'c': return '[cćĆ]+';
          case 'y': return '[yẏẎ]+';
          default: return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
      }).join('');
    };
    
    const flexiblePattern = createFlexiblePattern(query);
    // Use a more flexible regex that doesn't require word boundaries
    const regex = new RegExp(flexiblePattern, 'gi');
    
    pages.forEach((page, pageIndex) => {
      const matches = page.match(regex);
      if (matches) {
        // Also find surrounding words for better context
        const contextRegex = new RegExp(`\\b\\w*${flexiblePattern}\\w*`, 'gi');
        const contextMatches = page.match(contextRegex) || matches;
        results.push({ pageIndex, matches: contextMatches });
      }
    });

    setSearchResults(results);
    setShowSearchResults(true);
    setCurrentSearchResult(0);
    
    // Navigate to first result
    if (results.length > 0) {
      setCurrentPage(results[0].pageIndex + 1);
    }
  };

  // Navigate to specific search result
  const goToSearchResult = (index: number) => {
    if (searchResults[index]) {
      setCurrentSearchResult(index);
      setCurrentPage(searchResults[index].pageIndex + 1);
    }
  };

  // Navigate to next search result
  const nextSearchResult = () => {
    const nextIndex = (currentSearchResult + 1) % searchResults.length;
    goToSearchResult(nextIndex);
  };

  // Navigate to previous search result
  const prevSearchResult = () => {
    const prevIndex = currentSearchResult === 0 ? searchResults.length - 1 : currentSearchResult - 1;
    goToSearchResult(prevIndex);
  };

  // Extract chapters/sections from content
  const chapters = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];

  useEffect(() => {
    if (searchTerm && currentPageContent) {
      // Create flexible pattern for highlighting both ASCII and IAST
      const createHighlightPattern = (searchTerm: string) => {
        return searchTerm.split('').map(char => {
          switch(char.toLowerCase()) {
            case 'a': return '[aāĀ]+';
            case 'i': return '[iīĪ]+';
            case 'u': return '[uūŪ]+';
            case 'e': return '[eēĒ]+';
            case 'o': return '[oōŌ]+';
            case 't': return '[tṭṬ]+';
            case 'd': return '[dḍḌ]+';
            case 'n': return '[nṇṆñÑṅṄ]+';
            case 'r': return '[rṛṚṝṜ]+';
            case 'l': return '[lḷḶḹḸ]+';
            case 's': return '[sṣṢśŚ]+';  // Now includes Ś/ś
            case 'm': return '[mṃṂṁṀ]+';
            case 'h': return '[hḥḤ]+';
            case 'c': return '[cćĆ]+';
            case 'y': return '[yẏẎ]+';
            default: return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          }
        }).join('');
      };
      
      const highlightPattern = createHighlightPattern(searchTerm);
      // First try to match the pattern directly
      const directRegex = new RegExp(`(${highlightPattern})`, 'gi');
      let highlighted = currentPageContent.replace(directRegex, '<mark style="background-color: var(--gold); color: var(--deep-blue); padding: 2px; border-radius: 3px;">$1</mark>');
      
      // Also try to match within words
      const contextRegex = new RegExp(`(\\b\\w*${highlightPattern}\\w*)`, 'gi');
      highlighted = highlighted.replace(contextRegex, '<mark style="background-color: var(--gold); color: var(--deep-blue); padding: 2px; border-radius: 3px;">$1</mark>');
      
      setHighlightedContent(highlighted);
    } else {
      setHighlightedContent(currentPageContent);
    }
  }, [searchTerm, currentPageContent]);

  // Update progress when page changes
  useEffect(() => {
    if (bookId) {
      const progress = Math.round((currentPage / totalPages) * 100);
      updateBookProgress(bookId, currentPage, totalPages);
    }
  }, [currentPage, totalPages, bookId]);

  // Keyboard shortcuts for search navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (searchResults.length > 0) {
        if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
          e.preventDefault();
          nextSearchResult();
        } else if (e.shiftKey && e.key === 'F3' || (e.ctrlKey && e.shiftKey && e.key === 'G')) {
          e.preventDefault();
          prevSearchResult();
        }
      }
      
      // ESC to clear search
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('');
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults.length, searchTerm, currentPage, totalPages]);

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
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{color: 'var(--saffron)'}} />
          <p className="text-lg" style={{color: 'var(--deep-blue)'}}>Loading book content...</p>
        </div>
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
            onClick={onBack}
            className="px-4 py-2 rounded-lg"
            style={{background: 'var(--saffron)', color: 'var(--deep-blue)'}}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar - Table of Contents */}
      <div className="lg:w-80 border-r-2 border-orange-200" style={{background: 'var(--cream)'}}>
        <div className="p-4 lg:p-6 border-b border-orange-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 mb-4 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">पीछे जाएं / Go Back</span>
          </button>
          
          <h2 className="text-lg lg:text-xl font-bold mb-4" style={{color: 'var(--deep-blue)'}}>
            {title}
          </h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="पूरी पुस्तक में खोजें / Search entire book..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                performSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{color: 'var(--deep-blue)'}}>
                  {searchResults.length} results found
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={prevSearchResult}
                    disabled={searchResults.length <= 1}
                    className="p-1 rounded hover:bg-yellow-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-xs px-2">
                    {currentSearchResult + 1} of {searchResults.length}
                  </span>
                  <button
                    onClick={nextSearchResult}
                    disabled={searchResults.length <= 1}
                    className="p-1 rounded hover:bg-yellow-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Search Results List */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {searchResults.slice(0, 5).map((result, index) => (
                  <button
                    key={index}
                    onClick={() => goToSearchResult(index)}
                    className={`w-full text-left p-2 rounded text-xs hover:bg-yellow-100 transition-colors ${
                      index === currentSearchResult ? 'bg-yellow-100 border border-yellow-300' : ''
                    }`}
                  >
                    <span className="font-medium">Page {result.pageIndex + 1}</span>
                    <span className="text-gray-600 ml-2">({result.matches.length} matches)</span>
                  </button>
                ))}
                {searchResults.length > 5 && (
                  <p className="text-xs text-gray-500 px-2 py-1">
                    ... and {searchResults.length - 5} more results
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* No Results Message */}
          {showSearchResults && searchResults.length === 0 && searchTerm && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm" style={{color: 'var(--deep-blue)'}}>
                No results found for "{searchTerm}"
              </p>
            </div>
          )}

          {/* Page Navigation Info */}
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="text-sm text-center mb-2">
              <span className="font-semibold">Page {currentPage} of {totalPages}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={handlePageInput}
                className="w-16 px-2 py-1 text-center border border-orange-300 rounded text-sm"
              />
              <span className="text-xs opacity-60">/ {totalPages}</span>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="p-6">
          <h3 className="font-semibold mb-4" style={{color: 'var(--deep-blue)'}}>
            विषय-सूची / Contents
          </h3>
          
          {chapters.length > 0 ? (
            <div className="space-y-2">
              {chapters.slice(0, 10).map((chapter, index) => {
                const cleanChapter = chapter.replace(/<[^>]+>/g, '').trim();
                return (
                  <button
                    key={index}
                    onClick={() => scrollToChapter(cleanChapter)}
                    className="w-full text-left p-3 rounded-lg hover:bg-orange-100 transition-colors text-sm"
                  >
                    {cleanChapter.length > 50 ? `${cleanChapter.substring(0, 50)}...` : cleanChapter}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm opacity-60">No chapters found</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Reading Controls */}
        <div className="border-b border-orange-200 p-4" style={{background: 'var(--cream)'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <BookOpen className="w-5 h-5" style={{color: 'var(--saffron)'}} />
              <span className="font-medium">Reading: {title}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Search Navigation in Header */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="flex items-center space-x-2 mr-4 px-3 py-1 bg-yellow-100 rounded-lg border">
                  <Search className="w-4 h-4" style={{color: 'var(--deep-blue)'}} />
                  <span className="text-sm font-medium">
                    {currentSearchResult + 1} of {searchResults.length}
                  </span>
                  <button
                    onClick={prevSearchResult}
                    className="p-1 rounded hover:bg-yellow-200"
                    title="Previous result (Shift+F3)"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={nextSearchResult}
                    className="p-1 rounded hover:bg-yellow-200"
                    title="Next result (F3)"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="p-1 rounded hover:bg-yellow-200 text-gray-500"
                    title="Clear search (ESC)"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <button
                onClick={decreaseFontSize}
                className="p-2 rounded-lg hover:bg-orange-100 transition-colors"
                title="Decrease font size"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-sm px-2">{fontSize}px</span>
              
              <button
                onClick={increaseFontSize}
                className="p-2 rounded-lg hover:bg-orange-100 transition-colors"
                title="Increase font size"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-orange-100 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Previous</span>
              </button>
            </div>

            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <span className="text-sm">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
              <h4 className="font-semibold mb-3">Reading Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Line Height</label>
                  <input
                    type="range"
                    min="1.4"
                    max="2.5"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs opacity-60">{lineHeight}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Words per Page</label>
                  <select
                    value={wordsPerPage}
                    onChange={(e) => {
                      setWordsPerPage(parseInt(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing pagination
                    }}
                    className="w-full px-3 py-1 border border-orange-300 rounded"
                  >
                    <option value={300}>Small (300 words)</option>
                    <option value={500}>Medium (500 words)</option>
                    <option value={750}>Large (750 words)</option>
                    <option value={1000}>Extra Large (1000 words)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Book Content */}
        <div className="flex-1 overflow-auto">
          <div
            ref={contentRef}
            className="reading-container max-w-4xl mx-auto p-8"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            {/* Enhanced content with custom styling */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: highlightedContent
                  .replace(/<h([1-6])/g, '<h$1 class="chapter-heading"')
                  .replace(/<p>/g, '<p class="mb-4">')
                  .replace(/<blockquote>/g, '<blockquote class="verse">')
              }}
              style={{
                color: 'var(--foreground)',
              }}
            />

            {/* Page indicator at bottom */}
            <div className="mt-8 pt-4 border-t border-orange-200 text-center text-sm opacity-60">
              {currentPage < totalPages && (
                <p>Continue reading... (Page {currentPage} of {totalPages})</p>
              )}
              {currentPage === totalPages && (
                <p>End of document reached.</p>
              )}
            </div>

            {/* Mobile Navigation Controls */}
            <div className="lg:hidden mt-6 p-4 bg-white border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : 'var(--saffron)',
                    color: currentPage === 1 ? '#9ca3af' : 'var(--deep-blue)'
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={handlePageInput}
                      className="w-16 px-2 py-1 text-center border border-orange-300 rounded text-sm"
                    />
                    <span className="text-xs opacity-60">Go to page</span>
                  </div>
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'var(--saffron)',
                    color: currentPage === totalPages ? '#9ca3af' : 'var(--deep-blue)'
                  }}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentPage / totalPages) * 100}%`,
                    backgroundColor: 'var(--saffron)'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs opacity-60 mt-1">
                <span>Start</span>
                <span>{Math.round((currentPage / totalPages) * 100)}% Complete</span>
                <span>End</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EBookReader;