'use client';

import { Search, Plus, Book as BookIcon, BookOpen, FileText, ChevronRight, ChevronDown, RefreshCw, X } from 'lucide-react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { Book } from '../lib/bookStorage';
import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_API_URL } from '../lib/config';

interface CategoryPanelProps {
  selectedLanguage: string;
  languageConfig: {
    [key: string]: {
      label: string;
      code: string;
      icon: string;
      count: number;
    };
  };
  loadingBooks?: boolean;
  expandedCategories?: {[key: string]: boolean};
  bookId?: string;
  onCategoryToggle?: (category: string) => void;
  onBookSelection: (book: Book) => void;
  onFoldAll?: () => void;
  onUnfoldAll?: () => void;
  onChapterSelect?: (pageNumber: number) => void;
  refreshKey?: number;
}

const API_URL = `${BACKEND_API_URL}/categories/tree`;

const CategoryPanel: React.FC<CategoryPanelProps & { bookChapters?: { text: string; wordIndex: number }[] }> = ({
  selectedLanguage,
  languageConfig,
  bookId,
  onBookSelection,
  onChapterSelect,
  onFoldAll,
  onUnfoldAll,
  loadingBooks = false,
  refreshKey,
  ...rest
}) => {
  // Provide default no-op functions if not passed
  const handleFoldAll = onFoldAll || (() => {});
  const handleUnfoldAll = onUnfoldAll || (() => {});
  // Local state for categories and user privileges
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPrivileges, setUserPrivileges] = useState<string[] | null>(null);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Fetch categories and user privileges on client only
  useEffect(() => {
    setLoading(true);
    // Fetch categories
    axios.get(API_URL)
      .then(res => {
        setCategories(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Get user privilege and role from localStorage/sessionStorage
    let privileges: string[] = ['normal'];
    try {
      const userStr = localStorage.getItem('vedic_user') || sessionStorage.getItem('vedic_user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.privilegeForBooks) {
          if (Array.isArray(userObj.privilegeForBooks)) {
            privileges = userObj.privilegeForBooks;
          } else if (typeof userObj.privilegeForBooks === 'string') {
            privileges = [userObj.privilegeForBooks];
          }
        }
        if (userObj.role) {
          setUserRole(userObj.role);
        }
      }
    } catch {}
    setUserPrivileges(privileges);
  }, [refreshKey, manualRefreshKey]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nextWidth = Math.min(620, Math.max(260, e.clientX));
      setPanelWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  // (Removed duplicate userPrivileges and userPrivilege declarations. Only use state variable.)

  // Filter categories/books by user privilege (only after privileges loaded)
  const filteredCategories = (userPrivileges ? categories.map(category => ({
    ...category,
    books: category.books ? category.books.filter((book: any) => userPrivileges.includes(book.type)) : [],
    children: category.children ? category.children : [],
  })) : []);


  // Helper to get all IDs for default expansion
  function getAllIds(node: any) {
    let ids = [String(node._id)];
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        ids = ids.concat(getAllIds(child));
      });
    }
    return ids;
  }

  // Track expanded state for each book
  const [expandedBooks, setExpandedBooks] = useState<{ [bookId: string]: boolean }>({});
  const [unlinkingBookId, setUnlinkingBookId] = useState<string | null>(null);

  const handleUnlinkBook = async (categoryId: string, bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to unlink this book from the category?')) return;
    setUnlinkingBookId(bookId);
    try {
      const token = localStorage.getItem('vedic_auth_token') || sessionStorage.getItem('vedic_auth_token');
      const res = await axios.delete(`${BACKEND_API_URL}/categories/${categoryId}/unlink-book`, {
        data: { bookId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.success) {
        setManualRefreshKey(k => k + 1);
      }
    } catch (err) {
      alert('Failed to unlink book. Please try again.');
    } finally {
      setUnlinkingBookId(null);
    }
  };

  const handleBookToggle = (book: Book) => {
    setExpandedBooks(prev => ({
      ...prev,
      [book._id]: !prev[book._id]
    }));
    // Only call onBookSelection if not already selected
    if (book._id !== bookId && onBookSelection) {
      onBookSelection(book);
    }
  };

  // MUI TreeView recursive rendering (always show children and books)
  const renderTree = (nodes: any[], parentId = '') => {
    return nodes.map((node, idx) => {
      const itemId = node._id ? String(node._id) : `${parentId}${node.name || node.title || 'node'}-${idx}`;
      const categoryId = node._id ? String(node._id) : '';
      return (
        <TreeItem key={itemId} itemId={itemId} label={node.name || node.title}>
          {/* Render children categories */}
          {node.children && node.children.length > 0 && renderTree(node.children, itemId)}
          {/* Render books at leaf node */}
          {node.books && node.books.length > 0 && node.books
            .filter((book: any, idx: number, arr: any[]) =>
              arr.findIndex((b: any) => String(b._id) === String(book._id)) === idx
            )
            .map((book: any, bidx: number) => {
            // Tree item IDs must be globally unique in the tree.
            // Scope book IDs by category to support same book linked in multiple categories.
            const bookIdStr = book._id ? `${itemId}-book-${String(book._id)}` : `${itemId}-book-${bidx}`;
            const isSelected = book._id === bookId;
            const isExpanded = !!expandedBooks[book._id];
            const isUnlinking = unlinkingBookId === String(book._id);
            return (
              <TreeItem
                key={bookIdStr}
                itemId={bookIdStr}
                label={
                  <div>
                    <span
                      style={{ cursor: 'pointer', fontWeight: isSelected ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'space-between', width: '100%', minWidth: 0 }}
                    >
                      <span
                        onClick={() => handleBookToggle(book)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}
                      >
                        <span style={{ color: 'white', fontSize: '1em', display: 'inline-block', width: 18, textAlign: 'center' }}>
                          {rest.bookChapters && isSelected ? (
                            isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                          ) : ''}
                        </span>
                        <span
                          title={book.title}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {book.title}
                        </span>
                      </span>
                      {/* Unlink button — admin only */}
                      {userRole === 'admin' && categoryId && (
                        <button
                          title="Unlink book from category"
                          disabled={isUnlinking}
                          onClick={(e) => handleUnlinkBook(categoryId, String(book._id), e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 2px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: isUnlinking ? 0.4 : 0.6,
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = isUnlinking ? '0.4' : '0.6')}
                        >
                          <X size={13} color="#ef4444" />
                        </button>
                      )}
                    </span>
                    {/* Show chapters if this book is selected, expanded, and bookChapters exist */}
                    {isSelected && isExpanded && rest.bookChapters && rest.bookChapters.length > 0 && (
                      <div style={{ marginTop: 8, marginLeft: 16 }}>
                        {rest.bookChapters.map((chapter, cidx) => (
                          <div
                            key={cidx}
                            style={{ cursor: 'pointer', color: '#fbbf24', fontSize: '0.95em', padding: '2px 0' }}
                            onClick={e => {
                              e.stopPropagation();
                              if (onChapterSelect) onChapterSelect(chapter.wordIndex + 1);
                            }}
                          >
                            {chapter.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
        </TreeItem>
      );
    });
  };
  const [activeTab, setActiveTab] = useState<'categories' | 'authors' | 'title'>('categories');
  const [expandedLetters, setExpandedLetters] = useState<{[key: string]: boolean}>({});
  const [expandedAuthors, setExpandedAuthors] = useState<{[key: string]: boolean}>({});
  const [expandedTitleLetters, setExpandedTitleLetters] = useState<{[key: string]: boolean}>({});
  // removed expandedBookChapters and expandedCategories

  useEffect(() => {
    if (!bookId) return;

    const timer = setTimeout(() => {
      const selectedBookElement = document.querySelector(`[data-book-id="${bookId}"]`) as HTMLElement | null;
      if (selectedBookElement) {
        selectedBookElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [bookId]);

  // Organize books by author first letter
  const authorGroups = useMemo(() => {
    const groups: {[key: string]: {author: string; books: Book[]}[]} = {};
    
    // Get all books from all filtered categories
    const allBooks = filteredCategories.flatMap(category => category.books);
    
    // Group books by author
    const authorMap = new Map<string, Book[]>();
    allBooks.forEach(book => {
      if (book.author) {
        if (!authorMap.has(book.author)) {
          authorMap.set(book.author, []);
        }
        authorMap.get(book.author)!.push(book);
      }
    });
    
    // Function to get the first meaningful letter after removing honorifics
    const getFirstMeaningfulLetter = (authorName: string): string => {
      // Remove honorific titles
      const honorifics = ['Srila', 'His Holiness', 'His Divine Grace', 'Sri', 'Srimad', 'A.C.', 'H.H.', 'H.D.G.'];
      let cleanedName = authorName.trim();
      
      // Remove honorifics from the beginning
      for (const honorific of honorifics) {
        if (cleanedName.startsWith(honorific + ' ')) {
          cleanedName = cleanedName.substring(honorific.length + 1).trim();
        }
      }
      
      return cleanedName.charAt(0).toUpperCase();
    };
    
    // Group authors by first meaningful letter
    authorMap.forEach((books, author) => {
      const firstLetter = getFirstMeaningfulLetter(author);
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push({ author, books });
    });
    
    return groups;
  }, [filteredCategories]);

  // Organize books by title first letter
  const titleGroups = useMemo(() => {
    const groups: {[key: string]: Book[]} = {};
    
    // Get all books from all filtered categories
    const allBooks = filteredCategories.flatMap(category => category.books);
    
    // Function to get the first alphabetical letter from title, ignoring numbers and honorifics
    const getFirstAlphabeticalLetter = (title: string): string => {
      // Remove common prefixes and honorifics from titles
      const prefixes = ['Śrī', 'Sri', 'Shri', 'Śrīmad', 'Srimad', 'The', 'A ', 'An '];
      let cleanedTitle = title.trim();
      
      // Remove prefixes from the beginning
      for (const prefix of prefixes) {
        if (cleanedTitle.startsWith(prefix + ' ') || cleanedTitle.startsWith(prefix)) {
          const prefixLength = cleanedTitle.startsWith(prefix + ' ') ? prefix.length + 1 : prefix.length;
          cleanedTitle = cleanedTitle.substring(prefixLength).trim();
          break; // Only remove the first matching prefix
        }
      }
      
      // Find the first alphabetical character (ignore numbers and special characters)
      for (let i = 0; i < cleanedTitle.length; i++) {
        const char = cleanedTitle.charAt(i).toUpperCase();
        if (char >= 'A' && char <= 'Z') {
          return char;
        }
      }
      
      // If no alphabetical character found, return 'A' as default
      return 'A';
    };
    
    // Group books by first alphabetical letter of title
    allBooks.forEach(book => {
      const firstLetter = getFirstAlphabeticalLetter(book.title);
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(book);
    });
    
    return groups;
  }, [filteredCategories]);

  const toggleTitleLetterExpanded = (letter: string) => {
    setExpandedTitleLetters(prev => ({
      ...prev,
      [letter]: !prev[letter]
    }));
  };

  const toggleLetterExpanded = (letter: string) => {
    setExpandedLetters(prev => ({
      ...prev,
      [letter]: !prev[letter]
    }));
  };

  const toggleAuthorExpanded = (author: string) => {
    setExpandedAuthors(prev => ({
      ...prev,
      [author]: !prev[author]
    }));
  };

  const renderAuthorsTab = () => {
    if (loadingBooks) {
      return (
        <div className="p-4 text-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      );
    }

    const sortedLetters = Object.keys(authorGroups).sort();
    
    return (
      <>
        {sortedLetters.map((letter) => (
          <div key={letter} className="border-b border-gray-700">
            <button
              onClick={() => toggleLetterExpanded(letter)}
              className="w-full p-4 text-left hover:bg-gray-700 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Plus
                  className={`w-4 h-4 transition-transform ${expandedLetters[letter] ? 'transform rotate-45' : ''}`}
                  style={{
                    color:
                      typeof window !== 'undefined' && document.body.getAttribute('data-theme') === 'dark'
                        ? 'var(--text) !important'
                        : 'var(--color-vb-input-border) !important'
                  }}
                />
                <span className="font-medium text-gray-200 text-lg">{letter}</span>
              </div>
            </button>
            
            {expandedLetters[letter] && (
              <div className="bg-gray-750">
                {authorGroups[letter].map(({ author, books }) => (
                  <div key={author} className="border-b border-gray-600 last:border-b-0">
                    <button
                      onClick={() => toggleAuthorExpanded(author)}
                      className="w-full p-3 pl-8 text-left hover:bg-gray-700 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Plus
                          className={`w-3 h-3 transition-transform ${expandedAuthors[author] ? 'transform rotate-45' : ''}`}
                          style={{
                            color:
                              typeof window !== 'undefined' && document.body.getAttribute('data-theme') === 'dark'
                                ? 'var(--text) !important'
                                : 'var(--color-vb-input-border) !important'
                          }}
                        />
                        <span className="font-medium text-gray-300">{author}</span>
                      </div>
                    </button>
                    
                    {expandedAuthors[author] && (
                      <div className="bg-gray-800">
                        {books.map((book) => (
                          <button
                            key={book._id}
                            onClick={() => onBookSelection(book)}
                            className={`w-full p-3 pl-16 text-left hover:bg-gray-600 transition-colors ${
                              bookId === book._id
                                ? 'bg-gray-600 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            <div className="text-sm font-medium">{book.title}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  const renderTitlesTab = () => {
    if (loadingBooks) {
      return (
        <div className="p-4 text-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      );
    }

    const sortedLetters = Object.keys(titleGroups).sort();
    
    return (
      <>
        {sortedLetters.map((letter) => (
          <div key={letter} className="border-b border-gray-700">
            <button
              onClick={() => toggleTitleLetterExpanded(letter)}
              className="w-full p-4 text-left hover:bg-gray-700 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Plus
                  className={`w-4 h-4 transition-transform ${expandedTitleLetters[letter] ? 'transform rotate-45' : ''}`}
                  style={{
                    color:
                      typeof window !== 'undefined' && document.body.getAttribute('data-theme') === 'dark'
                        ? 'var(--text) !important'
                        : 'var(--color-vb-input-border) !important'
                  }}
                />
                <span className="font-medium text-gray-200 text-lg">{letter}</span>
              </div>
            </button>
            
            {expandedTitleLetters[letter] && (
              <div className="bg-gray-750">
                {titleGroups[letter]
                  .sort((a, b) => a.title.localeCompare(b.title)) // Sort books alphabetically by title
                  .map((book) => (
                    <button
                      key={book._id}
                      onClick={() => onBookSelection(book)}
                      className={`w-full p-3 pl-12 text-left hover:bg-gray-600 transition-colors ${
                        bookId === book._id
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
        ))}
      </>
    );
  };

  // Dynamically set text color for light theme
  return (
    <div
      className="flex flex-col flex-shrink-0 category-panel-root relative"
      style={{
        width: panelWidth,
        background: 'var(--card)'
      }}
    >
      {/* Language Section Header */}
      <div
        className="p-4 category-panel-header"
        style={{
          background: 'var(--accent)'
        }}
      >
        <h3 className="text-lg font-semibold category-panel-header-text">
          {languageConfig[selectedLanguage as keyof typeof languageConfig].label} ({languageConfig[selectedLanguage as keyof typeof languageConfig].count})
        </h3>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex border-b"
        style={{
          background: 'var(--accent)',
          borderColor: 'var(--color-vb-header-bottom, var(--border))',
        }}
      >
        <button
          onClick={() => setActiveTab('categories')}
          className="flex-1 p-3 text-sm font-medium"
          style={
            activeTab === 'categories'
              ? {
                  borderBottom: '2px solid var(--text)',
                  color: 'var(--text)',
                  background: 'var(--accent)',
                }
              : {
                  color: 'var(--text)',
                  opacity: 0.7,
                  background: 'var(--accent)',
                }
          }
        >
          CATEGORIES
        </button>
        <button
          onClick={() => setActiveTab('authors')}
          className="flex-1 p-3 text-sm font-medium"
          style={
            activeTab === 'authors'
              ? {
                  borderBottom: '2px solid var(--text)',
                  color: 'var(--text)',
                  background: 'var(--accent)',
                }
              : {
                  color: 'var(--text)',
                  opacity: 0.7,
                  background: 'var(--accent)',
                }
          }
        >
          AUTHORS
        </button>
        <button
          onClick={() => setActiveTab('title')}
          className="flex-1 p-3 text-sm font-medium"
          style={
            activeTab === 'title'
              ? {
                  borderBottom: '2px solid var(--text)',
                  color: 'var(--text)',
                  background: 'var(--accent)',
                }
              : {
                  color: 'var(--text)',
                  opacity: 0.7,
                  background: 'var(--accent)',
                }
          }
        >
          TITLE
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 flex items-center gap-2" style={{ background: 'var(--card)' }}>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search the catalog"
            className="w-full border rounded px-4 py-2 pr-10 focus:outline-none"
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              borderColor: 'var(--color-vb-input-border) !important',
            }}
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4" style={{ color: 'var(--text)', opacity: 0.5 }} />
        </div>
        <button
          title="Refresh book list"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
          onClick={() => setManualRefreshKey(k => k + 1)}
          aria-label="Refresh book list"
        >
          <RefreshCw size={20} style={{ color: 'var(--text)', opacity: 0.7 }} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'categories' && (
          <>
            {loading || !userPrivileges ? (
              <div className="p-4 text-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : (
              <SimpleTreeView sx={{ background: 'var(--card)' }}>
                {renderTree(filteredCategories)}
              </SimpleTreeView>
            )}
          </>
        )}
        
        {activeTab === 'authors' && renderAuthorsTab()}
        
        {activeTab === 'title' && renderTitlesTab()}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t flex justify-between items-center gap-2 category-panel-footer" style={{ borderColor: 'var(--color-vb-header-bottom, var(--border))' }}>
        <button 
          onClick={handleFoldAll}
          className="text-sm px-3 py-1 rounded category-panel-footer-btn"
        >
          Fold all
        </button>
        <button 
          onClick={handleUnfoldAll}
          className="text-sm px-3 py-1 rounded category-panel-footer-btn"
        >
          Unfold all
        </button>
      </div>

      {/* Drag handle to resize category panel width */}
      <div
        onMouseDown={() => setIsResizing(true)}
        title="Drag to resize"
        style={{
          position: 'absolute',
          top: 0,
          right: -3,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 20,
          background: isResizing ? 'rgba(251, 191, 36, 0.35)' : 'transparent',
        }}
      />
    </div>
  );
};

export default CategoryPanel;