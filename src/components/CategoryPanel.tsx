'use client';

import { Search, Plus } from 'lucide-react';
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
}

const CategoryPanel: React.FC<CategoryPanelProps> = ({
  selectedLanguage,
  languageConfig,
  loadingBooks,
  categories,
  expandedCategories,
  bookId,
  onCategoryToggle,
  onBookSelection,
  onFoldAll,
  onUnfoldAll
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'authors' | 'title'>('categories');
  const [expandedLetters, setExpandedLetters] = useState<{[key: string]: boolean}>({});
  const [expandedAuthors, setExpandedAuthors] = useState<{[key: string]: boolean}>({});
  const [expandedTitleLetters, setExpandedTitleLetters] = useState<{[key: string]: boolean}>({});

  // Organize books by author first letter
  const authorGroups = useMemo(() => {
    const groups: {[key: string]: {author: string; books: Book[]}[]} = {};
    
    // Get all books from all categories
    const allBooks = categories.flatMap(category => category.books);
    
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
  }, [categories]);

  // Organize books by title first letter
  const titleGroups = useMemo(() => {
    const groups: {[key: string]: Book[]} = {};
    
    // Get all books from all categories
    const allBooks = categories.flatMap(category => category.books);
    
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
  }, [categories]);

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
                <Plus className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedLetters[letter] ? 'transform rotate-45' : ''
                }`} />
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
                        <Plus className={`w-3 h-3 text-gray-400 transition-transform ${
                          expandedAuthors[author] ? 'transform rotate-45' : ''
                        }`} />
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
                <Plus className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedTitleLetters[letter] ? 'transform rotate-45' : ''
                }`} />
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
  return (
    <div className="w-80 bg-gray-800 text-white flex flex-col flex-shrink-0">
      {/* Language Section Header */}
      <div className="p-4 bg-yellow-400 text-gray-900">
        <h3 className="text-lg font-semibold">
          {languageConfig[selectedLanguage as keyof typeof languageConfig].label} ({languageConfig[selectedLanguage as keyof typeof languageConfig].count})
        </h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-700">
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex-1 p-3 text-sm font-medium ${
            activeTab === 'categories' 
              ? 'border-b-2 border-yellow-400 text-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          CATEGORIES
        </button>
        <button 
          onClick={() => setActiveTab('authors')}
          className={`flex-1 p-3 text-sm font-medium ${
            activeTab === 'authors' 
              ? 'border-b-2 border-yellow-400 text-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          AUTHORS
        </button>
        <button 
          onClick={() => setActiveTab('title')}
          className={`flex-1 p-3 text-sm font-medium ${
            activeTab === 'title' 
              ? 'border-b-2 border-yellow-400 text-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'categories' && (
          <>
            {loadingBooks ? (
              <div className="p-4 text-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.name} className="border-b border-gray-700">
                  <button
                    onClick={() => onCategoryToggle(category.name)}
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
              ))
            )}
          </>
        )}
        
        {activeTab === 'authors' && renderAuthorsTab()}
        
        {activeTab === 'title' && renderTitlesTab()}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-gray-700 flex justify-between">
        <button 
          onClick={onFoldAll}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Fold all
        </button>
        <button 
          onClick={onUnfoldAll}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Unfold all
        </button>
      </div>
    </div>
  );
};

export default CategoryPanel;