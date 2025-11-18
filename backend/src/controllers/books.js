import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import Book from '../models/Book.js';
import ReadingProgress from '../models/ReadingProgress.js';
import { getGridfsBucket } from '../config/database.js';
import { AppError, catchAsync, validationError } from '../middleware/errorHandler.js';
import { extractTextContent, getPaginatedContent, extractHtmlContent } from '../utils/textExtractor.js';
import optimizedCache from '../../utils/optimizedContentCache.js';

// Upload a new book
export const uploadBook = catchAsync(async (req, res, next) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  if (!req.file) {
    return next(new AppError('Please upload a book file', 400));
  }

  const {
    title,
    author,
    description,
    language,
    category,
    tags = [],
    metadata = {}
  } = req.body;

  try {
    // Upload file to GridFS manually
    const gridfsBucket = getGridfsBucket();
    
    const filename = `${Date.now()}_${req.file.originalname}`;
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user.id,
        uploadDate: new Date()
      }
    });

    // Upload the file buffer
    uploadStream.end(req.file.buffer);

    // Wait for upload to complete
    const gridfsId = await new Promise((resolve, reject) => {
      uploadStream.on('finish', () => {
        resolve(uploadStream.id);
      });
      uploadStream.on('error', reject);
    });

    // Create book document
    const book = await Book.create({
      title,
      author,
      description,
      language: language.toLowerCase(),
      category,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      fileInfo: {
        gridfsId,
        originalName: req.file.originalname,
        filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileExtension: getFileExtension(req.file.originalname)
      },
      metadata: {
        totalPages: metadata.totalPages || 0,
        isbn: metadata.isbn || undefined,
        publishedDate: metadata.publishedDate || undefined,
        publisher: metadata.publisher || undefined,
        edition: metadata.edition || undefined
      },
      uploadInfo: {
        uploadedBy: req.user.id,
        uploadDate: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Book uploaded successfully',
      data: {
        book
      }
    });
  } catch (error) {
    return next(new AppError('Error uploading book file', 500));
  }
});

