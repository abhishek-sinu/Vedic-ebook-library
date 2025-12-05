import React from 'react';

interface Book {
  _id: string;
  title: string;
  author?: string;
  language?: string;
  [key: string]: any;
}

interface BookListModalProps {
  open: boolean;
  onClose: () => void;
  books: Book[];
}

type EditableBook = Book & { _editing?: boolean };


import { useState } from 'react';
import { deleteBookFile } from '../lib/bookStorage';

const BookListModal: React.FC<BookListModalProps> = ({ open, onClose, books }) => {
  const [editBooks, setEditBooks] = useState<EditableBook[]>(books.map(b => ({ ...b })));
  const [editIdx, setEditIdx] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Book>>({});


  // Category and language options (sync with FileUpload)
  const bookCategories = [
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
  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'sanskrit', label: 'Sanskrit' }
  ];

  // Sync books prop to local state if modal is reopened
  React.useEffect(() => {
    setEditBooks(books.map(b => ({ ...b })));
    setEditIdx(null);
    setEditValues({});
  }, [books, open]);

  const handleEdit = (id: string) => {
    setEditIdx(id);
    const book = editBooks.find(b => b._id === id);
    setEditValues(book ? { ...book } : {});
  };

  const handleEditChange = (field: keyof Book, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };


  const handleEditSave = async (id: string) => {
    // Call backend API to update book
    try {
      const token = localStorage.getItem('vedic_auth_token') || sessionStorage.getItem('vedic_auth_token');
      const response = await fetch(`http://localhost:5000/api/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editValues)
      });
      if (!response.ok) throw new Error('Failed to update book');
      setEditBooks(prev => prev.map(b => b._id === id ? { ...b, ...editValues } : b));
      setEditIdx(null);
      setEditValues({});
    } catch (err) {
      alert('Failed to update book.');
    }
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditValues({});
  };


  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    const success = await deleteBookFile(id);
    if (success) {
      setEditBooks(prev => prev.filter(b => b._id !== id));
    } else {
      alert('Failed to delete book.');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div
        className="rounded-lg shadow-lg w-full max-w-6xl p-8 relative"
        style={{ background: 'var(--modal-bg)', color: 'var(--modal-text)' }}
      >
        <button
          className="absolute top-4 right-4"
          style={{ color: 'var(--modal-text)' }}
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--modal-text)' }}>All Books</h2>
        <div className="overflow-x-auto">
          <table className="modal-table min-w-[1100px] border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold border-r border-gray-200">Title</th>
                <th className="px-4 py-3 text-left font-semibold border-r border-gray-200">Author</th>
                <th className="px-4 py-3 text-left font-semibold border-r border-gray-200">Language</th>
                <th className="px-4 py-3 text-left font-semibold border-r border-gray-200">Category</th>
                <th className="px-4 py-3 text-left font-semibold border-r border-gray-200">Description</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {editBooks.map((book, idx) => (
                <tr
                  key={book._id}
                  className={
                    `transition-colors border-b border-gray-200 last:border-b-0`
                  }
                >
                  {editIdx === book._id ? (
                    <>
                      <td className="px-4 py-2 border-r border-gray-200">
                        <input
                          className="w-full px-2 py-1 border rounded"
                          value={editValues.title || ''}
                          onChange={e => handleEditChange('title', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200">
                        <input
                          className="w-full px-2 py-1 border rounded"
                          value={editValues.author || ''}
                          onChange={e => handleEditChange('author', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200">
                        <select
                          className="w-full px-2 py-1 border rounded"
                          value={editValues.language || ''}
                          onChange={e => handleEditChange('language', e.target.value)}
                        >
                          <option value="">Select language...</option>
                          {languageOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200">
                        <select
                          className="w-full px-2 py-1 border rounded"
                          value={editValues.category || ''}
                          onChange={e => handleEditChange('category', e.target.value)}
                        >
                          <option value="">Select category...</option>
                          {bookCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 max-w-xs">
                        <input
                          className="w-full px-2 py-1 border rounded"
                          value={editValues.description || ''}
                          onChange={e => handleEditChange('description', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          onClick={() => handleEditSave(book._id)}
                        >Save</button>
                        <button
                          className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                          onClick={handleEditCancel}
                        >Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 border-r border-gray-200">{book.title}</td>
                      <td className="px-4 py-2 border-r border-gray-200">{book.author || '-'}</td>
                      <td className="px-4 py-2 border-r border-gray-200">{book.language || '-'}</td>
                      <td className="px-4 py-2 border-r border-gray-200">{book.category || '-'}</td>
                      <td className="px-4 py-2 max-w-xs truncate" title={book.description}>{book.description || '-'}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => handleEdit(book._id)}
                        >Edit</button>
                        <button
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={() => handleDelete(book._id)}
                        >Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookListModal;
