'use client';

import { Search, Plus, Book as BookIcon, BookOpen, FileText } from 'lucide-react';
import { Book } from '../lib/bookStorage';
import { useState, useMemo } from 'react';

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
  loadingBooks: boolean;
  categories: {name: string; books: Book[]; expanded: boolean}[];
  expandedCategories: {[key: string]: boolean};
  bookId?: string;
  onCategoryToggle: (category: string) => void;
  onBookSelection: (book: Book) => void;
  onFoldAll: () => void;
  onUnfoldAll: () => void;
  onChapterSelect?: (pageNumber: number) => void;
}

const CategoryPanel: React.FC<CategoryPanelProps & { bookChapters?: { text: string; wordIndex: number }[] }> = ({
  selectedLanguage,
  languageConfig,
  loadingBooks,
  categories,
  expandedCategories,
  bookId,
  onCategoryToggle,
  onBookSelection,
  onFoldAll,
  onUnfoldAll,
  bookChapters = [],
  onChapterSelect
}) => {
  // Get user privilege from localStorage/sessionStorage
  let userPrivilege = 'normal';
  let userPrivileges: string[] = ['normal'];
  try {
    const userStr = localStorage.getItem('vedic_user') || sessionStorage.getItem('vedic_user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj.privilegeForBooks) {
        if (Array.isArray(userObj.privilegeForBooks)) {
          userPrivileges = userObj.privilegeForBooks;
        } else if (typeof userObj.privilegeForBooks === 'string') {
          userPrivileges = [userObj.privilegeForBooks];
        }
      }
    }
  } catch {}

  // Filter categories/books by user privilege
  const filteredCategories = categories.map(category => ({
    ...category,
    books: category.books.filter(book => {
      // Show book if its type is included in user's privileges
      return userPrivileges.includes(book.type);
    })
  }));


  // Use filteredCategories everywhere below instead of categories
  const [activeTab, setActiveTab] = useState<'categories' | 'authors' | 'title'>('categories');
  const [expandedLetters, setExpandedLetters] = useState<{[key: string]: boolean}>({});
  const [expandedAuthors, setExpandedAuthors] = useState<{[key: string]: boolean}>({});
  const [expandedTitleLetters, setExpandedTitleLetters] = useState<{[key: string]: boolean}>({});
  const [expandedBookChapters, setExpandedBookChapters] = useState<{[bookId: string]: boolean}>({});

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
      className="w-80 flex flex-col flex-shrink-0 category-panel-root"
      style={{
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
      <div className="p-4" style={{ background: 'var(--card)' }}>
        <div className="relative">
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
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'categories' && (
          <>
            {loadingBooks ? (
              <div className="p-4 text-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.name} className="border-b" style={{ borderColor: 'var(--color-vb-header-bottom, var(--border))' }}>
                  <button
                    onClick={() => onCategoryToggle(category.name)}
                    className="w-full p-4 text-left flex items-center justify-between group transition-colors category-panel-category-btn"
                  >
                    <div className="flex items-center space-x-3">
                      <Plus className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedCategories[category.name] ? 'transform rotate-45' : ''
                      }`}
                      style={{
                        color:
                          typeof window !== 'undefined' && document.body.getAttribute('data-theme') === 'dark'
                            ? 'var(--text) !important'
                            : 'var(--color-vb-input-border) !important'
                      }}
                    />
                      <span className="text-xl font-bold category-panel-category-text" style={{lineHeight: '1.3'}}>{category.name}</span>
                    </div>
                  </button>
                  
                  {expandedCategories[category.name] && (
                    <div>
                      {category.books.map((book) => (
                        <div key={book._id} className="border-b border-gray-600 last:border-b-0">
                          <div className="flex items-center">
                            <button
                              onClick={() => {
                                onBookSelection(book);
                                setExpandedBookChapters(prev => ({
                                  ...prev,
                                  [book._id]: !prev[book._id]
                                }));
                              }}
                              className={`flex items-center w-full p-3 pl-8 text-left transition-colors category-panel-book-btn${bookId === book._id ? ' selected' : ''}`}
                              style={{ background: 'transparent', border: 'none' }}
                              onMouseEnter={e => {
                                const theme = typeof window !== 'undefined' ? document.body.getAttribute('data-theme') : null;
                                if ((!theme || theme === 'light')) {
                                  if (bookId === book._id) {
                                    e.currentTarget.style.background = '';
                                  } else {
                                    e.currentTarget.style.background = 'var(--color-vb-hover-bg, #f8f9fa)';
                                  }
                                }
                              }}
                              onMouseLeave={e => {
                                const theme = typeof window !== 'undefined' ? document.body.getAttribute('data-theme') : null;
                                if ((!theme || theme === 'light')) {
                                  if (bookId === book._id) {
                                    e.currentTarget.style.background = '';
                                  } else {
                                    e.currentTarget.style.background = '';
                                  }
                                }
                              }}
                            >
                              <span className="mr-2">
                                {expandedBookChapters[book._id] ? (
                                  <BookOpen size={16} />
                                ) : (
                                  <BookIcon size={16} />
                                )}
                              </span>
                              <span className="text-lg font-bold category-panel-book-title" style={{lineHeight: '1.3'}}>{book.title}</span>
                              {book.author && (
                                <span className="text-xs category-panel-book-author ml-2" style={{ opacity: 0.7 }}>{book.author}</span>
                              )}
                            </button>
                          </div>
                          {bookId === book._id && expandedBookChapters[book._id] && (() => {
                            return (
                              <div className="pl-16 pt-2 border-l border-gray-700">
                                {Array.isArray(book.chapterswithPageNo) && book.chapterswithPageNo.length > 0 ? (
                                  book.chapterswithPageNo.map((chapter, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center text-base py-3 cursor-pointer hover:text-yellow-400 border-b border-gray-700 last:border-b-0 transition-all"
                                      style={{ color: 'var(--text)' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onChapterSelect) onChapterSelect(chapter.pageNumber);
                                      }}
                                    >
                                      <span className="mr-2"><FileText size={16} /></span>
                                      <span className="ml-2 font-semibold">{chapter.chapterName}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs" style={{ color: 'red' }}>
                                    No chapters found for this book.
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
        
        {activeTab === 'authors' && renderAuthorsTab()}
        
        {activeTab === 'title' && renderTitlesTab()}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t flex justify-between items-center gap-2 category-panel-footer" style={{ borderColor: 'var(--color-vb-header-bottom, var(--border))' }}>
        <button 
          onClick={onFoldAll}
          className="text-sm px-3 py-1 rounded category-panel-footer-btn"
        >
          Fold all
        </button>
        <button 
          onClick={onUnfoldAll}
          className="text-sm px-3 py-1 rounded category-panel-footer-btn"
        >
          Unfold all
        </button>
      </div>
    </div>
  );
};

export default CategoryPanel;