// Get all books with pagination and filtering
export const getAllBooks = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 12,
    language,
    category,
    author,
    sort = '-uploadInfo.uploadDate',
    search
  } = req.query;

  // Build filter
  const filter = { isActive: true };
  
  if (language) filter.language = language.toLowerCase();
  if (category) filter.category = category;
  if (author) filter.author = { $regex: author, $options: 'i' };
  
  // Add text search if search query provided
  if (search) {
    filter.$text = { $search: search };
  }

  // Get user's access level
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    filter.$or = [
      { 'accessControl.isPublic': true },
      { 'accessControl.accessLevel': 'public' },
      ...(req.user ? [{ 'accessControl.allowedRoles': userRole }] : [])
    ];
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const books = await Book.find(filter)
    .populate('uploadInfo.uploadedBy', 'username profile.firstName profile.lastName')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-fileInfo.gridfsId'); // Don't expose internal file IDs

  const total = await Book.countDocuments(filter);

  res.json({
    success: true,
    data: {
      books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBooks: total,
        hasNextPage: skip + books.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

// Get a specific book by ID
export const getBookById = catchAsync(async (req, res, next) => {
  const book = await Book.findOne({ 
    _id: req.params.id, 
    isActive: true 
  })
    .populate('uploadInfo.uploadedBy', 'username profile.firstName profile.lastName')
    .select('-fileInfo.gridfsId');

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Check access permissions
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    const hasAccess = book.accessControl.isPublic || 
                     book.accessControl.accessLevel === 'public' ||
                     (req.user && book.accessControl.allowedRoles.includes(userRole));
    
    if (!hasAccess) {
      return next(new AppError('Access denied to this book', 403));
    }
  }

  // Increment view count
  await book.incrementView();

  // Get user's reading progress if authenticated
  let readingProgress = null;
  if (req.user) {
    readingProgress = await ReadingProgress.findOne({
      userId: req.user.id,
      bookId: book._id
    });
  }

  res.json({
    success: true,
    data: {
      book,
      readingProgress
    }
  });
});

// Stream book content
export const getBookContent = catchAsync(async (req, res, next) => {
  const book = await Book.findOne({ 
    _id: req.params.id, 
    isActive: true 
  });

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Check access permissions
  const userRole = req.user.role;
  if (userRole !== 'admin') {
    const hasAccess = book.accessControl.isPublic || 
                     book.accessControl.accessLevel === 'public' ||
                     book.accessControl.allowedRoles.includes(userRole);
    
    if (!hasAccess) {
      return next(new AppError('Access denied to this book', 403));
    }
  }

  try {
    // Construct file path
    const filePath = path.join(process.cwd(), 'uploads', 'books', book.fileInfo.filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new AppError('Book file not found', 404));
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set appropriate headers
    res.set({
      'Content-Type': book.fileInfo.mimeType,
      'Content-Length': stats.size,
      'Content-Disposition': `inline; filename="${book.fileInfo.originalName}"`,
      'Cache-Control': 'private, max-age=3600'
    });

    // Stream the file
    const readStream = fs.createReadStream(filePath);
    
    readStream.on('error', (error) => {
      console.error('File read error:', error);
      if (!res.headersSent) {
        return next(new AppError('Error streaming book content', 500));
      }
    });

    // Increment download count
    book.incrementDownload();

    readStream.pipe(res);
  } catch (error) {
    return next(new AppError('Error accessing book file', 500));
  }
});

// Get readable text content from book
export const getBookText = catchAsync(async (req, res, next) => {
  const book = await Book.findOne({ 
    _id: req.params.id, 
    isActive: true 
  });

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Check access permissions
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    const hasAccess = book.accessControl.isPublic || 
                     book.accessControl.accessLevel === 'public' ||
                     (req.user && book.accessControl.allowedRoles.includes(userRole));
    
    if (!hasAccess) {
      return next(new AppError('Access denied to this book', 403));
    }
  }

  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const wordsPerPage = parseInt(req.query.wordsPerPage) || 500;
    const format = req.query.format || 'html'; // 'text' or 'html'

    console.log(`🔍 Getting book text content for: ${book.title} (page: ${page}, format: ${format})`);

    // Try to get cached content first
    let paginatedContent = await optimizedCache.getPaginatedContent(
      book._id.toString(), 
      page, 
      wordsPerPage, 
      format
    );

    if (!paginatedContent) {
      // Cache miss - extract and cache the content
      console.log(`📥 Cache miss for book ${book.title}, extracting content...`);
      
      try {
        await optimizedCache.cacheBookContent(book, 'high');
        
        // Now get the paginated content
        paginatedContent = await optimizedCache.getPaginatedContent(
          book._id.toString(), 
          page, 
          wordsPerPage, 
          format
        );
      } catch (error) {
        console.error('Content extraction failed:', error);
        return next(new AppError('Failed to extract book content', 500));
      }
    }

    if (!paginatedContent) {
      return next(new AppError('Failed to process book content', 500));
    }

    // Increment view count if first page
    if (page === 1) {
      await book.incrementView();
    }

    // Log cache performance
    const cacheStats = optimizedCache.getCacheStats();
    console.log(`📊 Served page ${page} for ${book.title} (Hit rate: ${cacheStats.performance.hitRate})`);

    res.json({
      success: true,
      data: paginatedContent
    });

  } catch (error) {
    console.error('Error extracting book text:', error);
    return next(new AppError('Error reading book content. This file format may not be supported for text extraction.', 500));
  }
});

