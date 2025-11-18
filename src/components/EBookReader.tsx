'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft, ZoomIn, ZoomOut, Settings, SkipForward, SkipBack, AlertCircle, Bookmark, BookmarkCheck, User, Upload, Bug, ChevronDown, Plus, FileText, Search } from 'lucide-react';
import { updateBookProgress, fetchBookContent, fetchBooks, Book } from '../lib/bookStorage';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import SideNav from './SideNav';
import CategoryPanel from './CategoryPanel';
import FooterControls from './FooterControls';

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
  const [isNavigatingToSearch, setIsNavigatingToSearch] = useState(false);
  const [pendingSearchScroll, setPendingSearchScroll] = useState<{pageIndex: number; matchIndex: number} | null>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState(0); // For loading text animation
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [isCategoryPanelVisible, setIsCategoryPanelVisible] = useState(true);
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
  
  // Backend pagination state
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  const [isContentHtml, setIsContentHtml] = useState(false);
  const lastLoadedPageRef = useRef<number>(1);
  const bookmarkLoadedRef = useRef<boolean>(false);

  // Get user context for bookmark functionality
  const { user: authUser } = useAuth();

  // Content loading function
  const loadContent = useCallback(async () => {
    if (!bookId) return;
    
    // Prevent race conditions - if we're already loading this page, don't reload
    if (lastLoadedPageRef.current === currentPage && !isLoading) {
      console.log(`Content for page ${currentPage} is already loaded, skipping...`);
      return;
    }
    
    console.log('Loading content for book ID:', bookId, 'page:', currentPage);
    setIsLoading(true);
    setError('');
    try {
      // Request HTML format to preserve formatting with pagination
      const result = await fetchBookContent(
        bookId, 
        currentPage, 
        'html'
      );
      console.log('fetchBookContent result:', result);
      
      if (result) {
        console.log('Setting paginated content with length:', result.content.length);
        setContent(result.content);
        if (result.pagination) {
          setPaginationInfo(result.pagination);
          setIsContentHtml(result.pagination.format === 'html');
        }
        if (result.metadata) {
          setBookTitle(result.metadata.title || `Book ${bookId}`);
        }
        // Track the page we just loaded
        lastLoadedPageRef.current = currentPage;
        console.log(`Successfully loaded page ${currentPage}, updated lastLoadedPageRef`);
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
  }, [bookId, currentPage, isLoading]);

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
    // Filter books by selected language first
    const filteredBooks = booksList.filter(book => {
      // You can add language detection logic here based on your book metadata
      // For now, we'll assume all books are English unless specified otherwise
      // This is where you'd implement language filtering based on book metadata
      
      if (selectedLanguage === 'english') {
        // For English, show books that don't have a specific language tag or are tagged as English
        return !book.tags?.some(tag => tag.toLowerCase().includes('telugu') || tag.toLowerCase().includes('sanskrit'));
      } else if (selectedLanguage === 'telugu') {
        // For Telugu, show books tagged with Telugu
        return book.tags?.some(tag => tag.toLowerCase().includes('telugu'));
      } else if (selectedLanguage === 'sanskrit') {
        // For Sanskrit, show books tagged with Sanskrit
        return book.tags?.some(tag => tag.toLowerCase().includes('sanskrit'));
      }
      
      return true; // Default: show all books
    });

    // Define the predefined categories in order
    const predefinedCategories = [
      'Srila Prabhupada',
      'Acaryas',
      'Great Vaishnavas',
      'Vaishnavas of ISKCON',
      'Contemporary vaishnavas',
      'Vedic Sages',
      'Other authors',
      'Sastras',
      'Other'
    ];

    const categoryMap = new Map<string, Book[]>();
    
    // Initialize all predefined categories
    predefinedCategories.forEach(category => {
      categoryMap.set(category, []);
    });

    filteredBooks.forEach(book => {
      let category = 'Other'; // Default category
      
      // First, always check author for specific categorization
      const authorCategory = getCategoryByAuthor(book.author);
      
      // If we have a specific author-based category, use it
      if (authorCategory !== 'Acaryas' || !book.tags || book.tags.length === 0) {
        category = authorCategory;
      } else {
        // Only use tag-based categorization for books without specific author categorization
        // and if the first tag matches our predefined categories
        const bookCategory = book.tags[0];
        if (predefinedCategories.includes(bookCategory)) {
          category = bookCategory;
        } else if (bookCategory.toLowerCase().includes('scripture') || bookCategory.toLowerCase().includes('sastra')) {
          // Only categorize as Sastras if author is not specifically categorized
          category = 'Sastras';
        } else {
          category = 'Acaryas'; // Default for spiritual books
        }
      }

      categoryMap.get(category)!.push(book);
    });

    // Helper function for author-based categorization
    function getCategoryByAuthor(author?: string): string {
      if (!author) return 'Acaryas';
      
      const authorLower = author.toLowerCase();
      
      if (authorLower.includes('prabhupada') || authorLower.includes('a.c. bhaktivedanta')) {
        return 'Srila Prabhupada';
      } else if (authorLower.includes('vrindavana dasa thakura') || 
                 authorLower.includes('krishnadasa kaviraja') || 
                 authorLower.includes('narottama dasa thakura') ||
                 authorLower.includes('srila rupa gosvami') ||
                 authorLower.includes('srila sanatana gosvami') ||
                 authorLower.includes('jiva gosvami') ||
                 authorLower.includes('raghunatha dasa gosvami')) {
        return 'Acaryas';
      } else if (authorLower.includes('thakura') || authorLower.includes('gosvami') || authorLower.includes('goswami')) {
        return 'Great Vaishnavas';
      } else {
        return 'Other authors'; // For unknown authors
      }
    }

    // Create organized categories, filtering out empty ones
    const organizedCategories = predefinedCategories.map(name => ({
      name,
      books: categoryMap.get(name) || [],
      expanded: false // Start with categories collapsed
    })).filter(category => category.books.length > 0);

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

  // Search functionality - Search entire book via backend
  const performFullBookSearch = async (query: string) => {
    console.log('🔍 performFullBookSearch called with:', { query, bookId });
    
    if (!query.trim() || !bookId) {
      console.log('❌ Missing query or bookId:', { query: query.trim(), bookId });
      setSearchResults([]);
      setShowSearchResults(false);
      setCurrentSearchIndex(0);
      setIsSearchMode(false);
      return;
    }

    try {
      console.log('🔍 Performing full book search for:', query);
      console.log('📖 Book ID:', bookId);
      setIsLoading(true);
      
      // Call backend API directly with proper CORS handling
      const apiUrl = `http://localhost:5000/api/books/${bookId}/search?q=${encodeURIComponent(query)}&limit=200`;
      console.log('📡 Calling backend API directly:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Enable CORS
      });
      
      console.log('📥 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API call failed:', { status: response.status, statusText: response.statusText, errorText });
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const searchData = await response.json();
      console.log('📊 Search data received:', searchData);
      
      if (searchData.success && searchData.data.results) {
        const results = searchData.data.results.map((result: any) => ({
          pageIndex: result.pageNumber - 1, // Convert to 0-based index
          context: result.context,
          match: result.match,
          beforeContext: result.beforeContext || '',
          afterContext: result.afterContext || '',
          fullContext: result.fullContext || result.context
        }));
        
        console.log(`✅ Found ${results.length} matches returned (${searchData.data.totalMatches} total matches)`);
        
        if (searchData.data.hasMore) {
          console.log(`📄 Note: Showing first ${results.length} of ${searchData.data.totalMatches} total matches`);
        }
        
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
        setIsSearchMode(results.length > 0);
        setCurrentSearchIndex(0);
        
        // Navigate to first result if found
        if (results.length > 0) {
          setCurrentPage(results[0].pageIndex + 1);
        }
      } else {
        console.log('No search results found');
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearchMode(false);
      }
    } catch (error) {
      console.error('❌ Backend search error:', error);
      console.log('🔄 Falling back to local search');
      // Fallback to local search if backend search fails
      performLocalSearch(query);
    } finally {
      setIsLoading(false);
    }
  };

  // Local search functionality (fallback)
  const performLocalSearch = (query: string) => {
    console.log('🏠 Performing LOCAL search for:', query);
    if (!query.trim() || !content) {
      setSearchResults([]);
      setShowSearchResults(false);
      setCurrentSearchIndex(0);
      setIsSearchMode(false);
      return;
    }

    console.log('📄 Searching in pages array, length:', pages.length);

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
    
    console.log(`🏠 Local search completed: ${results.length} matches found`);
    console.log('📍 Results by page:', results.map(r => `Page ${r.pageIndex + 1}`));
    
    // Navigate to first result if found
    if (results.length > 0) {
      setCurrentPage(results[0].pageIndex + 1);
    }
  };

  // Main search function (renamed from performSearch)
  const performSearch = (query: string) => {
    console.log('🎯 performSearch called with query:', query);
    // Try full book search first, fallback to local search if needed
    performFullBookSearch(query);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    console.log('🔤 Search input changed to:', value);
    
    // Debounce search to avoid too many calls
    if (value.trim()) {
      console.log('⏱️ Setting timeout for search...');
      setTimeout(() => {
        console.log('⏰ Timeout executed, calling performSearch');
        performSearch(value);
      }, 500);
    } else {
      console.log('🧹 Clearing search results');
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearchMode(false);
    }
  };

  // Function to scroll to a specific search match
  const scrollToSearchMatch = useCallback((pageIndex: number, matchIndex: number = 0) => {
    console.log('🎯 scrollToSearchMatch called:', { pageIndex, matchIndex, currentPage });
    
    // If we're on the wrong page, navigate to the correct page first
    if (pageIndex + 1 !== currentPage) {
      console.log('📄 Setting page from', currentPage, 'to', pageIndex + 1);
      
      // When navigating to search result, we need to calculate the match index properly
      // Find the current search result and calculate its index within the target page
      const currentResult = searchResults[currentSearchIndex];
      const matchesOnTargetPage = searchResults.filter(r => r.pageIndex === pageIndex);
      const correctMatchIndex = matchesOnTargetPage.findIndex(r => r === currentResult);
      
      console.log('🎯 Calculated match index for target page:', {
        currentSearchIndex,
        pageIndex,
        correctMatchIndex,
        totalMatchesOnPage: matchesOnTargetPage.length
      });
      
      setIsNavigatingToSearch(true);
      setPendingSearchScroll({ pageIndex, matchIndex: correctMatchIndex >= 0 ? correctMatchIndex : matchIndex });
      setCurrentPage(pageIndex + 1);
      return;
    }
    
    // Clear navigation flag since we're on the right page
    setIsNavigatingToSearch(false);
    setPendingSearchScroll(null);
    
    const scrollToMatch = () => {
      const matchElement = document.getElementById(`search-match-${pageIndex + 1}-${matchIndex}`);
      if (matchElement && contentRef.current) {
        console.log('Found search match element, scrolling to it:', matchElement.id);
        
        // Remove previous active highlighting from all matches
        document.querySelectorAll('span[id^="search-match-"]').forEach(span => {
          const element = span as HTMLElement;
          element.style.backgroundColor = '#fbbf24';
          element.style.boxShadow = 'none';
          element.style.transform = 'none';
        });
        
        // Highlight current match with different color and animation
        matchElement.style.backgroundColor = '#f59e0b';
        matchElement.style.boxShadow = '0 0 0 3px #f59e0b, 0 0 10px rgba(245, 158, 11, 0.5)';
        matchElement.style.transform = 'scale(1.05)';
        matchElement.style.transition = 'all 0.3s ease';
        
        // Scroll to the match with proper offset
        const rect = matchElement.getBoundingClientRect();
        const containerRect = contentRef.current.getBoundingClientRect();
        const scrollTop = matchElement.offsetTop - containerRect.height / 2;
        
        contentRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        
        // Also use scrollIntoView as backup
        setTimeout(() => {
          matchElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }, 100);
        
        console.log('✅ Successfully scrolled to search match');
        return true;
      } else {
        console.log('🔍 Search match element not found:', `search-match-${pageIndex + 1}-${matchIndex}`);
        return false;
      }
    };
    
    // Try multiple times with increasing delays
    const maxAttempts = 10;
    let attempts = 0;
    
    const tryScroll = () => {
      attempts++;
      if (scrollToMatch()) {
        console.log(`✅ Successfully scrolled to search match on attempt ${attempts}`);
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(tryScroll, attempts * 100); // Increasing delay: 100ms, 200ms, 300ms...
      } else {
        console.warn('❌ Failed to find search match element after', maxAttempts, 'attempts');
      }
    };
    
    tryScroll();
  }, [currentPage, searchResults, currentSearchIndex]);

  const goToNextSearchResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      // Use goToSearchResult to handle proper navigation and match indexing
      goToSearchResult(nextIndex);
    }
  };

  const goToPreviousSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      // Use goToSearchResult to handle proper navigation and match indexing
      goToSearchResult(prevIndex);
    }
  };

  // Function to jump to a specific search result
  const goToSearchResult = useCallback((index: number) => {
    if (index >= 0 && index < searchResults.length) {
      const result = searchResults[index];
      const targetPage = result.pageIndex + 1;
      
      console.log('🎯 goToSearchResult called:', {
        index,
        targetPage,
        currentPage,
        result: result.match,
        resultPageIndex: result.pageIndex,
        context: result.context.substring(0, 100) + '...',
        pageMatch: `Search shows page ${result.pageIndex + 1}, navigating to page ${targetPage}`
      });
      
      // Calculate match index within the target page
      const matchesOnTargetPage = searchResults.filter(r => r.pageIndex === result.pageIndex);
      const matchIndexInPage = matchesOnTargetPage.findIndex(r => r === result);
      
      console.log('🧮 Match calculation:', {
        targetPageIndex: result.pageIndex,
        matchesOnPage: matchesOnTargetPage.length,
        matchIndexInPage,
        totalSearchResults: searchResults.length,
        systemMessage: 'Using updated pagination - backend and frontend should now match!'
      });
      
      setCurrentSearchIndex(index);
      
      // If we need to change pages, do that first
      if (currentPage !== targetPage) {
        console.log('📄 Page change needed from', currentPage, 'to', targetPage, '- pagination systems should now match!');
        setCurrentPage(targetPage);
        // Scrolling will happen automatically via useEffect when content updates
      } else {
        // If we're on the same page, scroll immediately
        console.log('📍 Same page, scrolling immediately to match', matchIndexInPage);
        scrollToSearchMatch(result.pageIndex, matchIndexInPage);
      }
    }
  }, [searchResults, currentPage, scrollToSearchMatch]);

  // Language and category management
  const toggleLanguage = (language: string) => {
    setSelectedLanguage(language);
  };

  const toggleCategoryPanel = () => {
    setIsCategoryPanelVisible(prev => !prev);
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
    english: { label: 'English books', code: 'EN', icon: 'EN', count: 3 },
    telugu: { label: 'Telugu books', code: 'TE', icon: 'తె', count: 1 },
    sanskrit: { label: 'Sanskrit books', code: 'संस्कृत', icon: 'सं', count: 1 }
  };

  // Re-organize books when language changes
  useEffect(() => {
    if (books.length > 0) {
      organizeBooks(books);
    }
  }, [selectedLanguage, books]);

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

  // Load book content when component mounts or book changes
  useEffect(() => {
    if (!bookId) {
      setIsLoading(false);
      setContent('');
      setError('');
      return;
    }

    console.log('Book changed to:', bookId, 'Resetting bookmark flag');
    
    // Reset bookmark loaded flag for new book
    bookmarkLoadedRef.current = false;
    
    // Load bookmark immediately for new book (before content loads)
    if ((user || authUser) && !bookmarkLoadedRef.current) {
      const bookmarkedPage = loadBookmark();
      console.log('Initial bookmark loading for user:', (user || authUser)?.username, 'book:', bookId, 'page:', bookmarkedPage);
      if (bookmarkedPage > 1) {
        console.log('Setting initial page to bookmarked page:', bookmarkedPage);
        setCurrentPage(bookmarkedPage);
      }
      setIsBookmarked(!!localStorage.getItem(getBookmarkKey()!));
      bookmarkLoadedRef.current = true;
      console.log('Bookmark loading completed, flag set to true');
    }
    
    // Load content directly for initial book load
    const initialLoad = async () => {
      console.log('Initial content loading for book:', bookId, 'page:', currentPage);
      setIsLoading(true);
      setError('');
      try {
        const result = await fetchBookContent(bookId, currentPage, 'html');
        console.log('Initial fetchBookContent result:', result);
        
        if (result) {
          setContent(result.content);
          if (result.pagination) {
            setPaginationInfo(result.pagination);
            setIsContentHtml(result.pagination.format === 'html');
          }
          if (result.metadata) {
            setBookTitle(result.metadata.title || `Book ${bookId}`);
          }
          lastLoadedPageRef.current = currentPage;
          console.log(`Initial load completed for page ${currentPage}`);
        }
      } catch (err) {
        console.error('Initial loading error:', err);
        setError('Error loading book content');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialLoad();
  }, [bookId]); // Removed loadContent dependency to prevent loops

  // Remove the problematic bookmark loading useEffect that depends on content
  // This was causing the page to reset back to bookmark on every navigation

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

  const totalPages = paginationInfo?.totalPages || pages.length;
  const currentPageContent = paginationInfo ? content : (pages[currentPage - 1] || '');

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

  // Reload content when page changes (for backend pagination)
  useEffect(() => {
    console.log('Page reload useEffect triggered:', {
      bookId,
      currentPage, 
      lastLoaded: lastLoadedPageRef.current,
      shouldReload: bookId && currentPage !== lastLoadedPageRef.current
    });
    
    if (bookId && currentPage !== lastLoadedPageRef.current) {
      console.log(`=== PAGE RELOAD: ${lastLoadedPageRef.current} → ${currentPage} ===`);
      console.log('Current states:', { 
        bookId, 
        currentPage, 
        lastLoaded: lastLoadedPageRef.current,
        bookmarkLoaded: bookmarkLoadedRef.current,
        hasPaginationInfo: !!paginationInfo 
      });
      
      // Call loadContent directly instead of through dependency
      const loadContentNow = async () => {
        if (!bookId) return;
        
        console.log('Direct content loading for book:', bookId, 'page:', currentPage);
        setIsLoading(true);
        setError('');
        try {
          const result = await fetchBookContent(bookId, currentPage, 'html');
          console.log('Direct fetchBookContent result:', result);
          
          if (result) {
            console.log('Direct setting content with length:', result.content.length);
            setContent(result.content);
            if (result.pagination) {
              setPaginationInfo(result.pagination);
              setIsContentHtml(result.pagination.format === 'html');
            }
            if (result.metadata) {
              setBookTitle(result.metadata.title || `Book ${bookId}`);
            }
            lastLoadedPageRef.current = currentPage;
            console.log(`Direct load completed for page ${currentPage}`);
          }
        } catch (err) {
          console.error('Direct loading error:', err);
          setError('Error loading book content');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadContentNow();
    }
  }, [currentPage, bookId]);

  // Auto-scroll to current search result when page content updates
  useEffect(() => {
    if (isSearchMode && searchResults.length > 0 && highlightedContent && currentSearchIndex < searchResults.length) {
      const currentPageIndex = currentPage - 1;
      const currentResult = searchResults[currentSearchIndex];
      const currentResultPage = currentResult?.pageIndex;
      
      console.log('Auto-scroll effect triggered:', {
        isSearchMode,
        currentPage,
        currentPageIndex,
        currentResultPage,
        currentSearchIndex,
        hasHighlightedContent: !!highlightedContent,
        shouldScroll: currentResultPage === currentPageIndex
      });
      
      if (currentResultPage === currentPageIndex) {
        // Calculate match index within current page
        const matchesOnCurrentPage = searchResults.filter(r => r.pageIndex === currentPageIndex);
        const currentResult = searchResults[currentSearchIndex];
        const matchIndexInPage = matchesOnCurrentPage.findIndex(r => r === currentResult);
        
        console.log('Auto-scrolling to search match on current page:', {
          matchIndexInPage,
          totalMatchesOnPage: matchesOnCurrentPage.length,
          currentSearchIndex
        });
        
        scrollToSearchMatch(currentPageIndex, matchIndexInPage >= 0 ? matchIndexInPage : 0);
      }
    }
  }, [highlightedContent, isSearchMode, currentSearchIndex, searchResults, currentPage, scrollToSearchMatch]);

  // Handle pending search scroll after page navigation
  useEffect(() => {
    if (pendingSearchScroll && !isNavigatingToSearch && highlightedContent) {
      console.log('🔄 Executing pending search scroll:', pendingSearchScroll);
      const { pageIndex, matchIndex } = pendingSearchScroll;
      
      // Small delay to ensure content is rendered
      setTimeout(() => {
        scrollToSearchMatch(pageIndex, matchIndex);
      }, 200);
    }
  }, [pendingSearchScroll, isNavigatingToSearch, highlightedContent, scrollToSearchMatch]);

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
    console.log('goToNextPage called. Current page:', currentPage, 'Total pages:', totalPages, 'bookmarkLoaded:', bookmarkLoadedRef.current);
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      console.log('Setting next page from', currentPage, 'to', newPage);
      setCurrentPage(newPage);
      // Ensure bookmark doesn't override this navigation
      if (!bookmarkLoadedRef.current) {
        bookmarkLoadedRef.current = true;
      }
    }
  };

  const goToPreviousPage = () => {
    console.log('=== goToPreviousPage START ===');
    console.log('Current state:', { 
      currentPage, 
      bookmarkLoaded: bookmarkLoadedRef.current,
      lastLoaded: lastLoadedPageRef.current 
    });
    
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      console.log('Navigating from page', currentPage, 'to page', newPage);
      
      // Ensure bookmark loading is marked as complete to prevent interference
      bookmarkLoadedRef.current = true;
      
      setCurrentPage(newPage);
      console.log('setCurrentPage called with:', newPage);
    } else {
      console.log('Cannot go to previous page, already at page 1');
    }
    console.log('=== goToPreviousPage END ===');
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

  // Create loading component for main content area
  const LoadingContent = () => (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
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
      <Header 
        user={user} 
        authUser={authUser} 
        onLogout={onLogout} 
        onViewChange={onViewChange} 
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Language Selection */}
        <SideNav 
          selectedLanguage={selectedLanguage}
          languageConfig={languageConfig}
          isCategoryPanelVisible={isCategoryPanelVisible}
          onLanguageToggle={toggleLanguage}
          onCategoryPanelToggle={toggleCategoryPanel}
        />

        {/* Categories Panel */}
        {isCategoryPanelVisible && (
          <CategoryPanel
            selectedLanguage={selectedLanguage}
            languageConfig={languageConfig}
            loadingBooks={loadingBooks}
            categories={categories}
            expandedCategories={expandedCategories}
            bookId={bookId}
            onCategoryToggle={toggleCategoryExpanded}
            onBookSelection={handleBookSelection}
            onFoldAll={foldAllCategories}
            onUnfoldAll={unfoldAllCategories}
          />
        )}

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
          
          {bookId && isLoading ? (
            <LoadingContent />
          ) : bookId && content ? (
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
                        {searchResults.length > 0 && (
                          <span className="text-xs text-amber-600 ml-2">
                            (Pages: {[...new Set(searchResults.map(r => r.pageIndex + 1))].sort((a, b) => a - b).slice(0, 20).join(', ')}
                            {[...new Set(searchResults.map(r => r.pageIndex + 1))].length > 20 ? '...' : ''})
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                      {searchResults.slice(0, 100).map((result, index) => (
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
              <FooterControls onAboutBook={() => console.log('About book clicked')} />
                </div>
              )}
            </div>
          ) : bookId && !content && !isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Book Not Found</h2>
                <p className="text-gray-500 mb-2">The selected book could not be loaded</p>
                <p className="text-gray-500">Please try selecting another book</p>
              </div>
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