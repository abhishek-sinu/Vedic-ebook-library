export interface Book {
  id: string;
  title: string;
  author?: string;
  filename: string;
  originalName: string;
  uploadDate: string;
  fileSize: string;
  description?: string;
  tags?: string[];
  lastRead?: string;
  currentPage?: number;
  totalPages?: number;
  contentLength?: number;
}

export interface BookMetadata {
  books: Book[];
}

// API functions for file-based storage
export const fetchBooks = async (): Promise<Book[]> => {
  try {
    const response = await fetch('/api/books/list');
    const data = await response.json();
    return data.books || [];
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
};

export const fetchBookContent = async (bookId: string): Promise<{ content: string; metadata: Book } | null> => {
  try {
    console.log('Fetching book content from:', `/api/books/read/${bookId}`);
    const response = await fetch(`/api/books/read/${bookId}`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Failed to fetch book content, status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('Book content fetched successfully, content length:', data.content?.length);
    return data;
  } catch (error) {
    console.error('Error fetching book content:', error);
    return null;
  }
};

export const uploadBook = async (file: File, metadata: { title: string; author?: string; description?: string; tags?: string[] }): Promise<Book | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch('/api/books/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.book;
  } catch (error) {
    console.error('Error uploading book:', error);
    throw error;
  }
};

export const deleteBookFile = async (bookId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/books/delete/${bookId}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting book:', error);
    return false;
  }
};

// Reading progress (stored locally for user-specific data)
export const updateBookProgress = (bookId: string, currentPage: number, totalPages: number): void => {
  if (typeof window !== 'undefined') {
    const progress = { bookId, currentPage, totalPages, lastRead: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('book-progress') || '[]');
    const index = existing.findIndex((p: any) => p.bookId === bookId);
    
    if (index >= 0) {
      existing[index] = progress;
    } else {
      existing.push(progress);
    }
    
    localStorage.setItem('book-progress', JSON.stringify(existing));
  }
};

export const getBookProgress = (bookId: string): { currentPage: number; totalPages: number; lastRead?: string } | null => {
  if (typeof window !== 'undefined') {
    const progress = JSON.parse(localStorage.getItem('book-progress') || '[]');
    return progress.find((p: any) => p.bookId === bookId) || null;
  }
  return null;
};

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};