// Update book metadata (admin only)
export const updateBook = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(validationError(errors.array()));
  }

  const book = await Book.findById(req.params.id);
  
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  const allowedFields = [
    'title', 'author', 'description', 'language', 'category', 'tags',
    'metadata', 'accessControl'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Set modified info
  updates['uploadInfo.lastModified'] = new Date();
  updates['uploadInfo.modifiedBy'] = req.user.id;

  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('uploadInfo.uploadedBy uploadInfo.modifiedBy', 'username profile.firstName profile.lastName');

  // Clear cache for updated book
  await optimizedCache.clearBookCache(req.params.id);
  console.log(`🗑️ Cache cleared for updated book: ${updatedBook.title}`);

  res.json({
    success: true,
    message: 'Book updated successfully',
    data: {
      book: updatedBook
    }
  });
});

// Delete book (admin only)
export const deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Soft delete - just mark as inactive
  book.isActive = false;
  book.uploadInfo.lastModified = new Date();
  book.uploadInfo.modifiedBy = req.user.id;
  
  await book.save();

  // Clear cache for deleted book
  await optimizedCache.clearBookCache(req.params.id);
  console.log(`🗑️ Cache cleared for deleted book: ${book.title}`);

  // Note: In a real application, you might want to also delete the GridFS file
  // and clean up associated reading progress records

  res.json({
    success: true,
    message: 'Book deleted successfully'
  });
});

// Search books
export const searchBooks = catchAsync(async (req, res, next) => {
  const {
    q: query,
    language,
    category,
    limit = 20,
    page = 1
  } = req.query;

  if (!query) {
    return next(new AppError('Search query is required', 400));
  }

  const filter = {
    $text: { $search: query },
    isActive: true
  };

  if (language) filter.language = language.toLowerCase();
  if (category) filter.category = category;

  // Apply access control
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    filter.$or = [
      { 'accessControl.isPublic': true },
      { 'accessControl.accessLevel': 'public' },
      ...(req.user ? [{ 'accessControl.allowedRoles': userRole }] : [])
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const books = await Book.find(filter)
    .select('title author language category description statistics')
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Book.countDocuments(filter);

  res.json({
    success: true,
    data: {
      books,
      query,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total
      }
    }
  });
});

// Get books by language
export const getBooksByLanguage = catchAsync(async (req, res, next) => {
  const { language } = req.params;
  const { page = 1, limit = 12, category, sort = '-uploadInfo.uploadDate' } = req.query;

  const filter = { 
    language: language.toLowerCase(), 
    isActive: true 
  };
  
  if (category) filter.category = category;

  // Apply access control
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    filter.$or = [
      { 'accessControl.isPublic': true },
      { 'accessControl.accessLevel': 'public' },
      ...(req.user ? [{ 'accessControl.allowedRoles': userRole }] : [])
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const books = await Book.find(filter)
    .populate('uploadInfo.uploadedBy', 'username')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-fileInfo.gridfsId');

  const total = await Book.countDocuments(filter);

  res.json({
    success: true,
    data: {
      books,
      language,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBooks: total
      }
    }
  });
});

// Get books by category
export const getBooksByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 12, language, sort = '-uploadInfo.uploadDate' } = req.query;

  const filter = { category, isActive: true };
  
  if (language) filter.language = language.toLowerCase();

  // Apply access control
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    filter.$or = [
      { 'accessControl.isPublic': true },
      { 'accessControl.accessLevel': 'public' },
      ...(req.user ? [{ 'accessControl.allowedRoles': userRole }] : [])
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const books = await Book.find(filter)
    .populate('uploadInfo.uploadedBy', 'username')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-fileInfo.gridfsId');

  const total = await Book.countDocuments(filter);

  res.json({
    success: true,
    data: {
      books,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBooks: total
      }
    }
  });
});

// Get books by author
export const getBooksByAuthor = catchAsync(async (req, res, next) => {
  const { author } = req.params;
  const { page = 1, limit = 12, language, sort = '-uploadInfo.uploadDate' } = req.query;

  const filter = { 
    author: { $regex: author, $options: 'i' }, 
    isActive: true 
  };
  
  if (language) filter.language = language.toLowerCase();

  // Apply access control
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    filter.$or = [
      { 'accessControl.isPublic': true },
      { 'accessControl.accessLevel': 'public' },
      ...(req.user ? [{ 'accessControl.allowedRoles': userRole }] : [])
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const books = await Book.find(filter)
    .populate('uploadInfo.uploadedBy', 'username')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-fileInfo.gridfsId');

  const total = await Book.countDocuments(filter);

  res.json({
    success: true,
    data: {
      books,
      author,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBooks: total
      }
    }
  });
});

// Helper function to get file extension
function getFileExtension(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
}

// Cache Management Endpoints (Admin only)

// Get cache statistics
export const getCacheStats = catchAsync(async (req, res, next) => {
  const stats = optimizedCache.getCacheStats();
  
  res.json({
    success: true,
    data: {
      cache: stats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  });
});

// Clear cache for specific book
export const clearBookCache = catchAsync(async (req, res, next) => {
  const bookId = req.params.id;
  const cleared = await optimizedCache.clearBookCache(bookId);
  
  res.json({
    success: true,
    message: cleared ? 'Cache cleared successfully' : 'No cache found for this book',
    data: { bookId, cleared }
  });
});

// Clear all cache
export const clearAllCache = catchAsync(async (req, res, next) => {
  await optimizedCache.clearAllCaches();
  
  res.json({
    success: true,
    message: 'All cache cleared successfully'
  });
});

// Preload popular books into cache
export const preloadCache = catchAsync(async (req, res, next) => {
  const { limit = 5 } = req.query;
  
  // Get most popular books
  const popularBooks = await Book.find({ isActive: true })
    .sort({ viewCount: -1 })
    .limit(parseInt(limit))
    .lean();
  
  // Start background preload (don't wait for completion)
  optimizedCache.preloadPopularBooks(popularBooks, parseInt(limit)).catch(error => {
    console.error('Background preload error:', error);
  });
  
  res.json({
    success: true,
    message: `Started preloading ${popularBooks.length} popular books`,
    data: {
      booksToPreload: popularBooks.map(book => ({
        id: book._id,
        title: book.title,
        viewCount: book.viewCount
      }))
    }
  });
});

// Search within a specific book
export const searchInBook = catchAsync(async (req, res, next) => {
  console.log('🔍 Search endpoint called for book:', req.params.id, 'query:', req.query.q);
  
  const book = await Book.findOne({ 
    _id: req.params.id, 
    isActive: true 
  });

  if (!book) {
    console.log('❌ Book not found:', req.params.id);
    return next(new AppError('Book not found', 404));
  }

  // Check access permissions
  const userRole = req.user?.role || 'guest';
  if (userRole !== 'admin') {
    const hasAccess = book.accessControl.isPublic || 
                     book.accessControl.accessLevel === 'public' ||
                     (req.user && book.accessControl.allowedRoles.includes(userRole));
    
    if (!hasAccess) {
      return next(new AppError('Access denied to this book', 403));
    }
  }

  const searchQuery = req.query.q;
  const limit = parseInt(req.query.limit) || 100; // Limit results to 100 by default
  const maxLimit = 500; // Maximum allowed limit
  
  if (!searchQuery || searchQuery.trim() === '') {
    return res.json({
      success: true,
      data: {
        results: [],
        totalMatches: 0,
        query: searchQuery,
        limit: 0,
        hasMore: false
      }
    });
  }

  try {
    console.log(`🔍 Searching in book: ${book.title} for: "${searchQuery}"`);
    
    // Get full book content from optimized cache
    console.log('📖 Attempting to get full book content...');
    const fullContent = await optimizedCache.getFullBookContent(book._id.toString());
    console.log('📄 Full content result:', fullContent ? `${fullContent.length} characters` : 'null/undefined');
    
    if (!fullContent) {
      console.log('❌ Book content not available for search');
      return next(new AppError('Book content not available for search', 404));
    }

    // Perform search across full content
    const results = [];
    const searchTerm = searchQuery.toLowerCase();
    
    // Get the same pagination logic as used by getPaginatedContent API
    const cached = await optimizedCache.getCachedContent(book._id.toString(), 'html');
    if (!cached || !cached.content) {
      console.log('❌ No cached content available for search mapping');
      return next(new AppError('Book content not available for search mapping', 404));
    }
    
    // Use same pagination logic as the API to ensure page numbers match
    const htmlContent = cached.content;
    const paragraphs = htmlContent.split(/<\/p>\s*<p[^>]*>|<\/div>\s*<div[^>]*>/i);
    const avgWordsPerParagraph = 50;
    const wordsPerPage = 500;
    const paragraphsPerPage = Math.max(1, Math.floor(wordsPerPage / avgWordsPerParagraph));
    const totalPages = Math.ceil(paragraphs.length / paragraphsPerPage);
    
    console.log(`🔍 Search pagination info: ${paragraphs.length} paragraphs, ${paragraphsPerPage} per page, ${totalPages} total pages`);
    
    // Search through each page using the same pagination as the API
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const startParagraph = (pageNum - 1) * paragraphsPerPage;
      const endParagraph = Math.min(startParagraph + paragraphsPerPage, paragraphs.length);
      const pageParagraphs = paragraphs.slice(startParagraph, endParagraph);
      const pageContent = pageParagraphs.join(' ');
      const pageContentLower = pageContent.toLowerCase();
      
      let searchIndex = 0;
      while (true) {
        const foundIndex = pageContentLower.indexOf(searchTerm, searchIndex);
        if (foundIndex === -1) break;
        
        // Extract context around the match
        const contextStart = Math.max(0, foundIndex - 150);
        const contextEnd = Math.min(pageContent.length, foundIndex + searchTerm.length + 150);
        
        const beforeContext = pageContent.substring(contextStart, foundIndex);
        const matchText = pageContent.substring(foundIndex, foundIndex + searchTerm.length);
        const afterContext = pageContent.substring(foundIndex + searchTerm.length, contextEnd);
        
        const fullContext = pageContent.substring(contextStart, contextEnd);
        
        // Helper function to clean HTML tags for display
        const cleanHtml = (htmlString) => {
          return htmlString
            .replace(/<[^>]*>/g, '') // Remove all HTML tags
            .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
            .replace(/&amp;/g, '&') // Replace HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
        };
        
        results.push({
          pageNumber: pageNum, // Now matches API pagination
          match: cleanHtml(matchText),
          beforeContext: cleanHtml(beforeContext),
          afterContext: cleanHtml(afterContext),
          context: `${contextStart > 0 ? '...' : ''}${cleanHtml(beforeContext)}${cleanHtml(matchText)}${cleanHtml(afterContext)}${contextEnd < pageContent.length ? '...' : ''}`,
          fullContext: `${contextStart > 0 ? '...' : ''}${cleanHtml(fullContext)}${contextEnd < pageContent.length ? '...' : ''}`
        });
        
        searchIndex = foundIndex + 1;
      }
    }
    
    console.log(`✅ Found ${results.length} total matches for "${searchQuery}" in ${book.title}`);
    
    // Apply limit to results
    const actualLimit = Math.min(limit, maxLimit);
    const limitedResults = results.slice(0, actualLimit);
    const hasMore = results.length > actualLimit;
    
    console.log(`📊 Returning ${limitedResults.length} of ${results.length} matches (limit: ${actualLimit})`);
    
    res.json({
      success: true,
      data: {
        results: limitedResults,
        totalMatches: results.length,
        returnedMatches: limitedResults.length,
        query: searchQuery,
        bookTitle: book.title,
        limit: actualLimit,
        hasMore: hasMore
      }
    });

  } catch (error) {
    console.error('Error searching in book:', error);
    return next(new AppError('Error searching book content', 500));
  }
});